# EATS Docker Compose deployment

This directory contains a portable deployment configuration for the EATS ingestion service and PostgreSQL. It does not include a dashboard or deployment automation yet.

## Configure

On any Linux host with Docker Engine and Docker Compose, place `compose.yaml` and a populated `.env` in the chosen deployment directory. Start with `.env.example`:

```sh
cp deploy/.env.example deploy/.env
```

Set a strong `POSTGRES_PASSWORD` and `WORKDAY_SOURCES_HOST_PATH` to the **absolute path** of an existing Workday sources JSON file on the host. Never commit `.env` or personal source data.

Both PostgreSQL and ingestion publish on **both** `127.0.0.1` and the specific LAN interface configured with `LAN_IP` (required). Set it to an IPv4 address assigned to the deployment host; do not use `0.0.0.0`. Published ports and the ingestion image tag are configurable. PostgreSQL listens on port 5432 and ingestion on port 8080 inside their containers. Publishing PostgreSQL on the LAN increases its exposure: use a strong password and restrict access to trusted client addresses with network/firewall controls.

These bindings are not an internet-access guarantee. Restrict inbound traffic with appropriate host/network firewall rules, check router port-forwarding and UPnP settings, and verify the service cannot be reached from an external network. Docker-published ports can bypass some UFW rules; account for Docker forwarding rules when enforcing firewall policy.

## Existing deployments

The Compose project name remains `eats`, the volume remains `postgres_data`, and the container names remain unchanged. **Do not change the project name or use `docker compose down -v`** on an existing deployment: doing so risks losing access to persistent PostgreSQL data.

Before adopting the template, copy the existing Compose file and environment configuration to a safe backup. Set the environment variables to reproduce the existing LAN address, ports, sources path, and image tag. The template preserves dual bindings for both services (localhost plus one LAN address).

## Validate

From the repository root:

```sh
docker compose -f deploy/compose.yaml --env-file deploy/.env config --quiet
```

For a copied deployment directory, run `docker compose --env-file .env config --quiet` there. `docker compose config` without `--quiet` prints expanded environment values, including secrets; do not share its output.

## Build and deploy

Build the ingestion image from the repository root:

```sh
docker build -f apps/ingestion/Dockerfile -t eats-ingestion:0.1.22 .
```

Choose a new image tag rather than overwriting a running release. Set `INGESTION_IMAGE_TAG` in the deployment `.env` to the new tag. From the deployment directory:

```sh
docker compose --env-file .env config --quiet
docker compose --env-file .env up -d --no-deps ingestion
docker compose ps
docker compose logs --tail=100 ingestion
```

Check the ingestion health status and review startup migrations before deploying. Back up PostgreSQL before changes that may alter the schema. Avoid recreating PostgreSQL merely to deploy ingestion code.

## Next steps

A follow-up PR can introduce host-independent build and deploy scripts using the script location or supplied paths, image tags, configuration validation, readiness checks, and documented rollback. The optional OTLP endpoint remains disabled until a telemetry receiver is available.
