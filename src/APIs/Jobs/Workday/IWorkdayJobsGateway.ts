import { WorkdayJobsResponse } from "./WorkdayJobsResponse";

import * as cheerio from "cheerio";
import { WorkdayJobDetail } from "./WorkdayJobDetail";
import { IJobsRequest } from "../IJobsRequest";

export interface IWorkdayJobsGateway {
  getJobPostings(
    request: IJobsRequest
  ): Promise<WorkdayJobsResponse>;
  getJobDetails(
  url: string
): Promise<WorkdayJobDetail>
}

export class WorkdayJobsGateway implements IWorkdayJobsGateway {
  private readonly jobsUrl =
    "https://workday.wd5.myworkdayjobs.com/wday/cxs/workday/Workday/jobs";

  async getJobPostings(
    request: IJobsRequest
  ): Promise<WorkdayJobsResponse> {
    const response = await fetch(this.jobsUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "accept-language": "en-US",
        "content-type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `Workday jobs API returned HTTP ${response.status} ${response.statusText}`,
      );
    }

    const responseBody = await response.json();

    const parsed = responseBody as WorkdayJobsResponse | undefined;

    if (parsed === undefined) {
      throw new Error("Workday jobs API returned an undefined body");
    }

    return parsed;
  }


  async getJobDetails(
  url: string
): Promise<WorkdayJobDetail> {
  const response = await fetch(url, {
    headers: {
      accept: "text/html",
      "accept-language": "en-US",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Workday job page returned HTTP ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const jsonLd = $('script[type="application/ld+json"]').text();

  if (!jsonLd) {
    throw new Error("Workday JobPosting JSON-LD was not found");
  }

  return JSON.parse(jsonLd) as WorkdayJobDetail;
}
}