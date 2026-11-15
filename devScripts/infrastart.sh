#!/usr/bin/env bash
set -euo pipefail

# Start only the development PostgreSQL container using the shared Compose
# configuration. Run from any directory:
#
#   bash devScripts/infrastart.sh
#
# One-time setup:
#   1. cp deploy/.env.dev.example deploy/.env
#   2. Edit deploy/.env and set WORKDAY_SOURCES_HOST_PATH to an absolute path.
#   3. If the old manually created eats-postgres container exists, stop any
#      running ingestion process and remove ONLY that container:
#        docker rm -f eats-postgres
#      Do NOT remove the eats-postgres-data volume; Compose reuses it.
#
# This script starts PostgreSQL only. Run ingestion separately with dotnet run.

script_directory="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repository_root="$(cd "$script_directory/.." && pwd)"
environment_file="$repository_root/deploy/.env"

if [[ ! -f "$environment_file" ]]; then
    echo "Missing $environment_file" >&2
    echo "Copy deploy/.env.dev.example to deploy/.env and configure it first." >&2
    exit 1
fi

docker compose \
    --project-directory "$repository_root/deploy" \
    --file "$repository_root/deploy/compose.yaml" \
    --file "$repository_root/deploy/compose.dev.yaml" \
    --env-file "$environment_file" \
    up -d postgres
