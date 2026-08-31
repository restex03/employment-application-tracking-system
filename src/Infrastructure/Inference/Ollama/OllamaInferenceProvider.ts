import OpenAI from "openai";
import { ILlmInferenceProvider } from "../ILlmInferenceProvider";

export class OllamaInferenceProvider implements ILlmInferenceProvider {
    private readonly _client: OpenAI;
    get client(): OpenAI {
        return this._client;
    }
    constructor() {
        this._client = new OpenAI({
            // TODO: Move to .env
            baseURL: "http://localhost:11434/v1",
            apiKey: "ollama",
        });
    }
}
