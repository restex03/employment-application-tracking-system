export interface ILlmTargetOptions {
    model: string;
    apiBaseUrl: URL;
    apiKey: string;
    reasoningEffort?: "none" | "minimal" | "low" | "medium" | "high";
}

export class LlmTargetRegistry {
    public static readonly OpenRouter_Hosted: ILlmTargetOptions = {
        model: "z-ai/glm-5.3-flash",
        apiBaseUrl: new URL("https://openrouter.ai/api/v1"),
        apiKey: this.resolveEnvOrThrow(process.env.OPEN_ROUTER_KEY),
        reasoningEffort: "low",
    };
    public static readonly Glm_5_3_Flash_Hosted: ILlmTargetOptions = {
        model: "z-ai/glm-5.3-flash",
        apiBaseUrl: new URL("https://openrouter.ai/api/v1"),
        apiKey: this.resolveEnvOrThrow(process.env.OPEN_ROUTER_KEY),
        reasoningEffort: "low",
    };
    public static readonly Llama_4_Scout_Hosted: ILlmTargetOptions = {
        model: "meta-llama/llama-4-scout",
        apiBaseUrl: new URL("https://openrouter.ai/api/v1"),
        apiKey: this.resolveEnvOrThrow(process.env.OPEN_ROUTER_KEY),
        reasoningEffort: "low", // Seems to require some reasoning effort
    };

    public static readonly Qwen3_8_Flash_Hosted: ILlmTargetOptions = {
        model: "qwen/qwen3.8-flash",
        apiBaseUrl: new URL("https://openrouter.ai/api/v1"),
        apiKey: this.resolveEnvOrThrow(process.env.OPEN_ROUTER_KEY),
        reasoningEffort: "none",
    };

    public static readonly Qwen3_4b_Instruct_8k: ILlmTargetOptions = {
        model: "qwen3:4b-instruct-8k",
        apiBaseUrl: new URL("http://localhost:11434/v1"),
        apiKey: "ollama",
        reasoningEffort: "none",
    };
    public static readonly Qwen3_5_4b: ILlmTargetOptions = {
        model: "qwen3.5:4b",
        apiBaseUrl: new URL("http://localhost:11434/v1"),
        apiKey: "ollama",
        reasoningEffort: "none",
    };

    /**
     * Mistral Small 4 hosted model configuration.
     * Currently the top contender for hosted Mistral models.
     */
    public static readonly Mistral_Small_4_hosted: ILlmTargetOptions = {
        model: "mistral-small-2603",
        apiBaseUrl: new URL("https://api.mistral.ai/v1"),
        apiKey: process.env.MISTRAL_API_KEY!,
        reasoningEffort: "none",
    };
    public static readonly Mistral_Medium_3_5_hosted: ILlmTargetOptions = {
        model: "mistral-medium-3-5",
        apiBaseUrl: new URL("https://api.mistral.ai/v1"),
        apiKey: process.env.MISTRAL_API_KEY!,
        reasoningEffort: "none",
    };

    public static readonly Granite4_2_8b: ILlmTargetOptions = {
        model: "granite4.2:8b",
        apiBaseUrl: new URL("http://localhost:11434/v1"),
        apiKey: "ollama",
        reasoningEffort: "none",
    };
    public static readonly Gemma4_e4b_It_Qat: ILlmTargetOptions = {
        model: "gemma4:e4b-it-qat",
        apiBaseUrl: new URL("http://localhost:11434/v1"),
        apiKey: "ollama",
        reasoningEffort: "none",
    };
    public static readonly Qwen3_8b_8k: ILlmTargetOptions = {
        model: "qwen3:8b-8k",
        apiBaseUrl: new URL("http://localhost:11434/v1"),
        apiKey: "ollama",
    };

    // public static readonly Ministral_3_8b: ILlmTargetOptions = {
    //     model: "ministral-3:8b",
    //     apiBaseUrl: new URL("http://localhost:11434/v1"),
    //     apiKey: "ollama",
    // };

    // public static readonly Granite4_2_3b: ILlmTargetOptions = {
    //     model: "granite4.2:3b",
    //     apiBaseUrl: new URL("http://localhost:11434/v1"),
    //     apiKey: "ollama",
    // };
    // // This model tested extremely poorly so removing as an option but keeping the code for reference.
    // public static readonly Ministral_3_8b_hosted: ILlmTargetOptions = {
    //     apiBaseUrl: new URL("https://api.mistral.ai/v1"),
    //     apiKey: LlmTargetRegistry.resolveEnvOrThrow(process.env.MISTRAL_API_KEY),
    //     model: "ministral-8b-2512",
    // };

    // public static readonly Gemma4_e4b: ILlmTargetOptions = {
    //     model: "gemma4:e4b",
    //     apiBaseUrl: new URL("http://localhost:11434/v1"),
    //     apiKey: "ollama",
    // };
    // public static readonly Gemma3_4b: ILlmTargetOptions = {
    //     model: "gemma3:4b",
    //     apiBaseUrl: new URL("http://localhost:11434/v1"),
    //     apiKey: "ollama",
    // };
    // public static readonly Phi4_Mini_3_8b: ILlmTargetOptions = {
    //     model: "phi4-mini:3.8b",
    //     apiBaseUrl: new URL("http://localhost:11434/v1"),
    //     apiKey: "ollama",
    // };

    private static resolveEnvOrThrow(envVar: string | undefined): string {
        if (!envVar) {
            throw new Error(`Environment variable not set: ${envVar ?? "undefined"}`);
        }
        return envVar;
    }
}
