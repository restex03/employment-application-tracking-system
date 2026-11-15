#!/usr/bin/env bash
set -euo pipefail

# Deploy an existing ingestion image without recreating PostgreSQL.
# The image tag and network settings come from the deployment .env file.

show_usage() {
    echo "Usage: $0 [--env-file /path/to/.env]"
    echo "Default environment file: deploy/.env"
}

fail() {
    echo "Error: $1" >&2
    exit 1
}

# Locate deployment files relative to this script, not the current directory.
script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd "$script_directory/.." && pwd)"
deployment_directory="$repository_root/deploy"
compose_file="$deployment_directory/compose.yaml"
environment_file="$deployment_directory/.env"

# Optionally accept an environment file stored outside the repository.
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
    show_usage
    exit 0
fi

if [[ $# -gt 0 ]]; then
    if [[ $# -ne 2 || "$1" != "--env-file" ]]; then
        show_usage >&2
        exit 2
    fi

    environment_file="$2"
fi

if [[ ! -f "$environment_file" ]]; then
    fail "Environment file not found: $environment_file"
fi

if ! command -v docker >/dev/null 2>&1; then
    fail "Docker is required."
fi

if ! docker compose version >/dev/null 2>&1; then
    fail "Docker Compose v2 is required."
fi

# Store the common Compose arguments once so every command uses the same
# project directory, Compose file, and environment file.
compose_command=(
    docker compose
    --project-directory "$deployment_directory"
    --file "$compose_file"
    --env-file "$environment_file"
)

echo "Validating Docker Compose configuration..."
"${compose_command[@]}" config --quiet

# Read the exact image configured for ingestion without printing secrets.
# Compose may list other images (such as postgres:18).
ingestion_image=""
while IFS= read -r image; do
    if [[ "$image" == eats-ingestion:* ]]; then
        ingestion_image="$image"
        break
    fi
done < <("${compose_command[@]}" config --images)

if [[ -z "$ingestion_image" ]]; then
    fail "Could not determine the ingestion image from Compose."
fi

if ! docker image inspect "$ingestion_image" >/dev/null 2>&1; then
    fail "Image $ingestion_image is not available locally. Build or load it first."
fi

# --no-deps prevents Compose from starting or recreating PostgreSQL.
echo "Deploying $ingestion_image..."
"${compose_command[@]}" up \
    --detach \
    --no-deps \
    --no-build \
    --pull never \
    ingestion

container_id="$("${compose_command[@]}" ps --quiet ingestion)"
if [[ -z "$container_id" ]]; then
    fail "The ingestion container was not found after deployment."
fi

# The ingestion service defines a Docker health check in compose.yaml.
# Wait up to three minutes, checking every two seconds.
maximum_checks=90
check_interval_seconds=2

echo "Waiting for ingestion to become healthy (up to 180 seconds)..."

for ((attempt = 1; attempt <= maximum_checks; attempt++)); do
    health_status="$(docker inspect \
        --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' \
        "$container_id")"

    case "$health_status" in
        healthy)
            echo "Deployment successful: $ingestion_image"
            exit 0
            ;;
        starting|unhealthy)
            sleep "$check_interval_seconds"
            ;;
        *)
            echo "Unexpected container health status: $health_status" >&2
            break
            ;;
    esac
done

echo "Ingestion did not become healthy." >&2
echo "Restore the previous INGESTION_IMAGE_TAG and redeploy to roll back." >&2
"${compose_command[@]}" ps ingestion >&2 || true
"${compose_command[@]}" logs --tail 80 ingestion >&2 || true
exit 1
