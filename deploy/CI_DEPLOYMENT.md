# Fred-initiated continuous deployment

GitHub Actions runs .NET, NestJS and Compose checks, then publishes the ingestion image to GHCR **only after all checks pass**. Fred polls `ghcr.io/restex03/eats-ingestion:main` every five minutes using a native systemd timer. No GitHub-hosted deployment job, Tailscale OAuth credentials, SSH keys or inbound connection to Fred are required.

## Install on Fred (one-time, manual)

1. Verify `/opt/eats/compose.yaml`, `/opt/eats/.env` and the running `eats-ingestion` container. The polling script intentionally refuses a first deployment if ingestion is not already running.
2. Copy `deployScripts/poll-and-deploy-ingestion.sh` to `/opt/eats/poll-and-deploy-ingestion.sh`. Install `deploy/systemd/eats-ingestion-deploy.service` and `deploy/systemd/eats-ingestion-deploy.timer` into `/etc/systemd/system/`. Review the files before installation. Ensure `eats-deploy` can execute Docker and read the deployment directory; Docker group membership is effectively root-level privilege. The script is executed by Bash, so executable mode is not required.
3. Set `INGESTION_IMAGE_REPOSITORY=ghcr.io/restex03/eats-ingestion` and `INGESTION_IMAGE_TAG=main` in Fred's **local** `/opt/eats/.env`. Do not commit this file. The Compose project, PostgreSQL service and named volume must remain unchanged.
4. Confirm `eats-deploy` can `docker pull ghcr.io/restex03/eats-ingestion:main` (public package needs no registry secret). Run `bash /opt/eats/poll-and-deploy-ingestion.sh` once manually and verify readiness.
5. Enable the timer with `sudo systemctl daemon-reload && sudo systemctl enable --now eats-ingestion-deploy.timer`. Inspect `systemctl list-timers eats-ingestion-deploy.timer` and `journalctl -u eats-ingestion-deploy.service -n 100 --no-pager`.

## Security and operational boundaries

- All GitHub Actions used by CI are pinned to full commit SHAs. No deployment secrets are exposed to GitHub.
- `:main` is a **mutable image tag**, and is only updated by the successful publish job. Protect `main` with required CI checks and PR reviews. GitHub administrators or anyone able to publish/overwrite the GHCR tag are still in the deployment trust boundary.
- Fred pulls the image and compares its image ID to the running container. It recreates **only ingestion** and waits for Docker's health check. On failure, it records the failed image ID under `/opt/eats/deploy-state/failed-image-id`, restores the exact previous image, and waits for the restored container to become healthy. Subsequent polls skip that failed image until GHCR publishes a different image. It does not undo database migrations or external side effects.
- The script never copies Compose or secrets from GitHub. Configuration changes must be installed on Fred separately. Do not run `docker compose down -v`.
- Deployments occur after successful `main` pushes, subject to the polling interval. There are no scheduled GitHub Actions rebuilds.
- Keep `/opt/eats/deploy-state/` writable by `eats-deploy` and persistent across restarts. A failed rollback is logged as `CRITICAL` and the systemd job exits nonzero; investigate immediately. An unhealthy current container blocks further unattended deployments. Image-ID quarantine is not a substitute for image signing or provenance verification.\n- No script or timer is installed on Fred by this PR. The first deployment and validation are manual.

## Failed deployments and recovery

The deploy script records the last-known-good image ID and a failed image ID under `/opt/eats/deploy-state/`. The deployment service returns a failure when a candidate fails, even if rollback succeeds, so `journalctl -u eats-ingestion-deploy.service` shows the incident. If rollback fails, inspect the service logs and repair the container manually; a Bash script cannot guarantee recovery from host, Docker, storage, or application failures. The image quarantine persists across timer runs, and a different published image can be deployed without clearing it manually. The script requires a functioning Docker HEALTHCHECK for ingestion. Do not delete the state directory or run image pruning against the last-known-good image without understanding the consequences.
