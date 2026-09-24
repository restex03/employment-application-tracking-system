import { IJobRequirement, JobRequirementType } from "./IJobRequirement";

export class JobRequirement implements IJobRequirement {
    public readonly name: string[];
    public readonly type: JobRequirementType;
    public readonly sentenceCapture: string;

    constructor(name: string[], type: JobRequirementType, sentenceCapture: string) {
        this.name = name;
        this.type = type;
        this.sentenceCapture = sentenceCapture;
    }

    public static from(data: Omit<IJobRequirement, "formattedName">): JobRequirement {
        return new JobRequirement([...data.name], data.type, data.sentenceCapture);
    }

    public formattedName(): string {
        if (this.name.length === 1) {
            return this.name[0];
        }

        return this.name.join(this.type === "or" ? " or " : " and ");
    }
}
