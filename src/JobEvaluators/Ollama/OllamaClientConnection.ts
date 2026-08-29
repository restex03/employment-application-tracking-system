import { OpenAI } from "openai";

export interface OpenAiConnection {
    client: OpenAI;
}

export class OllamaClientConnection implements OpenAiConnection {
    private readonly _client: OpenAI;
    get client(): OpenAI {
        return this._client;
    }
    constructor() {
        this._client = new OpenAI({
            baseURL: "http://localhost:11434/v1",
            apiKey: "ollama",
        });
    }
}
