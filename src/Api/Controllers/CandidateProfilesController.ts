import { Body, Controller, Get, Inject, NotFoundException, Param, Post } from "@nestjs/common";
import { z } from "zod";
import { IJobCandidateProfileService } from "../../Application/JobCandidateProfiles/IJobCandidateProfileService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { TOKENS } from "../../DependencyInjection/tokens";
import { candidateProfileBodySchema, candidateProfileParamsSchema } from "../Schemas/ApiRouteSchemas";
import { throwInternalError } from "./controller-errors";

@Controller("candidate-profiles")
export class CandidateProfilesController {
    constructor(
        @Inject(TOKENS.candidateProfileService) private readonly profiles: IJobCandidateProfileService,
        @Inject(TOKENS.logger) private readonly logger: ILogger
    ) {}

    @Get()
    async getAll() {
        const context = "[GET] /api/v1/candidate-profiles";
        this.logger.info(context);
        try {
            return await this.profiles.getCandidateProfiles();
        } catch (error) {
            return throwInternalError(this.logger, context, "Failed to retrieve candidate profiles", error);
        }
    }

    @Post()
    async create(@Body({ schema: candidateProfileBodySchema }) body: z.infer<typeof candidateProfileBodySchema>) {
        const context = "[POST] /api/v1/candidate-profiles";
        this.logger.info(context);
        this.logger.debug(`${context} Profile data received: ${JSON.stringify(body)}`);
        try {
            const profile = await this.profiles.createCandidateProfile(body);
            this.logger.info(`${context} Successfully created profile with ID: ${profile.id}`);
            return profile;
        } catch (error) {
            return throwInternalError(this.logger, context, "Failed to create candidate profile", error);
        }
    }

    @Get(":id")
    async getById(
        @Param({ schema: candidateProfileParamsSchema }) params: z.infer<typeof candidateProfileParamsSchema>
    ) {
        const context = `[GET] /api/v1/candidate-profiles/${params.id}`;
        this.logger.info(context);
        try {
            const profile = await this.profiles.getCandidateProfileById(params.id);
            if (!profile) {
                this.logger.warn(`${context} Candidate profile not found`);
                throw new NotFoundException({ error: "Candidate profile not found" });
            }

            return profile;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }

            return throwInternalError(this.logger, context, "Failed to retrieve candidate profile", error);
        }
    }
}
