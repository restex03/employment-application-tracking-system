

import { IApplicationHydration } from "./Sqlite/SqliteJobQueries";
import { IAssessmentHydration } from "./Sqlite/SqliteJobQueries";

export interface IJobPostQueries {
    getJobApplications(jobPostIds: string[], applicationStatus: string | undefined): Promise<IApplicationHydration[]>;
    getJobAssessments(jobPostIds: string[], jobMatchScore: number | undefined): Promise<IAssessmentHydration[]>;
}

