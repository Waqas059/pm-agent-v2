export type IntegrationStatus = "connected" | "not_connected" | "not_enabled";

export type IntegrationDefinition = {
  name: string;
  purpose: string;
  status: IntegrationStatus;
  access: "server" | "read_only" | "none";
};

export const integrationDefinitions: IntegrationDefinition[] = [
  { name: "Supabase", purpose: "Authentication, workspace records, and private files", status: "connected", access: "server" },
  { name: "OpenAI Responses", purpose: "Grounded PM workflow generation", status: "connected", access: "server" },
  { name: "GitHub", purpose: "Optional source-control context", status: "not_connected", access: "read_only" },
  { name: "Messaging and project tools", purpose: "External delivery and task creation", status: "not_enabled", access: "none" },
];
