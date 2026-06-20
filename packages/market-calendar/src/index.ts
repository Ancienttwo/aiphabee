import type { ProvenanceRef, UsageSummary } from "@aiphabee/data-contracts";

export const GET_MARKET_CALENDAR_VERSION =
  "2026-06-21.phase1.get-market-calendar-tool-scaffold.v0";
export const GET_MARKET_CALENDAR_DATA_VERSION = "market-calendar-synthetic-v0";

export type MarketCalendarInputErrorCode =
  | "DATE_RANGE_REQUIRED"
  | "INVALID_DATE_RANGE"
  | "MARKET_REQUIRED";
export type MarketCalendarStatus = "found" | "not_found" | "out_of_range";
export type MarketCalendarSessionStatus = "closed" | "half_day" | "trading_day";
export type MarketCalendarClosureReason = "holiday" | "weather" | "weekend";

export interface GetMarketCalendarInput {
  from: string;
  market: string;
  to: string;
}

export interface MarketCalendarSession {
  closeAt?: string;
  closureReason?: MarketCalendarClosureReason;
  date: string;
  isTradingDay: boolean;
  market: string;
  notes: string[];
  openAt?: string;
  sessionStatus: MarketCalendarSessionStatus;
  timezone: string;
}

export interface GetMarketCalendarResult {
  dataVersion: typeof GET_MARKET_CALENDAR_DATA_VERSION;
  from: string;
  liveDataAccess: false;
  market: string;
  methodologyVersion: typeof GET_MARKET_CALENDAR_VERSION;
  provenance: ProvenanceRef[];
  sessions: MarketCalendarSession[];
  status: MarketCalendarStatus;
  timezone?: string;
  to: string;
  toolName: "get_market_calendar";
  usage: UsageSummary;
}

interface SyntheticMarketCalendar {
  coverage: {
    from: string;
    to: string;
  };
  market: string;
  sessions: MarketCalendarSession[];
  timezone: string;
}

export class MarketCalendarInputError extends Error {
  readonly code: MarketCalendarInputErrorCode;

  constructor(code: MarketCalendarInputErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const SYNTHETIC_MARKET_CALENDARS: readonly SyntheticMarketCalendar[] = [
  {
    coverage: {
      from: "2026-01-05",
      to: "2026-01-11"
    },
    market: "HK",
    sessions: [
      createTradingDay("2026-01-05", ["synthetic full trading day fixture"]),
      createTradingDay("2026-01-06", ["synthetic full trading day fixture"]),
      {
        closeAt: "2026-01-07T12:00:00+08:00",
        date: "2026-01-07",
        isTradingDay: true,
        market: "HK",
        notes: ["synthetic half-day fixture"],
        openAt: "2026-01-07T09:30:00+08:00",
        sessionStatus: "half_day",
        timezone: "Asia/Hong_Kong"
      },
      {
        closureReason: "weather",
        date: "2026-01-08",
        isTradingDay: false,
        market: "HK",
        notes: ["synthetic severe-weather closure fixture"],
        sessionStatus: "closed",
        timezone: "Asia/Hong_Kong"
      },
      {
        closureReason: "holiday",
        date: "2026-01-09",
        isTradingDay: false,
        market: "HK",
        notes: ["synthetic public-holiday closure fixture"],
        sessionStatus: "closed",
        timezone: "Asia/Hong_Kong"
      },
      {
        closureReason: "weekend",
        date: "2026-01-10",
        isTradingDay: false,
        market: "HK",
        notes: ["synthetic weekend closure fixture"],
        sessionStatus: "closed",
        timezone: "Asia/Hong_Kong"
      },
      {
        closureReason: "weekend",
        date: "2026-01-11",
        isTradingDay: false,
        market: "HK",
        notes: ["synthetic weekend closure fixture"],
        sessionStatus: "closed",
        timezone: "Asia/Hong_Kong"
      }
    ],
    timezone: "Asia/Hong_Kong"
  }
] as const;

export function getMarketCalendar(
  input: GetMarketCalendarInput
): GetMarketCalendarResult {
  const market = input.market.trim().toUpperCase();
  const from = input.from.trim();
  const to = input.to.trim();

  if (market.length === 0) {
    throw new MarketCalendarInputError("MARKET_REQUIRED", "market is required");
  }

  if (from.length === 0 || to.length === 0) {
    throw new MarketCalendarInputError(
      "DATE_RANGE_REQUIRED",
      "from and to are required"
    );
  }

  if (!isIsoDate(from) || !isIsoDate(to) || from > to) {
    throw new MarketCalendarInputError(
      "INVALID_DATE_RANGE",
      "from and to must be YYYY-MM-DD with from <= to"
    );
  }

  const calendar = SYNTHETIC_MARKET_CALENDARS.find(
    (candidate) => candidate.market === market
  );

  if (calendar === undefined) {
    return createResult({
      from,
      market,
      sessions: [],
      status: "not_found",
      timezone: undefined,
      to
    });
  }

  if (from < calendar.coverage.from || to > calendar.coverage.to) {
    return createResult({
      from,
      market,
      sessions: [],
      status: "out_of_range",
      timezone: calendar.timezone,
      to
    });
  }

  const sessions = calendar.sessions.filter(
    (session) => session.date >= from && session.date <= to
  );

  return createResult({
    from,
    market,
    sessions,
    status: sessions.length === 0 ? "not_found" : "found",
    timezone: calendar.timezone,
    to
  });
}

export function getMarketCalendarCapabilities() {
  return {
    data_version: GET_MARKET_CALENDAR_DATA_VERSION,
    handler_ready: true,
    input_schema: "tool.get_market_calendar.input.v0",
    live_data_access: false,
    output_schema: "tool.get_market_calendar.output.v0",
    status: "get_market_calendar_scaffold" as const,
    supported_markets: ["HK"] as const,
    supported_session_statuses: ["trading_day", "half_day", "closed"] as const,
    synthetic_session_rows: SYNTHETIC_MARKET_CALENDARS.reduce(
      (count, calendar) => count + calendar.sessions.length,
      0
    ),
    timezone: "Asia/Hong_Kong",
    version: GET_MARKET_CALENDAR_VERSION
  };
}

function createResult(params: {
  from: string;
  market: string;
  sessions: MarketCalendarSession[];
  status: MarketCalendarStatus;
  timezone: string | undefined;
  to: string;
}): GetMarketCalendarResult {
  return {
    dataVersion: GET_MARKET_CALENDAR_DATA_VERSION,
    from: params.from,
    liveDataAccess: false,
    market: params.market,
    methodologyVersion: GET_MARKET_CALENDAR_VERSION,
    provenance: createProvenance(),
    sessions: params.sessions,
    status: params.status,
    timezone: params.timezone,
    to: params.to,
    toolName: "get_market_calendar",
    usage: {
      cached: false,
      credits: 0,
      rows: params.sessions.length
    }
  };
}

function createTradingDay(date: string, notes: string[]): MarketCalendarSession {
  return {
    closeAt: `${date}T16:00:00+08:00`,
    date,
    isTradingDay: true,
    market: "HK",
    notes,
    openAt: `${date}T09:30:00+08:00`,
    sessionStatus: "trading_day",
    timezone: "Asia/Hong_Kong"
  };
}

function createProvenance(): ProvenanceRef[] {
  return [
    {
      data_version: GET_MARKET_CALENDAR_DATA_VERSION,
      methodology_version: GET_MARKET_CALENDAR_VERSION,
      source: "synthetic-market-calendar",
      source_record_id: "get-market-calendar-fixture-v0"
    }
  ];
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/u.test(value);
}
