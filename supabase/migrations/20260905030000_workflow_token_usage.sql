-- Provider-reported token usage for privacy-aware workflow observability.
-- No prompts, outputs, credentials, or provider payloads are stored here.

alter table public.workflow_runs
  add column if not exists input_tokens integer check (input_tokens is null or input_tokens >= 0),
  add column if not exists output_tokens integer check (output_tokens is null or output_tokens >= 0),
  add column if not exists total_tokens integer check (total_tokens is null or total_tokens >= 0);
