#!/usr/bin/env bash
# Poll GHCR for the latest successful main build and deploy ingestion only.
set -Eeuo pipefail
umask 077

DEPLOY_DIR="${DEPLOY_DIR:-/opt/eats}"
IMAGE="${IMAGE:-ghcr.io/restex03/eats-ingestion:main}"
CONTAINER="${CONTAINER:-eats-ingestion}"
LOCK_FILE="${LOCK_FILE:-/run/lock/eats-ingestion-deploy.lock}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-180}"

exec 9>"$LOCK_FILE"
flock -n 9 || { echo "Deployment already running; skipping"; exit 0; }
cd "$DEPLOY_DIR"
test -f compose.yaml && test -f .env || { echo "Missing compose.yaml or .env" >&2; exit 1; }
# Keep secrets on Fred; do not print expanded Compose config.
docker compose --env-file .env config --quiet
# Require the production Compose file to reference the published main image.
configured_image="$(docker compose --env-file .env config --images | grep -Fx "$IMAGE" || true)"
test -n "$configured_image" || { echo "Configure ingestion image as $IMAGE in .env" >&2; exit 1; }

previous_id="$(docker inspect --format '{{.Image}}' "$CONTAINER" 2>/dev/null || true)"
previous_running="$(docker inspect --format '{{.State.Running}}' "$CONTAINER" 2>/dev/null || true)"
test "$previous_running" = true || { echo "Ingestion not running; refusing unattended first deployment" >&2; exit 1; }

docker pull "$IMAGE"
new_id="$(docker image inspect --format '{{.Id}}' "$IMAGE")"
if [[ "$new_id" == "$previous_id" ]]; then
  echo "Ingestion image unchanged"
  exit 0
fi

# Preserve the exact old image locally for rollback, even if :main moves.
rollback_tag="eats-ingestion:rollback-local"
docker image tag "$previous_id" "$rollback_tag"

rollback() {
  echo "Deployment failed; attempting ingestion-only rollback" >&2
  # Repoint the locally cached main tag to the known previous image.
  docker image tag "$rollback_tag" "$IMAGE"
  docker compose --env-file .env up -d --no-deps --force-recreate ingestion || true
}
trap rollback ERR

docker compose --env-file .env up -d --no-deps --force-recreate ingestion

deadline=$((SECONDS + HEALTH_TIMEOUT))
while (( SECONDS < deadline )); do
  status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$CONTAINER" 2>/dev/null || true)"
  case "$status" in
    healthy)
      trap - ERR
      echo "Ingestion deployment healthy: $new_id"
      exit 0
      ;;
    unhealthy|missing)
      echo "Ingestion health status: $status" >&2
      false
      ;;
  esac
  sleep 5
done
echo "Ingestion failed to become healthy before timeout" >&2
false
