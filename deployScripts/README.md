# Build the EATS ingestion image

From the repository root, with Docker Engine and Bash:

```bash
bash deployScripts/build-ingestion.sh 0.1.22
```

This builds `eats-ingestion:0.1.22` locally; it does not publish or deploy. See [Compose configuration and local development](../deploy/README.md). Fred deployment automation and the operational runbook are maintained in [eats-deploy](https://github.com/restex03/eats-deploy).
