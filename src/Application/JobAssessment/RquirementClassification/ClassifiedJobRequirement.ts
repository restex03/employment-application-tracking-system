import { JobRequirement } from "../RequirementsExtraction/JobRequirement";
import { JobRequirementType } from "../RequirementsExtraction/IJobRequirement";
import { IClassifiedJobRequirement, JobRequirementCategory } from "./IClassifiedJobRequirement";

export class ClassifiedJobRequirement extends JobRequirement implements IClassifiedJobRequirement {
    public readonly category: JobRequirementCategory;

    constructor(name: string[], type: JobRequirementType, sentenceCapture: string, category: JobRequirementCategory) {
        super(name, type, sentenceCapture);
        this.category = category;
    }

    public static from(data: Omit<IClassifiedJobRequirement, "formattedName">): ClassifiedJobRequirement {
        return new ClassifiedJobRequirement([...data.name], data.type, data.sentenceCapture, data.category);
    }
}
