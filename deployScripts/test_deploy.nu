# Test deployment decisions at the Docker command boundary.
use std/assert
use deploy.nu deploy-once

const IMAGE = "ghcr.io/restex03/eats-ingestion:main"
const CONTAINER = "eats-ingestion"
const ROLLBACK = "eats-ingestion:rollback-local"
const CONFIG = ["compose" "--env-file" ".env" "config" "--format" "json"]
const INSPECT = ["inspect" $CONTAINER]
const PULL = ["pull" $IMAGE]
const CANDIDATE = ["image" "inspect" "--format" "{{.Id}}" $IMAGE]
const PRESERVE = ["image" "tag" "old" $ROLLBACK]
const RESTORE = ["image" "tag" $ROLLBACK $IMAGE]
const UP = [
    "compose" "--env-file" ".env" "up" "-d" "--no-deps"
    "--pull" "never" "--force-recreate" "--wait" "--wait-timeout" "180" "ingestion"
]

def reply [args: list<string>, output: string = ""] {
    {args: $args, output: $output, error: null}
}

def failure [args: list<string>, message: string] {
    {args: $args, output: "", error: $message}
}

def configuration [image: string = $IMAGE] {
    {services: {ingestion: {image: $image, container_name: $CONTAINER}}} | to json
}

def container [image: string, status: string = "healthy"] {
    [{Image: $image, State: {Running: true, Health: {Status: $status}}}] | to json
}

def baseline [candidate: string = "new"] {
    [
        (reply $CONFIG (configuration))
        (reply $INSPECT (container "old"))
        (reply $PULL)
        (reply $CANDIDATE $candidate)
    ]
}

# A queue of scripted replies, not a simulation of Docker internals.
# Assert every command and ensure there are no unconsumed replies.
def run-case [
    name: string, steps: list, expected: string,
    --fails, --initial: string, --quarantined: string, --write-fails
] {
    let directory = (mktemp -d)
    let queue = ($directory | path join "replies.json")
    let failed = ($directory | path join "failed-image-id")
    try {
        $steps | to json | save --raw $queue
        if $initial != null { $initial | save --raw $failed }
        if $write_fails { mkdir $"($failed).tmp" }
        let run = {|args|
            let remaining = (open $queue)
            let next = ($remaining | first)
            assert equal $args $next.args
            $remaining | skip 1 | to json | save --raw --force $queue
            if $next.error != null { error make {msg: $next.error} }
            $next.output
        }
        if $fails {
            let message = (try {
                deploy-once $failed $run | ignore
                "unexpected success"
            } catch {|err| $err.msg })
            assert equal $message $expected
        } else {
            assert equal (deploy-once $failed $run) $expected
        }
        assert equal (open $queue | length) 0
        let saved = if ($failed | path exists) { open --raw $failed | str trim } else { null }
        assert equal $saved $quarantined
        print $"PASS ($name)"
    } finally {
        rm --recursive --force $directory
    }
}

def main [] {
    let success = [(reply $PRESERVE) (reply $UP) (reply $INSPECT (container "new"))]
    let failed = [(reply $PRESERVE) (failure $UP "unhealthy")]
    let rollback = [(reply $RESTORE) (reply $UP) (reply $INSPECT (container "old"))]

    run-case "success" ((baseline) ++ $success) "deployed"
    run-case "unchanged image" (baseline "old") "unchanged"
    run-case "failed candidate rolls back and persists quarantine" ((baseline) ++ $failed ++ $rollback) "Deployment failed; rollback succeeded" --fails --quarantined "new"
    run-case "quarantined image skipped" (baseline) "quarantined" --initial "new" --quarantined "new"
    run-case "different image allowed" ((baseline) ++ $success) "deployed" --initial "bad" --quarantined "bad"
    run-case "failed rollback" ((baseline) ++ $failed ++ [(reply $RESTORE) (reply $UP) (reply $INSPECT (container "old" "unhealthy"))]) "Deployment and rollback failed" --fails --quarantined "new"
    run-case "quarantine write failure still rolls back" ((baseline) ++ $failed ++ $rollback) "Deployment failed; rollback succeeded" --fails --write-fails
    run-case "unhealthy existing container" [(reply $CONFIG (configuration)) (reply $INSPECT (container "old" "unhealthy"))] "Ingestion is not healthy; operator intervention required" --fails
    run-case "invalid Compose image" [(reply $CONFIG (configuration "wrong"))] "Unexpected Compose ingestion image or container name" --fails
    run-case "pull failure" [(reply $CONFIG (configuration)) (reply $INSPECT (container "old")) (failure $PULL "pull failed")] "pull failed" --fails
    run-case "unexpected running image triggers rollback" ((baseline) ++ [(reply $PRESERVE) (reply $UP) (reply $INSPECT (container "unexpected"))] ++ $rollback) "Deployment failed; rollback succeeded" --fails
}
