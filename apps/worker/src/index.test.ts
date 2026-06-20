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

interface AgentRuntimeBody {
  data: {
    ai_sdk: {
      stop_condition: string;
      target_version: string;
    };
    surfaces: {
      market_data: boolean;
      mcp_redistribution: boolean;
      model_calls: boolean;
    };
  };
  ok: true;
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

interface AgentDryRunBody {
  data: {
    budget: {
      max_steps: number;
    };
    request_id: string;
    status: "dry_run";
    tool_policy: {
      allow_arbitrary_sql: boolean;
      requested_tools: string[];
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
    expect(body.data.surfaces.model_calls).toBe(false);
    expect(body.data.surfaces.market_data).toBe(false);
    expect(body.data.surfaces.mcp_redistribution).toBe(false);
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
        max_steps: 4,
        prompt: "Explain 00700.HK trend",
        tools: ["resolve_security"]
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
    expect(body.data.tool_policy.requested_tools).toEqual(["resolve_security"]);
    expect(body.data.tool_policy.allow_arbitrary_sql).toBe(false);
  });

  it("rejects unregistered dry-run tools", async () => {
    const response = await app.request("/agent/runs/dry-run", {
      body: JSON.stringify({
        prompt: "Run arbitrary SQL",
        tools: ["sql.query"]
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
});
