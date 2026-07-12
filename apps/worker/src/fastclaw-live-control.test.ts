import { describe, expect, it, vi } from "vitest";

import type { SandboxTerminalLifecycleRecord } from "@aiphabee/agent-runtime";

import {
  PostgresFastClawTerminalUsageSink,
  ServiceBindingFastClawRunKiller
} from "./fastclaw-live-control.js";

const SECRET = "row10-live-control-secret-at-least-thirty-two-bytes";

function terminalRecord(): SandboxTerminalLifecycleRecord {
  return {
    cleanup: { execution_closed: true, release_safe: true, status: "destroyed" },
    execution_terminal_seen: true,
    kill_status: "not_requested",
    lease_id: "lease-row10",
    record_key: "run-row10:lease-row10:terminal:v0",
    requested_kill_reason: null,
    run_id: "run-row10",
    terminal_record_count: 1,
    terminal_state: "completed",
    usage: {
      cleanup_wall_clock_ms: 10,
      estimated: false,
      execution_wall_clock_ms: 200,
      exit_code: 0,
      lifecycle_wall_clock_ms: 250,
      measurement: "observed",
      output_event_count: 2,
      stderr_bytes: 0,
      stdout_bytes: 12
    },
    version: "2026-07-11.sandbox-terminal-lifecycle.v0"
  };
}

describe("FastClaw live terminal control", () => {
  it("maps one terminal lifecycle record into the observed PG usage authority", async () => {
    const recordObservedUsage = vi.fn(async (usage) => ({ replayed: false, usage }));
    const sink = new PostgresFastClawTerminalUsageSink(
      { recordObservedUsage },
      {
        account_id: "account-row10",
        model_input_tokens: 20,
        model_output_tokens: 8,
        request_id: "request-row10",
        sandbox_cpu_ms: 75,
        sandbox_peak_disk_bytes: 4096,
        sandbox_peak_memory_bytes: 8192,
        source_record_id: "row10-live-evidence",
        storage_bytes_read: 10,
        storage_bytes_written: 12,
        storage_delete_ops: 1,
        storage_read_ops: 1,
        storage_write_ops: 1,
        tool_calls_failed: 0,
        tool_calls_succeeded: 1,
        workspace_id: "workspace-row10"
      },
      () => new Date("2026-07-11T08:00:00.000Z")
    );

    await sink.record_terminal(terminalRecord());
    expect(recordObservedUsage).toHaveBeenCalledWith(
      expect.objectContaining({
        measurement: "observed",
        model_input_tokens: 20,
        run_id: "run-row10",
        sandbox_wall_clock_ms: 250,
        terminal_state: "completed"
      })
    );
  });

  it("mints run ownership and requires exact terminal kill readback", async () => {
    const fetch = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      const request = new Request(_input, init);
      expect(request.url).toMatch(/\/v1\/sandbox\/ab-[a-f0-9]{32}\/kill$/u);
      expect(request.headers.get("authorization")?.split(".")).toHaveLength(2);
      return Response.json({ status: "killed", terminal: true });
    });
    const killer = new ServiceBindingFastClawRunKiller({ fetch }, SECRET);
    await expect(
      killer.kill({
        reason: "admin acceptance kill",
        request_id: "request-row10-kill",
        run_id: "run-row10-kill",
        tenant_id: "workspace-row10",
        user_id: "account-row10"
      })
    ).resolves.toEqual({ status: "killed" });
  });

  it("fails closed on a non-terminal kill response", async () => {
    const killer = new ServiceBindingFastClawRunKiller(
      { fetch: vi.fn(async () => Response.json({ status: "killed", terminal: false })) },
      SECRET
    );
    await expect(
      killer.kill({
        reason: "admin acceptance kill",
        request_id: "request-row10-kill",
        run_id: "run-row10-kill",
        tenant_id: "workspace-row10",
        user_id: "account-row10"
      })
    ).rejects.toThrow("kill readback");
  });
});
