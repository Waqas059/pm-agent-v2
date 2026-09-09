export type IntegrationStatus = "connected" | "not_connected" | "not_enabled";

export type IntegrationDefinition = {
  name: string;
  purpose: string;
  status: IntegrationStatus;
  access: "server" | "read_only" | "none";
};

export type IntegrationConsent = {
  provider: string;
  action: "read" | "write";
  scopes: readonly string[];
  confirmed: boolean;
};

export const GITHUB_PUBLIC_PREVIEW_CONSENT: IntegrationConsent = {
  provider: "GitHub",
  action: "read",
  scopes: ["public_repository_metadata", "open_issue_summaries"],
  confirmed: true,
};

export function assertIntegrationConsent(consent: IntegrationConsent) {
  if (!consent.provider.trim()) throw new Error("An integration provider is required.");
  if (!consent.confirmed) throw new Error("External integration access requires explicit confirmation.");
  if (consent.scopes.length === 0) throw new Error("External integration access requires explicit scopes.");
  if (consent.action === "write") throw new Error("External write actions require a separate explicit authorization flow.");
}

export const integrationDefinitions: IntegrationDefinition[] = [
  { name: "Supabase", purpose: "Authentication, workspace records, and private files", status: "connected", access: "server" },
  { name: "LangChain Core", purpose: "Validated orchestration across the connected PM workflows", status: "connected", access: "server" },
  { name: "OpenAI Responses", purpose: "Grounded PM workflow generation", status: "connected", access: "server" },
  { name: "GitHub", purpose: "Optional source-control context", status: "not_connected", access: "read_only" },
  { name: "Messaging and project tools", purpose: "External delivery and task creation", status: "not_enabled", access: "none" },
];
