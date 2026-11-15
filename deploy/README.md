# EATS deployment (fred)

This directory versions the existing Docker Compose deployment running at `/opt/eats` on the Ubuntu mini PC. This initial change **does not** introduce Aspire, change the running deployment, or build a new image.

## Files

- `compose.yaml`: current production services and settings (PostgreSQL 18 and ingestion image `eats-ingestion:0.1.21`).
- `.env.example`: template for the untracked Compose environment file.

## First-time setup

On fred, keep the deployment directory at `/opt/eats` and the Workday sources file at `/opt/eats/config/workdaySources.json`. Create a local `/opt/eats/.env` with a strong `POSTGRES_PASSWORD` value; never commit that file.

The Compose file deliberately retains the existing project name `eats`, named volume `postgres_data`, container names, host address `192.168.1.128`, and image tag to avoid unintended deployment changes. **Do not change the project name or run `docker compose down -v`**: the named PostgreSQL volume contains persistent job data.

## Validate before deploying

From the repository root, with a populated local `deploy/.env`:

```sh
docker compose -f deploy/compose.yaml --env-file deploy/.env config --quiet
```

On fred, back up the existing Compose file, then copy the reviewed `deploy/compose.yaml` to `/opt/eats/compose.yaml`. Run:

```sh
cd /opt/eats
docker compose --env-file .env config --quiet
docker compose ps
```

Review `docker compose config` carefully: it expands secrets, so **do not paste or publish its output**. Avoid running `docker compose up -d` merely to adopt this documentation-only change; no runtime change is required.

## Building an ingestion image

Build from the **repository root** because the Dockerfile uses the repository as its build context:

```sh
docker build -f apps/ingestion/Dockerfile -t eats-ingestion:0.1.21 .
```

The version tag shown here matches the current Compose file; don't overwrite an existing production tag casually. When deploying new application code, choose a new tag, update Compose, validate, and intentionally recreate only the ingestion service:

```sh
cd /opt/eats
docker compose --env-file .env up -d --no-deps ingestion
docker compose ps
docker compose logs --tail=100 ingestion
```

The service's readiness probe is `/health/ready`. Confirm its status after deployment. Before deploying a new ingestion image, review any startup database migrations and ensure you have a database backup.

## Notes

- `/opt/eats/config/workdaySources.json` is a host-specific bind mount; it is not stored in Git.
- `192.168.1.128` is the current host's LAN address, not a portable default.
- PostgreSQL is published on the LAN; restrict access with firewall rules. Consider removing that published port if external database access is unnecessary.
- The optional OTLP endpoint is intentionally commented out until an observability receiver is deployed.
- A future PR can add an explicit build/deploy script with validation, tagging, and rollback instructions.
