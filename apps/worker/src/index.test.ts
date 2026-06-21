import { describe, expect, it } from "vitest";
import app from "./index";

interface RootRouteBody {
  data: {
    market_data_surfaces: boolean;
    mcp_redistribution_surfaces: boolean;
  };
  ok: true;
  request_id: string;
  usage: {
    credits: number;
  };
}

interface AccountRuntimeBody {
  data: {
    auth_provider_calls: boolean;
    device_management: {
      revoke_supported: boolean;
      status: string;
    };
    forbidden_payloads: string[];
    frontend: boolean;
    login_methods: string[];
    manual_plan_assignment: {
      allowed_plan_codes: string[];
      billing_provider_calls: boolean;
      status: string;
    };
    persistent_writes: boolean;
    route: string;
    runtime_route: string;
    session_management: {
      cookie_issued: boolean;
      revoke_supported: boolean;
      status: string;
    };
    status: string;
    tables: string[];
  };
  ok: true;
}

interface AccountSessionPlanBody {
  data: {
    account: {
      account_id: string;
      email_hash_provided: boolean;
      status: string;
      table: string;
    };
    auth_provider_calls: boolean;
    capability: {
      status: string;
    };
    device: {
      device_binding_status: string;
      device_id: string;
      revoke_supported: boolean;
    };
    manual_plan: {
      assignment_status: string;
      billing_provider_calls: boolean;
      plan_code?: string;
      subscription_id?: string;
    };
    persistent_writes: boolean;
    session: {
      action: string;
      cookie_issued: boolean;
      login_method: string;
      session_id: string;
      session_write_status: string;
    };
    sql_emitted: boolean;
    status: string;
    validation: {
      required_context_present: boolean;
      requires_email_hash_not_raw_email: boolean;
      unsupported_payload_fields: string[];
    };
    workspace: {
      membership_id: string;
      role: string;
      workspace_id: string;
      workspace_status: string;
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface UsageRuntimeBody {
  data: {
    billing_provider_reconciliation: boolean;
    channels: string[];
    display_fields: string[];
    freshness_target_minutes: number;
    live_ledger_reads: boolean;
    persistent_writes: boolean;
    plan_codes: string[];
    request_id_visible: boolean;
    route: string;
    runtime_route: string;
    sql_emitted: boolean;
    status: string;
  };
  ok: true;
}

interface UsageQuotaPlanBody {
  data: {
    billing_traceability: {
      billing_provider_reconciliation: boolean;
      live_invoice_link: boolean;
      source: string;
    };
    capability: {
      status: string;
    };
    channel: string;
    display_fields: string[];
    freshness_target_minutes: number;
    live_ledger_reads: boolean;
    persistent_writes: boolean;
    period: {
      period_end: string;
      period_start: string;
    };
    quota: {
      credit_limit: number;
      credits_pending: number;
      credits_remaining: number;
      credits_used: number;
      over_quota: boolean;
      plan_code: string;
    };
    request_id: string;
    request_id_visible: boolean;
    sql_emitted: boolean;
    status: string;
    usage_snapshot_source: string;
    workspace_id: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface WorkbenchRuntimeBody {
  data: {
    actual_tool_execution: boolean;
    frontend_rendering: boolean;
    live_data_access: boolean;
    route: string;
    runtime_route: string;
    sections: string[];
    sql_emitted: boolean;
    status: string;
    unsupported_sections: {
      full_announcement_document_search: string;
    };
  };
  ok: true;
}

interface AnalyticsRuntimeBody {
  data: {
    compare_securities: {
      max_securities: number;
      min_securities: number;
      route: string;
      status: string;
      tool_name: string;
    };
    financial_ratios: {
      formula_version: string;
      route: string;
      status: string;
      tool_name: string;
    };
    returns_risk: {
      formula_version: string;
      golden_tolerance: number;
      route: string;
      status: string;
      tool_name: string;
    };
    screen_securities: {
      editable_conditions: boolean;
      preview_execution: boolean;
      route: string;
      status: string;
      tool_name: string;
    };
    frontend_rendering: boolean;
    live_data_access: boolean;
    route: string;
    status: string;
  };
  ok: true;
}

interface ReturnsRiskBody {
  data: {
    benchmark_history_status?: string;
    benchmark_instrument_id?: string;
    capability: {
      formula_version: string;
      route: string;
      status: string;
    };
    frontend_rendering: boolean;
    instrument_id?: string;
    live_data_access: boolean;
    metrics: Array<{
      blocked_reason?: string;
      metric_id: string;
      status: string;
      tolerance: number;
      value?: number;
    }>;
    price_history_status: string;
    status: string;
    toolName: string;
    window: {
      annualization_factor: number;
      beta_method: string;
      row_count: number;
      volatility_method: string;
    };
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface FinancialRatiosBody {
  data: {
    capability: {
      formula_version: string;
      route: string;
      status: string;
    };
    facts_status: string;
    frontend_rendering: boolean;
    instrument_id?: string;
    live_data_access: boolean;
    percentile_methodology: {
      live_peer_constituents: boolean;
      method: string;
      point_in_time: boolean;
    };
    ratios: Array<{
      blocked_reason?: string;
      formula_version: string;
      metric_id: string;
      percentile?: {
        peer_set_id: string;
        percentile_rank: number;
        sample_count: number;
      };
      status: string;
      value?: number;
    }>;
    status: string;
    toolName: string;
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface ScreenSecuritiesBody {
  data: {
    capability: {
      editable_conditions: boolean;
      preview_execution: boolean;
      route: string;
      status: string;
    };
    editable_before_execution: boolean;
    execution_preview: {
      hit_count: number;
      hits: Array<{
        matched_conditions: string[];
        rank: number;
        score: number;
        symbol?: string;
        why: string[];
      }>;
      rejected_rows: Array<{
        reasons: string[];
        symbol?: string;
      }>;
      universe_size: number;
    };
    frontend_rendering: boolean;
    live_data_access: boolean;
    parsed_conditions: Array<{
      editable: boolean;
      field: string;
      missing_value_rule: string;
      operator: string;
      value: number;
    }>;
    requires_confirmation_before_live_execution: boolean;
    status: string;
    toolName: string;
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface CompareSecuritiesBody {
  data: {
    capability: {
      route: string;
      status: string;
    };
    frontend_rendering: boolean;
    live_data_access: boolean;
    row_count: number;
    rows: Array<{
      financials: Record<string, number>;
      instrument_id?: string;
      missing_metrics: string[];
      quality_flags: string[];
      status: string;
      symbol?: string;
    }>;
    status: string;
    toolName: string;
    unified_comparison: {
      base_currency?: string;
      base_unit?: string;
      currency_conversion: string;
      incomparable_reasons: string[];
    };
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface WorkbenchAnnouncementSearchBody {
  data: {
    announcements: Array<{
      category: string;
      evidence_locator: {
        anchor: string;
        external_href_authority: boolean;
        locator_type: string;
        original_url: string;
        page: number;
      };
      source_record_id: string;
      title: string;
    }>;
    capability: {
      evidence_locator_ready: boolean;
      original_document_fetch: boolean;
    };
    evidence_locator_ready: boolean;
    instrument_id?: string;
    live_data_access: boolean;
    original_document_fetch: boolean;
    row_count: number;
    status: string;
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface WorkbenchStockSnapshotBody {
  data: {
    announcement_search: {
      announcements: Array<{
        category: string;
        evidence_locator: {
          external_href_authority: boolean;
          locator_type: string;
          page: number;
        };
        source_record_id: string;
      }>;
      row_count: number;
      status: string;
    };
    actual_tool_execution: boolean;
    capability: {
      status: string;
    };
    corporate_actions: {
      status: string;
      timeline?: {
        rowCount: number;
      };
    };
    data_quality: {
      blocking_statuses: string[];
      section_statuses: Record<string, string>;
    };
    evidence: {
      provenance_count: number;
      source_record_ids: string[];
    };
    derived_metrics: {
      definitions: Array<{
        formula: string;
        formula_version: string;
        metric_id: string;
      }>;
      metrics: Array<{
        blocked_reason?: string;
        category: string;
        metric_id: string;
        status: string;
        value?: number;
      }>;
      status: string;
    };
    financial_facts: {
      facts?: {
        rowCount: number;
      };
      status: string;
    };
    frontend_rendering: boolean;
    instrument_id?: string;
    live_data_access: boolean;
    price_history: {
      history?: {
        adjustment: string;
        rowCount: number;
      };
      status: string;
    };
    quote_snapshot: {
      quote?: {
        symbol: string;
      };
      status: string;
    };
    resolve_security?: {
      status: string;
    };
    security_profile: {
      profile?: {
        instrumentId: string;
        symbol: string;
      };
      status: string;
    };
    sql_emitted: boolean;
    status: string;
    unsupported_sections: {
      full_announcement_document_search: string;
    };
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface AgentRuntimeBody {
  data: {
    ai_sdk: {
      stop_condition: string;
      target_version: string;
    };
    run_context: {
      context_ready: boolean;
      entitlement_policy_source: string;
      live_entitlement_reads: boolean;
      status: string;
      tool_versions: boolean;
    };
    pre_tool_call_resolution: {
      actual_tool_execution: boolean;
      clarification_supported: boolean;
      model_calls: boolean;
      required_dimensions: string[];
      status: string;
    };
    tool_loop_agent: {
      actual_tool_execution: boolean;
      budget_stop_policy: {
        graceful_stop: boolean;
        returns_continue_cost: boolean;
        status: string;
      };
      chain_of_thought_exposed: boolean;
      max_parallel_tools: number;
      model_calls: boolean;
      failure_recovery_policy: {
        no_double_charge: boolean;
        partial_retry: boolean;
        retry_billable: boolean;
        status: string;
      };
      model_routing_audit: {
        ai_gateway_provider: string;
        audit_required: boolean;
        fallback: string;
        live_model_routing: boolean;
        model_calls: boolean;
        records_model_change: boolean;
        status: string;
      };
      answer_evidence_contract: {
        evidence_card_payload: string;
        frontend_rendering: boolean;
        ordered_sections: string[];
        required_claim_labels: string[];
        status: string;
      };
      numeric_source_guard: {
        allowed_sources: string[];
        concrete_numbers_allowed_without_sources: boolean;
        memory_numbers_allowed: boolean;
        post_generation_validation: string;
        status: string;
      };
      planner_ready: boolean;
      status: string;
      tool_enforcement: {
        allow_arbitrary_sql: boolean;
        allow_arbitrary_url: boolean;
        denied_tool_behavior: string;
        permission_aware: boolean;
        registered_tools_only: boolean;
        schema_bound: boolean;
        status: string;
        versioned_tools: boolean;
      };
      streaming_transport: string;
    };
    registered_tools: Array<{
      name: string;
      schema: {
        standardResponseEnvelope: boolean;
      };
    }>;
    surfaces: {
      market_data: boolean;
      mcp_redistribution: boolean;
      model_calls: boolean;
    };
  };
  ok: true;
}

interface ToolRuntimeBody {
  data: {
    allow_arbitrary_sql: boolean;
    allow_arbitrary_url: boolean;
    execution_ready: boolean;
    golden_fixtures_ready: boolean;
    handler_ready_tool_count: number;
    registry_status: string;
    rights_aware: boolean;
    schema_ready: boolean;
    standard_response_envelope: boolean;
    status: string;
    tool_count: number;
    tools: Array<{
      execution: {
        handlerReady: boolean;
        liveDataAccess: boolean;
      };
      name: string;
      permissions: {
        rightsAware: boolean;
      };
      schema: {
        standardResponseEnvelope: boolean;
      };
    }>;
  };
  ok: true;
}

interface ResolveSecurityBody {
  data: {
    capability: {
      handler_ready: boolean;
      live_data_access: boolean;
      no_silent_guessing: boolean;
      status: string;
    };
    candidates: Array<{
      instrumentId: string;
      market: string;
      status: string;
      symbol: string;
    }>;
    liveDataAccess: boolean;
    selectedInstrumentId?: string;
    status: string;
    toolName: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface SecurityProfileBody {
  data: {
    capability: {
      coverage_metadata: boolean;
      handler_ready: boolean;
      live_data_access: boolean;
      status: string;
    };
    liveDataAccess: boolean;
    profile: {
      coverage: {
        profile: {
          status: string;
        };
        quoteSnapshot: {
          status: string;
        };
      };
      currency: string;
      listingStatus: string;
      market: string;
      symbol: string;
    };
    status: string;
    toolName: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface MarketCalendarBody {
  data: {
    capability: {
      handler_ready: boolean;
      live_data_access: boolean;
      status: string;
      supported_session_statuses: string[];
      timezone: string;
    };
    liveDataAccess: boolean;
    sessions: Array<{
      closureReason?: string;
      date: string;
      isTradingDay: boolean;
      sessionStatus: string;
    }>;
    status: string;
    timezone: string;
    toolName: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface QuoteSnapshotBody {
  data: {
    capability: {
      delay_metadata: boolean;
      handler_ready: boolean;
      live_data_access: boolean;
      status: string;
      supported_modes: string[];
    };
    liveDataAccess: boolean;
    mode: string;
    quote: {
      currency: string;
      delay: {
        minutes: number;
        type: string;
      };
      fields: Record<string, number>;
      instrumentId: string;
      marketStatus: string;
      qualityState: string;
      symbol: string;
    };
    requestedFields: string[];
    status: string;
    toolName: string;
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface PriceHistoryBody {
  data: {
    capability: {
      adjustment_methodology: boolean;
      cursor_pagination: boolean;
      handler_ready: boolean;
      live_data_access: boolean;
      status: string;
      supported_adjustments: string[];
    };
    adjustment: string;
    history: {
      adjustment: string;
      adjustmentMethodology: {
        dividendReinvestment: boolean;
        priceBasis: string;
      };
      nextCursor?: string;
      qualityState: string;
      rowCount: number;
      rows: Array<{
        date: string;
        fields: Record<string, number>;
      }>;
      symbol: string;
      totalRows: number;
    };
    liveDataAccess: boolean;
    requestedFields: string[];
    status: string;
    toolName: string;
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface CorporateActionsBody {
  data: {
    capability: {
      adjustment_impact_metadata: boolean;
      cursor_pagination: boolean;
      handler_ready: boolean;
      live_data_access: boolean;
      status: string;
      supported_action_types: string[];
    };
    liveDataAccess: boolean;
    requestedTypes: string[];
    status: string;
    timeline: {
      actions: Array<{
        actionType: string;
        adjustmentImpact: {
          affectsSplitAdjusted: boolean;
          affectsTotalReturnAdjusted: boolean;
        };
        effectiveDate: string;
        terms: Record<string, number | string>;
      }>;
      nextCursor?: string;
      qualityState: string;
      rowCount: number;
      symbol: string;
      totalRows: number;
    };
    toolName: string;
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface FinancialFactsBody {
  data: {
    capability: {
      currency_unit_metadata: boolean;
      handler_ready: boolean;
      live_data_access: boolean;
      point_in_time_selection: boolean;
      restatement_versions: boolean;
      status: string;
      supported_statement_types: string[];
    };
    facts: {
      accountingStandard: string;
      currency: string;
      facts: Array<{
        metricId: string;
        periodEnd: string;
        restatementVersion: number;
        unit: string;
        value: number;
        versionStatus: string;
      }>;
      nextCursor?: string;
      qualityState: string;
      rowCount: number;
      symbol: string;
      totalRows: number;
      unit: string;
    };
    liveDataAccess: boolean;
    requestedMetrics: string[];
    requestedStatementTypes: string[];
    status: string;
    toolName: string;
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface DataLineageBody {
  data: {
    capability: {
      handler_ready: boolean;
      live_data_access: boolean;
      source_record_lookup: boolean;
      status: string;
    };
    lineage: {
      dataVersion: string;
      dataset: string;
      formula?: string;
      recordId: string;
      sourceBatchId: string;
      sourceRecordId: string;
      toolName: string;
      upstream: Array<{
        dataset: string;
        recordId: string;
      }>;
      version: number;
    };
    liveDataAccess: boolean;
    status: string;
    toolName: string;
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface EntitlementsBody {
  data: {
    capability: {
      gateway_policy_compiler: boolean;
      handler_ready: boolean;
      live_data_access: boolean;
      status: string;
    };
    decision?: {
      allowedFields: string[];
      deniedFields: Array<{
        field: string;
        reason: string;
      }>;
      status: string;
    };
    entitlements: {
      allowedFields: string[];
      datasets: string[];
      deniedFields: Array<{
        field: string;
        reason: string;
      }>;
      limitationCodes: string[];
      tools: string[];
    };
    liveDataAccess: boolean;
    policySource: {
      liveDbReads: boolean;
      partnerRightsMatrixLoaded: boolean;
      sqlEmitted: boolean;
      status: string;
    };
    status: string;
    toolName: string;
    workspaceId: string;
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface EvidenceRuntimeBody {
  data: {
    citation_planner: boolean;
    durable_schema_ready: boolean;
    live_db_writes: boolean;
    source_record_linking: boolean;
    status: string;
    tables: string[];
    tool_call_linking: boolean;
    user_visible_citations: boolean;
  };
  ok: true;
}

interface EvidenceRecordPlanBody {
  data: {
    citation: {
      label: string;
      sourceRecordIds: string[];
      visibility: string;
    };
    evidenceRecord: {
      evidenceRecordId: string;
      outputSchemaId?: string;
      requestId: string;
      rightsState: string;
      toolName: string;
    };
    liveDbWrites: boolean;
    sourceRefs: Array<{
      evidenceRecordId: string;
      sourceRecordId: string;
    }>;
    sqlEmitted: boolean;
    status: string;
    tables: string[];
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface DatabaseRuntimeBody {
  data: {
    connection_path: string;
    hyperdrive: {
      binding_configured: boolean;
      binding_name: string;
      status: string;
    };
    live_queries: boolean;
    market_data_surfaces: boolean;
    migration_directory: string;
    provider: string;
  };
  ok: true;
}

interface GatewayRuntimeBody {
  data: {
    account_workspace_entitlements: {
      live_enforcement: boolean;
      status: string;
      tables: string[];
      workspace_isolation: boolean;
    };
    channels: Record<string, string>;
    contract: string;
    default_rights_status: string;
    error_codes: string[];
    field_entitlement_enforcement: {
      dimensions: string[];
      live_policy_source: boolean;
      policy_source: {
        compiles_to_gateway_policy: boolean;
        default_rights_status: string;
        live_db_reads: boolean;
        partner_rights_matrix_loaded: boolean;
        sql_emitted: boolean;
        status: string;
      };
      status: string;
      workspace_isolation: boolean;
    };
    guards: string[];
    limits: {
      max_rows: number;
      max_window_days: number;
    };
    live_data_access: boolean;
    market_data_surfaces: boolean;
    mcp_redistribution_surfaces: boolean;
    rights_policy_version: string;
    serving_result_envelope: {
      envelope_fields: readonly string[];
      live_data_access: boolean;
      market_status: string;
      rows_returned: boolean;
      shared_envelope: boolean;
      status: string;
    };
    serving_store: {
      execution_adapter: {
        adapter: string;
        blocks_blocked_sql_text: boolean;
        execution_ready: boolean;
        live_reads: boolean;
        returns_empty_rows: boolean;
        rows_returned: boolean;
        sql_executed: boolean;
        status: string;
      };
      live_reads: boolean;
      quality_release: {
        blocks_quality_states: readonly string[];
        gateway_error_code: string;
        live_reads: boolean;
        live_writes: boolean;
        release_states: readonly string[];
        released_quality_states: readonly string[];
        sql_emitted: boolean;
        status: string;
        uses_quality_state: boolean;
        warn_quality_states: readonly string[];
      };
      query_planner: {
        blocks_unreleased_snapshots: boolean;
        live_reads: boolean;
        requires_release_state: string;
        sql_emitted: boolean;
        status: string;
        uses_release_state: boolean;
        uses_row_limit: boolean;
      };
      read_planner: {
        blocks_default_deny: boolean;
        blocks_quality_hold: boolean;
        live_reads: boolean;
        release_state_default: string;
        sql_emitted: boolean;
        status: string;
        uses_quality_state: boolean;
        uses_versioned_snapshots: boolean;
      };
      release_state_default: string;
      sql_descriptor: {
        blocks_unplanned_queries: boolean;
        execution_ready: boolean;
        live_reads: boolean;
        parameterized_bindings: boolean;
        sql_emitted: boolean;
        sql_text_emitted: boolean;
        status: string;
        uses_allowed_field_set: boolean;
        uses_row_limit: boolean;
        uses_snapshot_binding: boolean;
      };
      sql_text_compiler: {
        execution_ready: boolean;
        live_reads: boolean;
        sql_executed: boolean;
        sql_text_emitted: boolean;
        status: string;
        template_source: string;
        uses_parameterized_bindings: boolean;
      };
      status: string;
      tables: string[];
      uses_quality_state: boolean;
      uses_versioned_snapshots: boolean;
    };
    usage_ledger: {
      event_writer: {
        live_billing_reconciliation: boolean;
        live_writes: boolean;
        reconciliation_target_delay_minutes: number;
        sql_emitted: boolean;
        status: string;
        usage_event_grain: string;
        weighted_credits: boolean;
      };
      live_writes: boolean;
      reconciliation_target_delay_minutes: number;
      status: string;
      tables: string[];
      weighted_credits: boolean;
    };
  };
  ok: true;
}

interface DataRuntimeBody {
  data: {
    account_workspace: {
      default_entitlement_status: string;
      live_enforcement: boolean;
      status: string;
      tables: string[];
      workspace_isolation: boolean;
    };
    corporate_actions: {
      adjustment_types: string[];
      closed_open_intervals: boolean;
      engine: {
        direction: string;
        golden_cases: {
          passed: boolean;
          sample_count: number;
        };
        live_partner_data: boolean;
        status: string;
        supported_action_types: readonly string[];
        supported_adjustment_types: readonly string[];
      };
      live_actions: boolean;
      quality_default_state: string;
      status: string;
      tables: string[];
    };
    data_version_batches: {
      live_batches: boolean;
      table: string;
    };
    default_rights_status: string;
    financial_facts: {
      engine: {
        golden_cases: {
          passed: boolean;
          sample_count: number;
        };
        live_partner_data: boolean;
        point_in_time_selection: boolean;
        preserve_prior_versions: boolean;
        status: string;
        supported_statement_types: readonly string[];
      };
      live_facts: boolean;
      quality_default_state: string;
      restatement_versions: boolean;
      status: string;
      tables: string[];
    };
    live_queries: boolean;
    market_data_loaded: boolean;
    raw_snapshots: {
      immutable: boolean;
      quality_default_state: string;
      table: string;
    };
    security_master: {
      status: string;
      tables: string[];
    };
    serving_store: {
      cache_key_material: string[];
      default_quality_state: string;
      default_rights_status: string;
      live_serving_reads: boolean;
      quality_release: {
        blocks_quality_states: readonly string[];
        gateway_error_code: string;
        live_reads: boolean;
        live_writes: boolean;
        release_states: readonly string[];
        released_quality_states: readonly string[];
        sql_emitted: boolean;
        status: string;
        uses_quality_state: boolean;
        warn_quality_states: readonly string[];
      };
      release_state_default: string;
      status: string;
      tables: string[];
    };
    source_batches: {
      rights_default_state: string;
      table: string;
    };
  };
  ok: true;
}

interface SecretsRuntimeBody {
  data: {
    emergency_revocation_sla_minutes: number;
    provider_stores: Array<{
      name: string;
      status: string;
    }>;
    rotation_cadence_days: number;
    secret_values_available: boolean;
    store_contract: string;
  };
  ok: true;
}

interface ModelProviderBody {
  data: {
    ai_gateway: {
      provider: string;
      status: string;
      unified_billing: boolean;
    };
    ai_sdk: {
      execution_apis: string[];
      stop_condition: string;
      target_version: string;
    };
    execution_modes: Array<{
      model_calls: boolean;
      name: string;
      status: string;
    }>;
    model_calls_enabled: boolean;
    provider_contract: string;
    streaming_enabled: boolean;
  };
  ok: true;
}

interface ObservabilityRuntimeBody {
  data: {
    eval_store: {
      binding_configured: boolean;
      binding_name: string;
      binding_type: string;
      persistent: boolean;
      status: string;
      writes_enabled: boolean;
    };
    eval_v1: {
      event_type: string;
      live_persistent_writes: boolean;
      metrics: Array<{
        metric_id: string;
        source: string;
        status: string;
      }>;
      status: string;
      unsourced_numeric_claim_target_rate: number;
      version: string;
      wvro: {
        definition_source: string;
        high_intent_actions: string[];
        required_criteria: string[];
      };
    };
    event_types: string[];
    forbidden_payloads: string[];
    otlp_destination: {
      endpoint_configured: boolean;
      headers_configured: boolean;
      live_export_enabled: boolean;
      required_env: string[];
      status: string;
    };
    sinks: Array<{
      live_export_enabled: boolean;
      name: string;
      status: string;
    }>;
  };
  ok: true;
}

interface EvalV1PlanBody {
  data: {
    capability: {
      status: string;
    };
    live_persistent_writes: boolean;
    quality_metrics: Array<{
      metric_id: string;
      passed: number;
      rate: number | null;
      status: string;
      total: number;
    }>;
    status: string;
    unsourced_numeric_claims: {
      observed_rate: number | null;
      status: string;
      target_rate: number;
    };
    version: string;
    wvro: {
      criteria: Array<{
        criterion_id: string;
        status: string;
      }>;
      definition_source: string;
      eligible: boolean;
      high_intent_actions: string[];
      week_start: string;
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface AgentDryRunBody {
  data: {
    budget: {
      max_credits: number;
      max_rows: number;
      max_steps: number;
      max_tokens: number;
    };
    request_id: string;
    run_context: {
      channel: string;
      entitlements: {
        data_rights_state: string;
        live_policy_source: boolean;
        policy_version: string;
        required_scopes: string[];
      };
      model: {
        model_calls: boolean;
        tier: string;
      };
      subscription: {
        plan: string;
      };
      toolset: {
        tools: Array<{
          input_schema_id: string;
          name: string;
          output_schema_id: string;
          version: string;
        }>;
      };
      user: {
        source: string;
        user_id: string;
      };
      workspace: {
        source: string;
        workspace_id: string;
      };
    };
    status: "dry_run";
    tool_policy: {
      allow_arbitrary_sql: boolean;
      requested_tools: string[];
    };
  };
  ok: true;
}

interface AgentToolLoopPlanBody {
  data: {
    actual_tool_execution: boolean;
    budget_stop_policy: {
      decision: {
        reasons: string[];
        status: string;
        stop_before_step?: number;
      };
      graceful_stop: {
        completed_step_ids: string[];
        existing_evidence_record_ids: string[];
        next_step: string;
        partial_response_ready: boolean;
        unfinished_step_ids: string[];
      };
      limit_status: Array<{
        dimension: string;
        estimated: number;
        limit: number;
        status: string;
      }>;
      planned_usage: {
        credits: number;
        rows: number;
        steps: number;
        tokens: number;
        tool_calls: number;
        wall_clock_ms: number;
      };
    };
    chain_of_thought_exposed: boolean;
    max_parallel_tools: number;
    model_calls: boolean;
    failure_recovery_policy: {
      billing: {
        charge_grain: string;
        failed_attempt_billable: boolean;
        idempotency_key_required: boolean;
        no_double_charge: boolean;
        retry_attempt_billable: boolean;
        usage_ledger_write: string;
      };
      error_classes: {
        non_retryable: string[];
        retryable: string[];
        stop_after_consecutive_same_error: number;
      };
      graceful_degradation: {
        evidence_binding_required_for_reused_outputs: boolean;
        failed_tool_claim_label: string;
        partial_answer_allowed: boolean;
        single_tool_failure_does_not_drop_run: boolean;
        user_visible_recovery_state: boolean;
      };
      partial_retry: {
        enabled: boolean;
        max_attempts_per_tool: number;
        preserves_completed_steps: boolean;
        retry_after_supported: boolean;
        retry_billable: boolean;
        retry_scope: string;
        reuse_completed_evidence: boolean;
      };
      planned_step_recovery: Array<{
        local_recovery_action: string;
        phase: string;
        retryable_tool_call_count: number;
        step_id: string;
      }>;
      recovery_state: {
        durable_runtime: string;
        idempotency_key: string;
        persisted: boolean;
        resume_token: string;
        state_store: string;
      };
      status: string;
      validation_rules: string[];
      version: string;
    };
    model_routing_audit: {
      audit_contract: {
        cost_latency_required: boolean;
        product_analytics_separate: boolean;
        prompt_version_required: boolean;
        redact_sensitive_content: boolean;
        required_fields: string[];
      };
      cache_policy: {
        cache_key_material: string[];
        non_sensitive_only: boolean;
        safe_reusable_results_only: boolean;
        user_private_prompt_content_cacheable: boolean;
      };
      fallback_policy: {
        fallback_model_status: string;
        max_fallbacks_per_run: number;
        records_model_change: boolean;
        strategy: string;
        triggers: string[];
      };
      gateway: {
        features: string[];
        gateway_id: string;
        provider: string;
        required_env: string[];
        status: string;
        unified_billing: boolean;
      };
      linked_policy_versions: {
        answer_evidence_contract: string;
        failure_recovery_policy: string;
        numeric_source_guard: string;
      };
      live_model_routing: boolean;
      model_calls: boolean;
      routing_tiers: Array<{
        model_calls: boolean;
        status: string;
        task_layer: string;
        tasks: string[];
      }>;
      run_context_model_tier: string;
      status: string;
      validation_rules: string[];
      version: string;
    };
    answer_evidence_contract: {
      answer_structure: {
        disclaimer_boundary: string;
        key_evidence_items: {
          max: number;
          min: number;
        };
        max_direct_answer_sentences: number;
        max_next_steps: number;
        min_direct_answer_sentences: number;
        ordered_sections: Array<{
          order: number;
          section_id: string;
          source: string;
        }>;
      };
      claim_labels: {
        calculation_requires_calculation_ref: boolean;
        fact_requires_evidence_card: boolean;
        inference_requires_evidence_strength: boolean;
        required_labels: string[];
        text_labels_required: boolean;
        ui_labels_required: boolean;
        unknown_requires_missing_reason: boolean;
      };
      evidence_cards: {
        clickable_payload_contract: boolean;
        frontend_rendering: boolean;
        planned_card_sources: Array<{
          card_type: string;
          output_schema_id: string;
          source_record_required: boolean;
          tool_name: string;
          version: string;
        }>;
        required_fields: string[];
      };
      evidence_strength: {
        allowed_values: string[];
        confidence_score_display: boolean;
      };
      frontend_rendering: boolean;
      model_calls: boolean;
      numeric_source_guard_version: string;
      status: string;
      validation_rules: string[];
      version: string;
    };
    numeric_source_guard: {
      allowed_sources: string[];
      answer_contract: {
        concrete_financial_numbers_allowed: boolean;
        failure_code: string;
        memory_generated_numbers_allowed: boolean;
        requires_calculation_ref: boolean;
        requires_source_record_ref: boolean;
        unsupported_numeric_claim_behavior: string;
        unknown_value_label: string;
      };
      blocked_sources: string[];
      concrete_claims_allowed_now: boolean;
      deterministic_calculations: Array<{
        calculation_id: string;
        input_source: string;
        methodology_version: string;
        required_source_tools: string[];
      }>;
      model_calls: boolean;
      planned_tool_result_sources: Array<{
        data_classes: string[];
        output_schema_id: string;
        source_record_required: boolean;
        tool_name: string;
        version: string;
      }>;
      post_generation_validation: string;
      status: string;
      validation_rules: string[];
      version: string;
    };
    planned_step_count: number;
    pre_tool_call_resolution: {
      clarification_required: boolean;
      security: {
        resolved: Array<{
          instrument_id: string;
          symbol: string;
        }>;
      };
      status: string;
    };
    progress_stream: {
      exposes_chain_of_thought: boolean;
      tool_progress_public: boolean;
      transport: string;
    };
    retry_policy: {
      consecutive_same_error_limit: number;
      max_attempts_per_tool: number;
      retry_billable: boolean;
    };
    run_context: {
      entitlements: {
        data_rights_state: string;
      };
      model: {
        model_calls: boolean;
      };
    };
    status: string;
    steps: Array<{
      phase: string;
      progress_events: string[];
      public_label: string;
      tool_calls: Array<{
        allow_arbitrary_sql: boolean;
        allow_arbitrary_url: boolean;
        data_classes: string[];
        execution: string;
        execution_mode: string;
        handler_ready: boolean;
        input_schema_id: string;
        live_data_access: boolean;
        name: string;
        output_schema_id: string;
        required_scope: string;
        rights_aware: boolean;
        standard_response_envelope: boolean;
        status: string;
        version: string;
      }>;
    }>;
    stop_conditions: string[];
    tool_enforcement: {
      allow_arbitrary_sql: boolean;
      allow_arbitrary_url: boolean;
      all_checks_passed: boolean;
      denied_tools: string[];
      model_calls: boolean;
      permission_aware: boolean;
      registered_tool_count: number;
      registry_version: string;
      requested_tools: string[];
      required_checks: string[];
      schema_bound: boolean;
      status: string;
      tool_checks: Array<{
        allow_arbitrary_sql: boolean;
        allow_arbitrary_url: boolean;
        input_schema_id: string;
        live_data_access: boolean;
        name: string;
        output_schema_id: string;
        permission_scope: string;
        registered: boolean;
        rights_aware: boolean;
        schema_bound: boolean;
        standard_response_envelope: boolean;
        status: string;
        version: string;
        versioned: boolean;
      }>;
      version: string;
      versioned_tools: boolean;
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface AgentPreflightBody {
  data: {
    assumptions: Array<{
      field: string;
      value: string;
    }>;
    clarification_required: boolean;
    clarifications: Array<{
      field: string;
      question: string;
    }>;
    currency: {
      currency: string;
      status: string;
    };
    methodology: {
      price_adjustment: string;
      status: string;
    };
    security: {
      ambiguous_candidates: Array<{
        instrument_id: string;
      }>;
      resolved: Array<{
        instrument_id: string;
        symbol: string;
      }>;
      status: string;
    };
    status: string;
    time: {
      as_of: string;
      status: string;
    };
    tool_readiness: {
      blocked_tools: string[];
      can_plan_tools: boolean;
    };
  };
  ok: true;
}

interface ErrorBody {
  error: {
    code: string;
  };
  ok: false;
}

describe("worker runtime", () => {
  it("serves a no-store health response", async () => {
    const response = await app.request(
      "/health",
      {},
      {
        APP_ENV: "test",
        APP_VERSION: "scaffold"
      }
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      environment: "test",
      market_data_surfaces: false,
      mcp_redistribution_surfaces: false,
      service: "aiphabee-worker",
      status: "ok",
      version: "scaffold"
    });
  });

  it("keeps the root route inside the scaffold-only boundary", async () => {
    const response = await app.request("/", {
      headers: {
        "x-request-id": "req-test"
      }
    });
    const body = (await response.json()) as RootRouteBody;

    expect(body.ok).toBe(true);
    expect(body.request_id).toBe("req-test");
    expect(body.data.market_data_surfaces).toBe(false);
    expect(body.data.mcp_redistribution_surfaces).toBe(false);
    expect(body.usage.credits).toBe(0);
  });

  it("serves account runtime capabilities without auth provider calls", async () => {
    const response = await app.request("/account/runtime", {
      headers: {
        "x-request-id": "req-account-runtime"
      }
    });
    const body = (await response.json()) as AccountRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      auth_provider_calls: false,
      frontend: false,
      persistent_writes: false,
      route: "POST /account/session/plan",
      runtime_route: "GET /account/runtime",
      status: "internal_account_session_manual_plan_scaffold"
    });
    expect(body.data.login_methods).toEqual([
      "email_passwordless",
      "social_google",
      "social_github"
    ]);
    expect(body.data.manual_plan_assignment.allowed_plan_codes).toContain("developer");
    expect(body.data.session_management).toMatchObject({
      cookie_issued: false,
      revoke_supported: true,
      status: "planned_no_write"
    });
    expect(body.data.forbidden_payloads).toContain("password");
  });

  it("plans an internal account session and manual plan without writes", async () => {
    const response = await app.request("/account/session/plan", {
      body: JSON.stringify({
        account_id: "acct_internal_001",
        device_id: "device_macbook_001",
        email_hash: "sha256:internal-user-hash",
        login_method: "email_passwordless",
        plan_code: "developer",
        role: "owner",
        session_id: "sess_internal_001",
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-account-plan"
      },
      method: "POST"
    });
    const body = (await response.json()) as AccountSessionPlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      auth_provider_calls: false,
      persistent_writes: false,
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(body.data.account).toMatchObject({
      account_id: "acct_internal_001",
      email_hash_provided: true,
      table: "core.account"
    });
    expect(body.data.session).toMatchObject({
      cookie_issued: false,
      login_method: "email_passwordless",
      session_id: "sess_internal_001",
      session_write_status: "planned_no_write"
    });
    expect(body.data.manual_plan).toMatchObject({
      assignment_status: "planned_no_write",
      billing_provider_calls: false,
      plan_code: "developer",
      subscription_id: "sub_ws_internal_alpha_developer"
    });
    expect(body.data.validation.unsupported_payload_fields).toContain("raw_email");
    expect(body.usage.rows).toBe(1);
  });

  it("serves usage quota display capabilities without live ledger reads", async () => {
    const response = await app.request("/usage/runtime", {
      headers: {
        "x-request-id": "req-usage-runtime"
      }
    });
    const body = (await response.json()) as UsageRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      billing_provider_reconciliation: false,
      freshness_target_minutes: 5,
      live_ledger_reads: false,
      persistent_writes: false,
      request_id_visible: true,
      route: "POST /usage/quota/plan",
      runtime_route: "GET /usage/runtime",
      sql_emitted: false,
      status: "usage_quota_display_scaffold"
    });
    expect(body.data.channels).toEqual(["web_agent", "mcp"]);
    expect(body.data.plan_codes).toContain("developer");
    expect(body.data.display_fields).toContain("credits_remaining");
  });

  it("plans Web/MCP quota display values without reads or writes", async () => {
    const response = await app.request("/usage/quota/plan", {
      body: JSON.stringify({
        account_id: "acct_internal_001",
        channel: "mcp",
        pending_credits: 10,
        plan_code: "developer",
        used_credits: 240,
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-usage-quota"
      },
      method: "POST"
    });
    const body = (await response.json()) as UsageQuotaPlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      channel: "mcp",
      freshness_target_minutes: 5,
      live_ledger_reads: false,
      persistent_writes: false,
      request_id: "req-usage-quota",
      request_id_visible: true,
      sql_emitted: false,
      status: "planned_no_write",
      usage_snapshot_source: "synthetic_quota_snapshot",
      workspace_id: "ws_internal_alpha"
    });
    expect(body.data.quota).toEqual({
      credit_limit: 10000,
      credits_pending: 10,
      credits_remaining: 9750,
      credits_used: 240,
      over_quota: false,
      plan_code: "developer"
    });
    expect(body.usage.rows).toBe(1);
  });

  it("serves analytics tool capabilities without frontend or live data", async () => {
    const response = await app.request("/analytics/runtime", {
      headers: {
        "x-request-id": "req-analytics-runtime"
      }
    });
    const body = (await response.json()) as AnalyticsRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend_rendering: false,
      live_data_access: false,
      route: "POST /analytics/compare-securities",
      status: "analytics_tools_scaffold"
    });
    expect(body.data.compare_securities).toMatchObject({
      max_securities: 5,
      min_securities: 2,
      route: "POST /analytics/compare-securities",
      status: "compare_securities_scaffold",
      tool_name: "compare_securities"
    });
    expect(body.data.financial_ratios).toMatchObject({
      formula_version: "financial-ratios-v0",
      route: "POST /analytics/financial-ratios",
      status: "financial_ratios_scaffold",
      tool_name: "get_financial_ratios"
    });
    expect(body.data.returns_risk).toMatchObject({
      formula_version: "returns-risk-v0",
      golden_tolerance: 0.000001,
      route: "POST /analytics/returns-risk",
      status: "returns_risk_scaffold",
      tool_name: "calculate_returns_risk"
    });
    expect(body.data.screen_securities).toMatchObject({
      editable_conditions: true,
      preview_execution: true,
      route: "POST /analytics/screen-securities",
      status: "screen_securities_scaffold",
      tool_name: "screen_securities"
    });
  });

  it("computes financial ratios with formula version and percentile scaffold", async () => {
    const response = await app.request("/analytics/financial-ratios", {
      body: JSON.stringify({
        security_query: "00700.HK"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-financial-ratios"
      },
      method: "POST"
    });
    const body = (await response.json()) as FinancialRatiosBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      facts_status: "found",
      frontend_rendering: false,
      instrument_id: "eq_hk_00700",
      live_data_access: false,
      status: "computed",
      toolName: "get_financial_ratios"
    });
    expect(body.data.ratios.map((ratio) => [ratio.metric_id, ratio.status, ratio.value])).toEqual([
      ["net_margin", "computed", 0.189184],
      ["return_on_assets", "computed", 0.073386],
      ["return_on_equity", "computed", 0.13915],
      ["asset_turnover", "computed", 0.387908],
      ["equity_multiplier", "computed", 1.896135]
    ]);
    expect(body.data.ratios[0]?.percentile).toEqual({
      peer_set_id: "synthetic_hk_large_mid_cap_v0",
      percentile_rank: 0.8,
      sample_count: 5
    });
    expect(body.data.percentile_methodology).toMatchObject({
      live_peer_constituents: false,
      method: "synthetic_peer_distribution_rank",
      point_in_time: true
    });
    expect(body.data.capability).toMatchObject({
      formula_version: "financial-ratios-v0",
      route: "POST /analytics/financial-ratios"
    });
    expect(body.usage.rows).toBeGreaterThan(0);
  });

  it("computes returns/risk metrics with benchmark beta", async () => {
    const response = await app.request("/analytics/returns-risk", {
      body: JSON.stringify({
        benchmark_security_query: "00700.HK",
        security_query: "00700.HK"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-returns-risk"
      },
      method: "POST"
    });
    const body = (await response.json()) as ReturnsRiskBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      benchmark_history_status: "found",
      benchmark_instrument_id: "eq_hk_00700",
      frontend_rendering: false,
      instrument_id: "eq_hk_00700",
      live_data_access: false,
      price_history_status: "found",
      status: "computed",
      toolName: "calculate_returns_risk"
    });
    expect(body.data.window).toMatchObject({
      annualization_factor: 252,
      beta_method: "sample_covariance_over_sample_variance",
      row_count: 3,
      volatility_method: "sample_standard_deviation"
    });
    expect(body.data.metrics.map((metric) => [metric.metric_id, metric.status, metric.value])).toEqual([
      ["total_return", "computed", 0.012195],
      ["average_daily_return", "computed", 0.007267],
      ["volatility_daily", "computed", 0.002301],
      ["volatility_annualized", "computed", 0.036523],
      ["max_drawdown", "computed", 0],
      ["beta", "computed", 1]
    ]);
    expect(body.data.capability).toMatchObject({
      formula_version: "returns-risk-v0",
      route: "POST /analytics/returns-risk"
    });
    expect(body.usage.rows).toBeGreaterThan(0);
  });

  it("plans editable screen conditions and explains hits", async () => {
    const response = await app.request("/analytics/screen-securities", {
      body: JSON.stringify({
        natural_language: "revenue above 100000 and profitable"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-screen-securities"
      },
      method: "POST"
    });
    const body = (await response.json()) as ScreenSecuritiesBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      editable_before_execution: true,
      frontend_rendering: false,
      live_data_access: false,
      requires_confirmation_before_live_execution: true,
      status: "planned_with_preview",
      toolName: "screen_securities"
    });
    expect(body.data.parsed_conditions).toEqual([
      expect.objectContaining({
        editable: true,
        field: "revenue",
        missing_value_rule: "exclude",
        operator: "gte",
        value: 100000
      }),
      expect.objectContaining({
        editable: true,
        field: "net_income",
        missing_value_rule: "exclude",
        operator: "gte",
        value: 0
      })
    ]);
    expect(body.data.execution_preview).toMatchObject({
      hit_count: 1,
      universe_size: 3
    });
    expect(body.data.execution_preview.hits[0]).toMatchObject({
      rank: 1,
      score: 2,
      symbol: "00700.HK",
      why: ["matched:revenue_gte_100000", "matched:net_income_gte_0"]
    });
    expect(body.data.execution_preview.rejected_rows.map((row) => row.symbol)).toEqual([
      "08001.HK",
      "00001.HK"
    ]);
    expect(body.data.capability).toMatchObject({
      editable_conditions: true,
      preview_execution: true,
      route: "POST /analytics/screen-securities"
    });
    expect(body.usage.rows).toBeGreaterThan(0);
  });

  it("compares securities and explains incomplete rows", async () => {
    const response = await app.request("/analytics/compare-securities", {
      body: JSON.stringify({
        securities: ["00700.HK", "08001.HK"]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-compare-securities"
      },
      method: "POST"
    });
    const body = (await response.json()) as CompareSecuritiesBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend_rendering: false,
      live_data_access: false,
      row_count: 2,
      status: "partial",
      toolName: "compare_securities"
    });
    expect(body.data.unified_comparison).toMatchObject({
      base_currency: "HKD",
      base_unit: "million",
      currency_conversion: "not_required"
    });
    expect(body.data.rows[0]).toMatchObject({
      financials: {
        assets: 1570000,
        equity: 828000,
        net_income: 115216,
        revenue: 609015
      },
      instrument_id: "eq_hk_00700",
      status: "comparable",
      symbol: "00700.HK"
    });
    expect(body.data.rows[1]).toMatchObject({
      financials: {},
      instrument_id: "eq_hk_08001",
      status: "incomparable",
      symbol: "08001.HK"
    });
    expect(body.data.rows[1]?.missing_metrics).toEqual([
      "revenue",
      "net_income",
      "assets",
      "equity"
    ]);
    expect(body.data.unified_comparison.incomparable_reasons).toContain(
      "08001.HK:financial_facts_data_quality_hold"
    );
    expect(body.usage.rows).toBeGreaterThan(0);
    expect(body.usage.credits).toBeGreaterThan(0);
  });

  it("serves stock workbench aggregate capabilities without frontend rendering", async () => {
    const response = await app.request("/workbench/runtime", {
      headers: {
        "x-request-id": "req-workbench-runtime"
      }
    });
    const body = (await response.json()) as WorkbenchRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      actual_tool_execution: true,
      frontend_rendering: false,
      live_data_access: false,
      route: "POST /workbench/stock/snapshot",
      runtime_route: "GET /workbench/runtime",
      sql_emitted: false,
      status: "stock_workbench_aggregate_scaffold"
    });
    expect(body.data.sections).toEqual([
      "security_profile",
      "quote_snapshot",
      "price_history",
      "financial_facts",
      "derived_metrics",
      "announcement_search",
      "corporate_actions"
    ]);
    expect(body.data.unsupported_sections).toEqual({
      full_announcement_document_search: "phase_2_planned"
    });
  });

  it("aggregates a stock workbench snapshot from existing synthetic tool surfaces", async () => {
    const response = await app.request("/workbench/stock/snapshot", {
      body: JSON.stringify({
        security_query: "00700.HK"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-workbench-snapshot"
      },
      method: "POST"
    });
    const body = (await response.json()) as WorkbenchStockSnapshotBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      actual_tool_execution: true,
      frontend_rendering: false,
      instrument_id: "eq_hk_00700",
      live_data_access: false,
      sql_emitted: false,
      status: "ready"
    });
    expect(body.data.data_quality.section_statuses).toEqual({
      announcement_search: "found",
      corporate_actions: "found",
      derived_metrics: "found",
      financial_facts: "found",
      price_history: "found",
      quote_snapshot: "found",
      security_profile: "found"
    });
    expect(body.data.security_profile.profile).toMatchObject({
      instrumentId: "eq_hk_00700",
      symbol: "00700.HK"
    });
    expect(body.data.quote_snapshot.quote?.symbol).toBe("00700.HK");
    expect(body.data.price_history.history?.adjustment).toBe("total_return_adjusted");
    expect(body.data.financial_facts.facts?.rowCount).toBe(4);
    expect(
      body.data.derived_metrics.metrics
        .filter((metric) => metric.status === "computed")
        .map((metric) => [metric.metric_id, metric.value])
    ).toEqual([
      ["net_margin", 0.189184],
      ["return_on_assets", 0.073386],
      ["return_on_equity", 0.13915],
      ["asset_turnover", 0.387908],
      ["equity_multiplier", 1.896135]
    ]);
    expect(
      body.data.derived_metrics.metrics
        .filter((metric) => metric.category === "valuation")
        .map((metric) => [metric.metric_id, metric.blocked_reason])
    ).toEqual([
      ["price_to_earnings", "market_cap_unavailable"],
      ["price_to_sales", "market_cap_unavailable"],
      ["price_to_book", "market_cap_unavailable"]
    ]);
    expect(body.data.derived_metrics.definitions[0]).toMatchObject({
      formula: "net_income / revenue",
      formula_version: "stock-workbench-derived-metrics-v0",
      metric_id: "net_margin"
    });
    expect(body.data.announcement_search).toMatchObject({
      row_count: 3,
      status: "found"
    });
    expect(body.data.announcement_search.announcements[0]).toMatchObject({
      category: "buyback",
      evidence_locator: {
        external_href_authority: false,
        locator_type: "synthetic_original_locator",
        page: 1
      },
      source_record_id: "src_announcement_00700_20260106_buyback"
    });
    expect(body.data.corporate_actions.timeline?.rowCount).toBe(3);
    expect(body.usage.rows).toBeGreaterThan(0);
    expect(body.usage.credits).toBeGreaterThan(0);
  });

  it("searches stock workbench announcements with source locators", async () => {
    const response = await app.request("/workbench/stock/announcements", {
      body: JSON.stringify({
        categories: ["dividend"],
        keyword: "timetable",
        security_query: "00700.HK"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-workbench-announcements"
      },
      method: "POST"
    });
    const body = (await response.json()) as WorkbenchAnnouncementSearchBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      evidence_locator_ready: true,
      instrument_id: "eq_hk_00700",
      live_data_access: false,
      original_document_fetch: false,
      row_count: 1,
      status: "found"
    });
    expect(body.data.capability).toMatchObject({
      evidence_locator_ready: true,
      original_document_fetch: false
    });
    expect(body.data.announcements[0]).toMatchObject({
      category: "dividend",
      evidence_locator: {
        anchor: "dividend-timetable",
        external_href_authority: false,
        original_url:
          "urn:aiphabee:synthetic:announcement:ann_00700_20260103_dividend#page=2&anchor=dividend-timetable"
      },
      title: "Dividend Timetable Update"
    });
    expect(body.usage.rows).toBe(1);
  });

  it("does not silently choose an ambiguous workbench security", async () => {
    const response = await app.request("/workbench/stock/snapshot", {
      body: JSON.stringify({
        security_query: "ABC"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-workbench-ambiguous"
      },
      method: "POST"
    });
    const body = (await response.json()) as WorkbenchStockSnapshotBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("blocked_resolution");
    expect(body.data.announcement_search.status).toBe("blocked_resolution");
    expect(body.data.resolve_security?.status).toBe("ambiguous");
    expect(body.data.instrument_id).toBeUndefined();
  });

  it("serves agent runtime capabilities without model calls", async () => {
    const response = await app.request("/agent/runtime", {
      headers: {
        "x-request-id": "req-agent-runtime"
      }
    });
    const body = (await response.json()) as AgentRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.ai_sdk.stop_condition).toBe("isStepCount");
    expect(body.data.ai_sdk.target_version).toBe("7.0.0-beta.182");
    expect(body.data.run_context).toMatchObject({
      context_ready: true,
      entitlement_policy_source: "synthetic_default_deny",
      live_entitlement_reads: false,
      status: "agent_run_context_scaffold",
      tool_versions: true
    });
    expect(body.data.pre_tool_call_resolution).toMatchObject({
      actual_tool_execution: false,
      clarification_supported: true,
      model_calls: false,
      required_dimensions: ["security", "time", "currency", "methodology"],
      status: "pre_tool_call_resolution_scaffold"
    });
    expect(body.data.tool_loop_agent).toMatchObject({
      actual_tool_execution: false,
      budget_stop_policy: {
        graceful_stop: true,
        returns_continue_cost: true,
        status: "budget_stop_policy_scaffold"
      },
      chain_of_thought_exposed: false,
      max_parallel_tools: 3,
      model_calls: false,
      failure_recovery_policy: {
        no_double_charge: true,
        partial_retry: true,
        retry_billable: false,
        status: "failure_recovery_policy_scaffold"
      },
      model_routing_audit: {
        ai_gateway_provider: "cloudflare_ai_gateway",
        audit_required: true,
        fallback: "planned",
        live_model_routing: false,
        model_calls: false,
        records_model_change: true,
        status: "model_routing_audit_scaffold"
      },
      answer_evidence_contract: {
        evidence_card_payload: "planned",
        frontend_rendering: false,
        ordered_sections: [
          "direct_answer",
          "data_status",
          "key_evidence",
          "explanation",
          "counter_evidence_risks",
          "sources_methods",
          "next_steps",
          "disclaimer"
        ],
        required_claim_labels: ["fact", "calculation", "inference", "unknown"],
        status: "answer_evidence_contract_scaffold"
      },
      numeric_source_guard: {
        allowed_sources: ["tool_result", "deterministic_calculation"],
        concrete_numbers_allowed_without_sources: false,
        memory_numbers_allowed: false,
        post_generation_validation: "planned",
        status: "numeric_source_guard_scaffold"
      },
      planner_ready: true,
      status: "tool_loop_agent_planner_scaffold",
      tool_enforcement: {
        allow_arbitrary_sql: false,
        allow_arbitrary_url: false,
        denied_tool_behavior: "reject_request",
        permission_aware: true,
        registered_tools_only: true,
        schema_bound: true,
        status: "tool_enforcement_scaffold",
        versioned_tools: true
      },
      streaming_transport: "planned"
    });
    expect(body.data.registered_tools).toHaveLength(9);
    expect(body.data.registered_tools[0]).toMatchObject({
      name: "resolve_security",
      schema: {
        standardResponseEnvelope: true
      }
    });
    expect(body.data.surfaces.model_calls).toBe(false);
    expect(body.data.surfaces.market_data).toBe(false);
    expect(body.data.surfaces.mcp_redistribution).toBe(false);
  });

  it("serves shared tool registry capabilities without tool execution", async () => {
    const response = await app.request("/tools/runtime", {
      headers: {
        "x-request-id": "req-tools-runtime"
      }
    });
    const body = (await response.json()) as ToolRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("shared_tool_registry_scaffold");
    expect(body.data.tool_count).toBe(9);
    expect(body.data.schema_ready).toBe(true);
    expect(body.data.rights_aware).toBe(true);
    expect(body.data.standard_response_envelope).toBe(true);
    expect(body.data.execution_ready).toBe(false);
    expect(body.data.handler_ready_tool_count).toBe(9);
    expect(body.data.allow_arbitrary_sql).toBe(false);
    expect(body.data.allow_arbitrary_url).toBe(false);
    expect(body.data.tools.find((tool) => tool.name === "resolve_security")).toMatchObject({
      execution: {
        handlerReady: true,
        liveDataAccess: false
      },
      permissions: {
        rightsAware: true
      },
      schema: {
        standardResponseEnvelope: true
      }
    });
    expect(
      body.data.tools.find((tool) => tool.name === "get_security_profile")
    ).toMatchObject({
      execution: {
        handlerReady: true,
        liveDataAccess: false
      },
      permissions: {
        rightsAware: true
      },
      schema: {
        standardResponseEnvelope: true
      }
    });
    expect(
      body.data.tools.find((tool) => tool.name === "get_market_calendar")
    ).toMatchObject({
      execution: {
        handlerReady: true,
        liveDataAccess: false
      },
      permissions: {
        rightsAware: true
      },
      schema: {
        standardResponseEnvelope: true
      }
    });
    expect(
      body.data.tools.find((tool) => tool.name === "get_quote_snapshot")
    ).toMatchObject({
      execution: {
        handlerReady: true,
        liveDataAccess: false
      },
      permissions: {
        rightsAware: true
      },
      schema: {
        standardResponseEnvelope: true
      }
    });
    expect(
      body.data.tools.find((tool) => tool.name === "get_price_history")
    ).toMatchObject({
      execution: {
        handlerReady: true,
        liveDataAccess: false
      },
      permissions: {
        rightsAware: true
      },
      schema: {
        standardResponseEnvelope: true
      }
    });
    expect(
      body.data.tools.find((tool) => tool.name === "get_corporate_actions")
    ).toMatchObject({
      execution: {
        handlerReady: true,
        liveDataAccess: false
      },
      permissions: {
        rightsAware: true
      },
      schema: {
        standardResponseEnvelope: true
      }
    });
    expect(
      body.data.tools.find((tool) => tool.name === "get_financial_facts")
    ).toMatchObject({
      execution: {
        handlerReady: true,
        liveDataAccess: false
      },
      permissions: {
        rightsAware: true
      },
      schema: {
        standardResponseEnvelope: true
      }
    });
    expect(
      body.data.tools.find((tool) => tool.name === "get_data_lineage")
    ).toMatchObject({
      execution: {
        handlerReady: true,
        liveDataAccess: false
      },
      permissions: {
        rightsAware: true
      },
      schema: {
        standardResponseEnvelope: true
      }
    });
    expect(
      body.data.tools.find((tool) => tool.name === "get_entitlements")
    ).toMatchObject({
      execution: {
        handlerReady: true,
        liveDataAccess: false
      },
      permissions: {
        rightsAware: true
      },
      schema: {
        standardResponseEnvelope: true
      }
    });
    expect(body.data.tools.every((tool) => tool.execution.liveDataAccess === false)).toBe(
      true
    );
  });

  it("resolves security identifiers without live data access", async () => {
    const response = await app.request("/tools/resolve-security", {
      body: JSON.stringify({
        query: "00700.HK"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-resolve-security"
      },
      method: "POST"
    });
    const body = (await response.json()) as ResolveSecurityBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.toolName).toBe("resolve_security");
    expect(body.data.status).toBe("resolved");
    expect(body.data.selectedInstrumentId).toBe("eq_hk_00700");
    expect(body.data.candidates[0]).toMatchObject({
      market: "HK",
      status: "listed",
      symbol: "00700.HK"
    });
    expect(body.data.capability).toMatchObject({
      handler_ready: true,
      live_data_access: false,
      no_silent_guessing: true,
      status: "resolve_security_scaffold"
    });
    expect(body.usage.rows).toBe(1);
  });

  it("returns ambiguity candidates without silently selecting a security", async () => {
    const response = await app.request("/tools/resolve-security", {
      body: JSON.stringify({
        query: "ABC"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-resolve-security-ambiguous"
      },
      method: "POST"
    });
    const body = (await response.json()) as ResolveSecurityBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("ambiguous");
    expect(body.data.selectedInstrumentId).toBeUndefined();
    expect(body.data.candidates.map((candidate) => candidate.instrumentId)).toEqual([
      "eq_hk_00001",
      "eq_hk_08001"
    ]);
  });

  it("returns standard errors for unresolved or invalid security lookups", async () => {
    const notFound = await app.request("/tools/resolve-security", {
      body: JSON.stringify({
        query: "UNKNOWN"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-resolve-security-not-found"
      },
      method: "POST"
    });
    const invalid = await app.request("/tools/resolve-security", {
      body: JSON.stringify({
        query: "   "
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-resolve-security-invalid"
      },
      method: "POST"
    });
    const notFoundBody = (await notFound.json()) as ErrorBody;
    const invalidBody = (await invalid.json()) as ErrorBody;

    expect(notFound.status).toBe(404);
    expect(notFoundBody.error.code).toBe("NOT_FOUND");
    expect(invalid.status).toBe(400);
    expect(invalidBody.error.code).toBe("SCOPE_DENIED");
  });

  it("returns security profile, status, currency, and coverage metadata", async () => {
    const response = await app.request("/tools/get-security-profile", {
      body: JSON.stringify({
        instrument_id: "eq_hk_00700"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-security-profile"
      },
      method: "POST"
    });
    const body = (await response.json()) as SecurityProfileBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.toolName).toBe("get_security_profile");
    expect(body.data.status).toBe("found");
    expect(body.data.liveDataAccess).toBe(false);
    expect(body.data.profile).toMatchObject({
      currency: "HKD",
      listingStatus: "listed",
      market: "HK",
      symbol: "00700.HK"
    });
    expect(body.data.profile.coverage.profile.status).toBe("available");
    expect(body.data.profile.coverage.quoteSnapshot.status).toBe("planned");
    expect(body.data.capability).toMatchObject({
      coverage_metadata: true,
      handler_ready: true,
      live_data_access: false,
      status: "get_security_profile_scaffold"
    });
    expect(body.usage.rows).toBe(1);
  });

  it("returns suspended profile fixture without live data access", async () => {
    const response = await app.request("/tools/get-security-profile", {
      body: JSON.stringify({
        instrumentId: "eq_hk_08001"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-security-profile-suspended"
      },
      method: "POST"
    });
    const body = (await response.json()) as SecurityProfileBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.profile.listingStatus).toBe("suspended");
    expect(body.data.profile.coverage.quoteSnapshot.status).toBe("unavailable");
    expect(body.data.liveDataAccess).toBe(false);
  });

  it("returns standard errors for missing or invalid security profiles", async () => {
    const notFound = await app.request("/tools/get-security-profile", {
      body: JSON.stringify({
        instrument_id: "eq_hk_missing"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-security-profile-not-found"
      },
      method: "POST"
    });
    const invalid = await app.request("/tools/get-security-profile", {
      body: JSON.stringify({
        instrument_id: "   "
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-security-profile-invalid"
      },
      method: "POST"
    });
    const notFoundBody = (await notFound.json()) as ErrorBody;
    const invalidBody = (await invalid.json()) as ErrorBody;

    expect(notFound.status).toBe(404);
    expect(notFoundBody.error.code).toBe("NOT_FOUND");
    expect(invalid.status).toBe(400);
    expect(invalidBody.error.code).toBe("SCOPE_DENIED");
  });

  it("returns market calendar sessions without live data access", async () => {
    const response = await app.request("/tools/get-market-calendar", {
      body: JSON.stringify({
        from: "2026-01-05",
        market: "HK",
        to: "2026-01-07"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-market-calendar"
      },
      method: "POST"
    });
    const body = (await response.json()) as MarketCalendarBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.toolName).toBe("get_market_calendar");
    expect(body.data.status).toBe("found");
    expect(body.data.liveDataAccess).toBe(false);
    expect(body.data.timezone).toBe("Asia/Hong_Kong");
    expect(body.data.sessions.map((session) => session.sessionStatus)).toEqual([
      "trading_day",
      "trading_day",
      "half_day"
    ]);
    expect(body.data.capability).toMatchObject({
      handler_ready: true,
      live_data_access: false,
      status: "get_market_calendar_scaffold",
      supported_session_statuses: ["trading_day", "half_day", "closed"],
      timezone: "Asia/Hong_Kong"
    });
    expect(body.usage.rows).toBe(3);
  });

  it("returns closed market calendar sessions for weather, holiday, and weekend", async () => {
    const response = await app.request("/tools/get-market-calendar", {
      body: JSON.stringify({
        from: "2026-01-08",
        market: "HK",
        to: "2026-01-10"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-market-calendar-closed"
      },
      method: "POST"
    });
    const body = (await response.json()) as MarketCalendarBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.sessions.map((session) => session.closureReason)).toEqual([
      "weather",
      "holiday",
      "weekend"
    ]);
    expect(body.data.sessions.every((session) => session.isTradingDay === false)).toBe(
      true
    );
  });

  it("returns standard errors for unsupported or invalid market calendar requests", async () => {
    const unsupportedMarket = await app.request("/tools/get-market-calendar", {
      body: JSON.stringify({
        from: "2026-01-05",
        market: "US",
        to: "2026-01-05"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-market-calendar-not-found"
      },
      method: "POST"
    });
    const outOfRange = await app.request("/tools/get-market-calendar", {
      body: JSON.stringify({
        from: "2026-01-04",
        market: "HK",
        to: "2026-01-05"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-market-calendar-out-of-range"
      },
      method: "POST"
    });
    const invalid = await app.request("/tools/get-market-calendar", {
      body: JSON.stringify({
        from: "2026-01-07",
        market: "HK",
        to: "2026-01-05"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-market-calendar-invalid"
      },
      method: "POST"
    });
    const unsupportedBody = (await unsupportedMarket.json()) as ErrorBody;
    const outOfRangeBody = (await outOfRange.json()) as ErrorBody;
    const invalidBody = (await invalid.json()) as ErrorBody;

    expect(unsupportedMarket.status).toBe(404);
    expect(unsupportedBody.error.code).toBe("NOT_FOUND");
    expect(outOfRange.status).toBe(422);
    expect(outOfRangeBody.error.code).toBe("OUT_OF_RANGE");
    expect(invalid.status).toBe(400);
    expect(invalidBody.error.code).toBe("SCOPE_DENIED");
  });

  it("returns delayed quote snapshots without live data access", async () => {
    const response = await app.request("/tools/get-quote-snapshot", {
      body: JSON.stringify({
        fields: ["lastPrice", "volume"],
        instrument_id: "eq_hk_00700"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-quote-snapshot"
      },
      method: "POST"
    });
    const body = (await response.json()) as QuoteSnapshotBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.toolName).toBe("get_quote_snapshot");
    expect(body.data.status).toBe("found");
    expect(body.data.liveDataAccess).toBe(false);
    expect(body.data.quote).toMatchObject({
      currency: "HKD",
      delay: {
        minutes: 15,
        type: "delayed"
      },
      instrumentId: "eq_hk_00700",
      qualityState: "PASS",
      symbol: "00700.HK"
    });
    expect(Object.keys(body.data.quote.fields)).toEqual(["lastPrice", "volume"]);
    expect(body.data.capability).toMatchObject({
      delay_metadata: true,
      handler_ready: true,
      live_data_access: false,
      status: "get_quote_snapshot_scaffold",
      supported_modes: ["delayed", "close"]
    });
    expect(body.usage.rows).toBe(1);
    expect(body.usage.credits).toBe(2);
  });

  it("returns close quote snapshots with close delay metadata", async () => {
    const response = await app.request("/tools/get-quote-snapshot", {
      body: JSON.stringify({
        instrument_id: "eq_hk_00700",
        mode: "close"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-quote-snapshot-close"
      },
      method: "POST"
    });
    const body = (await response.json()) as QuoteSnapshotBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.mode).toBe("close");
    expect(body.data.quote.delay).toEqual({
      minutes: 0,
      type: "close"
    });
    expect(body.data.quote.marketStatus).toBe("closed");
    expect(body.usage.credits).toBe(1);
  });

  it("returns standard errors for quote licensing, quality, time, and input failures", async () => {
    const unlicensed = await app.request("/tools/get-quote-snapshot", {
      body: JSON.stringify({
        fields: ["lastPrice", "realTimeBidAsk"],
        instrument_id: "eq_hk_00700"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-quote-snapshot-unlicensed"
      },
      method: "POST"
    });
    const qualityHold = await app.request("/tools/get-quote-snapshot", {
      body: JSON.stringify({
        instrument_id: "eq_hk_08001"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-quote-snapshot-quality"
      },
      method: "POST"
    });
    const unavailable = await app.request("/tools/get-quote-snapshot", {
      body: JSON.stringify({
        as_of: "2026-01-06T16:15:00+08:00",
        instrument_id: "eq_hk_00700"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-quote-snapshot-unavailable"
      },
      method: "POST"
    });
    const missing = await app.request("/tools/get-quote-snapshot", {
      body: JSON.stringify({
        instrument_id: "eq_hk_missing"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-quote-snapshot-missing"
      },
      method: "POST"
    });
    const invalid = await app.request("/tools/get-quote-snapshot", {
      body: JSON.stringify({
        instrument_id: "   "
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-quote-snapshot-invalid"
      },
      method: "POST"
    });
    const unlicensedBody = (await unlicensed.json()) as ErrorBody;
    const qualityHoldBody = (await qualityHold.json()) as ErrorBody;
    const unavailableBody = (await unavailable.json()) as ErrorBody;
    const missingBody = (await missing.json()) as ErrorBody;
    const invalidBody = (await invalid.json()) as ErrorBody;

    expect(unlicensed.status).toBe(403);
    expect(unlicensedBody.error.code).toBe("DATA_NOT_LICENSED");
    expect(qualityHold.status).toBe(409);
    expect(qualityHoldBody.error.code).toBe("DATA_QUALITY_HOLD");
    expect(unavailable.status).toBe(422);
    expect(unavailableBody.error.code).toBe("POINT_IN_TIME_UNAVAILABLE");
    expect(missing.status).toBe(404);
    expect(missingBody.error.code).toBe("NOT_FOUND");
    expect(invalid.status).toBe(400);
    expect(invalidBody.error.code).toBe("SCOPE_DENIED");
  });

  it("returns price history rows with adjustment metadata and cursor pagination", async () => {
    const response = await app.request("/tools/get-price-history", {
      body: JSON.stringify({
        adjustment: "total_return_adjusted",
        fields: ["close", "volume", "return"],
        from: "2026-01-02",
        instrument_id: "eq_hk_00700",
        limit: 2,
        to: "2026-01-07"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-price-history"
      },
      method: "POST"
    });
    const body = (await response.json()) as PriceHistoryBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.toolName).toBe("get_price_history");
    expect(body.data.status).toBe("found");
    expect(body.data.liveDataAccess).toBe(false);
    expect(body.data.adjustment).toBe("total_return_adjusted");
    expect(body.data.history).toMatchObject({
      adjustment: "total_return_adjusted",
      adjustmentMethodology: {
        dividendReinvestment: true,
        priceBasis: "close_to_close"
      },
      nextCursor: "offset:2",
      qualityState: "PASS",
      rowCount: 2,
      symbol: "00700.HK",
      totalRows: 4
    });
    expect(body.data.history.rows.map((row) => row.date)).toEqual([
      "2026-01-02",
      "2026-01-05"
    ]);
    expect(body.data.history.rows.map((row) => Object.keys(row.fields))).toEqual([
      ["close", "volume", "return"],
      ["close", "volume", "return"]
    ]);
    expect(body.data.capability).toMatchObject({
      adjustment_methodology: true,
      cursor_pagination: true,
      handler_ready: true,
      live_data_access: false,
      status: "get_price_history_scaffold",
      supported_adjustments: ["raw", "split_adjusted", "total_return_adjusted"]
    });
    expect(body.usage.rows).toBe(2);
    expect(body.usage.credits).toBe(4);
  });

  it("returns standard errors for price history licensing, quality, range, row, and input failures", async () => {
    const unlicensed = await app.request("/tools/get-price-history", {
      body: JSON.stringify({
        fields: ["close", "realTimeBidAsk"],
        from: "2026-01-02",
        instrument_id: "eq_hk_00700",
        to: "2026-01-07"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-price-history-unlicensed"
      },
      method: "POST"
    });
    const qualityHold = await app.request("/tools/get-price-history", {
      body: JSON.stringify({
        from: "2026-01-07",
        instrument_id: "eq_hk_08001",
        to: "2026-01-07"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-price-history-quality"
      },
      method: "POST"
    });
    const outOfRange = await app.request("/tools/get-price-history", {
      body: JSON.stringify({
        from: "2025-12-31",
        instrument_id: "eq_hk_00700",
        to: "2026-01-01"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-price-history-range"
      },
      method: "POST"
    });
    const tooManyRows = await app.request("/tools/get-price-history", {
      body: JSON.stringify({
        from: "2026-01-02",
        instrument_id: "eq_hk_00700",
        limit: 4,
        to: "2026-01-07"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-price-history-too-many"
      },
      method: "POST"
    });
    const missing = await app.request("/tools/get-price-history", {
      body: JSON.stringify({
        from: "2026-01-02",
        instrument_id: "eq_hk_missing",
        to: "2026-01-07"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-price-history-missing"
      },
      method: "POST"
    });
    const invalid = await app.request("/tools/get-price-history", {
      body: JSON.stringify({
        from: "2026-01-07",
        instrument_id: "eq_hk_00700",
        to: "2026-01-02"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-price-history-invalid"
      },
      method: "POST"
    });
    const unlicensedBody = (await unlicensed.json()) as ErrorBody;
    const qualityHoldBody = (await qualityHold.json()) as ErrorBody;
    const outOfRangeBody = (await outOfRange.json()) as ErrorBody;
    const tooManyRowsBody = (await tooManyRows.json()) as ErrorBody;
    const missingBody = (await missing.json()) as ErrorBody;
    const invalidBody = (await invalid.json()) as ErrorBody;

    expect(unlicensed.status).toBe(403);
    expect(unlicensedBody.error.code).toBe("DATA_NOT_LICENSED");
    expect(qualityHold.status).toBe(409);
    expect(qualityHoldBody.error.code).toBe("DATA_QUALITY_HOLD");
    expect(outOfRange.status).toBe(422);
    expect(outOfRangeBody.error.code).toBe("OUT_OF_RANGE");
    expect(tooManyRows.status).toBe(422);
    expect(tooManyRowsBody.error.code).toBe("TOO_MANY_ROWS");
    expect(missing.status).toBe(404);
    expect(missingBody.error.code).toBe("NOT_FOUND");
    expect(invalid.status).toBe(400);
    expect(invalidBody.error.code).toBe("SCOPE_DENIED");
  });

  it("returns corporate action rows with adjustment impact metadata and cursor pagination", async () => {
    const response = await app.request("/tools/get-corporate-actions", {
      body: JSON.stringify({
        from: "2026-01-03",
        instrument_id: "eq_hk_00700",
        limit: 2,
        to: "2026-01-07",
        types: ["dividend", "buyback", "split", "placement"]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-corporate-actions"
      },
      method: "POST"
    });
    const body = (await response.json()) as CorporateActionsBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.toolName).toBe("get_corporate_actions");
    expect(body.data.status).toBe("found");
    expect(body.data.liveDataAccess).toBe(false);
    expect(body.data.timeline).toMatchObject({
      nextCursor: "offset:2",
      qualityState: "PASS",
      rowCount: 2,
      symbol: "00700.HK",
      totalRows: 4
    });
    expect(body.data.timeline.actions.map((action) => action.actionType)).toEqual([
      "dividend",
      "buyback"
    ]);
    expect(body.data.timeline.actions[0].adjustmentImpact).toMatchObject({
      affectsSplitAdjusted: false,
      affectsTotalReturnAdjusted: true
    });
    expect(body.data.capability).toMatchObject({
      adjustment_impact_metadata: true,
      cursor_pagination: true,
      handler_ready: true,
      live_data_access: false,
      status: "get_corporate_actions_scaffold",
      supported_action_types: [
        "dividend",
        "split",
        "consolidation",
        "rights",
        "placement",
        "buyback"
      ]
    });
    expect(body.usage.rows).toBe(2);
    expect(body.usage.credits).toBe(4);
  });

  it("returns standard errors for corporate action licensing, quality, range, row, and input failures", async () => {
    const unlicensed = await app.request("/tools/get-corporate-actions", {
      body: JSON.stringify({
        from: "2026-01-03",
        instrument_id: "eq_hk_00700",
        to: "2026-01-07",
        types: ["dividend", "spin_off"]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-corporate-actions-unlicensed"
      },
      method: "POST"
    });
    const qualityHold = await app.request("/tools/get-corporate-actions", {
      body: JSON.stringify({
        from: "2026-01-07",
        instrument_id: "eq_hk_08001",
        to: "2026-01-07"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-corporate-actions-quality"
      },
      method: "POST"
    });
    const outOfRange = await app.request("/tools/get-corporate-actions", {
      body: JSON.stringify({
        from: "2025-12-01",
        instrument_id: "eq_hk_00700",
        to: "2025-12-31"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-corporate-actions-range"
      },
      method: "POST"
    });
    const tooManyRows = await app.request("/tools/get-corporate-actions", {
      body: JSON.stringify({
        from: "2026-01-03",
        instrument_id: "eq_hk_00700",
        limit: 4,
        to: "2026-01-07"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-corporate-actions-too-many"
      },
      method: "POST"
    });
    const missing = await app.request("/tools/get-corporate-actions", {
      body: JSON.stringify({
        from: "2026-01-03",
        instrument_id: "eq_hk_missing",
        to: "2026-01-07"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-corporate-actions-missing"
      },
      method: "POST"
    });
    const invalid = await app.request("/tools/get-corporate-actions", {
      body: JSON.stringify({
        from: "2026-01-07",
        instrument_id: "eq_hk_00700",
        to: "2026-01-03"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-corporate-actions-invalid"
      },
      method: "POST"
    });
    const unlicensedBody = (await unlicensed.json()) as ErrorBody;
    const qualityHoldBody = (await qualityHold.json()) as ErrorBody;
    const outOfRangeBody = (await outOfRange.json()) as ErrorBody;
    const tooManyRowsBody = (await tooManyRows.json()) as ErrorBody;
    const missingBody = (await missing.json()) as ErrorBody;
    const invalidBody = (await invalid.json()) as ErrorBody;

    expect(unlicensed.status).toBe(403);
    expect(unlicensedBody.error.code).toBe("DATA_NOT_LICENSED");
    expect(qualityHold.status).toBe(409);
    expect(qualityHoldBody.error.code).toBe("DATA_QUALITY_HOLD");
    expect(outOfRange.status).toBe(422);
    expect(outOfRangeBody.error.code).toBe("OUT_OF_RANGE");
    expect(tooManyRows.status).toBe(422);
    expect(tooManyRowsBody.error.code).toBe("TOO_MANY_ROWS");
    expect(missing.status).toBe(404);
    expect(missingBody.error.code).toBe("NOT_FOUND");
    expect(invalid.status).toBe(400);
    expect(invalidBody.error.code).toBe("SCOPE_DENIED");
  });

  it("returns financial facts with period, currency, unit, and version metadata", async () => {
    const response = await app.request("/tools/get-financial-facts", {
      body: JSON.stringify({
        from: "2023-12-31",
        instrument_id: "eq_hk_00700",
        metrics: ["revenue", "net_income", "assets", "equity"],
        to: "2023-12-31"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-financial-facts"
      },
      method: "POST"
    });
    const body = (await response.json()) as FinancialFactsBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.toolName).toBe("get_financial_facts");
    expect(body.data.status).toBe("found");
    expect(body.data.liveDataAccess).toBe(false);
    expect(body.data.facts).toMatchObject({
      accountingStandard: "HKFRS",
      currency: "HKD",
      qualityState: "PASS",
      rowCount: 4,
      symbol: "00700.HK",
      totalRows: 4,
      unit: "million"
    });
    expect(body.data.facts.facts.map((fact) => fact.metricId)).toEqual([
      "assets",
      "equity",
      "net_income",
      "revenue"
    ]);
    expect(body.data.facts.facts[0]).toMatchObject({
      periodEnd: "2023-12-31",
      restatementVersion: 1,
      unit: "million",
      versionStatus: "latest"
    });
    expect(body.data.capability).toMatchObject({
      currency_unit_metadata: true,
      handler_ready: true,
      live_data_access: false,
      point_in_time_selection: true,
      restatement_versions: true,
      status: "get_financial_facts_scaffold",
      supported_statement_types: ["income_statement", "balance_sheet", "cash_flow"]
    });
    expect(body.usage.rows).toBe(4);
    expect(body.usage.credits).toBe(8);
  });

  it("returns standard errors for financial fact licensing, quality, time, range, row, and input failures", async () => {
    const unlicensed = await app.request("/tools/get-financial-facts", {
      body: JSON.stringify({
        from: "2023-12-31",
        instrument_id: "eq_hk_00700",
        metrics: ["revenue", "ev_to_ebitda"],
        to: "2023-12-31"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-financial-facts-unlicensed"
      },
      method: "POST"
    });
    const qualityHold = await app.request("/tools/get-financial-facts", {
      body: JSON.stringify({
        from: "2023-12-31",
        instrument_id: "eq_hk_08001",
        to: "2023-12-31"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-financial-facts-quality"
      },
      method: "POST"
    });
    const unavailable = await app.request("/tools/get-financial-facts", {
      body: JSON.stringify({
        as_of: "2022-01-01T00:00:00Z",
        from: "2023-12-31",
        instrument_id: "eq_hk_00700",
        to: "2023-12-31"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-financial-facts-unavailable"
      },
      method: "POST"
    });
    const outOfRange = await app.request("/tools/get-financial-facts", {
      body: JSON.stringify({
        from: "2021-12-31",
        instrument_id: "eq_hk_00700",
        to: "2021-12-31"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-financial-facts-range"
      },
      method: "POST"
    });
    const tooManyRows = await app.request("/tools/get-financial-facts", {
      body: JSON.stringify({
        from: "2023-12-31",
        instrument_id: "eq_hk_00700",
        limit: 5,
        to: "2023-12-31"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-financial-facts-too-many"
      },
      method: "POST"
    });
    const missing = await app.request("/tools/get-financial-facts", {
      body: JSON.stringify({
        from: "2023-12-31",
        instrument_id: "eq_hk_missing",
        to: "2023-12-31"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-financial-facts-missing"
      },
      method: "POST"
    });
    const invalid = await app.request("/tools/get-financial-facts", {
      body: JSON.stringify({
        from: "2023-12-31",
        instrument_id: "eq_hk_00700",
        to: "2022-12-31"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-financial-facts-invalid"
      },
      method: "POST"
    });
    const unlicensedBody = (await unlicensed.json()) as ErrorBody;
    const qualityHoldBody = (await qualityHold.json()) as ErrorBody;
    const unavailableBody = (await unavailable.json()) as ErrorBody;
    const outOfRangeBody = (await outOfRange.json()) as ErrorBody;
    const tooManyRowsBody = (await tooManyRows.json()) as ErrorBody;
    const missingBody = (await missing.json()) as ErrorBody;
    const invalidBody = (await invalid.json()) as ErrorBody;

    expect(unlicensed.status).toBe(403);
    expect(unlicensedBody.error.code).toBe("DATA_NOT_LICENSED");
    expect(qualityHold.status).toBe(409);
    expect(qualityHoldBody.error.code).toBe("DATA_QUALITY_HOLD");
    expect(unavailable.status).toBe(422);
    expect(unavailableBody.error.code).toBe("POINT_IN_TIME_UNAVAILABLE");
    expect(outOfRange.status).toBe(422);
    expect(outOfRangeBody.error.code).toBe("OUT_OF_RANGE");
    expect(tooManyRows.status).toBe(422);
    expect(tooManyRowsBody.error.code).toBe("TOO_MANY_ROWS");
    expect(missing.status).toBe(404);
    expect(missingBody.error.code).toBe("NOT_FOUND");
    expect(invalid.status).toBe(400);
    expect(invalidBody.error.code).toBe("SCOPE_DENIED");
  });

  it("returns data lineage source, batch, version, formula, and upstream metadata", async () => {
    const response = await app.request("/tools/get-data-lineage", {
      body: JSON.stringify({
        evidence_id: "ev_financial_facts_00700_fy2023"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-data-lineage"
      },
      method: "POST"
    });
    const body = (await response.json()) as DataLineageBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.toolName).toBe("get_data_lineage");
    expect(body.data.status).toBe("found");
    expect(body.data.liveDataAccess).toBe(false);
    expect(body.data.lineage).toMatchObject({
      dataVersion: "financial-facts-synthetic-v0",
      dataset: "financial_facts",
      formula: "standardized_statement_row = source_fact.value * scale",
      recordId: "financial_fact:eq_hk_00700:2023-12-31:restatement-1",
      sourceBatchId: "batch-financial-facts-20240401",
      toolName: "get_financial_facts",
      version: 1
    });
    expect(body.data.lineage.upstream[0]).toMatchObject({
      dataset: "security_master",
      recordId: "security:eq_hk_00700"
    });
    expect(body.data.capability).toMatchObject({
      handler_ready: true,
      live_data_access: false,
      source_record_lookup: true,
      status: "get_data_lineage_scaffold"
    });
    expect(body.usage.rows).toBe(1);
  });

  it("returns standard errors for lineage quality, missing, and invalid lookups", async () => {
    const qualityHold = await app.request("/tools/get-data-lineage", {
      body: JSON.stringify({
        evidence_id: "ev_quote_08001_quality_hold"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-data-lineage-quality"
      },
      method: "POST"
    });
    const missing = await app.request("/tools/get-data-lineage", {
      body: JSON.stringify({
        evidence_id: "ev_missing"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-data-lineage-missing"
      },
      method: "POST"
    });
    const invalid = await app.request("/tools/get-data-lineage", {
      body: JSON.stringify({}),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-data-lineage-invalid"
      },
      method: "POST"
    });
    const qualityHoldBody = (await qualityHold.json()) as ErrorBody;
    const missingBody = (await missing.json()) as ErrorBody;
    const invalidBody = (await invalid.json()) as ErrorBody;

    expect(qualityHold.status).toBe(409);
    expect(qualityHoldBody.error.code).toBe("DATA_QUALITY_HOLD");
    expect(missing.status).toBe(404);
    expect(missingBody.error.code).toBe("NOT_FOUND");
    expect(invalid.status).toBe(400);
    expect(invalidBody.error.code).toBe("SCOPE_DENIED");
  });

  it("returns entitlement scope and field redactions through the gateway policy compiler", async () => {
    const response = await app.request("/tools/get-entitlements", {
      body: JSON.stringify({
        dataset: "financial_facts",
        fields: ["revenue", "capital_expenditure"],
        workspace_id: "ws_demo_pro"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-entitlements"
      },
      method: "POST"
    });
    const body = (await response.json()) as EntitlementsBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.toolName).toBe("get_entitlements");
    expect(body.data.status).toBe("found");
    expect(body.data.liveDataAccess).toBe(false);
    expect(body.data.decision).toMatchObject({
      allowedFields: ["revenue"],
      deniedFields: [
        {
          field: "capital_expenditure",
          reason: "workspace_entitlement_blocked"
        }
      ],
      status: "allow_with_redactions"
    });
    expect(body.data.entitlements.datasets).toContain("financial_facts");
    expect(body.data.entitlements.tools).toContain("get_financial_facts");
    expect(body.data.entitlements.limitationCodes).toContain("field_redactions_applied");
    expect(body.data.policySource).toMatchObject({
      liveDbReads: false,
      partnerRightsMatrixLoaded: false,
      sqlEmitted: false,
      status: "policy_source_scaffold"
    });
    expect(body.data.capability).toMatchObject({
      gateway_policy_compiler: true,
      handler_ready: true,
      live_data_access: false,
      status: "get_entitlements_scaffold"
    });
  });

  it("returns standard errors for denied entitlement scopes and invalid requests", async () => {
    const scopeDenied = await app.request("/tools/get-entitlements", {
      body: JSON.stringify({
        workspace_id: "ws_missing"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-entitlements-scope"
      },
      method: "POST"
    });
    const notLicensed = await app.request("/tools/get-entitlements", {
      body: JSON.stringify({
        dataset: "vendor_ticks",
        workspace_id: "ws_demo_pro"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-entitlements-license"
      },
      method: "POST"
    });
    const tooManyRows = await app.request("/tools/get-entitlements", {
      body: JSON.stringify({
        dataset: "quote_snapshot",
        requested_rows: 501,
        workspace_id: "ws_demo_pro"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-entitlements-rows"
      },
      method: "POST"
    });
    const outOfRange = await app.request("/tools/get-entitlements", {
      body: JSON.stringify({
        dataset: "quote_snapshot",
        time_range: {
          from: "2024-01-01",
          to: "2026-01-07"
        },
        workspace_id: "ws_demo_pro"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-entitlements-range"
      },
      method: "POST"
    });
    const invalid = await app.request("/tools/get-entitlements", {
      body: JSON.stringify({
        channel: "partner"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-entitlements-invalid"
      },
      method: "POST"
    });
    const scopeDeniedBody = (await scopeDenied.json()) as ErrorBody;
    const notLicensedBody = (await notLicensed.json()) as ErrorBody;
    const tooManyRowsBody = (await tooManyRows.json()) as ErrorBody;
    const outOfRangeBody = (await outOfRange.json()) as ErrorBody;
    const invalidBody = (await invalid.json()) as ErrorBody;

    expect(scopeDenied.status).toBe(403);
    expect(scopeDeniedBody.error.code).toBe("SCOPE_DENIED");
    expect(notLicensed.status).toBe(403);
    expect(notLicensedBody.error.code).toBe("DATA_NOT_LICENSED");
    expect(tooManyRows.status).toBe(422);
    expect(tooManyRowsBody.error.code).toBe("TOO_MANY_ROWS");
    expect(outOfRange.status).toBe(422);
    expect(outOfRangeBody.error.code).toBe("OUT_OF_RANGE");
    expect(invalid.status).toBe(400);
    expect(invalidBody.error.code).toBe("SCOPE_DENIED");
  });

  it("serves evidence runtime capabilities without live writes", async () => {
    const response = await app.request("/evidence/runtime", {
      headers: {
        "x-request-id": "req-evidence-runtime"
      }
    });
    const body = (await response.json()) as EvidenceRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      citation_planner: true,
      durable_schema_ready: true,
      live_db_writes: false,
      source_record_linking: true,
      status: "evidence_lineage_service_scaffold",
      tool_call_linking: true,
      user_visible_citations: true
    });
    expect(body.data.tables).toEqual(["core.evidence_record", "core.evidence_source_ref"]);
  });

  it("plans evidence records with source refs and user-visible citation metadata", async () => {
    const response = await app.request("/evidence/records/plan", {
      body: JSON.stringify({
        data_version: "financial-facts-synthetic-v0",
        methodology_version: "2026-06-21.phase1.get-financial-facts-tool-scaffold.v0",
        output_schema_id: "tool.get_financial_facts.output.v0",
        request_id: "req-financial-facts",
        source_records: [
          {
            data_version: "financial-facts-synthetic-v0",
            methodology_version: "2026-06-21.phase1.get-financial-facts-tool-scaffold.v0",
            source: "synthetic.financial_facts.statement",
            source_record_id: "financial-facts:eq_hk_00700:2023-12-31:v1"
          }
        ],
        tool_name: "get_financial_facts",
        user_visible_label: "FY2023 financial facts"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-evidence-plan"
      },
      method: "POST"
    });
    const body = (await response.json()) as EvidenceRecordPlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("planned_no_write");
    expect(body.data.liveDbWrites).toBe(false);
    expect(body.data.sqlEmitted).toBe(false);
    expect(body.data.evidenceRecord).toMatchObject({
      outputSchemaId: "tool.get_financial_facts.output.v0",
      requestId: "req-financial-facts",
      rightsState: "default_deny",
      toolName: "get_financial_facts"
    });
    expect(body.data.sourceRefs[0]).toMatchObject({
      evidenceRecordId: body.data.evidenceRecord.evidenceRecordId,
      sourceRecordId: "financial-facts:eq_hk_00700:2023-12-31:v1"
    });
    expect(body.data.citation).toMatchObject({
      label: "FY2023 financial facts",
      visibility: "user_visible"
    });
    expect(body.usage.rows).toBe(1);
  });

  it("rejects invalid evidence record plans with standard errors", async () => {
    const response = await app.request("/evidence/records/plan", {
      body: JSON.stringify({
        data_version: "financial-facts-synthetic-v0",
        methodology_version: "methodology-v0",
        source_records: [],
        tool_name: "get_financial_facts"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-evidence-plan-invalid"
      },
      method: "POST"
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("SCOPE_DENIED");
  });

  it("serves database runtime capabilities without live queries", async () => {
    const response = await app.request("/database/runtime", {
      headers: {
        "x-request-id": "req-database-runtime"
      }
    });
    const body = (await response.json()) as DatabaseRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.provider).toBe("supabase_postgres");
    expect(body.data.connection_path).toBe("cloudflare_hyperdrive");
    expect(body.data.hyperdrive.binding_name).toBe("AIPHABEE_HYPERDRIVE");
    expect(body.data.hyperdrive.binding_configured).toBe(false);
    expect(body.data.hyperdrive.status).toBe("planned");
    expect(body.data.migration_directory).toBe("supabase/migrations");
    expect(body.data.live_queries).toBe(false);
    expect(body.data.market_data_surfaces).toBe(false);
  });

  it("serves gateway runtime capabilities with default-deny guards", async () => {
    const response = await app.request("/gateway/runtime", {
      headers: {
        "x-request-id": "req-gateway-runtime"
      }
    });
    const body = (await response.json()) as GatewayRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.account_workspace_entitlements).toMatchObject({
      live_enforcement: false,
      status: "schema_scaffold",
      tables: [
        "core.account",
        "core.workspace",
        "core.workspace_membership",
        "core.subscription_plan",
        "core.workspace_subscription",
        "core.data_entitlement",
        "core.workspace_entitlement"
      ],
      workspace_isolation: true
    });
    expect(body.data.contract).toBe("deploy/gateway/access.contract.json");
    expect(body.data.default_rights_status).toBe("default_deny");
    expect(body.data.channels.mcp).toBe("default_deny");
    expect(body.data.error_codes).toContain("DATA_NOT_LICENSED");
    expect(body.data.error_codes).toContain("DATA_QUALITY_HOLD");
    expect(body.data.field_entitlement_enforcement).toMatchObject({
      dimensions: [
        "workspace",
        "plan",
        "channel",
        "dataset",
        "field",
        "time_range",
        "export"
      ],
      live_policy_source: false,
      policy_source: {
        compiles_to_gateway_policy: true,
        default_rights_status: "default_deny",
        live_db_reads: false,
        partner_rights_matrix_loaded: false,
        sql_emitted: false,
        status: "policy_source_scaffold"
      },
      status: "scaffold",
      workspace_isolation: true
    });
    expect(body.data.guards).toContain("field_redaction");
    expect(body.data.guards).toContain("field_entitlement_policy_source_scaffold");
    expect(body.data.guards).toContain("workspace_entitlement_default_deny");
    expect(body.data.guards).toContain("plan_entitlement");
    expect(body.data.guards).toContain("export_entitlement");
    expect(body.data.guards).toContain("quality_hold");
    expect(body.data.guards).toContain("serving_execution_adapter_scaffold");
    expect(body.data.guards).toContain("serving_quality_release_isolation");
    expect(body.data.guards).toContain("serving_query_planner_scaffold");
    expect(body.data.guards).toContain("serving_read_default_deny");
    expect(body.data.guards).toContain("serving_result_envelope_scaffold");
    expect(body.data.guards).toContain("serving_sql_descriptor_scaffold");
    expect(body.data.guards).toContain("serving_sql_text_compiler_scaffold");
    expect(body.data.guards).toContain("usage_event_writer_scaffold");
    expect(body.data.limits.max_rows).toBe(500);
    expect(body.data.live_data_access).toBe(false);
    expect(body.data.market_data_surfaces).toBe(false);
    expect(body.data.mcp_redistribution_surfaces).toBe(false);
    expect(body.data.rights_policy_version).toBe("gate0-default-deny-v0");
    expect(body.data.serving_result_envelope).toMatchObject({
      envelope_fields: ["as_of", "market_status", "provenance", "usage"],
      live_data_access: false,
      market_status: "not_applicable",
      rows_returned: false,
      shared_envelope: true,
      status: "serving_result_envelope_scaffold"
    });
    expect(body.data.serving_store).toMatchObject({
      execution_adapter: {
        adapter: "hyperdrive",
        blocks_blocked_sql_text: true,
        execution_ready: false,
        live_reads: false,
        returns_empty_rows: true,
        rows_returned: false,
        sql_executed: false,
        status: "execution_adapter_scaffold"
      },
      live_reads: false,
      quality_release: {
        blocks_quality_states: ["HOLD", "REJECT_RAW"],
        gateway_error_code: "DATA_QUALITY_HOLD",
        live_reads: false,
        live_writes: false,
        release_states: ["held", "released", "withdrawn"],
        released_quality_states: ["PASS", "WARN"],
        sql_emitted: false,
        status: "quality_release_isolation_scaffold",
        uses_quality_state: true,
        warn_quality_states: ["WARN"]
      },
      query_planner: {
        blocks_unreleased_snapshots: true,
        live_reads: false,
        requires_release_state: "released",
        sql_emitted: false,
        status: "query_planner_scaffold",
        uses_release_state: true,
        uses_row_limit: true
      },
      read_planner: {
        blocks_default_deny: true,
        blocks_quality_hold: true,
        live_reads: false,
        release_state_default: "held",
        sql_emitted: false,
        status: "read_planner_scaffold",
        uses_quality_state: true,
        uses_versioned_snapshots: true
      },
      release_state_default: "held",
      sql_descriptor: {
        blocks_unplanned_queries: true,
        execution_ready: false,
        live_reads: false,
        parameterized_bindings: true,
        sql_emitted: false,
        sql_text_emitted: false,
        status: "sql_descriptor_scaffold",
        uses_allowed_field_set: true,
        uses_row_limit: true,
        uses_snapshot_binding: true
      },
      sql_text_compiler: {
        execution_ready: false,
        live_reads: false,
        sql_executed: false,
        sql_text_emitted: true,
        status: "sql_text_compiler_scaffold",
        template_source: "allow_listed_statement_id",
        uses_parameterized_bindings: true
      },
      status: "schema_scaffold",
      tables: [
        "core.serving_dataset",
        "core.serving_field",
        "core.serving_snapshot",
        "core.serving_record"
      ],
      uses_quality_state: true,
      uses_versioned_snapshots: true
    });
    expect(body.data.usage_ledger).toMatchObject({
      event_writer: {
        live_billing_reconciliation: false,
        live_writes: false,
        reconciliation_target_delay_minutes: 5,
        sql_emitted: false,
        status: "event_writer_scaffold",
        usage_event_grain: "request_operation_dataset_occurred_at",
        weighted_credits: true
      },
      live_writes: false,
      reconciliation_target_delay_minutes: 5,
      status: "schema_scaffold",
      tables: [
        "core.usage_meter_rule",
        "core.usage_event",
        "core.usage_reconciliation_batch",
        "core.usage_ledger_entry"
      ],
      weighted_credits: true
    });
  });

  it("serves data runtime schema capabilities without live market data", async () => {
    const response = await app.request("/data/runtime", {
      headers: {
        "x-request-id": "req-data-runtime"
      }
    });
    const body = (await response.json()) as DataRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.account_workspace).toMatchObject({
      default_entitlement_status: "default_deny",
      live_enforcement: false,
      status: "schema_scaffold",
      tables: [
        "core.account",
        "core.workspace",
        "core.workspace_membership",
        "core.subscription_plan",
        "core.workspace_subscription",
        "core.data_entitlement",
        "core.workspace_entitlement"
      ],
      workspace_isolation: true
    });
    expect(body.data.corporate_actions).toMatchObject({
      adjustment_types: ["raw", "split_adjusted", "total_return_adjusted"],
      closed_open_intervals: true,
      engine: {
        direction: "backward_adjusted",
        golden_cases: {
          passed: true,
          sample_count: 3
        },
        live_partner_data: false,
        status: "engine_scaffold",
        supported_action_types: ["split", "consolidation", "dividend"],
        supported_adjustment_types: [
          "raw",
          "split_adjusted",
          "total_return_adjusted"
        ]
      },
      live_actions: false,
      quality_default_state: "HOLD",
      status: "schema_scaffold",
      tables: [
        "core.corporate_action",
        "core.adjustment_methodology",
        "core.price_adjustment_factor"
      ]
    });
    expect(body.data.default_rights_status).toBe("default_deny");
    expect(body.data.financial_facts).toMatchObject({
      engine: {
        golden_cases: {
          passed: true,
          sample_count: 2
        },
        live_partner_data: false,
        point_in_time_selection: true,
        preserve_prior_versions: true,
        status: "engine_scaffold",
        supported_statement_types: ["balance_sheet"]
      },
      live_facts: false,
      quality_default_state: "HOLD",
      restatement_versions: true,
      status: "schema_scaffold",
      tables: [
        "core.financial_statement",
        "core.financial_fact",
        "core.financial_restatement"
      ]
    });
    expect(body.data.live_queries).toBe(false);
    expect(body.data.market_data_loaded).toBe(false);
    expect(body.data.security_master.status).toBe("schema_scaffold");
    expect(body.data.security_master.tables).toEqual([
      "core.company",
      "core.instrument",
      "core.listing",
      "core.identifier_history"
    ]);
    expect(body.data.raw_snapshots).toMatchObject({
      immutable: true,
      quality_default_state: "HOLD",
      table: "core.raw_snapshot"
    });
    expect(body.data.serving_store).toMatchObject({
      cache_key_material: [
        "data_version",
        "rights_policy_version",
        "methodology_version",
        "field_set",
        "time_range"
      ],
      default_quality_state: "HOLD",
      default_rights_status: "default_deny",
      live_serving_reads: false,
      quality_release: {
        blocks_quality_states: ["HOLD", "REJECT_RAW"],
        gateway_error_code: "DATA_QUALITY_HOLD",
        live_reads: false,
        live_writes: false,
        release_states: ["held", "released", "withdrawn"],
        released_quality_states: ["PASS", "WARN"],
        sql_emitted: false,
        status: "quality_release_isolation_scaffold",
        uses_quality_state: true,
        warn_quality_states: ["WARN"]
      },
      release_state_default: "held",
      status: "schema_scaffold",
      tables: [
        "core.serving_dataset",
        "core.serving_field",
        "core.serving_snapshot",
        "core.serving_record"
      ]
    });
    expect(body.data.source_batches.rights_default_state).toBe("default_deny");
    expect(body.data.data_version_batches.live_batches).toBe(false);
  });

  it("denies gateway access checks by default", async () => {
    const response = await app.request("/gateway/access-check", {
      body: JSON.stringify({
        channel: "mcp",
        dataset: "hk_equity_quote",
        export_requested: false,
        fields: ["quote.close"],
        requested_rows: 1,
        workspace_id: "ws_default_deny"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-gateway-deny"
      },
      method: "POST"
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("DATA_NOT_LICENSED");
  });

  it("returns quality hold before gateway serving", async () => {
    const response = await app.request("/gateway/access-check", {
      body: JSON.stringify({
        channel: "mcp",
        dataset: "hk_equity_quote",
        fields: ["quote.close"],
        quality_state: "HOLD",
        requested_rows: 1
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-gateway-hold"
      },
      method: "POST"
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(409);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("DATA_QUALITY_HOLD");
  });

  it("serves secret store capabilities without secret values", async () => {
    const response = await app.request("/secrets/runtime", {
      headers: {
        "x-request-id": "req-secrets-runtime"
      }
    });
    const body = (await response.json()) as SecretsRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.secret_values_available).toBe(false);
    expect(body.data.rotation_cadence_days).toBe(90);
    expect(body.data.emergency_revocation_sla_minutes).toBe(30);
    expect(body.data.store_contract).toBe("deploy/secrets/stores.contract.json");
    expect(body.data.provider_stores.map((store) => store.name)).toEqual([
      "cloudflare_workers",
      "github_actions",
      "supabase"
    ]);
    expect(body.data.provider_stores.every((store) => store.status === "planned")).toBe(
      true
    );
  });

  it("serves model provider capabilities without model calls", async () => {
    const response = await app.request("/agent/model-provider", {
      headers: {
        "x-request-id": "req-model-provider"
      }
    });
    const body = (await response.json()) as ModelProviderBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.ai_sdk.execution_apis).toContain("streamText");
    expect(body.data.ai_sdk.execution_apis).toContain("generateText");
    expect(body.data.ai_sdk.stop_condition).toBe("isStepCount");
    expect(body.data.ai_sdk.target_version).toBe("7.0.0-beta.182");
    expect(body.data.ai_gateway.provider).toBe("cloudflare_ai_gateway");
    expect(body.data.ai_gateway.status).toBe("planned");
    expect(body.data.ai_gateway.unified_billing).toBe(true);
    expect(body.data.model_calls_enabled).toBe(false);
    expect(body.data.streaming_enabled).toBe(false);
    expect(body.data.provider_contract).toBe(
      "deploy/model-providers/providers.contract.json"
    );
    expect(body.data.execution_modes.find((mode) => mode.name === "stream_text")).toMatchObject(
      {
        model_calls: false,
        status: "guarded"
      }
    );
  });

  it("serves observability runtime capabilities without live export", async () => {
    const response = await app.request("/observability/runtime", {
      headers: {
        "x-request-id": "req-observability-runtime"
      }
    });
    const body = (await response.json()) as ObservabilityRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.event_types).toEqual(["run.audit", "run.eval"]);
    expect(body.data.forbidden_payloads).toContain("prompt");
    expect(body.data.eval_store.binding_name).toBe("AIPHABEE_EVAL_STORE");
    expect(body.data.eval_store.binding_type).toBe("d1");
    expect(body.data.eval_store.binding_configured).toBe(false);
    expect(body.data.eval_store.persistent).toBe(true);
    expect(body.data.eval_store.writes_enabled).toBe(false);
    expect(body.data.eval_store.status).toBe("planned");
    expect(body.data.eval_v1).toMatchObject({
      event_type: "run.eval",
      live_persistent_writes: false,
      status: "eval_v1_wvro_scaffold",
      unsourced_numeric_claim_target_rate: 0.001,
      version: "2026-06-21.phase1.eval-v1-wvro-scaffold.v0",
      wvro: {
        definition_source: "prd_4_3",
        required_criteria: [
          "financial_tool_success",
          "openable_evidence",
          "high_intent_action",
          "no_data_error_or_severe_hallucination_or_compliance_block"
        ]
      }
    });
    expect(body.data.eval_v1.metrics.map((metric) => metric.metric_id)).toEqual([
      "fact_accuracy",
      "calculation_accuracy",
      "citation_accuracy",
      "correct_refusal_rate"
    ]);
    expect(body.data.eval_v1.wvro.high_intent_actions).toContain("save_research");
    expect(body.data.otlp_destination.endpoint_configured).toBe(false);
    expect(body.data.otlp_destination.headers_configured).toBe(false);
    expect(body.data.otlp_destination.live_export_enabled).toBe(false);
    expect(body.data.otlp_destination.required_env).toEqual([
      "OTLP_EXPORTER_OTLP_ENDPOINT",
      "OTLP_EXPORTER_OTLP_HEADERS"
    ]);
    expect(body.data.sinks.every((sink) => sink.live_export_enabled === false)).toBe(
      true
    );
  });

  it("plans eval v1 quality metrics and WVRO eligibility without writes", async () => {
    const response = await app.request("/observability/eval-v1/plan", {
      body: JSON.stringify({
        calculation_accuracy: {
          passed: 2,
          total: 2
        },
        citation_accuracy: {
          passed: 3,
          total: 3
        },
        correct_refusal_rate: {
          passed: 1,
          total: 1
        },
        fact_accuracy: {
          passed: 4,
          total: 4
        },
        high_intent_actions: ["save_research", "continue_follow_up"],
        openable_evidence_items: 2,
        run_id: "dry_req-eval-v1-plan",
        successful_financial_tool_calls: 1,
        unsourced_numeric_claims: {
          sampled_answers: 1000,
          unsourced_claims: 0
        },
        week_start: "2026-06-15"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-eval-v1-plan"
      },
      method: "POST"
    });
    const body = (await response.json()) as EvalV1PlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      capability: {
        status: "eval_v1_wvro_scaffold"
      },
      live_persistent_writes: false,
      status: "planned_no_write",
      version: "2026-06-21.phase1.eval-v1-wvro-scaffold.v0"
    });
    expect(body.data.quality_metrics.every((metric) => metric.status === "pass")).toBe(
      true
    );
    expect(body.data.unsourced_numeric_claims).toMatchObject({
      observed_rate: 0,
      status: "pass",
      target_rate: 0.001
    });
    expect(body.data.wvro).toMatchObject({
      definition_source: "prd_4_3",
      eligible: true,
      high_intent_actions: ["save_research", "continue_follow_up"],
      week_start: "2026-06-15"
    });
    expect(body.data.wvro.criteria.every((criterion) => criterion.status === "pass")).toBe(
      true
    );
    expect(body.usage.rows).toBe(8);
  });

  it("guards streaming execution until a model provider exists", async () => {
    const response = await app.request("/agent/runs/stream", {
      body: JSON.stringify({
        prompt: "Explain 00700.HK trend"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-stream-guard"
      },
      method: "POST"
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("MODEL_PROVIDER_NOT_CONFIGURED");
  });

  it("creates an agent dry-run skeleton", async () => {
    const response = await app.request("/agent/runs/dry-run", {
      body: JSON.stringify({
        channel: "web",
        entitlement_policy_version: "entitlement-policy-test-v0",
        max_credits: 7,
        max_rows: 99,
        max_steps: 4,
        max_tokens: 1200,
        model_tier: "dry_run",
        plan: "internal_alpha",
        prompt: "Explain 00700.HK trend",
        tools: ["resolve_security", "get_financial_facts"],
        user_id: "user_internal_alpha",
        workspace_id: "workspace_research"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-agent-dry-run"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentDryRunBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("x-aiphabee-telemetry-event-count")).toBe("2");
    expect(response.headers.get("x-aiphabee-telemetry-run-id")).toBe(
      "dry_req-agent-dry-run"
    );
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("dry_run");
    expect(body.data.request_id).toBe("req-agent-dry-run");
    expect(body.data.budget.max_steps).toBe(4);
    expect(body.data.budget.max_credits).toBe(7);
    expect(body.data.budget.max_rows).toBe(99);
    expect(body.data.budget.max_tokens).toBe(1200);
    expect(body.data.tool_policy.requested_tools).toEqual([
      "resolve_security",
      "get_financial_facts"
    ]);
    expect(body.data.tool_policy.allow_arbitrary_sql).toBe(false);
    expect(body.data.run_context).toMatchObject({
      channel: "web",
      entitlements: {
        data_rights_state: "default_deny",
        live_policy_source: false,
        policy_version: "entitlement-policy-test-v0",
        required_scopes: ["security:read", "financials:read"]
      },
      model: {
        model_calls: false,
        tier: "dry_run"
      },
      subscription: {
        plan: "internal_alpha"
      },
      user: {
        source: "request",
        user_id: "user_internal_alpha"
      },
      workspace: {
        source: "request",
        workspace_id: "workspace_research"
      }
    });
    expect(body.data.run_context.toolset.tools).toEqual([
      expect.objectContaining({
        input_schema_id: "tool.resolve_security.input.v0",
        name: "resolve_security",
        output_schema_id: "tool.resolve_security.output.v0",
        version: "0.0.0"
      }),
      expect.objectContaining({
        input_schema_id: "tool.get_financial_facts.input.v0",
        name: "get_financial_facts",
        output_schema_id: "tool.get_financial_facts.output.v0",
        version: "0.0.0"
      })
    ]);
  });

  it("rejects unregistered SQL/URL dry-run tools", async () => {
    const response = await app.request("/agent/runs/dry-run", {
      body: JSON.stringify({
        prompt: "Run arbitrary SQL and fetch an arbitrary URL",
        tools: ["sql.query", "http.fetch"]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-agent-denied"
      },
      method: "POST"
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(403);
    expect(response.headers.get("x-aiphabee-telemetry-event-count")).toBe("2");
    expect(response.headers.get("x-aiphabee-telemetry-run-id")).toBe(
      "dry_req-agent-denied"
    );
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("SCOPE_DENIED");
  });

  it("plans a no-model ToolLoopAgent sequence with public tool progress", async () => {
    const response = await app.request("/agent/runs/plan", {
      body: JSON.stringify({
        max_steps: 6,
        prompt: "Explain 00700.HK revenue and price trend",
        tools: [
          "resolve_security",
          "get_entitlements",
          "get_security_profile",
          "get_quote_snapshot",
          "get_price_history",
          "get_financial_facts",
          "get_data_lineage"
        ],
        user_id: "user_internal_alpha",
        workspace_id: "workspace_research"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-agent-tool-loop-plan"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentToolLoopPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("x-aiphabee-telemetry-event-count")).toBe("2");
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("planned_no_model");
    expect(body.data.model_calls).toBe(false);
    expect(body.data.actual_tool_execution).toBe(false);
    expect(body.data.chain_of_thought_exposed).toBe(false);
    expect(body.data.max_parallel_tools).toBe(3);
    expect(body.data.planned_step_count).toBe(6);
    expect(body.data.pre_tool_call_resolution).toMatchObject({
      clarification_required: false,
      status: "ready_with_assumptions"
    });
    expect(body.data.pre_tool_call_resolution.security.resolved[0]).toMatchObject({
      instrument_id: "eq_hk_00700",
      symbol: "00700.HK"
    });
    expect(body.data.budget_stop_policy).toMatchObject({
      decision: {
        reasons: [],
        status: "continue"
      },
      graceful_stop: {
        partial_response_ready: false,
        unfinished_step_ids: []
      }
    });
    expect(body.data.failure_recovery_policy).toMatchObject({
      billing: {
        charge_grain: "tool_call_success",
        failed_attempt_billable: false,
        idempotency_key_required: true,
        no_double_charge: true,
        retry_attempt_billable: false,
        usage_ledger_write: "planned"
      },
      error_classes: {
        non_retryable: [
          "DATA_NOT_LICENSED",
          "DATA_QUALITY_HOLD",
          "INVALID_INPUT",
          "OUT_OF_RANGE",
          "SCOPE_DENIED",
          "TOO_MANY_ROWS"
        ],
        retryable: ["RATE_LIMITED", "TOOL_TIMEOUT", "UPSTREAM_5XX", "NETWORK_RESET"],
        stop_after_consecutive_same_error: 2
      },
      graceful_degradation: {
        evidence_binding_required_for_reused_outputs: true,
        failed_tool_claim_label: "unknown",
        partial_answer_allowed: true,
        single_tool_failure_does_not_drop_run: true,
        user_visible_recovery_state: true
      },
      partial_retry: {
        enabled: true,
        max_attempts_per_tool: 2,
        preserves_completed_steps: true,
        retry_after_supported: true,
        retry_billable: false,
        retry_scope: "failed_tool_call_only",
        reuse_completed_evidence: true
      },
      recovery_state: {
        durable_runtime: "planned",
        idempotency_key: "planned",
        persisted: false,
        resume_token: "planned",
        state_store: "planned_run_state"
      },
      status: "failure_recovery_policy_scaffold",
      version: "2026-06-21.phase1.failure-recovery-policy-scaffold.v0"
    });
    expect(body.data.failure_recovery_policy.planned_step_recovery).toEqual([
      expect.objectContaining({
        local_recovery_action: "retry_failed_tool_call_only",
        phase: "security_resolution",
        retryable_tool_call_count: 1,
        step_id: "step_1"
      }),
      expect.objectContaining({
        local_recovery_action: "retry_failed_tool_call_only",
        phase: "entitlement_gate",
        retryable_tool_call_count: 1,
        step_id: "step_2"
      }),
      expect.objectContaining({
        local_recovery_action: "retry_failed_tool_call_only",
        phase: "data_fetch",
        retryable_tool_call_count: 3,
        step_id: "step_3"
      }),
      expect.objectContaining({
        local_recovery_action: "retry_failed_tool_call_only",
        phase: "data_fetch",
        retryable_tool_call_count: 1,
        step_id: "step_4"
      }),
      expect.objectContaining({
        local_recovery_action: "retry_failed_tool_call_only",
        phase: "evidence_binding",
        retryable_tool_call_count: 1,
        step_id: "step_5"
      }),
      expect.objectContaining({
        local_recovery_action: "return_partial_response",
        phase: "answer_contract",
        retryable_tool_call_count: 0,
        step_id: "step_6"
      })
    ]);
    expect(body.data.failure_recovery_policy.validation_rules).toEqual([
      "preserve_completed_steps",
      "retry_failed_tool_call_only",
      "reuse_existing_evidence_records",
      "do_not_rebill_retries",
      "stop_after_two_same_errors",
      "surface_partial_response"
    ]);
    expect(body.data.model_routing_audit).toMatchObject({
      audit_contract: {
        cost_latency_required: true,
        product_analytics_separate: true,
        prompt_version_required: true,
        redact_sensitive_content: true
      },
      cache_policy: {
        non_sensitive_only: true,
        safe_reusable_results_only: true,
        user_private_prompt_content_cacheable: false
      },
      fallback_policy: {
        fallback_model_status: "planned",
        max_fallbacks_per_run: 1,
        records_model_change: true,
        strategy: "switch_to_backup_model",
        triggers: ["MODEL_TIMEOUT", "RATE_LIMITED", "UPSTREAM_5XX"]
      },
      gateway: {
        gateway_id: "default",
        provider: "cloudflare_ai_gateway",
        required_env: ["CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_TOKEN", "AI_GATEWAY_NAME"],
        status: "planned",
        unified_billing: true
      },
      linked_policy_versions: {
        answer_evidence_contract: "2026-06-21.phase1.answer-evidence-contract-scaffold.v0",
        failure_recovery_policy: "2026-06-21.phase1.failure-recovery-policy-scaffold.v0",
        numeric_source_guard: "2026-06-21.phase1.numeric-source-guard-scaffold.v0"
      },
      live_model_routing: false,
      model_calls: false,
      run_context_model_tier: "dry_run",
      status: "model_routing_audit_scaffold",
      version: "2026-06-21.phase1.model-routing-audit-scaffold.v0"
    });
    expect(body.data.model_routing_audit.audit_contract.required_fields).toEqual([
      "user_id",
      "workspace_id",
      "token_client_id",
      "ip_risk_summary",
      "tool_name",
      "tool_version",
      "input_summary_hash",
      "authorization_policy_version",
      "dataset",
      "data_version",
      "source_record_id",
      "cache_hit",
      "model_provider",
      "model_id",
      "model_version",
      "prompt_version",
      "input_tokens",
      "output_tokens",
      "estimated_cost",
      "latency_ms",
      "output_hash",
      "error_code",
      "retry_count",
      "fallback_from_model",
      "fallback_to_model",
      "human_intervention"
    ]);
    expect(body.data.model_routing_audit.routing_tiers).toEqual([
      expect.objectContaining({
        model_calls: false,
        status: "planned",
        task_layer: "lightweight",
        tasks: [
          "intent_detection",
          "security_resolution_assist",
          "simple_formatting",
          "summary_draft"
        ]
      }),
      expect.objectContaining({
        model_calls: false,
        status: "planned",
        task_layer: "main",
        tasks: ["research_planning", "evidence_synthesis", "cross_document_explanation"]
      }),
      expect.objectContaining({
        model_calls: false,
        status: "wired_no_model",
        task_layer: "deterministic_code",
        tasks: ["financial_calculation", "screening", "structured_transform"]
      })
    ]);
    expect(body.data.model_routing_audit.validation_rules).toEqual([
      "require_ai_gateway_logs",
      "require_model_change_audit",
      "require_budget_ledger_link",
      "block_arbitrary_model_id",
      "keep_deterministic_financial_calculations_out_of_model",
      "redact_sensitive_audit_payloads"
    ]);
    expect(body.data.answer_evidence_contract).toMatchObject({
      answer_structure: {
        disclaimer_boundary: "not_a_substitute_for_runtime_controls",
        key_evidence_items: {
          max: 6,
          min: 3
        },
        max_direct_answer_sentences: 5,
        max_next_steps: 3,
        min_direct_answer_sentences: 2
      },
      claim_labels: {
        calculation_requires_calculation_ref: true,
        fact_requires_evidence_card: true,
        inference_requires_evidence_strength: true,
        required_labels: ["fact", "calculation", "inference", "unknown"],
        text_labels_required: true,
        ui_labels_required: true,
        unknown_requires_missing_reason: true
      },
      evidence_cards: {
        clickable_payload_contract: true,
        frontend_rendering: false
      },
      evidence_strength: {
        allowed_values: ["strong", "medium", "weak", "unknown"],
        confidence_score_display: false
      },
      frontend_rendering: false,
      model_calls: false,
      numeric_source_guard_version: "2026-06-21.phase1.numeric-source-guard-scaffold.v0",
      status: "answer_evidence_contract_scaffold",
      version: "2026-06-21.phase1.answer-evidence-contract-scaffold.v0"
    });
    expect(body.data.answer_evidence_contract.answer_structure.ordered_sections).toEqual([
      expect.objectContaining({ order: 1, section_id: "direct_answer", source: "prd_8_3" }),
      expect.objectContaining({ order: 2, section_id: "data_status", source: "prd_8_3" }),
      expect.objectContaining({ order: 3, section_id: "key_evidence", source: "prd_8_3" }),
      expect.objectContaining({ order: 4, section_id: "explanation", source: "prd_8_3" }),
      expect.objectContaining({
        order: 5,
        section_id: "counter_evidence_risks",
        source: "prd_8_3"
      }),
      expect.objectContaining({ order: 6, section_id: "sources_methods", source: "prd_8_3" }),
      expect.objectContaining({ order: 7, section_id: "next_steps", source: "prd_8_3" }),
      expect.objectContaining({ order: 8, section_id: "disclaimer", source: "prd_8_3" })
    ]);
    expect(body.data.answer_evidence_contract.evidence_cards.required_fields).toEqual([
      "card_id",
      "claim_id",
      "label",
      "source_record_id",
      "data_point",
      "document_location",
      "as_of",
      "data_version",
      "methodology_version",
      "currency",
      "unit",
      "evidence_strength",
      "warnings"
    ]);
    expect(body.data.answer_evidence_contract.evidence_cards.planned_card_sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          card_type: "data_point",
          output_schema_id: "tool.get_quote_snapshot.output.v0",
          source_record_required: true,
          tool_name: "get_quote_snapshot",
          version: "0.0.0"
        }),
        expect.objectContaining({
          card_type: "data_point",
          output_schema_id: "tool.get_financial_facts.output.v0",
          source_record_required: true,
          tool_name: "get_financial_facts",
          version: "0.0.0"
        }),
        expect.objectContaining({
          card_type: "lineage",
          output_schema_id: "tool.get_data_lineage.output.v0",
          source_record_required: true,
          tool_name: "get_data_lineage",
          version: "0.0.0"
        })
      ])
    );
    expect(body.data.answer_evidence_contract.validation_rules).toEqual([
      "require_ordered_answer_sections",
      "require_layer_label_per_claim",
      "require_evidence_card_ref_for_fact",
      "require_calculation_ref_for_calculation",
      "label_missing_data_unknown",
      "block_unsourced_specific_numbers"
    ]);
    expect(body.data.numeric_source_guard).toMatchObject({
      allowed_sources: ["tool_result", "deterministic_calculation"],
      answer_contract: {
        concrete_financial_numbers_allowed: false,
        failure_code: "UNSOURCED_NUMERIC_CLAIM",
        memory_generated_numbers_allowed: false,
        requires_calculation_ref: true,
        requires_source_record_ref: true,
        unsupported_numeric_claim_behavior: "block_answer_claim",
        unknown_value_label: "unknown"
      },
      blocked_sources: ["model_memory", "training_data", "unverified_prompt", "unstated_source"],
      concrete_claims_allowed_now: false,
      model_calls: false,
      post_generation_validation: "planned",
      status: "guarded_no_actual_results",
      validation_rules: [
        "extract_numeric_claims",
        "require_tool_result_or_calculation_ref",
        "block_model_memory_numbers",
        "label_missing_numbers_unknown"
      ],
      version: "2026-06-21.phase1.numeric-source-guard-scaffold.v0"
    });
    expect(body.data.numeric_source_guard.planned_tool_result_sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          output_schema_id: "tool.get_quote_snapshot.output.v0",
          source_record_required: true,
          tool_name: "get_quote_snapshot",
          version: "0.0.0"
        }),
        expect.objectContaining({
          output_schema_id: "tool.get_financial_facts.output.v0",
          source_record_required: true,
          tool_name: "get_financial_facts",
          version: "0.0.0"
        })
      ])
    );
    expect(body.data.numeric_source_guard.deterministic_calculations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          calculation_id: "deterministic_return_risk_v0",
          required_source_tools: ["get_price_history"]
        }),
        expect.objectContaining({
          calculation_id: "deterministic_financial_growth_v0",
          required_source_tools: ["get_financial_facts"]
        })
      ])
    );
    expect(body.data.tool_enforcement).toMatchObject({
      allow_arbitrary_sql: false,
      allow_arbitrary_url: false,
      all_checks_passed: true,
      denied_tools: [],
      model_calls: false,
      permission_aware: true,
      registered_tool_count: 9,
      registry_version: "2026-06-21.phase1.shared-tool-registry-scaffold.v0",
      requested_tools: [
        "resolve_security",
        "get_entitlements",
        "get_security_profile",
        "get_quote_snapshot",
        "get_price_history",
        "get_financial_facts",
        "get_data_lineage"
      ],
      schema_bound: true,
      status: "allowed",
      version: "2026-06-21.phase1.tool-enforcement-scaffold.v0",
      versioned_tools: true
    });
    expect(body.data.tool_enforcement.required_checks).toEqual([
      "registered",
      "versioned",
      "schema_bound",
      "permission_scope",
      "rights_aware",
      "no_arbitrary_sql",
      "no_arbitrary_url",
      "read_only_no_live_data"
    ]);
    expect(body.data.tool_enforcement.tool_checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          allow_arbitrary_sql: false,
          allow_arbitrary_url: false,
          input_schema_id: "tool.get_financial_facts.input.v0",
          live_data_access: false,
          name: "get_financial_facts",
          output_schema_id: "tool.get_financial_facts.output.v0",
          permission_scope: "financials:read",
          registered: true,
          rights_aware: true,
          schema_bound: true,
          standard_response_envelope: true,
          status: "allowed",
          version: "0.0.0",
          versioned: true
        })
      ])
    );
    expect(body.data.progress_stream).toMatchObject({
      exposes_chain_of_thought: false,
      tool_progress_public: true,
      transport: "planned"
    });
    expect(body.data.stop_conditions).toContain("two_consecutive_same_error");
    expect(body.data.retry_policy).toMatchObject({
      consecutive_same_error_limit: 2,
      max_attempts_per_tool: 2,
      retry_billable: false
    });
    expect(body.data.run_context.entitlements.data_rights_state).toBe("default_deny");
    expect(body.data.run_context.model.model_calls).toBe(false);
    expect(body.data.steps.map((step) => step.phase)).toEqual([
      "security_resolution",
      "entitlement_gate",
      "data_fetch",
      "data_fetch",
      "evidence_binding",
      "answer_contract"
    ]);
    expect(body.data.steps.every((step) => step.tool_calls.length <= 3)).toBe(true);
    expect(body.data.steps[0].progress_events).toContain("tool.call.started");
    expect(body.data.steps.flatMap((step) => step.tool_calls).map((tool) => tool.name)).toEqual([
      "resolve_security",
      "get_entitlements",
      "get_security_profile",
      "get_quote_snapshot",
      "get_price_history",
      "get_financial_facts",
      "get_data_lineage"
    ]);
    expect(
      body.data.steps
        .flatMap((step) => step.tool_calls)
        .every(
          (tool) =>
            !tool.allow_arbitrary_sql &&
            !tool.allow_arbitrary_url &&
            tool.rights_aware &&
            tool.standard_response_envelope &&
            tool.input_schema_id.length > 0 &&
            tool.output_schema_id.length > 0 &&
            tool.version.length > 0
        )
    ).toBe(true);
    expect(body.usage.rows).toBe(6);
  });

  it("gracefully stops ToolLoopAgent plans beyond the requested step budget", async () => {
    const response = await app.request("/agent/runs/plan", {
      body: JSON.stringify({
        max_steps: 3,
        prompt: "Explain 00700.HK revenue and price trend",
        tools: [
          "resolve_security",
          "get_entitlements",
          "get_security_profile",
          "get_quote_snapshot",
          "get_price_history",
          "get_financial_facts",
          "get_data_lineage"
        ]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-agent-tool-loop-plan-budget"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentToolLoopPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("x-aiphabee-telemetry-event-count")).toBe("2");
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("stopped_budget");
    expect(body.data.planned_step_count).toBe(3);
    expect(body.data.steps.map((step) => step.phase)).toEqual([
      "security_resolution",
      "entitlement_gate",
      "answer_contract"
    ]);
    expect(body.data.budget_stop_policy.decision).toMatchObject({
      reasons: ["steps"],
      status: "stop_before_execution",
      stop_before_step: 3
    });
    expect(body.data.budget_stop_policy.graceful_stop).toMatchObject({
      completed_step_ids: ["step_1", "step_2"],
      existing_evidence_record_ids: [],
      partial_response_ready: true
    });
    expect(body.data.budget_stop_policy.graceful_stop.unfinished_step_ids).toContain("step_3");
    expect(body.data.budget_stop_policy.planned_usage.steps).toBe(3);
    expect(body.data.model_routing_audit).toMatchObject({
      live_model_routing: false,
      model_calls: false,
      status: "model_routing_audit_scaffold"
    });
    expect(body.data.failure_recovery_policy.planned_step_recovery).toEqual([
      expect.objectContaining({
        local_recovery_action: "retry_failed_tool_call_only",
        step_id: "step_1"
      }),
      expect.objectContaining({
        local_recovery_action: "retry_failed_tool_call_only",
        step_id: "step_2"
      }),
      expect.objectContaining({
        local_recovery_action: "return_partial_response",
        phase: "answer_contract",
        step_id: "step_3"
      })
    ]);
  });

  it("resolves pre-tool-call context before tool planning", async () => {
    const response = await app.request("/agent/runs/preflight", {
      body: JSON.stringify({
        as_of: "2024-03-31",
        currency: "HKD",
        methodology: "split_adjusted",
        prompt: "Explain Tencent revenue",
        securities: ["00700.HK"],
        time_range: {
          end: "2024-03-31",
          start: "2023-04-01"
        },
        tools: ["resolve_security", "get_financial_facts"]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-agent-preflight"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentPreflightBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("ready");
    expect(body.data.clarification_required).toBe(false);
    expect(body.data.security).toMatchObject({
      status: "resolved",
      resolved: [
        expect.objectContaining({
          instrument_id: "eq_hk_00700",
          symbol: "00700.HK"
        })
      ]
    });
    expect(body.data.time).toMatchObject({
      as_of: "2024-03-31",
      status: "resolved"
    });
    expect(body.data.currency).toMatchObject({
      currency: "HKD",
      status: "resolved"
    });
    expect(body.data.methodology).toMatchObject({
      price_adjustment: "split_adjusted",
      status: "resolved"
    });
    expect(body.data.tool_readiness.can_plan_tools).toBe(true);
  });

  it("asks for clarification when pre-tool-call security is ambiguous", async () => {
    const response = await app.request("/agent/runs/preflight", {
      body: JSON.stringify({
        prompt: "Explain ABC revenue",
        tools: ["resolve_security", "get_financial_facts"]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-agent-preflight-ambiguous"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentPreflightBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("needs_clarification");
    expect(body.data.clarification_required).toBe(true);
    expect(body.data.security.status).toBe("needs_clarification");
    expect(body.data.security.ambiguous_candidates).toEqual([
      expect.objectContaining({
        instrument_id: "eq_hk_00001"
      }),
      expect.objectContaining({
        instrument_id: "eq_hk_08001"
      })
    ]);
    expect(body.data.clarifications[0]).toMatchObject({
      field: "security"
    });
    expect(body.data.tool_readiness).toMatchObject({
      blocked_tools: ["resolve_security", "get_financial_facts"],
      can_plan_tools: false
    });
  });
});
