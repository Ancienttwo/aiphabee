import type { ProvenanceRef, UsageSummary } from "@aiphabee/data-contracts";

export const GET_EVENT_TIMELINE_VERSION =
  "2026-06-21.phase3.get-event-timeline-tool-scaffold.v0";
export const GET_EVENT_TIMELINE_DATA_VERSION = "event-timeline-synthetic-v0";
export const MAX_EVENT_TIMELINE_LIMIT = 5;

export type EventTimelineInputErrorCode =
  | "DATE_RANGE_REQUIRED"
  | "INSTRUMENT_REQUIRED"
  | "INVALID_CURSOR"
  | "INVALID_DATE_RANGE";
export type EventTimelineStatus =
  | "data_not_licensed"
  | "data_quality_hold"
  | "found"
  | "not_found"
  | "out_of_range"
  | "too_many_rows";
export type EventTimelineEventType =
  | "announcement"
  | "corporate_action"
  | "financial_disclosure"
  | "market_event";
export type EventTimelineEventScope = "company" | "market";
export type EventTimelineQualityState = "HOLD" | "PASS";

export interface GetEventTimelineInput {
  cursor?: string;
  from: string;
  instrumentId: string;
  limit?: number;
  to: string;
  types?: string[];
}

export interface EventTimelineRelatedData {
  dataPoint: string;
  sourceRecordId: string;
  value: string;
}

export interface EventTimelineEvent {
  date: string;
  eventId: string;
  eventScope: EventTimelineEventScope;
  eventType: EventTimelineEventType;
  qualityState: EventTimelineQualityState;
  relatedData: EventTimelineRelatedData[];
  source: "announcement" | "corporate_action" | "financial_fact" | "market_calendar";
  sourceRecordId: string;
  summary: string;
  title: string;
}

export interface EventTimeline {
  currency: string;
  events: EventTimelineEvent[];
  exchange: string;
  from: string;
  instrumentId: string;
  market: string;
  nextCursor?: string;
  qualityState: EventTimelineQualityState;
  rowCount: number;
  symbol: string;
  to: string;
  totalRows: number;
}

export interface GetEventTimelineResult {
  cursor?: string;
  dataVersion: typeof GET_EVENT_TIMELINE_DATA_VERSION;
  from: string;
  instrumentId: string;
  limit: number;
  liveDataAccess: false;
  methodologyVersion: typeof GET_EVENT_TIMELINE_VERSION;
  provenance: ProvenanceRef[];
  rejectedTypes: string[];
  requestedTypes: EventTimelineEventType[];
  status: EventTimelineStatus;
  timeline?: EventTimeline;
  to: string;
  toolName: "get_event_timeline";
  usage: UsageSummary;
}

interface SyntheticEventTimelineRecord {
  currency: string;
  events: EventTimelineEvent[];
  exchange: string;
  instrumentId: string;
  market: string;
  qualityState: EventTimelineQualityState;
  symbol: string;
}

export class EventTimelineInputError extends Error {
  readonly code: EventTimelineInputErrorCode;

  constructor(code: EventTimelineInputErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const DEFAULT_EVENT_TYPES = [
  "announcement",
  "corporate_action",
  "financial_disclosure",
  "market_event"
] as const satisfies readonly EventTimelineEventType[];

const SYNTHETIC_EVENT_TIMELINES: readonly SyntheticEventTimelineRecord[] = [
  {
    currency: "HKD",
    exchange: "XHKG",
    instrumentId: "eq_hk_00700",
    market: "HK",
    qualityState: "PASS",
    symbol: "00700.HK",
    events: [
      {
        date: "2026-01-03",
        eventId: "evt_00700_20260103_annual_results",
        eventScope: "company",
        eventType: "announcement",
        qualityState: "PASS",
        relatedData: [
          {
            dataPoint: "document_id",
            sourceRecordId: "announcement:eq_hk_00700:2026-01-03:annual-results",
            value: "ann_00700_2026_annual_results"
          }
        ],
        source: "announcement",
        sourceRecordId: "announcement:eq_hk_00700:2026-01-03:annual-results",
        summary: "Synthetic annual results announcement with bounded citation locator.",
        title: "Annual results announcement published"
      },
      {
        date: "2026-01-05",
        eventId: "evt_hk_market_20260105_tech_rebound",
        eventScope: "market",
        eventType: "market_event",
        qualityState: "PASS",
        relatedData: [
          {
            dataPoint: "market_status",
            sourceRecordId: "market-calendar:HK:2026-01-05",
            value: "trading_day"
          }
        ],
        source: "market_calendar",
        sourceRecordId: "market-calendar:HK:2026-01-05",
        summary: "Synthetic Hong Kong market trading-day event aligned to the requested range.",
        title: "HK market full trading session"
      },
      {
        date: "2026-01-06",
        eventId: "evt_00700_20260106_revenue_fact",
        eventScope: "company",
        eventType: "financial_disclosure",
        qualityState: "PASS",
        relatedData: [
          {
            dataPoint: "revenue",
            sourceRecordId: "financial-facts:eq_hk_00700:2025-12-31:revenue",
            value: "synthetic_revenue_hkd_mn"
          }
        ],
        source: "financial_fact",
        sourceRecordId: "financial-facts:eq_hk_00700:2025-12-31:revenue",
        summary: "Synthetic standardized revenue fact linked to the disclosure period.",
        title: "Standardized revenue fact available"
      },
      {
        date: "2026-01-07",
        eventId: "evt_00700_20260107_final_dividend",
        eventScope: "company",
        eventType: "corporate_action",
        qualityState: "PASS",
        relatedData: [
          {
            dataPoint: "cash_dividend",
            sourceRecordId: "corporate-actions:eq_hk_00700:2026-01-07:dividend",
            value: "HKD 3.40"
          }
        ],
        source: "corporate_action",
        sourceRecordId: "corporate-actions:eq_hk_00700:2026-01-07:dividend",
        summary: "Synthetic final dividend event with corporate-action source linkage.",
        title: "Final dividend timeline event"
      }
    ]
  },
  {
    currency: "HKD",
    exchange: "XHKG",
    instrumentId: "eq_hk_hold",
    market: "HK",
    qualityState: "HOLD",
    symbol: "HOLD.HK",
    events: []
  }
] as const;

export function getEventTimeline(input: GetEventTimelineInput): GetEventTimelineResult {
  const instrumentId = input.instrumentId.trim();
  const from = input.from.trim();
  const to = input.to.trim();
  const limit = input.limit ?? MAX_EVENT_TIMELINE_LIMIT;
  const offset = parseEventTimelineCursor(input.cursor);
  const normalizedTypes = normalizeEventTypes(input.types);

  if (instrumentId.length === 0) {
    throw new EventTimelineInputError("INSTRUMENT_REQUIRED", "instrumentId is required");
  }

  if (from.length === 0 || to.length === 0) {
    throw new EventTimelineInputError("DATE_RANGE_REQUIRED", "from and to are required");
  }

  if (!isIsoDate(from) || !isIsoDate(to) || from > to) {
    throw new EventTimelineInputError(
      "INVALID_DATE_RANGE",
      "from and to must be YYYY-MM-DD with from <= to"
    );
  }

  if (!Number.isInteger(limit) || limit < 1) {
    return createEventTimelineResult({
      cursor: input.cursor,
      from,
      instrumentId,
      limit,
      rejectedTypes: [],
      requestedTypes: normalizedTypes.requestedTypes,
      status: "too_many_rows",
      timeline: undefined,
      to
    });
  }

  if (normalizedTypes.rejectedTypes.length > 0 || normalizedTypes.requestedTypes.length === 0) {
    return createEventTimelineResult({
      cursor: input.cursor,
      from,
      instrumentId,
      limit,
      rejectedTypes: normalizedTypes.rejectedTypes,
      requestedTypes: normalizedTypes.requestedTypes,
      status: "data_not_licensed",
      timeline: undefined,
      to
    });
  }

  if (limit > MAX_EVENT_TIMELINE_LIMIT) {
    return createEventTimelineResult({
      cursor: input.cursor,
      from,
      instrumentId,
      limit,
      rejectedTypes: [],
      requestedTypes: normalizedTypes.requestedTypes,
      status: "too_many_rows",
      timeline: undefined,
      to
    });
  }

  const record = SYNTHETIC_EVENT_TIMELINES.find(
    (candidate) => normalizeInstrumentId(candidate.instrumentId) === normalizeInstrumentId(instrumentId)
  );

  if (record === undefined) {
    return createEventTimelineResult({
      cursor: input.cursor,
      from,
      instrumentId,
      limit,
      rejectedTypes: [],
      requestedTypes: normalizedTypes.requestedTypes,
      status: "not_found",
      timeline: undefined,
      to
    });
  }

  if (record.qualityState === "HOLD") {
    return createEventTimelineResult({
      cursor: input.cursor,
      from,
      instrumentId,
      limit,
      rejectedTypes: [],
      requestedTypes: normalizedTypes.requestedTypes,
      status: "data_quality_hold",
      timeline: undefined,
      to
    });
  }

  const firstDate = record.events[0]?.date;
  const lastDate = record.events[record.events.length - 1]?.date;
  if (firstDate === undefined || lastDate === undefined || from < firstDate || to > lastDate) {
    return createEventTimelineResult({
      cursor: input.cursor,
      from,
      instrumentId,
      limit,
      rejectedTypes: [],
      requestedTypes: normalizedTypes.requestedTypes,
      status: "out_of_range",
      timeline: undefined,
      to
    });
  }

  const matchingEvents = record.events.filter(
    (event) =>
      event.date >= from &&
      event.date <= to &&
      normalizedTypes.requestedTypes.includes(event.eventType)
  );

  if (matchingEvents.length === 0) {
    return createEventTimelineResult({
      cursor: input.cursor,
      from,
      instrumentId,
      limit,
      rejectedTypes: [],
      requestedTypes: normalizedTypes.requestedTypes,
      status: "not_found",
      timeline: undefined,
      to
    });
  }

  return createEventTimelineResult({
    cursor: input.cursor,
    from,
    instrumentId,
    limit,
    rejectedTypes: [],
    requestedTypes: normalizedTypes.requestedTypes,
    status: "found",
    timeline: createEventTimeline({
      events: matchingEvents,
      from,
      limit,
      offset,
      record,
      to
    }),
    to
  });
}

export function getEventTimelineCapabilities() {
  return {
    company_and_market_events: true,
    cursor_pagination: true,
    data_version: GET_EVENT_TIMELINE_DATA_VERSION,
    handler_ready: true,
    input_schema: "tool.get_event_timeline.input.v0",
    live_data_access: false,
    max_rows_per_request: MAX_EVENT_TIMELINE_LIMIT,
    output_schema: "tool.get_event_timeline.output.v0",
    related_data_links: true,
    source_record_required: true,
    status: "get_event_timeline_scaffold" as const,
    supported_event_types: DEFAULT_EVENT_TYPES,
    synthetic_event_rows: SYNTHETIC_EVENT_TIMELINES.reduce(
      (count, record) => count + record.events.length,
      0
    ),
    version: GET_EVENT_TIMELINE_VERSION
  };
}

function createEventTimelineResult(params: {
  cursor?: string;
  from: string;
  instrumentId: string;
  limit: number;
  rejectedTypes: string[];
  requestedTypes: EventTimelineEventType[];
  status: EventTimelineStatus;
  timeline: EventTimeline | undefined;
  to: string;
}): GetEventTimelineResult {
  return {
    cursor: params.cursor,
    dataVersion: GET_EVENT_TIMELINE_DATA_VERSION,
    from: params.from,
    instrumentId: params.instrumentId,
    limit: params.limit,
    liveDataAccess: false,
    methodologyVersion: GET_EVENT_TIMELINE_VERSION,
    provenance: createEventTimelineProvenance(params.timeline),
    rejectedTypes: params.rejectedTypes,
    requestedTypes: params.requestedTypes,
    status: params.status,
    timeline: params.timeline,
    to: params.to,
    toolName: "get_event_timeline",
    usage: {
      cached: false,
      credits: params.timeline === undefined ? 0 : params.timeline.events.length * 3,
      rows: params.timeline?.events.length ?? 0
    }
  };
}

function createEventTimeline(params: {
  events: readonly EventTimelineEvent[];
  from: string;
  limit: number;
  offset: number;
  record: SyntheticEventTimelineRecord;
  to: string;
}): EventTimeline {
  const pageEvents = params.events.slice(params.offset, params.offset + params.limit);
  const nextOffset = params.offset + pageEvents.length;
  const nextCursor = nextOffset < params.events.length ? `offset:${nextOffset}` : undefined;

  return {
    currency: params.record.currency,
    events: pageEvents.map((event) => ({ ...event, relatedData: event.relatedData.map((item) => ({ ...item })) })),
    exchange: params.record.exchange,
    from: params.from,
    instrumentId: params.record.instrumentId,
    market: params.record.market,
    nextCursor,
    qualityState: params.record.qualityState,
    rowCount: pageEvents.length,
    symbol: params.record.symbol,
    to: params.to,
    totalRows: params.events.length
  };
}

function createEventTimelineProvenance(timeline: EventTimeline | undefined): ProvenanceRef[] {
  if (timeline !== undefined) {
    return timeline.events.map((event) => ({
      data_version: GET_EVENT_TIMELINE_DATA_VERSION,
      methodology_version: GET_EVENT_TIMELINE_VERSION,
      source: "event-timeline",
      source_record_id: event.sourceRecordId
    }));
  }

  return [
    {
      data_version: GET_EVENT_TIMELINE_DATA_VERSION,
      methodology_version: GET_EVENT_TIMELINE_VERSION,
      source: "event-timeline",
      source_record_id: "event-timeline-synthetic-v0"
    }
  ];
}

function normalizeEventTypes(types: string[] | undefined): {
  rejectedTypes: string[];
  requestedTypes: EventTimelineEventType[];
} {
  if (types === undefined || types.length === 0) {
    return {
      rejectedTypes: [],
      requestedTypes: [...DEFAULT_EVENT_TYPES]
    };
  }

  const requestedTypes: EventTimelineEventType[] = [];
  const rejectedTypes: string[] = [];

  for (const type of types) {
    if (isEventTimelineEventType(type)) {
      requestedTypes.push(type);
    } else {
      rejectedTypes.push(type);
    }
  }

  return {
    rejectedTypes,
    requestedTypes
  };
}

function isEventTimelineEventType(value: string): value is EventTimelineEventType {
  return (DEFAULT_EVENT_TYPES as readonly string[]).includes(value);
}

function parseEventTimelineCursor(cursor: string | undefined): number {
  if (cursor === undefined || cursor.length === 0) {
    return 0;
  }

  const match = cursor.match(/^offset:(\d+)$/u);
  if (match === null) {
    throw new EventTimelineInputError(
      "INVALID_CURSOR",
      "cursor must be an opaque event timeline cursor"
    );
  }

  return Number(match[1]);
}

function normalizeInstrumentId(value: string): string {
  return value.trim().toLowerCase();
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/u.test(value);
}
