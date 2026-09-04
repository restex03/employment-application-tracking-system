import { FastifyInstance } from "fastify";

import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IRouteRegistrar } from "../Host/IRouteRegistrar";
import { ICandidateProfile } from "../../Domain/Candidates/ICandidateProfile";

export class JobCandidateProfileRoutes implements IRouteRegistrar {
    constructor(
        private readonly candidateProfile: ICandidateProfile,
        private readonly logger: ILogger
    ) {}

    public register(server: FastifyInstance): void {
        server.get("/candidate-profiles", async () => {
            this.logger.debug("[GET /candidate-profile] Retrieving candidate profiles");

            const result = [this.candidateProfile];
            return result;
        });
    }
}
