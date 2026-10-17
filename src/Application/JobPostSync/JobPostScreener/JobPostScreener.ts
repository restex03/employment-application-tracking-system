import { IJobPostDiscovery } from "../../../Domain/JobPosts/IJobPostDiscovery";
import { IJobPostScreener } from "./IJobPostScreener";

export class JobPostScreener implements IJobPostScreener{

    constructor() {

    }

    screenJobPost(jobPost: IJobPostDiscovery): boolean {
        if (JobPostScreener.failList.some(pattern => pattern.test(jobPost.title))) {
            return false;
        } 

        return JobPostScreener.passList.some(pattern => pattern.test(jobPost.title));
    }



    private static readonly passList: readonly RegExp[] = [
        // Software engineering
        /\bsoftware\b/i,
        /\bdeveloper\b/i,
        /\bdevelopment\b/i,
        /\bprogrammer\b/i,
        /\bbackend\b/i,
        /\bback[\s-]?end\b/i,
        /\bfrontend\b/i,
        /\bfront[\s-]?end\b/i,
        /\bfull[\s-]?stack\b/i,
        /\bweb\b/i,
        /\bapi\b/i,

        // Languages and frameworks
        /\b\.net\b/i,
        /\bdotnet\b/i,
        /\bc#/i,
        /\bcsharp\b/i,
        /\basp[\s.]?net\b/i,
        /\btypescript\b/i,
        /\bjavascript\b/i,
        /\bnode[\s.]?js\b/i,
        /\breact\b/i,
        /\bjava\b/i,
        /\bpython\b/i,

        // AI and machine learning
        /\bai\b/i,
        /\bgen[\s-]?ai\b/i,
        /\bllm\b/i,
        /\bagentic\b/i,
        /\bagents?\b/i,
        /\bmachine learning\b/i,
        /\bml\b/i,
        /\brag\b/i,
        /\bgenerative\b/i,

        // Adjacent engineering roles
        /\bplatform\b/i,
        /\bapplication\b/i,
        /\bapplications\b/i,
        /\bintegration\b/i,
        /\bcloud\b/i,
        /\bdistributed\b/i,
        /\binfrastructure\b/i,
        /\bautomation\b/i,
        /\barchitect\b/i,
        /\btechnical staff\b/i,
        /\bsolutions engineer\b/i,
        /\bsystems engineer\b/i,
    ];

    private static readonly failList: readonly RegExp[] = [
        // Unwanted job functions
        /\brecruit(?:er|ing|ment)?\b/i,
        /\btalent acquisition\b/i,
        /\project manager\b/i,
        /\baccount executive\b/i,
        /\baccount manager\b/i,
        /\bexecutive assistant\b/i,
        /\bassociate director\b/i,
        /\bsenior director\b/i,
        /\bvice president\b/i,
        /\b(?:director|vice president|vp)\b/i,
        /\b(?:intern|internship)\b/i,


        // Geographic exclusions
        /\bindia\b/i,
        /\btaiwan\b/i,
        /\bchina\b/i,
        /\bhong kong\b/i,
        /\b(?:macau|macao)\b/i,
        /\bpakistan\b/i,
        /\bbangladesh\b/i,
        /\bsri lanka\b/i,
        /\bnepal\b/i,
        /\bsingapore\b/i,
        /\bmalaysia\b/i,
        /\bindonesia\b/i,
        /\bphilippines\b/i,
        /\bvietnam\b/i,
        /\bthailand\b/i,
        /\bjapan\b/i,
        /\b(?:south korea|republic of korea)\b/i,
        /\bbengaluru\b/i,
        /\bbangalore\b/i,
        /\btrivandrum\b/i,
        /\bmumbai\b/i,
        /\bcanada\b/i,
        /\bireland\b/i,
        /\bpuerto rico\b/i,
    ];



}