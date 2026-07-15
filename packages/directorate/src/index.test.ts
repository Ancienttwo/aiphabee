import { describe, expect, it } from "vitest";
import {
  DirectorateInputError,
  GetLiveDirectorateReadbackError,
  getLiveDirectorate,
  type LiveDirectorateRow
} from "./index";

describe("live directorate resolver", () => {
  it("maps an available-coverage row into a full director and a minimal senior-management entry", () => {
    const result = getLiveDirectorate(
      {
        asOf: "2026-07-16T00:00:00+08:00",
        dataVersion: "netquity-directorate-test.v1",
        instrumentId: "hkex_security_00001"
      },
      [createLiveDirectorateRow()]
    );

    expect(result.status).toBe("found");
    expect(result.liveDataAccess).toBe(true);
    expect(result.coverage).toEqual({ status: "available" });
    expect(result.directors).toHaveLength(2);
    expect(result.directors?.[0]).toEqual({
      age: 61,
      biography: {
        en: "LI Tzar Kuoi, Victor aged 61, has been a Director of the Company since December 2014.",
        zhHans: "李泽巨61岁，自2014年12月起出任本公司董事。",
        zhHant: "李澤鉅61歲，自2014年12月起出任本公司董事。"
      },
      capacity: "D",
      instrumentId: "hkex_security_00001",
      name: { en: "LI Tzar Kuoi, Victor", zhHans: "李泽巨", zhHant: "李澤鉅" },
      profileId: "directorate_00001_001",
      remuneration: {
        currency: "HKD",
        currentAmount: 53180000,
        currentYearEnd: "2025-12-31",
        previousAmount: 51660000,
        previousYearEnd: "2024-12-31"
      },
      sourceRecordId: "netquity:biography.biography:00001:001",
      title: { en: "Chairman and Executive Director", zhHans: "主席兼执行董事", zhHant: "主席兼執行董事" }
    });
    expect(result.directors?.[1]).toEqual({
      age: undefined,
      biography: undefined,
      capacity: "S",
      instrumentId: "hkex_security_00001",
      name: { en: "CHEUNG Kwan Hoi", zhHans: "张钧海", zhHant: "張鈞海" },
      profileId: "directorate_00001_002",
      remuneration: undefined,
      sourceRecordId: "netquity:biography.biography:00001:002",
      title: { en: "Group Chief Financial Officer", zhHans: "集团首席财务官", zhHant: "集團首席財務官" }
    });
    expect(result.provenance).toEqual([
      expect.objectContaining({
        source: "netquity-directorate",
        source_record_id: "netquity:biography.biography:00001:001"
      }),
      expect.objectContaining({
        source: "netquity-directorate",
        source_record_id: "netquity:biography.biography:00001:002"
      })
    ]);
    expect(result.usage.rows).toBe(2);
  });

  it("returns not_found without throwing when no row matches", () => {
    const result = getLiveDirectorate(
      {
        asOf: "2026-07-16T00:00:00+08:00",
        dataVersion: "netquity-directorate-test.v1",
        instrumentId: "hkex_security_00001"
      },
      []
    );

    expect(result.status).toBe("not_found");
    expect(result.directors).toBeUndefined();
    expect(result.coverage).toBeUndefined();
    expect(result.provenance).toEqual([]);
    expect(result.usage.rows).toBe(0);
    expect(result.liveDataAccess).toBe(true);
  });

  it("requires a non-empty instrument id", () => {
    expect(() =>
      getLiveDirectorate(
        { asOf: "2026-07-16T00:00:00+08:00", dataVersion: "netquity-directorate-test.v1", instrumentId: "  " },
        []
      )
    ).toThrow(DirectorateInputError);
  });

  it("rejects more than one row for the same instrument id rather than picking one", () => {
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [createLiveDirectorateRow(), createLiveDirectorateRow()]
      )
    ).toThrow(GetLiveDirectorateReadbackError);
  });

  it("rejects a row that disagrees with snapshot authority", () => {
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...createLiveDirectorateRow(), data_version: "other-version" }]
      )
    ).toThrowError("row data version does not match the released snapshot");
  });

  it("rejects an entity id that is not an opaque HKEX security id", () => {
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "eq_hk_00001"
        },
        [{ ...createLiveDirectorateRow(), entity_id: "eq_hk_00001" }]
      )
    ).toThrowError("entity id is not an opaque HKEX security id");
  });

  it("rejects a row for a different instrument id than requested", () => {
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_00700"
        },
        [createLiveDirectorateRow()]
      )
    ).toThrowError("entity id does not match the requested instrument id");
  });

  it("rejects a source record id that does not match the entity id", () => {
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...createLiveDirectorateRow(), source_record_id: "netquity:directorate.available:00700" }]
      )
    ).toThrow(GetLiveDirectorateReadbackError);
  });

  it("rejects a malformed payload", () => {
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...createLiveDirectorateRow(), payload: null }]
      )
    ).toThrow(GetLiveDirectorateReadbackError);
  });

  it("rejects a malformed coverage status", () => {
    const row = createLiveDirectorateRow();
    const payload = { ...(row.payload as Record<string, unknown>), coverage: { status: "unknown" } };
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("coverage status is malformed");
  });

  it("rejects payload directors that are not an array", () => {
    const row = createLiveDirectorateRow();
    const payload = { ...(row.payload as Record<string, unknown>), directors: {} };
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("payload directors is malformed");
  });

  it("rejects available coverage with zero directors", () => {
    const row = createLiveDirectorateRow();
    const payload = { ...(row.payload as Record<string, unknown>), directors: [] };
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("available coverage must carry at least one director");
  });

  it("rejects a director with a capacity that is not a promoted live capacity", () => {
    const row = createLiveDirectorateRow();
    const payload = row.payload as Record<string, unknown>;
    const directors = (payload.directors as Array<Record<string, unknown>>).map((d) => ({ ...d, capacity: "E" }));
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload: { ...payload, directors } }]
      )
    ).toThrowError("director capacity is malformed or not a promoted live capacity");
  });

  it("rejects a profileId that does not match its code", () => {
    const row = createLiveDirectorateRow();
    const payload = row.payload as Record<string, unknown>;
    const directors = (payload.directors as Array<Record<string, unknown>>).map((d) => ({
      ...d,
      profileId: "directorate_00700_001"
    }));
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload: { ...payload, directors } }]
      )
    ).toThrowError("director profileId does not match its code");
  });

  it("rejects a director sourceRecordId that does not match its code field pointer", () => {
    const row = createLiveDirectorateRow();
    const payload = row.payload as Record<string, unknown>;
    const directors = (payload.directors as Array<Record<string, unknown>>).map((d) => ({
      ...d,
      sourceRecordId: "netquity:biography.biography:00700:001"
    }));
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload: { ...payload, directors } }]
      )
    ).toThrowError("director sourceRecordId is not a matching Netquity directorate field pointer");
  });

  it("rejects a director with an incomplete name", () => {
    const row = createLiveDirectorateRow();
    const payload = row.payload as Record<string, unknown>;
    const directors = (payload.directors as Array<Record<string, unknown>>).map((d) => ({
      ...d,
      name: { en: "LI Tzar Kuoi, Victor", zhHant: "李澤鉅" }
    }));
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload: { ...payload, directors } }]
      )
    ).toThrow(GetLiveDirectorateReadbackError);
  });

  it("rejects a director with a title missing the always-populated zhHant/zhHans fields", () => {
    const row = createLiveDirectorateRow();
    const payload = row.payload as Record<string, unknown>;
    const directors = (payload.directors as Array<Record<string, unknown>>).map((d) => ({
      ...d,
      title: { en: "Chairman and Executive Director" }
    }));
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload: { ...payload, directors } }]
      )
    ).toThrow(GetLiveDirectorateReadbackError);
  });

  it("accepts a title with no English label (the one verified engtitle gap)", () => {
    const row = createLiveDirectorateRow();
    const payload = row.payload as Record<string, unknown>;
    const directors = (payload.directors as Array<Record<string, unknown>>).map((d, index) =>
      index === 1 ? { ...d, title: { zhHans: "集团首席财务官", zhHant: "集團首席財務官" } } : d
    );
    const result = getLiveDirectorate(
      {
        asOf: "2026-07-16T00:00:00+08:00",
        dataVersion: "netquity-directorate-test.v1",
        instrumentId: "hkex_security_00001"
      },
      [{ ...row, payload: { ...payload, directors } }]
    );
    expect(result.directors?.[1]?.title).toEqual({ en: undefined, zhHans: "集团首席财务官", zhHant: "集團首席財務官" });
  });

  it("rejects a negative age", () => {
    const row = createLiveDirectorateRow();
    const payload = row.payload as Record<string, unknown>;
    const directors = (payload.directors as Array<Record<string, unknown>>).map((d) => ({ ...d, age: -1 }));
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload: { ...payload, directors } }]
      )
    ).toThrowError("payload age is malformed");
  });

  it("rejects a non-integer age", () => {
    const row = createLiveDirectorateRow();
    const payload = row.payload as Record<string, unknown>;
    const directors = (payload.directors as Array<Record<string, unknown>>).map((d) => ({ ...d, age: 61.5 }));
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload: { ...payload, directors } }]
      )
    ).toThrowError("payload age is malformed");
  });

  it("rejects a negative remuneration amount", () => {
    const row = createLiveDirectorateRow();
    const payload = row.payload as Record<string, unknown>;
    const directors = (payload.directors as Array<Record<string, unknown>>).map((d) =>
      d.remuneration ? { ...d, remuneration: { ...(d.remuneration as Record<string, unknown>), currentAmount: -1 } } : d
    );
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, payload: { ...payload, directors } }]
      )
    ).toThrowError("payload currentAmount is malformed");
  });

  it("maps a zero-biography unavailable-coverage row with no fabricated directors", () => {
    const result = getLiveDirectorate(
      {
        asOf: "2026-07-16T00:00:00+08:00",
        dataVersion: "netquity-directorate-test.v1",
        instrumentId: "hkex_security_01687"
      },
      [createUnavailableDirectorateRow()]
    );

    expect(result.status).toBe("found");
    expect(result.coverage).toEqual({
      reason:
        "no director or senior-management biography record found in nq_biography.biography for this instrument in the current mirrored snapshot",
      status: "unavailable"
    });
    expect(result.directors).toEqual([]);
    expect(result.provenance).toEqual([
      expect.objectContaining({ source_record_id: "netquity:directorate.unavailable:01687" })
    ]);
    expect(result.usage.rows).toBe(0);
  });

  it("rejects unavailable coverage that still carries director rows", () => {
    const row = createUnavailableDirectorateRow();
    const payload = {
      ...(row.payload as Record<string, unknown>),
      directors: (createLiveDirectorateRow().payload as Record<string, unknown>).directors
    };
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_01687"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("unavailable coverage must not carry director rows");
  });

  it("rejects unavailable coverage without a reason", () => {
    const row = createUnavailableDirectorateRow();
    const payload = { ...(row.payload as Record<string, unknown>), coverage: { status: "unavailable" } };
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_01687"
        },
        [{ ...row, payload }]
      )
    ).toThrowError("unavailable coverage requires a reason");
  });

  it("rejects available coverage backed by the directorate-unavailable source record id", () => {
    const row = createLiveDirectorateRow();
    expect(() =>
      getLiveDirectorate(
        {
          asOf: "2026-07-16T00:00:00+08:00",
          dataVersion: "netquity-directorate-test.v1",
          instrumentId: "hkex_security_00001"
        },
        [{ ...row, source_record_id: "netquity:directorate.unavailable:00001" }]
      )
    ).toThrowError("available coverage must use the directorate-available source record id");
  });
});

// Fixture mirrors the real hkex_security_00001 (CK Hutchison Holdings) rows
// spot-checked via psql against the local netquity mirror: capacity='D'
// director LI Tzar Kuoi, Victor (chairman, age 61, HKD remuneration) and
// capacity='S' senior-management CHEUNG Kwan Hoi (Group CFO, no age/
// biography/remuneration disclosed). Biography text below is a short
// representative excerpt, not the full real prose (which runs to several
// thousand characters per person in the mirror).
function createLiveDirectorateRow(): LiveDirectorateRow {
  return {
    data_version: "netquity-directorate-test.v1",
    entity_id: "hkex_security_00001",
    payload: {
      coverage: { status: "available" },
      directors: [
        {
          age: 61,
          biography: {
            en: "LI Tzar Kuoi, Victor aged 61, has been a Director of the Company since December 2014.",
            zhHans: "李泽巨61岁，自2014年12月起出任本公司董事。",
            zhHant: "李澤鉅61歲，自2014年12月起出任本公司董事。"
          },
          capacity: "D",
          name: { en: "LI Tzar Kuoi, Victor", zhHans: "李泽巨", zhHant: "李澤鉅" },
          profileId: "directorate_00001_001",
          remuneration: {
            currency: "HKD",
            currentAmount: 53180000,
            currentYearEnd: "2025-12-31",
            previousAmount: 51660000,
            previousYearEnd: "2024-12-31"
          },
          sourceRecordId: "netquity:biography.biography:00001:001",
          title: { en: "Chairman and Executive Director", zhHans: "主席兼执行董事", zhHant: "主席兼執行董事" }
        },
        {
          capacity: "S",
          name: { en: "CHEUNG Kwan Hoi", zhHans: "张钧海", zhHant: "張鈞海" },
          profileId: "directorate_00001_002",
          sourceRecordId: "netquity:biography.biography:00001:002",
          title: { en: "Group Chief Financial Officer", zhHans: "集团首席财务官", zhHant: "集團首席財務官" }
        }
      ]
    },
    source_record_id: "netquity:directorate.available:00001"
  };
}

function createUnavailableDirectorateRow(): LiveDirectorateRow {
  return {
    data_version: "netquity-directorate-test.v1",
    entity_id: "hkex_security_01687",
    payload: {
      coverage: {
        reason:
          "no director or senior-management biography record found in nq_biography.biography for this instrument in the current mirrored snapshot",
        status: "unavailable"
      },
      directors: []
    },
    source_record_id: "netquity:directorate.unavailable:01687"
  };
}
