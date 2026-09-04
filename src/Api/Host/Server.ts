import Fastify, { FastifyInstance } from "fastify";
import { IApplicationDependencies } from "../../Application/DependencyInjection/IApplicationDependencies";
import { JobAssessmentRoutes } from "../Routes/JobAssessmentRoutes";
import { JobPostRoutes } from "../Routes/JobPostRoutes";
import { JobSourceRoutes } from "../Routes/JobSourceRoutes";
import { IRouteRegistrar } from "./IRouteRegistrar";

export class Server {
    private readonly app: FastifyInstance;
    private readonly routes: IRouteRegistrar[];

    constructor(private readonly dependencies: IApplicationDependencies) {
        this.app = Fastify({
            logger: false,
        });

        this.routes = [
            new JobSourceRoutes(dependencies.jobSourceRepository, dependencies.logger),
            new JobPostRoutes(dependencies.jobPostService, dependencies.jobPostSyncService, dependencies.logger),
            new JobAssessmentRoutes(dependencies.logger),
        ];

        this.registerRoutes();
    }

    public async start(port: number, host = "0.0.0.0"): Promise<void> {
        await this.app.listen({
            port,
            host,
        });
    }

    public async stop(): Promise<void> {
        await this.app.close();
    }

    public get instance(): FastifyInstance {
        return this.app;
    }

    private registerRoutes(): void {
        this.app.get("/health", async () => ({
            status: "ok",
        }));

        this.app.register(
            async api => {
                for (const routes of this.routes) {
                    routes.register(api);
                }
            },
            {
                prefix: "/api/v1",
            }
        );
    }
}
