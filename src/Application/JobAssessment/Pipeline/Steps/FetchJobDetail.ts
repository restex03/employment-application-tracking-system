import { IJobPostDiscoveryServiceFactory } from "../../../JobPostDiscovery/IJobPostDiscoveryServiceFactory";
import { IPipelineStep } from "../../../Pipelines/IPipelineStep";
import { IPipelineStepResult, PipelineStepStatus } from "../../../Pipelines/IPipelineStepResult";
import { IJobAssessmentContext } from "../IJobAssessmentContext";

export class FetchJobDetails implements IPipelineStep<IJobAssessmentContext> {
    constructor(private readonly jobDiscoveryService: IJobPostDiscoveryServiceFactory) {}
    public async execute(context: IJobAssessmentContext): Promise<IPipelineStepResult> {
        try {
            const svc = this.jobDiscoveryService.create(context.jobSource);
            const jobDetail = await svc.fetchDetail(context.job);

            if (!jobDetail) {
                return {
                    status: PipelineStepStatus.Failed,
                    reason: "No job details returned from JobPostFetchService.",
                };
            }

            context.jobDetail = jobDetail;

            return {
                status: PipelineStepStatus.Succeeded,
            };
        } catch (error) {
            return {
                status: PipelineStepStatus.Failed,
                reason: error instanceof Error ? error.message : "Failed to fetch job details.",
            };
        }
    }
}
