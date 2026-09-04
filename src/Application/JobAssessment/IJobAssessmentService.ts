import { IJobPost } from "../../Domain/JobPosts/IJobPost";

export interface IJobAssessmentService {
    runAssessment(jobPostId: string): Promise<void>;
}
