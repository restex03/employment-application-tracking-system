# TODO


## Original prompt (remaining todo should roughly map to this list):
provide a todo.md:

1. Update gateways to inherit from IJobSource
2. Create mapper to map from jobs search response model to IJobSearchResult compatible result.
3. Add service layer that pulls all relavant jobs from gateways and uses mapper to return IJobSearchResult[] compatible result
4. Update index.ts to use service layer to get the jobs, then pass list of jobs to llm by calling new GroqJobEvaluator().evaluate(profiles.profile\_08\_23\_2026, jobs); and print each result of type IJobEvaluation to console with pretty print

## 1. Update gateways to implement `IJobSource`

- [ ] Update each existing job gateway to implement `IJobSource`.
- [ ] Ensure each gateway exposes the methods required by the interface.
- [ ] Remove duplicated company-specific source logic where a shared Workday implementation/configuration can be used.
- [ ] Verify Workday-backed sources such as Travelers, CrowdStrike, and Workday can share the common job-detail model/parser.
- [ ] Confirm each gateway correctly identifies its company/source metadata.

### Acceptance Criteria

- Every job gateway conforms to `IJobSource`.
- Consumers can depend on `IJobSource` instead of concrete gateway classes.
- Existing gateway behavior continues to work after the interface change.

---

## 2. Create mapper from job-search response models to `IJobSearchResult`

- [ ] Create a mapper responsible for converting each gateway's raw search result model into `IJobSearchResult`.
- [ ] Normalize at least:
  - [ ] `id`
  - [ ] `requisitionId`
  - [ ] `title`
  - [ ] `company`
  - [ ] `source`
  - [ ] `ats`
  - [ ] `url`
  - [ ] `locations`
  - [ ] `rawLocationText`
  - [ ] `postedDate`
- [ ] Preserve useful source-specific values under `metadata` where appropriate.
- [ ] Prefer stable requisition IDs for `id` when available.
- [ ] Fall back to a stable URL or source-specific identifier when a requisition ID is unavailable.
- [ ] Add mapper tests for representative Workday/Travelers/CrowdStrike search results.

### Acceptance Criteria

- Every gateway search result can be converted into a valid `IJobSearchResult`.
- Downstream services do not need to understand gateway-specific response shapes.
- Mapping behavior is deterministic and covered by basic tests.

---

## 3. Add service layer to aggregate relevant jobs

- [ ] Create a job-search/application service that depends on one or more `IJobSource` implementations.
- [ ] Call all configured gateways to retrieve available jobs.
- [ ] Use the mapper to normalize gateway responses into `IJobSearchResult[]`.
- [ ] Combine results from all sources into one collection.
- [ ] Deduplicate jobs where practical.
- [ ] Apply cheap deterministic filters before invoking the LLM, such as:
  - [ ] location/work arrangement
  - [ ] employment type
  - [ ] clearly unacceptable compensation when known
  - [ ] duplicate requisitions
- [ ] Return the final normalized list as `IJobSearchResult[]`.
- [ ] Decide whether LLM evaluation requires:
  - [ ] only `IJobSearchResult[]`, or
  - [ ] fetching job details and normalizing them into `IJobPosting[]` first.
- [ ] If `GroqJobEvaluator.evaluate()` continues to accept `IJobPosting[]`, add the detail-fetch/normalization step in this service before evaluation.

### Suggested Shape

```ts
export interface IJobSearchService {
    getRelevantJobs(): Promise<IJobPosting[]>;
}
```

or, if keeping search and detail stages separate:

```ts
export interface IJobSearchService {
    search(): Promise<IJobSearchResult[]>;
    getPostings(
        results: IJobSearchResult[],
    ): Promise<IJobPosting[]>;
}
```

### Acceptance Criteria

- One service call can collect jobs from all configured gateways.
- Gateway-specific response models do not leak beyond the mapping layer.
- The service returns the type expected by `GroqJobEvaluator.evaluate()`.

---

## 4. Update `index.ts` to run the full pipeline

- [ ] Instantiate/configure the job gateways.
- [ ] Instantiate the mapper(s).
- [ ] Instantiate the service layer.
- [ ] Retrieve the relevant jobs through the service layer.
- [ ] Instantiate `GroqJobEvaluator`.
- [ ] Evaluate the jobs using:

```ts
const evaluations =
    await new GroqJobEvaluator().evaluate(
        profiles.profile_08_23_2026,
        jobs,
    );
```

- [ ] Pretty-print each `IJobEvaluation` to the console.
- [ ] Sort results by `overallScore` descending before printing.
- [ ] Include enough identifying information to associate each evaluation with its job.
- [ ] Handle and log failures cleanly.

### Suggested `index.ts`

```ts
async function main(): Promise<void> {
    const jobs =
        await jobSearchService.getRelevantJobs();

    const evaluations =
        await new GroqJobEvaluator().evaluate(
            profiles.profile_08_23_2026,
            jobs,
        );

    evaluations
        .sort(
            (a, b) =>
                b.overallScore -
                a.overallScore,
        )
        .forEach(
            (evaluation: IJobEvaluation) => {
                console.dir(
                    evaluation,
                    {
                        depth: null,
                        colors: true,
                    },
                );
            },
        );
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
```

### Acceptance Criteria

- Running `index.ts` executes the full flow:
  1. collect jobs
  2. normalize/filter jobs
  3. evaluate jobs with Groq
  4. calculate application-owned scores
  5. print ranked `IJobEvaluation` results
- Empty job lists are handled without error.
- Groq/Zod validation failures are surfaced clearly.
- No API keys are hard-coded in source.

---

## End-to-End Target

```text
Job Gateways
    ↓
IJobSource
    ↓
Search Response Mapper
    ↓
IJobSearchResult[]
    ↓
Job Search Service
    ↓
Detail Fetch + Normalization
    ↓
IJobPosting[]
    ↓
GroqJobEvaluator
    ↓
Zod Validation
    ↓
IJobEvaluation[]
    ↓
Sort + Pretty Print
```
