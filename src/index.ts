import { WorkdayJobsGateway } from "./APIs/Jobs/Workday/IWorkdayJobsGateway";
import OpenAI from "openai";
import { GroqJobEvaluator } from "./JobEvaluators/Groq/GroqJobEvaluator";
import { profiles } from "./JobCandidateProfile/candidateProfiles";


const request = {
      appliedFacets: {},
      limit: 20,
      offset: 0,
      searchText: "",
    };
// const gateway = new CrowdstrikeWorkdayJobsApiGateway();
//     const result = await gateway.getJobPostings(request);

// const gateway = new TravelersJobsGateway();
// const result = await gateway.getJobPostings(request);

const gateway = new WorkdayJobsGateway();
    // const result = await gateway.getJobPostings(request);
// const detail = await gateway.getJobDetails(`https://workday.wd5.myworkdayjobs.com/en-US/Workday${result.jobPostings[0].externalPath}`)
const url = 'https://travelers.wd5.myworkdayjobs.com/en-US/External/job/CT---Hartford/Sr-Accountant--Bond---Specialty-Claim-Operations_R-52114';
const url2 = 'https://crowdstrike.wd5.myworkdayjobs.com/en-US/crowdstrikecareers/job/USA---Remote/Manager--Network-Engineering---Transport--Remote-_R29587';
const url3 = 'https://workday.wd5.myworkdayjobs.com/en-US/Workday/job/USA-CO-Denver/Large-Enterprise-Account-Executive--Education---oCFO_JR-0107524-1';
const detail = await gateway.getJobDetails(url2);


const evaluator = new GroqJobEvaluator();
const response = await evaluator.evaluate(profiles.profile_08_23_2026, [])

  // console.log(detail.datePosted);
  // console.log(detail.title);
  // console.log(detail.description.slice(0, 150));




console.log(`* * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * * *`);
// console.log(`Result: ${JSON.stringify(detail)}`);
