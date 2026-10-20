import "dotenv/config";
import { buildDependencies } from "./Application/DependencyInjection/buildDependencies";
import { LogLevel } from "./Infrastructure/Logging/LogLevel";
import { HttpServer } from "./Api/Host/HttpServer";
import { IJobCandidateProfileService } from "./Application/JobCandidateProfiles/IJobCandidateProfileService";

const dependencies = buildDependencies(LogLevel.Debug);

await loadDefaultJobCandidateProfilesIfEmpty(dependencies.jobCandidateProfileService);
const server = new HttpServer(dependencies);
const port = process.env.API_PORT ? parseInt(process.env.API_PORT) : 3000;
const jobAssessmentQueueWorkerSvc = dependencies.jobAssessmentQueueWorkerService;


const shutdown = async () => {
    await jobAssessmentQueueWorkerSvc.stop();
    await server.stop();
    dependencies.sqliteConnection.close();

    process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await server.start(port);
jobAssessmentQueueWorkerSvc.start({ freqMs: 1000 });


console.log(`API server started at http://localhost:${port}`);
console.log(`Health check: http://localhost:${port}/health`);
console.log(`API base URL: http://localhost:${port}/api/v1`);
console.log(server.printRoutes());


async function loadDefaultJobCandidateProfilesIfEmpty(candidateProfileSvc: IJobCandidateProfileService): Promise<void> {
    const existingProfiles = await candidateProfileSvc.getCandidateProfiles();
    if (existingProfiles.length === 0) {
        candidateProfileSvc.seedCandidateProfilesWithDefault();
    }
}
