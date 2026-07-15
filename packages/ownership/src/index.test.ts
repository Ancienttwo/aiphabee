import { describe, expect, it } from "vitest";
import {
  GetLiveOwnershipReadbackError,
  OwnershipInputError,
  getLiveOwnership,
  type LiveOwnershipRow
} from "./index";

describe("live ownership resolver", () => {
  it("maps an available row carrying shareCapital + freeFloat + holders with no cross-holding", () => {
    const result = getLiveOwnership(
      {
        asOf: "2026-07-16T00:00:00+08:00",
        dataVersion: "netquity-ownership-test.v1",
        instrumentId: "hkex_security_00001"
      },
      [createLiveOwnershipRow()]
    );

    expect(result.status).toBe("found");
    expect(result.liveDataAccess).toBe(true);
    expect(result.coverage).toEqual({ status: "available" });
    expect(result.shareCapital).toEqual({
      asOf: "2026-07-07",
      hasSecondaryListing: "N",
      hkShareClass: "OS",
      hkShares: 3830044500,
      isHShare: "N",
      issuedShares: 3830044500,
      issuedSharesChange: 0,
      nonHkShareClass: undefined,
      nonHkShares: undefined,
      preferenceShares: undefined,
      sharesInCcass: 2555770354,
      sharesOutsideCcass: 1274274146,
      weightedVotingRightsRatio: undefined
    });
    expect(result.freeFloat).toEqual({
      asOf: "2026-07-06",
      freeFloatPercent: 69.64,
      freeFloatShares: 2667112490,
      issuedShares: 3830044500,
      nonFreeFloatShares: 1162932010
    });
    expect(result.holders).toHaveLength(2);
    expect(result.holders?.[0]).toEqual({
      asOf: "2025-12-31",
      crossHolding: undefined,
      groupType: "F",
      heldPercent: 30.363,
      heldShares: 1162932010,
      holderId: "ownership_00001_01",
      holderType: "I",
      instrumentId: "hkex_security_00001",
      name: { en: "Li Ka-Shing", zhHans: "李嘉诚", zhHant: "李嘉誠" },
      sourceRecordId: "netquity:listcompheld.data:00001:01",
      sourceType: "AR"
    });
    expect(result.holders?.[1].holderType).toBe("F");
    expect(result.provenance).toEqual([
      expect.objectContaining({ source: "netquity-ownership", source_record_id: "netquity:listcompheld.data:00001:01" }),
      expect.objectContaining({ source: "netquity-ownership", source_record_id: "netquity:listcompheld.data:00001:02" })
    ]);
    expect(result.usage.rows).toBe(2);
  });

  it("maps a holder carrying a crossHolding to another HKEX-listed instrument", () => {
    const result = getLiveOwnership(
      {
        asOf: "2026-07-16T00:00:00+08:00",
        dataVersion: "netquity-ownership-test.v1",
        instrumentId: "hkex_security_01038"
      },
      [createCrossHoldingOwnershipRow()]
    );

    expect(result.status).toBe("found");
    expect(result.holders).toHaveLength(1);
    expect(result.holders?.[0].crossHolding).toEqual({ instrumentId: "hkex_security_00001" });
    expect(result.holders?.[0].heldPercent).toBe(75.67);
    expect(result.holders?.[0].holderType).toBe("L");
  });

  it("accepts an available row carrying only shareCapital (freeFloat/holders both absent)", () => {
    const row = createLiveOwnershipRow();
    const payload = row.payload as Record<string, unknown>;
    const { freeFloat: _freeFloat, holders: _holders, ...rest } = payload;
    const result = getLiveOwnership(
      { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
      [{ ...row, payload: rest }]
    );

    expect(result.status).toBe("found");
    expect(result.shareCapital).toBeDefined();
    expect(result.freeFloat).toBeUndefined();
    expect(result.holders).toBeUndefined();
    expect(result.usage.rows).toBe(0);
    expect(result.provenance).toEqual([
      expect.objectContaining({ source_record_id: "netquity:ownership.available:00001" })
    ]);
  });

  it("returns not_found without throwing when no row matches", () => {
    const result = getLiveOwnership(
      { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
      []
    );

    expect(result.status).toBe("not_found");
    expect(result.shareCapital).toBeUndefined();
    expect(result.freeFloat).toBeUndefined();
    expect(result.holders).toBeUndefined();
    expect(result.coverage).toBeUndefined();
    expect(result.provenance).toEqual([]);
    expect(result.usage.rows).toBe(0);
    expect(result.liveDataAccess).toBe(true);
  });

  it("requires a non-empty instrument id", () => {
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "  " },
        []
      )
    ).toThrow(OwnershipInputError);
  });

  it("rejects more than one row for the same instrument id rather than picking one", () => {
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
        [createLiveOwnershipRow(), createLiveOwnershipRow()]
      )
    ).toThrow(GetLiveOwnershipReadbackError);
  });

  it("rejects a row that disagrees with snapshot authority", () => {
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
        [{ ...createLiveOwnershipRow(), data_version: "other-version" }]
      )
    ).toThrowError("row data version does not match the released snapshot");
  });

  it("rejects an entity id that is not an opaque HKEX security id", () => {
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "eq_hk_00001" },
        [{ ...createLiveOwnershipRow(), entity_id: "eq_hk_00001" }]
      )
    ).toThrowError("entity id is not an opaque HKEX security id");
  });

  it("rejects a row for a different instrument id than requested", () => {
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00700" },
        [createLiveOwnershipRow()]
      )
    ).toThrowError("entity id does not match the requested instrument id");
  });

  it("rejects a source record id that does not match the entity id", () => {
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
        [{ ...createLiveOwnershipRow(), source_record_id: "netquity:ownership.available:00700" }]
      )
    ).toThrow(GetLiveOwnershipReadbackError);
  });

  it("rejects a malformed payload", () => {
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
        [{ ...createLiveOwnershipRow(), payload: null }]
      )
    ).toThrow(GetLiveOwnershipReadbackError);
  });

  it("rejects a malformed coverage status", () => {
    const row = createLiveOwnershipRow();
    const payload = { ...(row.payload as Record<string, unknown>), coverage: { status: "unknown" } };
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
        [{ ...row, payload }]
      )
    ).toThrowError("coverage status is malformed");
  });

  it("rejects available coverage carrying none of shareCapital/freeFloat/holders", () => {
    const payload = { coverage: { status: "available" } };
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
        [{ ...createLiveOwnershipRow(), payload }]
      )
    ).toThrowError("available coverage must carry at least one of share capital, free float, or holders");
  });

  it("rejects available coverage backed by the ownership-unavailable source record id", () => {
    const row = createLiveOwnershipRow();
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
        [{ ...row, source_record_id: "netquity:ownership.unavailable:00001" }]
      )
    ).toThrowError("available coverage must use the ownership-available source record id");
  });

  it("rejects holders that is not an array", () => {
    const row = createLiveOwnershipRow();
    const payload = { ...(row.payload as Record<string, unknown>), holders: {} };
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
        [{ ...row, payload }]
      )
    ).toThrowError("payload holders is malformed");
  });

  it("rejects holders present as an empty array", () => {
    const row = createLiveOwnershipRow();
    const payload = { ...(row.payload as Record<string, unknown>), holders: [] };
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
        [{ ...row, payload }]
      )
    ).toThrowError("holders, when present, must not be an empty array");
  });

  it("rejects a holder with a holderId that does not match its code", () => {
    const row = createLiveOwnershipRow();
    const payload = row.payload as Record<string, unknown>;
    const holders = (payload.holders as Array<Record<string, unknown>>).map((h) => ({ ...h, holderId: "ownership_00700_01" }));
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
        [{ ...row, payload: { ...payload, holders } }]
      )
    ).toThrowError("holder holderId does not match its code");
  });

  it("rejects a holder with a sourceRecordId that does not match its code field pointer", () => {
    const row = createLiveOwnershipRow();
    const payload = row.payload as Record<string, unknown>;
    const holders = (payload.holders as Array<Record<string, unknown>>).map((h) => ({
      ...h,
      sourceRecordId: "netquity:listcompheld.data:00700:01"
    }));
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
        [{ ...row, payload: { ...payload, holders } }]
      )
    ).toThrowError("holder sourceRecordId is not a matching Netquity ownership field pointer");
  });

  it("rejects a holder with an incomplete name", () => {
    const row = createLiveOwnershipRow();
    const payload = row.payload as Record<string, unknown>;
    const holders = (payload.holders as Array<Record<string, unknown>>).map((h) => ({ ...h, name: { en: "Li Ka-Shing" } }));
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
        [{ ...row, payload: { ...payload, holders } }]
      )
    ).toThrow(GetLiveOwnershipReadbackError);
  });

  it("rejects a holder with a negative heldPercent", () => {
    const row = createLiveOwnershipRow();
    const payload = row.payload as Record<string, unknown>;
    const holders = (payload.holders as Array<Record<string, unknown>>).map((h) => ({ ...h, heldPercent: -1 }));
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
        [{ ...row, payload: { ...payload, holders } }]
      )
    ).toThrowError("payload heldPercent is malformed");
  });

  it("rejects a holder with a malformed asOf date", () => {
    const row = createLiveOwnershipRow();
    const payload = row.payload as Record<string, unknown>;
    const holders = (payload.holders as Array<Record<string, unknown>>).map((h) => ({ ...h, asOf: "2025/12/31" }));
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
        [{ ...row, payload: { ...payload, holders } }]
      )
    ).toThrowError("holder.asOf is malformed");
  });

  it("rejects a crossHolding with a malformed instrumentId", () => {
    const row = createCrossHoldingOwnershipRow();
    const payload = row.payload as Record<string, unknown>;
    const holders = (payload.holders as Array<Record<string, unknown>>).map((h) => ({
      ...h,
      crossHolding: { instrumentId: "eq_hk_00001" }
    }));
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_01038" },
        [{ ...row, payload: { ...payload, holders } }]
      )
    ).toThrowError("crossHolding instrumentId is not an opaque HKEX security id");
  });

  it("rejects a crossHolding present on a non-'L' holderType", () => {
    const row = createLiveOwnershipRow();
    const payload = row.payload as Record<string, unknown>;
    const holders = (payload.holders as Array<Record<string, unknown>>).map((h) => ({
      ...h,
      crossHolding: { instrumentId: "hkex_security_01038" }
    }));
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
        [{ ...row, payload: { ...payload, holders } }]
      )
    ).toThrowError("crossHolding is only valid for holderType 'L'");
  });

  it("rejects a malformed shareCapital missing a required field", () => {
    const row = createLiveOwnershipRow();
    const payload = row.payload as Record<string, unknown>;
    const shareCapital = { ...(payload.shareCapital as Record<string, unknown>) };
    delete shareCapital.hkShareClass;
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
        [{ ...row, payload: { ...payload, shareCapital } }]
      )
    ).toThrowError("payload hkShareClass is missing");
  });

  it("rejects a shareCapital.isHShare value outside the 'N'|'Y' vendor vocabulary", () => {
    const row = createLiveOwnershipRow();
    const payload = row.payload as Record<string, unknown>;
    const shareCapital = { ...(payload.shareCapital as Record<string, unknown>), isHShare: "maybe" };
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
        [{ ...row, payload: { ...payload, shareCapital } }]
      )
    ).toThrowError("payload isHShare is malformed");
  });

  it("rejects a malformed freeFloat missing a required field", () => {
    const row = createLiveOwnershipRow();
    const payload = row.payload as Record<string, unknown>;
    const freeFloat = { ...(payload.freeFloat as Record<string, unknown>) };
    delete freeFloat.freeFloatPercent;
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_00001" },
        [{ ...row, payload: { ...payload, freeFloat } }]
      )
    ).toThrowError("payload freeFloatPercent is malformed");
  });

  it("maps a zero-coverage unavailable row with no fabricated buckets", () => {
    const result = getLiveOwnership(
      { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_09999" },
      [createUnavailableOwnershipRow()]
    );

    expect(result.status).toBe("found");
    expect(result.coverage).toEqual({
      reason:
        "no share capital, free float, or substantial-shareholder/cross-holding record found in nq_issueshare.issueshare, nq_freefloatshare2.freefloatshare, or nq_listcompheld.data for this instrument in the current mirrored snapshot",
      status: "unavailable"
    });
    expect(result.shareCapital).toBeUndefined();
    expect(result.freeFloat).toBeUndefined();
    expect(result.holders).toBeUndefined();
    expect(result.provenance).toEqual([
      expect.objectContaining({ source_record_id: "netquity:ownership.unavailable:09999" })
    ]);
    expect(result.usage.rows).toBe(0);
  });

  it("rejects unavailable coverage that still carries a bucket", () => {
    const row = createUnavailableOwnershipRow();
    const payload = {
      ...(row.payload as Record<string, unknown>),
      shareCapital: (createLiveOwnershipRow().payload as Record<string, unknown>).shareCapital
    };
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_09999" },
        [{ ...row, payload }]
      )
    ).toThrowError("unavailable coverage must not carry share capital, free float, or holder data");
  });

  it("rejects unavailable coverage without a reason", () => {
    const row = createUnavailableOwnershipRow();
    const payload = { ...(row.payload as Record<string, unknown>), coverage: { status: "unavailable" } };
    expect(() =>
      getLiveOwnership(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-ownership-test.v1", instrumentId: "hkex_security_09999" },
        [{ ...row, payload }]
      )
    ).toThrowError("unavailable coverage requires a reason");
  });
});

// Fixture mirrors the real hkex_security_00001 (CK Hutchison Holdings) rows
// spot-checked via psql against the local netquity mirror: latest
// nq_issueshare.issueshare row (2026-07-07), latest
// nq_freefloatshare2.freefloatshare row (2026-07-06), and its top 2
// nq_listcompheld.data holders (Li Ka-Shing 30.363%, BlackRock 4.938%,
// neither a cross-holding).
function createLiveOwnershipRow(): LiveOwnershipRow {
  return {
    data_version: "netquity-ownership-test.v1",
    entity_id: "hkex_security_00001",
    payload: {
      coverage: { status: "available" },
      freeFloat: {
        asOf: "2026-07-06",
        freeFloatPercent: 69.64,
        freeFloatShares: 2667112490,
        issuedShares: 3830044500,
        nonFreeFloatShares: 1162932010
      },
      holders: [
        {
          asOf: "2025-12-31",
          groupType: "F",
          heldPercent: 30.363,
          heldShares: 1162932010,
          holderId: "ownership_00001_01",
          holderType: "I",
          name: { en: "Li Ka-Shing", zhHans: "李嘉诚", zhHant: "李嘉誠" },
          sourceRecordId: "netquity:listcompheld.data:00001:01",
          sourceType: "AR"
        },
        {
          asOf: "2026-06-23",
          groupType: "N",
          heldPercent: 4.938,
          heldShares: 189128928,
          holderId: "ownership_00001_02",
          holderType: "F",
          name: { en: "BlackRock, Inc.", zhHans: "贝莱德", zhHant: "貝萊德" },
          sourceRecordId: "netquity:listcompheld.data:00001:02",
          sourceType: "SD"
        }
      ],
      shareCapital: {
        asOf: "2026-07-07",
        hasSecondaryListing: "N",
        hkShareClass: "OS",
        hkShares: 3830044500,
        isHShare: "N",
        issuedShares: 3830044500,
        issuedSharesChange: 0,
        sharesInCcass: 2555770354,
        sharesOutsideCcass: 1274274146
      }
    },
    source_record_id: "netquity:ownership.available:00001"
  };
}

// Fixture mirrors the real hkex_security_01038 (CK Infrastructure Holdings)
// nq_listcompheld.data row spot-checked via psql: its sole holder is CK
// Hutchison Holdings Limited (hkex_security_00001, listcode '00001'),
// holderType 'L', holdshareallper 75.67 -- the real long-and/长建 edge from
// the design baseline's cross-holding chain.
function createCrossHoldingOwnershipRow(): LiveOwnershipRow {
  return {
    data_version: "netquity-ownership-test.v1",
    entity_id: "hkex_security_01038",
    payload: {
      coverage: { status: "available" },
      holders: [
        {
          asOf: "2025-12-31",
          crossHolding: { instrumentId: "hkex_security_00001" },
          groupType: "N",
          heldPercent: 75.67,
          heldShares: 1906681945,
          holderId: "ownership_01038_01",
          holderType: "L",
          name: { en: "CK Hutchison Holdings Limited", zhHans: "长江和记实业有限公司", zhHant: "長江和記實業有限公司" },
          sourceRecordId: "netquity:listcompheld.data:01038:01",
          sourceType: "AR"
        }
      ]
    },
    source_record_id: "netquity:ownership.available:01038"
  };
}

function createUnavailableOwnershipRow(): LiveOwnershipRow {
  return {
    data_version: "netquity-ownership-test.v1",
    entity_id: "hkex_security_09999",
    payload: {
      coverage: {
        reason:
          "no share capital, free float, or substantial-shareholder/cross-holding record found in nq_issueshare.issueshare, nq_freefloatshare2.freefloatshare, or nq_listcompheld.data for this instrument in the current mirrored snapshot",
        status: "unavailable"
      }
    },
    source_record_id: "netquity:ownership.unavailable:09999"
  };
}
