import "dotenv/config";

import { buildDependencies } from "./Application/DependencyInjection/buildDependencies";
import { LogLevel } from "./Infrastructure/Logging/LogLevel";
import { Server } from "./Api/Host/Server";

const dependencies = buildDependencies(LogLevel.Debug);

const server = new Server(dependencies);

const shutdown = async () => {
    await server.stop();
    dependencies.sqlite.close();

    process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await server.start(3000);
