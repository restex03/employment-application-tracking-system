# EATS Docker Compose deployment

This directory contains a portable deployment configuration for the EATS ingestion service and PostgreSQL. It includes a main-branch deployment workflow; automatic deployment requires the one-time setup below.

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

**Important:** `deployScripts/deploy-ingestion.sh` currently uses the production Compose file only. For local development, use the two-file Compose command above. The development override also changes the database name to `eats`; it does not migrate or alter production data. If you changed your old development password or database, adjust your local environment before starting.

## Existing deployments

The Compose project name remains `eats`, the volume remains `postgres_data`, and the container names remain unchanged. **Do not change the project name or use `docker compose down -v`** on an existing deployment: doing so risks losing access to persistent PostgreSQL data.

Before adopting the template, copy the existing Compose file and environment configuration to a safe backup. Set the environment variables to reproduce the existing LAN address, ports, sources path, and image tag. The template preserves dual bindings for both services (localhost plus one LAN address).

## Validate

From the repository root:

```sh
docker compose -f deploy/compose.yaml --env-file deploy/.env config --quiet
```

For a copied deployment directory, run `docker compose --env-file .env config --quiet` there. `docker compose config` without `--quiet` prints expanded environment values, including secrets; do not share its output.

## GitHub Container Registry (GHCR)

On every push to `main` and on a weekly Sunday schedule (09:17 UTC), GitHub Actions first runs the existing .NET, NestJS, and Compose checks. After they pass, it builds the ingestion Docker image with `pull: true` to check for updated .NET 10 base images and publishes:

- `ghcr.io/restex03/eats-ingestion:sha-<full-git-commit-sha>` (normal main-branch releases)
- `ghcr.io/restex03/eats-ingestion:sha-<full-git-commit-sha>-run-<actions-run-id>` (weekly refreshes, unique even if source code is unchanged)
- `ghcr.io/restex03/eats-ingestion:main` (moving tag; not recommended for production pinning)

The weekly refresh rebuilds and deploys ingestion without a source-code change. Run-specific tags avoid overwriting an existing SHA-tagged release and preserve rollback references. A refreshed image can include .NET and base-image security patches, but a rebuild does not guarantee all OS packages are patched; review upstream image advisories and rebuild results. PostgreSQL is not redeployed by this workflow.

The workflow uses the built-in `GITHUB_TOKEN` with `packages: write`; no separate registry publishing secret is required. The package may initially be private. Check package visibility and grant repository access to the package if needed.

If the GHCR package is private, create a classic GitHub personal access token with **read:packages** and SSO authorization if applicable. Public packages can be pulled anonymously. Log in once without putting the token on the command line:

```sh
read -rsp 'GHCR token: ' GHCR_TOKEN; echo
printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
unset GHCR_TOKEN
```

Docker saves login credentials for the user running the command; use that same user for deployments and secure its Docker credential store. Do not commit or print the token.

For manual deployments, set these values in fred's existing production environment file (for example `/opt/eats/.env`). The CI deployment script sets them automatically:

```dotenv
INGESTION_IMAGE_REPOSITORY=ghcr.io/restex03/eats-ingestion
INGESTION_IMAGE_TAG=sha-REPLACE_WITH_PUBLISHED_COMMIT_SHA
```

Pull and deploy after the image has been published:

```sh
git pull --ff-only origin main
bash deployScripts/deploy-ingestion.sh --env-file /opt/eats/.env
```

The deployment script pulls GHCR images and recreates **ingestion only**; it does not start or recreate PostgreSQL. PostgreSQL must already be running. To roll back, restore the previous `INGESTION_IMAGE_TAG` and run the same deployment command. Once the production environment and Tailscale/SSH prerequisites below are configured, GitHub Actions automatically deploys after a successful main-branch publish. The commands above remain useful for manual recovery.

Local image builds remain supported by setting `INGESTION_IMAGE_REPOSITORY=eats-ingestion` and building the desired local tag first.

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

Build and deploy scripts are available in [`deployScripts/`](../deployScripts/README.md), with image tags, configuration validation, readiness checks, and documented rollback. The optional OTLP endpoint remains disabled until a telemetry receiver is available.

## Automatic deployment to fred (one-time setup)

PR checks run on GitHub-hosted runners, without production credentials. After merging into `main`, the publishing job builds and pushes the SHA-tagged image; the `deploy-ingestion` job then joins Tailscale, connects to fred over SSH, and runs `deployScripts/deploy-from-ci.sh` remotely. This script changes only the image selector in `/opt/eats/.env`, pulls the published SHA, recreates ingestion without touching PostgreSQL, checks health, and attempts to restore the previous image if deployment fails. A failed deployment is reported as a failed Actions job.

**Before merging this PR:**

1. Install and enroll Tailscale on fred. Create a Tailscale OAuth client with the `auth_keys` scope and tag `tag:github-actions`, configure tailnet access policy to allow that tag to reach fred on TCP 22, and configure the GitHub Action with the OAuth client ID and secret. Do not grant this tag broad tailnet access.
2. Create a dedicated SSH identity for deployments. Add its public key to fred's deployment user's `authorized_keys`; store the private key as a GitHub `production` environment secret. The user needs access to Docker (which effectively grants host-level privileges); protect this account accordingly.
3. On fred, ensure `/opt/eats/compose.yaml` and `/opt/eats/.env` are the current production configuration and writable by the deployment user, and that `flock` is installed. The deployment user must be able to run Docker without an interactive sudo prompt. Back up `.env` and PostgreSQL before the first deployment.
4. Authenticate Docker on fred to GHCR with a read-only `read:packages` token if the image is private; public packages may be pulled without credentials. The deployment user's Docker credentials must be configured for the same account used by SSH.
5. In GitHub repository **Settings → Environments**, create `production` and restrict deployment branches to `main`. Set these **environment secrets**: `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`, `DEPLOY_SSH_KEY`, and `DEPLOY_SSH_KNOWN_HOSTS`. Populate `DEPLOY_SSH_KNOWN_HOSTS` using fred's SSH host public key, verified out of band; do not use `StrictHostKeyChecking=no`. Set **environment variables** `DEPLOY_SSH_HOST` (fred's Tailscale address or MagicDNS hostname) and `DEPLOY_SSH_USER` (the deployment account).
6. Test the connection and deployment in a controlled rollout. Do not merge until the required GitHub secrets, environment variables, tailnet policy, SSH authorization, and GHCR pull access are ready.

**Security:** Do not run untrusted PR code on fred. Keep the production environment restricted to trusted `main` deployments. A deployment user with Docker access has host-level privileges; the SSH private key is a sensitive production credential. Use separate deploy credentials and limit access.

**Rollback limitation:** The script attempts to restore the previous image selector and recreate the old ingestion container on failure. This does **not** reverse database schema migrations or other persistent side effects. Database backups and backward-compatible migrations remain essential.
