import { openaiProvider } from "./openai";
import { getAllProviders, getProvider, registerProvider } from "./registry";

// Register built-in providers
registerProvider(openaiProvider);

export { registerProvider, getProvider, getAllProviders };
export { openaiProvider } from "./openai";
