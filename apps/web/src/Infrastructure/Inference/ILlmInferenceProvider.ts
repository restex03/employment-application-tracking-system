import { z } from "zod";

export interface StructuredInferenceRequest<T> {
    systemPrompt: string;
    input: unknown;

    schemaName: string;
    jsonSchema: Record<string, unknown>;
    validationSchema: z.ZodType<T>;

    temperature?: number;
    maxTokens?: number;
}

export interface ILlmInferenceProvider {
    generateStructured<T>(request: StructuredInferenceRequest<T>): Promise<T>;
}
