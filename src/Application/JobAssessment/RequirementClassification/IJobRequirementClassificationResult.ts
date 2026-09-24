import { JobRequirementCategory } from "./IClassifiedJobRequirement";

export interface IJobRequirementClassification {
    index: number;
    category: JobRequirementCategory;
}

export interface IJobRequirementClassificationResult {
    classifications: IJobRequirementClassification[];
}
