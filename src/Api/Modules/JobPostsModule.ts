import { Module } from "@nestjs/common";
import { JobPostService } from "../../Application/JobPost/JobPostService";
import { InfrastructureModule } from "../../Infrastructure/InfrastructureModule";
import { TOKENS } from "../../DependencyInjection/tokens";
import { JobPostsController } from "../Controllers/JobPostsController";

@Module({
    imports: [InfrastructureModule],
    controllers: [JobPostsController],
    providers: [
        {
            provide: TOKENS.jobPostService,
            inject: [TOKENS.jobPostGateway, TOKENS.jobPostQueries, TOKENS.logger],
            useFactory: (gateway, queries, logger) => new JobPostService(gateway, queries, logger),
        },
    ],
})
export class JobPostsModule {}
