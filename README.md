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
Persistence
    ↓
Analysis
```

Provider-specific infrastructure is kept separate from the application and evaluation layers so additional job sources or evaluation implementations can be introduced without changing the core domain logic.

## Project Structure

```
src/
├── Application/ # Application workflows and orchestration
│ ├── DependencyInjection/ # Dependency registration
│ ├── JobAssessment/ # Job screening and requirement evaluation
│ ├── JobDiscovery/ # Job retrieval workflows
│ └── Pipelines/ # Reusable pipeline execution & future paralelization
│
├── data/ # Application seed and candidate profile data
│
├── Domain/ # Core application models and contracts
│ ├── Candidates/ # Candidate profile definitions
│ ├── JobAssessment/ # Assessment-related domain models
│ └── JobPosts/ # Job posting models and lookup contracts
│
└── Infrastructure/ # External systems and persistence
    ├── Inference/ # LLM provider integrations
    ├── JobSources/ # Job-source integrations
    ├── Logging/ # Logging implementations
    └── Persistence/ # Database repositories

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

`src/data/candidateProfiles.example.jsonc`

to

`src/data/candidateProfiles.jsonc`

Then customize the local profile with your own:

- Skills and proficiency levels
- Professional experience
- Career strengths
- Desired work
- Growth areas
- Compensation preferences
- Work arrangements and locations
- Hard constraints

`candidateProfiles.jsonc` contains private candidate information and is intentionally excluded from source control.

Do not commit personal candidate data to the repository.

## Job Sources

Workday sources are configured in the following data file and seeded into the database when the
application starts.
`data\JobSources\workdaySources.json`

Additional Workday-hosted career sites can be added through the existing source configuration.

## Ollama

Ensure Ollama is installed and running before starting the application.

The LLM implementation is accessed through an abstraction so model and provider implementations can be changed independently of the job-evaluation workflow.

## Usage

Start the scripted application workflow:
`npm start`

Start the scripted workflow and write console output to `output.txt`:
`npm run start:tee`

Start the alternative API entry point (WIP; may be broken):
`npm run api`

### Pre-run Validation

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

### Compatibility Scoring (WIP)

Uses structured evaluation results and deterministic scoring logic to rank job opportunities. Scoring remains a work in progress.

### Local-First AI (Support your local AI!)

This project supports local AI through Ollama. Candidate profile information and job-evaluation prompts can remain on the local machine, while development and testing avoid charges associated with hosted LLM APIs.

### Persistence

SQLite persistence is implemented for job sources and discovered job posts. Persistence for additional evaluation data remains a work in progress.

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
