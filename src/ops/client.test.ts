import { describe, expect, it, vi } from "vitest";
import { OpsClient, OpsHttpError, getOpsConfig } from "./client.js";

describe("OpsClient", () => {
  it("sends both bearer and cookie auth headers for authenticated routes", async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const client = new OpsClient({
      baseUrl: "http://127.0.0.1:2222/",
      token: "jwt-token",
      mailBaseUrl: "https://mail.example.com/",
      threadBaseUrl: "https://threads.example.com/",
      fetchImpl: fetchImpl as typeof fetch,
    });

    await client.listThreads();

    expect(fetchImpl).toHaveBeenCalledWith("https://threads.example.com/api/admin/threads", {
      method: "GET",
      headers: {
        Authorization: "Bearer jwt-token",
        Cookie: "jwt=jwt-token",
      },
      body: undefined,
    });
  });

  it("reads dedicated mailbox and thread base URLs from config", () => {
    expect(
      getOpsConfig({
        ops: {
          baseUrl: "http://127.0.0.1:2222",
          mailBaseUrl: "https://mail.example.com",
          threadBaseUrl: "https://threads.example.com",
          token: "abc",
        },
      }),
    ).toEqual({
      baseUrl: "http://127.0.0.1:2222",
      mailBaseUrl: "https://mail.example.com",
      threadBaseUrl: "https://threads.example.com",
      token: "abc",
    });
  });

  it("surfaces response payload errors", async () => {
    const fetchImpl = vi.fn(
      async () => new Response(JSON.stringify({ error: "No token" }), { status: 401 }),
    );
    const client = new OpsClient({
      baseUrl: "http://127.0.0.1:2222",
      token: "expired",
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(client.getWorkspace()).rejects.toMatchObject<Partial<OpsHttpError>>({
      name: "OpsHttpError",
      status: 401,
      message: "No token",
    });
  });
});
