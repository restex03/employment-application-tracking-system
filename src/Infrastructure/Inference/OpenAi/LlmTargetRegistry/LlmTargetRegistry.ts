export interface ILlmTargetOptions {
    model: string;
    apiBaseUrl: URL;
    apiKey: string;
}

export class LlmTargetRegistry {
    public static readonly Qwen3_4b_Instruct_8k: ILlmTargetOptions = {
        model: "qwen3:4b-instruct-8k",
        apiBaseUrl: new URL("http://localhost:11434/v1"),
        apiKey: "ollama",
    };
    public static readonly Qwen3_5_4b: ILlmTargetOptions = {
        model: "qwen3.5:4b",
        apiBaseUrl: new URL("http://localhost:11434/v1"),
        apiKey: "ollama",
    };
    public static readonly Ministral_3_8b: ILlmTargetOptions = {
        model: "ministral-3:8b",
        apiBaseUrl: new URL("http://localhost:11434/v1"),
        apiKey: "ollama",
    };
    public static readonly Granite4_2_3b: ILlmTargetOptions = {
        model: "granite4.2:3b",
        apiBaseUrl: new URL("http://localhost:11434/v1"),
        apiKey: "ollama",
    };
    public static readonly Granite4_2_8b: ILlmTargetOptions = {
        model: "granite4.2:8b",
        apiBaseUrl: new URL("http://localhost:11434/v1"),
        apiKey: "ollama",
    };
    public static readonly Gemma4_e4b_It_Qat: ILlmTargetOptions = {
        model: "gemma4:e4b-it-qat",
        apiBaseUrl: new URL("http://localhost:11434/v1"),
        apiKey: "ollama",
    };
    public static readonly Gemma4_e4b: ILlmTargetOptions = {
        model: "gemma4:e4b",
        apiBaseUrl: new URL("http://localhost:11434/v1"),
        apiKey: "ollama",
    };
    public static readonly Gemma3_4b: ILlmTargetOptions = {
        model: "gemma3:4b",
        apiBaseUrl: new URL("http://localhost:11434/v1"),
        apiKey: "ollama",
    };
    public static readonly Phi4_Mini_3_8b: ILlmTargetOptions = {
        model: "phi4-mini:3.8b",
        apiBaseUrl: new URL("http://localhost:11434/v1"),
        apiKey: "ollama",
    };
    public static readonly Qwen3_8b_8k: ILlmTargetOptions = {
        model: "qwen3:8b-8k",
        apiBaseUrl: new URL("http://localhost:11434/v1"),
        apiKey: "ollama",
    };
}
