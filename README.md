# EATS

EATS (Employment Application Tracking and Scoring System) helps job seekers collect Workday job postings, assess how well a role matches a candidate profile, and track application progress. It supports human decision-making; it does not submit applications.

The web app lets you sync configured job sources, review and filter postings, run AI-assisted assessments, and record application statuses, notes, and attachments.

## How it works

Workday postings are collected by the ingestion service and stored in PostgreSQL. The web API reads those postings and uses a local SQLite database for candidate profiles, assessments, and application tracking. Assessments use the configured language-model provider. The React web app connects to both services through the API.

Detail discovery returns a flat `JobPostDetailDiscovery` model in the ingestion domain. `JobPost.HydrateDetail` creates the detail entity, assigns the owning post's ID, and applies discovered requisition and remote-type values. Detail entities generate their own IDs.

## Repository layout

- `apps/web/` — NestJS API, React client, Node tooling, and local application data.
- `apps/ingestion/src/Eats.Ingestion/` — .NET ingestion application.
- `apps/ingestion/tests/Eats.Ingestion.Tests/` — .NET ingestion tests.
- `apps/ingestion/Eats.Ingestion.slnx` — ingestion solution for future modular-monolith projects.
- `apps/ingestion/Dockerfile` — ingestion image definition (build context: repository root).
- `deployScripts/` — local ingestion image build helper.

Docker Compose infrastructure (development and production), environment templates and deployment automation live in [eats-deploy](https://github.com/restex03/eats-deploy).

The .NET application is **not yet split into modules**. This PR only establishes the
directory and solution structure for subsequent project extraction.

## Requirements

Install:

- [Node.js](https://nodejs.org/) LTS and npm
- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Docker](https://docs.docker.com/get-docker/) with its engine running (for PostgreSQL)
- A Mistral API key to run job assessments

## Get started

From the repository root:

1. Install dependencies:

   ```sh
   npm ci --prefix apps/web
   npm ci --prefix apps/web/client
   dotnet restore apps/ingestion/Eats.Ingestion.slnx
   ```

2. Create local data files:

   ```sh
   mkdir -p apps/web/data/CandidateProfiles apps/web/data/JobSources
   cp apps/web/src/Examples/candidateProfiles.example.json apps/web/data/CandidateProfiles/candidateProfile.json
   printf '[]\n' > apps/web/data/JobSources/workdaySources.json
   cp apps/web/.env.example apps/web/.env
   ```

   Edit `apps/web/.env` and set `MISTRAL_API_KEY`. The candidate profile is seeded into SQLite on first startup; customize the copied example first. The assessment UI currently uses a fixed candidate ID. Make the profile's `id` match the `CANDIDATE_PROFILE_ID` values in `apps/web/client/src/pages/JobPostsPage.tsx` and `apps/web/client/src/components/JobPostModal.tsx`, or update those values to match your profile.

   Add the Workday career sites you want to sync to `apps/web/data/JobSources/workdaySources.json`. It must be a JSON array of objects with `companyName` and `baseUrl` fields. The empty array above allows the service to start, but you must configure at least one source to sync postings.

3. Set the ingestion service URL in `apps/web/.env`:

   ```dotenv
   INGESTION_SVC_BASE_URL=http://localhost:5223
   ```

   `DB_PATH`, `CANDIDATE_PROFILE`, and `API_PORT` are already set in `apps/web/.env.example`; adjust them only if needed.

4. Clone [eats-deploy](https://github.com/restex03/eats-deploy) alongside this repository and start development PostgreSQL:

   ```sh
   git clone https://github.com/restex03/eats-deploy.git ../eats-deploy
   (cd ../eats-deploy && cp -n .env.dev.example .env)
   # Edit ../eats-deploy/.env: set WORKDAY_SOURCES_HOST_PATH to an absolute path.
   # If you already have a local deploy/.env, copy it instead of creating a new one.
   bash ../eats-deploy/infrastart.sh
   ```

   Start ingestion in a separate terminal from the EATS root:

   ```sh
   (cd apps/ingestion/src/Eats.Ingestion && dotnet run)
   ```

   Compose starts local PostgreSQL on localhost:5432, using the existing `eats-postgres-data` volume. The ingestion service applies its database migrations on startup and loads configured Workday sources if its database has none. If the old `infrastart.sh` container still exists, stop and remove **only that container** before the first Compose startup: `docker rm -f eats-postgres`. Do not remove its data volume.

   ```sh
   npm run dev --prefix apps/web
   ```

   This starts the API at `http://localhost:3000`.

   ```sh
   npm run frontend:dev --prefix apps/web
   ```

   Open `http://localhost:3001`. The frontend proxies API requests to port 3000. You can run the API and frontend together with `npm run dev:full --prefix apps/web` once the ingestion service is running.

The API health check is at `http://localhost:3000/health`.

## Using EATS

Choose **Sync** in the Job Posts page to collect postings from configured sources. Select one or more postings and choose **Run Assessments** to screen and compare them with your candidate profile. Open a posting to review its details and assessment, and use its application controls to track status, notes, and attachments.

## Data and reset

Local Node application data is stored in the ignored `apps/web/data/` directory. Do not commit candidate profiles, source configuration, database files, or other personal information.

There are two databases:

- `apps/web/data/job-app.db` (SQLite) stores candidate profiles, assessments, application tracking, and the assessment queue. Uploaded attachment files are stored separately under `apps/web/data/`.
- The `eats-postgres-data` Docker volume stores ingested job postings, Workday sources, and sync tasks.

To clear the app's SQLite data through the UI, open **Tools → Reset Database**, then confirm. This clears profiles, assessments, application records, and assessment queue entries, then seeds the candidate profile from its configured JSON file. It does **not** remove job postings or sources in PostgreSQL, or uploaded attachment files.

With the default `DB_PATH`, reset SQLite manually by stopping the API and removing its database and any SQLite sidecar files, then restarting the API:

```sh
rm -f apps/web/data/job-app.db apps/web/data/job-app.db-shm apps/web/data/job-app.db-wal
npm run dev --prefix apps/web
```

The API recreates the schema and seeds the candidate profile on startup. This does not affect PostgreSQL job data.

For a completely fresh install of both databases, first reset SQLite using the method above, then stop the ingestion service and remove the **development** PostgreSQL container and volume. This permanently deletes all local ingested postings, sources, and sync tasks; never run these commands on the production Docker host:

```sh
(cd ../eats-deploy && docker compose -f compose.yaml -f compose.dev.yaml --env-file .env down)
docker volume rm eats-postgres-data
bash ../eats-deploy/infrastart.sh
```

For a fully containerized local ingestion service, build an image, then run the same Compose files with `up -d`. Stop the host-run `.NET` ingestion process first to avoid two ingestion workers running against the same database. See [development Compose instructions](https://github.com/restex03/eats-deploy#local-development).

## Checks

```sh
npm run verify --prefix apps/web
npm run frontend:build --prefix apps/web
dotnet test apps/ingestion/Eats.Ingestion.slnx
```

## Building the ingestion image

Use the repository root as the Docker build context:

```sh
docker build -f apps/ingestion/Dockerfile -t eats-ingestion:local .
```

GitHub Actions publishes images from `main`; both Compose configurations and Fred-side automated deployment are maintained in [eats-deploy](https://github.com/restex03/eats-deploy). Local builds do not publish or deploy.

## Migrating an existing local checkout

If `deploy/.env` still exists in your EATS checkout, copy it to the sibling `eats-deploy/.env` without overwriting an existing file. Verify the absolute Workday sources path and keep the current database credentials. Existing Docker project and volume names are unchanged. Do not delete volumes during this move.

Untracked files are not moved by Git. If you already have a local `.env`
or `data/` directory at the old repository root, move them into the web
workspace after checking out this PR:

```sh
mv .env apps/web/.env
mv data apps/web/data
```

Only run those commands when the destination does not already exist.
Do not commit personal data or credentials.
