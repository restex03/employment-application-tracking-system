import { IJobRequirement } from "../RequirementsExtraction/IJobRequirementsResult";
import { IClassifiedJobRequirement } from "./IClassifiedJobRequirement";

export interface IJobRequirementClassificationService {
    classify(requirements: IJobRequirement[]): Promise<IClassifiedJobRequirement[]>;
}
