#!/usr/bin/env python3
"""Fred-side deployment orchestration. Run through the systemd service."""
import json
import logging
from pathlib import Path
import subprocess

IMAGE = "ghcr.io/restex03/eats-ingestion:main"
CONTAINER = "eats-ingestion"
ROLLBACK = "eats-ingestion:rollback-local"
FAILED_IMAGE = Path("deploy-state/failed-image-id")
LOG = logging.getLogger("eats.deploy")


class DeploymentError(RuntimeError):
    pass


def docker(*args):
    result = subprocess.run(
        ["docker", *args], capture_output=True, text=True,
    )
    if result.returncode:
        raise DeploymentError(
            f"docker {args[0]} exited {result.returncode}: {result.stderr.strip()}"
        )
    return result.stdout.strip()


def compose(*args):
    return docker("compose", "--env-file", ".env", *args)


def healthy_image():
    result = docker(
        "inspect", "--format",
        "{{.Image}} {{.State.Running}} {{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}",
        CONTAINER,
    )
    image, _, status = result.partition(" ")
    if not image or status != "true healthy":
        raise DeploymentError("Ingestion is not healthy; operator intervention required")
    return image


def deploy(expected):
    compose(
        "up", "-d", "--no-deps", "--pull", "never", "--force-recreate",
        "--wait", "--wait-timeout", "180", "ingestion",
    )
    if healthy_image() != expected:
        raise DeploymentError("Unexpected running image")


def quarantine(path, image):
    # systemd serializes invocations. Replace the file atomically.
    temporary = path.with_suffix(".tmp")
    temporary.write_text(image + "\n")
    temporary.replace(path)


def deploy_once(failed_file=FAILED_IMAGE):
    # Compose validates configuration. Do not log its resolved contents (secrets).
    config = json.loads(compose("config", "--format", "json"))
    ingestion = config["services"]["ingestion"]
    if ingestion["image"] != IMAGE or ingestion.get("container_name") != CONTAINER:
        raise DeploymentError("Unexpected Compose ingestion image or container name")

    previous = healthy_image()
    failed_file.parent.mkdir(parents=True, exist_ok=True)
    try:
        failed = failed_file.read_text().strip()
    except FileNotFoundError:
        failed = None

    docker("pull", IMAGE)
    candidate = docker("image", "inspect", "--format", "{{.Id}}", IMAGE)
    if candidate == previous:
        LOG.info("Image unchanged: %s", candidate)
        return "unchanged"
    if candidate == failed:
        LOG.warning("Skipping quarantined image: %s", candidate)
        return "quarantined"

    docker("image", "tag", previous, ROLLBACK)
    LOG.info("Deploying %s (previous: %s)", candidate, previous)
    try:
        deploy(candidate)
    except (DeploymentError, OSError) as error:
        LOG.error("Deployment failed: %s", error)
        try:
            quarantine(failed_file, candidate)
        except OSError as persistence_error:
            LOG.error("Could not persist quarantine: %s", persistence_error)
        # Quarantine failures must not prevent a rollback attempt.
        try:
            docker("image", "tag", ROLLBACK, IMAGE)
            deploy(previous)
        except (DeploymentError, OSError) as rollback_error:
            LOG.critical("Rollback failed: %s", rollback_error)
            raise DeploymentError("Deployment and rollback failed") from rollback_error
        LOG.info("Rollback verified healthy: %s", previous)
        raise DeploymentError("Deployment failed; rollback succeeded") from error

    LOG.info("Deployment verified healthy: %s", candidate)
    return "deployed"


def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    try:
        deploy_once()
        return 0
    except (DeploymentError, OSError, ValueError, KeyError, TypeError) as error:
        LOG.error("%s", error)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
