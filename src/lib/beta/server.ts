import "server-only";

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export class BetaUsageLimitError extends Error {
  constructor() {
    super("Your beta AI allowance is complete. You can still review existing work while you request more access.");
    this.name = "BetaUsageLimitError";
  }
}

export class BetaUsageUnavailableError extends Error {
  constructor() {
    super("We couldn't verify your beta usage right now. Please try again in a moment.");
    this.name = "BetaUsageUnavailableError";
  }
}

type RpcClient = SupabaseClient;

export type BetaUsageReservation = {
  id: string | null;
  registered: boolean;
  used: number;
  allowance: number | null;
  remaining: number | null;
};

async function betaRpc<T>(supabase: RpcClient, functionName: string, args: Record<string, unknown>) {
  const response = await (supabase as unknown as { rpc: (name: string, params: Record<string, unknown>) => Promise<{ data: T | null; error: { message?: string } | null }> }).rpc(functionName, args);
  return response;
}

export async function reserveBetaRequest(supabase: RpcClient, operation: string): Promise<BetaUsageReservation> {
  const response = await betaRpc<Array<{ allowed: boolean; reservation_id: string | null; registered: boolean; used_count: number; allowance: number | null; remaining: number | null }>>(supabase, "reserve_beta_request", {
    requested_operation: operation,
    requested_key: randomUUID(),
  });
  if (response.error || !response.data?.[0]) throw new BetaUsageUnavailableError();
  const row = response.data[0];
  if (!row.allowed) throw new BetaUsageLimitError();
  return { id: row.reservation_id, registered: row.registered, used: row.used_count, allowance: row.allowance, remaining: row.remaining };
}

export async function finalizeBetaRequest(supabase: RpcClient, reservationId: string | null, succeeded: boolean) {
  if (!reservationId) return;
  await betaRpc(supabase, "finalize_beta_request", { request_reservation_id: reservationId, succeeded });
}

export async function getBetaUsage(supabase: RpcClient) {
  const response = await betaRpc<Array<{ registered: boolean; used_count: number; allowance: number | null; remaining: number | null }>>(supabase, "get_my_beta_usage", {});
  if (response.error || !response.data?.[0]) return null;
  const row = response.data[0];
  return { registered: row.registered, used: row.used_count, allowance: row.allowance, remaining: row.remaining };
}

export async function getMyBetaParticipant(supabase: RpcClient) {
  const response = await betaRpc<Array<{ id: string; full_name: string; preferred_name: string | null; email: string; status: string; request_allowance: number; country_code: string | null; country_name: string | null }>>(supabase, "get_my_beta_participant", {});
  if (response.error || !response.data?.[0]) return null;
  return response.data[0];
}
