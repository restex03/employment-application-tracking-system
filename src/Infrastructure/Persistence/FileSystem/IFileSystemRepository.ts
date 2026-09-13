export interface IFileSystemRepository {
    storeFile(id: string, content: Buffer): Promise<void>;
    readFile(id: string): Promise<Buffer>;
}
