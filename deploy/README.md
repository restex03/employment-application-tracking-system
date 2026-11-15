# Deployment

The existing Compose deployment on the mini PC is managed separately and
is **not moved or replaced** by the directory-only reorganization.

If you later check `compose.yaml` into this directory, keep `.env` with
credentials untracked. Build the ingestion image from the repository root:

```sh
docker build -f apps/ingestion/Dockerfile -t eats-ingestion:local .
```

The ingestion image continues to run `Eats.Ingestion.dll`. The Workday
sources path and runtime configuration inside the container are unchanged.
