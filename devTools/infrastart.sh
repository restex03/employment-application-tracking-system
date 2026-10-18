#!/usr/bin/env bash
set -euo pipefail

if docker container inspect eats-postgres >/dev/null 2>&1; then
    docker start eats-postgres
else
    docker run -d \
    --name eats-postgres \
    --restart unless-stopped \
    -p 127.0.0.1:5432:5432 \
    -e POSTGRES_USER=eats \
    -e POSTGRES_PASSWORD=eats_dev_password \
    -e POSTGRES_DB=eats \
    -v eats-postgres-data:/var/lib/postgresql \
    postgres:18-trixie
fi