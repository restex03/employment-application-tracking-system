import { z } from "zod";
import { OpenAI } from "openai";

export interface StructuredInferenceRequest<T> {
    model: string;
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
