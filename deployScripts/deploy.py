#!/usr/bin/env python3
"""Fred-side pull deployment. Python standard library only."""
import fcntl
import json
import logging
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time

IMAGE = "ghcr.io/restex03/eats-ingestion:main"
CONTAINER = "eats-ingestion"
LOG = logging.getLogger("eats.deploy")


class DeploymentError(RuntimeError):
    pass


class Docker:
    def __init__(self, directory):
        self.directory = directory

    def run(self, *args):
        result = subprocess.run(args, cwd=self.directory, text=True, capture_output=True)
        if result.returncode:
            raise DeploymentError(f"{args[:3]} exited {result.returncode}: {result.stderr[:400]}")
        return result.stdout.strip()

    def compose(self, *args):
        return self.run("docker", "compose", "--env-file", ".env", *args)

    def inspect(self):
        info = json.loads(self.run("docker", "inspect", CONTAINER))[0]
        return (info["Image"], info["State"]["Running"],
                (info["State"].get("Health") or {}).get("Status", "missing"))

    def image_id(self, name):
        return self.run("docker", "image", "inspect", "--format", "{{.Id}}", name)

    def tag(self, source, destination):
        self.run("docker", "image", "tag", source, destination)

    def deploy(self):
        self.compose("up", "-d", "--no-deps", "--pull", "never", "--force-recreate", "ingestion")

    def validate(self):
        self.compose("config", "--quiet")
        config = json.loads(self.compose("config", "--format", "json"))
        if config["services"]["ingestion"]["image"] != IMAGE:
            raise DeploymentError("Compose ingestion image must be " + IMAGE)


def save(path, state):
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(dir=path.parent, prefix=".deploy-")
    try:
        with os.fdopen(fd, "w") as out:
            json.dump(state, out, indent=2, sort_keys=True)
            out.write("\n")
            out.flush()
            os.fsync(out.fileno())
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def healthy(docker, expected, timeout=180):
    deadline = time.monotonic() + timeout
    while True:
        image, running, status = docker.inspect()
        if image == expected and running and status == "healthy":
            return
        if status in ("unhealthy", "missing"):
            raise DeploymentError("Health check failed: " + status)
        if time.monotonic() >= deadline:
            raise DeploymentError("Health check timed out")
        time.sleep(5)


def deploy_once(docker, path):
    docker.validate()
    state = json.loads(path.read_text()) if path.exists() else {}
    previous, running, health = docker.inspect()
    if not running or health != "healthy":
        raise DeploymentError("Current ingestion is not healthy; operator intervention required")
    state["current_image"] = previous  # Docker, not JSON, is authoritative.
    state["last_known_good_image"] = previous
    save(path, state)

    docker.run("docker", "pull", IMAGE)
    candidate = docker.image_id(IMAGE)
    if candidate == previous:
        LOG.info("Image unchanged")
        return "unchanged"
    if candidate == state.get("last_failed_image"):
        LOG.warning("Skipping quarantined image %s", candidate)
        return "quarantined"

    rollback_tag = "eats-ingestion:rollback-local"
    docker.tag(previous, rollback_tag)
    state.update(previous_image=previous, pending_image=candidate)
    save(path, state)

    try:
        docker.deploy()
        healthy(docker, candidate)
    except Exception as error:
        state.update(last_failed_image=candidate, last_error=str(error),
                     rollback_status="in_progress")
        save(path, state)
        try:
            docker.tag(rollback_tag, IMAGE)
            docker.deploy()
            healthy(docker, previous)
        except Exception as rollback_error:
            state["rollback_status"] = "failed"
            state["last_error"] = f"Deploy: {error}; rollback: {rollback_error}"
            save(path, state)
            LOG.critical("Rollback failed: %s", rollback_error)
            raise DeploymentError(state["last_error"]) from rollback_error
        state.update(rollback_status="succeeded", current_image=previous)
        state.pop("pending_image", None)
        save(path, state)
        raise DeploymentError(f"Deployment failed; rollback verified healthy: {error}") from error

    state.update(current_image=candidate, last_known_good_image=candidate,
                 rollback_status="not_required", last_error=None)
    state.pop("pending_image", None)
    state.pop("last_failed_image", None)
    save(path, state)
    LOG.info("Deployment healthy: %s", candidate)
    return "deployed"


def main():
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    directory = Path(os.environ.get("EATS_DEPLOY_DIR", "/opt/eats"))
    state_dir = directory / "deploy-state"
    try:
        if not (directory / ".env").is_file() or not (directory / "compose.yaml").is_file():
            raise DeploymentError("Missing Compose configuration")
        state_dir.mkdir(parents=True, exist_ok=True)
        with (state_dir / "deploy.lock").open("a+") as lock:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                LOG.info("Deployment already running")
                return 0
            deploy_once(Docker(directory), state_dir / "state.json")
        return 0
    except (DeploymentError, OSError, ValueError, KeyError, IndexError) as error:
        LOG.error("%s", error)
        return 1


if __name__ == "__main__":
    sys.exit(main())
