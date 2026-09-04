type OpenAIEnvironment = {
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
};

export type OpenAIConfig = {
  apiKey: string;
  model: string;
};

const runtimeEnvironment: OpenAIEnvironment = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
};

export function getOpenAIConfig(environment: OpenAIEnvironment = runtimeEnvironment): OpenAIConfig {
  const apiKey = environment.OPENAI_API_KEY?.trim();
  const model = environment.OPENAI_MODEL?.trim();

  if (!apiKey || !model) {
    throw new Error("OpenAI is not configured. Set OPENAI_API_KEY and OPENAI_MODEL on the server.");
  }

  if (apiKey.length < 20) {
    throw new Error("OPENAI_API_KEY must be a valid server-side API key.");
  }

  if (model.length > 100) {
    throw new Error("OPENAI_MODEL must be 100 characters or fewer.");
  }

  return { apiKey, model };
}
