const dependencies = buildDependencies(LogLevel.Debug);

const server = new Server(dependencies);

await server.start(3000);
