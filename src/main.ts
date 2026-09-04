import "dotenv/config";

import { buildDependencies } from "./Application/DependencyInjection/buildDependencies";
import { LogLevel } from "./Infrastructure/Logging/LogLevel";
import { HttpServer } from "./Api/Host/HttpServer";

const dependencies = buildDependencies(LogLevel.Debug);

const server = new HttpServer(dependencies);
const port = process.env.API_PORT ? parseInt(process.env.API_PORT) : 3000;
const shutdown = async () => {
    await server.stop();
    dependencies.sqlite.close();

    process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await server.start(port);

console.log(`API server started at http://localhost:${port}`);
console.log(`Health check: http://localhost:${port}/health`);
console.log(`API base URL: http://localhost:${port}/api/v1`);
console.log(server.printRoutes());
