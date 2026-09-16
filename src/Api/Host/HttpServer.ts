import Fastify, { FastifyInstance, RouteOptions } from "fastify";
import { IApplicationDependencies } from "../../Application/DependencyInjection/IApplicationDependencies";
import { JobAssessmentRoutes } from "../Routes/JobAssessmentRoutes";
import { QueueJobsRoutes } from "../Routes/QueueJobsRoutes";
import { JobPostRoutes } from "../Routes/JobPostRoutes";
import { JobPostSyncRoutes } from "../Routes/JobPostSyncRoutes";
import { JobSourcesRoutes } from "../Routes/JobSourcesRoutes";
import { ToolsRoutes } from "../Routes/ToolsRoutes";
import { IRouteRegistrar } from "./IRouteRegistrar";
import { IRouteDetails } from "./IRouteDetails";
import { CandidateProfileRoutes } from "../Routes/CandidateProfileRoutes";
import { JobApplicationRoutes } from "../Routes/JobApplicationRoutes";
import { AttachmentsRoutes } from "../Routes/AttachmentsRoutes";
import { SwaggerConfig } from "./SwaggerConfig";

export class HttpServer {
    private readonly app: FastifyInstance;
    private readonly routes: IRouteRegistrar[];
    private readonly registeredRoutes: IRouteDetails[] = [];

    constructor(private readonly dependencies: IApplicationDependencies) {
        this.app = Fastify({
            logger: false,
        });

        // Attachment uploads are sent as raw bytes rather than JSON.
        this.app.addContentTypeParser("application/octet-stream", { parseAs: "buffer" }, (_request, payload, done) =>
            done(null, payload)
        );

        this.captureRoutes();

        // Register Swagger on root instance to capture all routes
        new SwaggerConfig(this.dependencies.logger).register(this.app);

        this.routes = [
            new JobSourcesRoutes(this.dependencies.jobSourceRepository, this.dependencies.logger),
            new CandidateProfileRoutes(this.dependencies.jobCandidateProfileService, this.dependencies.logger),
            new JobPostRoutes(this.dependencies.jobPostResultService, this.dependencies.logger),
            new JobPostSyncRoutes(
                this.dependencies.jobPostSyncService,
                this.dependencies.jobPostSyncQueueService,
                this.dependencies.logger
            ),
            new JobApplicationRoutes(this.dependencies.jobApplicationService, this.dependencies.logger),
            new AttachmentsRoutes(this.dependencies.jobApplicationService, this.dependencies.logger),

            new JobAssessmentRoutes(
                this.dependencies.jobAssessmentService,
                this.dependencies.jobAssessmentQueueService,
                this.dependencies.logger
            ),
            new QueueJobsRoutes(
                this.dependencies.jobAssessmentQueueService,
                this.dependencies.jobPostSyncQueueService,
                this.dependencies.logger
            ),

            new ToolsRoutes(
                this.dependencies.sqliteConnection,
                this.dependencies.jobSourceService,
                this.dependencies.jobCandidateProfileService,
                this.dependencies.logger
            ),
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

    public async ready(): Promise<void> {
        await this.app.ready();
    }

    public get instance(): FastifyInstance {
        return this.app;
    }

    public get routeDetails(): readonly IRouteDetails[] {
        return [...this.registeredRoutes];
    }

    public printRoutes(): string {
        return this.app.printRoutes({
            commonPrefix: false,
        });
    }

    private captureRoutes(): void {
        this.app.addHook("onRoute", (routeOptions: RouteOptions) => {
            const methods = Array.isArray(routeOptions.method) ? routeOptions.method : [routeOptions.method];

            for (const method of methods) {
                this.registeredRoutes.push({
                    method,
                    path: routeOptions.url,
                });
            }
        });
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
