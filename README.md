# EATS

EATS (Employment Application Tracking and Scoring System) helps job seekers collect Workday job postings, assess how well a role matches a candidate profile, and track application progress. It supports human decision-making; it does not submit applications.

The web app lets you sync configured job sources, review and filter postings, run AI-assisted assessments, and record application statuses, notes, and attachments.

## How it works

Workday postings are collected by the ingestion service and stored in PostgreSQL. The web API reads those postings and uses a local SQLite database for candidate profiles, assessments, and application tracking. Assessments use the configured language-model provider. The React web app connects to both services through the API.

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
   npm ci
   npm ci --prefix client
   dotnet restore Eats.Ingestion/Eats.Ingestion.csproj
   ```

2. Create local data files:

   ```sh
   mkdir -p data/CandidateProfiles data/JobSources
   cp src/Examples/candidateProfiles.example.json data/CandidateProfiles/candidateProfile.json
   printf '[]\n' > data/JobSources/workdaySources.json
   cp .envExample .env
   ```

   Edit `.env` and set `MISTRAL_API_KEY`. The candidate profile is seeded into SQLite on first startup; customize the copied example first. The assessment UI currently uses a fixed candidate ID. Make the profile's `id` match the `CANDIDATE_PROFILE_ID` values in `client/src/pages/JobPostsPage.tsx` and `client/src/components/JobPostModal.tsx`, or update those values to match your profile.

   Add the Workday career sites you want to sync to `data/JobSources/workdaySources.json`. It must be a JSON array of objects with `companyName` and `baseUrl` fields. The empty array above allows the service to start, but you must configure at least one source to sync postings.

3. Set the ingestion service URL in `.env`:

   ```dotenv
   INGESTION_SVC_BASE_URL=http://localhost:5223
   ```

   `DB_PATH`, `CANDIDATE_PROFILE`, and `API_PORT` are already set in `.envExample`; adjust them only if needed.

4. Start the services in separate terminals:

   ```sh
   bash devTools/infrastart.sh
   dotnet run --project Eats.Ingestion/Eats.Ingestion.csproj
   ```

   The script starts the local PostgreSQL container. The ingestion service applies its database migrations on startup and loads configured Workday sources if its database has none.

   ```sh
   npm run dev
   ```

   This starts the API at `http://localhost:3000`.

   ```sh
   npm run frontend:dev
   ```

   Open `http://localhost:3001`. The frontend proxies API requests to port 3000. You can run the API and frontend together with `npm run dev:full` once the ingestion service is running.

The API health check is at `http://localhost:3000/health`; interactive API docs are at `http://localhost:3000/docs`.

## Using EATS

Choose **Sync** in the Job Posts page to collect postings from configured sources. Select one or more postings and choose **Run Assessments** to screen and compare them with your candidate profile. Open a posting to review its details and assessment, and use its application controls to track status, notes, and attachments.

## Data and reset

Local data is stored in the ignored `data/` directory. Do not commit candidate profiles, source configuration, database files, or other personal information.

There are two databases:

- `data/job-app.db` (SQLite) stores candidate profiles, assessments, application tracking, and the assessment queue. Uploaded attachment files are stored separately under `data/`.
- The `eats-postgres-data` Docker volume stores ingested job postings, Workday sources, and sync tasks.

To clear the app's SQLite data through the UI, open **Tools → Reset Database**, then confirm. This clears profiles, assessments, application records, and assessment queue entries, then seeds the candidate profile from its configured JSON file. It does **not** remove job postings or sources in PostgreSQL, or uploaded attachment files.

With the default `DB_PATH`, reset SQLite manually by stopping the API and removing its database and any SQLite sidecar files, then restarting the API:

```sh
rm -f data/job-app.db data/job-app.db-shm data/job-app.db-wal
npm run dev
```

The API recreates the schema and seeds the candidate profile on startup. This does not affect PostgreSQL job data.

For a completely fresh install of both databases, first reset SQLite using one of the methods above, then stop the ingestion service and remove its PostgreSQL container and data volume. This permanently deletes all ingested postings, sources, and sync tasks:

```sh
docker rm -f eats-postgres
docker volume rm eats-postgres-data
bash devTools/infrastart.sh
```

Then restart the ingestion service; it recreates the database and loads sources from the configured Workday JSON file.

## Checks

```sh
npm run verify
npm run frontend:build
dotnet test Eats.Ingestion.Tests/Eats.Ingestion.Tests.csproj
```
