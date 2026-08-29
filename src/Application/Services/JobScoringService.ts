import { IJobPostingDetail } from "../../APIs/JobSources/IJobPostingDetail";
import { ICandidateProfile, IJobEvaluation } from "../../JobEvaluators/types";
import { IJobEvaluator } from "../../JobEvaluators/IJobEvaluator";
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
