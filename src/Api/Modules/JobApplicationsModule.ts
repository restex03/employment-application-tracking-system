import { Module } from "@nestjs/common";
import { JobApplicationService } from "../../Application/JobApplications/JobApplicationService";
import { InfrastructureModule } from "../../Infrastructure/InfrastructureModule";
import { TOKENS } from "../../DependencyInjection/tokens";
import { AttachmentsController } from "../Controllers/AttachmentsController";
import { JobApplicationsController } from "../Controllers/JobApplicationsController";

@Module({
    imports: [InfrastructureModule],
    controllers: [AttachmentsController, JobApplicationsController],
    providers: [
        {
            provide: TOKENS.jobApplicationService,
            inject: [TOKENS.jobApplicationRepository, TOKENS.fileSystemRepository, TOKENS.logger],
            useFactory: (repository, fileSystem, logger) => new JobApplicationService(repository, fileSystem, logger),
        },
    ],
    exports: [TOKENS.jobApplicationService],
})
export class JobApplicationsModule {}
