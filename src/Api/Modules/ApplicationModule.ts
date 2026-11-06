import { Module } from "@nestjs/common";
import { InfrastructureModule } from "../../Infrastructure/InfrastructureModule";
import { AssessmentsModule } from "./AssessmentsModule";
import { CandidateProfilesModule } from "./CandidateProfilesModule";
import { JobApplicationsModule } from "./JobApplicationsModule";
import { JobPostSyncsModule } from "./JobPostSyncsModule";
import { JobPostsModule } from "./JobPostsModule";
import { JobSourcesModule } from "./JobSourcesModule";
import { ToolsController } from "../Controllers/ToolsController";
import { HealthController } from "../Controllers/HealthController";
import { ApplicationLifecycle } from "./ApplicationLifecycle";

@Module({
    imports: [
        InfrastructureModule,
        CandidateProfilesModule,
        JobPostsModule,
        JobApplicationsModule,
        JobSourcesModule,
        JobPostSyncsModule,
        AssessmentsModule,
    ],
    controllers: [HealthController, ToolsController],
    providers: [ApplicationLifecycle],
})
export class ApplicationModule {}
