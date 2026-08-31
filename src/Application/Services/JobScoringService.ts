import { IJobPostingDetail } from "../../Infrastructure/APIs/JobSources/IJobPostingDetail";
import { ICandidateProfile } from "../../Evaluators/ScoreEvaluator/types";
import { type IJobScoreEvaluation } from "../../Evaluators/ScoreEvaluator/IJobScoreEvaluation";
import { IJobScoreEvaluator } from "../../Evaluators/ScoreEvaluator/IJobScoreEvaluator";
import { ILogger } from "../Common/Logging/ILogger";

export interface IJobScoringService {
    score(profile: ICandidateProfile, jobs: IJobPostingDetail[]): Promise<IJobScoreEvaluation[]>;
}

export class JobScoringService implements IJobScoringService {
    constructor(
        private readonly evaluator: IJobScoreEvaluator,
        private readonly logger: ILogger
    ) {}

    async score(profile: ICandidateProfile, jobs: IJobPostingDetail[]): Promise<IJobScoreEvaluation[]> {
        this.logger.info(`[JobScoringService.score] Scoring ${jobs.length} jobs...`);
        const evaluations: IJobScoreEvaluation[] = [];

        for (const job of jobs) {
            const jobInfo = `${job.company} - ${job.requisitionId} (${job.title})`;
            this.logger.info(`[JobScoringService.score] Scoring job: ${jobInfo}`);
            const evaluation = await this.evaluator.evaluate(profile, job);
            evaluations.push(evaluation);
        }

        return evaluations;
    }
}
