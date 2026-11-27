# EATS Docker Compose deployment

This directory contains a portable deployment configuration for the EATS ingestion service and PostgreSQL. GitHub Actions builds and publishes ingestion images; Fred-side deployment automation is maintained in [eats-deploy](https://github.com/restex03/eats-deploy).

## Configure

On any Linux host with Docker Engine and Docker Compose, place `compose.yaml` and a populated `.env` in the chosen deployment directory. Start with `.env.example`:

```sh
cp deploy/.env.example deploy/.env
```

Set a strong `POSTGRES_PASSWORD` and `WORKDAY_SOURCES_HOST_PATH` to the **absolute path** of an existing Workday sources JSON file on the host. Never commit `.env` or personal source data.

Both PostgreSQL and ingestion publish on **both** `127.0.0.1` and the specific LAN interface configured with `LAN_IP` (required). Set it to an IPv4 address assigned to the deployment host; do not use `0.0.0.0`. Published ports and the ingestion image tag are configurable. PostgreSQL listens on port 5432 and ingestion on port 8080 inside their containers. Publishing PostgreSQL on the LAN increases its exposure: use a strong password and restrict access to trusted client addresses with network/firewall controls.

These bindings are not an internet-access guarantee. Restrict inbound traffic with appropriate host/network firewall rules, check router port-forwarding and UPnP settings, and verify the service cannot be reached from an external network. Docker-published ports can bypass some UFW rules; account for Docker forwarding rules when enforcing firewall policy.

## Fedora development

The shared `compose.yaml` is the production baseline. `compose.dev.yaml` changes the project to `eats-dev`, uses the existing development database (`eats`) and named volume (`eats-postgres-data`), sets ASP.NET Core to Development, and publishes **localhost-only** ports. It requires Docker Compose 2.24.4+ for `!override`.

Create a development environment file:

```sh
cp deploy/.env.dev.example deploy/.env
```

Edit `WORKDAY_SOURCES_HOST_PATH` to the absolute path of `apps/web/data/JobSources/workdaySources.json` on Fedora. The development example retains the old local PostgreSQL password. `LAN_IP` is an interpolation placeholder only; the development override removes LAN port publishing.

**One-time migration from `infrastart.sh`:** if the existing `eats-postgres` container is present, stop any running ingestion process, then run `docker rm -f eats-postgres`. This removes the old container but **preserves** `eats-postgres-data`. Do not run `docker volume rm` or `down -v`.

To run only PostgreSQL while developing ingestion with `dotnet run`, use the convenience wrapper (which runs the shared Compose files):

```sh
bash devScripts/infrastart.sh
```

Equivalent direct Compose command:

```sh
docker compose -f deploy/compose.yaml -f deploy/compose.dev.yaml --env-file deploy/.env up -d postgres
```

To run ingestion **inside Docker** instead, build the image matching `INGESTION_IMAGE_TAG` and run:

```sh
bash deployScripts/build-ingestion.sh 0.1.21
docker compose -f deploy/compose.yaml -f deploy/compose.dev.yaml --env-file deploy/.env up -d
```

Do not run the host `.NET` ingestion process and containerized ingestion against the same development database at the same time. To stop the development stack without deleting data, use `docker compose -f deploy/compose.yaml -f deploy/compose.dev.yaml --env-file deploy/.env down` (without `-v`).

**Important:** For local development, use the two-file Compose command above. The development override also changes the database name to `eats`; it does not migrate or alter production data. If you changed your old development password or database, adjust your local environment before starting.

## Existing deployments

The Compose project name remains `eats`, the volume remains `postgres_data`, and the container names remain unchanged. **Do not change the project name or use `docker compose down -v`** on an existing deployment: doing so risks losing access to persistent PostgreSQL data.

Before adopting the template, copy the existing Compose file and environment configuration to a safe backup. Set the environment variables to reproduce the existing LAN address, ports, sources path, and image tag. The template preserves dual bindings for both services (localhost plus one LAN address).

## Validate

From the repository root:

```sh
docker compose -f deploy/compose.yaml --env-file deploy/.env config --quiet
```

For a copied deployment directory, run `docker compose --env-file .env config --quiet` there. `docker compose config` without `--quiet` prints expanded environment values, including secrets; do not share its output.

## Production deployment

GitHub Actions publishes `ghcr.io/restex03/eats-ingestion:main` and a commit-SHA tag after successful application CI on pushes to main. No SSH deployment job or scheduled rebuild is configured. Fred's deployment controller, installation instructions, monitoring and recovery runbook are maintained in [eats-deploy](https://github.com/restex03/eats-deploy).

Keep production `.env` and the existing Compose project and data volume on Fred. Never commit secrets or run `docker compose down -v` against production. Back up PostgreSQL before schema changes; rolling back an image does not undo migrations. Do not modify ingestion or its image tags concurrently with the deployment controller.
