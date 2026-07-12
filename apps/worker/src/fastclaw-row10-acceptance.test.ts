import { describe, expect, it } from "vitest";

import { handleFastClawRow10AcceptanceRequest } from "./fastclaw-row10-acceptance.js";

const TOKEN = "row10-acceptance-token-that-is-at-least-thirty-two-bytes";

function request(path: string, token = TOKEN, acceptanceId = "row10-0123456789abcdef01234567") {
  return new Request(`https://row10.internal${path}`, {
    body: JSON.stringify({ acceptance_id: acceptanceId }),
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    method: "POST"
  });
}

describe("FastClaw Row10 private acceptance entrypoint", () => {
  it("reports health without exposing secret or mutation", async () => {
    const response = await handleFastClawRow10AcceptanceRequest(
      new Request("https://row10.internal/health"),
      { APP_ENV: "staging" }
    );
    await expect(response.json()).resolves.toEqual({
      environment: "staging",
      service: "fastclaw-row10-acceptance",
      status: "ready"
    });
  });

  it("rejects missing or wrong authorization before parsing live input", async () => {
    const response = await handleFastClawRow10AcceptanceRequest(
      request("/internal/row10/prepare", "wrong-token"),
      { FASTCLAW_ROW10_ACCEPTANCE_TOKEN: TOKEN }
    );
    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ status: "forbidden" });
  });

  it("rejects non-canonical acceptance identifiers", async () => {
    const response = await handleFastClawRow10AcceptanceRequest(
      request("/internal/row10/prepare", TOKEN, "row10-not-canonical"),
      { FASTCLAW_ROW10_ACCEPTANCE_TOKEN: TOKEN }
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ status: "invalid_acceptance_id" });
  });

  it("fails closed before mutation when any live binding is absent", async () => {
    const response = await handleFastClawRow10AcceptanceRequest(
      request("/internal/row10/prepare"),
      {
        APP_ENV: "staging",
        FASTCLAW_ROW10_ACCEPTANCE_TOKEN: TOKEN
      }
    );
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toMatchObject({
      failure_code: "ROW10_ACCEPTANCE_CONFIG_INVALID",
      status: "failed"
    });
  });
});
