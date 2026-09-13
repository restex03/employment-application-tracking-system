import { FastifyInstance, FastifyRequest } from "fastify";
import { ILogger } from "../../Infrastructure/Logging/ILogger";
import { IRouteRegistrar } from "../Host/IRouteRegistrar";
import { NotFoundError } from "../../Application/Common/Errors/NotFoundError";
import { IJobApplicationService } from "../../Application/JobApplications/IJobApplicationService";

interface AttachmentUploadParams {
    id: string;
}

interface AttachmentDownloadParams {
    id: string;
    attachmentId: string;
}

interface AttachmentNotesUpdateParams {
    id: string;
    attachmentId: string;
}

interface AttachmentNotesUpdateBody {
    notes?: string;
}

export class AttachmentsRoutes implements IRouteRegistrar {
    constructor(
        private readonly jobApplicationService: IJobApplicationService,
        private readonly logger: ILogger
    ) {}

    public register(server: FastifyInstance): void {
        server.post(
            "/job-applications/:id/attachments",
            async (request: FastifyRequest<{ Params: AttachmentUploadParams }>, reply) => {
                try {
                    this.logger.info(`[${request.method}]  ${request.url}`);
                    const { id } = request.params;
                    const fileName = request.headers["x-file-name"];

                    if (!fileName || typeof fileName !== "string") {
                        return reply.code(400).send({ error: "X-File-Name header is required." });
                    }

                    const content = request.body as Buffer;
                    if (!Buffer.isBuffer(content) || content.length === 0) {
                        return reply.code(400).send({ error: "File content is required." });
                    }

                    await this.jobApplicationService.addAttachment(id, fileName, content);

                    return reply.code(201).send();
                } catch (error) {
                    const errMsg = error instanceof Error ? error.message : String(error);
                    this.logger.error(`[${request.method}]  ${request.url} Failed: ${errMsg}`);

                    if (error instanceof NotFoundError) {
                        return reply.code(404).send({ error: errMsg });
                    }

                    return reply.code(500).send({
                        error: `Failed to upload attachment: ${errMsg}`,
                    });
                }
            }
        );

        server.get(
            "/job-applications/:id/attachments/:attachmentId",
            async (request: FastifyRequest<{ Params: AttachmentDownloadParams }>, reply) => {
                try {
                    this.logger.info(`[${request.method}]  ${request.url}`);
                    const { id, attachmentId } = request.params;
                    const { fileName, content } = await this.jobApplicationService.getAttachment(id, attachmentId);

                    reply.header("Content-Disposition", `attachment; filename="${fileName}"`);
                    reply.header("Content-Type", "application/octet-stream");
                    return reply.code(200).send(content);
                } catch (error) {
                    const errMsg = error instanceof Error ? error.message : String(error);
                    this.logger.error(`[${request.method}]  ${request.url} Failed: ${errMsg}`);

                    if (error instanceof NotFoundError) {
                        return reply.code(404).send({ error: errMsg });
                    }

                    return reply.code(500).send({
                        error: `Failed to download attachment: ${errMsg}`,
                    });
                }
            }
        );

        server.post(
            "/job-applications/:id/attachments/:attachmentId/notes",
            async (
                request: FastifyRequest<{ Params: AttachmentNotesUpdateParams; Body: AttachmentNotesUpdateBody }>,
                reply
            ) => {
                try {
                    this.logger.info(`[${request.method}]  ${request.url}`);
                    const { id, attachmentId } = request.params;
                    const notes = request.body?.notes ?? "";

                    await this.jobApplicationService.updateAttachmentNotes(id, attachmentId, notes);

                    return reply.code(200).send();
                } catch (error) {
                    const errMsg = error instanceof Error ? error.message : String(error);
                    this.logger.error(`[${request.method}]  ${request.url} Failed: ${errMsg}`);

                    if (error instanceof NotFoundError) {
                        return reply.code(404).send({ error: errMsg });
                    }

                    return reply.code(500).send({
                        error: `Failed to update attachment notes: ${errMsg}`,
                    });
                }
            }
        );
    }
}
