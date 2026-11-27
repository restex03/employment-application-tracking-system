// Fred-side deployment orchestration. Run only through the systemd service.
import { $ } from "bun";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const IMAGE = "ghcr.io/restex03/eats-ingestion:main";
const CONTAINER = "eats-ingestion";
const ROLLBACK = "eats-ingestion:rollback-local";
const FAILED = "deploy-state/failed-image-id";

type RunDocker = (...args: string[]) => Promise<string>;
type Outcome = "unchanged" | "quarantined" | "deployed";

const docker: RunDocker = async (...args) => {
    const result = await $`docker ${args}`.quiet().nothrow();
    if (result.exitCode !== 0) {
        // Resolved Compose configuration may contain secrets. Never log its output.
        const detail = args.includes("config") ? "" : result.stderr.toString().trim();
        throw new Error(`docker ${args[0]} exited ${result.exitCode}${detail ? ": " + detail : ""}`);
    }
    return result.stdout.toString().trim();
};

export async function deployOnce(run: RunDocker = docker, failedFile = FAILED): Promise<Outcome> {
    const compose = (...args: string[]) => run("compose", "--env-file", ".env", ...args);

    async function healthyImage(): Promise<string> {
        const [container] = JSON.parse(await run("inspect", CONTAINER));
        if (!container?.State?.Running || container.State.Health?.Status !== "healthy"
            || typeof container.Image !== "string" || !container.Image) {
            throw new Error("Ingestion is not healthy; operator intervention required");
        }
        return container.Image;
    }

    async function deploy(expected: string) {
        await compose("up", "-d", "--no-deps", "--pull", "never", "--force-recreate",
            "--wait", "--wait-timeout", "180", "ingestion");
        if (await healthyImage() !== expected) throw new Error("Unexpected running image");
    }

    const config = JSON.parse(await compose("config", "--format", "json"));
    const ingestion = config.services?.ingestion;
    if (ingestion?.image !== IMAGE || ingestion.container_name !== CONTAINER) {
        throw new Error("Unexpected Compose ingestion image or container name");
    }

    const previous = await healthyImage();
    await mkdir(dirname(failedFile), { recursive: true, mode: 0o700 });
    let failed: string | undefined;
    try {
        failed = (await readFile(failedFile, "utf8")).trim();
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }

    await run("pull", IMAGE);
    const candidate = await run("image", "inspect", "--format", "{{.Id}}", IMAGE);
    if (candidate === previous) {
        console.log("Image unchanged:", candidate);
        return "unchanged";
    }
    if (candidate === failed) {
        console.warn("Skipping quarantined image:", candidate);
        return "quarantined";
    }

    await run("image", "tag", previous, ROLLBACK);
    console.log("Deploying", candidate, "previous:", previous);
    try {
        await deploy(candidate);
    } catch (error) {
        console.error("Deployment failed:", error);
        try {
            await writeFile(failedFile + ".tmp", candidate + "\n", { mode: 0o600 });
            await rename(failedFile + ".tmp", failedFile);
        } catch (writeError) {
            console.error("Could not persist quarantine:", writeError);
        }

        // A quarantine write failure must never prevent rollback.
        try {
            await run("image", "tag", ROLLBACK, IMAGE);
            await deploy(previous);
        } catch (rollbackError) {
            console.error("CRITICAL: Rollback failed:", rollbackError);
            throw new Error("Deployment and rollback failed", { cause: rollbackError });
        }
        console.log("Rollback verified healthy:", previous);
        throw new Error("Deployment failed; rollback succeeded", { cause: error });
    }

    console.log("Deployment verified healthy:", candidate);
    return "deployed";
}

if (import.meta.main) {
    try {
        await deployOnce();
    } catch (error) {
        console.error(error);
        process.exitCode = 1;
    }
}
