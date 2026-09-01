import { IClassifiedJobRequirement } from "../../RquirementClassification/IClassifiedJobRequirement";
import { IJobRequirementMatch } from "../IJobRequirementMatch";
import { IJobRequirementMatchResponse } from "../IJobRequirementMatchResponse";

export interface IJobRequirementMatchMapper {
    map(requirements: IClassifiedJobRequirement[], matches: IJobRequirementMatchResponse[]): IJobRequirementMatch[];
}
