import {
  createErrorEnvelope,
  createSuccessEnvelope,
} from "@aiphabee/data-contracts";
import type {
  EnvelopeMeta,
  ErrorEnvelope,
  ProvenanceRef,
  SuccessEnvelope,
} from "@aiphabee/data-contracts";
import { IPOS, findIpo } from "../../data/ipos.fixtures";
import type {
  IpoCalendarEvent,
  IpoCalendarRange,
  IpoCalendarResult,
  IpoCompareResult,
  IpoRecord,
  IpoScreenFilters,
  IpoScreenResult,
  IpoSnapshot,
} from "./ipo-types";

/**
 * Mock IPO workbench API — serves the illustrative `ipos.fixtures` dataset
 * through the real `@aiphabee/data-contracts` envelope, so swapping to Codex's
 * worker routes (`./endpoints`) later is a one-import change. NOT live data.
 *
 * Provenance reflects the fact/analysis split: vendor facts trace to
 * `netquity_hk_ipo`, AiphaBee analysis to `aiphabee_research`.
 */

const MOCK_AS_OF = "2026-06-23T03:40:00.000Z";

const MOCK_PROVENANCE: ProvenanceRef[] = [
  {
    source: "netquity_hk_ipo",
    source_record_id: "hk-ipo-mock-v1",
    data_version: "hk-ipo-mock-v1",
    methodology_version: "hk-ipo-mock-v1",
  },
  {
    source: "aiphabee_research",
    source_record_id: "ipo-signal-mock-v1",
    data_version: "ipo-signal-mock-v1",
    methodology_version: "m-ipo-1.4",
  },
];

function mockMeta(requestId: string, rows: number): EnvelopeMeta {
  return {
    asOf: MOCK_AS_OF,
    requestId,
    marketStatus: "not_applicable",
    methodologyVersion: "m-ipo-1.4",
    provenance: MOCK_PROVENANCE,
    usage: { cached: true, credits: 0, rows },
  };
}

/** Aggregate detail snapshot for one IPO (mock of `getIpoSnapshot`). */
export function getIpoSnapshotMock(
  id: string,
): SuccessEnvelope<IpoSnapshot> | ErrorEnvelope {
  const ipo = findIpo(id);
  if (!ipo) {
    return createErrorEnvelope(
      "NOT_FOUND",
      `No IPO matches id "${id}".`,
      mockMeta(`mock-ipo-${id}`, 0),
    );
  }
  return createSuccessEnvelope(ipo, mockMeta(`mock-ipo-${id}`, 1));
}

function subOf(r: IpoRecord): number {
  return r.live.subPublic ?? r.allotment?.subPublic ?? -1;
}

function sortRows(rows: IpoRecord[], sort?: string): IpoRecord[] {
  const by = [...rows];
  if (sort === "sub") by.sort((a, b) => subOf(b) - subOf(a));
  else if (sort === "listing")
    by.sort((a, b) => a.listingDate.localeCompare(b.listingDate));
  else by.sort((a, b) => b.score - a.score); // default: score desc
  return by;
}

/** Filter + sort the IPO pipeline (mock of `screenIpos`). */
export function screenIposMock(
  filters: IpoScreenFilters = {},
): SuccessEnvelope<IpoScreenResult> {
  const q = filters.q?.trim().toLowerCase();
  let rows = IPOS.filter((r) => {
    if (filters.stage && r.stage !== filters.stage) return false;
    if (filters.sector && r.sector !== filters.sector) return false;
    if (q && ![r.name, r.cn, r.ticker].some((s) => s.toLowerCase().includes(q)))
      return false;
    return true;
  });
  rows = sortRows(rows, filters.sort);
  return createSuccessEnvelope(
    { rows, rowCount: rows.length, filters },
    mockMeta("mock-ipo-screen", rows.length),
  );
}

/** Compare a set of IPOs (mock of `compareIpos`). */
export function compareIposMock(
  ids: string[],
): SuccessEnvelope<IpoCompareResult> {
  const rows = ids
    .map((id) => findIpo(id))
    .filter((r): r is IpoRecord => Boolean(r));
  return createSuccessEnvelope(
    { requested: ids, rows, rowCount: rows.length },
    mockMeta("mock-ipo-compare", rows.length),
  );
}

/** Cross-IPO timetable agenda (mock of `getIpoCalendar`). */
export function getIpoCalendarMock(
  range: IpoCalendarRange = {},
): SuccessEnvelope<IpoCalendarResult> {
  const events: IpoCalendarEvent[] = IPOS.flatMap((r) =>
    r.timetable.map((ev) => ({
      ipoId: r.id,
      name: r.name,
      cn: r.cn,
      ticker: r.ticker,
      stage: r.stage,
      type: ev.type,
      title: ev.title,
      at: ev.at,
      done: ev.done,
    })),
  );
  return createSuccessEnvelope(
    { events, eventCount: events.length, range },
    mockMeta("mock-ipo-calendar", events.length),
  );
}
