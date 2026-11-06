import { Module } from "@nestjs/common";
import { JobPostService } from "../../Application/JobPost/JobPostService";
import { JobPostSyncWorkerService } from "../../Application/JobPost/JobPostSyncWorkerService";
import { IJobPostSyncWorkerService } from "../../Application/JobPost/IJobPostSyncWorkerService";
import { IJobPostGateway } from "../../Infrastructure/JobPosts/IJobPostGateway";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostService } from "../../Application/JobPost/IJobPostService";
import { IJobPostRepository } from "../../Infrastructure/Persistence/JobPost/IJobPostRepository";
import { InfrastructureModule } from "../../Infrastructure/InfrastructureModule";
import { TOKENS } from "../../DependencyInjection/tokens";
import { JobPostsController } from "../Controllers/JobPostsController";

@Module({
    imports: [InfrastructureModule],
    controllers: [JobPostsController],
    providers: [
        {
            provide: TOKENS.jobPostService,
            inject: [TOKENS.jobPostRepository, TOKENS.jobPostQueries, TOKENS.jobPostGateway, TOKENS.logger],
            useFactory: (repository, queries, gateway, logger): IJobPostService =>
                new JobPostService(repository, queries, gateway, logger),
        },
        {
            provide: TOKENS.jobPostSyncWorkerService,
            inject: [TOKENS.jobPostService, TOKENS.jobPostRepository, TOKENS.logger],
            useFactory: (
                service: IJobPostService,
                repository: IJobPostRepository,
                logger: ILogger
            ): IJobPostSyncWorkerService => new JobPostSyncWorkerService(service, repository, logger),
        },
    ],
    exports: [TOKENS.jobPostSyncWorkerService],
})
export class JobPostsModule {}
