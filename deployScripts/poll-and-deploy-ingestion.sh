#!/usr/bin/env bash
# Fred-initiated CD: deploy only ingestion, quarantine failed images, verify rollback.
set -Eeuo pipefail
umask 077

DEPLOY_DIR="${DEPLOY_DIR:-/opt/eats}"
IMAGE="${IMAGE:-ghcr.io/restex03/eats-ingestion:main}"
CONTAINER="${CONTAINER:-eats-ingestion}"
LOCK_FILE="${LOCK_FILE:-/run/lock/eats-ingestion-deploy.lock}"
STATE_DIR="${STATE_DIR:-/opt/eats/deploy-state}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-180}"
POLL_INTERVAL="${POLL_INTERVAL:-5}"

exec 9>"$LOCK_FILE"
flock -n 9 || { echo "Deployment already running; skipping"; exit 0; }
cd "$DEPLOY_DIR"
test -f compose.yaml && test -f .env || { echo "Missing Compose configuration" >&2; exit 1; }
docker compose --env-file .env config --quiet
docker compose --env-file .env config --images | grep -Fxq "$IMAGE" || {
  echo "Configure the ingestion image as $IMAGE in .env" >&2
  exit 1
}
mkdir -p "$STATE_DIR"
quarantine="$STATE_DIR/failed-image-id"
known_good="$STATE_DIR/last-known-good-image-id"

container_image() {
  docker inspect --format '{{.Image}}' "$CONTAINER" 2>/dev/null
}
container_running() {
  [[ "$(docker inspect --format '{{.State.Running}}' "$CONTAINER" 2>/dev/null || true)" == true ]]
}
wait_healthy() {
  local expected="$1" deadline=$((SECONDS + HEALTH_TIMEOUT)) actual status
  while (( SECONDS < deadline )); do
    actual="$(container_image || true)"
    status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}' "$CONTAINER" 2>/dev/null || true)"
    if [[ "$actual" == "$expected" && "$status" == healthy ]] && container_running; then
      return 0
    fi
    if [[ "$status" == unhealthy || "$status" == missing ]]; then
      echo "Container unhealthy or missing Docker healthcheck: $status" >&2
      return 1
    fi
    sleep "$POLL_INTERVAL"
  done
  echo "Health verification timed out for $expected" >&2
  return 1
}
write_state() {
  local destination="$1" value="$2" temporary
  temporary="$(mktemp "$STATE_DIR/.state.XXXXXXXX")"
  printf '%s\n' "$value" > "$temporary"
  mv -f "$temporary" "$destination"
}

container_running || { echo "Refusing unattended first deployment: ingestion is not running" >&2; exit 1; }
previous_id="$(container_image)"
# Never replace an already unhealthy container without operator intervention.
wait_healthy "$previous_id" || { echo "Current ingestion is unhealthy; refusing deployment" >&2; exit 1; }
write_state "$known_good" "$previous_id"

docker pull "$IMAGE"
candidate_id="$(docker image inspect --format '{{.Id}}' "$IMAGE")"
if [[ "$candidate_id" == "$previous_id" ]]; then
  echo "Ingestion image unchanged: $candidate_id"
  exit 0
fi
if [[ -f "$quarantine" && "$(cat "$quarantine")" == "$candidate_id" ]]; then
  echo "Skipping previously failed image: $candidate_id"
  exit 0
fi

# Retain an immutable image ID via a local tag for rollback; don't depend on :main.
rollback_tag="eats-ingestion:rollback-local"
docker image tag "$previous_id" "$rollback_tag"

rollback() {
  local original_status="$1"
  trap - ERR
  set +e
  echo "Deployment failed (status $original_status); quarantining $candidate_id" >&2
  write_state "$quarantine" "$candidate_id"
  local quarantine_status=$?
  docker image tag "$rollback_tag" "$IMAGE"
  local tag_status=$?
  if (( tag_status == 0 )); then
    docker compose --env-file .env up -d --no-deps --pull never --force-recreate ingestion
    local compose_status=$?
    if (( compose_status == 0 )) && wait_healthy "$previous_id"; then
      echo "Rollback verified healthy: $previous_id" >&2
    else
      echo "CRITICAL: rollback failed or restored container is unhealthy" >&2
    fi
  else
    echo "CRITICAL: failed to restore previous image tag" >&2
  fi
  if (( quarantine_status != 0 )); then
    echo "CRITICAL: failed to persist quarantine state; disable timer until resolved" >&2
  fi
  exit "$original_status"
}
trap 'rollback "$?"' ERR

docker compose --env-file .env up -d --no-deps --pull never --force-recreate ingestion
wait_healthy "$candidate_id"
trap - ERR
write_state "$known_good" "$candidate_id"
# A newer image supersedes the failed image. It is safe to clear quarantine.
rm -f "$quarantine"
echo "Ingestion deployment verified healthy: $candidate_id"
