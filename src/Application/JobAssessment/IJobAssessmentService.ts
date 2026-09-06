import { IJobPost } from "../../Domain/JobPosts/IJobPost";

export interface IJobAssessmentService {
    runAssessment(candidateProfileId: string, jobPostId: string): Promise<void>;
}
