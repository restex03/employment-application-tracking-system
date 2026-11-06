import { Module } from "@nestjs/common";
import path from "node:path";
import { NestLoggerAdapter } from "./Logging/NestLoggerAdapter";
import { ILogger } from "./Logging/ILogger";
import { LogLevel } from "./Logging/LogLevel";
import { SqliteDatabaseConnection } from "./Persistence/JobPost/Sqlite/SqliteDatabaseConnection";
import { SqliteJobCandidateProfileRepository } from "./Persistence/JobCandidateProfiles/Sqlite/SqliteJobCandidateProfileRepository";
import { IJobCandidateProfileRepository } from "./Persistence/JobCandidateProfiles/IJobCandidateProfileRepository";
import { SqliteJobAssessmentRepository } from "./Persistence/JobAssessments/Sqlite/SqliteJobAssessmentRepository";
import { IJobAssessmentRepository } from "./Persistence/JobAssessments/IJobAssessmentRepository";
import { JobApplicationRepository } from "./Persistence/JobApplications/JobApplicationRepository";
import { IJobApplicationRepository } from "./Persistence/JobApplications/IJobApplicationRepository";
import { FileSystemRepository } from "./Persistence/FileSystem/FileSystemRepository";
import { IFileSystemRepository } from "./Persistence/FileSystem/IFileSystemRepository";
import { SqliteJobQueries } from "./Persistence/JobPost/Sqlite/SqliteJobQueries";
import { IJobPostQueries } from "./Persistence/JobPost/IJobPostQueries";
import { IJobPostRepository } from "./Persistence/JobPost/IJobPostRepository";
import { JobPostRepository } from "./Persistence/JobPost/JobPostRepository";
import { SqliteJobAssessmentQueueRepository } from "./Persistence/Queues/JobAssessmentQueue/Sqlite/SqliteJobAssessmentQueueRepository";
import { IJobAssessmentQueue } from "./Persistence/Queues/JobAssessmentQueue/IJobAssessmentQueue";
import { JobPostGateway, IJobPostGateway } from "./JobPosts/IJobPostGateway";
import { IngestionServiceGateway, IIngestionServiceGateway } from "./Ingestion/IIngestionServiceGateway";
import { IJobSourceGateway, JobSourceGateway } from "./JobSourcing/IJobSourceGateway";
import { TOKENS } from "../DependencyInjection/tokens";

function getRequiredEnvironmentVariable(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} environment variable is not set.`);
    }

    return value;
}

@Module({
    providers: [
        {
            provide: TOKENS.logger,
            useFactory: (): ILogger => new NestLoggerAdapter(LogLevel.Log),
        },
        {
            provide: TOKENS.ingestionBaseUrl,
            useFactory: (): string => new URL(getRequiredEnvironmentVariable("INGESTION_SVC_BASE_URL")).toString(),
        },
        {
            provide: SqliteDatabaseConnection,
            useFactory: (): SqliteDatabaseConnection =>
                new SqliteDatabaseConnection(getRequiredEnvironmentVariable("DB_PATH")),
        },
        {
            provide: TOKENS.candidateProfileRepository,
            inject: [SqliteDatabaseConnection, TOKENS.logger],
            useFactory: (database: SqliteDatabaseConnection, logger: ILogger): IJobCandidateProfileRepository =>
                new SqliteJobCandidateProfileRepository(database.db, logger),
        },
        {
            provide: TOKENS.jobAssessmentRepository,
            inject: [SqliteDatabaseConnection, TOKENS.logger],
            useFactory: (database: SqliteDatabaseConnection, logger: ILogger): IJobAssessmentRepository =>
                new SqliteJobAssessmentRepository(database.db, logger),
        },
        {
            provide: TOKENS.jobApplicationRepository,
            inject: [SqliteDatabaseConnection, TOKENS.logger],
            useFactory: (database: SqliteDatabaseConnection, logger: ILogger): IJobApplicationRepository =>
                new JobApplicationRepository(database.db, logger),
        },
        {
            provide: TOKENS.fileSystemRepository,
            inject: [TOKENS.logger],
            useFactory: (logger: ILogger): IFileSystemRepository =>
                new FileSystemRepository(path.dirname(getRequiredEnvironmentVariable("DB_PATH")), logger),
        },
        {
            provide: TOKENS.jobPostQueries,
            inject: [SqliteDatabaseConnection, TOKENS.logger],
            useFactory: (database: SqliteDatabaseConnection, logger: ILogger): IJobPostQueries =>
                new SqliteJobQueries(database.db, logger),
        },
        {
            provide: TOKENS.jobPostRepository,
            inject: [SqliteDatabaseConnection],
            useFactory: (database: SqliteDatabaseConnection): IJobPostRepository =>
                new JobPostRepository(database.db),
        },
        {
            provide: TOKENS.jobAssessmentQueue,
            inject: [SqliteDatabaseConnection, TOKENS.logger],
            useFactory: (database: SqliteDatabaseConnection, logger: ILogger): IJobAssessmentQueue =>
                new SqliteJobAssessmentQueueRepository(database.db, logger),
        },
        {
            provide: TOKENS.jobPostGateway,
            inject: [TOKENS.ingestionBaseUrl, TOKENS.logger],
            useFactory: (baseUrl: string, logger: ILogger): IJobPostGateway => new JobPostGateway(baseUrl, logger),
        },
        {
            provide: TOKENS.ingestionGateway,
            inject: [TOKENS.ingestionBaseUrl, TOKENS.logger],
            useFactory: (baseUrl: string, logger: ILogger): IIngestionServiceGateway =>
                new IngestionServiceGateway(baseUrl, logger),
        },
        {
            provide: TOKENS.jobSourceGateway,
            inject: [TOKENS.ingestionBaseUrl, TOKENS.logger],
            useFactory: (baseUrl: string, logger: ILogger): IJobSourceGateway => new JobSourceGateway(baseUrl, logger),
        },
    ],
    exports: [
        TOKENS.logger,
        TOKENS.candidateProfileRepository,
        TOKENS.jobAssessmentRepository,
        TOKENS.jobApplicationRepository,
        TOKENS.fileSystemRepository,
        TOKENS.jobPostQueries,
        TOKENS.jobPostRepository,
        TOKENS.jobAssessmentQueue,
        TOKENS.jobPostGateway,
        TOKENS.ingestionGateway,
        TOKENS.jobSourceGateway,
        SqliteDatabaseConnection,
    ],
})
export class InfrastructureModule {}
