# EATS ingestion build and deploy scripts

Run on a Linux host with Docker Engine, Docker Compose v2, and Bash. Paths are resolved relative to the repository.

## Build

```bash
bash scripts/build-ingestion.sh 0.1.22
```

Builds `eats-ingestion:0.1.22` from the repository root. Choose a new image tag per release.

## Deploy

Create `deploy/.env` using `deploy/.env.example`. Set `POSTGRES_PASSWORD`, `WORKDAY_SOURCES_HOST_PATH`, `LAN_IP`, and `INGESTION_IMAGE_TAG=0.1.22`.

```bash
bash scripts/deploy-ingestion.sh
# Or:
bash scripts/deploy-ingestion.sh --env-file /path/to/deployment.env
```

The script validates Compose, checks the local image, recreates only ingestion if necessary, and waits up to 180 seconds for its health check. It never removes volumes or recreates PostgreSQL. The image must exist in the deployment Docker image store; no registry or SSH distribution is assumed.

## Rollback

Keep the previous image available. Restore the previous `INGESTION_IMAGE_TAG` and rerun deployment. This does not undo database migrations; back up PostgreSQL and review schema compatibility before deploying schema changes.

## Security

Both services bind to localhost and `LAN_IP`. Verify firewall and router settings, particularly for PostgreSQL; Docker port publishing can bypass ordinary UFW input rules. Scripts do not enforce network isolation.

CI validates Compose with dummy values, without launching containers.
