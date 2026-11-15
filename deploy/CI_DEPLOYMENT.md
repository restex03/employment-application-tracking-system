# Automatic deployment to Fred

The deployment job runs **only after** main-branch tests and GHCR publishing succeed. All referenced GitHub and Docker actions are pinned to full commit SHAs. The Tailscale action is pinned to v4.4.0's commit and its binary version is explicitly selected.

## One-time setup

1. Verify `/opt/eats/compose.yaml`, `/opt/eats/.env`, and `/opt/eats/deploy-from-ci.sh` exist on Fred. Copy the version-controlled `deployScripts/deploy-from-ci.sh` to Fred **after reviewing it**; do not allow the CI SSH identity to modify the installed script.
2. Provision a dedicated Tailscale OAuth client with the minimum `auth_keys` scope for `tag:github-ci`. Restrict tailnet ACLs/grants so this tag can reach **only Fred's SSH port**. Tailscale connectivity alone does not authorize SSH.
3. Create a dedicated SSH key for the deployment identity. Install its public key on Fred for `eats-deploy`. Use a restricted account and carefully review Docker access: membership in the Docker group is effectively root-level access. Protect `/opt/eats/.env` and the deployment script against modification by that account wherever practical.
4. Configure the GitHub `production` environment with secrets `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`, and `FRED_DEPLOY_SSH_KEY` (complete private key). Configure variables `FRED_TAILSCALE_IP` and `FRED_SSH_HOST_KEY` (a verified `known_hosts` line with Fred's actual SSH host key and Tailscale IP). **Verify the host key out of band; never blindly trust ssh-keyscan output.**
5. Ensure Fred can pull the GHCR image as `eats-deploy`, and verify the deployed Compose file resolves `INGESTION_IMAGE_REPOSITORY` and `INGESTION_IMAGE_TAG`.
6. Review production environment protection rules. A required reviewer adds approval before deployment; leave it unset for unattended CI/CD. Protect main with passing checks and PR review, and restrict who can edit workflows and deployment scripts.

## Security boundaries

- Build and publish jobs do **not** receive the Tailscale OAuth secret or deployment SSH key.
- The deploy job has no checkout and `contents: none`. Its secrets are available only after the `production` environment rules allow the job to start.
- The deploy job invokes the **preinstalled** `/opt/eats/deploy-from-ci.sh`; it does not execute a downloaded repository script on Fred.
- The remote script checks its commit-derived image tag, validates Compose, deploys only ingestion, waits for health, and attempts rollback on failure. Database migrations are not rolled back.
- A pinned GitHub Action prevents its referenced source revision from moving, but does **not** guarantee that action or the downloaded Tailscale binary is free from vulnerabilities.
- The deploy SSH credential can still be stolen by compromised code running inside the deploy job. Review the Tailscale action and runner trust assumptions, rotate credentials, and consider a Fred-initiated polling design if eliminating inbound deployment credentials from GitHub becomes a priority.

## Operational notes

The scheduled refresh runs daily at 09:17 UTC, and deployment follows successful publishing. Main-branch pushes also publish and deploy. The `production` environment must be configured before merging, or the deployment will fail. Do not merge until the host-side script, permissions, Tailscale ACLs, and host-key variable have been verified. Keep the existing Compose project and PostgreSQL volume unchanged.
