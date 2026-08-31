import { ICandidateProfile } from "../../../Domain/Candidates/ICandidateProfile";
import { IJobPostDetail } from "../../../Domain/JobPosts/IJobPostDetail";
import { IJobMatchEvidence } from "../../../Evaluators/ScoreEvaluator/IJobMatchEvidence";
import { IJobMatchEvidenceEvaluator } from "../../../Evaluators/ScoreEvaluator/IJobMatchEvidenceEvaluator";
import { ILogger } from "../../../Infrastructure/Logging/ILogger";
import { IJobScoringService } from "./IJobScoringService";

export class JobScoringService implements IJobScoringService {
    constructor(
        private readonly evaluator: IJobMatchEvidenceEvaluator,
        private readonly logger: ILogger
    ) {}

    async score(profile: ICandidateProfile, jobs: IJobPostDetail[]): Promise<IJobMatchEvidence[]> {
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
