import { describe, expect, it, vi } from "vitest";

const adminMock = vi.hoisted(() => {
  const participant = {
    id: "participant-1",
    full_name: "Ahmed Al-Qahtani",
    preferred_name: null,
    email: "ahmed@example.com",
    status: "registered",
    request_allowance: 10,
  };
  const insert = vi.fn(() => ({
    select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: participant, error: null }) })),
  }));
  const from = vi.fn(() => ({ insert }));
  return { createAdminClient: vi.fn(() => ({ from })), from, insert };
});

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: adminMock.createAdminClient }));

import { POST } from "./route";

describe("beta registration endpoint", () => {
  it("creates a server-controlled participant from only name and email", async () => {
    const response = await POST(new Request("http://localhost/api/beta/register", {
      method: "POST",
      body: JSON.stringify({ name: " Ahmed Al-Qahtani ", email: " AHMED@example.com ", request_allowance: 999, status: "active", country: "US" }),
      headers: { "Content-Type": "application/json" },
    }));

    expect(response.status).toBe(201);
    expect(adminMock.insert).toHaveBeenCalledWith({ full_name: "Ahmed Al-Qahtani", email: "ahmed@example.com", request_allowance: 10, status: "registered" });
    await expect(response.json()).resolves.toEqual({ participant: {
      id: "participant-1",
      full_name: "Ahmed Al-Qahtani",
      preferred_name: null,
      email: "ahmed@example.com",
      status: "registered",
      request_allowance: 10,
    } });
  });

  it("rejects incomplete registration without touching Supabase", async () => {
    adminMock.insert.mockClear();
    const response = await POST(new Request("http://localhost/api/beta/register", {
      method: "POST",
      body: JSON.stringify({ name: "", email: "not-an-email" }),
      headers: { "Content-Type": "application/json" },
    }));

    expect(response.status).toBe(400);
    expect(adminMock.insert).not.toHaveBeenCalled();
  });
});
