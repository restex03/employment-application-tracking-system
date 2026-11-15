import "reflect-metadata";
import "dotenv/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { RequestMethod, StandardSchemaValidationPipe } from "@nestjs/common";
import { ApplicationModule } from "./Api/Modules/ApplicationModule";

const port = process.env.API_PORT ? Number.parseInt(process.env.API_PORT, 10) : 3000;
if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid API_PORT value: ${process.env.API_PORT}`);
}

const app = await NestFactory.create<NestFastifyApplication>(ApplicationModule, new FastifyAdapter({ logger: false }));
app.setGlobalPrefix("api/v1", {
    exclude: [{ path: "health", method: RequestMethod.ALL }],
});
app.useGlobalPipes(new StandardSchemaValidationPipe());

app.getHttpAdapter()
    .getInstance()
    .addContentTypeParser("application/octet-stream", { parseAs: "buffer" }, (_request, payload, done) =>
        done(null, payload)
    );

app.enableShutdownHooks();
await app.listen(port, "0.0.0.0");

console.log(`API server started at http://localhost:${port}`);
console.log(`Health check: http://localhost:${port}/health`);
console.log(`API base URL: http://localhost:${port}/api/v1`);
console.log(app.getHttpAdapter().getInstance().printRoutes({ commonPrefix: false }));
