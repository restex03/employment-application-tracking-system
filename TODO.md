# TODO

## Original prompt (remaining todo should roughly map to this list):

provide a todo.md:

1. Add service layer that pulls all relavant jobs from gateways and uses mapper to return IJobSearchResult[] compatible result
2. Update index.ts to use service layer to get the jobs, then pass list of jobs to llm by calling new GroqJobEvaluator().evaluate(profiles.profile\_08\_23\_2026, jobs); and print each result of type IJobEvaluation to console with pretty print

## 1. Add service layer to aggregate relevant jobs

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
    getPostings(results: IJobSearchResult[]): Promise<IJobPosting[]>;
}
```

### Acceptance Criteria

- One service call can collect jobs from all configured gateways.
- Gateway-specific response models do not leak beyond the mapping layer.
- The service returns the type expected by `GroqJobEvaluator.evaluate()`.

---

## 2. Update `index.ts` to run the full pipeline

- [ ] Instantiate/configure the job gateways.
- [ ] Instantiate the mapper(s).
- [ ] Instantiate the service layer.
- [ ] Retrieve the relevant jobs through the service layer.
- [ ] Instantiate `GroqJobEvaluator`.
- [ ] Evaluate the jobs using:

```ts
const evaluations = await new GroqJobEvaluator().evaluate(profiles.profile_08_23_2026, jobs);
```

- [ ] Pretty-print each `IJobEvaluation` to the console.
- [ ] Sort results by `overallScore` descending before printing.
- [ ] Include enough identifying information to associate each evaluation with its job.
- [ ] Handle and log failures cleanly.

### Suggested `index.ts`

```ts
async function main(): Promise<void> {
    const jobs = await jobSearchService.getRelevantJobs();

    const evaluations = await new GroqJobEvaluator().evaluate(profiles.profile_08_23_2026, jobs);

    evaluations
        .sort((a, b) => b.overallScore - a.overallScore)
        .forEach((evaluation: IJobEvaluation) => {
            console.dir(evaluation, {
                depth: null,
                colors: true,
            });
        });
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
