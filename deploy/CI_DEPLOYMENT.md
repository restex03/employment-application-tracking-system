# Deploy and monitor EATS on Fred

Fred checks GHCR for a new ingestion image every five minutes after each completed check. Failed deployments trigger rollback; the most recently failed image is skipped on subsequent checks.

## 1. Install Bun (once)

On Fred, verify x86_64 and AVX2 support:

```bash
uname -m
grep -qw avx2 /proc/cpuinfo && echo "AVX2 supported"
```

For x86_64 with AVX2, install the same pinned Bun version used by CI:

```bash
(
  set -eu
  temp=$(mktemp -d)
  trap 'rm -rf "$temp"' EXIT
  cd "$temp"
  curl -fSL https://github.com/oven-sh/bun/releases/download/bun-v1.4.5/bun-linux-x64.zip -o bun-linux-x64.zip
  echo "94559b3b528995a49452f9f2404cec74f2efd7d06e0a000a8cd214b02c3666eb  bun-linux-x64.zip" | sha256sum --check
  unzip -q bun-linux-x64.zip
  sudo install -o root -g root -m 755 bun-linux-x64/bun /usr/local/bin/bun
  test "$(/usr/local/bin/bun --version)" = "1.4.5"
)
```

Without AVX2, use the baseline x64 archive; for ARM64, use the aarch64 archive. Verify the corresponding published checksum before installing.

## 2. Install the deployment script

Run these commands from a checkout of the merged repository on Fred. For updates, stop the existing timer first and wait for any active deployment service to finish.

```bash
sudo install -m 644 deployScripts/deploy.ts /opt/eats/deploy.ts
sudo install -m 644 deploy/systemd/eats-ingestion-deploy.{service,timer} /etc/systemd/system/
sudo install -d -o eats-deploy -g eats-deploy -m 700 /opt/eats/deploy-state
sudo systemctl daemon-reload
```

Edit the existing /opt/eats/.env (leave all other settings intact):

```dotenv
INGESTION_IMAGE_REPOSITORY=ghcr.io/restex03/eats-ingestion
INGESTION_IMAGE_TAG=main
```

Prerequisites: eats-deploy can read the local Compose configuration and .env, access Docker, and write the state directory. Ingestion must already be healthy; Docker Compose must support --wait and --wait-timeout. Docker group access is effectively root access.

```bash
sudo -u eats-deploy docker inspect --format '{{.State.Health.Status}}' eats-ingestion
docker compose version
```

## 3. Start automated deployments

Run one check manually through systemd:

```bash
sudo systemctl start eats-ingestion-deploy.service
sudo journalctl -u eats-ingestion-deploy.service -n 50 --no-pager
```

Verify successful deployment and rollback in an isolated Docker environment before enabling the timer:

```bash
sudo systemctl enable --now eats-ingestion-deploy.timer
systemctl list-timers eats-ingestion-deploy.timer
```

The timer resumes after reboot. Always use systemctl for manual deployment checks; never run the script concurrently or directly.

## 4. Monitor deployments

```bash
# Latest deployment status
systemctl status eats-ingestion-deploy.service

# Recent deployment logs (including previous failures)
sudo journalctl -u eats-ingestion-deploy.service --since today

# Watch live
sudo journalctl -fu eats-ingestion-deploy.service

# Inspect ingestion health
sudo docker inspect --format '{{.State.Health.Status}}' eats-ingestion
```

A successful oneshot service normally becomes inactive after completion.

| Log message | Meaning |
|---|---|
| Image unchanged | No deployment needed |
| Deployment verified healthy | Success |
| Rollback verified healthy | Deployment failed; previous image restored |
| Skipping quarantined image | Known failed image skipped |
| CRITICAL: Rollback failed | Manual recovery required |
| Could not persist quarantine | Stop timer and investigate |

A failed deployment returns a nonzero exit status even when rollback succeeds. Logs are not proactive alerts.

## 5. Pause deployments if recovery is needed

```bash
sudo systemctl disable --now eats-ingestion-deploy.timer
sudo journalctl -u eats-ingestion-deploy.service -n 100 --no-pager
sudo docker ps -a --filter name=eats-ingestion
sudo docker image inspect eats-ingestion:rollback-local
```

Let any active deployment finish before modifying containers or image tags. Investigate and restore ingestion if necessary, then restart the timer. Do not delete the quarantine file or rollback tag until recovery is complete. Rollback does not undo database migrations; never use docker compose down -v.

GHCR's main tag is mutable: protect publishing permissions and require CI checks on main.
