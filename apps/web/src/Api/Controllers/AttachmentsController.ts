import {
    BadRequestException,
    Body,
    Controller,
    Get,
    Headers,
    Inject,
    NotFoundException,
    Param,
    Post,
    Res,
} from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { z } from "zod";
import { NotFoundError } from "../../Application/Common/Errors/NotFoundError";
import { IJobApplicationService } from "../../Application/JobApplications/IJobApplicationService";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { TOKENS } from "../../DependencyInjection/tokens";
import {
    attachmentBodySchema,
    attachmentDownloadParamsSchema,
    attachmentParamsSchema,
} from "../Schemas/ApiRouteSchemas";
import { throwInternalError } from "./controller-errors";

@Controller("job-applications/:id/attachments")
export class AttachmentsController {
    constructor(
        @Inject(TOKENS.jobApplicationService) private readonly applications: IJobApplicationService,
        @Inject(TOKENS.logger) private readonly logger: ILogger
    ) {}

    @Post()
    async upload(
        @Param({ schema: attachmentParamsSchema }) params: z.infer<typeof attachmentParamsSchema>,
        @Headers("x-file-name") fileName: string | undefined,
        @Body({ schema: attachmentBodySchema }) content: Buffer
    ) {
        const context = `[POST] /api/v1/job-applications/${params.id}/attachments`;
        this.logger.info(context);
        if (!fileName) {
            throw new BadRequestException({ error: "X-File-Name header is required." });
        }

        try {
            await this.applications.addAttachment(params.id, fileName, content);
            return undefined;
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw new NotFoundException({ error: error.message });
            }

            return throwInternalError(this.logger, context, "Failed to upload attachment", error);
        }
    }

    @Get(":attachmentId")
    async download(
        @Param({ schema: attachmentDownloadParamsSchema }) params: z.infer<typeof attachmentDownloadParamsSchema>,
        @Res({ passthrough: true }) reply: FastifyReply
    ) {
        const context = `[GET] /api/v1/job-applications/${params.id}/attachments/${params.attachmentId}`;
        this.logger.info(context);
        try {
            const { fileName, content } = await this.applications.getAttachment(params.id, params.attachmentId);
            reply.header("Content-Disposition", `attachment; filename="${fileName}"`);
            reply.header("Content-Type", "application/octet-stream");
            return content;
        } catch (error) {
            if (error instanceof NotFoundError) {
                throw new NotFoundException({ error: error.message });
            }

            return throwInternalError(this.logger, context, "Failed to download attachment", error);
        }
    }
}
