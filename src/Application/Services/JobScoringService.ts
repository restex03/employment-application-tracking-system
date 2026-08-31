import { IJobPostingDetail } from "../../Infrastructure/APIs/JobSources/IJobPostingDetail";
import { ICandidateProfile } from "../../Evaluators/ScoreEvaluator/types";
import { IJobMatchEvidence } from "../../Evaluators/ScoreEvaluator/IJobMatchEvidence";
import { IJobMatchEvidenceEvaluator } from "../../Evaluators/ScoreEvaluator/IJobMatchEvidenceEvaluator";
import { ILogger } from "../Common/Logging/ILogger";

export interface IJobScoringService {
    score(profile: ICandidateProfile, jobs: IJobPostingDetail[]): Promise<IJobMatchEvidence[]>;
}

export class JobScoringService implements IJobScoringService {
    constructor(
        private readonly evaluator: IJobMatchEvidenceEvaluator,
        private readonly logger: ILogger
    ) {}

    async score(profile: ICandidateProfile, jobs: IJobPostingDetail[]): Promise<IJobMatchEvidence[]> {
        this.logger.info(`[JobScoringService.score] Scoring ${jobs.length} jobs...`);
        const evaluations: IJobMatchEvidence[] = [];

        for (const job of jobs) {
            const jobInfo = `${job.company} - ${job.requisitionId} (${job.title})`;
            this.logger.info(`[JobScoringService.score] Scoring job: ${jobInfo}`);
            const evaluation = await this.evaluator.evaluate(profile, job);
            evaluations.push(evaluation);
        }

        return evaluations;
    }
}
