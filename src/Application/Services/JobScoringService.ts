import { IJobPostingDetail } from "../../Infrastructure/APIs/JobSources/IJobPostingDetail";
import { ICandidateProfile, IJobEvaluation } from "../../Evaluators/ShortlistEvaluator/types";
import { IJobEvaluator } from "../../Evaluators/ShortlistEvaluator/IJobEvaluator";
export class JobScoringService {
    constructor(private readonly evaluator: IJobEvaluator) {}

    async evaluate(profile: ICandidateProfile, jobs: IJobPostingDetail[]): Promise<IJobEvaluation[]> {
        const evaluations: IJobEvaluation[] = [];

        for (const job of jobs) {
            const evaluation = await this.evaluator.evaluate(profile, job);

            evaluations.push(evaluation);
        }

        return evaluations;
    }
}
