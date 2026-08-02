import { describe, expect, test } from "vitest";
import contract from "./business-output-evidence-composition.contract.json";
import fixtures from "./business-output-evidence-composition.fixtures.json";

describe("business output evidence composition contract", () => {
  test("is a reconciliation ledger rather than a runtime schema", () => {
    expect(contract.authority).toEqual({
      matrix_owner: "@aiphabee/data-contracts",
      scope: "cross_owner_composition_only",
      runtime_payload_schema: false,
      storage_model: false,
      channel_semantics_owner: false,
      owner_contracts_remain_authoritative: true
    });
    expect(contract.representative_output_families.map((x) => x.id)).toEqual([
      "direct_factual_observation",
      "deterministic_derived_metric",
      "multi_evidence_research_synthesis"
    ]);
  });

  test("requires canonical refs for every emitted projection", () => {
    for (const fixture of fixtures.filter((x) => x.expected.emit_projection)) {
      expect(fixture.projection?.evidence_record_ids.length).toBeGreaterThan(0);
      expect(fixture.projection?.evidence_source_ref_ids.length).toBeGreaterThan(0);
      expect(fixture.projection?.source_record_ids.length).toBeGreaterThan(0);
      expect(fixture.projection?.envelope_identity.data_version).toBe(
        fixture.canonical_input.envelope.data_version
      );
      expect(fixture.projection?.envelope_identity.methodology_version).toBe(
        fixture.canonical_input.envelope.methodology_version
      );
    }
  });

  test("preserves contradiction and material unknowns", () => {
    const contradiction = fixtures.find((x) => x.id === "synthesis_contradictory_evidence");
    expect(contradiction?.projection?.evidence_source_ref_ids).toHaveLength(2);
    expect(contradiction?.projection?.limitations?.length).toBeGreaterThan(0);
    const partial = fixtures.find((x) => x.id === "synthesis_material_unknown_partial");
    expect(partial?.projection?.material_unknowns?.[0].missing_reason).toBeTruthy();
    expect(contract.outcome_rules.evidence_strength_values).toEqual([
      "strong", "medium", "weak", "unknown"
    ]);
  });

  test("fails closed for missing evidence, denial and channel mutation", () => {
    expect(fixtures.find((x) => x.id === "missing_or_malformed_evidence_blocked")?.expected).toMatchObject({public_error:"DATA_QUALITY_HOLD",emit_projection:false});
    expect(fixtures.find((x) => x.id === "rights_unlicensed_denied")?.expected).toMatchObject({public_error:"DATA_NOT_LICENSED",emit_projection:false});
    expect(fixtures.find((x) => x.id === "rights_scope_denied")?.expected).toMatchObject({public_error:"SCOPE_DENIED",emit_projection:false});
    const mutation=fixtures.find((x)=>x.id==="channel_identity_mutation_rejected");
    expect(mutation?.canonical_input.claim.claimId).not.toBe(mutation?.projection?.claim_id);
    expect(mutation?.expected.emit_projection).toBe(false);
  });
});
