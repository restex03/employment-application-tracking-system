# Fred-side deployment orchestration. Run through the systemd service.
const IMAGE = "ghcr.io/restex03/eats-ingestion:main"
const CONTAINER = "eats-ingestion"
const ROLLBACK = "eats-ingestion:rollback-local"

def docker [args: list<string>] {
    let result = (^docker ...$args | complete)
    if $result.exit_code != 0 {
        error make {msg: $"docker ($args | first) exited ($result.exit_code): ($result.stderr | str trim)"}
    }
    $result.stdout | str trim
}

def healthy-image [run: closure] {
    let current = (do $run ["inspect" $CONTAINER] | from json | first)
    if ($current.State.Running != true) or ($current.State.Health.Status? != "healthy") {
        error make {msg: "Ingestion is not healthy; operator intervention required"}
    }
    $current.Image
}

def deploy-image [run: closure, expected: string] {
    do $run [
        "compose" "--env-file" ".env" "up" "-d" "--no-deps"
        "--pull" "never" "--force-recreate" "--wait" "--wait-timeout" "180" "ingestion"
    ] | ignore
    if (healthy-image $run) != $expected {
        error make {msg: "Unexpected running image"}
    }
}

export def deploy-once [failed_file: path, run: closure] {
    let config = (do $run ["compose" "--env-file" ".env" "config" "--format" "json"] | from json)
    let ingestion = $config.services.ingestion
    if ($ingestion.image != $IMAGE) or ($ingestion.container_name? != $CONTAINER) {
        error make {msg: "Unexpected Compose ingestion image or container name"}
    }

    let previous = (healthy-image $run)
    mkdir ($failed_file | path dirname)
    let failed = if ($failed_file | path exists) {
        open --raw $failed_file | str trim
    } else { null }

    do $run ["pull" $IMAGE] | ignore
    let candidate = (do $run ["image" "inspect" "--format" "{{.Id}}" $IMAGE])
    if $candidate == $previous {
        print --stderr $"INFO Image unchanged: ($candidate)"
        return "unchanged"
    }
    if $candidate == $failed {
        print --stderr $"WARN Skipping quarantined image: ($candidate)"
        return "quarantined"
    }

    do $run ["image" "tag" $previous $ROLLBACK] | ignore
    print --stderr $"INFO Deploying ($candidate); previous: ($previous)"
    try {
        deploy-image $run $candidate
    } catch {|err|
        print --stderr $"ERROR Deployment failed: ($err.msg)"
        try {
            let temporary = $"($failed_file).tmp"
            $candidate | save --raw --force $temporary
            mv --force $temporary $failed_file
        } catch {|write_err|
            print --stderr $"ERROR Could not persist quarantine: ($write_err.msg)"
        }
        # Always attempt rollback, even if quarantine persistence failed.
        try {
            do $run ["image" "tag" $ROLLBACK $IMAGE] | ignore
            deploy-image $run $previous
        } catch {|rollback_err|
            print --stderr $"CRITICAL Rollback failed: ($rollback_err.msg)"
            error make {msg: "Deployment and rollback failed"}
        }
        print --stderr $"INFO Rollback verified healthy: ($previous)"
        error make {msg: "Deployment failed; rollback succeeded"}
    }
    print --stderr $"INFO Deployment verified healthy: ($candidate)"
    "deployed"
}

def main [] {
    deploy-once "deploy-state/failed-image-id" {|args| docker $args } | ignore
}
