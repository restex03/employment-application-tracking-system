import {
    type ICandidateProfile,
    type IJobEvaluation,
    type IJobPosting,
} from "./Groq/types";

export interface IJobEvaluator {
    evaluate(
        profile: ICandidateProfile,
        jobs: IJobPosting[],
    ): Promise<IJobEvaluation[]>;
}