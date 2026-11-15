#!/usr/bin/env bash
set -euo pipefail

# Executed over SSH by the trusted main-branch deployment job.
commit_sha="${1:?Usage: bash deploy-from-ci.sh <40-character-commit-sha>}"
if [[ ! "$commit_sha" =~ ^[0-9a-f]{40}$ ]]; then
  echo "Invalid commit SHA" >&2
  exit 2
fi

deployment_root="/opt/eats"
env_file="$deployment_root/.env"
compose_file="$deployment_root/compose.yaml"
[[ -f "$env_file" && -f "$compose_file" ]] || {
  echo "Expected $env_file and $compose_file on fred" >&2
  exit 1
}

# A single deployment at a time, including manual deployments using this entrypoint.
exec 9>"$deployment_root/.deployment.lock"
flock -x 9

# Preserve production configuration, changing only the image selector.
previous_repository="$(grep -m1 '^INGESTION_IMAGE_REPOSITORY=' "$env_file" | cut -d= -f2- || true)"
previous_tag="$(grep -m1 '^INGESTION_IMAGE_TAG=' "$env_file" | cut -d= -f2- || true)"
previous_repository="${previous_repository:-eats-ingestion}"
previous_tag="${previous_tag:-0.1.21}"
new_repository="ghcr.io/restex03/eats-ingestion"
new_tag="sha-$commit_sha"

set_env_value() {
  local key="$1" value="$2"
  local temp
  temp="$(mktemp "$deployment_root/.env.XXXXXXXX")"
  awk -v key="$key" -v value="$value" '
    BEGIN { found=0 }
    index($0, key "=")==1 { if (!found) print key "=" value; found=1; next }
    { print }
    END { if (!found) print key "=" value }
  ' "$env_file" > "$temp"
  chmod --reference="$env_file" "$temp"
  # /opt/eats is setgid to the shared eats group; no root-only chown.
  mv "$temp" "$env_file"
}

rollback() {
  echo "Deployment failed. Restoring previous image selector..." >&2
  trap - ERR
  set_env_value INGESTION_IMAGE_REPOSITORY "$previous_repository" || true
  set_env_value INGESTION_IMAGE_TAG "$previous_tag" || true
  docker compose --project-directory "$deployment_root" --file "$compose_file" --env-file "$env_file" up -d --no-deps --no-build --pull never ingestion || echo "Rollback failed; manual recovery required" >&2
}
trap rollback ERR

set_env_value INGESTION_IMAGE_REPOSITORY "$new_repository"
set_env_value INGESTION_IMAGE_TAG "$new_tag"

docker compose --project-directory "$deployment_root" --file "$compose_file" --env-file "$env_file" config --quiet

# The host's Compose file is managed separately from this repository. A hardcoded
# image would otherwise leave the old healthy container running and falsely pass.
expected_image="$new_repository:$new_tag"
resolved_images="$(docker compose --project-directory "$deployment_root" --file "$compose_file" --env-file "$env_file" config --images)"
if ! grep -Fxq -- "$expected_image" <<< "$resolved_images"; then
  echo "Compose does not resolve to expected ingestion image: $expected_image" >&2
  echo "Check the ingestion image declaration in $compose_file" >&2
  false
fi

docker pull "$expected_image"
docker compose --project-directory "$deployment_root" --file "$compose_file" --env-file "$env_file" up -d --no-deps --no-build --pull never ingestion

container_id="$(docker compose --project-directory "$deployment_root" --file "$compose_file" --env-file "$env_file" ps -q ingestion)"
[[ -n "$container_id" ]] || { echo "Ingestion container missing" >&2; false; }
for ((i=0; i<90; i++)); do
  # Check the actual container, not just its health or the requested Compose tag.
  running_image="$(docker inspect --format '{{.Config.Image}}' "$container_id")"
  if [[ "$running_image" != "$expected_image" ]]; then
    echo "Wrong running ingestion image: $running_image (expected $expected_image)" >&2
    false
  fi
  status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$container_id")"
  if [[ "$status" == healthy ]]; then
    trap - ERR
    echo "Deployed $new_repository:$new_tag"
    exit 0
  fi
  [[ "$status" == starting || "$status" == unhealthy ]] || { echo "Unexpected health: $status" >&2; false; }
  sleep 2
done
echo "Health check timed out" >&2
false
