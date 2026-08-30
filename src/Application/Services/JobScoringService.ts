import { IJobPostingDetail } from "../../Infrastructure/APIs/JobSources/IJobPostingDetail";
import { ICandidateProfile, IJobScoreEvaluation } from "../../Evaluators/ShortlistEvaluator/types";
import { IJobScoreEvaluator } from "../../Evaluators/ShortlistEvaluator/IJobScoreEvaluator";

export interface IJobScoringService {
    evaluate(profile: ICandidateProfile, jobs: IJobPostingDetail[]): Promise<IJobScoreEvaluation[]>;
}

export class JobScoringService implements IJobScoringService {
    constructor(private readonly evaluator: IJobScoreEvaluator) {}

    async evaluate(profile: ICandidateProfile, jobs: IJobPostingDetail[]): Promise<IJobScoreEvaluation[]> {
        const evaluations: IJobScoreEvaluation[] = [];

        for (const job of jobs) {
            const evaluation = await this.evaluator.evaluate(profile, job);

            evaluations.push(evaluation);
        }

        return evaluations;
    }
}
