import { describe, expect, it } from "vitest";
import {
  createWatchlistBriefingPlan,
  createWatchlistAlertsPlan,
  getWatchlistBriefingCapabilities,
  getWatchlistRuntimeCapabilities
} from "./index";

describe("watchlist alerts scaffold", () => {
  it("reports watchlist alert runtime capabilities", () => {
    expect(getWatchlistRuntimeCapabilities()).toMatchObject({
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
      status: "watchlist_alerts_scaffold"
    });
    expect(getWatchlistRuntimeCapabilities().supported_alert_kinds).toEqual([
      "price",
      "announcement",
      "metric"
    ]);
    expect(getWatchlistRuntimeCapabilities().tables).toEqual([
      "core.watchlist",
      "core.watchlist_item",
      "core.watchlist_alert_rule",
      "core.watchlist_alert_event"
    ]);
    expect(getWatchlistRuntimeCapabilities().briefings).toMatchObject({
      evidence_required: true,
      frontend: false,
      live_tool_execution: false,
      material_changes_only: true,
      notification_fanout: false,
      persistent_writes: false,
      route: "POST /watchlist/briefings/plan",
      runtime_route: "GET /watchlist/runtime",
      sql_emitted: false,
      status: "watchlist_briefings_scaffold"
    });
  });

  it("reports watchlist briefing capabilities", () => {
    expect(getWatchlistBriefingCapabilities()).toMatchObject({
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
      status: "watchlist_briefings_scaffold"
    });
    expect(getWatchlistBriefingCapabilities().supported_cadences).toEqual([
      "daily",
      "weekly"
    ]);
    expect(getWatchlistBriefingCapabilities().tables).toEqual([
      "core.watchlist_briefing",
      "core.watchlist_briefing_item"
    ]);
  });

  it("plans confirmed watchlist alerts without writes or fanout", () => {
    const plan = createWatchlistAlertsPlan({
      alertKinds: ["price", "announcement", "metric"],
      channels: ["in_app", "email"],
      condition: {
        comparator: "changed_by_percent",
        metricId: "net_margin",
        priceField: "close",
        threshold: 5
      },
      explicitConfirmation: true,
      frequency: "daily",
      idempotencyKey: "alert-idem-00700-daily",
      instrumentId: "instrument_hk_00700",
      metricIds: ["return_on_equity"],
      quietHoursEnd: "08:30",
      quietHoursStart: "21:30",
      requestId: "req-watchlist-alerts",
      timezone: "Asia/Hong_Kong",
      userId: "user_internal_alpha",
      watchlistId: "watchlist_alpha_hk",
      workspaceId: "workspace_research"
    });

    expect(plan).toMatchObject({
      channels: ["in_app", "email"],
      frontend: false,
      live_tool_execution: false,
      request_id: "req-watchlist-alerts",
      sql_emitted: false,
      status: "planned_no_write",
      toolName: "plan_watchlist_alerts"
    });
    expect(plan.alert_rule).toMatchObject({
      alert_kinds: ["price", "announcement", "metric"],
      explicit_confirmation: true,
      idempotency_key: "alert-idem-00700-daily",
      independent_scope: "alerts.write",
      table: "core.watchlist_alert_rule",
      write_status: "planned_no_write"
    });
    expect(plan.watchlist).toMatchObject({
      instrument_id: "instrument_hk_00700",
      watchlist_id: "watchlist_alpha_hk",
      watchlist_item_table: "core.watchlist_item",
      watchlist_table: "core.watchlist",
      write_status: "planned_no_write"
    });
    expect(plan.dedupe).toMatchObject({
      duplicate_policy: "suppress_same_source_within_window",
      source_record_id_required: true,
      window_minutes: 1440
    });
    expect(plan.frequency).toEqual({
      frequency: "daily",
      max_notifications_per_period: 1,
      quiet_period: {
        enabled: true,
        end: "08:30",
        start: "21:30",
        timezone: "Asia/Hong_Kong"
      }
    });
    expect(plan.evaluation_plan).toMatchObject({
      announcement_alert: {
        live_tool_execution: false,
        source_tool: "search_announcements",
        status: "planned_no_write"
      },
      metric_alert: {
        live_tool_execution: false,
        metric_ids: ["net_margin", "return_on_equity"],
        source_tool: "get_financial_ratios",
        status: "planned_no_write"
      },
      price_alert: {
        condition: {
          comparator: "changed_by_percent",
          field: "close",
          threshold: 5
        },
        live_tool_execution: false,
        source_tool: "get_quote_snapshot",
        status: "planned_no_write"
      }
    });
    expect(plan.notification).toEqual({
      channels: ["in_app", "email"],
      evidence_required: true,
      event_queue: "AIPHABEE_EVENTS_QUEUE",
      fanout_status: "planned_no_write",
      notification_write_status: "planned_no_write"
    });
    expect(plan.persistence_plan).toEqual({
      live_db_writes: false,
      queue_writes: false,
      sql_emitted: false,
      tables: [
        "core.watchlist",
        "core.watchlist_item",
        "core.watchlist_alert_rule",
        "core.watchlist_alert_event"
      ],
      write_status: "planned_no_write"
    });
    expect(plan.validation).toEqual({
      explicit_confirmation_provided: true,
      explicit_confirmation_required: true,
      idempotency_key_required: true,
      required_context_present: true,
      scope_required: "alerts.write"
    });
    expect(plan.usage).toEqual({
      cached: false,
      credits: 0,
      rows: 6
    });
  });

  it("requires explicit confirmation before planning alert writes", () => {
    const plan = createWatchlistAlertsPlan({
      alertKinds: ["price"],
      idempotencyKey: "alert-idem-no-confirmation",
      requestId: "req-watchlist-alerts-no-confirmation",
      securityQuery: "00700.HK",
      userId: "user_internal_alpha",
      workspaceId: "workspace_research"
    });

    expect(plan.status).toBe("confirmation_required");
    expect(plan.alert_rule.write_status).toBe("blocked");
    expect(plan.persistence_plan.write_status).toBe("blocked");
    expect(plan.validation.explicit_confirmation_provided).toBe(false);
  });

  it("blocks missing workspace or security context", () => {
    const plan = createWatchlistAlertsPlan({
      explicitConfirmation: true,
      requestId: "req-watchlist-alerts-missing-context"
    });

    expect(plan.status).toBe("blocked_missing_context");
    expect(plan.validation.required_context_present).toBe(false);
    expect(plan.alert_rule.write_status).toBe("blocked");
  });

  it("plans daily and weekly briefings with material change filters", () => {
    const plan = createWatchlistBriefingPlan({
      asOf: "2026-06-21T08:00:00+08:00",
      cadence: "weekly",
      channels: ["in_app", "email"],
      maxItems: 8,
      minMaterialityScore: 0.7,
      requestId: "req-watchlist-briefing",
      timezone: "Asia/Hong_Kong",
      userId: "user_internal_alpha",
      watchlistId: "watchlist_alpha_hk",
      workspaceId: "workspace_research"
    });

    expect(plan).toMatchObject({
      as_of: "2026-06-21T08:00:00+08:00",
      channels: ["in_app", "email"],
      frontend: false,
      live_tool_execution: false,
      request_id: "req-watchlist-briefing",
      sql_emitted: false,
      status: "planned_no_write",
      timezone: "Asia/Hong_Kong",
      toolName: "plan_watchlist_briefing"
    });
    expect(plan.briefing).toMatchObject({
      cadence: "weekly",
      max_items: 8,
      material_changes_only: true,
      status: "planned_no_write",
      table: "core.watchlist_briefing",
      watchlist_id: "watchlist_alpha_hk",
      write_status: "planned_no_write"
    });
    expect(plan.materiality_filter).toEqual({
      empty_briefing_policy: "suppress_no_material_changes",
      min_materiality_score: 0.7,
      only_substantive_changes: true
    });
    expect(plan.source_plan).toEqual({
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
    });
    expect(plan.evidence_index).toEqual({
      evidence_required: true,
      item_table: "core.watchlist_briefing_item",
      source_record_id_required: true
    });
    expect(plan.notification).toEqual({
      channels: ["in_app", "email"],
      evidence_required: true,
      event_queue: "AIPHABEE_EVENTS_QUEUE",
      fanout_status: "planned_no_write"
    });
    expect(plan.persistence_plan).toEqual({
      live_db_writes: false,
      queue_writes: false,
      sql_emitted: false,
      tables: ["core.watchlist_briefing", "core.watchlist_briefing_item"],
      write_status: "planned_no_write"
    });
    expect(plan.usage).toEqual({
      cached: false,
      credits: 0,
      rows: 8
    });
  });

  it("blocks watchlist briefings without required context", () => {
    const plan = createWatchlistBriefingPlan({
      requestId: "req-watchlist-briefing-missing-context"
    });

    expect(plan.status).toBe("blocked_missing_context");
    expect(plan.briefing.write_status).toBe("blocked");
    expect(plan.persistence_plan.write_status).toBe("blocked");
    expect(plan.usage.rows).toBe(0);
  });
});
