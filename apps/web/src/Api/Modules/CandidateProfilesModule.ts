import { Module } from "@nestjs/common";
import { JobCandidateProfileService } from "../../Application/JobCandidateProfiles/JobCandidateProfileService";
import { InfrastructureModule } from "../../Infrastructure/InfrastructureModule";
import { TOKENS } from "../../DependencyInjection/tokens";
import { CandidateProfilesController } from "../Controllers/CandidateProfilesController";

@Module({
    imports: [InfrastructureModule],
    controllers: [CandidateProfilesController],
    providers: [
        {
            provide: TOKENS.candidateProfileService,
            inject: [TOKENS.candidateProfileRepository, TOKENS.logger],
            useFactory: (repository, logger) => new JobCandidateProfileService(repository, logger),
        },
    ],
    exports: [TOKENS.candidateProfileService],
})
export class CandidateProfilesModule {}
