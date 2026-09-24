import { IJobRequirement } from "../RequirementsExtraction/IJobRequirement";
import { IClassifiedJobRequirement } from "./IClassifiedJobRequirement";

export interface IJobRequirementClassificationService {
    classify(requirements: IJobRequirement[]): Promise<IClassifiedJobRequirement[]>;
}
