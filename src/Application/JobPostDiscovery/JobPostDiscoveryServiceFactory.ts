import { IJobGateway } from "../../Domain/JobPosts/IJobSource";
import { IWorkdayJobSource } from "../../Infrastructure/JobSources/Workday/IWorkdayJobSource";
import {
    IWorkdayJobDetailsApiResponseMapper,
    WorkdayJobDetailsApiResponseMapper,
} from "../../Infrastructure/JobSources/Workday/Mappers/WorkdayJobDetailsApiResponseMapper";
import {
    IWorkdayJobsApiResponseMapper,
    WorkdayJobsResponseMapper,
} from "../../Infrastructure/JobSources/Workday/Mappers/WorkdayJobsApiResponseMapper";
import { WorkdayJobsGateway } from "../../Infrastructure/JobSources/Workday/WorkdayJobsGateway";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IJobPostDiscoveryService } from "./IJobPostDiscoveryService";
import { IJobPostDiscoveryServiceFactory } from "./IJobPostDiscoveryServiceFactory";
import { WorkdayJobDiscoveryService } from "./Workday/WorkdayJobDiscoveryService";

/*
 * Source-specific discovery factory
 */
export class JobPostDiscoveryServiceFactory implements IJobPostDiscoveryServiceFactory {
    constructor(private readonly logger: ILogger) {}
    create(source: IWorkdayJobSource): IJobPostDiscoveryService {
        const jobGateway: IJobGateway = new WorkdayJobsGateway({
            baseUrl: source.baseUrl,
            logger: this.logger,
        });

        const lookupMapper: IWorkdayJobsApiResponseMapper = new WorkdayJobsResponseMapper(source.id);

        const detailMapper: IWorkdayJobDetailsApiResponseMapper = new WorkdayJobDetailsApiResponseMapper();

        return new WorkdayJobDiscoveryService({
            jobGateway,
            detailMapper,
            lookupMapper,
            logger: this.logger,
        });
    }
}
