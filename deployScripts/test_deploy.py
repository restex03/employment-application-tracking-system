"""Verify deployment decisions without a Docker daemon or real delays."""
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import call, patch

import deploy


CONFIG = json.dumps({"services": {"ingestion": {
    "image": deploy.IMAGE, "container_name": deploy.CONTAINER,
}}})
CONFIG_CALL = call("compose", "--env-file", ".env", "config", "--format", "json")
INSPECT = call(
    "inspect", "--format",
    "{{.Image}} {{.State.Running}} {{if .State.Health}}{{.State.Health.Status}}{{else}}missing{{end}}",
    deploy.CONTAINER,
)
PULL = call("pull", deploy.IMAGE)
CANDIDATE = call("image", "inspect", "--format", "{{.Id}}", deploy.IMAGE)
PRESERVE = call("image", "tag", "old", deploy.ROLLBACK)
RESTORE = call("image", "tag", deploy.ROLLBACK, deploy.IMAGE)
UP = call(
    "compose", "--env-file", ".env", "up", "-d", "--no-deps",
    "--pull", "never", "--force-recreate", "--wait", "--wait-timeout",
    "180", "ingestion",
)
CHECK = [CONFIG_CALL, INSPECT, PULL, CANDIDATE]


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.failed = Path(directory.name) / "deploy-state" / "failed-image-id"
        self.docker = self.enterContext(patch.object(deploy, "docker"))

    def run_deploy(self):
        return deploy.deploy_once(self.failed)

    def test_success(self):
        self.docker.side_effect = [CONFIG, "old true healthy", "", "new",
                                   "", "", "new true healthy"]
        self.assertEqual(self.run_deploy(), "deployed")
        self.assertEqual(self.docker.call_args_list, CHECK + [PRESERVE, UP, INSPECT])
        self.assertFalse(self.failed.exists())

    def test_unchanged(self):
        self.docker.side_effect = [CONFIG, "old true healthy", "", "old"]
        self.assertEqual(self.run_deploy(), "unchanged")
        self.assertEqual(self.docker.call_args_list, CHECK)

    def test_failed_candidate_is_rolled_back_and_quarantined(self):
        self.docker.side_effect = [CONFIG, "old true healthy", "", "new", "",
                                   deploy.DeploymentError("unhealthy"),
                                   "", "", "old true healthy"]
        with self.assertRaisesRegex(deploy.DeploymentError, "rollback succeeded"):
            self.run_deploy()
        self.assertEqual(self.failed.read_text().strip(), "new")
        self.assertEqual(self.docker.call_args_list,
                         CHECK + [PRESERVE, UP, RESTORE, UP, INSPECT])
        self.docker.reset_mock()
        self.docker.side_effect = [CONFIG, "old true healthy", "", "new"]
        self.assertEqual(self.run_deploy(), "quarantined")
        self.assertEqual(self.docker.call_args_list, CHECK)

    def test_different_candidate_can_deploy_after_failure(self):
        self.failed.parent.mkdir()
        self.failed.write_text("bad\n")
        self.docker.side_effect = [CONFIG, "old true healthy", "", "new",
                                   "", "", "new true healthy"]
        self.assertEqual(self.run_deploy(), "deployed")
        self.assertEqual(self.docker.call_args_list, CHECK + [PRESERVE, UP, INSPECT])

    def test_failed_rollback_is_reported(self):
        self.docker.side_effect = [CONFIG, "old true healthy", "", "new", "",
                                   deploy.DeploymentError("unhealthy"), "", "",
                                   "old true unhealthy"]
        with self.assertLogs(deploy.LOG, level="CRITICAL"):
            with self.assertRaisesRegex(deploy.DeploymentError, "rollback failed"):
                self.run_deploy()
        self.assertEqual(self.failed.read_text().strip(), "new")
        self.assertEqual(self.docker.call_args_list,
                         CHECK + [PRESERVE, UP, RESTORE, UP, INSPECT])

    def test_quarantine_write_failure_does_not_prevent_rollback(self):
        self.docker.side_effect = [CONFIG, "old true healthy", "", "new", "",
                                   deploy.DeploymentError("unhealthy"),
                                   "", "", "old true healthy"]
        with patch.object(deploy, "quarantine", side_effect=OSError("disk full")):
            with self.assertRaisesRegex(deploy.DeploymentError, "rollback succeeded"):
                self.run_deploy()
        self.assertEqual(self.docker.call_args_list,
                         CHECK + [PRESERVE, UP, RESTORE, UP, INSPECT])

    def test_unhealthy_existing_container_blocks_deployment(self):
        self.docker.side_effect = [CONFIG, "old true unhealthy"]
        with self.assertRaisesRegex(deploy.DeploymentError, "not healthy"):
            self.run_deploy()
        self.assertEqual(self.docker.call_args_list, [CONFIG_CALL, INSPECT])

    def test_wrong_compose_image_blocks_deployment(self):
        self.docker.return_value = json.dumps({"services": {"ingestion": {
            "image": "wrong", "container_name": deploy.CONTAINER,
        }}})
        with self.assertRaisesRegex(deploy.DeploymentError, "Unexpected Compose"):
            self.run_deploy()
        self.assertEqual(self.docker.call_args_list, [CONFIG_CALL])

    def test_pull_failure_does_not_recreate_container(self):
        self.docker.side_effect = [CONFIG, "old true healthy",
                                   deploy.DeploymentError("pull failed")]
        with self.assertRaisesRegex(deploy.DeploymentError, "pull failed"):
            self.run_deploy()
        self.assertEqual(self.docker.call_args_list, CHECK[:3])

    def test_unexpected_running_image_triggers_rollback(self):
        self.docker.side_effect = [CONFIG, "old true healthy", "", "new",
                                   "", "", "unexpected true healthy", "", "",
                                   "old true healthy"]
        with self.assertRaisesRegex(deploy.DeploymentError, "rollback succeeded"):
            self.run_deploy()
        self.assertEqual(self.docker.call_args_list,
                         CHECK + [PRESERVE, UP, INSPECT, RESTORE, UP, INSPECT])


if __name__ == "__main__":
    unittest.main()
