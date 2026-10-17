import { IJobPostDiscovery } from "../../../Domain/JobPosts/IJobPostDiscovery";

export interface IJobPostScreener {
    screenJobPost(jobPost: IJobPostDiscovery): boolean;
}