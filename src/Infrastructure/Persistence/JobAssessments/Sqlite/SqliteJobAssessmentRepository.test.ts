import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { JobAssessment } from "../../../../Domain/JobAssessment/IJobAssessment";
import { IJobMatchScore } from "../../../../Domain/JobAssessment/Scoring/IJobMatchScore";
import { ILogger } from "../../../Logging/ILogger";
import { SqliteDatabaseConnection } from "../../JobPost/Sqlite/SqliteDatabaseConnection";
import { SqliteJobAssessmentRepository } from "./SqliteJobAssessmentRepository";

describe("SqliteJobAssessmentRepository", () => {
    let connection: SqliteDatabaseConnection;
    let repository: SqliteJobAssessmentRepository;

    beforeEach(() => {
        connection = new SqliteDatabaseConnection(":memory:");
        connection.db
            .prepare("INSERT INTO candidate_profiles (id, total_years_experience) VALUES (?, 0)")
            .run("candidate-1");
        repository = new SqliteJobAssessmentRepository(connection.db, createLogger());
    });

    afterEach(() => {
        connection.close();
    });

    it("stores JSON fields and retrieves the latest assessment through Drizzle", async () => {
        const score: IJobMatchScore = {
            score: 82,
            totalRequirements: 4,
            directMatches: 3,
            transferableMatches: 1,
            missingMatches: 0,
        };
        const assessment = new JobAssessment({
            id: "assessment-1",
            candidateProfileId: "candidate-1",
            jobPostId: "post-1",
            createdAt: new Date("2026-10-30T00:00:00.000Z"),
            status: "complete",
            reviewStatus: "unreviewed",
            jobMatchScore: score,
        });

        await repository.storeAssessment(assessment);
        const reloaded = await repository.getLatestAssessment("post-1", "candidate-1");
        await repository.updateReviewStatus("assessment-1", "accepted");

        expect(reloaded?.jobMatchScore).toEqual(score);
        await expect(repository.getById("assessment-1")).resolves.toMatchObject({
            createdAt: assessment.createdAt,
            status: "complete",
            reviewStatus: "accepted",
            requirements: [],
            requirementMatches: [],
        });
    });
});

function createLogger(): ILogger {
    return {
        trace: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    };
}
