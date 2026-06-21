export const WATCHLIST_ALERTS_VERSION =
  "2026-06-21.phase2.watchlist-alerts-scaffold.v0";
export const WATCHLIST_BRIEFING_VERSION =
  "2026-06-21.phase2.watchlist-briefings-scaffold.v0";

export const WATCHLIST_ALERT_KINDS = ["price", "announcement", "metric"] as const;
export const WATCHLIST_ALERT_FREQUENCIES = ["realtime", "daily", "weekly"] as const;
export const WATCHLIST_ALERT_CHANNELS = ["in_app", "email", "webhook"] as const;
export const WATCHLIST_BRIEFING_CADENCES = ["daily", "weekly"] as const;

export type WatchlistAlertKind = (typeof WATCHLIST_ALERT_KINDS)[number];
export type WatchlistAlertFrequency = (typeof WATCHLIST_ALERT_FREQUENCIES)[number];
export type WatchlistAlertChannel = (typeof WATCHLIST_ALERT_CHANNELS)[number];
export type WatchlistBriefingCadence = (typeof WATCHLIST_BRIEFING_CADENCES)[number];
export type WatchlistAlertsPlanStatus =
  | "blocked_missing_context"
  | "confirmation_required"
  | "planned_no_write";
export type WatchlistBriefingPlanStatus = "blocked_missing_context" | "planned_no_write";

export interface WatchlistAlertConditionInput {
  comparator?: "above" | "below" | "changed_by_percent" | "changed_by_value";
  metricId?: string;
  priceField?: "close" | "last" | "volume";
  threshold?: number;
}

export interface CreateWatchlistAlertsPlanInput {
  alertKinds?: WatchlistAlertKind[];
  channels?: WatchlistAlertChannel[];
  condition?: WatchlistAlertConditionInput;
  explicitConfirmation?: boolean;
  frequency?: WatchlistAlertFrequency;
  idempotencyKey?: string;
  instrumentId?: string;
  metricIds?: string[];
  quietHoursEnd?: string;
  quietHoursStart?: string;
  requestId: string;
  securityQuery?: string;
  timezone?: string;
  userId?: string;
  watchlistId?: string;
  workspaceId?: string;
}

export interface CreateWatchlistBriefingPlanInput {
  asOf?: string;
  cadence?: WatchlistBriefingCadence;
  channels?: WatchlistAlertChannel[];
  maxItems?: number;
  minMaterialityScore?: number;
  requestId: string;
  timezone?: string;
  userId?: string;
  watchlistId?: string;
  workspaceId?: string;
}

export interface WatchlistBriefingCapabilities {
  evidence_required: true;
  frontend: false;
  live_tool_execution: false;
  material_changes_only: true;
  notification_fanout: false;
  package: "@aiphabee/watchlist-runtime";
  persistent_writes: false;
  route: "POST /watchlist/briefings/plan";
  runtime_route: "GET /watchlist/runtime";
  sql_emitted: false;
  status: "watchlist_briefings_scaffold";
  supported_cadences: readonly WatchlistBriefingCadence[];
  tables: readonly ["core.watchlist_briefing", "core.watchlist_briefing_item"];
  version: typeof WATCHLIST_BRIEFING_VERSION;
}

export interface WatchlistAlertRuntimeCapabilities {
  briefings: WatchlistBriefingCapabilities;
  create_alert_scope: "alerts.write";
  dedupe_ready: true;
  event_queue: "AIPHABEE_EVENTS_QUEUE";
  explicit_confirmation_required: true;
  frequency_controls: true;
  frontend: false;
  independent_scope_required: true;
  live_tool_execution: false;
  notification_fanout: false;
  package: "@aiphabee/watchlist-runtime";
  persistent_writes: false;
  quiet_period_controls: true;
  route: "POST /watchlist/alerts/plan";
  runtime_route: "GET /watchlist/runtime";
  source_required: true;
  sql_emitted: false;
  status: "watchlist_alerts_scaffold";
  supported_alert_kinds: readonly WatchlistAlertKind[];
  supported_channels: readonly WatchlistAlertChannel[];
  supported_frequencies: readonly WatchlistAlertFrequency[];
  tables: readonly [
    "core.watchlist",
    "core.watchlist_item",
    "core.watchlist_alert_rule",
    "core.watchlist_alert_event"
  ];
  version: typeof WATCHLIST_ALERTS_VERSION;
}

export interface WatchlistAlertsPlan {
  alert_rule: {
    alert_kinds: WatchlistAlertKind[];
    explicit_confirmation: boolean;
    idempotency_key: string;
    independent_scope: "alerts.write";
    rule_id: string;
    table: "core.watchlist_alert_rule";
    write_status: "blocked" | "planned_no_write";
  };
  channels: WatchlistAlertChannel[];
  data_version: typeof WATCHLIST_ALERTS_VERSION;
  dedupe: {
    dedupe_key: string;
    duplicate_policy: "suppress_same_source_within_window";
    source_record_id_required: true;
    window_minutes: number;
  };
  evaluation_plan: {
    announcement_alert: {
      live_tool_execution: false;
      source_tool: "search_announcements";
      status: "planned_no_write" | "not_requested";
    };
    metric_alert: {
      live_tool_execution: false;
      metric_ids: string[];
      source_tool: "get_financial_ratios";
      status: "planned_no_write" | "not_requested";
    };
    price_alert: {
      condition: {
        comparator: WatchlistAlertConditionInput["comparator"];
        field: WatchlistAlertConditionInput["priceField"];
        threshold?: number;
      };
      live_tool_execution: false;
      source_tool: "get_quote_snapshot";
      status: "planned_no_write" | "not_requested";
    };
  };
  frequency: {
    frequency: WatchlistAlertFrequency;
    max_notifications_per_period: number;
    quiet_period: {
      enabled: boolean;
      end?: string;
      start?: string;
      timezone: string;
    };
  };
  frontend: false;
  live_tool_execution: false;
  methodology_version: typeof WATCHLIST_ALERTS_VERSION;
  notification: {
    channels: WatchlistAlertChannel[];
    evidence_required: true;
    event_queue: "AIPHABEE_EVENTS_QUEUE";
    fanout_status: "planned_no_write";
    notification_write_status: "planned_no_write";
  };
  persistence_plan: {
    live_db_writes: false;
    queue_writes: false;
    sql_emitted: false;
    tables: WatchlistAlertRuntimeCapabilities["tables"];
    write_status: "blocked" | "planned_no_write";
  };
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  request_id: string;
  sql_emitted: false;
  status: WatchlistAlertsPlanStatus;
  toolName: "plan_watchlist_alerts";
  usage: {
    cached: false;
    credits: 0;
    rows: number;
  };
  validation: {
    explicit_confirmation_provided: boolean;
    explicit_confirmation_required: true;
    idempotency_key_required: true;
    required_context_present: boolean;
    scope_required: "alerts.write";
  };
  version: typeof WATCHLIST_ALERTS_VERSION;
  watchlist: {
    instrument_id?: string;
    item_id: string;
    security_query?: string;
    watchlist_id: string;
    watchlist_item_table: "core.watchlist_item";
    watchlist_table: "core.watchlist";
    write_status: "blocked" | "planned_no_write";
  };
  workspace: {
    user_id: string;
    workspace_id: string;
  };
}

export interface WatchlistBriefingPlan {
  as_of: string;
  briefing: {
    briefing_id: string;
    cadence: WatchlistBriefingCadence;
    max_items: number;
    material_changes_only: true;
    status: WatchlistBriefingPlanStatus;
    table: "core.watchlist_briefing";
    watchlist_id: string;
    write_status: "blocked" | "planned_no_write";
  };
  channels: WatchlistAlertChannel[];
  data_version: typeof WATCHLIST_BRIEFING_VERSION;
  evidence_index: {
    evidence_required: true;
    item_table: "core.watchlist_briefing_item";
    source_record_id_required: true;
  };
  frontend: false;
  live_tool_execution: false;
  materiality_filter: {
    empty_briefing_policy: "suppress_no_material_changes";
    min_materiality_score: number;
    only_substantive_changes: true;
  };
  methodology_version: typeof WATCHLIST_BRIEFING_VERSION;
  notification: {
    channels: WatchlistAlertChannel[];
    evidence_required: true;
    event_queue: "AIPHABEE_EVENTS_QUEUE";
    fanout_status: "planned_no_write";
  };
  persistence_plan: {
    live_db_writes: false;
    queue_writes: false;
    sql_emitted: false;
    tables: WatchlistBriefingCapabilities["tables"];
    write_status: "blocked" | "planned_no_write";
  };
  provenance: Array<{
    data_version: string;
    methodology_version: string;
    source: string;
    source_record_id: string;
  }>;
  request_id: string;
  source_plan: {
    announcement_source: {
      live_tool_execution: false;
      source_tool: "search_announcements";
    };
    metric_source: {
      live_tool_execution: false;
      source_tool: "get_financial_ratios";
    };
    price_source: {
      live_tool_execution: false;
      source_tool: "get_quote_snapshot";
    };
  };
  sql_emitted: false;
  status: WatchlistBriefingPlanStatus;
  timezone: string;
  toolName: "plan_watchlist_briefing";
  usage: {
    cached: false;
    credits: 0;
    rows: number;
  };
  validation: {
    required_context_present: boolean;
    watchlist_required: true;
  };
  version: typeof WATCHLIST_BRIEFING_VERSION;
  workspace: {
    user_id: string;
    workspace_id: string;
  };
}

const WATCHLIST_ALERT_TABLES: WatchlistAlertRuntimeCapabilities["tables"] = [
  "core.watchlist",
  "core.watchlist_item",
  "core.watchlist_alert_rule",
  "core.watchlist_alert_event"
];
const WATCHLIST_BRIEFING_TABLES: WatchlistBriefingCapabilities["tables"] = [
  "core.watchlist_briefing",
  "core.watchlist_briefing_item"
];

export function getWatchlistRuntimeCapabilities(): WatchlistAlertRuntimeCapabilities {
  return {
    briefings: getWatchlistBriefingCapabilities(),
    create_alert_scope: "alerts.write",
    dedupe_ready: true,
    event_queue: "AIPHABEE_EVENTS_QUEUE",
    explicit_confirmation_required: true,
    frequency_controls: true,
    frontend: false,
    independent_scope_required: true,
    live_tool_execution: false,
    notification_fanout: false,
    package: "@aiphabee/watchlist-runtime",
    persistent_writes: false,
    quiet_period_controls: true,
    route: "POST /watchlist/alerts/plan",
    runtime_route: "GET /watchlist/runtime",
    source_required: true,
    sql_emitted: false,
    status: "watchlist_alerts_scaffold",
    supported_alert_kinds: WATCHLIST_ALERT_KINDS,
    supported_channels: WATCHLIST_ALERT_CHANNELS,
    supported_frequencies: WATCHLIST_ALERT_FREQUENCIES,
    tables: WATCHLIST_ALERT_TABLES,
    version: WATCHLIST_ALERTS_VERSION
  };
}

export function getWatchlistBriefingCapabilities(): WatchlistBriefingCapabilities {
  return {
    evidence_required: true,
    frontend: false,
    live_tool_execution: false,
    material_changes_only: true,
    notification_fanout: false,
    package: "@aiphabee/watchlist-runtime",
    persistent_writes: false,
    route: "POST /watchlist/briefings/plan",
    runtime_route: "GET /watchlist/runtime",
    sql_emitted: false,
    status: "watchlist_briefings_scaffold",
    supported_cadences: WATCHLIST_BRIEFING_CADENCES,
    tables: WATCHLIST_BRIEFING_TABLES,
    version: WATCHLIST_BRIEFING_VERSION
  };
}

export function createWatchlistAlertsPlan(
  input: CreateWatchlistAlertsPlanInput
): WatchlistAlertsPlan {
  const alertKinds = normalizeAlertKinds(input.alertKinds);
  const channels = normalizeChannels(input.channels);
  const frequency = input.frequency ?? "daily";
  const workspaceId = normalizeText(input.workspaceId) ?? "workspace_unresolved";
  const userId = normalizeText(input.userId) ?? "user_unresolved";
  const watchlistId =
    normalizeText(input.watchlistId) ?? `watchlist_${sanitizeForId(workspaceId)}`;
  const instrumentId = normalizeText(input.instrumentId);
  const securityQuery = normalizeText(input.securityQuery);
  const idempotencyKey =
    normalizeText(input.idempotencyKey) ??
    `alert_idem_${sanitizeForId(input.requestId)}_${hashStableValue(alertKinds)}`;
  const requiredContextPresent =
    normalizeText(input.workspaceId) !== undefined &&
    normalizeText(input.userId) !== undefined &&
    (instrumentId !== undefined || securityQuery !== undefined) &&
    normalizeText(input.idempotencyKey) !== undefined;
  const explicitConfirmationProvided = input.explicitConfirmation === true;
  const status = resolveStatus(requiredContextPresent, explicitConfirmationProvided);
  const writeStatus = status === "planned_no_write" ? "planned_no_write" : "blocked";
  const ruleId = `alert_rule_${hashStableValue({
    alertKinds,
    idempotencyKey,
    instrumentId,
    securityQuery,
    watchlistId
  })}`;
  const itemId = `watchlist_item_${hashStableValue({
    instrumentId,
    securityQuery,
    watchlistId
  })}`;
  const sourceRecordId = `watchlist_alert_plan_${hashStableValue({
    idempotencyKey,
    requestId: input.requestId
  })}`;
  const metricIds = normalizeMetricIds(input.metricIds, input.condition?.metricId);

  return {
    alert_rule: {
      alert_kinds: alertKinds,
      explicit_confirmation: explicitConfirmationProvided,
      idempotency_key: idempotencyKey,
      independent_scope: "alerts.write",
      rule_id: ruleId,
      table: "core.watchlist_alert_rule",
      write_status: writeStatus
    },
    channels,
    data_version: WATCHLIST_ALERTS_VERSION,
    dedupe: {
      dedupe_key: `dedupe_${hashStableValue({
        alertKinds,
        frequency,
        instrumentId,
        metricIds,
        securityQuery
      })}`,
      duplicate_policy: "suppress_same_source_within_window",
      source_record_id_required: true,
      window_minutes: frequency === "realtime" ? 30 : 24 * 60
    },
    evaluation_plan: {
      announcement_alert: {
        live_tool_execution: false,
        source_tool: "search_announcements",
        status: alertKinds.includes("announcement") ? "planned_no_write" : "not_requested"
      },
      metric_alert: {
        live_tool_execution: false,
        metric_ids: metricIds,
        source_tool: "get_financial_ratios",
        status: alertKinds.includes("metric") ? "planned_no_write" : "not_requested"
      },
      price_alert: {
        condition: {
          comparator: input.condition?.comparator ?? "changed_by_percent",
          field: input.condition?.priceField ?? "close",
          threshold: input.condition?.threshold
        },
        live_tool_execution: false,
        source_tool: "get_quote_snapshot",
        status: alertKinds.includes("price") ? "planned_no_write" : "not_requested"
      }
    },
    frequency: {
      frequency,
      max_notifications_per_period: frequency === "realtime" ? 6 : 1,
      quiet_period: {
        enabled: input.quietHoursStart !== undefined || input.quietHoursEnd !== undefined,
        end: normalizeText(input.quietHoursEnd),
        start: normalizeText(input.quietHoursStart),
        timezone: normalizeText(input.timezone) ?? "Asia/Hong_Kong"
      }
    },
    frontend: false,
    live_tool_execution: false,
    methodology_version: WATCHLIST_ALERTS_VERSION,
    notification: {
      channels,
      evidence_required: true,
      event_queue: "AIPHABEE_EVENTS_QUEUE",
      fanout_status: "planned_no_write",
      notification_write_status: "planned_no_write"
    },
    persistence_plan: {
      live_db_writes: false,
      queue_writes: false,
      sql_emitted: false,
      tables: WATCHLIST_ALERT_TABLES,
      write_status: writeStatus
    },
    provenance: [
      {
        data_version: WATCHLIST_ALERTS_VERSION,
        methodology_version: WATCHLIST_ALERTS_VERSION,
        source: "watchlist-alerts-plan",
        source_record_id: sourceRecordId
      }
    ],
    request_id: input.requestId,
    sql_emitted: false,
    status,
    toolName: "plan_watchlist_alerts",
    usage: {
      cached: false,
      credits: 0,
      rows: 1 + alertKinds.length + metricIds.length
    },
    validation: {
      explicit_confirmation_provided: explicitConfirmationProvided,
      explicit_confirmation_required: true,
      idempotency_key_required: true,
      required_context_present: requiredContextPresent,
      scope_required: "alerts.write"
    },
    version: WATCHLIST_ALERTS_VERSION,
    watchlist: {
      instrument_id: instrumentId,
      item_id: itemId,
      security_query: securityQuery,
      watchlist_id: watchlistId,
      watchlist_item_table: "core.watchlist_item",
      watchlist_table: "core.watchlist",
      write_status: writeStatus
    },
    workspace: {
      user_id: userId,
      workspace_id: workspaceId
    }
  };
}

export function createWatchlistBriefingPlan(
  input: CreateWatchlistBriefingPlanInput
): WatchlistBriefingPlan {
  const workspaceId = normalizeText(input.workspaceId) ?? "workspace_unresolved";
  const userId = normalizeText(input.userId) ?? "user_unresolved";
  const watchlistId = normalizeText(input.watchlistId) ?? "watchlist_unresolved";
  const cadence = input.cadence ?? "daily";
  const asOf = normalizeAsOf(input.asOf);
  const channels = normalizeChannels(input.channels);
  const maxItems = normalizePositiveInteger(input.maxItems) ?? 12;
  const minMaterialityScore = normalizeMaterialityScore(input.minMaterialityScore);
  const timezone = normalizeText(input.timezone) ?? "Asia/Hong_Kong";
  const requiredContextPresent =
    normalizeText(input.workspaceId) !== undefined &&
    normalizeText(input.userId) !== undefined &&
    normalizeText(input.watchlistId) !== undefined;
  const status: WatchlistBriefingPlanStatus = requiredContextPresent
    ? "planned_no_write"
    : "blocked_missing_context";
  const writeStatus = status === "planned_no_write" ? "planned_no_write" : "blocked";
  const briefingId = `watchlist_briefing_${hashStableValue({
    asOf,
    cadence,
    requestId: input.requestId,
    watchlistId
  })}`;

  return {
    as_of: asOf,
    briefing: {
      briefing_id: briefingId,
      cadence,
      max_items: maxItems,
      material_changes_only: true,
      status,
      table: "core.watchlist_briefing",
      watchlist_id: watchlistId,
      write_status: writeStatus
    },
    channels,
    data_version: WATCHLIST_BRIEFING_VERSION,
    evidence_index: {
      evidence_required: true,
      item_table: "core.watchlist_briefing_item",
      source_record_id_required: true
    },
    frontend: false,
    live_tool_execution: false,
    materiality_filter: {
      empty_briefing_policy: "suppress_no_material_changes",
      min_materiality_score: minMaterialityScore,
      only_substantive_changes: true
    },
    methodology_version: WATCHLIST_BRIEFING_VERSION,
    notification: {
      channels,
      evidence_required: true,
      event_queue: "AIPHABEE_EVENTS_QUEUE",
      fanout_status: "planned_no_write"
    },
    persistence_plan: {
      live_db_writes: false,
      queue_writes: false,
      sql_emitted: false,
      tables: WATCHLIST_BRIEFING_TABLES,
      write_status: writeStatus
    },
    provenance: [
      {
        data_version: WATCHLIST_BRIEFING_VERSION,
        methodology_version: WATCHLIST_BRIEFING_VERSION,
        source: "watchlist-briefing-plan",
        source_record_id: briefingId
      }
    ],
    request_id: input.requestId,
    source_plan: {
      announcement_source: {
        live_tool_execution: false,
        source_tool: "search_announcements"
      },
      metric_source: {
        live_tool_execution: false,
        source_tool: "get_financial_ratios"
      },
      price_source: {
        live_tool_execution: false,
        source_tool: "get_quote_snapshot"
      }
    },
    sql_emitted: false,
    status,
    timezone,
    toolName: "plan_watchlist_briefing",
    usage: {
      cached: false,
      credits: 0,
      rows: status === "planned_no_write" ? maxItems : 0
    },
    validation: {
      required_context_present: requiredContextPresent,
      watchlist_required: true
    },
    version: WATCHLIST_BRIEFING_VERSION,
    workspace: {
      user_id: userId,
      workspace_id: workspaceId
    }
  };
}

function normalizeAlertKinds(kinds: WatchlistAlertKind[] | undefined): WatchlistAlertKind[] {
  const normalized =
    kinds?.filter((kind): kind is WatchlistAlertKind =>
      WATCHLIST_ALERT_KINDS.includes(kind)
    ) ?? [];

  return normalized.length > 0 ? [...new Set(normalized)] : ["price"];
}

function normalizeChannels(channels: WatchlistAlertChannel[] | undefined): WatchlistAlertChannel[] {
  const normalized =
    channels?.filter((channel): channel is WatchlistAlertChannel =>
      WATCHLIST_ALERT_CHANNELS.includes(channel)
    ) ?? [];

  return normalized.length > 0 ? [...new Set(normalized)] : ["in_app"];
}

function normalizeMetricIds(metricIds: string[] | undefined, metricId?: string): string[] {
  const normalized = [...(metricIds ?? []), metricId]
    .map((value) => normalizeText(value))
    .filter((value): value is string => value !== undefined);

  return [...new Set(normalized)].sort((left, right) => left.localeCompare(right));
}

function resolveStatus(
  requiredContextPresent: boolean,
  explicitConfirmationProvided: boolean
): WatchlistAlertsPlanStatus {
  if (!requiredContextPresent) {
    return "blocked_missing_context";
  }

  return explicitConfirmationProvided ? "planned_no_write" : "confirmation_required";
}

function normalizeAsOf(value: string | undefined): string {
  const normalized = normalizeText(value);

  if (normalized !== undefined && !Number.isNaN(Date.parse(normalized))) {
    return normalized;
  }

  return "2026-01-07T16:15:00+08:00";
}

function normalizePositiveInteger(value: number | undefined): number | undefined {
  return value !== undefined && Number.isInteger(value) && value > 0 ? value : undefined;
}

function normalizeMaterialityScore(value: number | undefined): number {
  return value !== undefined && Number.isFinite(value) && value >= 0 && value <= 1
    ? value
    : 0.6;
}

function normalizeText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized === undefined || normalized.length === 0 ? undefined : normalized;
}

function sanitizeForId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "_")
    .replace(/^_+|_+$/gu, "")
    .slice(0, 64);
}

function hashStableValue(value: unknown): string {
  const text = stableStringify(value);
  let hash = 2166136261;

  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => {
      const record = value as Record<string, unknown>;
      return `${JSON.stringify(key)}:${stableStringify(record[key])}`;
    })
    .join(",")}}`;
}
