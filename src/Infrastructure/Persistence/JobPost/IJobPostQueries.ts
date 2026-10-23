

import { IApplicationHydration } from "./Sqlite/SqliteJobQueries";
import { IAssessmentHydration } from "./Sqlite/SqliteJobQueries";

export interface IJobPostQueries {
    getJobApplications(jobPostIds: string[]): Promise<IApplicationHydration[]>;
    getJobAssessments(jobPostIds: string[]): Promise<IAssessmentHydration[]>;
}

