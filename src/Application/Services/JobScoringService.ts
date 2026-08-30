import { IJobPostingDetail } from "../../Infrastructure/APIs/JobSources/IJobPostingDetail";
import { ICandidateProfile, IJobScoreEvaluation } from "../../Evaluators/ScoreEvaluator/types";
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
            this.logger.info(`\t- Overall Score: ${evaluation.overallScore}`);
            this.logger.info(`\t\t- Career Growth: ${evaluation.scores.careerGrowth}`);
            this.logger.info(`\t\t- Compensation Fit: ${evaluation.scores.compensationFit}`);
            this.logger.info(`\t\t- Skill Fit: ${evaluation.scores.currentSkillFit}`);
            this.logger.info(`\t\t- Experience Fit: ${evaluation.scores.experienceFit}`);
            this.logger.info(`\t\t- Location Fit: ${evaluation.scores.locationFit}`);
            this.logger.info(`\t\t- Skill Portability: ${evaluation.scores.skillPortability}`);
            this.logger.info(`\t\t- Work Fit: ${evaluation.scores.workFit}`);
            this.logger.info(`\t- Confidence: ${evaluation.confidence}`);
            this.logger.info(` \n`);
            evaluations.push(evaluation);
        }

        return evaluations;
    }
}
