#!/usr/bin/env bash
set -Eeuo pipefail

usage() {
  echo "Usage: $0 [--env-file /absolute/path/to/.env]"
  echo "Deploy the image selected by INGESTION_IMAGE_TAG (default: 0.1.21)."
}
script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd -- "$script_dir/.." && pwd)"
compose_file="$repo_root/deploy/compose.yaml"
env_file="$repo_root/deploy/.env"
if [[ ${1:-} == "--help" || ${1:-} == "-h" ]]; then usage; exit 0; fi
if [[ $# -gt 0 ]]; then
  if [[ $# -ne 2 || $1 != "--env-file" ]]; then usage >&2; exit 2; fi
  env_file="$2"
fi
[[ -f "$env_file" ]] || { echo "Missing environment file: $env_file" >&2; exit 1; }
command -v docker >/dev/null || { echo "Docker is required" >&2; exit 1; }
docker compose version >/dev/null || { echo "Docker Compose v2 is required" >&2; exit 1; }
compose=(docker compose --project-directory "$repo_root/deploy" -f "$compose_file" --env-file "$env_file")
echo "Validating Compose configuration..."
"${compose[@]}" config --quiet
image="$( "${compose[@]}" config --images | grep '^eats-ingestion:' | head -n 1 )"
[[ -n "$image" ]] || { echo "Cannot resolve ingestion image" >&2; exit 1; }
docker image inspect "$image" >/dev/null 2>&1 || {
  echo "Image $image is not available locally. Build or load it before deploying." >&2
  exit 1
}
echo "Deploying $image (PostgreSQL will not be recreated)..."
"${compose[@]}" up -d --no-deps --no-build --pull never ingestion
container_id="$( "${compose[@]}" ps -q ingestion )"
[[ -n "$container_id" ]] || { echo "Ingestion container not found" >&2; exit 1; }
echo "Waiting up to 180 seconds for ingestion health..."
for ((i=0; i<90; i++)); do
  status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$container_id")"
  if [[ "$status" == "healthy" ]]; then echo "Deployment healthy: $image"; exit 0; fi
  if [[ "$status" == "unhealthy" || "$status" == "starting" ]]; then sleep 2; continue; fi
  echo "Unexpected health status: $status" >&2
  break
done
echo "Deployment did not become healthy; restore the prior INGESTION_IMAGE_TAG to roll back." >&2
"${compose[@]}" ps ingestion >&2 || true
"${compose[@]}" logs --tail=80 ingestion >&2 || true
exit 1
