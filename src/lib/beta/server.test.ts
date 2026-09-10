import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { BetaUsageLimitError, BetaUsageUnavailableError, reserveBetaRequest } from "./server";

describe("beta request reservations", () => {
  it("fails closed when the reservation RPC is unavailable", async () => {
    const supabase = { rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "rpc unavailable" } }) };
    await expect(reserveBetaRequest(supabase as never, "discover")).rejects.toBeInstanceOf(BetaUsageUnavailableError);
  });

  it("blocks before provider execution when the allowance is complete", async () => {
    const supabase = { rpc: vi.fn().mockResolvedValue({ data: [{ allowed: false, reservation_id: null, registered: true, used_count: 10, allowance: 10, remaining: 0 }], error: null }) };
    await expect(reserveBetaRequest(supabase as never, "discover")).rejects.toBeInstanceOf(BetaUsageLimitError);
  });
});
