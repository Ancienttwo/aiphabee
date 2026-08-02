import { describe, expect, test } from "vitest";
import contract from "./error-taxonomy-reconciliation.contract.json";

const expectedSourceSets = [
  "agent_recovery_non_retryable",
  "agent_recovery_retryable",
  "agent_runtime_input",
  "data_contracts_public",
  "fastclaw_runner_private",
  "mcp_private",
  "mcp_public",
  "tool_registry_declared"
];

function clone() {
  return JSON.parse(JSON.stringify(contract)) as typeof contract;
}

function validate(value: typeof contract): string[] {
  const errors: string[] = [];
  const entries = value.entries as Array<(typeof value.entries)[number]>;
  const sourceCodes = new Set(value.source_sets.flatMap((source) => source.codes));
  const entryCodes = new Set(entries.map((entry) => entry.code));

  if (entries.length !== entryCodes.size) errors.push("multiple matrix entries");
  for (const code of sourceCodes) if (!entryCodes.has(code)) errors.push(`missing:${code}`);
  for (const code of entryCodes) if (!sourceCodes.has(code)) errors.push(`extra:${code}`);
  if (value.compatibility_aliases.length > 0) errors.push("compatibility_aliases");
  if (value.unknown_policy.emit_raw_internal_code_publicly) errors.push("unknown_redaction");

  for (const entry of entries) {
    if (!Array.isArray(entry.retry.policies) || entry.retry.policies.length === 0) {
      errors.push(`retry:${entry.code}`);
    }
    if (
      entry.exposure === "internal_only" &&
      (entry.channel_mapping.mcp !== null || entry.channel_mapping.web !== null)
    ) {
      errors.push(`private_channel_leak:${entry.code}`);
    }
  }
  return errors;
}

describe("error taxonomy reconciliation contract", () => {
  test("defines the canonical reconciliation-only authority", () => {
    expect(contract).toMatchObject({
      schema_version: 1,
      contract_version: "2026-07-13.error-taxonomy-reconciliation.v1",
      status: "local_contract",
      authority: {
        matrix_owner: "@aiphabee/data-contracts",
        scope: "cross_owner_reconciliation_only",
        owner_types_remain_authoritative: true,
        global_runtime_enum: false
      }
    });
    expect(contract.entries).toHaveLength(80);
    expect(contract.source_sets.map((source) => source.source_set_id).sort()).toEqual(
      expectedSourceSets
    );
    expect(validate(clone())).toEqual([]);
  });

  test("rejects missing, extra, and duplicate matrix codes", () => {
    const missing = clone();
    missing.entries.pop();
    expect(validate(missing)).toContainEqual(expect.stringMatching(/^missing:/));

    const extra = clone();
    extra.entries.push({ ...extra.entries[0], code: "PACK_ONLY_ERROR" });
    expect(validate(extra)).toContain("extra:PACK_ONLY_ERROR");

    const duplicate = clone();
    duplicate.entries.push({ ...duplicate.entries[0] });
    expect(validate(duplicate)).toContain("multiple matrix entries");
  });

  test("rejects aliases and private channel leakage", () => {
    const alias = clone();
    alias.compatibility_aliases.push("OLD_TO_NEW" as never);
    expect(validate(alias)).toContain("compatibility_aliases");

    const leakage = clone();
    const entry = leakage.entries.find((item) => item.code === "FASTCLAW_TRANSPORT_FAILED");
    expect(entry).toBeDefined();
    if (entry) entry.channel_mapping.mcp = "INTERNAL_ERROR";
    expect(validate(leakage)).toContain("private_channel_leak:FASTCLAW_TRANSPORT_FAILED");
  });

  test("rejects heuristic retry and raw unknown-code exposure", () => {
    const retry = clone();
    const entry = retry.entries.find((item) => item.code === "PROVIDER_UNAVAILABLE");
    expect(entry).toBeDefined();
    if (entry) entry.retry.policies = [];
    expect(validate(retry)).toContain("retry:PROVIDER_UNAVAILABLE");

    const unknown = clone();
    unknown.unknown_policy.emit_raw_internal_code_publicly = true;
    expect(validate(unknown)).toContain("unknown_redaction");
  });
});
