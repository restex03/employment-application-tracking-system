# Employment Application Tracking System (EATS)

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
Persistence / Application Workflow
```

Provider-specific infrastructure is kept separate from the application and evaluation layers so additional job sources or evaluation implementations can be introduced without changing the core domain logic.

## Project Structure

```
src/
├── Application/ # Application orchestration and services
│ ├── Common/ # Shared application utilities
│ ├── DependencyInjection/ # Dependency registration
│ ├── Services/ # Application services
│ └── WorkdaySources/ # Configured Workday sources
│
├── Evaluators/ # Job evaluation strategies
│ ├── JobScreenEvaluator/ # Initial candidate/job screening
│ └── ScoreEvaluator/ # Detailed compatibility evaluation
│
├── Infrastructure/ # External systems and persistence
│ ├── APIs/ # Job-source integrations
│ └── Persistence/ # Database repositories
│
├── JobCandidateProfile/ # Candidate profile definitions
│
└── JobCompatibilityCalculators/ # Deterministic compatibility scoring

```

## Technology Stack

- Language: TypeScript
- Runtime: Node.js
- Database: SQLite (currently dormant)
- LLM Runtime: Ollama
- Job Sources: Workday-hosted career sites
- Architecture: Layered architecture with dependency injection
- Testing: Automated unit tests for application and scoring behavior

## Getting Started

Prerequisites

- Current Node.js LTS
- npm
- Ollama

## Installation

`npm install`

## Candidate Profile Configuration

The repository contains an example candidate profile that can be used as a template.

## Copy:

`src/JobCandidateProfile/candidateProfiles.example.ts`

to

`src/JobCandidateProfile/candidateProfiles.ts`

Then customize the local profile with your own:

- Skills and proficiency levels
- Professional experience
- Career strengths
- Desired work
- Growth areas
- Compensation preferences
- Work arrangements and locations
- Hard constraints

`candidateProfiles.ts` contains private candidate information and is intentionally excluded from source control.

Do not commit personal candidate data to the repository.

## Job Sources

Workday sources are configured in:
`src/Application/WorkdaySources/workdaySources.ts`

Additional Workday-hosted career sites can be added through the existing source configuration.

## Ollama

Ensure Ollama is installed and running before starting the application.

The LLM implementation is accessed through an abstraction so model and provider implementations can be changed independently of the job-evaluation workflow.

## Usage

Start the application:
`npm start`

Run typescript validation:
`npm run typecheck`

Run tests:
`npm test`

## Features

### Job Source Integration

Retrieves job postings from Workday-hosted career sites and maps provider-specific responses into a normalized job representation.

### Candidate Screening

Filters opportunities based on candidate requirements and practical constraints before performing more expensive detailed evaluation.

### Job Compatibility Evaluation

Evaluates job requirements against candidate experience, skills, preferences, and career direction using a locally hosted LLM.

### Compatibility Scoring

Uses structured evaluation results and deterministic scoring logic to rank job opportunities.

### Local-First AI

Supports local LLM inference through Ollama, allowing candidate profile information and job-evaluation prompts to remain on the local machine.

### Persistence

Currently dormant. Plans to use SQLite to persist job and evaluation data locally are currently in the works.

### Extensible Architecture

Job-source integrations, model connections, evaluators, and compatibility calculators are separated behind application boundaries so implementations can be replaced or extended independently.

## Privacy

Candidate profiles may contain résumé-level personal information and should not be committed to source control.

The repository includes a generic example profile for configuration guidance while the actual local candidate profile is excluded through `.gitignore`.

## Development

```

# Type checking

npm run typecheck

# Tests

npm test

# Run application

npm start

```
