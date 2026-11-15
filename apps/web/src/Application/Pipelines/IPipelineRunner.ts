import { IPipelineRunnerResult } from "./IPipelineRunnerResult";

export interface IPipelineRunner<TContext> {
    run(context: TContext): Promise<IPipelineRunnerResult<TContext>>;
}
