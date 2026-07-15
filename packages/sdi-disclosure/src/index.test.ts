import { describe, expect, it } from "vitest";
import {
  GetLiveSdiDisclosuresReadbackError,
  SdiDisclosureInputError,
  getLiveSdiDisclosures,
  type LiveSdiDisclosuresRow
} from "./index";

describe("live sdi disclosure resolver", () => {
  it("maps an available-coverage row into a filing with nested long+short positions", () => {
    const result = getLiveSdiDisclosures(
      {
        asOf: "2026-07-15T00:00:00+08:00",
        dataVersion: "netquity-sdi-disclosure-test.v1",
        instrumentId: "hkex_security_00001"
      },
      [createLiveSdiDisclosuresRow()]
    );

    expect(result.status).toBe("found");
    expect(result.liveDataAccess).toBe(true);
    expect(result.coverage).toEqual({ status: "available" });
    expect(result.disclosures).toHaveLength(1);
    expect(result.disclosures?.[0]).toEqual({
      disclosureId: "sdi_disclosure_00001_2_2606260526",
      formType: "2",
      holderName: { en: "BlackRock, Inc.", zhHans: "贝莱德", zhHant: "貝萊德" },
      instrumentId: "hkex_security_00001",
      positions: [
        {
          currency: "HKD",
          eventCode: "1004",
          positionType: "long",
          presentBalancePercent: 5.17,
          presentBalanceShares: 197978928,
          previousBalancePercent: 4.91,
          previousBalanceShares: 188109983,
          shares: 9868945
        },
        {
          currency: undefined,
          eventCode: undefined,
          positionType: "short",
          presentBalancePercent: 0.06,
          presentBalanceShares: 2385750,
          previousBalancePercent: 0.06,
          previousBalanceShares: 2327250,
          shares: undefined
        }
      ],
      referenceNo: "CS20260626E00526",
      reportDate: "2026-06-26",
      shareClass: "O",
      sourceRecordId: "netquity:sdidata.sdi:00001:2:2606260526",
      supersededByReferenceNo: undefined,
      amendsReferenceNo: undefined,
      transactionDate: "2026-06-23"
    });
    expect(result.provenance).toEqual([
      expect.objectContaining({
        source: "netquity-sdi-disclosure",
        source_record_id: "netquity:sdidata.sdi:00001:2:2606260526"
      })
    ]);
    expect(result.usage.rows).toBe(1);
  });

  it("returns not_found without throwing when no row matches", () => {
    const result = getLiveSdiDisclosures(
      {
        asOf: "2026-07-15T00:00:00+08:00",
        dataVersion: "netquity-sdi-disclosure-test.v1",
        instrumentId: "hkex_security_00001"
      },
      []
    );

    expect(result.status).toBe("not_found");
    expect(result.disclosures).toBeUndefined();
    expect(result.coverage).toBeUndefined();
    expect(result.provenance).toEqual([]);
    expect(result.usage.rows).toBe(0);
    expect(result.liveDataAccess).toBe(true);
  });

  it("requires a non-empty instrument id", () => {
    expect(() =>
      getLiveSdiDisclosures(
        { asOf: "2026-07-15T00:00:00+08:00", dataVersion: "netquity-sdi-disclosure-test.v1", instrumentId: "  " },
        []
      )
    ).toThrow(SdiDisclosureInputError);
  });

  it("rejects more than one row for the same instrument id rather than picking one", () => {
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [createLiveSdiDisclosuresRow(), createLiveSdiDisclosuresRow()]
      )
    ).toThrow(GetLiveSdiDisclosuresReadbackError);
  });

  it("rejects a row that disagrees with snapshot authority", () => {
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...createLiveSdiDisclosuresRow(), data_version: "other-version" }]
      )
    ).toThrowError("row data version does not match the released snapshot");
  });

  it("rejects an entity id that is not an opaque HKEX security id", () => {
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "eq_hk_00001"
        },
        [{ ...createLiveSdiDisclosuresRow(), entity_id: "eq_hk_00001" }]
      )
    ).toThrowError("entity id is not an opaque HKEX security id");
  });

  it("rejects a row for a different instrument id than requested", () => {
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [createLiveSdiDisclosuresRow()]
      )
    ).toThrowError("entity id does not match the requested instrument id");
  });

  it("rejects a source record id that does not match the entity id", () => {
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...createLiveSdiDisclosuresRow(), source_record_id: "netquity:sdi_disclosure.available:00700" }]
      )
    ).toThrow(GetLiveSdiDisclosuresReadbackError);
  });

  it("rejects a malformed payload", () => {
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...createLiveSdiDisclosuresRow(), payload: null }]
      )
    ).toThrow(GetLiveSdiDisclosuresReadbackError);
  });

  it("rejects a malformed coverage status", () => {
    const row = createLiveSdiDisclosuresRow();
    const payload = { ...(row.payload as Record<string, unknown>), coverage: { status: "unknown" } };
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("coverage status is malformed");
  });

  it("rejects payload disclosures that are not an array", () => {
    const row = createLiveSdiDisclosuresRow();
    const payload = { ...(row.payload as Record<string, unknown>), disclosures: {} };
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("payload disclosures is malformed");
  });

  it("rejects available coverage with zero disclosures", () => {
    const row = createLiveSdiDisclosuresRow();
    const payload = { ...(row.payload as Record<string, unknown>), disclosures: [] };
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("available coverage must carry at least one disclosure");
  });

  it("rejects a disclosure with a formType that is not a promoted live form type", () => {
    const row = createLiveSdiDisclosuresRow();
    const payload = row.payload as Record<string, unknown>;
    const disclosures = (payload.disclosures as Array<Record<string, unknown>>).map((d) => ({ ...d, formType: "4" }));
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload: { ...payload, disclosures } }]
      )
    ).toThrowError("disclosure formType is malformed or not a promoted live form type");
  });

  it("rejects a disclosureId that does not match its code/formType", () => {
    const row = createLiveSdiDisclosuresRow();
    const payload = row.payload as Record<string, unknown>;
    const disclosures = (payload.disclosures as Array<Record<string, unknown>>).map((d) => ({
      ...d,
      disclosureId: "sdi_disclosure_00700_2_2606260526"
    }));
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload: { ...payload, disclosures } }]
      )
    ).toThrowError("disclosure disclosureId does not match its code/formType");
  });

  it("rejects a disclosure sourceRecordId that does not match its code/formType field pointer", () => {
    const row = createLiveSdiDisclosuresRow();
    const payload = row.payload as Record<string, unknown>;
    const disclosures = (payload.disclosures as Array<Record<string, unknown>>).map((d) => ({
      ...d,
      sourceRecordId: "netquity:sdidata.sdi:00700:2:2606260526"
    }));
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload: { ...payload, disclosures } }]
      )
    ).toThrowError("disclosure sourceRecordId is not a matching Netquity sdi_disclosure field pointer");
  });

  it("rejects a disclosure with an incomplete holderName", () => {
    const row = createLiveSdiDisclosuresRow();
    const payload = row.payload as Record<string, unknown>;
    const disclosures = (payload.disclosures as Array<Record<string, unknown>>).map((d) => ({
      ...d,
      holderName: { en: "BlackRock, Inc.", zhHant: "貝萊德" }
    }));
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload: { ...payload, disclosures } }]
      )
    ).toThrow(GetLiveSdiDisclosuresReadbackError);
  });

  it("rejects disclosure positions that are not an array", () => {
    const row = createLiveSdiDisclosuresRow();
    const payload = row.payload as Record<string, unknown>;
    const disclosures = (payload.disclosures as Array<Record<string, unknown>>).map((d) => ({
      ...d,
      positions: {}
    }));
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload: { ...payload, disclosures } }]
      )
    ).toThrowError("disclosure positions is malformed or empty");
  });

  it("rejects a position with a positionType that is not a promoted live position type", () => {
    const row = createLiveSdiDisclosuresRow();
    const payload = row.payload as Record<string, unknown>;
    const disclosures = (payload.disclosures as Array<Record<string, unknown>>).map((d) => ({
      ...d,
      positions: [{ ...(d.positions as Array<Record<string, unknown>>)[0], positionType: "medium" }]
    }));
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload: { ...payload, disclosures } }]
      )
    ).toThrowError("position positionType is malformed or not a promoted live position type");
  });

  it("rejects a position with a negative balance field", () => {
    const row = createLiveSdiDisclosuresRow();
    const payload = row.payload as Record<string, unknown>;
    const disclosures = (payload.disclosures as Array<Record<string, unknown>>).map((d) => ({
      ...d,
      positions: [{ ...(d.positions as Array<Record<string, unknown>>)[0], presentBalanceShares: -1 }]
    }));
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload: { ...payload, disclosures } }]
      )
    ).toThrowError("payload presentBalanceShares is malformed");
  });

  it("maps a zero-filing unavailable-coverage row with no fabricated disclosures", () => {
    const result = getLiveSdiDisclosures(
      {
        asOf: "2026-07-15T00:00:00+08:00",
        dataVersion: "netquity-sdi-disclosure-test.v1",
        instrumentId: "hkex_security_00007"
      },
      [createUnavailableSdiDisclosuresRow()]
    );

    expect(result.status).toBe("found");
    expect(result.coverage).toEqual({
      reason:
        "no substantial-shareholder or director/chief-executive disclosure-of-interests filing found in nq_sdidata.sdi for this instrument in the current mirrored snapshot",
      status: "unavailable"
    });
    expect(result.disclosures).toEqual([]);
    expect(result.provenance).toEqual([
      expect.objectContaining({ source_record_id: "netquity:sdi_disclosure.unavailable:00007" })
    ]);
    expect(result.usage.rows).toBe(0);
  });

  it("rejects unavailable coverage that still carries disclosure rows", () => {
    const row = createUnavailableSdiDisclosuresRow();
    const payload = {
      ...(row.payload as Record<string, unknown>),
      disclosures: (createLiveSdiDisclosuresRow().payload as Record<string, unknown>).disclosures
    };
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "hkex_security_00007"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("unavailable coverage must not carry disclosure rows");
  });

  it("rejects unavailable coverage without a reason", () => {
    const row = createUnavailableSdiDisclosuresRow();
    const payload = { ...(row.payload as Record<string, unknown>), coverage: { status: "unavailable" } };
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "hkex_security_00007"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("unavailable coverage requires a reason");
  });

  it("rejects available coverage backed by the sdi_disclosure-unavailable source record id", () => {
    const row = createLiveSdiDisclosuresRow();
    expect(() =>
      getLiveSdiDisclosures(
        {
          asOf: "2026-07-15T00:00:00+08:00",
          dataVersion: "netquity-sdi-disclosure-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, source_record_id: "netquity:sdi_disclosure.unavailable:00001" }]
      )
    ).toThrowError("available coverage must use the sdi_disclosure-available source record id");
  });
});

// Fixture mirrors the real hkex_security_00001 (CK Hutchison Holdings) row
// spot-checked via psql against the local netquity mirror: a 2026-06-26
// BlackRock Form 2 filing (formno 2606260526) reporting a long-position
// change (4.91% -> 5.17%) alongside an unchanged short-position balance
// (0.06%, no eventCode/shares/currency on that block).
function createLiveSdiDisclosuresRow(): LiveSdiDisclosuresRow {
  return {
    data_version: "netquity-sdi-disclosure-test.v1",
    entity_id: "hkex_security_00001",
    payload: {
      coverage: { status: "available" },
      disclosures: [
        {
          disclosureId: "sdi_disclosure_00001_2_2606260526",
          formType: "2",
          holderName: { en: "BlackRock, Inc.", zhHans: "贝莱德", zhHant: "貝萊德" },
          positions: [
            {
              currency: "HKD",
              eventCode: "1004",
              positionType: "long",
              presentBalancePercent: 5.17,
              presentBalanceShares: 197978928,
              previousBalancePercent: 4.91,
              previousBalanceShares: 188109983,
              shares: 9868945
            },
            {
              positionType: "short",
              presentBalancePercent: 0.06,
              presentBalanceShares: 2385750,
              previousBalancePercent: 0.06,
              previousBalanceShares: 2327250
            }
          ],
          referenceNo: "CS20260626E00526",
          reportDate: "2026-06-26",
          shareClass: "O",
          sourceRecordId: "netquity:sdidata.sdi:00001:2:2606260526",
          transactionDate: "2026-06-23"
        }
      ]
    },
    source_record_id: "netquity:sdi_disclosure.available:00001"
  };
}

function createUnavailableSdiDisclosuresRow(): LiveSdiDisclosuresRow {
  return {
    data_version: "netquity-sdi-disclosure-test.v1",
    entity_id: "hkex_security_00007",
    payload: {
      coverage: {
        reason:
          "no substantial-shareholder or director/chief-executive disclosure-of-interests filing found in nq_sdidata.sdi for this instrument in the current mirrored snapshot",
        status: "unavailable"
      },
      disclosures: []
    },
    source_record_id: "netquity:sdi_disclosure.unavailable:00007"
  };
}
