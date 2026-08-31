import { OpenAI } from "openai";
export interface ILlmInferenceProvider {
    get client(): OpenAI;
}
