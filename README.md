# Employment Application & Alignment Tracking System (EATS)

A candidate-side job discovery, evaluation, and application tracking system built with TypeScript.

EATS retrieves job postings from supported career sites, normalizes them into a common domain model, evaluates their compatibility with a candidate profile, and ranks opportunities to help focus a job search on the strongest matches.

The application is designed to assist the candidate rather than automatically submit applications.

## Overview

EATS helps manage the job-search lifecycle by:

- Retrieving job postings from supported job sources
- Normalizing provider-specific job data into a common model
- Screening jobs against candidate requirements and constraints
- Evaluating alignment with skills, experience, career goals, and preferences
- Calculating compatibility scores for ranking opportunities
- Persisting jobs and evaluation results locally
- Providing an extensible architecture for additional job sources and evaluation strategies

## How It Works

At a high level:

```text
Job Sources
    ↓
Job Retrieval / Normalization
    ↓
Candidate Screening
    ↓
LLM Evaluation
    ↓
Compatibility Scoring
    ↓
Persistence
    ↓
Analysis
```

Provider-specific infrastructure is kept separate from the application and evaluation layers so additional job sources or evaluation implementations can be introduced without changing the core domain logic.

## Project Structure

```
src/
├── Api/                 # Fastify HTTP host, routes, and route contracts
├── Application/         # Application workflows and orchestration
│   ├── DependencyInjection/  # Dependency registration
│   ├── JobAssessment/        # Job screening, scoring, and requirement evaluation
│   ├── JobCandidateProfiles/ # Candidate profile CRUD workflows
│   ├── JobPostDiscovery/     # Job retrieval workflows (e.g. Workday)
│   ├── JobPostSync/          # Background job-post sync + queue
│   ├── JobSources/           # Job source management
│   └── Pipelines/            # Reusable pipeline execution engine
├── Domain/              # Core application models and contracts
│   ├── Candidates/      # Candidate profile definitions
│   ├── JobAssessment/   # Assessment-related domain models
│   ├── JobPosts/        # Job posting models and lookup contracts
│   └── JobSources/      # Job source domain models
├── Examples/            # Example/template data (e.g. candidateProfiles.example.json)
└── Infrastructure/      # External systems and persistence
    ├── Inference/       # LLM provider integrations (OpenAI-compatible / Ollama)
    ├── JobSources/      # Job-source integrations (e.g. Workday)
    ├── Logging/         # Logging implementations
    └── Persistence/     # SQLite repositories and queues

client/                  # React + Vite single-page frontend
└── src/
    ├── components/      # Modals, toasts, and other shared UI components
    ├── hooks/           # Data-fetching and polling hooks
    ├── pages/           # Top-level pages (Job Posts, Candidate Profiles)
    ├── services/        # Framework-agnostic client services (e.g. job queue polling)
    └── types/           # Client-side type definitions mirroring the API contracts

data/                    # Runtime data, gitignored (see "Data Files" below)
├── JobSources/workdaySources.json
├── CandidateProfiles/candidateProfile.json
└── job-app.db
```

## Technology Stack

- Language: TypeScript (backend and frontend)
- Backend Runtime: Node.js + Fastify (REST API at `/api/v1`)
- Frontend: React + Vite (served separately from the API in development)
- Database: SQLite (active; stores job sources, job posts, candidate profiles, assessments, and background job queues)
- LLM Runtime: Ollama by default, with optional OpenAI-compatible provider support
- Job Sources: Workday-hosted career sites
- Architecture: Layered architecture with dependency injection
- Testing: Vitest for both the backend (`src/`) and frontend (`client/src/`)

## Getting Started

### Prerequisites

- Current Node.js LTS
- npm
- Ollama (unless you configure an OpenAI-compatible provider instead)

### Installation

Install backend dependencies from the repository root, then install frontend dependencies in `client/`:

```
npm install
cd client && npm install
```

### Environment Configuration

Copy the example environment file and fill in values for your machine:

```
cp .envExample .env
```

| Variable                  | Required | Description                                                              |
| ------------------------- | -------- | ------------------------------------------------------------------------ |
| `DB_PATH`                 | Yes      | Path to the SQLite database file (e.g. `./data/job-app.db`).             |
| `API_PORT`                | No       | Port the API server listens on. Defaults to `3000`.                      |
| `WORKDAY_SOURCES`         | Yes      | Path to the Workday job sources JSON file (see "Job Sources" below).     |
| `CANDIDATE_PROFILE`       | Yes      | Path to the candidate profile JSON file (see "Candidate Profile" below). |
| `OLLAMA_BASE_URL`         | Yes      | Base URL of the local Ollama server.                                     |
| `OLLAMA_MODEL`            | Yes      | Ollama model name used for job evaluation.                               |
| `OPENAI_PROVIDER_API_KEY` | No       | If set, uses an OpenAI-compatible provider instead of Ollama.            |

### Candidate Profile Configuration

The repository contains an example candidate profile that can be used as a template:

`src/Examples/candidateProfiles.example.json`

Copy it to the path referenced by `CANDIDATE_PROFILE` in your `.env` file:

`data/CandidateProfiles/candidateProfile.json`

Then customize the local profile with your own:

- Skills and proficiency levels
- Professional experience
- Career strengths
- Desired work
- Growth areas
- Compensation preferences
- Work arrangements and locations
- Hard constraints

On first run, if no candidate profiles exist in the database, this file is automatically seeded. `data/` is gitignored, so this file contains private candidate information and is intentionally excluded from source control.

Do not commit personal candidate data to the repository.

### Job Sources

Workday sources are configured in the file referenced by `WORKDAY_SOURCES` in your `.env` file:

`data/JobSources/workdaySources.json`

On first run, if no job sources exist in the database, this file is automatically seeded. Additional Workday-hosted career sites can be added through the existing source configuration.

### Ollama

Ensure Ollama is installed and running before starting the application, unless `OPENAI_PROVIDER_API_KEY` is set to use an OpenAI-compatible provider instead.

The LLM implementation is accessed through an abstraction so model and provider implementations can be changed independently of the job-evaluation workflow.

## Usage

All commands below are run from the repository root unless noted otherwise.

### Backend API

| Command       | Description                                             |
| ------------- | ------------------------------------------------------- |
| `npm start`   | Start the API server once.                              |
| `npm run dev` | Start the API server with auto-restart on file changes. |

The API server starts at `http://localhost:3000` (or `API_PORT`), with routes mounted under `/api/v1` and a health check at `/health`.

### Frontend

| Command                    | Description                                                           |
| -------------------------- | --------------------------------------------------------------------- |
| `npm run frontend:dev`     | Start the Vite dev server (`client/`) at `http://localhost:3001`.     |
| `npm run frontend:build`   | Build the frontend for production into `client/dist`.                 |
| `npm run frontend:preview` | Preview the production frontend build locally.                        |
| `npm run dev:full`         | Start both the backend (watch mode) and frontend dev server together. |

The frontend dev server proxies `/api` requests to the backend at `http://localhost:3000`, so the backend must be running (e.g. via `npm run dev`) for the frontend to function.

### Pre-run Validation

Run typescript validation:
`npm run typecheck`

Run backend + frontend validation together:
`npm run verify`

## Features

### Job Source Integration

Retrieves job postings from Workday-hosted career sites and maps provider-specific responses into a normalized job representation.

### Candidate Screening

Filters opportunities based on candidate requirements and practical constraints before performing more expensive detailed evaluation.

### Job Compatibility Evaluation

Evaluates job requirements against candidate experience, skills, preferences, and career direction using a locally hosted LLM.

### Compatibility Scoring (WIP)

Uses structured evaluation results and deterministic scoring logic to rank job opportunities. Scoring remains a work in progress.

### Local-First AI (Support your local AI!)

This project supports local AI through Ollama. Candidate profile information and job-evaluation prompts can remain on the local machine, while development and testing avoid charges associated with hosted LLM APIs.

### Persistence

SQLite persistence is implemented for job sources, discovered job posts, candidate profiles, job assessments, and the background job queues used for syncing job posts and running assessments.

### Extensible Architecture

Job-source integrations, model connections, evaluators, and compatibility calculators are separated behind application boundaries so implementations can be replaced or extended independently.

## Privacy

Candidate profiles may contain résumé-level personal information and should not be committed to source control.

The repository includes a generic example profile for configuration guidance while the actual local candidate profile is excluded through `.gitignore`.

## Testing

### Backend Tests

From the repository root:

| Command             | Description                                     |
| ------------------- | ----------------------------------------------- |
| `npm test`          | Run backend tests in watch mode.                |
| `npm run test:run`  | Run backend tests once (CI-friendly).           |
| `npm run typecheck` | Type-check the backend without emitting output. |
| `npm run verify`    | Run `typecheck` followed by `test:run`.         |

### Frontend Tests

From the `client/` directory:

```
cd client
npx vitest run
```

Omit `run` (`npx vitest`) to run frontend tests in watch mode. To run a single test file:

```
npx vitest run src/services/JobQueuePollingManager.test.ts
```
