import { FastifyInstance } from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import { ILogger } from "../../Infrastructure/Logging/ILogger";

/**
 * OpenAPI/Swagger configuration for the API.
 * Registers the Swagger plugin with Fastify to provide interactive API documentation.
 */
export class SwaggerConfig {
    constructor(private readonly logger: ILogger) {}

    public register(server: FastifyInstance): void {
        this.logger.info("Registering Swagger documentation...");

        // Register @fastify/swagger for OpenAPI schema generation
        server.register(fastifySwagger, {
            openapi: {
                info: {
                    title: "Employment Application Tracking System API",
                    description: "AI-powered employment application tracking and scoring system API",
                    version: "1.0.0",
                },
                servers: [
                    { url: "http://localhost:3000/api/v1", description: "Development server" },
                ],
            },
        });

        // Register @fastify/swagger-ui for the interactive documentation interface
        server.register(fastifySwaggerUi, {
            routePrefix: "/docs",
            uiConfig: {
                docExpansion: "list",
                deepLinking: true,
                filter: true,
                showExtensions: true,
                showCommonExtensions: true,
            },
            staticCSP: true,
            transformStaticCSP: (header) => header,
        });

        this.logger.info("Swagger documentation registered at /docs");
    }
}
