import { IJobPostingDetail } from "../../Infrastructure/APIs/JobSources/IJobPostingDetail";
import { ICandidateProfile, IJobMatchEvaluation } from "../../Evaluators/ShortlistEvaluator/types";
import { IJobMatchEvaluator } from "../../Evaluators/ShortlistEvaluator/IJobMatchEvaluator";
export class JobScoringService {
    constructor(private readonly evaluator: IJobMatchEvaluator) {}

    async evaluate(profile: ICandidateProfile, jobs: IJobPostingDetail[]): Promise<IJobMatchEvaluation[]> {
        const evaluations: IJobMatchEvaluation[] = [];

        for (const job of jobs) {
            const evaluation = await this.evaluator.evaluate(profile, job);

            evaluations.push(evaluation);
        }

        return evaluations;
    }
}
