import { describe, expect, it, vi } from "vitest";
import type { Client } from "pg";

import {
  PostgresFastClawDedicatedAgentAuthority,
  SandboxRunTokenFastClawAuthorizationIssuer,
  createFastClawPersonalAgentRunner
} from "./fastclaw-agent-runner.js";
import { FASTCLAW_TOOL_INTERCEPTION_CONTRACT_VERSION } from "@aiphabee/agent-runtime/fastclaw-agent-runner";

function client(authority: Record<string, unknown>, profiles: Record<string, unknown>[] = []) {
  const query = vi.fn(async (sql: string, params?: unknown[]) => {
    if (sql === "begin" || sql === "commit" || sql === "rollback") {
      return { rows: [] };
    }
    if (sql.includes("set_config('aiphabee.account_id'")) {
      expect(params).toEqual(["account-row7"]);
      return { rows: [] };
    }
    if (sql.includes("with authority as")) {
      return { rows: [{ ...authority, ...(profiles[0] ?? {}) }] };
    }
    throw new Error("unexpected SQL");
  });
  return { query } as unknown as Client;
}

const activeAuthority = {
  account_exists: true,
  account_status: "active",
  entitlement_approved: true,
  membership_active: true,
  product_access_active: true,
  subscription_active: true,
  workspace_exists: true,
  workspace_status: "active"
};

const activeProfile = {
  account_id: "account-row7",
  desired_state: "active",
  external_identity: "external-row7",
  fastclaw_agent_id: "agent-row7",
  fastclaw_user_id: "user-row7",
  lifecycle_status: "active",
  profile_id: "profile-row7",
  workspace_id: "workspace-row7"
};

describe("Worker FastClaw runner authority", () => {
  it("returns protected identity only for the exact active and currently entitled profile", async () => {
    const pg = client(activeAuthority, [activeProfile]);
    const result = await new PostgresFastClawDedicatedAgentAuthority(pg).resolve({
      tenant_id: "workspace-row7",
      user_id: "account-row7"
    });
    expect(result).toEqual({
      external_user_identity: "external-row7",
      fastclaw_agent_id: "agent-row7",
      fastclaw_user_id: "user-row7",
      profile_id: "profile-row7",
      status: "allowed",
      tenant_id: "workspace-row7",
      user_id: "account-row7"
    });
    expect(pg.query).toHaveBeenCalledWith(
      expect.stringContaining("where workspace_id = $2 and account_id = $1"),
      ["account-row7", "workspace-row7"]
    );
    expect(pg.query).toHaveBeenNthCalledWith(1, "begin");
    expect(pg.query).toHaveBeenNthCalledWith(
      2,
      "select set_config('aiphabee.account_id', $1, true)",
      ["account-row7"]
    );
    expect(pg.query).toHaveBeenLastCalledWith("commit");
  });

  it("blocks expired entitlement in the same snapshot as the protected profile", async () => {
    const pg = client({ ...activeAuthority, entitlement_approved: false });
    const result = await new PostgresFastClawDedicatedAgentAuthority(pg).resolve({
      tenant_id: "workspace-row7",
      user_id: "account-row7"
    });
    expect(result).toEqual({
      code: "FASTCLAW_RESEARCH_ENTITLEMENT_REQUIRED",
      retryable: false,
      status: "blocked"
    });
    expect(pg.query).toHaveBeenCalledTimes(4);
  });

  it("blocks absent, inactive, mismatched or incomplete profiles", async () => {
    const fixtures: Record<string, unknown>[][] = [
      [],
      [{ ...activeProfile, lifecycle_status: "disabled" }],
      [{ ...activeProfile, desired_state: "disabled" }],
      [{ ...activeProfile, workspace_id: "other-workspace" }],
      [{ ...activeProfile, fastclaw_agent_id: null }]
    ];
    for (const profiles of fixtures) {
      const result = await new PostgresFastClawDedicatedAgentAuthority(
        client(activeAuthority, profiles)
      ).resolve({ tenant_id: "workspace-row7", user_id: "account-row7" });
      expect(result).toEqual({
        code: "FASTCLAW_DEDICATED_IDENTITY_UNAVAILABLE",
        retryable: true,
        status: "blocked"
      });
    }
  });

  it("composes an immutable registered runner without adding an HTTP route", () => {
    const runner = createFastClawPersonalAgentRunner({
      client: client(activeAuthority, [activeProfile]),
      dependencies: {
        post_check: {
          check: async () => ({ final_answer: "approved", status: "approved" })
        },
        tool_policy_executor: {
          execute: async () => ({ output: {}, status: "completed" })
        },
        transport: {
          contract_version: FASTCLAW_TOOL_INTERCEPTION_CONTRACT_VERSION,
          run: async () => ({ raw_answer: "raw", usage: { input_tokens: 1, output_tokens: 1, steps: 1 } }),
          tool_interception: "callback_before_execution"
        }
      },
      sandbox_token_secret: "row7-sandbox-secret-that-is-at-least-thirty-two-bytes"
    });
    expect(runner).toMatchObject({
      family: "fastclaw",
      layer: "research",
      runner_id: "fastclaw.personal-v0",
      supported_modes: ["runner_remote"]
    });
    expect(Object.isFrozen(runner)).toBe(true);
  });

  it("issues only bounded run-owned sandbox authorization from the branded grant", async () => {
    const runner = createFastClawPersonalAgentRunner({
      client: client(activeAuthority, [activeProfile]),
      dependencies: {
        post_check: {
          check: async () => ({ final_answer: "approved", status: "approved" })
        },
        tool_policy_executor: {
          execute: async () => ({ output: {}, status: "completed" })
        },
        transport: {
          contract_version: FASTCLAW_TOOL_INTERCEPTION_CONTRACT_VERSION,
          run: async (input) => {
            expect(input.sandbox_authorization.split(".")).toHaveLength(2);
            return { raw_answer: "raw", usage: { input_tokens: 1, output_tokens: 1, steps: 1 } };
          },
          tool_interception: "callback_before_execution"
        }
      },
      sandbox_token_secret: "row7-sandbox-secret-that-is-at-least-thirty-two-bytes"
    });
    const events = [];
    for await (const event of runner.run({
      allowed_tools: [],
      budget: {
        max_credits: 1,
        max_parallel_tools: 1,
        max_rows: 1,
        max_steps: 2,
        max_tokens: 10,
        max_wall_clock_ms: 1_000
      },
      context_refs: {},
      layer: "research",
      mode: "runner_remote",
      prompt: "reason without tools",
      request_id: "request-worker-row7",
      run_id: "run-worker-row7",
      tenant_id: "workspace-row7",
      user_id: "account-row7"
    })) events.push(event);
    expect(events.at(-1)).toMatchObject({ event_type: "run.completed" });
  });

  it("rejects session ownership at the concrete token issuer boundary", async () => {
    const issuer = new SandboxRunTokenFastClawAuthorizationIssuer(
      "row7-sandbox-secret-that-is-at-least-thirty-two-bytes"
    );
    await expect(
      issuer.issue({
        access_grant: {
          layer: "research",
          owner: { kind: "session", session_id: "session-row7" },
          run_mode: "runner_remote",
          runner_family: "fastclaw",
          runner_id: "fastclaw.personal-v0",
          runner_selection_contract_version: "2026-07-10.agent-runner-selection.v0",
          source: "agent_runner_selection",
          tenant_id: "workspace-row7",
          user_id: "account-row7"
        } as never,
        budget: {
          max_credits: 1,
          max_parallel_tools: 1,
          max_rows: 1,
          max_steps: 1,
          max_tokens: 1,
          max_wall_clock_ms: 1_000
        }
      })
    ).rejects.toThrow("FASTCLAW_RUN_OWNERSHIP_REQUIRED");
  });
});
