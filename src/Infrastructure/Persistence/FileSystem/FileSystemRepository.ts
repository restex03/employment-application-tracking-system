import { promises as fs } from "fs";
import path from "path";
import { ILogger } from "../../Logging/ILogger";
import { IFileSystemRepository } from "./IFileSystemRepository";

export class FileSystemRepository implements IFileSystemRepository {
    constructor(
        private readonly baseDirectory: string,
        private readonly logger: ILogger
    ) {}

    public async storeFile(id: string, content: Buffer): Promise<void> {
        const filePath = this.resolvePath(id);
        this.logger.debug(`[FileSystemRepository.storeFile] Storing file: ${filePath}`);
        await fs.mkdir(this.baseDirectory, { recursive: true });
        await fs.writeFile(filePath, content);
    }

    public async readFile(id: string): Promise<Buffer> {
        const filePath = this.resolvePath(id);
        this.logger.debug(`[FileSystemRepository.readFile] Reading file: ${filePath}`);
        return fs.readFile(filePath);
    }

    private resolvePath(id: string): string {
        return path.join(this.baseDirectory, id);
    }
}
