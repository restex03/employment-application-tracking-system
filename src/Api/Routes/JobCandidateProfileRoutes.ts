import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IRouteRegistrar } from "../Host/IRouteRegistrar";
import { IJobCandidateProfileService } from "../../Application/JobCandidateProfiles/IJobCandidateProfileService";
import { ICandidateProfile } from "../../Domain/Candidates/ICandidateProfile";

export class JobCandidateProfileRoutes implements IRouteRegistrar {
    constructor(
        private readonly candidateProfileSvc: IJobCandidateProfileService,
        private readonly logger: ILogger
    ) {}

    public register(server: FastifyInstance): void {
        // GET endpoint to retrieve all candidate profiles
        server.get("/candidate-profiles", async (request: FastifyRequest, reply: FastifyReply) => {
            this.logger.debug(`[${request.method}]  ${request.url}`);

            try {
                const result = await this.candidateProfileSvc.getCandidateProfiles();
                return result;
            } catch (error) {
                this.logger.error(`[${request.method}]  ${request.url} Error retrieving candidate profiles: ${error}`);
                reply.status(500).send({ error: "Failed to retrieve candidate profiles" });
            }
        });

        // POST endpoint to create a new candidate profile
        server.post(
            "/candidate-profiles",
            async (request: FastifyRequest<{ Body: ICandidateProfile }>, reply: FastifyReply) => {
                this.logger.debug(`[${request.method}]  ${request.url}`);

                try {
                    const profileData = request.body;
                    this.logger.debug(
                        `[${request.method}]  ${request.url} Profile data received: ${JSON.stringify(profileData)}`
                    );

                    // Validate required fields
                    if (!profileData) {
                        this.logger.warn(`[${request.method}]  ${request.url} No profile data provided`);
                        return reply.status(400).send({ error: "Profile data is required" });
                    }

                    // Call the service to create the profile
                    const createdProfile = await this.candidateProfileSvc.createCandidateProfile(profileData);

                    this.logger.info(
                        `[${request.method}]  ${request.url} Successfully created profile with ID: ${createdProfile.id}`
                    );
                    return reply.status(201).send(createdProfile);
                } catch (error) {
                    this.logger.error(`[${request.method}]  ${request.url} Error creating candidate profile: ${error}`);
                    return reply.status(500).send({ error: "Failed to create candidate profile" });
                }
            }
        );

        // GET endpoint to retrieve a specific candidate profile by ID
        server.get(
            "/candidate-profiles/:id",
            async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
                const { id } = request.params;
                this.logger.debug(`[${request.method}]  ${request.url}`);

                try {
                    const result = await this.candidateProfileSvc.getCandidateProfileById(id);

                    if (!result) {
                        this.logger.warn(`[${request.method}]  ${request.url} Candidate profile not found`);
                        return reply.status(404).send({ error: "Candidate profile not found" });
                    }

                    return result;
                } catch (error) {
                    this.logger.error(
                        `[${request.method}]  ${request.url} Error retrieving candidate profile: ${error}`
                    );
                    return reply.status(500).send({ error: "Failed to retrieve candidate profile" });
                }
            }
        );
    }
}
