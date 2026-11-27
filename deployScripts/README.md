# Build the EATS ingestion image

From the repository root, with Docker Engine and Bash:

```bash
bash deployScripts/build-ingestion.sh 0.1.22
```

The helper builds `eats-ingestion:0.1.22` using the application source and Dockerfile. It does not publish or deploy the image. See [Compose configuration and local development](../deploy/README.md). Fred-side deployment scripts, tests and operational documentation are now maintained in [eats-deploy](https://github.com/restex03/eats-deploy).
