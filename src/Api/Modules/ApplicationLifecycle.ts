import { Inject, Injectable, OnApplicationBootstrap, OnApplicationShutdown } from "@nestjs/common";
import { IJobAssessmentQueueWorkerService } from "../../Application/JobAssessment/PipelineQueue/IJobAssessmentQueueWorkerService";
import { IJobPostSyncWorkerService } from "../../Application/JobPost/IJobPostSyncWorkerService";
import { IJobCandidateProfileService } from "../../Application/JobCandidateProfiles/IJobCandidateProfileService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { SqliteDatabaseConnection } from "../../Infrastructure/Persistence/JobPost/Sqlite/SqliteDatabaseConnection";
import { TOKENS } from "../../DependencyInjection/tokens";

@Injectable()
export class ApplicationLifecycle implements OnApplicationBootstrap, OnApplicationShutdown {
    private workerTask?: Promise<void>;
    private jobPostSyncWorkerTask?: Promise<void>;

    constructor(
        @Inject(TOKENS.jobAssessmentQueueWorkerService)
        private readonly queueWorker: IJobAssessmentQueueWorkerService,
        @Inject(TOKENS.jobPostSyncWorkerService)
        private readonly jobPostSyncWorker: IJobPostSyncWorkerService,
        @Inject(TOKENS.candidateProfileService)
        private readonly candidateProfiles: IJobCandidateProfileService,
        @Inject(SqliteDatabaseConnection)
        private readonly database: SqliteDatabaseConnection,
        @Inject(TOKENS.logger)
        private readonly logger: ILogger
    ) {}

    async onApplicationBootstrap(): Promise<void> {
        const existingProfiles = await this.candidateProfiles.getCandidateProfiles();
        if (existingProfiles.length === 0) {
            await this.candidateProfiles.seedCandidateProfilesWithDefault();
        }

        this.workerTask = this.queueWorker.start({ freqMs: 1000 }).catch(error => {
            this.logger.error(`Assessment queue worker stopped unexpectedly: ${error}`);
        });
        this.jobPostSyncWorkerTask = this.jobPostSyncWorker.start({ freqMs: 3 * 60 * 60 * 1000 }).catch(error => {
            this.logger.error(`Job post sync worker stopped unexpectedly: ${error}`);
        });
    }

    async onApplicationShutdown(): Promise<void> {
        this.queueWorker.stop();
        this.jobPostSyncWorker.stop();
        await this.workerTask;
        await this.jobPostSyncWorkerTask;
        this.database.close();
    }
}
