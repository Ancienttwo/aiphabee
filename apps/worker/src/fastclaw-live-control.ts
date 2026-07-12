import { issueSandboxRunToken } from "@aiphabee/sandbox-run-auth";
import type { SandboxTerminalLifecycleRecord } from "@aiphabee/agent-runtime";

import {
  FASTCLAW_USAGE_METHODOLOGY_VERSION,
  type ResearchAgentObservedUsage,
  type ResearchAgentProductControlRepository,
  type ResearchAgentRunKiller
} from "./research-agent-product-control.js";

export interface SandboxBridgeServiceBinding {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export interface FastClawObservedTerminalUsageContext {
  account_id: string;
  model_input_tokens: number;
  model_output_tokens: number;
  request_id: string;
  sandbox_cpu_ms: number;
  sandbox_peak_disk_bytes: number;
  sandbox_peak_memory_bytes: number;
  source_record_id: string;
  storage_bytes_read: number;
  storage_bytes_written: number;
  storage_delete_ops: number;
  storage_read_ops: number;
  storage_write_ops: number;
  tool_calls_failed: number;
  tool_calls_succeeded: number;
  workspace_id: string;
}

export class PostgresFastClawTerminalUsageSink {
  constructor(
    private readonly repository: Pick<ResearchAgentProductControlRepository, "recordObservedUsage">,
    private readonly context: FastClawObservedTerminalUsageContext,
    private readonly now: () => Date = () => new Date()
  ) {}

  async record_terminal(record: SandboxTerminalLifecycleRecord): Promise<void> {
    if (record.usage.measurement !== "observed" || record.usage.estimated !== false) {
      throw new Error("FastClaw terminal usage requires observed lifecycle evidence");
    }
    const usage: ResearchAgentObservedUsage = {
      account_id: this.context.account_id,
      credit_delta: 0,
      measurement: "observed",
      methodology_version: FASTCLAW_USAGE_METHODOLOGY_VERSION,
      model_input_tokens: this.context.model_input_tokens,
      model_output_tokens: this.context.model_output_tokens,
      occurred_at: this.now().toISOString(),
      request_id: this.context.request_id,
      rights_policy_version: "default_deny",
      run_id: record.run_id,
      sandbox_cpu_ms: this.context.sandbox_cpu_ms,
      sandbox_peak_disk_bytes: this.context.sandbox_peak_disk_bytes,
      sandbox_peak_memory_bytes: this.context.sandbox_peak_memory_bytes,
      sandbox_wall_clock_ms: record.usage.lifecycle_wall_clock_ms,
      source_record_id: this.context.source_record_id,
      storage_bytes_read: this.context.storage_bytes_read,
      storage_bytes_written: this.context.storage_bytes_written,
      storage_delete_ops: this.context.storage_delete_ops,
      storage_read_ops: this.context.storage_read_ops,
      storage_write_ops: this.context.storage_write_ops,
      terminal_state: record.terminal_state,
      tool_calls_failed: this.context.tool_calls_failed,
      tool_calls_succeeded: this.context.tool_calls_succeeded,
      workspace_id: this.context.workspace_id
    };
    await this.repository.recordObservedUsage(usage);
  }
}

export class ServiceBindingFastClawRunKiller implements ResearchAgentRunKiller {
  constructor(
    private readonly service: SandboxBridgeServiceBinding,
    private readonly sandboxTokenSecret: string
  ) {
    if (sandboxTokenSecret.length < 32) throw new Error("sandbox kill token secret is invalid");
  }

  async kill(input: {
    reason: string;
    request_id: string;
    run_id: string;
    tenant_id: string;
    user_id: string;
  }): Promise<{ status: "already_terminal" | "killed" }> {
    const issued = await issueSandboxRunToken({
      maxCalls: 4,
      runId: input.run_id,
      scopes: ["sandbox:destroy", "sandbox:status"],
      secret: this.sandboxTokenSecret,
      tenantId: input.tenant_id,
      ttlSeconds: 60,
      userId: input.user_id
    });
    const response = await this.service.fetch(
      `https://sandbox-bridge/v1/sandbox/${encodeURIComponent(issued.sandbox_id)}/kill`,
      {
        headers: {
          authorization: `Bearer ${issued.token}`,
          "x-aiphabee-kill-reason": input.reason,
          "x-aiphabee-request-id": input.request_id
        },
        method: "POST"
      }
    );
    if (!response.ok || !response.headers.get("content-type")?.startsWith("application/json")) {
      await response.body?.cancel().catch(() => undefined);
      throw new Error("sandbox kill dispatch failed");
    }
    const result = (await response.json()) as Record<string, unknown>;
    if (
      result.terminal !== true ||
      (result.status !== "killed" && result.status !== "already_terminal")
    ) {
      throw new Error("sandbox kill readback is invalid");
    }
    return { status: result.status };
  }
}
