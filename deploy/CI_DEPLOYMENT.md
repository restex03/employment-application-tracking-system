# Fred-initiated continuous deployment

GitHub Actions runs .NET, NestJS, Compose, Docker build and deployment-controller tests, then publishes the ingestion image to GHCR **only after all checks pass on main**. Fred checks for new images using a native systemd timer, five minutes after each completed check. No GitHub-hosted deployment job, Tailscale OAuth credentials, SSH keys or inbound connection to Fred are required.

## Responsibilities

- **systemd:** scheduling, serialization of the oneshot service, startup after reboot and overall execution timeout. Use the service for both scheduled and manual deployments; do not run the TypeScript script directly or concurrently modify ingestion or its image tags.
- **Docker Compose:** configuration validation, ingestion container lifecycle and health waiting (including timeout). PostgreSQL is not recreated.
- **Docker:** running image identity and local rollback image tag.
- **journald:** deployment outcomes, errors and rollback history.
- **TypeScript + Bun:** decide whether to deploy, orchestrate rollback and persist the most recently failed image ID. No custom polling, locking or JSON deployment-state ledger.

## Install on Fred (one-time, manual)

1. Verify /opt/eats/compose.yaml, /opt/eats/.env and the healthy eats-ingestion container. Confirm Docker Compose supports up --wait, --wait-timeout and --pull never, and config --format json. The controller refuses to deploy if the current container is absent or unhealthy.
2. Copy deployScripts/deploy.ts to /opt/eats/deploy.ts. Install deploy/systemd/eats-ingestion-deploy.service and deploy/systemd/eats-ingestion-deploy.timer into /etc/systemd/system/. Ensure eats-deploy can execute Docker, read the deployment directory and write /opt/eats/deploy-state/. Docker group membership is effectively root-level privilege. Install the pinned Bun binary as described below; no npm packages are required.
3. Set INGESTION_IMAGE_REPOSITORY=ghcr.io/restex03/eats-ingestion and INGESTION_IMAGE_TAG=main in Fred's **local** /opt/eats/.env. Do not commit this file. Keep the Compose project, PostgreSQL service and named volume unchanged.
4. With the timer disabled, run sudo systemctl daemon-reload and sudo systemctl start eats-ingestion-deploy.service. Verify readiness and inspect sudo journalctl -u eats-ingestion-deploy.service -n 100 --no-pager. Validate a successful deployment and a deliberate health-check failure in an isolated test environment before enabling unattended deployment.
5. Enable the timer with sudo systemctl enable --now eats-ingestion-deploy.timer. Inspect systemctl list-timers eats-ingestion-deploy.timer.

## Install pinned Bun (Linux x86_64)

Use Bun 1.4.5 in CI and on Fred. The following official Linux x64 archive requires AVX2 support; for a CPU without AVX2 use the official baseline archive and its corresponding checksum. For ARM64 use the corresponding official asset. The x64 digest is published in Oven's Homebrew formula (https://github.com/oven-sh/homebrew-bun/blob/main/Formula/bun.rb).

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

Bun runs TypeScript directly; no npm install, package manifest, transpilation step or third-party test library is needed. The service uses an absolute executable path and disables automatic dotenv loading. Docker Compose explicitly reads .env. Install the runtime and controller from trusted sources, not a mutable remote script. Upgrade the pinned version and digest together with CI validation.

Run the deployment decision tests locally with `bun test --no-env-file deployScripts/deploy.test.ts`. No Docker daemon is required. Bun transpiles TypeScript but does not perform static type checking; these are runtime tests, not a tsc check. If branch protection requires a previous Python or Nushell deployment check, replace it with the Bun deployment unit tests check before merging.

## Security and operational boundaries

- GitHub Actions dependencies are pinned to full commit SHAs. No deployment secrets are exposed to GitHub.
- GHCR :main is mutable. Protect main with required CI checks and PR reviews. Anyone who can publish or overwrite this tag remains in the deployment trust boundary.
- The controller never copies Compose configuration or secrets from GitHub. Install configuration changes on Fred separately. Do not run docker compose down -v.
- The controller validates the expected Compose image and container name, pulls the candidate, compares immutable image IDs and preserves the previous image as eats-ingestion:rollback-local before recreating ingestion only. Compose waits for health; the controller confirms the running image ID and healthy status before declaring success.
- A failed candidate is quarantined in /opt/eats/deploy-state/failed-image-id using atomic replacement. Subsequent polls skip that ID. A different image can deploy if the current container is healthy. Only the most recent failed ID is retained, not a history of all failed images.
- On failure the controller attempts rollback even if writing the quarantine file fails. A successful rollback still returns a nonzero exit status so the failure is visible in journald. If the quarantine file cannot be written, disable the timer and repair storage to prevent repeated attempts.
- A failed rollback is logged as CRITICAL; investigate immediately. An unhealthy or absent current container blocks unattended deployments. A process termination, host outage or systemd timeout during deployment is not automatically reconciled: inspect Docker and the journal, then manually restore the preserved rollback image if necessary. Do not prune the rollback tag before recovery. Container rollback cannot undo database migrations or external effects.
- No script or timer is installed on Fred by this PR; initial verification is manual.
