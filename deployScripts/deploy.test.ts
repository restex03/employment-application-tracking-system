import { afterEach, beforeEach, expect, mock, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { deployOnce } from "./deploy";

const IMAGE = "ghcr.io/restex03/eats-ingestion:main";
const CONTAINER = "eats-ingestion";
const ROLLBACK = "eats-ingestion:rollback-local";
const CONFIG = ["compose", "--env-file", ".env", "config", "--format", "json"];
const INSPECT = ["inspect", CONTAINER];
const PULL = ["pull", IMAGE];
const CANDIDATE = ["image", "inspect", "--format", "{{.Id}}", IMAGE];
const PRESERVE = ["image", "tag", "old", ROLLBACK];
const RESTORE = ["image", "tag", ROLLBACK, IMAGE];
const UP = ["compose", "--env-file", ".env", "up", "-d", "--no-deps",
    "--pull", "never", "--force-recreate", "--wait", "--wait-timeout", "180", "ingestion"];

type Reply = [string[], string | Error];
const reply = (args: string[], output: string | Error = ""): Reply => [args, output];
const config = (image = IMAGE, name = CONTAINER) =>
    JSON.stringify({ services: { ingestion: { image, container_name: name } } });
const container = (image: string, status = "healthy") =>
    JSON.stringify([{ Image: image, State: { Running: true, Health: { Status: status } } }]);
const baseline = (candidate = "new") => [
    reply(CONFIG, config()), reply(INSPECT, container("old")),
    reply(PULL), reply(CANDIDATE, candidate),
];
const success = [reply(PRESERVE), reply(UP), reply(INSPECT, container("new"))];
const failure = [reply(PRESERVE), reply(UP, new Error("unhealthy"))];
const rollback = [reply(RESTORE), reply(UP), reply(INSPECT, container("old"))];

let directory: string;
let failedFile: string;
beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), "eats-deploy-"));
    failedFile = join(directory, "failed-image-id");
});
afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
});

// Script command results; never emulate Docker health polling or container internals.
function commands(steps: Reply[]) {
    const remaining = [...steps];
    const run = mock(async (...args: string[]) => {
        const next = remaining.shift();
        if (!next) throw new Error("Unexpected Docker call: " + args.join(" "));
        const [expected, output] = next;
        expect(args).toEqual(expected);
        if (output instanceof Error) throw output;
        return output;
    });
    return {
        execute: () => deployOnce(run, failedFile),
        verify: () => {
            expect(run.mock.calls).toEqual(steps.map(([args]) => args));
            expect(remaining).toHaveLength(0);
        },
    };
}

test("successful deployment", async () => {
    const c = commands([...baseline(), ...success]);
    expect(await c.execute()).toBe("deployed");
    c.verify();
    expect(await Bun.file(failedFile).exists()).toBe(false);
});

test("unchanged image skips recreation", async () => {
    const c = commands(baseline("old"));
    expect(await c.execute()).toBe("unchanged");
    c.verify();
});

test("failed candidate rolls back and persists quarantine", async () => {
    const c = commands([...baseline(), ...failure, ...rollback]);
    await expect(c.execute()).rejects.toThrow("Deployment failed; rollback succeeded");
    c.verify();
    expect((await readFile(failedFile, "utf8")).trim()).toBe("new");
});

test("quarantined image is skipped on a later check", async () => {
    await writeFile(failedFile, "new\n");
    const c = commands(baseline());
    expect(await c.execute()).toBe("quarantined");
    c.verify();
});

test("different candidate may deploy", async () => {
    await writeFile(failedFile, "bad\n");
    const c = commands([...baseline(), ...success]);
    expect(await c.execute()).toBe("deployed");
    c.verify();
    expect((await readFile(failedFile, "utf8")).trim()).toBe("bad");
});

test("failed rollback is reported", async () => {
    const c = commands([...baseline(), ...failure, reply(RESTORE), reply(UP),
        reply(INSPECT, container("old", "unhealthy"))]);
    await expect(c.execute()).rejects.toThrow("Deployment and rollback failed");
    c.verify();
    expect((await readFile(failedFile, "utf8")).trim()).toBe("new");
});

test("quarantine write failure does not prevent rollback", async () => {
    await mkdir(failedFile + ".tmp");
    const c = commands([...baseline(), ...failure, ...rollback]);
    await expect(c.execute()).rejects.toThrow("Deployment failed; rollback succeeded");
    c.verify();
    expect(await Bun.file(failedFile).exists()).toBe(false);
});

test("unhealthy existing container blocks deployment", async () => {
    const c = commands([reply(CONFIG, config()), reply(INSPECT, container("old", "unhealthy"))]);
    await expect(c.execute()).rejects.toThrow("Ingestion is not healthy");
    c.verify();
});

test("invalid Compose image blocks deployment", async () => {
    const c = commands([reply(CONFIG, config("wrong"))]);
    await expect(c.execute()).rejects.toThrow("Unexpected Compose");
    c.verify();
});

test("invalid Compose container name blocks deployment", async () => {
    const c = commands([reply(CONFIG, config(IMAGE, "wrong"))]);
    await expect(c.execute()).rejects.toThrow("Unexpected Compose");
    c.verify();
});

test("pull failure leaves running container untouched", async () => {
    const c = commands([reply(CONFIG, config()), reply(INSPECT, container("old")),
        reply(PULL, new Error("pull failed"))]);
    await expect(c.execute()).rejects.toThrow("pull failed");
    c.verify();
});

test("unexpected running image triggers rollback", async () => {
    const c = commands([...baseline(), reply(PRESERVE), reply(UP),
        reply(INSPECT, container("unexpected")), ...rollback]);
    await expect(c.execute()).rejects.toThrow("Deployment failed; rollback succeeded");
    c.verify();
});
