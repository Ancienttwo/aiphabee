import { describe, expect, it } from "vitest";
import {
  GET_RELATED_WARRANTS_LIVE_VERSION,
  GetLiveRelatedWarrantsReadbackError,
  RelatedWarrantsInputError,
  getLiveRelatedWarrants,
  type LiveRelatedWarrantsRow
} from "./index";

const DATA_VERSION = "netquity-related-warrants-test.v1";
const AS_OF = "2026-07-16T00:00:00.000Z";

// Mirrors the real hkex_security_00001 (CK Hutchison Holdings) row spot-
// checked via psql against the local netquity mirror: 2 of its 20 related
// warrants (dp_warrant code 14662 "CI-CK Hutchison@EP2612A", dc_warrant code
// 24792 "MB-CK Hutchison@EC2610A").
const SAMPLE_WARRANT_DP = {
  category: "dp_warrant",
  instrumentId: "hkex_security_14662",
  name: { en: "CI-CK Hutchison@EP2612A", zhHans: "长和信证EP2612A", zhHant: "長和信證EP2612A" },
  sourceRecordId: "netquity:relatedcode.dp_warrant:00001:14662"
};
const SAMPLE_WARRANT_DC = {
  category: "dc_warrant",
  instrumentId: "hkex_security_24792",
  name: { en: "MB-CK Hutchison@EC2610A", zhHans: "长和麦银EC2610A", zhHant: "長和麥銀EC2610A" },
  sourceRecordId: "netquity:relatedcode.dc_warrant:00001:24792"
};

function availableRow(overrides: Record<string, unknown> = {}): LiveRelatedWarrantsRow {
  return {
    data_version: DATA_VERSION,
    entity_id: "hkex_security_00001",
    payload: {
      coverage: { status: "available" },
      warrants: [SAMPLE_WARRANT_DP, SAMPLE_WARRANT_DC]
    },
    source_record_id: "netquity:related_warrants.available:00001",
    ...overrides
  };
}

function unavailableRow(overrides: Record<string, unknown> = {}): LiveRelatedWarrantsRow {
  return {
    data_version: DATA_VERSION,
    entity_id: "hkex_security_00007",
    payload: {
      coverage: {
        reason: "no derivative warrant or CBBC code is associated with this instrument in nq_basicdata.relatedcode in the current mirrored snapshot",
        status: "unavailable"
      }
    },
    source_record_id: "netquity:related_warrants.unavailable:00007",
    ...overrides
  };
}

describe("live related-warrants resolver", () => {
  it("maps an available row carrying warrants across different categories", () => {
    const result = getLiveRelatedWarrants(
      { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00001" },
      [availableRow()]
    );

    expect(result.status).toBe("found");
    expect(result.liveDataAccess).toBe(true);
    expect(result.methodologyVersion).toBe(GET_RELATED_WARRANTS_LIVE_VERSION);
    expect(result.coverage).toEqual({ status: "available" });
    expect(result.warrants).toHaveLength(2);
    expect(result.warrants?.map((w) => w.category)).toEqual(["dp_warrant", "dc_warrant"]);
    expect(result.warrants?.[0]?.instrumentId).toBe("hkex_security_14662");
    expect(result.warrants?.[0]?.name.zhHant).toBe("長和信證EP2612A");
    expect(result.usage.rows).toBe(2);
    expect(result.provenance).toHaveLength(2);
    expect(result.provenance[0]).toEqual({
      data_version: DATA_VERSION,
      methodology_version: GET_RELATED_WARRANTS_LIVE_VERSION,
      source: "netquity-related-warrants",
      source_record_id: "netquity:relatedcode.dp_warrant:00001:14662"
    });
  });

  it("accepts an available row carrying a single warrant", () => {
    const result = getLiveRelatedWarrants(
      { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00001" },
      [availableRow({ payload: { coverage: { status: "available" }, warrants: [SAMPLE_WARRANT_DP] } })]
    );

    expect(result.status).toBe("found");
    expect(result.warrants).toHaveLength(1);
  });

  it("returns not_found without throwing when no row matches", () => {
    const result = getLiveRelatedWarrants(
      { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_09999" },
      []
    );

    expect(result.status).toBe("not_found");
    expect(result.warrants).toBeUndefined();
    expect(result.provenance).toEqual([]);
    expect(result.usage).toEqual({ cached: false, credits: 0, rows: 0 });
  });

  it("requires a non-empty instrument id", () => {
    expect(() =>
      getLiveRelatedWarrants({ asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "  " }, [])
    ).toThrow(RelatedWarrantsInputError);
  });

  it("rejects more than one row for the same instrument id rather than picking one", () => {
    expect(() =>
      getLiveRelatedWarrants(
        { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00001" },
        [availableRow(), availableRow()]
      )
    ).toThrow(/more than one released row/u);
  });

  it("rejects a row that disagrees with snapshot authority", () => {
    expect(() =>
      getLiveRelatedWarrants(
        { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00001" },
        [availableRow({ data_version: "wrong-version" })]
      )
    ).toThrow(GetLiveRelatedWarrantsReadbackError);
  });

  it("rejects an entity id that is not an opaque HKEX security id", () => {
    expect(() =>
      getLiveRelatedWarrants(
        { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "eq_hk_00001" },
        [availableRow({ entity_id: "eq_hk_00001" })]
      )
    ).toThrow(/opaque HKEX security id/u);
  });

  it("rejects a row for a different instrument id than requested", () => {
    expect(() =>
      getLiveRelatedWarrants(
        { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00002" },
        [availableRow()]
      )
    ).toThrow(/does not match the requested instrument id/u);
  });

  it("rejects a source record id that does not match the entity id", () => {
    expect(() =>
      getLiveRelatedWarrants(
        { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00001" },
        [availableRow({ source_record_id: "netquity:related_warrants.available:00099" })]
      )
    ).toThrow(/not a matching Netquity related-warrants record/u);
  });

  it("rejects a malformed payload", () => {
    expect(() =>
      getLiveRelatedWarrants(
        { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00001" },
        [availableRow({ payload: "not-an-object" })]
      )
    ).toThrow(/payload is malformed/u);
  });

  it("rejects a malformed coverage status", () => {
    expect(() =>
      getLiveRelatedWarrants(
        { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00001" },
        [availableRow({ payload: { coverage: { status: "maybe" }, warrants: [SAMPLE_WARRANT_DP] } })]
      )
    ).toThrow(/coverage status is malformed/u);
  });

  it("rejects available coverage carrying no warrants", () => {
    expect(() =>
      getLiveRelatedWarrants(
        { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00001" },
        [availableRow({ payload: { coverage: { status: "available" } } })]
      )
    ).toThrow(/must carry a non-empty warrants array/u);
  });

  it("rejects available coverage backed by the related-warrants-unavailable source record id", () => {
    expect(() =>
      getLiveRelatedWarrants(
        { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00001" },
        [availableRow({ source_record_id: "netquity:related_warrants.unavailable:00001" })]
      )
    ).toThrow(/must use the related-warrants-available source record id/u);
  });

  it("rejects warrants that is not an array", () => {
    expect(() =>
      getLiveRelatedWarrants(
        { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00001" },
        [availableRow({ payload: { coverage: { status: "available" }, warrants: "not-an-array" } })]
      )
    ).toThrow(/payload warrants is malformed/u);
  });

  it("rejects warrants present as an empty array", () => {
    expect(() =>
      getLiveRelatedWarrants(
        { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00001" },
        [availableRow({ payload: { coverage: { status: "available" }, warrants: [] } })]
      )
    ).toThrow(/must carry a non-empty warrants array/u);
  });

  it("rejects a warrant with an instrumentId that is not an opaque HKEX security id", () => {
    expect(() =>
      getLiveRelatedWarrants(
        { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00001" },
        [availableRow({ payload: { coverage: { status: "available" }, warrants: [{ ...SAMPLE_WARRANT_DP, instrumentId: "14662" }] } })]
      )
    ).toThrow(/warrant instrumentId is not an opaque HKEX security id/u);
  });

  it("rejects a warrant with an unrecognized category", () => {
    expect(() =>
      getLiveRelatedWarrants(
        { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00001" },
        [availableRow({ payload: { coverage: { status: "available" }, warrants: [{ ...SAMPLE_WARRANT_DP, category: "call" }] } })]
      )
    ).toThrow(/category is not a recognized relatedcode bucket/u);
  });

  it("rejects a warrant with a sourceRecordId that does not match its category/underlying/warrant code", () => {
    expect(() =>
      getLiveRelatedWarrants(
        { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00001" },
        [
          availableRow({
            payload: {
              coverage: { status: "available" },
              warrants: [{ ...SAMPLE_WARRANT_DP, sourceRecordId: "netquity:relatedcode.dc_warrant:00001:14662" }]
            }
          })
        ]
      )
    ).toThrow(/sourceRecordId does not match its category, underlying code, and warrant code/u);
  });

  it("rejects a warrant with an incomplete name", () => {
    expect(() =>
      getLiveRelatedWarrants(
        { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00001" },
        [
          availableRow({
            payload: {
              coverage: { status: "available" },
              warrants: [{ ...SAMPLE_WARRANT_DP, name: { en: "CI-CK Hutchison@EP2612A" } }]
            }
          })
        ]
      )
    ).toThrow(/payload zhHant is missing/u);
  });

  it("maps a zero-coverage unavailable row with no fabricated warrants", () => {
    const result = getLiveRelatedWarrants(
      { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00007" },
      [unavailableRow()]
    );

    expect(result.status).toBe("found");
    expect(result.coverage?.status).toBe("unavailable");
    expect(result.coverage?.reason).toContain("no derivative warrant or CBBC code");
    expect(result.warrants).toBeUndefined();
    expect(result.provenance).toEqual([
      {
        data_version: DATA_VERSION,
        methodology_version: GET_RELATED_WARRANTS_LIVE_VERSION,
        source: "netquity-related-warrants",
        source_record_id: "netquity:related_warrants.unavailable:00007"
      }
    ]);
  });

  it("rejects unavailable coverage that still carries warrants", () => {
    expect(() =>
      getLiveRelatedWarrants(
        { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00007" },
        [
          unavailableRow({
            payload: {
              coverage: { reason: "x", status: "unavailable" },
              warrants: [SAMPLE_WARRANT_DP]
            }
          })
        ]
      )
    ).toThrow(/must not carry a warrants array/u);
  });

  it("rejects unavailable coverage without a reason", () => {
    expect(() =>
      getLiveRelatedWarrants(
        { asOf: AS_OF, dataVersion: DATA_VERSION, instrumentId: "hkex_security_00007" },
        [unavailableRow({ payload: { coverage: { status: "unavailable" } } })]
      )
    ).toThrow(/requires a reason/u);
  });
});
