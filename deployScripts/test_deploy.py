"""Unit tests for the Fred deployment state machine (no Docker required)."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("deploy", Path(__file__).with_name("deploy.py"))
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class FakeDocker:
    def __init__(self, candidate="new", fail_candidate=False, fail_rollback=False):
        self.current = "old"
        self.candidate = candidate
        self.fail_candidate = fail_candidate
        self.fail_rollback = fail_rollback
        self.tags = {}
        self.deployments = 0

    def validate(self):
        pass

    def inspect(self):
        if self.current == "new" and self.fail_candidate:
            return (self.current, True, "unhealthy")
        if self.current == "old" and self.deployments > 1 and self.fail_rollback:
            return (self.current, True, "unhealthy")
        return (self.current, True, "healthy")

    def run(self, *args):
        return ""

    def image_id(self, name):
        return self.candidate

    def tag(self, source, destination):
        self.tags[destination] = source

    def deploy(self):
        self.deployments += 1
        self.current = self.tags.get(deploy.IMAGE, self.candidate)


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / "state.json"

    def tearDown(self):
        self.tmp.cleanup()

    def state(self):
        return json.loads(self.path.read_text())

    def test_success(self):
        docker = FakeDocker()
        self.assertEqual(deploy.deploy_once(docker, self.path), "deployed")
        self.assertEqual(self.state()["current_image"], "new")
        self.assertEqual(docker.deployments, 1)

    def test_unchanged(self):
        docker = FakeDocker(candidate="old")
        self.assertEqual(deploy.deploy_once(docker, self.path), "unchanged")
        self.assertEqual(docker.deployments, 0)

    def test_failed_candidate_is_rolled_back_and_quarantined(self):
        docker = FakeDocker(fail_candidate=True)
        with self.assertRaises(deploy.DeploymentError):
            deploy.deploy_once(docker, self.path)
        self.assertEqual(self.state()["rollback_status"], "succeeded")
        self.assertEqual(self.state()["last_failed_image"], "new")
        self.assertEqual(docker.current, "old")
        self.assertEqual(deploy.deploy_once(docker, self.path), "quarantined")
        self.assertEqual(docker.deployments, 2)

    def test_failed_rollback_is_recorded(self):
        docker = FakeDocker(fail_candidate=True, fail_rollback=True)
        with self.assertRaises(deploy.DeploymentError):
            deploy.deploy_once(docker, self.path)
        self.assertEqual(self.state()["rollback_status"], "failed")


if __name__ == "__main__":
    unittest.main()
