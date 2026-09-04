import "server-only";

import OpenAI from "openai";

import { getOpenAIConfig } from "./env";

let cachedClient: OpenAI | undefined;

export function getOpenAIClient() {
  const { apiKey } = getOpenAIConfig();

  if (!cachedClient) {
    cachedClient = new OpenAI({ apiKey });
  }

  return cachedClient;
}
