import type { Client } from "pg";
import { describe, expect, it, vi } from "vitest";

import {
  createFastClawLiveAgentRunner,
  createFastClawLiveControlPlane
} from "./fastclaw-live-composition.js";

function client(): Client {
  return {
    query: vi.fn(async () => ({
      rows: [
        {
          account_exists: true,
          account_id: "account-row10",
          account_status: "active",
          desired_state: "active",
          entitlement_approved: true,
          external_identity: "external-row10",
          fastclaw_agent_id: "agent-row10",
          fastclaw_user_id: "user-row10",
          lifecycle_status: "active",
          membership_active: true,
          product_access_active: true,
          profile_id: "profile-row10",
          subscription_active: true,
          workspace_exists: true,
          workspace_id: "workspace-row10",
          workspace_status: "active"
        }
      ]
    }))
  } as unknown as Client;
}

describe("FastClaw live private composition", () => {
  it("runs through the service-binding callback transport and AiphaBee post-check", async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(_input, init);
      expect(request.headers.get("X-AiphaBee-FastClaw-User-Id")).toBe("user-row10");
      expect(request.headers.get("X-AiphaBee-Sandbox-Authorization")?.split(".")).toHaveLength(2);
      return new Response(
        `${JSON.stringify({ run_id: "run-live-row10", type: "remote_accepted" })}\n${JSON.stringify({
          raw_answer: "untrusted raw answer",
          run_id: "run-live-row10",
          type: "final",
          usage: { input_tokens: 12, output_tokens: 4, steps: 0 }
        })}\n`,
        { headers: { "content-type": "application/x-ndjson" }, status: 200 }
      );
    });
    const postCheck = vi.fn(async () => ({
      final_answer: "approved AiphaBee answer",
      status: "approved" as const
    }));
    const runner = createFastClawLiveAgentRunner({
      client: client(),
      fastclaw_admin_api_key: "admin-key",
      fastclaw_base_url: "https://fastclaw.internal/",
      fastclaw_control_service: { fetch },
      post_check: { check: postCheck },
      sandbox_token_secret: "row10-sandbox-secret-that-is-at-least-thirty-two-bytes",
      tool_policy_executor: {
        execute: vi.fn(async () => ({ output: {}, status: "completed" as const }))
      }
    });
    const events = [];
    for await (const event of runner.run({
      allowed_tools: [],
      budget: {
        max_credits: 1,
        max_parallel_tools: 1,
        max_rows: 1,
        max_steps: 1,
        max_tokens: 20,
        max_wall_clock_ms: 1_000
      },
      context_refs: {},
      layer: "research",
      mode: "runner_remote",
      prompt: "Run without tools.",
      request_id: "request-live-row10",
      run_id: "run-live-row10",
      tenant_id: "workspace-row10",
      user_id: "account-row10"
    })) events.push(event);

    expect(events.at(-1)).toMatchObject({
      event_type: "run.completed",
      payload: {
        answer: "approved AiphaBee answer",
        usage: { input_tokens: 12, output_tokens: 4, steps: 0 }
      }
    });
    expect(postCheck).toHaveBeenCalledWith(
      expect.objectContaining({ raw_answer: "untrusted raw answer" })
    );
    expect(JSON.stringify(events)).not.toContain("untrusted raw answer");
  });

  it("wires scanner, durable stores, terminal usage and kill to the private control plane", () => {
    const fetch = vi.fn();
    const control = createFastClawLiveControlPlane({
      artifact_scanner_service: { fetch },
      artifact_scanner_shared_key: "scanner-key-that-is-at-least-thirty-two-bytes",
      client: client(),
      durable_handoff_bucket: {
        delete: vi.fn(),
        get: vi.fn(),
        put: vi.fn()
      },
      fastclaw_admin_api_key: "admin-key",
      fastclaw_base_url: "https://fastclaw.internal/",
      fastclaw_control_service: { fetch },
      post_check: {
        check: vi.fn(async () => ({ final_answer: "approved", status: "approved" as const }))
      },
      sandbox_bridge_service: { fetch },
      sandbox_token_secret: "row10-sandbox-secret-that-is-at-least-thirty-two-bytes",
      tool_policy_executor: {
        execute: vi.fn(async () => ({ output: {}, status: "completed" as const }))
      }
    });

    expect(control.runner.runner_id).toBe("fastclaw.personal-v0");
    expect(control.artifact_scanner).toBeDefined();
    expect(control.durable_handoff.metadata_store).toBeDefined();
    expect(control.durable_handoff.object_store).toBeDefined();
    expect(control.run_killer).toBeDefined();
    expect(
      control.create_terminal_usage_sink({
        account_id: "account-row10",
        model_input_tokens: 0,
        model_output_tokens: 0,
        request_id: "request-row10",
        sandbox_cpu_ms: 0,
        sandbox_peak_disk_bytes: 0,
        sandbox_peak_memory_bytes: 0,
        source_record_id: "row10-live-evidence",
        storage_bytes_read: 0,
        storage_bytes_written: 0,
        storage_delete_ops: 0,
        storage_read_ops: 0,
        storage_write_ops: 0,
        tool_calls_failed: 0,
        tool_calls_succeeded: 0,
        workspace_id: "workspace-row10"
      })
    ).toBeDefined();
  });
});
