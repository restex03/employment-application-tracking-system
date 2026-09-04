import Fastify, { FastifyInstance, RouteOptions } from "fastify";
import { IApplicationDependencies } from "../../Application/DependencyInjection/IApplicationDependencies";
import { JobAssessmentRoutes } from "../Routes/JobAssessmentRoutes";
import { JobPostRoutes } from "../Routes/JobPostRoutes";
import { JobSourceRoutes } from "../Routes/JobSourceRoutes";
import { IRouteRegistrar } from "./IRouteRegistrar";
import { IRouteDetails } from "./IRouteDetails";

export class HttpServer {
    private readonly app: FastifyInstance;
    private readonly routes: IRouteRegistrar[];
    private readonly registeredRoutes: IRouteDetails[] = [];

    constructor(private readonly dependencies: IApplicationDependencies) {
        this.app = Fastify({
            logger: false,
        });

        this.captureRoutes();

        this.routes = [
            new JobSourceRoutes(this.dependencies.jobSourceRepository, this.dependencies.logger),

            new JobPostRoutes(
                this.dependencies.jobPostService,
                this.dependencies.jobPostSyncService,
                this.dependencies.logger
            ),

            new JobAssessmentRoutes(this.dependencies.jobAssessmentService, this.dependencies.logger),
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
