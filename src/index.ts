import OpenAI from "openai";
import { GroqJobEvaluator } from "./JobEvaluators/Groq/GroqJobEvaluator";
import { profiles } from "./JobCandidateProfile/candidateProfiles";
import { WorkdayJobsGateway } from "./APIs/JobSources/Workday/WorkdayJobsGateway";
import { ConsoleLogger } from "./Application/Common/Logger/Console/ConsoleLogger";

const WORKDAY_BASE_URL = "https://workday.wd5.myworkdayjobs.com/wday/cxs/workday/Workday";
const TRAVELERS_BASE_URL = "https://travelers.wd5.myworkdayjobs.com/wday/cxs/travelers/External";
const CROWDSTRIKE_BASE_URL = "https://crowdstrike.wd5.myworkdayjobs.com/wday/cxs/crowdstrike/crowdstrikecareers";

const logger = new ConsoleLogger();
logger.info("Starting application...");

const request = {
    appliedFacets: {},
    limit: 1,
    offset: 0,
    searchText: "",
};

const gateway = new WorkdayJobsGateway({ companyName: "Travelers", baseUrl: TRAVELERS_BASE_URL, logger });
const jobsList = await gateway.search(request);
logger.info(`Found ${jobsList.length} jobs`);
const detail = await gateway.getDetail(jobsList[0]?.detailPath);
const locations = detail.locations?.map(loc => `\t- ${loc.city}, ${loc.country}`).join("; \n");
const locationsCount = detail.locations?.length ?? 0;
logger.info(`Job Title: ${detail.title}`);
logger.info(`Job Locations (${locationsCount}): \n${locations}`);

logger.info(`Job description: ${detail.description.slice(0, 150)}...`);
// const evaluator = new GroqJobEvaluator();
// const response = await evaluator.evaluate(profiles.profile_08_23_2026, [])

// console.log(detail.datePosted);
// console.log(detail.title);
// console.log(detail.description.slice(0, 150));
