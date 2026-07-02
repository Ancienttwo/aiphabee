import { afterEach, describe, expect, it, vi } from "vitest";
import { REGISTERED_TOOLS } from "@aiphabee/tool-registry";
import app, { AiphaBeeResearchWorkflow, AiphaBeeRunCoordinator } from "./index";

const REGISTERED_TOOL_COUNT = REGISTERED_TOOLS.length;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

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

interface CloudflareBindingSmokeBody {
  missing_bindings: string[];
  request_id: string;
  response_hash: string;
  route: string;
  runtime_results: Array<{
    binding_name: string;
    failure_code?: string;
    operation_count?: number;
    status: string;
    surface: string;
  }>;
  status: string;
  synthetic_prefix: string;
}

interface CloudflareQueueSmokeBody {
  missing_bindings: string[];
  queue_result: {
    binding_name: string;
    evidence_key_hash?: string;
    failure_code?: string;
    message_hash?: string;
    operation_count?: number;
    status: string;
    surface: string;
  };
  request_id: string;
  response_hash: string;
  route: string;
  status: string;
  synthetic_prefix: string;
}

interface CloudflareDurableObjectSmokeBody {
  durable_object_result: {
    binding_name: string;
    failure_code?: string;
    object_name_hash?: string;
    operation_count?: number;
    response_hash?: string;
    state_key_hash?: string;
    status: string;
    surface: string;
    value_hash?: string;
  };
  missing_bindings: string[];
  request_id: string;
  response_hash: string;
  route: string;
  status: string;
  synthetic_prefix: string;
}

interface CloudflareWorkflowSmokeBody {
  missing_bindings: string[];
  request_id: string;
  response_hash: string;
  route: string;
  status: string;
  synthetic_prefix: string;
  workflow_result: {
    binding_name: string;
    evidence_key_hash?: string;
    failure_code?: string;
    instance_id_hash?: string;
    operation_count?: number;
    response_hash?: string;
    status: string;
    surface: string;
    value_hash?: string;
  };
}

interface CloudflareCronSmokeBody {
  cron_result: {
    binding_name: string;
    cron_hash?: string;
    evidence_key_hash?: string;
    failure_code?: string;
    operation_count?: number;
    scheduled_time_hash?: string;
    status: string;
    surface: string;
    value_hash?: string;
  };
  missing_bindings: string[];
  request_id: string;
  response_hash: string;
  route: string;
  status: string;
  synthetic_prefix: string;
}

interface CloudflareHyperdriveSmokeBody {
  hyperdrive_result: {
    binding_name: string;
    current_database_hash?: string;
    current_user_hash?: string;
    database_create_privilege?: boolean;
    detail_hash?: string;
    failure_code?: string;
    failure_sqlstate?: string;
    failure_stage?: string;
    operation_count?: number;
    query_hash?: string;
    row_count?: number;
    selected_value_hash?: string;
    status: string;
    surface: string;
  };
  missing_bindings: string[];
  request_id: string;
  response_hash: string;
  route: string;
  status: string;
  synthetic_prefix: string;
}

interface CloudflareHyperdriveSchemaInventoryBody {
  hyperdrive_schema_inventory_result: {
    binding_name: string;
    detail_hash?: string;
    expected_index_count?: number;
    expected_rls_table_count?: number;
    expected_schema_count?: number;
    expected_table_count?: number;
    failure_code?: string;
    missing_indexes?: string[];
    missing_rls_tables?: string[];
    missing_schemas?: string[];
    missing_tables?: string[];
    observed_index_count?: number;
    observed_rls_table_count?: number;
    observed_schema_count?: number;
    observed_table_count?: number;
    operation_count?: number;
    platform_product_aiphabee_present?: boolean;
    platform_product_aiphabee_status_hash?: string;
    query_hash?: string;
    status: string;
    surface: string;
  };
  missing_bindings: string[];
  request_id: string;
  response_hash: string;
  route: string;
  status: string;
  synthetic_prefix: string;
}

interface PlatformUmbrellaRlsFixtureSmokeBody {
  missing_bindings: string[];
  request_id: string;
  response_hash: string;
  rls_fixture_result: {
    binding_name: string;
    cleanup_rolled_back?: boolean;
    current_role_bypassrls?: boolean;
    current_role_superuser?: boolean;
    current_user_hash?: string;
    detail_hash?: string;
    failure_code?: string;
    operation_count?: number;
    query_hash?: string;
    runtime_role_active_for_selects?: boolean;
    runtime_role_bypassrls?: boolean;
    runtime_role_superuser?: boolean;
    runtime_user_hash?: string;
    status: string;
    surface: string;
    workspace_table_owner_is_current_user?: boolean;
  };
  route: string;
  status: string;
  synthetic_prefix: string;
}

interface PlatformRuntimeRoleSmokeBody {
  missing_bindings: string[];
  request_id: string;
  response_hash: string;
  route: string;
  runtime_role_result: {
    binding_name: string;
    current_role_bypassrls?: boolean;
    current_role_superuser?: boolean;
    current_user_hash?: string;
    database_create_privilege?: boolean;
    detail_hash?: string;
    failure_code?: string;
    operation_count?: number;
    platform_account_select_privilege?: boolean;
    platform_schema_create_privilege?: boolean;
    platform_schema_usage_privilege?: boolean;
    platform_workspace_rls_forced?: boolean;
    platform_workspace_select_privilege?: boolean;
    query_hash?: string;
    runtime_role_ready?: boolean;
    status: string;
    surface: string;
    workspace_table_owner_is_current_user?: boolean;
  };
  status: string;
  synthetic_prefix: string;
}

interface PublicRuntimeBody {
  data: {
    auth_required: boolean;
    compliance_ops_release_gate: {
      route: string;
      status: string;
    };
    docs_route: string;
    document_kinds: string[];
    frontend: boolean;
    live_deployment_verified: boolean;
    live_incident_feed: boolean;
    persistent_writes: boolean;
    publication_economics_release_gate: {
      route: string;
      status: string;
    };
    request_id_visible: boolean;
    route: string;
    sql_emitted: boolean;
    status: string;
    status_components: string[];
    status_route: string;
  };
  ok: true;
}

interface PublicStatusBody {
  data: {
    capability: {
      status: string;
    };
    components: Array<{
      component_id: string;
      evidence_route: string;
      request_id_visible: boolean;
      status: string;
    }>;
    live_incident_feed: boolean;
    persistent_writes: boolean;
    request_id: string;
    request_id_visible: boolean;
    sql_emitted: boolean;
    status: string;
    status_page: {
      auth_required: boolean;
      component_count: number;
      publication_status: string;
      route: string;
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface PublicDocsBody {
  data: {
    capability: {
      status: string;
    };
    documents: Array<{
      kind: string;
      legal_review_required: boolean;
      path: string;
      publication_status: string;
      required_sections: string[];
    }>;
    live_publication_verified: boolean;
    persistent_writes: boolean;
    request_id: string;
    request_id_visible: boolean;
    route: string;
    sql_emitted: boolean;
    status: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface PartnerRuntimeBody {
  data: {
    auth_required: boolean;
    frontend: boolean;
    live_api_execution: boolean;
    live_embed_rendering: boolean;
    persistent_writes: boolean;
    route: string;
    runtime_route: string;
    sql_emitted: boolean;
    status: string;
    white_label_embeds: {
      data_gateway_required: boolean;
      embed_script_generated: boolean;
      partner_rights_matrix_required: boolean;
      route: string;
      settlement_route: string;
      status: string;
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface PartnerWhiteLabelEmbedPlanBody {
  data: {
    brand_policy: {
      brand_mode: string;
      white_label_allowed: boolean;
    };
    capability: {
      route: string;
      status: string;
    };
    commercial_model: {
      model: string;
      revenue_share_bps: number;
      settlement_route: string;
      settlement_status: string;
    };
    data_governance: {
      default_deny_until_signed: boolean;
      external_redistribution_allowed: boolean;
      field_authorization_required: boolean;
      partner_rights_matrix_required: boolean;
    };
    embed: {
      allowed_origins: string[];
      csp_required: boolean;
      public_indexing: boolean;
      script_bundle_generated: boolean;
      surfaces: string[];
    };
    frontend: boolean;
    live_api_execution: boolean;
    live_embed_rendering: boolean;
    mcp_api: {
      api_key_route: string;
      live_execution: boolean;
      mcp_route: string;
      oauth_route: string;
      usage_envelope_required: boolean;
    };
    partner: {
      partner_id: string;
      partner_type: string;
      workspace_id: string;
    };
    persistent_writes: boolean;
    request_id: string;
    sql_emitted: boolean;
    status: string;
    validation: {
      unsupported_surfaces: string[];
      valid_allowed_origins: boolean;
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface MarketDomainRuntimeBody {
  data: {
    auth_required: boolean;
    cross_market_plan: {
      allowed_domains: string[];
      allowed_mapping_types: string[];
      allowed_markets: string[];
      data_gateway_required: boolean;
      point_in_time_required: boolean;
      rights_matrix_required: boolean;
      route: string;
      status: string;
    };
    default_rights_status: string;
    frontend: boolean;
    live_data_access: boolean;
    persistent_writes: boolean;
    route: string;
    runtime_route: string;
    sql_emitted: boolean;
    status: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface HkDataDomainsCrossMarketPlanBody {
  data: {
    capability: {
      route: string;
      status: string;
    };
    coverage_contract: {
      default_deny_until_authorized: boolean;
      methodology_fields_required: string[];
      phase4_source: string;
      point_in_time_required: boolean;
      prd_data_domain_source: string;
    };
    cross_market: {
      analytics_comparison_route: string;
      base_market: string;
      calendar_alignment_route: string;
      comparison_markets: string[];
      mapping_items: Array<{
        comparison_market: string;
        fx_rate_required: boolean;
        live_mapping_enabled: boolean;
        mapping_type: string;
        rights_state: string;
        status: string;
      }>;
      mapping_types: string[];
      security_resolution_route: string;
    };
    data_domains: Array<{
      domain: string;
      live_data_loaded: boolean;
      market: string;
      point_in_time_required: boolean;
      rights_state: string;
      status: string;
      table: string;
    }>;
    frontend: boolean;
    live_data_access: boolean;
    persistent_writes: boolean;
    request_id: string;
    rights: {
      default_deny_until_authorized: boolean;
      external_redistribution_allowed: boolean;
      export_allowed: boolean;
      field_authorization_required: boolean;
      mcp_redistribution_allowed: boolean;
      rights_matrix_required: boolean;
      rights_matrix_version?: string;
    };
    sql_emitted: boolean;
    status: string;
    validation: {
      rights_matrix_present: boolean;
      unsupported_domains: string[];
      unsupported_mapping_types: string[];
      unsupported_markets: string[];
    };
    workspace_id: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface LicensedAdviceRuntimeBody {
  data: {
    advice_generation_enabled: boolean;
    auth_required: boolean;
    default_status: string;
    exploration_plan: {
      advice_generation_enabled: boolean;
      allowed_surfaces: string[];
      forbidden_unlicensed_outputs: string[];
      required_controls: string[];
      route: string;
      status: string;
    };
    frontend: boolean;
    live_model_execution: boolean;
    order_execution: boolean;
    persistent_writes: boolean;
    route: string;
    runtime_route: string;
    sql_emitted: boolean;
    status: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface LicensedAdviceExplorationPlanBody {
  data: {
    advice_output_policy: {
      buy_sell_hold_recommendation: boolean;
      copy_trading_instruction: boolean;
      evidence_only_fallback: boolean;
      order_routing: boolean;
      personalized_suitability_conclusion: boolean;
      research_tool_boundary_preserved_until_licensed: boolean;
      target_position_size: boolean;
    };
    capability: {
      route: string;
      status: string;
    };
    compliance_controls: {
      answer_evidence_route: string;
      compliance_release_gate_route: string;
      kill_switch_policy_id?: string;
      kill_switch_route: string;
      mvp_boundary_contract: string;
    };
    frontend: boolean;
    legal_review: {
      external_legal_opinion_required: boolean;
      legal_review_status: string;
      regulatory_source_urls: string[];
      type4_written_opinion_id?: string;
    };
    licensed_path: {
      licensed_entity_id?: string;
      proposed_surface: string;
      responsible_officer_id?: string;
      route2_source: string;
      supervision_required: boolean;
    };
    live_model_execution: boolean;
    order_execution: boolean;
    persistent_writes: boolean;
    request_id: string;
    sql_emitted: boolean;
    status: string;
    suitability_controls: {
      advice_record_retention_policy_id?: string;
      complaint_handling_policy_id?: string;
      human_review_queue_id?: string;
      suitability_profile_schema_id?: string;
      suitability_required: boolean;
    };
    validation: {
      legal_review_approved: boolean;
      licensed_path_present: boolean;
      supervision_controls_present: boolean;
      suitability_controls_present: boolean;
      unsupported_surfaces: string[];
    };
    workspace_id: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface ComplianceOpsReleaseGatePlanBody {
  data: {
    audit_export_drill: {
      audit_event: {
        event_type: string;
        outcome: string;
        request_id: string;
        route: string;
      };
      event_count: number;
      export_format: string;
      required_fields: string[];
      sensitive_payload_released: boolean;
    };
    capability: {
      route: string;
      status: string;
    };
    compliance_boundary: {
      external_legal_opinion_present: boolean;
      reviewed_surfaces: string[];
      type4_written_opinion_required: boolean;
    };
    incident_response_drill: {
      support_plan: {
        investigation: {
          planned_sources: string[];
          target_request_id: string;
        };
        privacy: {
          sensitive_content_released: boolean;
        };
        request_id_visible: boolean;
        status: string;
      };
    };
    kill_switch_drill: {
      plan: {
        decision: {
          model_request_blocked: boolean;
          safe_degradation_required: boolean;
          tool_execution_blocked: boolean;
        };
        safe_degradation: {
          user_visible_state: boolean;
        };
      };
    };
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    post_generation_evidence_binding: {
      route: string;
      status: string;
      version: string;
    };
    release_gate: {
      blockers: string[];
      gate_status: string;
      no_live_release_claim: boolean;
    };
    request_id: string;
    route: string;
    status: string;
    validation: Record<string, boolean>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface PublicationEconomicsReleaseGatePlanBody {
  data: {
    capability: {
      route: string;
      status: string;
    };
    docs_publication: {
      docs_manifest: {
        documents: Array<{
          kind: string;
          path: string;
          publication_status: string;
        }>;
      };
      help_center: {
        doc_path: string;
        help_topics: Array<{
          topic_code: string;
        }>;
        live_chat_enabled: boolean;
      };
      public_status_page: {
        status_page: {
          publication_status: string;
        };
      };
    };
    frontend: boolean;
    live_deployment_verified: boolean;
    live_finance_signoff: boolean;
    live_legal_approval: boolean;
    package_pricing: {
      catalog: {
        plans: Array<{
          amount_minor: number;
          plan_code: string;
        }>;
      };
    };
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      blockers: string[];
      gate_status: string;
      no_live_release_claim: boolean;
    };
    request_id: string;
    route: string;
    status: string;
    unit_economics: {
      plans: Array<{
        contribution_margin_positive: boolean;
        contribution_margin_ratio_bps: number;
        plan_code: string;
        target_margin_ratio_bps: number;
      }>;
    };
    validation: Record<string, boolean>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface SupportRuntimeBody {
  data: {
    default_sensitive_content_access: boolean;
    frontend: boolean;
    help_center_route: string;
    investigation_route: string;
    live_billing_provider_reads: boolean;
    live_log_reads: boolean;
    persistent_writes: boolean;
    request_id_required: boolean;
    route: string;
    sensitive_fields_forbidden_by_default: string[];
    sql_emitted: boolean;
    status: string;
    support_agent_required: boolean;
    support_help_topics: string[];
    support_lookup_fields: string[];
  };
  ok: true;
}

interface SupportHelpCenterBody {
  data: {
    capability: {
      status: string;
    };
    doc_path: string;
    help_topics: Array<{
      escalation_path: string;
      request_id_recommended: boolean;
      topic_code: string;
    }>;
    live_chat_enabled: boolean;
    persistent_writes: boolean;
    request_id_visible: boolean;
    route: string;
    sql_emitted: boolean;
    status: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface SupportInvestigationPlanBody {
  data: {
    audit: {
      audit_event: string;
      support_agent_id: string;
      table: string;
      write_status: string;
    };
    capability: {
      status: string;
    };
    help_center: {
      category: string;
      doc_path: string;
    };
    investigation: {
      allowed_lookup_fields: string[];
      billing_trace: {
        request_id_join: boolean;
        usage_event_id: string;
      };
      live_billing_provider_reads: boolean;
      live_log_reads: boolean;
      target_request_id: string;
    };
    persistent_writes: boolean;
    privacy: {
      default_sensitive_content_access: boolean;
      forbidden_fields: string[];
      include_sensitive_content_requested: boolean;
      sensitive_content_released: boolean;
    };
    request_id: string;
    request_id_visible: boolean;
    sql_emitted: boolean;
    status: string;
    support_ticket: {
      ticket_status: string;
    };
    validation: {
      required_context_present: boolean;
      sensitive_request_blocked: boolean;
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface PrivateSharingRuntimeBody {
  data: {
    capability_name: string;
    frontend: boolean;
    live_data_access: boolean;
    max_expires_in_hours: number;
    persistent_writes: boolean;
    recipient_data_rights_expansion: boolean;
    recipient_entitlement_recheck: boolean;
    required_scope: string;
    route: string;
    runtime_route: string;
    privacy_share_release_gate: {
      route: string;
      status: string;
      account_data_request_route: string;
      private_share_route: string;
      recipient_data_rights_expansion: boolean;
      share_expands_recipient_rights: boolean;
      required_checks: string[];
    };
    status: string;
    supported_statuses: string[];
    uses_data_access_gateway: boolean;
    watermark_required: boolean;
  };
  ok: true;
}

interface PrivateShareLinkPlanBody {
  data: {
    access_policy: {
      creator_allowed_fields: string[];
      effective_fields: string[];
      recipient_allowed_fields: string[];
      recipient_data_rights_expansion: boolean;
      recipient_entitlement_rechecked: boolean;
      redacted_fields: string[];
      release_state: string;
      share_expands_recipient_rights: boolean;
    };
    capability: {
      status: string;
    };
    frontend: boolean;
    gateway_decisions: {
      creator: {
        status: string;
      };
      recipient: {
        status: string;
      };
    };
    link: {
      link_handle_materialized: boolean;
      public_indexing: boolean;
      share_ref: string;
      url: string;
      visibility: string;
    };
    live_data_access: boolean;
    persistent_writes: boolean;
    request_id: string;
    scope: {
      creator: {
        granted: boolean;
        required: string;
      };
      recipient: {
        granted: boolean;
        required: string;
      };
    };
    sql_emitted: boolean;
    status: string;
    validation: {
      expiry_within_limit: boolean;
      required_context_present: boolean;
    };
    watermark: {
      required: boolean;
      text: string;
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface PrivacyShareReleaseGatePlanBody {
  data: {
    account_data_request_gate: {
      delete_plan: {
        execution_plan: Array<{
          action: string;
          scope: string;
        }>;
        status: string;
      };
      download_plan: {
        delivery: {
          download_status: string;
          secure_delivery_required: boolean;
        };
        status: string;
      };
    };
    capability: {
      status: string;
    };
    private_share_gate: {
      no_expansion_policy: {
        effective_fields: string[];
        recipient_data_rights_expansion: boolean;
        recipient_entitlement_rechecked: boolean;
        redacted_fields: string[];
        share_expands_recipient_rights: boolean;
      };
      plan: {
        link: {
          public_indexing: boolean;
          url: string;
        };
      };
    };
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      gate_status: string;
      no_live_release_claim: boolean;
    };
    request_id: string;
    route: string;
    sql_emitted: boolean;
    status: string;
    validation: {
      all_checks_passed: boolean;
      personal_data_delete_respects_retention_holds: boolean;
      personal_data_download_delivery_is_scoped_and_no_write: boolean;
      private_link_has_expiry_watermark_and_no_public_index: boolean;
      share_link_does_not_expand_rights: boolean;
      share_link_effective_fields_are_intersection: boolean;
      share_link_rechecks_recipient_entitlement: boolean;
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface AccountRuntimeBody {
  data: {
    auth_provider_calls: boolean;
    authorized_memory: {
      actual_memory_reads: boolean;
      allowed_keys: string[];
      editable: boolean;
      forbidden_payloads: string[];
      persistent_writes: boolean;
      route: string;
      status: string;
      supported_actions: string[];
      table: string;
      user_visible_controls: string[];
    };
    data_requests: {
      audit: {
        event_table: string;
        required: boolean;
        status: string;
      };
      deletion: {
        audit_log_retention: boolean;
        hard_delete_requires_policy_clearance: boolean;
        status: string;
      };
      frontend: boolean;
      live_data_export: boolean;
      persistent_writes: boolean;
      request_actions: string[];
      request_scopes: string[];
      retention_policy: {
        retention_hold_scopes: string[];
        source: string;
      };
      route: string;
      sql_emitted: boolean;
      status: string;
      user_visible_controls: string[];
    };
    device_management: {
      revoke_supported: boolean;
      status: string;
    };
    enterprise_controls: {
      frontend: boolean;
      live_directory_sync: boolean;
      live_identity_provider_calls: boolean;
      live_private_connector_calls: boolean;
      persistent_writes: boolean;
      plan_codes: string[];
      route: string;
      sql_emitted: boolean;
      status: string;
      supported_controls: string[];
    };
    forbidden_payloads: string[];
    frontend: boolean;
    login_methods: string[];
    manual_plan_assignment: {
      allowed_plan_codes: string[];
      billing_provider_calls: boolean;
      status: string;
    };
    package_pricing: {
      billing_provider_calls: boolean;
      currency: string;
      frontend: boolean;
      live_prices: boolean;
      persistent_writes: boolean;
      plan_codes: string[];
      route: string;
      sql_emitted: boolean;
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
    subscription_lifecycle: {
      audit: {
        event_table: string;
        required: boolean;
        status: string;
      };
      billing_provider_calls: boolean;
      frontend: boolean;
      persistent_writes: boolean;
      route: string;
      sql_emitted: boolean;
      status: string;
      supported_actions: string[];
    };
    tables: string[];
  };
  ok: true;
}

interface AccountPackagePricingBody {
  data: {
    assumptions: string[];
    billing_provider_calls: boolean;
    capability: {
      route: string;
      status: string;
    };
    catalog_version: string;
    currency: string;
    persistent_writes: boolean;
    plan_codes: string[];
    plans: Array<{
      amount_minor: number;
      display_price: string;
      entitlements: {
        api_key: boolean;
        bulk_pagination: boolean;
        multiple_mcp_connections: boolean;
        pro_web_entitlements: boolean;
      };
      overage: {
        billing_provider_calls: boolean;
        enabled: boolean;
        status: string;
      };
      plan_code: string;
      price_status: string;
      redistribution: {
        commercial_external_redistribution: boolean;
        export_requires_field_authorization: boolean;
        partner_rights_matrix_required: boolean;
      };
      usage_quota: {
        credit_limit: number;
        quota_contract: string;
      };
    }>;
    pricing_source: string;
    sql_emitted: boolean;
    status: string;
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface AccountAuthorizedMemoryPlanBody {
  data: {
    action: string;
    account: {
      account_id: string;
      table: string;
    };
    audit: {
      audit_event: string;
      request_id: string;
      write_status: string;
    };
    capability: {
      status: string;
    };
    memory: {
      allowed_fields: string[];
      allowed_keys: string[];
      delete_status: string;
      memory_refs: string[];
      read_status: string;
      table: string;
      unsupported_keys: string[];
      upsert_status: string;
    };
    persistent_writes: boolean;
    policy: {
      actual_memory_reads: boolean;
      authorized_information_only: boolean;
      credential_material_stored: boolean;
      financial_values_stored: boolean;
      forbidden_payload_fields: string[];
      generated_answers_stored: boolean;
      raw_prompt_stored: boolean;
      user_visible_controls: string[];
    };
    sql_emitted: boolean;
    status: string;
    validation: {
      allowed_memory_keys: string[];
      required_context_present: boolean;
      unsupported_memory_keys: string[];
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface AccountDataRequestPlanBody {
  data: {
    action: string;
    audit: {
      audit_event: string;
      policy_version: string;
      request_id: string;
      table: string;
      verified_by: string;
      write_status: string;
    };
    capability: {
      route: string;
      status: string;
    };
    delivery: {
      download_format: string;
      download_status: string;
      secure_delivery_required: boolean;
    };
    execution_plan: Array<{
      action: string;
      reason: string;
      scope: string;
      table: string;
    }>;
    persistent_writes: boolean;
    privacy: {
      credential_material_included: boolean;
      raw_email_included: boolean;
      raw_prompt_included: boolean;
      retained_for_audit_scopes: string[];
    };
    request: {
      request_id: string;
      request_status: string;
      scopes: string[];
      table: string;
      unsupported_scopes: string[];
    };
    retention_policy: {
      erasure_policy: string;
      policy_version: string;
      retention_hold_scopes: string[];
    };
    sql_emitted: boolean;
    status: string;
    validation: {
      audit_required: boolean;
      required_context_present: boolean;
      retention_policy_present: boolean;
      unsupported_scopes: string[];
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface AccountEnterpriseControlsPlanBody {
  data: {
    audit: {
      audit_event: string;
      raw_payload_stored: boolean;
      request_id: string;
      table: string;
      write_status: string;
    };
    capability: {
      route: string;
      status: string;
    };
    controls: {
      audit: {
        export_status: string;
        raw_payload_stored: boolean;
        retention_required: boolean;
      };
      private_data_connector: {
        connection_test_status: string;
        connector_kind: string;
        credential_material_stored: boolean;
        rights_gateway_required: boolean;
        write_status: string;
      };
      seats: {
        directory_sync_status: string;
        pending_invite_count: number;
        seat_limit: number;
        write_status: string;
      };
      sso: {
        credential_material_stored: boolean;
        domain_hash_provided: boolean;
        identity_provider_calls: boolean;
        metadata_validation_status: string;
        protocol: string;
        write_status: string;
      };
    };
    frontend: boolean;
    live_directory_sync: boolean;
    live_identity_provider_calls: boolean;
    live_private_connector_calls: boolean;
    persistent_writes: boolean;
    plan_code: string;
    requested_controls: string[];
    security: {
      credential_material_stored: boolean;
      default_deny_until_approved: boolean;
      partner_rights_matrix_required: boolean;
      raw_connection_string_included: boolean;
      raw_email_included: boolean;
    };
    sql_emitted: boolean;
    status: string;
    validation: {
      allowed_plan_codes: string[];
      enterprise_plan_required: boolean;
      required_context_present: boolean;
      unsupported_controls: string[];
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
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

interface AccountSubscriptionLifecyclePlanBody {
  data: {
    audit: {
      action: string;
      audit_event: string;
      actor_account_id: string;
      request_id: string;
      table: string;
      write_status: string;
    };
    billing_provider: {
      calls: boolean;
      invoice_preview: boolean;
      provider: string;
    };
    capability: {
      status: string;
    };
    persistent_writes: boolean;
    sql_emitted: boolean;
    status: string;
    subscription: {
      current_billing_state: string;
      current_plan_code: string;
      grace_period_ends_at?: string;
      lifecycle_status: string;
      subscription_id: string;
      target_billing_state: string;
      target_plan_code: string;
    };
    validation: {
      audit_required: boolean;
      required_context_present: boolean;
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface UsageRuntimeBody {
  data: {
    billing_rules_release_gate: {
      account_package_route: string;
      billing_provider_calls: boolean;
      billing_reconciliation_route: string;
      frontend: boolean;
      high_cost_reservation_route: string;
      invoice_writes: boolean;
      live_billing_provider: boolean;
      live_ledger_reads: boolean;
      live_ledger_writes: boolean;
      persistent_writes: boolean;
      quota_route: string;
      required_checks: string[];
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      subscription_route: string;
    };
    billing_reconciliation: {
      billing_provider_calls: boolean;
      freshness_target_minutes: number;
      live_ledger_reads: boolean;
      persistent_writes: boolean;
      request_id_visible: boolean;
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      trace_fields: string[];
    };
    high_cost_reservation: {
      failure_refund_required: boolean;
      live_ledger_writes: boolean;
      persistent_writes: boolean;
      pre_debit_required: boolean;
      request_id_visible: boolean;
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      usage_ledger_link_required: boolean;
    };
    partner_reconciliation_report: {
      billing_provider_calls: boolean;
      display_fields: string[];
      export_formats: string[];
      frontend: boolean;
      group_by: string[];
      live_ledger_reads: boolean;
      partner_sla_report: boolean;
      persistent_writes: boolean;
      raw_personal_contact_included: boolean;
      request_id_visible: boolean;
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      supported_cadences: string[];
      trace_fields: string[];
    };
    partner_sla_reconciliation_readiness: {
      frontend: boolean;
      group_by: string[];
      live_ledger_reads: boolean;
      live_partner_report_artifact_store: boolean;
      live_support_log_reads: boolean;
      partner_portal_delivery: boolean;
      partner_reconciliation_route: string;
      partner_support_release_gate_route: string;
      persistent_writes: boolean;
      required_checks: string[];
      required_sla_fields: string[];
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      supported_cadences: string[];
      trace_fields: string[];
    };
    partner_support_release_gate: {
      billing_provider_calls: boolean;
      frontend: boolean;
      live_ledger_reads: boolean;
      live_partner_report_artifact_store: boolean;
      live_support_log_reads: boolean;
      partner_portal_delivery: boolean;
      partner_reconciliation_route: string;
      persistent_writes: boolean;
      request_id_drill_required: boolean;
      required_checks: string[];
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      support_help_center_route: string;
      support_investigation_route: string;
      support_runtime_route: string;
    };
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

interface UsageBillingRulesReleaseGatePlanBody {
  data: {
    billing_reconciliation_gate: {
      plan: {
        consistency: {
          invoice_credits: number;
          ledger_credits: number;
          status: string;
        };
        traceability: {
          traceable_call_count: number;
          traceable_to_call: boolean;
        };
      };
    };
    capability: {
      route: string;
      status: string;
    };
    high_cost_gate: {
      failed_refund_plan: {
        failure_refund: {
          refund_credits: number;
          status: string;
        };
        reservation: {
          reservation_id: string;
        };
      };
      reservation_plan: {
        pre_debit: {
          pre_debit_credits: number;
          status: string;
        };
        reservation: {
          reservation_id: string;
        };
      };
    };
    live_billing_provider: boolean;
    live_invoice_writes: boolean;
    live_ledger_reads: boolean;
    package_rules: {
      developer_credit_limit: number;
      developer_overage_enabled: boolean;
      pro_credit_limit: number;
    };
    release_checks: Array<{
      check_id: string;
      status: string;
    }>;
    release_gate: {
      blockers: string[];
      status: string;
    };
    request_id: string;
    sql_emitted: boolean;
    status: string;
    subscription_rules: {
      lifecycle_plan: {
        billing_provider: {
          calls: boolean;
          proration_preview: boolean;
          refund_preview: boolean;
        };
      };
    };
    validation: Record<string, boolean>;
    workspace_id: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface UsagePartnerSupportReleaseGatePlanBody {
  data: {
    capability: {
      route: string;
      status: string;
    };
    frontend: boolean;
    live_ledger_reads: boolean;
    live_partner_report_artifact_store: boolean;
    live_support_log_reads: boolean;
    ops_drill: {
      request_ids_available: string[];
      target_request_id: string;
      usage_event_ids_available: string[];
    };
    partner_portal_delivery: boolean;
    partner_reconciliation_gate: {
      plan: {
        rows: Array<{
          channel: string;
          credits: number;
          dataset: string;
          missing_rows: number;
          package_code: string;
          request_ids: string[];
          sla_status: string;
          usage_count: number;
          user_id: string;
        }>;
        sla: {
          status: string;
        };
        status: string;
        traceability: {
          traceable_to_usage_ledger: boolean;
        };
      };
    };
    release_checks: Array<{
      check_id: string;
      status: string;
    }>;
    release_gate: {
      blockers: string[];
      status: string;
    };
    request_id: string;
    sql_emitted: boolean;
    status: string;
    support_investigation_gate: {
      plan: {
        investigation: {
          live_billing_provider_reads: boolean;
          live_log_reads: boolean;
          target_request_id: string;
        };
        privacy: {
          forbidden_fields: string[];
          sensitive_content_released: boolean;
        };
        status: string;
      };
    };
    validation: Record<string, boolean>;
    workspace_id: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface UsagePartnerSlaReconciliationReadinessBody {
  data: {
    capability: {
      route: string;
      status: string;
    };
    daily_report: {
      period: {
        cadence: string;
      };
      rows: unknown[];
      status: string;
    };
    frontend: boolean;
    live_ledger_reads: boolean;
    live_partner_report_artifact_store: boolean;
    live_support_log_reads: boolean;
    partner_portal_delivery: boolean;
    readiness: Record<string, boolean>;
    release_checks: Array<{
      check_id: string;
      status: string;
    }>;
    release_gate: {
      blockers: string[];
      status: string;
    };
    request_id: string;
    sla_summary: {
      backfill_count: number;
      daily_line_count: number;
      delayed_line_count: number;
      error_count: number;
      missing_rows: number;
      weekly_line_count: number;
    };
    sql_emitted: boolean;
    status: string;
    support_release_gate: {
      validation: {
        all_checks_passed: boolean;
      };
    };
    usage_fixture_rows: unknown[];
    weekly_report: {
      period: {
        cadence: string;
      };
      sla: {
        required_fields: string[];
        status: string;
      };
      status: string;
      traceability: {
        traceable_to_usage_ledger: boolean;
        traceable_usage_event_count: number;
      };
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface UsageBillingReconciliationPlanBody {
  data: {
    billing_provider: {
      calls: boolean;
      invoice_link_live: boolean;
      provider: string;
    };
    capability: {
      status: string;
    };
    consistency: {
      credit_delta: number;
      invoice_credits: number;
      ledger_credits: number;
      status: string;
    };
    freshness_target_minutes: number;
    invoice: {
      amount_minor: number;
      invoice_id: string;
      source: string;
      table: string;
    };
    invoice_lines: Array<{
      credit_delta: number;
      invoice_line_id: string;
      ledger_entry_id: string;
      request_id: string;
      trace_status: string;
      usage_event_id: string;
    }>;
    live_ledger_reads: boolean;
    persistent_writes: boolean;
    request_id: string;
    request_id_visible: boolean;
    sql_emitted: boolean;
    status: string;
    subscription_id: string;
    traceability: {
      support_investigation_by_request_id: boolean;
      traceable_call_count: number;
      traceable_to_call: boolean;
    };
    workspace_id: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface UsagePartnerReconciliationReportPlanBody {
  data: {
    audit: {
      audit_event: string;
      write_status: string;
    };
    billing_provider_calls: boolean;
    capability: {
      status: string;
    };
    export: {
      artifact_writes: boolean;
      raw_payment_identifiers_included: boolean;
      raw_personal_contact_included: boolean;
      selected_format: string;
    };
    frontend: boolean;
    live_ledger_reads: boolean;
    partner_id: string;
    persistent_writes: boolean;
    privacy: {
      credential_material_included: boolean;
      raw_email_included: boolean;
      raw_payment_identifier_included: boolean;
    };
    report: {
      export_status: string;
      group_by: string[];
      source: string;
      table: string;
    };
    request_id: string;
    request_id_visible: boolean;
    rows: Array<{
      backfill_count: number;
      channel: string;
      credits: number;
      data_delay_minutes_max: number;
      dataset: string;
      missing_rows: number;
      package_code: string;
      request_ids: string[];
      sla_status: string;
      usage_count: number;
      usage_event_ids: string[];
      user_id: string;
    }>;
    sla: {
      daily_weekly_report: boolean;
      status: string;
    };
    sql_emitted: boolean;
    status: string;
    summary: {
      credit_total: number;
      dataset_count: number;
      line_count: number;
      missing_rows: number;
      usage_count_total: number;
      user_count: number;
    };
    traceability: {
      traceable_to_usage_ledger: boolean;
      traceable_usage_event_count: number;
    };
    workspace_id: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface UsageHighCostReservationPlanBody {
  data: {
    capability: {
      status: string;
    };
    double_charge_guard: {
      idempotency_key: string;
      same_request_reuses_reservation: boolean;
    };
    estimate: {
      credits: number;
      source: string;
    };
    failure_refund: {
      refund_credits: number;
      required: boolean;
      status: string;
    };
    live_ledger_writes: boolean;
    persistent_writes: boolean;
    pre_debit: {
      pre_debit_credits: number;
      required: boolean;
      status: string;
    };
    request_id: string;
    request_id_visible: boolean;
    reservation: {
      status: string;
      subscription_id: string;
      task_id: string;
      tool_name: string;
      workspace_id: string;
    };
    sql_emitted: boolean;
    status: string;
    usage_ledger_link_required: boolean;
    user_confirmed: boolean;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface WatchlistRuntimeBody {
  data: {
    briefings: {
      evidence_required: boolean;
      frontend: boolean;
      live_tool_execution: boolean;
      material_changes_only: boolean;
      notification_fanout: boolean;
      persistent_writes: boolean;
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      supported_cadences: string[];
      tables: string[];
    };
    create_alert_scope: string;
    dedupe_ready: boolean;
    event_queue: string;
    explicit_confirmation_required: boolean;
    frequency_controls: boolean;
    frontend: boolean;
    independent_scope_required: boolean;
    live_tool_execution: boolean;
    notification_fanout: boolean;
    persistent_writes: boolean;
    quiet_period_controls: boolean;
    route: string;
    runtime_route: string;
    source_required: boolean;
    sql_emitted: boolean;
    status: string;
    supported_alert_kinds: string[];
    supported_channels: string[];
    supported_frequencies: string[];
    tables: string[];
  };
  ok: true;
}

interface WatchlistBriefingPlanBody {
  data: {
    as_of: string;
    briefing: {
      cadence: string;
      max_items: number;
      material_changes_only: boolean;
      status: string;
      table: string;
      watchlist_id: string;
      write_status: string;
    };
    capability: {
      evidence_required: boolean;
      route: string;
      status: string;
    };
    channels: string[];
    evidence_index: {
      evidence_required: boolean;
      item_table: string;
      source_record_id_required: boolean;
    };
    frontend: boolean;
    live_tool_execution: boolean;
    materiality_filter: {
      empty_briefing_policy: string;
      min_materiality_score: number;
      only_substantive_changes: boolean;
    };
    notification: {
      channels: string[];
      evidence_required: boolean;
      event_queue: string;
      fanout_status: string;
    };
    persistence_plan: {
      live_db_writes: boolean;
      queue_writes: boolean;
      sql_emitted: boolean;
      tables: string[];
      write_status: string;
    };
    source_plan: {
      announcement_source: {
        live_tool_execution: boolean;
        source_tool: string;
      };
      metric_source: {
        live_tool_execution: boolean;
        source_tool: string;
      };
      price_source: {
        live_tool_execution: boolean;
        source_tool: string;
      };
    };
    sql_emitted: boolean;
    status: string;
    timezone: string;
    toolName: string;
    validation: {
      required_context_present: boolean;
      watchlist_required: boolean;
    };
  };
  ok: true;
  usage: {
    cached: boolean;
    credits: number;
    rows: number;
  };
}

interface WatchlistAlertsPlanBody {
  data: {
    alert_rule: {
      alert_kinds: string[];
      explicit_confirmation: boolean;
      idempotency_key: string;
      independent_scope: string;
      table: string;
      write_status: string;
    };
    capability: {
      alert_planner_route?: string;
      explicit_confirmation_required: boolean;
      idempotency_key_required?: boolean;
      independent_scope_required?: boolean;
      persistent_writes?: boolean;
      route: string;
      status: string;
      tool_name?: string;
    };
    channels: string[];
    dedupe: {
      duplicate_policy: string;
      source_record_id_required: boolean;
      window_minutes: number;
    };
    evaluation_plan: {
      announcement_alert: {
        live_tool_execution: boolean;
        source_tool: string;
        status: string;
      };
      metric_alert: {
        live_tool_execution: boolean;
        metric_ids: string[];
        source_tool: string;
        status: string;
      };
      price_alert: {
        condition: {
          comparator: string;
          field: string;
          threshold?: number;
        };
        live_tool_execution: boolean;
        source_tool: string;
        status: string;
      };
    };
    frequency: {
      frequency: string;
      max_notifications_per_period: number;
      quiet_period: {
        enabled: boolean;
        end?: string;
        start?: string;
        timezone: string;
      };
    };
    frontend: boolean;
    live_tool_execution: boolean;
    notification: {
      channels: string[];
      evidence_required: boolean;
      event_queue: string;
      fanout_status: string;
      notification_write_status: string;
    };
    persistence_plan: {
      live_db_writes: boolean;
      queue_writes: boolean;
      sql_emitted: boolean;
      tables: string[];
      write_status: string;
    };
    planner?: {
      route: string;
      tool_name: string;
      version: string;
    };
    request_id: string;
    sql_emitted: boolean;
    status: string;
    toolName: string;
    validation: {
      explicit_confirmation_provided: boolean;
      explicit_confirmation_required: boolean;
      idempotency_key_required: boolean;
      required_context_present: boolean;
      scope_required: string;
    };
    watchlist: {
      instrument_id?: string;
      security_query?: string;
      watchlist_id: string;
      watchlist_item_table: string;
      watchlist_table: string;
      write_status: string;
    };
    workspace: {
      user_id: string;
      workspace_id: string;
    };
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
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
    event_study: {
      abnormal_return_method: string;
      formula_version: string;
      route: string;
      sample_missing_policy: string;
      status: string;
      tool_name: string;
    };
    financial_ratios: {
      formula_version: string;
      route: string;
      status: string;
      tool_name: string;
    };
    high_cost_analytics_queue: {
      high_cost_threshold: number;
      independent_concurrency_pool: boolean;
      max_parallel_high_cost: number;
      queue_name: string;
      route: string;
      status: string;
      tool_name: string;
    };
    buybacks_and_placements: {
      authorized_market_statistics_required: boolean;
      event_types: string[];
      route: string;
      status: string;
      tool_name: string;
    };
    consensus_or_estimates: {
      redistribution_rights_required: boolean;
      route: string;
      status: string;
      tool_name: string;
    };
    market_breadth: {
      authorized_market_statistics_required: boolean;
      route: string;
      status: string;
      tool_name: string;
    };
    ownership_and_short_selling: {
      authorized_market_statistics_required: boolean;
      route: string;
      status: string;
      tool_name: string;
    };
    percentile_comparison: {
      benchmark_types: string[];
      formula_version: string;
      route: string;
      status: string;
      tool_name: string;
    };
    portfolio_analytics: {
      authorized_holdings_required: boolean;
      personalized_advice: boolean;
      route: string;
      status: string;
      tool_name: string;
      trading_advice: boolean;
    };
    returns_risk: {
      formula_version: string;
      golden_tolerance: number;
      route: string;
      status: string;
      tool_name: string;
    };
    saved_screening: {
      live_db_writes: boolean;
      periodic_run_planning: boolean;
      route: string;
      status: string;
      tool_name: string;
      workflow_execution: boolean;
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

interface PortfolioAnalyticsBody {
  data: {
    allocation: {
      included_position_count: number;
      total_market_value: number;
    };
    authorization: {
      authorized_holdings_required: boolean;
      authorized_holdings_supplied: boolean;
      portfolio_scope: string;
    };
    capability: {
      route: string;
      status: string;
      tool_name: string;
    };
    concentration: {
      issuer_count: number;
      top_position_weight: number;
    };
    frontend_rendering: boolean;
    live_data_access: boolean;
    positions: Array<{
      source_record_ids: string[];
      status: string;
      symbol?: string;
      weight?: number;
    }>;
    risk_summary: {
      computed_position_count: number;
      portfolio_beta?: number;
      portfolio_total_return?: number;
    };
    sql_emitted: boolean;
    status: string;
    toolName: string;
    trading_advice: {
      buy_sell_hold_recommendation: boolean;
      personalized_advice: boolean;
      rebalance_instruction: boolean;
    };
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface MarketBreadthBody {
  data: {
    authorization: {
      authorized_market_statistics_required: boolean;
      authorized_market_statistics_supplied: boolean;
      dataset_scope: string;
    };
    breadth: {
      advance_decline_ratio: number;
      advances: number;
      declines: number;
      industry_width: Array<{
        industry: string;
      }>;
      turnover_concentration_top5: number;
      unchanged: number;
    };
    capability: {
      route: string;
      status: string;
      tool_name: string;
    };
    frontend_rendering: boolean;
    live_data_access: boolean;
    market: string;
    source_record_ids: string[];
    sql_emitted: boolean;
    status: string;
    toolName: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface OwnershipShortSellingBody {
  data: {
    authorization: {
      authorized_market_statistics_supplied: boolean;
    };
    capability: {
      route: string;
      status: string;
      tool_name: string;
    };
    frontend_rendering: boolean;
    live_data_access: boolean;
    ownership: {
      shareholding_disclosures: Array<{
        holder_type: string;
        holding_percent: number;
      }>;
      top_holder_concentration: number;
    };
    security: {
      instrument_id?: string;
      symbol?: string;
    };
    short_selling: {
      short_turnover: number;
      short_turnover_ratio: number;
    };
    source_record_ids: string[];
    sql_emitted: boolean;
    status: string;
    toolName: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface BuybacksPlacementsBody {
  data: {
    capital_events: Array<{
      event_type: string;
      source_record_id: string;
      status: string;
    }>;
    capability: {
      route: string;
      status: string;
      tool_name: string;
    };
    frontend_rendering: boolean;
    live_data_access: boolean;
    source_record_ids: string[];
    sql_emitted: boolean;
    status: string;
    toolName: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface ConsensusEstimatesBody {
  data: {
    capability: {
      redistribution_rights_required: boolean;
      route: string;
      status: string;
      tool_name: string;
    };
    consensus: {
      analyst_count: number;
      target_price: {
        median: number;
      };
    };
    estimates: Array<{
      fiscal_year: number;
      mean: number;
      metric_id: string;
      source_record_ids: string[];
    }>;
    frontend_rendering: boolean;
    investment_advice: boolean;
    live_data_access: boolean;
    raw_provider_payload: boolean;
    rights: {
      redistribution_rights_confirmed: boolean;
      redistribution_rights_required: boolean;
      rights_scope: string;
    };
    security: {
      instrument_id?: string;
      symbol?: string;
    };
    source_record_ids: string[];
    sql_emitted: boolean;
    status: string;
    toolName: string;
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface HighCostAnalyticsPlanBody {
  data: {
    capability: {
      route: string;
      status: string;
    };
    cost_estimate: {
      credit_weight: number;
      high_cost_threshold: number;
      rows_estimate: number;
    };
    durable_queue_writes: boolean;
    enqueue_plan: {
      planned_task_id?: string;
      queue_key?: string;
      status: string;
    };
    frontend_rendering: boolean;
    live_data_access: boolean;
    scheduling_decision: {
      concurrency_pool: string;
      independent_pool_required: boolean;
      max_parallel: number;
      queue_name?: string;
      queue_required: boolean;
    };
    status: string;
    toolName: string;
    usage_policy: {
      failure_refund_required: boolean;
      pre_debit_required: boolean;
      user_confirmed: boolean;
    };
    usage_reservation: {
      failure_refund: {
        refund_credits: number;
        required: boolean;
        status: string;
      };
      live_ledger_writes: boolean;
      persistent_writes: boolean;
      pre_debit: {
        pre_debit_credits: number;
        required: boolean;
        status: string;
      };
      reservation: {
        status: string;
        subscription_id: string;
        task_id: string;
        tool_name: string;
        workspace_id: string;
      };
      status: string;
      usage_ledger_link_required: boolean;
      user_confirmed: boolean;
    };
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface PercentileComparisonBody {
  data: {
    capability: {
      formula_version: string;
      route: string;
      status: string;
    };
    comparisons: Array<{
      benchmark_type: string;
      constituent_as_of: string;
      constituents: Array<{
        included_from: string;
        instrument_id: string;
        symbol: string;
      }>;
      history_observations: Array<{
        as_of: string;
        value: number;
      }>;
      live_constituents: boolean;
      percentile_rank?: number;
      point_in_time: boolean;
      sample_count: number;
      status: string;
    }>;
    formula_version: string;
    frontend_rendering: boolean;
    instrument_id?: string;
    live_data_access: boolean;
    metric_id: string;
    point_in_time_policy: {
      benchmark_as_of: string;
      classification_as_of: string;
      live_constituents: boolean;
      no_future_constituents: boolean;
    };
    status: string;
    subject: {
      metric_id: string;
      source_tool: string;
      status: string;
      value?: number;
    };
    toolName: string;
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
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

interface EventStudyBody {
  data: {
    benchmark: {
      instrument_id?: string;
      label: string;
      price_history_status: string;
    };
    capability: {
      formula_version: string;
      route: string;
      status: string;
    };
    event: {
      event_date: string;
      event_id: string;
    };
    event_window: {
      from: string;
      requested_observation_count: number;
      to: string;
    };
    frontend_rendering: boolean;
    instrument_id?: string;
    live_data_access: boolean;
    methodology: {
      abnormal_return_method: string;
      formula_version: string;
      sample_missing_policy: string;
    };
    missing_observations: Array<{
      date: string;
      reason: string;
      relative_day: number;
    }>;
    observations: Array<{
      abnormal_return?: number;
      benchmark_return?: number;
      date: string;
      relative_day: number;
      security_return?: number;
      status: string;
    }>;
    price_history_status: string;
    status: string;
    summary: {
      computed_observation_count: number;
      cumulative_abnormal_return?: number;
      cumulative_benchmark_return?: number;
      cumulative_security_return?: number;
      missing_observation_count: number;
      requested_observation_count: number;
    };
    toolName: string;
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
    point_in_time_guard: {
      classification_as_of: string;
      future_data_policy: string;
      requested_as_of: string;
      security_master_as_of: string;
      status: string;
      uses_latest_classification: boolean;
    };
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

interface SavedScreeningPlanBody {
  data: {
    capability: {
      periodic_run_planning: boolean;
      route: string;
      status: string;
      tool_name: string;
    };
    frontend_rendering: boolean;
    live_data_access: boolean;
    live_execution: boolean;
    periodic_run_policy: {
      high_cost_queue_route: string;
      point_in_time_re_evaluation: boolean;
      queue_writes: boolean;
      source_tool: string;
      workflow_execution: boolean;
    };
    persistence_plan: {
      live_db_writes: boolean;
      sql_emitted: boolean;
      tables: string[];
      write_status: string;
    };
    saved_screening: {
      parsed_conditions: Array<{
        field: string;
        operator: string;
        value: number;
      }>;
      query_hash: string;
      screen_status: string;
      status: string;
      workspace_id?: string;
    };
    schedule: {
      cadence: string;
      enabled: boolean;
      next_run_at?: string;
      notification_channels: string[];
      timezone: string;
    };
    source_screen: {
      status: string;
    };
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

interface DocumentRuntimeBody {
  data: {
    package: string;
    route: string;
    runtime_route: string;
    search_announcements: {
      evidence_locator_ready: boolean;
      original_document_fetch: boolean;
      route: string;
      status: string;
      tool_name: string;
      untrusted_document_policy: boolean;
      vector_search: boolean;
    };
    get_announcement: {
      allowed_excerpt_scope: string;
      evidence_locator_ready: boolean;
      original_document_fetch: boolean;
      route: string;
      sanitizer_enabled: boolean;
      status: string;
      tool_name: string;
      untrusted_document_policy: boolean;
      vector_search: boolean;
    };
    document_sanitizer: {
      applied_route: string;
      hidden_text_removed: boolean;
      output_contains_raw_html: boolean;
      raw_excerpt_returned: boolean;
      scripts_executable: boolean;
      status: string;
      tool_invocation_allowed_from_document: boolean;
      tool_name: string;
    };
    search_documents: {
      index_name: string;
      live_pgvector: boolean;
      metadata_filter_pushdown: boolean;
      pgvector_first: boolean;
      route: string;
      search_engine: string;
      status: string;
      tool_name: string;
      vector_search: boolean;
      vectorize_optional: boolean;
    };
    diff_announcements: {
      comparison_engine: string;
      evidence_binding_ready: boolean;
      original_document_fetch: boolean;
      route: string;
      schema_id: string;
      schema_validation_ready: boolean;
      status: string;
      tool_name: string;
      untrusted_document_policy: boolean;
      vector_search: boolean;
    };
    user_public_data_join_privacy: {
      custom_layout_metadata_only: boolean;
      document_sanitizer_required: boolean;
      field_authorization_required: boolean;
      gateway_access_route: string;
      join_execution_live: boolean;
      live_upload_storage: boolean;
      public_data_live_read: boolean;
      raw_file_body_persisted: boolean;
      route: string;
      status: string;
      tool_name: string;
    };
    status: string;
  };
  ok: true;
}

interface SearchAnnouncementsBody {
  data: {
    capability: {
      evidence_locator_ready: boolean;
      original_document_fetch: boolean;
      route: string;
      status: string;
      untrusted_document_policy: boolean;
      vector_search: boolean;
    };
    document_trust_policy: {
      content_is_untrusted_data: boolean;
      prompt_injection_isolated: boolean;
      scripts_executable: boolean;
    };
    evidence_locator_ready: boolean;
    filters: {
      date_basis: string;
      from: string;
      keyword?: string;
      to: string;
    };
    frontend_rendering: boolean;
    instrument_id?: string;
    live_data_access: boolean;
    original_document_fetch: boolean;
    resolve_security?: {
      status: string;
    };
    results: Array<{
      category: string;
      document_id: string;
      evidence_locator: {
        anchor: string;
        external_href_authority: boolean;
        locator_type: string;
        original_url: string;
        page: number;
      };
      language: string;
      matched_fields: string[];
      published_at: string;
      source_record_id: string;
      title: string;
      untrusted_document: boolean;
    }>;
    row_count: number;
    search_engine: string;
    status: string;
    toolName: string;
    vector_search: boolean;
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface GetAnnouncementBody {
  data: {
    allowed_sections: string[];
    capability: {
      allowed_excerpt_scope: string;
      evidence_locator_ready: boolean;
      original_document_fetch: boolean;
      route: string;
      status: string;
      tool_name: string;
      untrusted_document_policy: boolean;
      vector_search: boolean;
    };
    document_id?: string;
    document_trust_policy: {
      content_is_untrusted_data: boolean;
      prompt_injection_isolated: boolean;
      scripts_executable: boolean;
    };
    excerpts: Array<{
      authorization: {
        excerpt_scope: string;
        full_text_returned: boolean;
        max_excerpt_chars: number;
        truncated: boolean;
      };
      evidence_locator: {
        anchor: string;
        document_id: string;
        external_href_authority: boolean;
        locator_type: string;
        original_url: string;
        page: number;
        paragraph: number;
        source_record_id: string;
      };
      excerpt: string;
      sanitization: {
        document_instruction_executed: boolean;
        raw_excerpt_returned: boolean;
        removed_items: string[];
        sanitizer_version: string;
        status: string;
      };
      section_id: string;
      section_title: string;
      untrusted_document: boolean;
    }>;
    excerpts_authorized: boolean;
    frontend_rendering: boolean;
    full_document_returned: boolean;
    live_data_access: boolean;
    original_document_fetch: boolean;
    row_count: number;
    sanitization_policy: {
      hidden_text_removed: boolean;
      output_contains_raw_html: boolean;
      scripts_removed: boolean;
      suspicious_instructions_neutralized: boolean;
      tool_invocation_allowed_from_document: boolean;
    };
    sanitization_summary: {
      raw_document_instructions_ignored: boolean;
      removed_item_count: number;
      sections_sanitized: number;
      sections_reviewed: number;
    };
    source?: {
      source_record_id: string;
      symbol: string;
    };
    status: string;
    toolName: string;
    vector_search: boolean;
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface SearchDocumentsBody {
  data: {
    capability: {
      index_name: string;
      live_pgvector: boolean;
      metadata_filter_pushdown: boolean;
      pgvector_first: boolean;
      route: string;
      search_engine: string;
      tool_name: string;
      vector_search: boolean;
      vectorize_optional: boolean;
    };
    document_trust_policy: {
      content_is_untrusted_data: boolean;
      prompt_injection_isolated: boolean;
      scripts_executable: boolean;
    };
    filters: {
      date_basis: string;
      query: string;
    };
    frontend_rendering: boolean;
    index: {
      index_name: string;
      metadata_filter_pushdown: boolean;
      pgvector_first: boolean;
      vectorize_optional: boolean;
    };
    live_data_access: boolean;
    live_pgvector: boolean;
    original_document_fetch: boolean;
    result_count: number;
    results: Array<{
      chunk_id: string;
      document_id: string;
      evidence_locator: {
        page: number;
        paragraph: number;
        source_record_id: string;
      };
      rank: number;
      sanitized_snippet: string;
      score_explanation: string[];
      section_id: string;
      similarity_score: number;
      source_record_id: string;
      title: string;
      untrusted_document: boolean;
    }>;
    search_engine: string;
    status: string;
    toolName: string;
    vector_search: boolean;
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface DiffAnnouncementsBody {
  data: {
    capability: {
      comparison_engine: string;
      evidence_binding_ready: boolean;
      route: string;
      schema_id: string;
      schema_validation_ready: boolean;
      tool_name: string;
      vector_search: boolean;
    };
    comparison_engine: string;
    diff_count: number;
    diffs: Array<{
      absolute_change: number;
      base_value: number;
      comparison_value: number;
      evidence_locators: {
        base: {
          page: number;
          paragraph: number;
          source_record_id: string;
        };
        comparison: {
          page: number;
          paragraph: number;
          source_record_id: string;
        };
      };
      field_id: string;
      percent_change: number;
      schema_valid: boolean;
      unit: string;
    }>;
    document_trust_policy: {
      content_is_untrusted_data: boolean;
      prompt_injection_isolated: boolean;
      scripts_executable: boolean;
    };
    documents: {
      base?: {
        document_id: string;
        source_record_id: string;
        symbol: string;
      };
      comparison?: {
        document_id: string;
        source_record_id: string;
        symbol: string;
      };
    };
    evidence_binding_ready: boolean;
    extracted_value_count: number;
    extracted_values: Array<{
      document_id: string;
      evidence_locator: {
        document_id: string;
        page: number;
        paragraph: number;
        source_record_id: string;
      };
      field_id: string;
      schema_valid: boolean;
      source_record_id: string;
      value: number;
    }>;
    frontend_rendering: boolean;
    live_data_access: boolean;
    original_document_fetch: boolean;
    row_count: number;
    schema_validation: {
      errors: string[];
      schema_id: string;
      valid: boolean;
      validated_value_count: number;
    };
    schema_validation_ready: boolean;
    sql_emitted: boolean;
    status: string;
    toolName: string;
    vector_search: boolean;
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface UserPublicDataJoinPrivacyBody {
  data: {
    blockers: string[];
    boundaries: {
      frontend_rendering: boolean;
      join_execution_live: boolean;
      live_upload_storage: boolean;
      persistent_writes: boolean;
      public_data_live_read: boolean;
      raw_file_body_persisted: boolean;
      sql_emitted: boolean;
    };
    capability: {
      field_authorization_required: boolean;
      route: string;
      status: string;
      tool_name: string;
    };
    custom_layout: {
      layout_id: string;
      layout_metadata_only: boolean;
      layout_scope: string;
      references_public_data_scope_by_id_only: boolean;
      references_user_file_by_id_only: boolean;
      save_status: string;
    };
    join_plan: {
      join_execution_live: boolean;
      join_key_policy: string;
      join_keys: string[];
      public_output_contains_user_private_data: boolean;
      row_level_workspace_filter: boolean;
    };
    privacy_contract: {
      consent_required: boolean;
      cross_workspace_join: boolean;
      document_sanitizer_required: boolean;
      field_authorization_required: boolean;
      public_data_rights_expansion: boolean;
    };
    prd_items: string[];
    public_data: {
      field_authorization_policy_id?: string;
      gateway_access_route: string;
      gateway_export_route: string;
      public_data_live_read: boolean;
      requested_fields: string[];
      scope?: string;
    };
    route: string;
    runtime_route: string;
    status: string;
    toolName: string;
    user_file: {
      content_is_untrusted_data: boolean;
      file_id?: string;
      file_sha256?: string;
      raw_file_body_persisted: boolean;
      upload_storage_live: boolean;
      user_file_scope: string;
    };
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
    response_presentation: {
      actual_tool_execution: boolean;
      data_contract_invariant: boolean;
      default_locale: string;
      default_response_depth: string;
      frontend: boolean;
      locale_switch_changes_data: boolean;
      model_calls: boolean;
      response_depth_changes_data: boolean;
      route: string;
      status: string;
      supported_locales: string[];
      supported_response_depths: string[];
      terminology_glossary_ready: boolean;
      version: string;
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
        post_generation_validator_ready: boolean;
        post_generation_validator_route: string;
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
    kill_switch: {
      actual_tool_execution: boolean;
      frontend: boolean;
      live_flag_reads: boolean;
      model_calls: boolean;
      model_kill_switch_ready: boolean;
      persistent_writes: boolean;
      route: string;
      safe_degradation_ready: boolean;
      status: string;
      tool_kill_switch_ready: boolean;
      version: string;
    };
    workflow_tasks: {
      actual_workflow_execution: boolean;
      binding: string;
      disconnect_safe: boolean;
      event_queue: string;
      frontend: boolean;
      live_workflow_execution: boolean;
      notification_plan: boolean;
      persistent_writes: boolean;
      resume_route: string;
      route: string;
      sql_emitted: boolean;
      status: string;
      task_id_visible: boolean;
    };
    product_agent_release_gate: {
      actual_tool_execution: boolean;
      frontend_rendering: boolean;
      live_db_writes: boolean;
      live_tool_execution: boolean;
      model_calls: boolean;
      persistent_writes: boolean;
      preflight_route: string;
      required_checks: string[];
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      tool_loop_route: string;
      version: string;
    };
    agent_label_budget_release_gate: {
      actual_tool_execution: boolean;
      analytics_high_cost_route: string;
      frontend_rendering: boolean;
      live_db_writes: boolean;
      live_queue_writes: boolean;
      live_tool_execution: boolean;
      model_calls: boolean;
      persistent_writes: boolean;
      required_checks: string[];
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      tool_loop_route: string;
      usage_reservation_route: string;
      version: string;
    };
    task_replay_mode_release_gate: {
      actual_tool_execution: boolean;
      frontend_rendering: boolean;
      live_db_writes: boolean;
      live_queue_writes: boolean;
      live_tool_execution: boolean;
      live_workflow_execution: boolean;
      localized_response_route: string;
      model_calls: boolean;
      persistent_writes: boolean;
      required_checks: string[];
      research_replay_route: string;
      research_save_route: string;
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      version: string;
      workflow_task_route: string;
    };
    prompt_injection_tool_denial_release_gate: {
      actual_tool_execution: boolean;
      document_sanitizer_route: string;
      frontend_rendering: boolean;
      live_db_writes: boolean;
      live_document_fetch: boolean;
      live_tool_execution: boolean;
      model_calls: boolean;
      persistent_writes: boolean;
      required_checks: string[];
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      tool_loop_route: string;
      version: string;
    };
    agent_user_run_persistence_release_gate: {
      actual_tool_execution: boolean;
      agent_billing_posted_ledger_smoke_route: string;
      agent_run_live_write_smoke_route: string;
      agent_run_state_persistence_smoke_route: string;
      frontend_rendering: boolean;
      live_db_writes: boolean;
      live_tool_execution: boolean;
      model_calls: boolean;
      persistent_writes: boolean;
      production_persistence_enabled: boolean;
      required_checks: string[];
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      version: string;
    };
    agent_ai_gateway_observability_release_gate: {
      actual_tool_execution: boolean;
      ai_gateway_observability_smoke_command: string;
      ai_gateway_observability_smoke_script: string;
      frontend_rendering: boolean;
      live_ai_gateway_reads: boolean;
      live_db_writes: boolean;
      live_model_execution: boolean;
      model_calls: boolean;
      model_execution_audit_smoke_route: string;
      model_provider_readiness_contract: string;
      model_routing_audit_contract: string;
      persistent_writes: boolean;
      required_checks: string[];
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      version: string;
    };
    agent_live_model_streaming_release_gate: {
      actual_tool_execution: boolean;
      ai_gateway_observability_release_gate_route: string;
      backend_progress_stream_route: string;
      frontend_rendering: boolean;
      generated_answer_evidence_smoke_route: string;
      live_model_streaming: boolean;
      live_tool_loop_smoke_route: string;
      model_calls: boolean;
      model_execution_audit_smoke_route: string;
      persistent_writes: boolean;
      required_checks: string[];
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      version: string;
    };
    agent_user_tool_loop_execution_release_gate: {
      actual_tool_execution: boolean;
      arbitrary_user_tool_loop_execution: boolean;
      budget_stop_policy_route: string;
      failure_recovery_policy_route: string;
      fixed_tool_execution_evidence_smoke_route: string;
      frontend_rendering: boolean;
      live_db_writes: boolean;
      live_model_execution: boolean;
      live_tool_execution: boolean;
      live_tool_loop_smoke_route: string;
      model_calls: boolean;
      persistent_writes: boolean;
      preflight_route: string;
      required_checks: string[];
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      tool_enforcement_route: string;
      tool_loop_route: string;
      user_run_persistence_release_gate_route: string;
      version: string;
    };
    agent_model_output_corpus_release_gate: {
      actual_tool_execution: boolean;
      eval_v1_contract: string;
      frontend_rendering: boolean;
      generated_answer_evidence_smoke_route: string;
      live_model_output_corpus_enabled: boolean;
      live_model_streaming_release_gate_route: string;
      live_smoke_evidence_ledger_contract: string;
      model_calls: boolean;
      model_execution_audit_smoke_route: string;
      persistent_eval_writes: boolean;
      persistent_writes: boolean;
      production_sampling_enabled: boolean;
      required_checks: string[];
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      unsourced_numeric_sampling_contract: string;
      version: string;
    };
    agent_token_cost_fallback_release_gate: {
      actual_tool_execution: boolean;
      ai_gateway_observability_release_gate_route: string;
      billing_posted_ledger_smoke_route: string;
      frontend_rendering: boolean;
      live_token_cost_fallback_log_writes: boolean;
      model_calls: boolean;
      model_execution_audit_smoke_route: string;
      model_routing_audit_contract: string;
      persistent_writes: boolean;
      production_cost_ledger_enabled: boolean;
      required_checks: string[];
      route: string;
      run_tool_audit_fields_contract: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      user_run_persistence_release_gate_route: string;
      version: string;
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

interface AgentKillSwitchPlanBody {
  data: {
    actual_tool_execution: boolean;
    capability: {
      live_flag_reads: boolean;
      model_kill_switch_ready: boolean;
      route: string;
      safe_degradation_ready: boolean;
      status: string;
      tool_kill_switch_ready: boolean;
    };
    decision: {
      degraded: boolean;
      degradation_mode: string;
      model_calls_allowed: boolean;
      model_request_blocked: boolean;
      safe_degradation_required: boolean;
      tool_execution_allowed: boolean;
      tool_execution_blocked: boolean;
    };
    frontend: boolean;
    live_flag_reads: boolean;
    model_calls: boolean;
    persistent_writes: boolean;
    reason?: string;
    route: string;
    safe_degradation: {
      deterministic_calculation_allowed: boolean;
      evidence_required_for_reused_outputs: boolean;
      partial_answer_allowed: boolean;
      unknown_label_required: boolean;
      user_visible_state: boolean;
    };
    status: string;
    switch_state: {
      model_kill_switch: boolean;
      target: string;
      tool_kill_switch: boolean;
    };
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface PromptInjectionToolDenialReleaseGatePlanBody {
  data: {
    actual_tool_execution: boolean;
    capability: {
      required_checks: string[];
      route: string;
      status: string;
    };
    frontend_rendering: boolean;
    live_document_fetch: boolean;
    live_tool_execution: boolean;
    model_calls: boolean;
    prompt_injection_gate: {
      document_result: {
        document_trust_policy: {
          content_is_untrusted_data: boolean;
          prompt_injection_isolated: boolean;
        };
        sanitization_summary: {
          raw_document_instructions_ignored: boolean;
          sections_sanitized: number;
        };
      };
      document_sanitizer_capability: {
        prompt_injection_isolated: boolean;
        tool_invocation_allowed_from_document: boolean;
      };
      malicious_document_id: string;
      malicious_section_id: string;
      removed_items: string[];
      sanitized_excerpt_contains_script: boolean;
      sanitized_excerpt_contains_tool_instruction: boolean;
    };
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      gate_status: string;
      no_live_release_claim: boolean;
      required_signoffs: string[];
    };
    tool_denial_gate: {
      baseline_tool_enforcement: {
        allow_arbitrary_sql: boolean;
        allow_arbitrary_url: boolean;
        all_checks_passed: boolean;
        status: string;
      };
      denied_tool_probes: Array<{
        denied_pre_execution: boolean;
        denied_tools: string[];
        kind: string;
        requested_tool: string;
        runtime_error_code: string;
        status: string;
      }>;
    };
    validation: Record<string, boolean>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface AgentLabelBudgetReleaseGatePlanBody {
  data: {
    actual_tool_execution: boolean;
    capability: {
      required_checks: string[];
      route: string;
      status: string;
    };
    claim_label_gate: {
      evidence_strength: {
        confidence_score_display: boolean;
      };
      required_claim_labels: string[];
      sample_claim_controls: Array<{
        effective: boolean;
        label: string;
        required_binding: string;
      }>;
      validation_rules: string[];
    };
    frontend_rendering: boolean;
    high_cost_budget_gate: {
      confirmed_plan: {
        enqueue_plan: {
          status: string;
        };
        scheduling_decision: {
          concurrency_pool: string;
          independent_pool_required: boolean;
        };
        status: string;
      };
      confirmation_required_before_enqueue: boolean;
      failure_refund_required: boolean;
      pre_debit_required: boolean;
      reservation_after_confirmation: {
        pre_debit: {
          status: string;
        };
        status: string;
        user_confirmed: boolean;
      };
      reservation_before_confirmation: {
        pre_debit: {
          status: string;
        };
        status: string;
        user_confirmed: boolean;
      };
      unconfirmed_plan: {
        cost_estimate: {
          credit_weight: number;
        };
        enqueue_plan: {
          status: string;
        };
        status: string;
        usage_policy: {
          requires_confirmation_before_enqueue: boolean;
        };
      };
      usage_ledger_link_required: boolean;
    };
    live_queue_writes: boolean;
    live_tool_execution: boolean;
    model_calls: boolean;
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      gate_status: string;
      no_live_release_claim: boolean;
      required_signoffs: string[];
    };
    validation: Record<string, boolean>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface TaskReplayModeReleaseGatePlanBody {
  data: {
    actual_tool_execution: boolean;
    capability: {
      required_checks: string[];
      route: string;
      status: string;
    };
    frontend_rendering: boolean;
    live_db_writes: boolean;
    live_queue_writes: boolean;
    live_tool_execution: boolean;
    live_workflow_execution: boolean;
    mode_invariant_gate: {
      changed_surface: {
        newbie_response_depth: string;
        professional_response_depth: string;
      };
      localized_response_capability: {
        response_depth_changes_data: boolean;
      };
      shared_contract: {
        newbie_depth_invariant: boolean;
        professional_depth_invariant: boolean;
        response_depth_changes_data: boolean;
        same_evidence_contract: boolean;
        same_numeric_source_policy: boolean;
        same_tool_policy: boolean;
      };
    };
    model_calls: boolean;
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      gate_status: string;
      no_live_release_claim: boolean;
      required_signoffs: string[];
    };
    saved_report_replay_gate: {
      old_report: {
        immutable_report_snapshot: boolean;
        mutation_allowed: boolean;
        preserved_snapshot_id: string;
        silent_rewrite_allowed: boolean;
      };
      replay_diff: {
        changed: boolean;
        data_changed: boolean;
      };
      replay_execution: {
        execution_status: string;
        live_model_call: boolean;
        live_tool_execution: boolean;
      };
      replay_snapshot_id: string;
      saved_snapshot_id: string;
      save_replay_seed: {
        deterministic_replay_ready: boolean;
        replay_route: string;
        snapshot_id: string;
      };
    };
    status: string;
    validation: Record<string, boolean>;
    version: string;
    workflow_resume_gate: {
      checkpoint_state_table: string;
      disconnect_safe: boolean;
      resume: {
        resume_handle: string;
        resume_route: string;
        resumable: boolean;
      };
      task_id: string;
      task_id_visible: boolean;
      workflow: {
        binding: string;
        start_status: string;
      };
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface AgentUserRunPersistenceReleaseGatePlanBody {
  data: {
    actual_tool_execution: boolean;
    capability: {
      required_checks: string[];
      route: string;
      status: string;
    };
    frontend_rendering: boolean;
    live_db_writes: boolean;
    live_tool_execution: boolean;
    model_calls: boolean;
    persistent_writes: boolean;
    production_cutover_allowed: boolean;
    production_cutover_requested: boolean;
    production_persistence_enabled: boolean;
    production_prerequisites: Array<{
      requirement: string;
      status: string;
    }>;
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      blockers: string[];
      gate_status: string;
      no_live_release_claim: boolean;
      required_signoffs: string[];
    };
    smoke_gates: Array<{
      check_script: string;
      contract: string;
      hash_only_response: boolean;
      route: string;
      smoke_gate: string;
      status: string;
    }>;
    validation: Record<string, boolean>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface AgentAiGatewayObservabilityReleaseGatePlanBody {
  data: {
    actual_tool_execution: boolean;
    capability: {
      required_checks: string[];
      route: string;
      status: string;
    };
    evidence_requirements: Array<{
      requirement: string;
      status: string;
    }>;
    frontend_rendering: boolean;
    linked_evidence: Array<{
      command?: string;
      contract?: string;
      covers: string[];
      route?: string;
      script?: string;
      status: string;
      surface: string;
    }>;
    live_ai_gateway_reads: boolean;
    live_db_writes: boolean;
    live_model_execution: boolean;
    model_calls: boolean;
    persistent_writes: boolean;
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      blockers: string[];
      gate_status: string;
      no_live_release_claim: boolean;
      required_signoffs: string[];
    };
    release_transition_allowed: boolean;
    validation: Record<string, boolean>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface AgentLiveModelStreamingReleaseGatePlanBody {
  data: {
    actual_tool_execution: boolean;
    capability: {
      required_checks: string[];
      route: string;
      status: string;
    };
    evidence_requirements: Array<{
      requirement: string;
      status: string;
    }>;
    frontend_rendering: boolean;
    linked_evidence: Array<{
      command?: string;
      contract?: string;
      covers: string[];
      route?: string;
      status: string;
      surface: string;
    }>;
    live_model_execution: boolean;
    live_model_streaming: boolean;
    model_calls: boolean;
    persistent_writes: boolean;
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      blockers: string[];
      gate_status: string;
      no_live_release_claim: boolean;
      required_signoffs: string[];
    };
    release_transition_allowed: boolean;
    validation: Record<string, boolean>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface AgentModelOutputCorpusReleaseGatePlanBody {
  data: {
    actual_tool_execution: boolean;
    capability: {
      required_checks: string[];
      route: string;
      status: string;
    };
    evidence_requirements: Array<{
      requirement: string;
      status: string;
    }>;
    frontend_rendering: boolean;
    linked_evidence: Array<{
      command: string;
      contract: string;
      covers: string[];
      route?: string;
      status: string;
      surface: string;
    }>;
    live_model_output_corpus_enabled: boolean;
    model_calls: boolean;
    persistent_eval_writes: boolean;
    persistent_writes: boolean;
    production_sampling_enabled: boolean;
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      blockers: string[];
      gate_status: string;
      no_live_release_claim: boolean;
      required_signoffs: string[];
    };
    release_transition_allowed: boolean;
    validation: Record<string, boolean>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface AgentTokenCostFallbackReleaseGatePlanBody {
  data: {
    actual_tool_execution: boolean;
    capability: {
      required_checks: string[];
      route: string;
      status: string;
    };
    evidence_requirements: Array<{
      requirement: string;
      status: string;
    }>;
    frontend_rendering: boolean;
    linked_evidence: Array<{
      command: string;
      contract: string;
      covers: string[];
      route?: string;
      status: string;
      surface: string;
    }>;
    live_token_cost_fallback_log_writes: boolean;
    model_calls: boolean;
    persistent_writes: boolean;
    production_cost_ledger_enabled: boolean;
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      blockers: string[];
      gate_status: string;
      no_live_release_claim: boolean;
      required_signoffs: string[];
    };
    release_transition_allowed: boolean;
    validation: Record<string, boolean>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface AgentUserToolLoopExecutionReleaseGatePlanBody {
  data: {
    actual_tool_execution: boolean;
    arbitrary_user_tool_loop_execution: boolean;
    capability: {
      required_checks: string[];
      route: string;
      status: string;
    };
    evidence_requirements: Array<{
      requirement: string;
      status: string;
    }>;
    frontend_rendering: boolean;
    linked_evidence: Array<{
      command: string;
      contract: string;
      covers: string[];
      route: string;
      status: string;
      surface: string;
    }>;
    live_db_writes: boolean;
    live_model_execution: boolean;
    live_tool_execution: boolean;
    model_calls: boolean;
    persistent_writes: boolean;
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      blockers: string[];
      gate_status: string;
      no_live_release_claim: boolean;
      required_signoffs: string[];
    };
    release_transition_allowed: boolean;
    validation: Record<string, boolean>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface ProductAgentReleaseGatePlanBody {
  data: {
    actual_tool_execution: boolean;
    ambiguous_security_gate: {
      ambiguous_candidate_count: number;
      clarification_required: boolean;
      input_security_query: string;
      preflight: {
        clarification_required: boolean;
        clarifications: Array<{
          field: string;
          reason: string;
        }>;
        security: {
          resolved: unknown[];
        };
        status: string;
        tool_readiness: {
          can_plan_tools: boolean;
        };
      };
      silent_selection_allowed: boolean;
      tool_planning_allowed: boolean;
    };
    answer_contract_gate: {
      calculation_requires_calculation_ref: boolean;
      evidence_card_required_fields: string[];
      fact_requires_evidence_card: boolean;
      required_claim_labels: string[];
      unknown_requires_missing_reason: boolean;
      validation_rules: string[];
    };
    capability: {
      required_checks: string[];
      route: string;
      status: string;
    };
    frontend_rendering: boolean;
    live_tool_execution: boolean;
    model_calls: boolean;
    numeric_evidence_gate: {
      allowed_sources: string[];
      blocked_sources: string[];
      concrete_claims_allowed_now: boolean;
      concrete_numbers_allowed_without_sources: boolean;
      deterministic_calculation_count: number;
      failure_code: string;
      planned_tool_result_source_count: number;
      post_generation_sourced_probe_allowed: boolean;
      post_generation_unsourced_probe_blocked: boolean;
      post_generation_validation: string;
      post_generation_validator_route: string;
      requires_calculation_ref: boolean;
      requires_source_record_ref: boolean;
      validation_rules: string[];
    };
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      blockers: string[];
      gate_status: string;
      no_live_release_claim: boolean;
      required_signoffs: string[];
    };
    validation: Record<string, boolean>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface ToolRuntimeBody {
  data: {
    allow_arbitrary_sql: boolean;
    allow_arbitrary_url: boolean;
    breaking_changes_require_new_major: boolean;
    deprecation_policy_ready: boolean;
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
      lifecycle: {
        breakingChangesRequireNewMajor: boolean;
        deprecation: {
          minimumNoticeDays: number;
          status: string;
        };
        majorVersion: number;
        publicVersion: string;
      };
      name: string;
      permissions: {
        rightsAware: boolean;
      };
      schema: {
        standardResponseEnvelope: boolean;
      };
    }>;
    versioning_ready: boolean;
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

interface SecurityHistoryBody {
  data: {
    capability: {
      as_of_required: boolean;
      handler_ready: boolean;
      live_data_access: boolean;
      point_in_time_policy: {
        uses_latest_classification: boolean;
        uses_latest_constituents: boolean;
        uses_latest_name: boolean;
      };
      status: string;
      supported_history_types: string[];
    };
    history: {
      activeConstituentMemberships: Array<{
        benchmarkSymbol: string;
        validFrom: string;
      }>;
      activeIndustry: {
        industry: string;
        sector: string;
        validFrom: string;
        validTo?: string;
      };
      activeName: {
        name: {
          en: string;
        };
        validFrom: string;
      };
      pointInTimePolicy: {
        asOfRequired: boolean;
        usesLatestClassification: boolean;
        usesLatestConstituents: boolean;
        usesLatestName: boolean;
      };
    };
    liveDataAccess: boolean;
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

interface CorporateActionBenchmarkParityBody {
  data: {
    capability: {
      live_partner_data: boolean;
      live_serving_reads: boolean;
      minimum_complex_cases: number;
      partner_reference_cases: number;
      public_reference_cases: number;
      sample_count: number;
      status: string;
    };
    failures: unknown[];
    livePartnerData: boolean;
    liveServingReads: boolean;
    passed: boolean;
    passedCount: number;
    sampleCount: number;
    sourceCounts: {
      partner_reference: number;
      public_exchange_reference: number;
    };
    sqlEmitted: boolean;
    status: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface EventTimelineBody {
  data: {
    capability: {
      company_and_market_events: boolean;
      cursor_pagination: boolean;
      handler_ready: boolean;
      live_data_access: boolean;
      related_data_links: boolean;
      source_record_required: boolean;
      status: string;
      supported_event_types: string[];
    };
    liveDataAccess: boolean;
    requestedTypes: string[];
    status: string;
    timeline: {
      events: Array<{
        date: string;
        eventScope: string;
        eventType: string;
        relatedData: Array<{
          sourceRecordId: string;
        }>;
        sourceRecordId: string;
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

interface ResearchRuntimeBody {
  data: {
    data_correction_notifications: {
      affected_report_marking_required: boolean;
      event_queue: string;
      evidence_snapshot_marking_required: boolean;
      frontend_rendering: boolean;
      live_db_writes: boolean;
      live_tool_execution: boolean;
      notification_fanout: boolean;
      persistent_writes: boolean;
      route: string;
      runtime_route: string;
      saved_report_notification_required: boolean;
      sql_emitted: boolean;
      status: string;
      supported_notification_channels: string[];
      tables: string[];
      tool_name: string;
    };
    golden_correction_rollback_drill: {
      correction_route: string;
      frontend_rendering: boolean;
      golden_fixture_command: string;
      golden_manifest_path: string;
      live_db_writes: boolean;
      live_rollback_execution: boolean;
      persistent_writes: boolean;
      replay_route: string;
      required_steps: string[];
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      tables: string[];
      tool_golden_manifest_path: string;
    };
    deep_report_workflow: {
      citation_validation_required: boolean;
      evidence_index_required: boolean;
      live_db_writes: boolean;
      live_tool_execution: boolean;
      live_workflow_execution: boolean;
      model_calls: boolean;
      replay_route: string;
      route: string;
      stages: string[];
      status: string;
      tool_name: string;
      workflow_binding: string;
    };
    static_report_artifact: {
      artifact_writes: boolean;
      data_delay_required: boolean;
      disclaimer_required: boolean;
      generated_at_required: boolean;
      live_db_writes: boolean;
      required_scope: string;
      route: string;
      runtime_route: string;
      status: string;
      tool_name: string;
      watermark_required: boolean;
    };
    immutable_report_snapshot: boolean;
    live_db_writes: boolean;
    replay_diff_ready: boolean;
    replay_route: string;
    replay_seed_ready: boolean;
    required_fields: string[];
    route: string;
    runtime_route: string;
    sql_emitted: boolean;
    status: string;
    supported_diffs: string[];
    supported_snapshots: string[];
    tables: string[];
    tool_name: string;
  };
  ok: true;
}

interface DeepReportWorkflowPlanBody {
  data: {
    capability: ResearchRuntimeBody["data"]["deep_report_workflow"];
    citation_validation: {
      every_claim_requires_evidence: boolean;
      required: boolean;
      unsupported_claim_label: string;
    };
    data_fetch_plan: {
      live_tool_execution: boolean;
      registered_tools_only: boolean;
      required_tools: string[];
      status: string;
    };
    deterministic_analysis_plan: {
      deterministic_calculations: boolean;
      model_calls: boolean;
      status: string;
    };
    evidence_index: {
      evidence_index_id: string;
      records: Array<{
        citation_status: string;
        evidence_record_id: string;
        section_id: string;
        source_record_ids: string[];
      }>;
      table: string;
    };
    frontend_rendering: boolean;
    live_db_writes: boolean;
    live_tool_execution: boolean;
    model_calls: boolean;
    persistence_plan: {
      checkpoint_writes: boolean;
      live_db_writes: boolean;
      r2_writes: boolean;
      sql_emitted: boolean;
      tables: string[];
      write_status: string;
    };
    report_id: string;
    report_snapshot: {
      data_delay_minutes: number;
      disclaimer: string;
      immutable_report_snapshot: boolean;
      snapshot_id: string;
      static_report_allowed: boolean;
      table: string;
    };
    rerun: {
      data_model_parameter_diff_ready: boolean;
      deterministic_replay_ready: boolean;
      old_report_mutation_allowed: boolean;
      replay_route: string;
      saved_snapshot_id: string;
      silent_rewrite_allowed: boolean;
    };
    section_plan: {
      generation_status: string;
      model_calls: boolean;
      sections: string[];
    };
    sql_emitted: boolean;
    stages: Array<{
      live_tool_execution: boolean;
      model_calls: boolean;
      order: number;
      stage_id: string;
      status: string;
    }>;
    status: string;
    task_id: string;
    toolName: string;
    usage_estimate: {
      debit_status: string;
      estimated_credits: number;
      failure_refund_ready: boolean;
      high_cost_confirmation_required: boolean;
    };
    workflow: {
      binding: string;
      checkpoint_writes: boolean;
      execution_status: string;
      live_execution: boolean;
      provider: string;
      queue_writes: boolean;
      task_id: string;
    };
    workflow_task: {
      task_id: string;
      task: {
        task_kind: string;
        status: string;
      };
      notification: {
        completion_notification: string;
        failure_notification: string;
        required: boolean;
      };
      resume: {
        resume_route: string;
        resumable: boolean;
      };
      workflow: {
        binding: string;
        execution_ready: boolean;
        start_status: string;
      };
    };
    workflow_task_id: string;
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface StaticReportPlanBody {
  data: {
    artifact: {
      html: string;
      image: string;
      pdf: string;
      public_url: string;
      r2_write: boolean;
      written: boolean;
    };
    capability: ResearchRuntimeBody["data"]["static_report_artifact"];
    frontend_rendering: boolean;
    live_db_writes: boolean;
    live_tool_execution: boolean;
    metadata: {
      data_delay_minutes: number;
      data_version: string;
      disclaimer: string;
      generated_at: string;
      methodology_version: string;
      rights_policy_version: string;
    };
    model_calls: boolean;
    persistence_plan: {
      artifact_writes: boolean;
      live_db_writes: boolean;
      r2_writes: boolean;
      sql_emitted: boolean;
      write_status: string;
    };
    report: {
      format: string;
      report_id: string;
      source_run_id: string;
      static_report_allowed: boolean;
      table: string;
    };
    request_id: string;
    rights_boundary: {
      allowed_scope_only: boolean;
      raw_partner_data_embedded: boolean;
      redistribution_requires_rights_policy: boolean;
      required_scope: string;
      scope_granted: boolean;
    };
    sql_emitted: boolean;
    status: string;
    toolName: string;
    validation: {
      metadata_complete: boolean;
      required_context_present: boolean;
      supported_format: boolean;
    };
    watermark: {
      required: boolean;
      text: string;
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface ResearchRunSavePlanBody {
  data: {
    answer_snapshot: {
      answer_hash?: string;
      output_hash_recorded: boolean;
    };
    capability: {
      immutable_report_snapshot: boolean;
      live_db_writes: boolean;
      replay_diff_ready: boolean;
      replay_route: string;
      replay_seed_ready: boolean;
      route: string;
      status: string;
      tool_name: string;
    };
    evidence_snapshot: {
      evidence_record_count: number;
      records: Array<{
        document_location?: {
          document_id?: string;
          page?: number;
          paragraph?: number;
          source_record_id?: string;
        };
        evidence_record_id: string;
        source_record_ids: string[];
      }>;
      snapshot_hash: string;
    };
    immutable_report_snapshot: boolean;
    live_db_writes: boolean;
    model_snapshot: {
      model_provider: string;
      model_version: string;
      prompt_template_id?: string;
      prompt_version: string;
    };
    parameter_snapshot: {
      parameter_hash: string;
      parameters: Record<string, unknown>;
      parameters_recorded: boolean;
    };
    persistence_plan: {
      old_report_mutation_allowed: boolean;
      sql_emitted: boolean;
      tables: string[];
      write_status: string;
    };
    question_snapshot: {
      question: string;
      question_hash: string;
    };
    replay_seed: {
      deterministic_replay_ready: boolean;
      replay_route: string;
      replay_status: string;
      snapshot_id: string;
    };
    research_run_id: string;
    schema_validation: {
      errors: string[];
      required_fields: string[];
      valid: boolean;
    };
    snapshot_id: string;
    sql_emitted: boolean;
    status: string;
    tool_input_snapshot: {
      tool_call_count: number;
      tool_calls: Array<{
        input_hash: string;
        input_schema_id?: string;
        input_snapshot: unknown;
        request_id: string;
        tool_name: string;
      }>;
    };
    toolName: string;
    user: {
      source: string;
      user_id: string;
    };
    workspace: {
      source: string;
      workspace_id: string;
    };
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface ResearchRunReplayPlanBody {
  data: {
    capability: {
      live_db_writes: boolean;
      replay_diff_ready: boolean;
      replay_route: string;
      replay_tool_name: string;
    };
    current_run_plan: ResearchRunSavePlanBody["data"];
    diff_summary: {
      categories: string[];
      changed: boolean;
      data_changed: boolean;
      model_changed: boolean;
      parameters_changed: boolean;
    };
    diffs: {
      data: {
        changed: boolean;
        changed_source_record_ids: string[];
        current_source_record_ids: string[];
        data_version_changed: boolean;
        previous_source_record_ids: string[];
      };
      model: {
        changed: boolean;
        current_model_version: string;
        current_prompt_version: string;
        model_version_changed: boolean;
        previous_model_version: string;
        prompt_version_changed: boolean;
      };
      parameters: {
        added_keys: string[];
        changed: boolean;
        changed_keys: string[];
        question_changed: boolean;
        removed_keys: string[];
        tool_input_changed: boolean;
      };
    };
    old_report: {
      immutable_report_snapshot: boolean;
      mutation_allowed: boolean;
      preserved_snapshot_id: string;
      silent_rewrite_allowed: boolean;
    };
    replay_execution: {
      execution_status: string;
      live_model_call: boolean;
      live_tool_execution: boolean;
      sql_emitted: boolean;
    };
    replay_reason?: string;
    replay_snapshot_id: string;
    route: string;
    saved_snapshot_id: string;
    sql_emitted: boolean;
    status: string;
    toolName: string;
  };
  ok: true;
}

interface DataCorrectionNotificationPlanBody {
  data: {
    affected_reports: {
      count: number;
      items: Array<{
        evidence_record_ids: string[];
        impacted_source_record_ids: string[];
        notification_required: boolean;
        research_run_id: string;
        snapshot_id: string;
        table: string;
        user_id: string;
        workspace_id: string;
        write_status: string;
      }>;
      marking_status: string;
    };
    capability: ResearchRuntimeBody["data"]["data_correction_notifications"];
    corrections: Array<{
      corrected_data_version: string;
      correction_event_id: string;
      previous_data_version?: string;
      reason: string;
      severity: string;
      source_record_id: string;
      table: string;
      write_status: string;
    }>;
    frontend_rendering: boolean;
    live_db_writes: boolean;
    live_tool_execution: boolean;
    notification_fanout: boolean;
    notification_plan: {
      channels: string[];
      event_queue: string;
      fanout_status: string;
      notification_required: boolean;
      notifications: Array<{
        channel: string;
        fanout_status: string;
        research_run_id: string;
        snapshot_id: string;
        table: string;
        user_id: string;
        workspace_id: string;
      }>;
      table: string;
      user_notification_count: number;
    };
    persistence_plan: {
      live_db_writes: boolean;
      queue_writes: boolean;
      sql_emitted: boolean;
      tables: string[];
      write_status: string;
    };
    replay: {
      old_report_mutation_allowed: boolean;
      replay_route: string;
      rerun_recommended: boolean;
      silent_rewrite_allowed: boolean;
    };
    sql_emitted: boolean;
    status: string;
    toolName: string;
    validation: {
      affected_reports_present: boolean;
      corrections_present: boolean;
      required_context_present: boolean;
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface GoldenCorrectionRollbackDrillPlanBody {
  data: {
    capability: ResearchRuntimeBody["data"]["golden_correction_rollback_drill"];
    correction_notification_plan: Omit<DataCorrectionNotificationPlanBody["data"], "capability">;
    drill_steps: Array<{
      live_execution: boolean;
      order: number;
      status: string;
      step_id: string;
    }>;
    frontend_rendering: boolean;
    golden_fixture_gate: {
      command: string;
      manifest_path: string;
      passed: boolean;
      production_partner_corpus_loaded: boolean;
      quality_rule_count: number;
      sample_count: number;
      status: string;
      tool_golden_manifest_path: string;
      tool_sample_count: number;
      version: string;
    };
    live_db_writes: boolean;
    live_rollback_execution: boolean;
    persistence_plan: {
      live_db_writes: boolean;
      queue_writes: boolean;
      sql_emitted: boolean;
      tables: string[];
      write_status: string;
    };
    request_id: string;
    rollback_replay_plan: {
      diff_summary: {
        changed: boolean;
        data_changed: boolean;
      };
      old_report: {
        immutable_report_snapshot: boolean;
        mutation_allowed: boolean;
        preserved_snapshot_id: string;
        silent_rewrite_allowed: boolean;
      };
      replay_execution: {
        execution_status: string;
        live_model_call: boolean;
        live_tool_execution: boolean;
        sql_emitted: boolean;
      };
      replay_snapshot_id: string;
      saved_snapshot_id: string;
      sql_emitted: boolean;
      status: string;
    };
    sql_emitted: boolean;
    status: string;
    toolName: string;
    validation: {
      correction_plan_ready: boolean;
      golden_fixture_gate_passed: boolean;
      old_report_immutable: boolean;
      required_context_present: boolean;
      rollback_replay_ready: boolean;
    };
  };
  ok: true;
  usage: {
    credits: number;
    rows: number;
  };
}

interface McpRuntimeBody {
  data: {
    api_key_create_route: string;
    api_key_hash_storage_ready: boolean;
    api_key_ip_allowlist_ready: boolean;
    api_key_one_time_display_ready: boolean;
    api_key_revoke_route: string;
    api_key_revoke_enforced_before_new_calls: boolean;
    api_key_rotate_route: string;
    api_key_rotation_old_key_denied: boolean;
    api_key_rotation_ready: boolean;
    api_key_runtime_route: string;
    breaking_changes_require_new_major: boolean;
    cursor_pagination_ready: boolean;
    default_deny: boolean;
    deprecation_policy_ready: boolean;
    live_tool_execution: boolean;
    max_row_limit_enforced: boolean;
    mcp_api_redistribution_rights_confirmed: boolean;
    mcp_compatibility_status_ready: boolean;
    mcp_compatibility_status_route: string;
    mcp_compatibility_status_version: string;
    mcp_live_client_e2e_passed: boolean;
    mcp_auth_limits_release_gate_ready: boolean;
    mcp_auth_limits_release_gate_required_checks: string[];
    mcp_auth_limits_release_gate_route: string;
    mcp_auth_limits_release_gate_version: string;
    mcp_target_clients_console_release_gate_ready: boolean;
    mcp_target_clients_console_release_gate_required_checks: string[];
    mcp_target_clients_console_release_gate_route: string;
    mcp_target_clients_console_release_gate_version: string;
    mcp_target_client_e2e_matrix_ready: boolean;
    mcp_developer_console_backend_ready: boolean;
    mcp_developer_console_forbidden_fields: string[];
    mcp_developer_console_live: boolean;
    mcp_developer_console_log_fields: string[];
    mcp_developer_console_required_checks: string[];
    mcp_developer_console_route: string;
    mcp_developer_console_version: string;
    mcp_client_maturity_ready: boolean;
    mcp_client_maturity_required_checks: string[];
    mcp_client_maturity_route: string;
    mcp_client_maturity_version: string;
    mcp_interactive_apps_live: boolean;
    mcp_prompts_live: boolean;
    mcp_resources_live: boolean;
    mcp_protocol_release_gate_ready: boolean;
    mcp_protocol_release_gate_required_checks: string[];
    mcp_protocol_release_gate_route: string;
    mcp_protocol_release_gate_version: string;
    mcp_target_protocol_version: string;
    developer_console_reconciliation_ready: boolean;
    oauth_authorize_route: string;
    oauth_live: boolean;
    oauth_pkce_ready: boolean;
    oauth_revoke_enforced_before_new_calls: boolean;
    oauth_revoke_route: string;
    oauth_token_route: string;
    origin_validation: boolean;
    pagination_limits_ready: boolean;
    pagination_limits_version: string;
    pagination_or_rights_bypass_blocked: boolean;
    route: string;
    runtime_route: string;
    runtime_schema_serving: boolean;
    runtime_schema_snapshot_route: string;
    runtime_schema_snapshot_version: string;
    schema_source_contract: string;
    scopes_revocable: boolean;
    mcp_revocation_enforcement_error_code: string;
    mcp_revocation_enforcement_live: boolean;
    mcp_revocation_enforcement_ready: boolean;
    mcp_revocation_enforcement_route: string;
    mcp_revocation_enforcement_version: string;
    mcp_error_detail_fields: string[];
    standard_error_categories: string[];
    standard_error_code_version: string;
    standard_error_codes: string[];
    standard_error_codes_ready: boolean;
    standard_error_definitions: Array<{
      category: string;
      client_action: string;
      code: string;
      recoverable: boolean;
      retry_after_required: boolean;
      source_record_id: string;
    }>;
    status: string;
    structured_content_output_schema_ready: boolean;
    time_range_limits_ready: boolean;
    tool_call_input_strict_validation: boolean;
    tool_schema_validation_version: string;
    tools_list_schema_snapshot: boolean;
    tool_versioning_ready: boolean;
    usage_envelope_ready: boolean;
    usage_envelope_version: string;
    usage_remaining_ready: boolean;
    usage_request_id_visible: boolean;
    usage_reconciliation_ready: boolean;
    monitored_protocol_versions: string[];
    supported_oauth_scopes: string[];
    supported_methods: string[];
    transport: string;
    web_rights_do_not_imply_mcp: boolean;
  };
  ok: true;
}

interface McpRuntimeSchemaSnapshotBody {
  data: {
    live_tool_execution: boolean;
    package: string;
    protocol_route: string;
    route: string;
    runtime_schema_serving: boolean;
    schema_dialect: string;
    schema_snapshot_version: string;
    schema_source_contract: string;
    status: string;
    tool_count: number;
    tools: Array<{
      input_schema_id: string;
      name: string;
      output_schema_id: string;
      schema_snapshot: {
        input_schema: {
          additional_properties_allowed: boolean;
          allowed_properties: string[];
          id: string;
          required: string[];
        };
        output_schema: {
          id: string;
          raw_text_only_response_allowed: boolean;
          structured_content_required: boolean;
        };
        schema_source_contract: string;
      };
    }>;
    tools_list_schema_snapshot: boolean;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface McpCompatibilityStatusBody {
  data: {
    capability: {
      live_client_e2e_passed: boolean;
      production_sdk_channel: string;
      public_status_page_live: boolean;
      status: string;
      status_route: string;
      target_protocol_version: string;
    };
    inspector: {
      live_inspector_smoke: boolean;
      planned_command: string;
      required_checks: string[];
      target: string;
    };
    live_client_e2e_passed: boolean;
    monitored_protocol_versions: string[];
    protocol_route: string;
    release_gate: {
      live_client_smoke_required_before_ga: boolean;
      local_contract_required: string;
      remote_mcp_rights_required: boolean;
    };
    sdk: {
      latest_seen_v1_release: string;
      live_sdk_smoke: boolean;
      production_channel: string;
      v2_channel_status: string;
    };
    status: string;
    status_page: {
      public_status_page_live: boolean;
      route: string;
      shows_last_successful_client_smoke: boolean;
      shows_open_incidents: boolean;
      shows_protocol_version: boolean;
    };
    target_clients: Array<{
      live_e2e_passed: boolean;
      name: string;
      status: string;
    }>;
    target_protocol_version: string;
    test_vectors: Array<{
      live_smoke_passed: boolean;
      local_contract_ready: boolean;
      name: string;
    }>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface McpProtocolReleaseGatePlanBody {
  data: {
    auth_gate: {
      active_credential_plan?: {
        denial: {
          decision: string;
          denied: boolean;
          enforced_before_tool_execution: boolean;
        };
      };
      denied_error: {
        code: string;
        standard_error_code: string;
      };
      live_auth_middleware: boolean;
      rights_denied_error: {
        code: string;
        standard_error_code: string;
      };
    };
    capability: {
      live_auth_middleware: boolean;
      live_client_e2e_passed: boolean;
      route: string;
      status: string;
      streamable_http_ready: boolean;
    };
    compatibility_gate: {
      live_client_e2e_passed: boolean;
      target_protocol_version: string;
      test_vectors: Array<{
        local_contract_ready: boolean;
        name: string;
      }>;
    };
    frontend_rendering: boolean;
    live_auth_middleware: boolean;
    live_client_e2e_passed: boolean;
    live_tool_execution: boolean;
    model_calls: boolean;
    origin_gate: {
      allowed_origin_check: {
        required: boolean;
        valid: boolean;
      };
      denied_error: {
        code: string;
        standard_error_code: string;
      };
    };
    protocol_gate: {
      initialize?: {
        protocol_version: string;
      };
      protocol: {
        json_rpc: string;
        streamable_http: boolean;
      };
      transport: string;
    };
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      blockers: string[];
      gate_status: string;
      no_live_release_claim: boolean;
      required_signoffs: string[];
    };
    schema_compatibility_gate: {
      input_schema_id?: string;
      input_validation?: {
        arguments_valid: boolean;
        schema_validation_status: string;
      };
      invalid_input_denial: {
        code: string;
        standard_error_code: string;
      };
      output_schema_id?: string;
      output_validation?: {
        structured_content_matches_output_schema: string;
        structured_content_required: boolean;
      };
      requested_tool_name?: string;
      required_scope?: string;
    };
    status: string;
    validation: Record<string, boolean>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface McpAuthLimitsReleaseGatePlanBody {
  data: {
    api_key_gate: {
      revoke_plan: {
        revocation_plan: {
          future_calls_denied_after_revoke: boolean;
          live_invalidation: boolean;
        };
      };
      rotated_key_denial: {
        code: string;
        standard_error_code: string;
      };
      rotate_plan: {
        api_key: {
          live_secret_generated: boolean;
          old_key_future_calls_denied_after_rotation: boolean;
        };
      };
    };
    capability: {
      live_auth_middleware: boolean;
      live_limiter_enforcement: boolean;
      live_oauth_provider: boolean;
      route: string;
      status: string;
    };
    error_stability_gate: {
      limiter_error_codes: string[];
      required_mappings: Record<string, string>;
      standard_error_code_version: string;
      standard_error_codes: string[];
    };
    frontend_rendering: boolean;
    limit_gate: {
      bounded_retrieval?: {
        cursor_pagination: {
          cursor: string | null;
          cursor_bound_to_request: boolean;
          cursor_opaque: boolean;
          enabled: boolean;
          parameter: string | null;
        };
        max_rows_enforced: boolean;
        row_limit: {
          effective_limit: number;
          max_limit: number;
          too_many_rows_error_code: string;
        };
      };
      time_range_denial: {
        code: string;
        standard_error_code: string;
      };
      too_many_rows_denial: {
        code: string;
        standard_error_code: string;
      };
      tool_limits?: {
        limiter_version: string;
        ordinary_pool_protection: boolean;
        rate_limit: {
          live_window_reads: boolean;
          rate_limited_error_code: string;
          status: string;
        };
      };
    };
    live_auth_middleware: boolean;
    live_limiter_enforcement: boolean;
    live_oauth_provider: boolean;
    live_tool_execution: boolean;
    model_calls: boolean;
    oauth_scope_gate: {
      authorize_plan: {
        consent: {
          scopes: Array<{
            revocable: boolean;
            scope: string;
          }>;
        };
        pkce: {
          code_challenge_method: string;
          plain_method_allowed: boolean;
        };
      };
      revoked_connection_denial: {
        code: string;
        standard_error_code: string;
      };
      revoke_plan: {
        revocation_plan: {
          future_calls_denied_after_revoke: boolean;
          token_invalidation_live: boolean;
        };
      };
    };
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      blockers: string[];
      gate_status: string;
      no_live_release_claim: boolean;
      required_signoffs: string[];
    };
    status: string;
    validation: Record<string, boolean>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface McpTargetClientsConsoleReleaseGatePlanBody {
  data: {
    auth_limits_gate: {
      api_key_gate: {
        rotate_plan: {
          api_key: {
            live_secret_generated: boolean;
            old_key_future_calls_denied_after_rotation: boolean;
          };
        };
      };
      error_stability_gate: {
        limiter_error_codes: string[];
      };
      oauth_scope_gate: {
        authorize_plan: {
          consent: {
            clear_scope_display: boolean;
            requested_scope_count: number;
          };
        };
      };
    };
    capability: {
      console_reconciliation_ready: boolean;
      developer_console_live: boolean;
      live_client_e2e_passed: boolean;
      route: string;
      status: string;
      target_client_matrix_ready: boolean;
    };
    compatibility_gate: {
      inspector: {
        live_inspector_smoke: boolean;
      };
      sdk: {
        live_sdk_smoke: boolean;
      };
      status_route: string;
      target_clients: Array<{
        live_e2e_passed: boolean;
        name: string;
        status: string;
      }>;
      target_protocol_version: string;
      test_vectors: Array<{
        local_contract_ready: boolean;
        name: string;
      }>;
    };
    console_reconciliation_gate: {
      console_live: boolean;
      forbidden_fields: string[];
      log_store_live: boolean;
      request_id_visible: boolean;
      required_fields: string[];
      scope_visibility: boolean;
      status_source: string;
      usage_ledger_reads_live: boolean;
    };
    developer_console_live: boolean;
    frontend_rendering: boolean;
    live_client_e2e_passed: boolean;
    live_console_log_store: boolean;
    live_tool_execution: boolean;
    live_usage_ledger_reads: boolean;
    model_calls: boolean;
    protocol_gate: {
      route: string;
      usage: {
        request_id: string;
        request_id_visible: boolean;
      };
    };
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      blockers: string[];
      gate_status: string;
      no_live_release_claim: boolean;
      required_signoffs: string[];
    };
    status: string;
    target_client_gate: {
      first_call_time_target_minutes: number;
      live_client_e2e_passed: boolean;
      matrix: Array<{
        client_name: string;
        connection_guide_artifact: string;
        first_call_time_target_minutes: number;
        live_e2e_passed: boolean;
        planned_checks: string[];
        status: string;
      }>;
    };
    validation: Record<string, boolean>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface McpDeveloperConsolePlanBody {
  data: {
    capability: {
      api_key_secret_generation_live: boolean;
      connection_guide_artifact: string;
      developer_console_live: boolean;
      first_call_time_target_minutes: number;
      live_console_log_store: boolean;
      live_usage_ledger_reads: boolean;
      route: string;
      status: string;
    };
    connection_guide: {
      artifact: string;
      first_call_time_target_minutes: number;
      protocol_route: string;
      steps: Array<{
        route: string;
        step: string;
      }>;
      target_clients: Array<{
        client_name: string;
        connection_guide_artifact: string;
        first_call_time_target_minutes: number;
      }>;
    };
    credentials: {
      api_key: {
        create_route: string;
        live_secret_generation: boolean;
        one_time_display: boolean;
        server_to_server_only: boolean;
      };
      oauth: {
        authorize_route: string;
        live_oauth_provider: boolean;
        pkce_methods: string[];
        token_storage_live: boolean;
      };
    };
    developer_console_live: boolean;
    examples: {
      calls: Array<{
        live_execution: boolean;
        method: string;
      }>;
      live_tool_execution: boolean;
    };
    frontend_rendering: boolean;
    live_api_key_generation: boolean;
    live_console_log_store: boolean;
    live_oauth_provider: boolean;
    live_tool_execution: boolean;
    live_usage_ledger_reads: boolean;
    model_calls: boolean;
    quota_panel: {
      freshness_target_minutes: number;
      live_ledger_reads: boolean;
      request_id: string;
      request_id_visible: boolean;
    };
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      blockers: string[];
      gate_status: string;
      no_live_release_claim: boolean;
    };
    request_log_panel: {
      fields: string[];
      forbidden_fields: string[];
      live_log_store: boolean;
      sample_rows: Array<{
        client_name: string;
        credential_kind: string;
        request_id: string;
        scope: string;
        tool_name: string;
        workspace_id: string;
      }>;
      usage_ledger_reads_live: boolean;
    };
    route: string;
    scope_panel: {
      scope_catalog: Array<{
        revocable: boolean;
        scope: string;
      }>;
      scope_visibility: boolean;
    };
    status: string;
    target_clients_console_gate: {
      gate_status: string;
      route: string;
    };
    validation: Record<string, boolean>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface McpClientMaturityPlanBody {
  data: {
    capability: {
      fallback_mode: string;
      interactive_apps_live: boolean;
      prompts_live: boolean;
      resources_live: boolean;
      route: string;
      status: string;
      target_client_matrix_ready: boolean;
      tools_only_fallback_ready: boolean;
    };
    client_maturity_gate: {
      candidate_feature: string;
      matrix: Array<{
        client_name: string;
        fallback_mode: string;
        interactive_apps: {
          live_enabled: boolean;
          maturity: string;
        };
        live_e2e_passed: boolean;
        prompts: {
          live_enabled: boolean;
          required_methods: string[];
        };
        resources: {
          live_enabled: boolean;
          required_methods: string[];
        };
        tools: {
          live_execution: boolean;
          route: string;
        };
      }>;
      requested_client: string;
      status: string;
    };
    developer_console_live: boolean;
    frontend_rendering: boolean;
    live_client_e2e_passed: boolean;
    live_tool_execution: boolean;
    model_calls: boolean;
    publication_policy: {
      component_widgets_live: boolean;
      fallback_to_tools_only: boolean;
      interactive_apps_live: boolean;
      prompts_live: boolean;
      resources_live: boolean;
      tools_call_live_execution: boolean;
      tool_result_embedded_resources_live: boolean;
    };
    reference_urls: string[];
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      blockers: string[];
      gate_status: string;
      no_live_release_claim: boolean;
    };
    route: string;
    status: string;
    validation: Record<string, boolean>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface McpProtocolPlanBody {
  data: {
    capability: {
      default_deny: boolean;
      live_tool_execution: boolean;
      mcp_api_redistribution_rights_confirmed: boolean;
      origin_validation: boolean;
      route: string;
      supported_methods: string[];
    };
    endpoint: string;
    initialize?: {
      protocol_version: string;
      server_info: {
        name: string;
      };
    };
    live_tool_execution: boolean;
    method: string;
    origin_check: {
      origin: string;
      required: boolean;
      valid: boolean;
    };
    rights_gate: {
      blocked_reason?: string;
      default_deny: boolean;
      mcp_api_redistribution_rights_confirmed: boolean;
      web_rights_do_not_imply_mcp: boolean;
    };
    status: string;
    tools_list?: {
      blocked_tool_count: number;
      returned_tool_count: number;
      schema_snapshot: {
        returned_schema_count: number;
        runtime_schema_serving: boolean;
        schema_catalog_available_after_rights_gate: boolean;
        schema_source_contract: string;
        tool_schema_count: number;
        tools_list_schema_snapshot: boolean;
      };
      tools: unknown[];
    };
    transport: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface McpOAuthRuntimeBody {
  data: {
    authorize_route: string;
    live_oauth_provider: boolean;
    pkce_methods: string[];
    revoke_route: string;
    scope_catalog: Array<{
      scope: string;
    }>;
    scopes_revocable: boolean;
    status: string;
    third_party_token_passthrough: boolean;
    token_route: string;
  };
  ok: true;
}

interface McpOAuthAuthorizePlanBody {
  data: {
    authorization_code: {
      code_emitted: boolean;
      expires_in_seconds: number;
      one_time_use: boolean;
      token_exchange_route: string;
    };
    capability: {
      authorize_route: string;
      scopes_revocable: boolean;
      token_route: string;
    };
    consent: {
      clear_scope_display: boolean;
      requested_scope_count: number;
      scopes: Array<{
        revocable: boolean;
        scope: string;
      }>;
      user_consent_required: boolean;
    };
    live_oauth_provider: boolean;
    oauth_flow: string;
    pkce: {
      code_challenge_method: string;
      code_verifier_stored: boolean;
      plain_method_allowed: boolean;
    };
    revocation: {
      revoke_route: string;
      revocable: boolean;
    };
    route: string;
    status: string;
    third_party_token_passthrough: boolean;
    token_issued: boolean;
  };
  ok: true;
}

interface McpOAuthTokenPlanBody {
  data: {
    pkce_verification: {
      code_verifier_received: boolean;
      verification_status: string;
      verifier_hash_stored: boolean;
    };
    scope_binding: {
      requested_scopes: string[];
      scopes_bound_to_token: boolean;
    };
    status: string;
    third_party_token_passthrough: boolean;
    token: {
      access_token_issued: boolean;
      audience: string;
      refresh_token_issued: boolean;
    };
  };
  ok: true;
}

interface McpOAuthRevokePlanBody {
  data: {
    connection_id?: string;
    revocation_plan: {
      future_calls_denied_after_revoke: boolean;
      revoke_status: string;
      scope_grants_removed: string;
      token_invalidation_live: boolean;
    };
    route: string;
    status: string;
  };
  ok: true;
}

interface McpApiKeyRuntimeBody {
  data: {
    api_key_live: boolean;
    create_route: string;
    hash_algorithm: string;
    hash_storage_required: boolean;
    ip_allowlist_supported: boolean;
    one_time_display: boolean;
    revoke_route: string;
    rotate_route: string;
    rotation_supported: boolean;
    runtime_route: string;
    server_to_server_only: boolean;
    status: string;
    supported_scopes: string[];
  };
  ok: true;
}

interface McpApiKeyCreatePlanBody {
  data: {
    api_key: {
      issued: boolean;
      key_name: string;
      key_status: string;
      live_secret_generated: boolean;
    };
    capability: {
      create_route: string;
      hash_storage_required: boolean;
      one_time_display: boolean;
      rotate_route: string;
    };
    hash_storage: {
      key_hash_stored: boolean;
      key_last_four_stored: boolean;
      raw_key_stored: boolean;
    };
    ip_restrictions: {
      allowlist: string[];
      ip_allowlist_supported: boolean;
      validated: boolean;
    };
    key_material: {
      key_material_returned: boolean;
      key_prefix: string;
      one_time_display: boolean;
    };
    route: string;
    rotation: {
      default_rotation_after_days: number;
      rotatable: boolean;
      rotate_route: string;
    };
    scope_binding: {
      requested_scopes: string[];
      scope_grants: Array<{
        scope: string;
      }>;
      scopes_bound_to_key: boolean;
    };
    server_to_server: {
      allowed_only: boolean;
      browser_use_allowed: boolean;
    };
    status: string;
  };
  ok: true;
}

interface McpApiKeyRotatePlanBody {
  data: {
    api_key: {
      key_id: string;
      live_secret_generated: boolean;
      new_key_material_display_once: boolean;
      old_key_future_calls_denied_after_rotation: boolean;
      rotation_overlap_seconds: number;
      rotation_status: string;
    };
    reason?: string;
    route: string;
    rotation: {
      next_rotation_after_days: number;
      rotatable: boolean;
    };
    status: string;
  };
  ok: true;
}

interface McpApiKeyRevokePlanBody {
  data: {
    key_id: string;
    revocation_plan: {
      future_calls_denied_after_revoke: boolean;
      key_hash_disabled: string;
      live_invalidation: boolean;
      revoke_status: string;
    };
    route: string;
    status: string;
  };
  ok: true;
}

interface McpRevocationEnforcementPlanBody {
  data: {
    capability: {
      enforced_before_tool_execution: boolean;
      live_auth_middleware: boolean;
      route: string;
      standard_error_code: string;
      status: string;
    };
    credential: {
      connection_id?: string;
      credential_kind: string;
      credential_reference: string;
      key_id?: string;
      raw_credential_stored: boolean;
      status: string;
    };
    denial: {
      client_action: string;
      decision: string;
      denied: boolean;
      enforced_before_tool_execution: boolean;
      enforced_before_usage_debit: boolean;
      immediate_failure_after_revoke: boolean;
      immediate_failure_after_rotation: boolean;
      standard_error_code: string;
    };
    live_auth_middleware: boolean;
    persistent_writes: boolean;
    route: string;
    status: string;
  };
  ok: true;
}

interface DatabaseRuntimeBody {
  data: {
    connection_path: string;
    hyperdrive: {
      binding_configured: boolean;
      binding_name: string;
      requires_real_resource_id?: boolean;
      status: string;
    };
    live_queries: boolean;
    live_readiness: {
      requested: boolean;
      result?: {
        binding_name: string;
        failure_code?: string;
        status: string;
        surface: string;
      };
      route: string;
      source_route: string;
    };
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
      live_policy_source_readiness: {
        compiles_partner_matrix_to_db_rows: boolean;
        compiles_to_gateway_policy: boolean;
        default_deny_preserved: boolean;
        external_activation_status: string;
        frontend: boolean;
        live_db_reads: boolean;
        live_partner_rights_matrix_reads: boolean;
        persistent_writes: boolean;
        route: string;
        runtime_route: string;
        sql_emitted: boolean;
        status: string;
      };
      operations_config: {
        approval_required: boolean;
        default_deny_preserved: boolean;
        effective_time_required: boolean;
        frontend: boolean;
        live_db_reads: boolean;
        persistent_writes: boolean;
        policy_version_required: boolean;
        route: string;
        runtime_route: string;
        sql_emitted: boolean;
        status: string;
      };
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
    data_coverage_release_gate: {
      coverage_policy_loaded: boolean;
      frontend: boolean;
      live_partner_data_reads: boolean;
      persistent_writes: boolean;
      required_coverage_domains: string[];
      required_freshness_tiers: string[];
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
    };
    live_data_access: boolean;
    market_data_surfaces: boolean;
    mcp_redistribution_surfaces: boolean;
    p0_rights_matrix_coverage: {
      default_rights_status: string;
      enterprise_authorization_configured: boolean;
      export_authorization_configured: boolean;
      frontend: boolean;
      live_rights_matrix_reads: boolean;
      mcp_authorization_configured: boolean;
      partner_signed_matrix_loaded: boolean;
      persistent_writes: boolean;
      required_p0_tool_count: number;
      required_surfaces: string[];
      route: string;
      runtime_route: string;
      sql_emitted: boolean;
      status: string;
      web_authorization_configured: boolean;
    };
    rights_policy_version: string;
    restricted_exports: {
      artifact_writes: boolean;
      frontend: boolean;
      high_risk_scope: string;
      live_data_access: boolean;
      route: string;
      scope_required: boolean;
      status: string;
      supported_formats: string[];
      uses_data_access_gateway: boolean;
      watermark_required: boolean;
    };
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
      serving_quality_live_readiness: {
        fixture_version: string;
        frontend: boolean;
        live_partner_rows_loaded: boolean;
        live_serving_reads: boolean;
        live_serving_sql_execution: boolean;
        persistent_writes: boolean;
        required_quality_states: string[];
        route: string;
        runtime_route: string;
        sql_executed: boolean;
        status: string;
        validates_gateway_quality_hold: boolean;
        validates_release_isolation: boolean;
        validates_sql_execution_guard: boolean;
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

interface FieldRightsLivePolicySourceReadinessBody {
  data: {
    external_activation: {
      blockers: string[];
      status: string;
    };
    live_db_reads: boolean;
    live_partner_rights_matrix_reads: boolean;
    partner_matrix_fixture: {
      matrix_rows: Array<{
        channel: string;
        dataset: string;
        field_pattern: string;
      }>;
      signed_external_matrix_loaded: boolean;
    };
    policy_source: {
      rowCounts: {
        dataEntitlements: number;
        subscriptionRows: number;
        workspaceEntitlements: number;
      };
      status: string;
    };
    readiness: {
      db_rows_compiled: boolean;
      default_deny_preserved: boolean;
      partner_matrix_fixture_loaded: boolean;
      runtime_smoke_passed: boolean;
      versioned_cache_key_verified: boolean;
    };
    rights_policy_version: string;
    runtime_smoke: Array<{
      scenario_id: string;
      status: string;
    }>;
    status: string;
    validation: {
      partner_matrix_rows: number;
      smoke_count: number;
      source_records: number;
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface ServingQualityLiveReadinessBody {
  data: {
    activation: {
      blockers: string[];
      required_signoffs: string[];
      status: string;
    };
    live_partner_rows_loaded: boolean;
    live_serving_reads: boolean;
    live_serving_sql_execution: boolean;
    quality_release_checks: Array<{
      expected_gateway_error_code?: string;
      expected_release_state: string;
      expected_serving_query_status: string;
      expected_sql_text_status: string;
      gateway_error_code?: string;
      gateway_status: string;
      quality_state: string;
      release_state: string;
      scenario_id: string;
      serving_execution_status: string;
      serving_query_status: string;
      sql_executed: boolean;
      sql_text_emitted: boolean;
      sql_text_status: string;
      status: string;
    }>;
    readiness: {
      gateway_quality_hold_guard_passed: boolean;
      no_blocked_quality_sql_execution: boolean;
      no_live_reads_or_writes: boolean;
      release_mapping_passed: boolean;
      sql_execution_guard_passed: boolean;
    };
    release_fixture: Array<{
      quality_state: string;
      scenario_id: string;
    }>;
    sql_executed: boolean;
    status: string;
    validation: {
      blocked_quality_states: number;
      quality_state_count: number;
      smoke_count: number;
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface P0RightsMatrixCoverageBody {
  data: {
    capability: {
      required_p0_tool_count: number;
      route: string;
      status: string;
    };
    dataset_field_coverage: Array<{
      dataset: string;
      field_patterns: string[];
      rights_state: string;
      surfaces: Record<string, string>;
    }>;
    default_rights_status: string;
    live_rights_matrix_reads: boolean;
    persistent_writes: boolean;
    release_gate: {
      gate_status: string;
      partner_signed_matrix_loaded: boolean;
      required_signoffs: string[];
    };
    rights_policy_version: string;
    sql_emitted: boolean;
    status: string;
    surface_coverage: Record<string, {
      configured: boolean;
      default_rights_status: string;
    }>;
    tool_coverage: Array<{
      rights_state: string;
      surfaces: Record<string, string>;
      tool_name: string;
    }>;
    validation: {
      all_required_surfaces_configured: boolean;
      required_p0_tool_count: number;
      tool_count: number;
      tool_count_matches_registry: boolean;
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface DataCoverageReleaseGateBody {
  data: {
    capability: {
      route: string;
      status: string;
    };
    coverage_domains: Array<{
      domain: string;
      evidence_surfaces: string[];
      live_partner_rows_loaded: boolean;
      status: string;
    }>;
    coverage_policy_version: string;
    freshness_markers: Array<{
      label_required: boolean;
      live_partner_rows_loaded: boolean;
      min_delay_minutes?: number;
      tier: string;
    }>;
    live_partner_data_reads: boolean;
    persistent_writes: boolean;
    release_gate: {
      blockers: string[];
      gate_status: string;
      live_partner_coverage_loaded: boolean;
      required_signoffs: string[];
    };
    sql_emitted: boolean;
    status: string;
    validation: {
      all_required_coverage_domains_present: boolean;
      all_required_freshness_tiers_present: boolean;
      coverage_domain_count: number;
      freshness_tier_count: number;
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface FieldAuthorizationConfigPlanBody {
  data: {
    approval: {
      required: boolean;
      status: string;
      table: string;
      write_status: string;
    };
    capability: {
      status: string;
    };
    change: {
      channel: string;
      dataset: string;
      effective_at: string;
      field_pattern: string;
      operator_id: string;
      plan: string;
      policy_version: string;
      target_status: string;
      table: string;
      workspace_id?: string;
      write_status: string;
    };
    default_deny_preserved: boolean;
    frontend: boolean;
    live_db_reads: boolean;
    persistent_writes: boolean;
    policy_effect: {
      activation_status: string;
      compiles_to_gateway_policy: boolean;
      data_entitlement_row: {
        channel: string;
        dataset: string;
        field_pattern: string;
        rights_policy_version: string;
        status: string;
        table: string;
      };
      versioned_cache_key_required: boolean;
      workspace_entitlement_row?: {
        table: string;
        valid_from: string;
        workspace_id: string;
      };
    };
    request_id: string;
    sql_emitted: boolean;
    status: string;
    validation: {
      approval_required: boolean;
      effective_time_required: boolean;
      policy_version_required: boolean;
      required_context_present: boolean;
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface RestrictedExportPlanBody {
  data: {
    artifact: {
      csv: string;
      generated: boolean;
      image: string;
      pdf: string;
      r2_write: boolean;
    };
    capability: {
      high_risk_scope: string;
      route: string;
      scope_required: boolean;
      status: string;
      supported_formats: string[];
      watermark_required: boolean;
    };
    gateway_decision: {
      allowed_fields: string[];
      denied_fields: Array<{
        field: string;
        reason: string;
      }>;
      export_requested: boolean;
      status: string;
    };
    live_data_access: boolean;
    persistent_writes: boolean;
    row_policy: {
      max_rows: number;
      requested_rows: number;
      served_rows: number;
    };
    scope: {
      granted: boolean;
      required: string;
    };
    status: string;
    toolName: string;
    watermark: {
      fields: string[];
      required: boolean;
      text: string;
    };
  };
  ok: true;
  usage: {
    rows: number;
  };
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
      benchmark_parity: {
        live_partner_data: boolean;
        live_serving_reads: boolean;
        minimum_complex_cases: number;
        partner_reference_cases: number;
        public_reference_cases: number;
        sample_count: number;
        status: string;
      };
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

interface ParseChartImageLiveSmokeBody {
  accepted_fields?: string[];
  chart_parse_record?: {
    calibration_run_id: string | null;
    error_code: string | null;
    id: string;
    image_ref: string;
    keys: string[];
    model_version_hash: string;
    prompt_version: string;
    schema_version: string;
    status: string;
  };
  missing_env?: string[];
  parse_outcome?: {
    error_code: string | null;
    latency_ms: number;
    model_call_count: number;
    repair_applied: boolean;
    result: {
      symbol?: { confidence: number; value: string | null };
      timeframe?: { confidence: number; value: string | null };
    } | null;
    status: string;
    usage: { input_tokens: number; output_tokens: number; total_tokens: number };
  };
  request_id: string;
  response_hash?: string;
  route?: string;
  status: string;
  tool_version?: string;
  version?: string;
}

interface ModelProviderLiveSmokeBody {
  error_code?: string;
  missing_env?: string[];
  model_provider_result?: {
    gateway_id_hash: string;
    generate_text: {
      api: string;
      exact_output_match: boolean;
      input_tokens: number;
      output_tokens: number;
      status: string;
      total_tokens: number;
    };
    http_status: number;
    http_statuses: number[];
    method: string;
    model_hash: string;
    operation_count: number;
    provider: string;
    response_hash: string;
    status: string;
    stream_text: {
      api: string;
      chunk_count: number;
      exact_output_match: boolean;
      input_tokens: number;
      output_tokens: number;
      status: string;
      total_tokens: number;
    };
  };
  request_id: string;
  response_hash?: string;
  route: string;
  status: string;
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
    performance_availability_release_gate: {
      route: string;
      status: string;
      targets: {
        core_api_availability_bps: number;
        mcp_tool_success_rate_bps: number;
        web_first_token_p95_ms: number;
      };
    };
    load_dr_incident_drill_release_gate: {
      route: string;
      status: string;
      targets: {
        dr_rpo_minutes: number;
        dr_rto_minutes: number;
        load_test_max_error_rate_bps: number;
        load_test_min_peak_rps: number;
      };
    };
    sinks: Array<{
      live_export_enabled: boolean;
      name: string;
      status: string;
    }>;
  };
  ok: true;
}

interface PerformanceAvailabilityReleaseGatePlanBody {
  data: {
    as_of: string;
    capability: {
      route: string;
      status: string;
    };
    frontend: boolean;
    live_apm_provider_reads: boolean;
    live_probe_reads: boolean;
    live_slo_store_writes: boolean;
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      blockers: string[];
      gate_status: string;
      no_live_release_claim: boolean;
    };
    request_id: string;
    route: string;
    slo_report: {
      excluded_failure_categories: string[];
      observations: Array<{
        metric_id: string;
        observed_value: number;
        pass: boolean;
        target_value: number;
        unit: string;
      }>;
      route_coverage: string[];
      status: string;
    };
    status: string;
    validation: Record<string, boolean>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
}

interface LoadDrIncidentDrillReleaseGatePlanBody {
  data: {
    as_of: string;
    capability: {
      route: string;
      status: string;
    };
    drill_report: {
      covered_scenarios: string[];
      evidence: {
        dr_rpo_minutes: number;
        dr_rto_minutes: number;
        load_test_error_rate_bps: number;
        load_test_peak_rps: number;
        measured_from: string;
      };
      status: string;
    };
    frontend: boolean;
    live_incident_pager: boolean;
    live_load_test_runner: boolean;
    live_restore_execution: boolean;
    live_status_page_writes: boolean;
    release_checks: Array<{
      check: string;
      status: string;
    }>;
    release_gate: {
      blockers: string[];
      gate_status: string;
      no_live_release_claim: boolean;
    };
    request_id: string;
    route: string;
    status: string;
    validation: Record<string, boolean>;
    version: string;
  };
  ok: true;
  usage: {
    rows: number;
  };
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
    kill_switch: {
      decision: {
        degraded: boolean;
        degradation_mode: string;
        model_request_blocked: boolean;
        safe_degradation_required: boolean;
        tool_execution_blocked: boolean;
      };
      reason?: string;
      switch_state: {
        model_kill_switch: boolean;
        target: string;
        tool_kill_switch: boolean;
      };
    };
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
      presentation: {
        default_locale: string;
        default_response_depth: string;
        frontend_rendering: boolean;
        locale: string;
        locale_switch_invariant: {
          currency: boolean;
          data_values: boolean;
          evidence_card_refs: boolean;
          methodology_versions: boolean;
          numeric_precision: boolean;
          source_record_ids: boolean;
          units: boolean;
        };
        model_calls: boolean;
        response_depth: string;
        response_depth_invariant: {
          conclusion: boolean;
          currency: boolean;
          data_values: boolean;
          evidence_card_refs: boolean;
          methodology_versions: boolean;
          source_record_ids: boolean;
          units: boolean;
        };
        response_depth_policy: {
          newbie_adds_examples: boolean;
          newbie_requires_plain_language_definition: boolean;
          professional_can_show_raw_formula_and_source_fields: boolean;
        };
        supported_locales: string[];
        supported_response_depths: string[];
        terminology_glossary: Array<{
          en: string;
          metric_id: string;
          methodology_note_required: boolean;
          source_record_required_when_numeric: boolean;
          zh_hans: string;
          zh_hant: string;
        }>;
        terminology_policy: {
          bilingual_terms_required: boolean;
          same_glossary_for_all_locales: boolean;
          unknown_terms_use_source_label: boolean;
        };
        validation_rules: string[];
        version: string;
      };
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
      post_generation_evidence_binding: {
        allowed_binding_refs: string[];
        failure_code: string;
        live_evidence_binding: boolean;
        local_deterministic_validation: boolean;
        model_calls: boolean;
        route: string;
        status: string;
        version: string;
      };
      status: string;
      validation_rules: string[];
      version: string;
    };
    planned_step_count: number;
    post_generation_evidence_binding: {
      allowed_binding_refs: string[];
      failure_code: string;
      route: string;
      status: string;
      version: string;
    };
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

interface AgentWorkflowTaskPlanBody {
  data: {
    actual_workflow_execution: boolean;
    capability: {
      binding: string;
      route: string;
      status: string;
      task_id_visible: boolean;
    };
    frontend_rendering: boolean;
    live_workflow_execution: boolean;
    long_task_boundary: {
      estimated_wall_clock_ms: number;
      interactive_wall_clock_limit_ms: number;
      transfer_reasons: string[];
    };
    notification: {
      channels: string[];
      completion_notification: string;
      event_queue: string;
      failure_notification: string;
      required: boolean;
      user_visible: boolean;
    };
    persistent_writes: boolean;
    request_id: string;
    resume: {
      disconnect_safe: boolean;
      frontend_can_leave: boolean;
      resume_handle: string;
      resume_route: string;
      resumable: boolean;
      state_table: string;
    };
    sql_emitted: boolean;
    status: string;
    task: {
      created_from: string;
      request_id: string;
      run_id: string;
      status: string;
      table: string;
      task_id: string;
      task_kind: string;
      user_id: string;
      workspace_id: string;
    };
    task_id: string;
    task_id_visible: boolean;
    tool_loop_plan: {
      actual_tool_execution: boolean;
      model_calls: boolean;
      planned_step_count: number;
      run_id: string;
      status: string;
    };
    workflow: {
      binding: string;
      execution_ready: boolean;
      provider: string;
      start_status: string;
      workflow_name: string;
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
    detail?: {
      category: string;
      client_action: string;
      internal_code: string;
      mcp_error_version: string;
      recoverable: boolean;
      request_id: string;
      retry_after_required: boolean;
      source_record_id: string;
    };
  };
  ok: false;
}

interface OpenAiCompatibleMockCall {
  body: Record<string, unknown>;
  headers: Record<string, string>;
  url: string;
}

function createOpenAiCompatibleMockFetch(): {
  calls: OpenAiCompatibleMockCall[];
  fetch: typeof fetch;
} {
  const calls: OpenAiCompatibleMockCall[] = [];
  const fetchMock = (async (resource: Parameters<typeof fetch>[0], options?: RequestInit) => {
    const body = parseMockRequestBody(options?.body);
    const headers = Object.fromEntries(new Headers(options?.headers).entries());
    calls.push({
      body,
      headers,
      url: String(resource)
    });

    if (body.stream === true) {
      return new Response(
        [
          `data: ${JSON.stringify({
            choices: [
              {
                delta: {
                  content: "AIPHABEE_AI_GATEWAY_SMOKE_OK",
                  role: "assistant"
                },
                finish_reason: null,
                index: 0
              }
            ],
            created: 0,
            id: "chatcmpl-synthetic-stream",
            model: "synthetic-model",
            object: "chat.completion.chunk"
          })}`,
          "",
          `data: ${JSON.stringify({
            choices: [
              {
                delta: {},
                finish_reason: "stop",
                index: 0
              }
            ],
            created: 0,
            id: "chatcmpl-synthetic-stream",
            model: "synthetic-model",
            object: "chat.completion.chunk",
            usage: {
              completion_tokens: 3,
              prompt_tokens: 2,
              total_tokens: 5
            }
          })}`,
          "",
          "data: [DONE]",
          ""
        ].join("\n"),
        {
          headers: {
            "content-type": "text/event-stream"
          },
          status: 200
        }
      );
    }

    return Response.json(
      {
        choices: [
          {
            finish_reason: "stop",
            index: 0,
            message: {
              content: "AIPHABEE_AI_GATEWAY_SMOKE_OK",
              role: "assistant"
            }
          }
        ],
        created: 0,
        id: "chatcmpl-synthetic",
        model: "synthetic-model",
        object: "chat.completion",
        usage: {
          completion_tokens: 3,
          prompt_tokens: 2,
          total_tokens: 5
        }
      },
      {
        status: 200
      }
    );
  }) as typeof fetch;

  return {
    calls,
    fetch: fetchMock
  };
}

function parseMockRequestBody(value: BodyInit | null | undefined): Record<string, unknown> {
  if (typeof value !== "string") {
    return {};
  }

  return JSON.parse(value) as Record<string, unknown>;
}

const CHART_VISION_SAMPLE_RESULT = {
  chart_type: { confidence: 0.98, value: "candlestick" },
  drawn_lines: [],
  end_time: { confidence: 0.9, value: "2026-06-30" },
  exchange: { confidence: 0.96, value: "HKEX" },
  indicators: [{ confidence: 0.9, name: "RSI", params: [14] }],
  patterns: [],
  symbol: { confidence: 0.97, value: "0700.HK" },
  timeframe: { confidence: 0.95, value: "1d" }
};

function createChartVisionMockFetch(contents: string[]): {
  calls: OpenAiCompatibleMockCall[];
  fetch: typeof fetch;
} {
  const calls: OpenAiCompatibleMockCall[] = [];
  const fetchMock = (async (resource: Parameters<typeof fetch>[0], options?: RequestInit) => {
    const body = parseMockRequestBody(options?.body);
    const headers = Object.fromEntries(new Headers(options?.headers).entries());
    calls.push({
      body,
      headers,
      url: String(resource)
    });
    const content = contents[Math.min(calls.length - 1, contents.length - 1)] ?? "";

    return Response.json(
      {
        choices: [
          {
            finish_reason: "stop",
            index: 0,
            message: {
              content,
              role: "assistant"
            }
          }
        ],
        created: 0,
        id: "chatcmpl-chart-vision",
        model: "synthetic-model",
        object: "chat.completion",
        usage: {
          completion_tokens: 900,
          prompt_tokens: 1548,
          total_tokens: 2448
        }
      },
      {
        status: 200
      }
    );
  }) as typeof fetch;

  return { calls, fetch: fetchMock };
}

interface FakeD1Statement {
  bind(...values: unknown[]): FakeD1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}

function createRuntimeBindingSmokeEnv() {
  const kvStore = new Map<string, string>();
  const r2Store = new Map<string, string>();
  const d1Store = new Map<
    string,
    {
      event_version: string;
      failed_check_count: number;
      record_json: string;
      request_id: string;
      result: string;
      route: string;
      run_id: string;
      schema_version: string;
      wvro_eligible: number;
    }
  >();
  const kv = {
    delete: vi.fn(async (key: string) => {
      kvStore.delete(key);
    }),
    get: vi.fn(async (key: string) => kvStore.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      kvStore.set(key, value);
    })
  };
  const r2 = {
    delete: vi.fn(async (key: string) => {
      r2Store.delete(key);
    }),
    get: vi.fn(async (key: string) => {
      const value = r2Store.get(key);

      return value === undefined
        ? null
        : {
            text: async () => value
          };
    }),
    put: vi.fn(async (key: string, value: string) => {
      r2Store.set(key, value);
      return {};
    })
  };
  const d1 = {
    prepare: vi.fn((sql: string) => {
      let bindings: unknown[] = [];
      const statement: FakeD1Statement = {
        bind: (...values: unknown[]) => {
          bindings = values;
          return statement;
        },
        first: async <T = Record<string, unknown>>() => {
          if (sql.startsWith("SELECT")) {
            return (d1Store.get(String(bindings[0])) ?? null) as T | null;
          }

          return null;
        },
        run: vi.fn(async () => {
          if (sql.startsWith("INSERT")) {
            d1Store.set(String(bindings[0]), {
              schema_version: String(bindings[1]),
              event_version: String(bindings[2]),
              request_id: String(bindings[3]),
              run_id: String(bindings[4]),
              route: String(bindings[5]),
              result: String(bindings[6]),
              failed_check_count: Number(bindings[7]),
              wvro_eligible: Number(bindings[8]),
              record_json: String(bindings[9])
            });
          }

          if (sql.startsWith("DELETE")) {
            d1Store.delete(String(bindings[0]));
          }

          if (sql.startsWith("DROP")) {
            d1Store.clear();
          }

          return {};
        })
      };

      return statement;
    })
  };

  return {
    d1,
    env: {
      AIPHABEE_ARTIFACTS: r2,
      AIPHABEE_CONFIG: kv,
      AIPHABEE_EVAL_STORE: d1
    },
    kv,
    r2
  };
}

function createQueueSmokeEnv() {
  const kvStore = new Map<string, string>();
  const kv = {
    delete: vi.fn(async (key: string) => {
      kvStore.delete(key);
    }),
    get: vi.fn(async (key: string) => kvStore.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      kvStore.set(key, value);
    })
  };
  const queue = {
    send: vi.fn(async (body: unknown) => {
      const payload = body as { evidence_key?: string; message_hash?: string };

      if (typeof payload.evidence_key === "string") {
        kvStore.set(
          payload.evidence_key,
          JSON.stringify({
            message_hash: payload.message_hash,
            status: "consumed"
          })
        );
      }
    })
  };

  return {
    env: {
      AIPHABEE_CONFIG: kv,
      AIPHABEE_EVENTS_QUEUE: queue
    },
    kv,
    kvStore,
    queue
  };
}

function createDurableObjectSmokeEnv() {
  const stub = {
    fetch: vi.fn(async (_input: Request | string | URL, init?: RequestInit) => {
      const payload = JSON.parse(String(init?.body ?? "{}")) as { value_hash?: string };

      return Response.json({
        operation_count: 3,
        state_key_hash:
          "sha256:1111111111111111111111111111111111111111111111111111111111111111",
        status: "ok",
        value_hash: payload.value_hash
      });
    })
  };
  const namespace = {
    get: vi.fn(() => stub),
    idFromName: vi.fn((name: string) => ({ name }))
  };

  return {
    env: {
      AIPHABEE_RUN_COORDINATOR: namespace
    },
    namespace,
    stub
  };
}

function createDurableObjectState() {
  const storageMap = new Map<string, unknown>();
  const storage = {
    delete: vi.fn(async (key: string) => {
      storageMap.delete(key);
    }),
    get: vi.fn(async (key: string) => storageMap.get(key)),
    put: vi.fn(async <T = unknown>(key: string, value: T) => {
      storageMap.set(key, value);
    })
  };

  return {
    state: {
      storage
    },
    storage,
    storageMap
  };
}

function createWorkflowSmokeEnv() {
  const kvStore = new Map<string, string>();
  const kv = {
    delete: vi.fn(async (key: string) => {
      kvStore.delete(key);
    }),
    get: vi.fn(async (key: string) => kvStore.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      kvStore.set(key, value);
    })
  };
  const workflow = {
    create: vi.fn(
      async (options?: {
        id?: string;
        params?: {
          evidence_key?: string;
          value_hash?: string;
        };
      }) => {
        if (typeof options?.params?.evidence_key === "string") {
          kvStore.set(
            options.params.evidence_key,
            JSON.stringify({
              status: "executed",
              value_hash: options.params.value_hash
            })
          );
        }

        return {
          id: options?.id ?? "workflow-smoke-test",
          status: vi.fn(async () => ({ status: "complete" }))
        };
      }
    )
  };

  return {
    env: {
      AIPHABEE_CONFIG: kv,
      AIPHABEE_RESEARCH_WORKFLOW: workflow
    },
    kv,
    kvStore,
    workflow
  };
}

function createCronSmokeEnv() {
  const kvStore = new Map<string, string>();
  const kv = {
    delete: vi.fn(async (key: string) => {
      kvStore.delete(key);
    }),
    get: vi.fn(async (key: string) => kvStore.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      kvStore.set(key, value);
    })
  };

  return {
    env: {
      AIPHABEE_CONFIG: kv
    },
    kv,
    kvStore
  };
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

  it("rejects the Cloudflare binding smoke route without the smoke header", async () => {
    const response = await app.request("/cloudflare/bindings/smoke", {
      headers: {
        "x-request-id": "req-cloudflare-smoke-denied"
      },
      method: "POST"
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-cloudflare-smoke-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /cloudflare/bindings/smoke",
      status: "forbidden"
    });
  });

  it("reports missing runtime bindings for the Cloudflare binding smoke route", async () => {
    const response = await app.request("/cloudflare/bindings/smoke", {
      headers: {
        "x-aiphabee-smoke": "cloudflare-bindings-runtime-v1",
        "x-request-id": "req-cloudflare-smoke-missing"
      },
      method: "POST"
    });
    const body = (await response.json()) as CloudflareBindingSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("failed");
    expect(body.missing_bindings).toEqual([
      "AIPHABEE_CONFIG",
      "AIPHABEE_ARTIFACTS",
      "AIPHABEE_EVAL_STORE"
    ]);
    expect(body.runtime_results.map((result) => result.status)).toEqual([
      "missing_binding",
      "missing_binding",
      "missing_binding"
    ]);
  });

  it("runs sanitized KV/R2/D1 runtime smoke through bound Cloudflare resources", async () => {
    const { d1, env, kv, r2 } = createRuntimeBindingSmokeEnv();
    const response = await app.request(
      "/cloudflare/bindings/smoke",
      {
        headers: {
          "x-aiphabee-smoke": "cloudflare-bindings-runtime-v1",
          "x-request-id": "req-cloudflare-smoke-ok"
        },
        method: "POST"
      },
      env
    );
    const body = (await response.json()) as CloudflareBindingSmokeBody;
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      missing_bindings: [],
      request_id: "req-cloudflare-smoke-ok",
      route: "POST /cloudflare/bindings/smoke",
      status: "ok",
      synthetic_prefix: "aiphabee-smoke"
    });
    expect(body.response_hash).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(body.runtime_results.map((result) => `${result.binding_name}:${result.surface}`)).toEqual([
      "AIPHABEE_CONFIG:kv_runtime_put_get_delete",
      "AIPHABEE_ARTIFACTS:r2_runtime_put_get_delete",
      "AIPHABEE_EVAL_STORE:d1_eval_store_record_write_read_delete"
    ]);
    expect(body.runtime_results.map((result) => result.operation_count)).toEqual([3, 3, 5]);
    expect(kv.put).toHaveBeenCalledTimes(1);
    expect(kv.get).toHaveBeenCalledTimes(1);
    expect(kv.delete).toHaveBeenCalledTimes(1);
    expect(r2.put).toHaveBeenCalledTimes(1);
    expect(r2.get).toHaveBeenCalledTimes(1);
    expect(r2.delete).toHaveBeenCalledTimes(1);
    expect(d1.prepare).toHaveBeenCalledWith(expect.stringContaining("CREATE TABLE"));
    expect(d1.prepare).toHaveBeenCalledWith(expect.stringContaining("record_json"));
    expect(d1.prepare).toHaveBeenCalledWith(expect.stringContaining("DROP TABLE"));
    expect(serialized).not.toContain("/runtime/kv/");
    expect(serialized).not.toContain("/runtime/r2/");
    expect(serialized).not.toContain("aiphabee_eval_store_smoke");
  });

  it("rejects the Cloudflare queue smoke route without the smoke header", async () => {
    const response = await app.request("/cloudflare/queues/smoke", {
      headers: {
        "x-request-id": "req-cloudflare-queue-denied"
      },
      method: "POST"
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-cloudflare-queue-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /cloudflare/queues/smoke",
      status: "forbidden"
    });
  });

  it("reports missing bindings for the Cloudflare queue smoke route", async () => {
    const response = await app.request("/cloudflare/queues/smoke", {
      headers: {
        "x-aiphabee-smoke": "cloudflare-bindings-runtime-v1",
        "x-request-id": "req-cloudflare-queue-missing"
      },
      method: "POST"
    });
    const body = (await response.json()) as CloudflareQueueSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("failed");
    expect(body.missing_bindings).toEqual(["AIPHABEE_EVENTS_QUEUE"]);
    expect(body.queue_result).toMatchObject({
      binding_name: "AIPHABEE_EVENTS_QUEUE",
      failure_code: "missing_queue_binding",
      status: "missing_binding",
      surface: "queue_publish_consume_smoke"
    });
  });

  it("publishes and verifies a consumed Cloudflare Queue smoke message", async () => {
    const { env, kv, kvStore, queue } = createQueueSmokeEnv();
    const response = await app.request(
      "/cloudflare/queues/smoke",
      {
        headers: {
          "x-aiphabee-smoke": "cloudflare-bindings-runtime-v1",
          "x-request-id": "req-cloudflare-queue-ok"
        },
        method: "POST"
      },
      env
    );
    const body = (await response.json()) as CloudflareQueueSmokeBody;
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      missing_bindings: [],
      request_id: "req-cloudflare-queue-ok",
      route: "POST /cloudflare/queues/smoke",
      status: "ok",
      synthetic_prefix: "aiphabee-smoke"
    });
    expect(body.response_hash).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(body.queue_result).toMatchObject({
      binding_name: "AIPHABEE_EVENTS_QUEUE",
      operation_count: 3,
      status: "passed",
      surface: "queue_publish_consume_smoke"
    });
    expect(body.queue_result.message_hash).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(queue.send).toHaveBeenCalledTimes(1);
    expect(kv.get).toHaveBeenCalledTimes(1);
    expect(kv.delete).toHaveBeenCalledTimes(1);
    expect(kvStore.size).toBe(0);
    expect(serialized).not.toContain("/runtime/queue/");
  });

  it("writes Cloudflare Queue consumer smoke evidence to KV", async () => {
    const { env, kv } = createQueueSmokeEnv();
    const ack = vi.fn();

    await app.queue(
      {
        messages: [
          {
            ack,
            body: {
              evidence_key: "aiphabee-smoke/runtime/queue/test-message",
              issued_at: "2026-06-22T00:00:00.000Z",
              kind: "aiphabee.queue.smoke.v1",
              message_hash:
                "sha256:0000000000000000000000000000000000000000000000000000000000000000",
              smoke_id: "test-message"
            }
          }
        ],
        queue: "aiphabee-events-queue"
      },
      env
    );

    expect(kv.put).toHaveBeenCalledWith(
      "aiphabee-smoke/runtime/queue/test-message",
      expect.stringContaining("\"status\":\"consumed\"")
    );
    expect(ack).toHaveBeenCalledTimes(1);
  });

  it("rejects the Durable Object smoke route without the smoke header", async () => {
    const response = await app.request("/cloudflare/durable-objects/smoke", {
      headers: {
        "x-request-id": "req-cloudflare-do-denied"
      },
      method: "POST"
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-cloudflare-do-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /cloudflare/durable-objects/smoke",
      status: "forbidden"
    });
  });

  it("reports a missing Durable Object namespace binding", async () => {
    const response = await app.request("/cloudflare/durable-objects/smoke", {
      headers: {
        "x-aiphabee-smoke": "cloudflare-bindings-runtime-v1",
        "x-request-id": "req-cloudflare-do-missing"
      },
      method: "POST"
    });
    const body = (await response.json()) as CloudflareDurableObjectSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("failed");
    expect(body.missing_bindings).toEqual(["AIPHABEE_RUN_COORDINATOR"]);
    expect(body.durable_object_result).toMatchObject({
      binding_name: "AIPHABEE_RUN_COORDINATOR",
      failure_code: "missing_durable_object_binding",
      status: "missing_binding",
      surface: "durable_object_state_smoke"
    });
  });

  it("runs a Durable Object state smoke through the namespace binding", async () => {
    const { env, namespace, stub } = createDurableObjectSmokeEnv();
    const response = await app.request(
      "/cloudflare/durable-objects/smoke",
      {
        headers: {
          "x-aiphabee-smoke": "cloudflare-bindings-runtime-v1",
          "x-request-id": "req-cloudflare-do-ok"
        },
        method: "POST"
      },
      env
    );
    const body = (await response.json()) as CloudflareDurableObjectSmokeBody;
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      missing_bindings: [],
      request_id: "req-cloudflare-do-ok",
      route: "POST /cloudflare/durable-objects/smoke",
      status: "ok",
      synthetic_prefix: "aiphabee-smoke"
    });
    expect(body.response_hash).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(body.durable_object_result).toMatchObject({
      binding_name: "AIPHABEE_RUN_COORDINATOR",
      operation_count: 3,
      status: "passed",
      surface: "durable_object_state_smoke"
    });
    expect(namespace.idFromName).toHaveBeenCalledTimes(1);
    expect(namespace.get).toHaveBeenCalledTimes(1);
    expect(stub.fetch).toHaveBeenCalledWith(
      "https://aiphabee.internal/cloudflare/durable-objects/smoke",
      expect.objectContaining({
        method: "POST"
      })
    );
    expect(serialized).not.toContain("/runtime/do/");
    expect(serialized).not.toContain("/runtime/do-state/");
  });

  it("writes, reads, and deletes Durable Object smoke state", async () => {
    const { state, storage, storageMap } = createDurableObjectState();
    const durableObject = new AiphaBeeRunCoordinator(state);
    const response = await durableObject.fetch(
      new Request("https://aiphabee.internal/cloudflare/durable-objects/smoke", {
        body: JSON.stringify({
          kind: "aiphabee.durable-object.smoke.v1",
          smoke_id: "test-message",
          state_key: "aiphabee-smoke/runtime/do-state/test-message",
          value_hash:
            "sha256:2222222222222222222222222222222222222222222222222222222222222222"
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      })
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      operation_count: 3,
      status: "ok",
      value_hash:
        "sha256:2222222222222222222222222222222222222222222222222222222222222222"
    });
    expect(storage.put).toHaveBeenCalledTimes(1);
    expect(storage.get).toHaveBeenCalledTimes(1);
    expect(storage.delete).toHaveBeenCalledWith(
      "aiphabee-smoke/runtime/do-state/test-message"
    );
    expect(storageMap.size).toBe(0);
  });

  it("rejects the Workflow smoke route without the smoke header", async () => {
    const response = await app.request("/cloudflare/workflows/smoke", {
      headers: {
        "x-request-id": "req-cloudflare-workflow-denied"
      },
      method: "POST"
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-cloudflare-workflow-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /cloudflare/workflows/smoke",
      status: "forbidden"
    });
  });

  it("reports a missing Workflow binding", async () => {
    const response = await app.request("/cloudflare/workflows/smoke", {
      headers: {
        "x-aiphabee-smoke": "cloudflare-bindings-runtime-v1",
        "x-request-id": "req-cloudflare-workflow-missing"
      },
      method: "POST"
    });
    const body = (await response.json()) as CloudflareWorkflowSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("failed");
    expect(body.missing_bindings).toEqual(["AIPHABEE_RESEARCH_WORKFLOW"]);
    expect(body.workflow_result).toMatchObject({
      binding_name: "AIPHABEE_RESEARCH_WORKFLOW",
      failure_code: "missing_workflow_binding",
      status: "missing_binding",
      surface: "workflow_instance_execution"
    });
  });

  it("creates a Workflow instance and verifies Workflow-written smoke evidence", async () => {
    const { env, kv, kvStore, workflow } = createWorkflowSmokeEnv();
    const response = await app.request(
      "/cloudflare/workflows/smoke",
      {
        headers: {
          "x-aiphabee-smoke": "cloudflare-bindings-runtime-v1",
          "x-request-id": "req-cloudflare-workflow-ok"
        },
        method: "POST"
      },
      env
    );
    const body = (await response.json()) as CloudflareWorkflowSmokeBody;
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      missing_bindings: [],
      request_id: "req-cloudflare-workflow-ok",
      route: "POST /cloudflare/workflows/smoke",
      status: "ok",
      synthetic_prefix: "aiphabee-smoke"
    });
    expect(body.response_hash).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(body.workflow_result).toMatchObject({
      binding_name: "AIPHABEE_RESEARCH_WORKFLOW",
      operation_count: 3,
      status: "passed",
      surface: "workflow_instance_execution"
    });
    expect(body.workflow_result.instance_id_hash).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(workflow.create).toHaveBeenCalledTimes(1);
    expect(kv.get).toHaveBeenCalledTimes(1);
    expect(kv.delete).toHaveBeenCalledTimes(1);
    expect(kvStore.size).toBe(0);
    expect(serialized).not.toContain("/runtime/workflow/");
  });

  it("records Workflow smoke evidence from the Workflow class", async () => {
    const { env, kv, kvStore } = createWorkflowSmokeEnv();
    const workflow = new AiphaBeeResearchWorkflow({} as never, env);
    const step = {
      do: vi.fn(async (_name: string, callback: () => Promise<unknown>) => callback())
    };
    const result = await workflow.run(
      {
        instanceId: "workflow-instance-test",
        payload: {
          evidence_key: "aiphabee-smoke/runtime/workflow/test-message",
          issued_at: "2026-06-22T00:00:00.000Z",
          kind: "aiphabee.workflow.smoke.v1",
          smoke_id: "test-message",
          value_hash:
            "sha256:3333333333333333333333333333333333333333333333333333333333333333"
        },
        timestamp: new Date("2026-06-22T00:00:00.000Z"),
        workflowName: "AiphaBeeResearchWorkflow"
      },
      step as never
    );

    expect(result).toMatchObject({
      operation_count: 1,
      status: "ok",
      value_hash:
        "sha256:3333333333333333333333333333333333333333333333333333333333333333"
    });
    expect(step.do).toHaveBeenCalledTimes(1);
    expect(kv.put).toHaveBeenCalledTimes(1);
    expect(kvStore.get("aiphabee-smoke/runtime/workflow/test-message")).toContain(
      "\"status\":\"executed\""
    );
  });

  it("rejects the Cron smoke route without the smoke header", async () => {
    const response = await app.request("/cloudflare/cron/smoke", {
      headers: {
        "x-request-id": "req-cloudflare-cron-denied"
      },
      method: "POST"
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-cloudflare-cron-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /cloudflare/cron/smoke",
      status: "forbidden"
    });
  });

  it("reports missing KV for the Cron smoke route", async () => {
    const response = await app.request("/cloudflare/cron/smoke", {
      headers: {
        "x-aiphabee-smoke": "cloudflare-bindings-runtime-v1",
        "x-request-id": "req-cloudflare-cron-missing"
      },
      method: "POST"
    });
    const body = (await response.json()) as CloudflareCronSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("failed");
    expect(body.missing_bindings).toEqual(["AIPHABEE_CONFIG"]);
    expect(body.cron_result).toMatchObject({
      binding_name: "AIPHABEE_MAINTENANCE_CRON",
      failure_code: "missing_kv_binding",
      status: "missing_binding",
      surface: "cron_handler_smoke"
    });
  });

  it("rejects the natural Cron evidence route without the smoke header", async () => {
    const response = await app.request("/cloudflare/cron/natural-evidence", {
      headers: {
        "x-request-id": "req-cloudflare-cron-natural-denied"
      },
      method: "POST"
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-cloudflare-cron-natural-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /cloudflare/cron/natural-evidence",
      status: "forbidden"
    });
  });

  it("reports missing KV for the natural Cron evidence route", async () => {
    const response = await app.request("/cloudflare/cron/natural-evidence", {
      headers: {
        "x-aiphabee-smoke": "cloudflare-bindings-runtime-v1",
        "x-request-id": "req-cloudflare-cron-natural-missing"
      },
      method: "POST"
    });
    const body = (await response.json()) as CloudflareCronSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("failed");
    expect(body.missing_bindings).toEqual(["AIPHABEE_CONFIG"]);
    expect(body.cron_result).toMatchObject({
      binding_name: "AIPHABEE_MAINTENANCE_CRON",
      failure_code: "missing_kv_binding",
      status: "missing_binding",
      surface: "cron_natural_trigger_evidence"
    });
  });

  it("reports missing retained evidence for the natural Cron evidence route", async () => {
    const { env, kvStore } = createCronSmokeEnv();
    const response = await app.request(
      "/cloudflare/cron/natural-evidence",
      {
        body: "null",
        headers: {
          "content-type": "application/json",
          "x-aiphabee-smoke": "cloudflare-bindings-runtime-v1",
          "x-request-id": "req-cloudflare-cron-natural-marker-missing"
        },
        method: "POST"
      },
      env
    );
    const body = (await response.json()) as CloudflareCronSmokeBody;
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(424);
    expect(body.status).toBe("failed");
    expect(body.missing_bindings).toEqual([]);
    expect(body.cron_result).toMatchObject({
      binding_name: "AIPHABEE_MAINTENANCE_CRON",
      failure_code: "cron_natural_evidence_missing",
      status: "failed",
      surface: "cron_natural_trigger_evidence"
    });
    expect(kvStore.size).toBe(0);
    expect(serialized).not.toContain("/runtime/cron-natural/latest");
    expect(serialized).not.toContain("*/30 * * * *");
  });

  it("rejects the Hyperdrive smoke route without the smoke header", async () => {
    const response = await app.request("/cloudflare/hyperdrive/smoke", {
      headers: {
        "x-request-id": "req-cloudflare-hyperdrive-denied"
      },
      method: "POST"
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-cloudflare-hyperdrive-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /cloudflare/hyperdrive/smoke",
      status: "forbidden"
    });
  });

  it("reports missing Hyperdrive binding for the Hyperdrive smoke route", async () => {
    const response = await app.request("/cloudflare/hyperdrive/smoke", {
      headers: {
        "x-aiphabee-smoke": "cloudflare-bindings-runtime-v1",
        "x-request-id": "req-cloudflare-hyperdrive-missing"
      },
      method: "POST"
    });
    const body = (await response.json()) as CloudflareHyperdriveSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("failed");
    expect(body.missing_bindings).toEqual(["AIPHABEE_HYPERDRIVE"]);
    expect(body.hyperdrive_result).toMatchObject({
      binding_name: "AIPHABEE_HYPERDRIVE",
      failure_code: "missing_hyperdrive_binding",
      status: "missing_binding",
      surface: "hyperdrive_select_1_smoke"
    });
  });

  it("rejects the Hyperdrive schema inventory route without the smoke header", async () => {
    const response = await app.request("/cloudflare/hyperdrive/schema-inventory", {
      headers: {
        "x-request-id": "req-cloudflare-hyperdrive-schema-inventory-denied"
      },
      method: "POST"
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-cloudflare-hyperdrive-schema-inventory-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /cloudflare/hyperdrive/schema-inventory",
      status: "forbidden"
    });
  });

  it("reports missing Hyperdrive binding for the Hyperdrive schema inventory route", async () => {
    const response = await app.request("/cloudflare/hyperdrive/schema-inventory", {
      headers: {
        "x-aiphabee-smoke": "cloudflare-bindings-runtime-v1",
        "x-request-id": "req-cloudflare-hyperdrive-schema-inventory-missing"
      },
      method: "POST"
    });
    const body = (await response.json()) as CloudflareHyperdriveSchemaInventoryBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("failed");
    expect(body.missing_bindings).toEqual(["AIPHABEE_HYPERDRIVE"]);
    expect(body.hyperdrive_schema_inventory_result).toMatchObject({
      binding_name: "AIPHABEE_HYPERDRIVE",
      failure_code: "missing_hyperdrive_binding",
      status: "missing_binding",
      surface: "platform_umbrella_schema_inventory"
    });
  });

  it("rejects the platform RLS fixture smoke route without the smoke header", async () => {
    const response = await app.request("/cloudflare/hyperdrive/platform-rls-fixture-smoke", {
      headers: {
        "x-request-id": "req-platform-rls-fixture-denied"
      },
      method: "POST"
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-platform-rls-fixture-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /cloudflare/hyperdrive/platform-rls-fixture-smoke",
      status: "forbidden"
    });
  });

  it("reports missing Hyperdrive binding for the platform RLS fixture smoke route", async () => {
    const response = await app.request("/cloudflare/hyperdrive/platform-rls-fixture-smoke", {
      headers: {
        "x-aiphabee-smoke": "cloudflare-bindings-runtime-v1",
        "x-request-id": "req-platform-rls-fixture-missing"
      },
      method: "POST"
    });
    const body = (await response.json()) as PlatformUmbrellaRlsFixtureSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("failed");
    expect(body.missing_bindings).toEqual(["AIPHABEE_HYPERDRIVE"]);
    expect(body.rls_fixture_result).toMatchObject({
      binding_name: "AIPHABEE_HYPERDRIVE",
      failure_code: "missing_hyperdrive_binding",
      status: "missing_binding",
      surface: "platform_umbrella_rls_fixture_smoke"
    });
  });

  it("rejects the platform runtime role smoke route without the smoke header", async () => {
    const response = await app.request("/cloudflare/hyperdrive/platform-runtime-role-smoke", {
      headers: {
        "x-request-id": "req-platform-runtime-role-denied"
      },
      method: "POST"
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-platform-runtime-role-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /cloudflare/hyperdrive/platform-runtime-role-smoke",
      status: "forbidden"
    });
  });

  it("reports missing Hyperdrive binding for the platform runtime role smoke route", async () => {
    const response = await app.request("/cloudflare/hyperdrive/platform-runtime-role-smoke", {
      headers: {
        "x-aiphabee-smoke": "cloudflare-bindings-runtime-v1",
        "x-request-id": "req-platform-runtime-role-missing"
      },
      method: "POST"
    });
    const body = (await response.json()) as PlatformRuntimeRoleSmokeBody;

    expect(response.status).toBe(424);
    expect(body.status).toBe("failed");
    expect(body.missing_bindings).toEqual(["AIPHABEE_HYPERDRIVE"]);
    expect(body.runtime_role_result).toMatchObject({
      binding_name: "AIPHABEE_HYPERDRIVE",
      failure_code: "missing_hyperdrive_binding",
      status: "missing_binding",
      surface: "platform_runtime_role_smoke"
    });
  });

  it("runs the Cron handler smoke path through KV evidence", async () => {
    const { env, kv, kvStore } = createCronSmokeEnv();
    const response = await app.request(
      "/cloudflare/cron/smoke",
      {
        headers: {
          "x-aiphabee-smoke": "cloudflare-bindings-runtime-v1",
          "x-request-id": "req-cloudflare-cron-ok"
        },
        method: "POST"
      },
      env
    );
    const body = (await response.json()) as CloudflareCronSmokeBody;
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      missing_bindings: [],
      request_id: "req-cloudflare-cron-ok",
      route: "POST /cloudflare/cron/smoke",
      status: "ok",
      synthetic_prefix: "aiphabee-smoke"
    });
    expect(body.response_hash).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(body.cron_result).toMatchObject({
      binding_name: "AIPHABEE_MAINTENANCE_CRON",
      operation_count: 3,
      status: "passed",
      surface: "cron_handler_smoke"
    });
    expect(kv.put).toHaveBeenCalledTimes(1);
    expect(kv.get).toHaveBeenCalledTimes(1);
    expect(kv.delete).toHaveBeenCalledTimes(1);
    expect(kvStore.size).toBe(0);
    expect(serialized).not.toContain("/runtime/cron/");
    expect(serialized).not.toContain("*/30 * * * *");
  });

  it("registers the scheduled handler smoke task with waitUntil", async () => {
    const { env, kv, kvStore } = createCronSmokeEnv();
    const tasks: Promise<unknown>[] = [];
    const waitUntil = vi.fn((task: Promise<unknown>) => {
      tasks.push(task);
    });

    app.scheduled(
      {
        cron: "*/30 * * * *",
        scheduledTime: Date.parse("2026-06-22T00:00:00.000Z"),
        type: "scheduled"
      },
      env,
      { waitUntil }
    );

    await Promise.all(tasks);

    expect(waitUntil).toHaveBeenCalledTimes(1);
    expect(kv.put).toHaveBeenCalledTimes(1);
    expect(kv.get).toHaveBeenCalledTimes(1);
    expect(kv.delete).not.toHaveBeenCalled();
    expect(kvStore.size).toBe(1);
    expect([...kvStore.keys()][0]).toContain("/runtime/cron-natural/latest");
  });

  it("reads retained natural Cron trigger evidence without exposing the raw key", async () => {
    const { env, kvStore } = createCronSmokeEnv();
    const tasks: Promise<unknown>[] = [];

    app.scheduled(
      {
        cron: "*/30 * * * *",
        scheduledTime: Date.parse("2026-06-22T00:00:00.000Z"),
        type: "scheduled"
      },
      env,
      {
        waitUntil(task: Promise<unknown>) {
          tasks.push(task);
        }
      }
    );

    await Promise.all(tasks);

    const response = await app.request(
      "/cloudflare/cron/natural-evidence",
      {
        body: JSON.stringify({
          after_issued_at: "2020-01-01T00:00:00.000Z"
        }),
        headers: {
          "content-type": "application/json",
          "x-aiphabee-smoke": "cloudflare-bindings-runtime-v1",
          "x-request-id": "req-cloudflare-cron-natural-ok"
        },
        method: "POST"
      },
      env
    );
    const body = (await response.json()) as CloudflareCronSmokeBody;
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      missing_bindings: [],
      request_id: "req-cloudflare-cron-natural-ok",
      route: "POST /cloudflare/cron/natural-evidence",
      status: "ok",
      synthetic_prefix: "aiphabee-smoke"
    });
    expect(body.cron_result).toMatchObject({
      binding_name: "AIPHABEE_MAINTENANCE_CRON",
      operation_count: 1,
      status: "passed",
      surface: "cron_natural_trigger_evidence"
    });
    expect(body.response_hash).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(kvStore.size).toBe(1);
    expect(serialized).not.toContain("/runtime/cron-natural/latest");
    expect(serialized).not.toContain("*/30 * * * *");
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

  it("serves public runtime capabilities for status and docs surfaces", async () => {
    const response = await app.request("/public/runtime", {
      headers: {
        "x-request-id": "req-public-runtime"
      }
    });
    const body = (await response.json()) as PublicRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      auth_required: false,
      docs_route: "GET /public/docs",
      frontend: false,
      live_deployment_verified: false,
      live_incident_feed: false,
      persistent_writes: false,
      request_id_visible: true,
      route: "GET /public/runtime",
      sql_emitted: false,
      status: "public_status_docs_scaffold",
      status_route: "GET /public/status"
    });
    expect(body.data.document_kinds).toEqual([
      "api_reference",
      "mcp_reference",
      "privacy_policy",
      "terms_of_service"
    ]);
    expect(body.data.status_components).toContain("remote_mcp");
    expect(body.data.compliance_ops_release_gate).toMatchObject({
      route: "POST /public/release-gates/compliance-ops/plan",
      status: "compliance_ops_release_gate_scaffold"
    });
    expect(body.data.publication_economics_release_gate).toMatchObject({
      route: "POST /public/release-gates/publication-economics/plan",
      status: "publication_economics_release_gate_scaffold"
    });
  });

  it("serves public status page components with evidence routes", async () => {
    const response = await app.request("/public/status", {
      headers: {
        "x-request-id": "req-public-status"
      }
    });
    const body = (await response.json()) as PublicStatusBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      live_incident_feed: false,
      persistent_writes: false,
      request_id: "req-public-status",
      request_id_visible: true,
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(body.data.status_page).toMatchObject({
      auth_required: false,
      component_count: 5,
      publication_status: "local_scaffold_ready",
      route: "GET /public/status"
    });
    expect(body.data.components.map((component) => component.component_id)).toEqual([
      "worker_api",
      "remote_mcp",
      "data_gateway",
      "usage_billing",
      "public_documentation"
    ]);
    expect(body.data.components.find((component) => component.component_id === "remote_mcp")).toMatchObject({
      evidence_route: "/mcp/runtime",
      request_id_visible: true,
      status: "default_deny_scaffold"
    });
    expect(body.data.capability.status).toBe("public_status_docs_scaffold");
    expect(body.usage.rows).toBe(5);
  });

  it("serves public API, MCP, privacy, and terms docs manifest", async () => {
    const response = await app.request("/public/docs", {
      headers: {
        "x-request-id": "req-public-docs"
      }
    });
    const body = (await response.json()) as PublicDocsBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      live_publication_verified: false,
      persistent_writes: false,
      request_id: "req-public-docs",
      request_id_visible: true,
      route: "GET /public/docs",
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(body.data.documents.map((document) => document.kind)).toEqual([
      "api_reference",
      "mcp_reference",
      "privacy_policy",
      "terms_of_service"
    ]);
    expect(body.data.documents.find((document) => document.kind === "api_reference")).toMatchObject({
      path: "docs/public/api.md",
      publication_status: "local_draft_ready"
    });
    expect(body.data.documents.find((document) => document.kind === "privacy_policy")).toMatchObject({
      legal_review_required: true,
      path: "docs/public/privacy.md"
    });
    expect(body.data.documents.find((document) => document.kind === "terms_of_service")).toMatchObject({
      legal_review_required: true,
      path: "docs/public/terms.md"
    });
    expect(body.data.capability.status).toBe("public_status_docs_scaffold");
    expect(body.usage.rows).toBe(4);
  });

  it("plans compliance ops release gate drills without live writes", async () => {
    const response = await app.request("/public/release-gates/compliance-ops/plan", {
      body: JSON.stringify({
        as_of: "2026-06-22T00:00:00.000Z",
        support_agent_id: "support_agent_001",
        target_request_id: "req_incident_target",
        workspace_id: "workspace_ops"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-compliance-ops-release-gate"
      },
      method: "POST"
    });
    const body = (await response.json()) as ComplianceOpsReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      capability: {
        route: "POST /public/release-gates/compliance-ops/plan",
        status: "compliance_ops_release_gate_scaffold"
      },
      request_id: "req-compliance-ops-release-gate",
      route: "POST /public/release-gates/compliance-ops/plan",
      status: "planned_no_write",
      version: "2026-06-22.phase3.compliance-ops-release-gate-scaffold.v0"
    });
    expect(body.data.compliance_boundary).toMatchObject({
      external_legal_opinion_present: false,
      reviewed_surfaces: ["product_pages", "prompts", "marketing_copy", "pricing"],
      type4_written_opinion_required: true
    });
    expect(body.data.kill_switch_drill.plan.decision).toMatchObject({
      model_request_blocked: true,
      safe_degradation_required: true,
      tool_execution_blocked: true
    });
    expect(body.data.kill_switch_drill.plan.safe_degradation.user_visible_state).toBe(true);
    expect(body.data.incident_response_drill.support_plan).toMatchObject({
      request_id_visible: true,
      status: "planned_no_write"
    });
    expect(body.data.incident_response_drill.support_plan.investigation).toMatchObject({
      target_request_id: "req_incident_target"
    });
    expect(body.data.incident_response_drill.support_plan.investigation.planned_sources).toContain(
      "public_status_component"
    );
    expect(body.data.incident_response_drill.support_plan.privacy.sensitive_content_released).toBe(
      false
    );
    expect(body.data.audit_export_drill).toMatchObject({
      event_count: 1,
      export_format: "jsonl",
      sensitive_payload_released: false
    });
    expect(body.data.audit_export_drill.required_fields).toContain("request_id");
    expect(body.data.audit_export_drill.required_fields).toContain("audit.denied_tools");
    expect(body.data.audit_export_drill.audit_event).toMatchObject({
      event_type: "run.audit",
      outcome: "rejected",
      request_id: "req-compliance-ops-release-gate",
      route: "POST /public/release-gates/compliance-ops/plan"
    });
    expect(body.data.release_checks.map((check) => check.check)).toEqual([
      "type4_research_boundary_copy_reviewed",
      "marketing_copy_forbidden_advice_claims_absent",
      "kill_switch_safe_degradation_drill_planned",
      "incident_response_request_id_trace_drill_planned",
      "audit_export_contains_required_fields_and_excludes_sensitive_payloads",
      "public_status_incident_disclosure_surface_present"
    ]);
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.release_gate).toMatchObject({
      blockers: [
        "external_compliance_legal_signoff_missing",
        "live_kill_switch_flag_source_missing",
        "live_incident_feed_missing",
        "live_audit_export_store_missing",
        "frontend_release_ops_ui_missing"
      ],
      gate_status: "blocked_live_compliance_ops_validation",
      no_live_release_claim: true
    });
    expect(body.data.validation.all_checks_passed).toBe(true);
    expect(body.data.validation.live_release_claimed).toBe(false);
    expect(body.usage.rows).toBe(6);
  });

  it("serves licensed advice runtime with advice generation disabled", async () => {
    const response = await app.request("/compliance/licensed-advice/runtime", {
      headers: {
        "x-request-id": "req-licensed-advice-runtime"
      }
    });
    const body = (await response.json()) as LicensedAdviceRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      advice_generation_enabled: false,
      auth_required: true,
      default_status: "blocked_until_licensed_path_confirmed",
      frontend: false,
      live_model_execution: false,
      order_execution: false,
      persistent_writes: false,
      route: "GET /compliance/licensed-advice/runtime",
      runtime_route: "GET /compliance/licensed-advice/runtime",
      sql_emitted: false,
      status: "licensed_advice_exploration_scaffold"
    });
    expect(body.data.exploration_plan).toMatchObject({
      advice_generation_enabled: false,
      route: "POST /compliance/licensed-advice/exploration/plan",
      status: "licensed_advice_exploration_scaffold"
    });
    expect(body.data.exploration_plan.forbidden_unlicensed_outputs).toContain(
      "buy_sell_hold_recommendation"
    );
    expect(body.usage.rows).toBe(0);
  });

  it("plans licensed advice exploration without generating advice or orders", async () => {
    const response = await app.request("/compliance/licensed-advice/exploration/plan", {
      body: JSON.stringify({
        advice_record_retention_policy_id: "retention_policy_001",
        complaint_handling_policy_id: "complaint_policy_001",
        human_review_queue_id: "human_review_queue_001",
        kill_switch_policy_id: "kill_switch_policy_001",
        legal_review_status: "approved",
        licensed_entity_id: "licensed_entity_001",
        proposed_surface: "suitability_based_recommendation",
        responsible_officer_id: "ro_001",
        suitability_profile_schema_id: "suitability_schema_001",
        type4_written_opinion_id: "type4_opinion_001",
        workspace_id: "ws_compliance_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-licensed-advice-plan"
      },
      method: "POST"
    });
    const body = (await response.json()) as LicensedAdviceExplorationPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend: false,
      live_model_execution: false,
      order_execution: false,
      persistent_writes: false,
      request_id: "req-licensed-advice-plan",
      sql_emitted: false,
      status: "planned_no_write",
      workspace_id: "ws_compliance_alpha"
    });
    expect(body.data.advice_output_policy).toEqual({
      buy_sell_hold_recommendation: false,
      copy_trading_instruction: false,
      evidence_only_fallback: true,
      order_routing: false,
      personalized_suitability_conclusion: false,
      research_tool_boundary_preserved_until_licensed: true,
      target_position_size: false
    });
    expect(body.data.legal_review).toMatchObject({
      external_legal_opinion_required: true,
      legal_review_status: "approved",
      type4_written_opinion_id: "type4_opinion_001"
    });
    expect(body.data.legal_review.regulatory_source_urls).toContain(
      "https://www.sfc.hk/en/Rules-and-standards/Suitability-requirement"
    );
    expect(body.data.licensed_path).toMatchObject({
      licensed_entity_id: "licensed_entity_001",
      proposed_surface: "suitability_based_recommendation",
      responsible_officer_id: "ro_001",
      supervision_required: true
    });
    expect(body.data.suitability_controls).toMatchObject({
      advice_record_retention_policy_id: "retention_policy_001",
      complaint_handling_policy_id: "complaint_policy_001",
      human_review_queue_id: "human_review_queue_001",
      suitability_profile_schema_id: "suitability_schema_001",
      suitability_required: true
    });
    expect(body.data.compliance_controls).toMatchObject({
      answer_evidence_route: "POST /agent/runs/validate-answer",
      compliance_release_gate_route: "POST /public/release-gates/compliance-ops/plan",
      kill_switch_policy_id: "kill_switch_policy_001",
      kill_switch_route: "POST /agent/kill-switch/plan"
    });
    expect(body.data.validation).toMatchObject({
      legal_review_approved: true,
      licensed_path_present: true,
      required_context_present: true,
      supervision_controls_present: true,
      suitability_controls_present: true,
      unsupported_surfaces: []
    });
    expect(body.usage.rows).toBe(8);
  });

  it("blocks licensed advice exploration until the licensed path is confirmed", async () => {
    const response = await app.request("/compliance/licensed-advice/exploration/plan", {
      body: JSON.stringify({
        proposed_surface: "personalized_buy_sell_hold",
        workspace_id: "ws_compliance_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-licensed-advice-blocked"
      },
      method: "POST"
    });
    const body = (await response.json()) as LicensedAdviceExplorationPlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("blocked_unlicensed_path");
    expect(body.data.validation.licensed_path_present).toBe(false);
    expect(body.data.validation.legal_review_approved).toBe(false);
    expect(body.data.advice_output_policy.buy_sell_hold_recommendation).toBe(false);
    expect(body.data.order_execution).toBe(false);
    expect(body.usage.rows).toBe(0);
  });

  it("plans public publication and unit economics release gate without live writes", async () => {
    const response = await app.request("/public/release-gates/publication-economics/plan", {
      body: JSON.stringify({
        as_of: "2026-06-22T00:30:00.000Z"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-publication-economics-release-gate"
      },
      method: "POST"
    });
    const body = (await response.json()) as PublicationEconomicsReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      capability: {
        route: "POST /public/release-gates/publication-economics/plan",
        status: "publication_economics_release_gate_scaffold"
      },
      frontend: false,
      live_deployment_verified: false,
      live_finance_signoff: false,
      live_legal_approval: false,
      request_id: "req-publication-economics-release-gate",
      route: "POST /public/release-gates/publication-economics/plan",
      status: "planned_no_write",
      validation: {
        all_checks_passed: true,
        docs_manifest_publication_ready: true,
        help_center_manifest_ready: true,
        live_release_claimed: false,
        package_pricing_catalog_present: true,
        privacy_terms_publication_ready: true,
        public_status_page_ready: true,
        unit_economics_positive: true,
        writes_blocked: true
      },
      version: "2026-06-22.phase3.publication-economics-release-gate-scaffold.v0"
    });
    expect(body.data.docs_publication.public_status_page.status_page).toMatchObject({
      publication_status: "local_scaffold_ready"
    });
    expect(body.data.docs_publication.docs_manifest.documents.map((document) => document.kind)).toEqual([
      "api_reference",
      "mcp_reference",
      "privacy_policy",
      "terms_of_service"
    ]);
    expect(body.data.docs_publication.help_center).toMatchObject({
      doc_path: "docs/public/help-center.md",
      live_chat_enabled: false
    });
    expect(body.data.docs_publication.help_center.help_topics).toHaveLength(6);
    expect(body.data.package_pricing.catalog.plans.map((plan) => plan.plan_code)).toEqual([
      "pro",
      "developer"
    ]);
    expect(body.data.unit_economics.plans.find((plan) => plan.plan_code === "pro")).toMatchObject({
      contribution_margin_positive: true,
      contribution_margin_ratio_bps: 7149,
      target_margin_ratio_bps: 7000
    });
    expect(body.data.unit_economics.plans.find((plan) => plan.plan_code === "developer")).toMatchObject({
      contribution_margin_positive: true,
      contribution_margin_ratio_bps: 6119,
      target_margin_ratio_bps: 6000
    });
    expect(body.data.release_checks.map((check) => check.check)).toEqual([
      "public_status_page_scaffold_published",
      "help_center_manifest_published",
      "privacy_and_terms_publication_ready",
      "package_pricing_catalog_present",
      "unit_economics_positive_for_expected_usage",
      "live_publication_and_finance_writes_blocked"
    ]);
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.release_gate).toMatchObject({
      blockers: [
        "live_public_status_page_deployment_missing",
        "live_help_center_deployment_missing",
        "final_privacy_terms_legal_approval_missing",
        "live_pricing_provider_missing",
        "finance_unit_economics_signoff_missing",
        "frontend_public_release_surface_missing"
      ],
      gate_status: "blocked_live_publication_economics_validation",
      no_live_release_claim: true
    });
    expect(body.usage.rows).toBe(6);
  });

  it("serves support runtime capabilities for request_id investigation", async () => {
    const response = await app.request("/support/runtime", {
      headers: {
        "x-request-id": "req-support-runtime"
      }
    });
    const body = (await response.json()) as SupportRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      default_sensitive_content_access: false,
      frontend: false,
      help_center_route: "GET /support/help-center",
      investigation_route: "POST /support/request-id-investigation/plan",
      live_billing_provider_reads: false,
      live_log_reads: false,
      persistent_writes: false,
      request_id_required: true,
      route: "GET /support/runtime",
      sql_emitted: false,
      status: "support_request_id_investigation_scaffold",
      support_agent_required: true
    });
    expect(body.data.support_lookup_fields).toEqual(
      expect.arrayContaining(["request_id", "tool_name", "usage_event_id", "invoice_line_id"])
    );
    expect(body.data.sensitive_fields_forbidden_by_default).toEqual(
      expect.arrayContaining(["raw_prompt", "generated_answer", "payment_method"])
    );
  });

  it("serves help center topics with request_id escalation path", async () => {
    const response = await app.request("/support/help-center", {
      headers: {
        "x-request-id": "req-support-help"
      }
    });
    const body = (await response.json()) as SupportHelpCenterBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      doc_path: "docs/public/help-center.md",
      live_chat_enabled: false,
      persistent_writes: false,
      request_id_visible: true,
      route: "GET /support/help-center",
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(body.data.help_topics.map((topic) => topic.topic_code)).toEqual([
      "account_billing",
      "mcp_connection",
      "data_quality",
      "usage_quota",
      "privacy_account",
      "incident_status"
    ]);
    expect(
      body.data.help_topics.every(
        (topic) => topic.escalation_path === "POST /support/request-id-investigation/plan"
      )
    ).toBe(true);
    expect(body.data.capability.status).toBe("support_request_id_investigation_scaffold");
    expect(body.usage.rows).toBe(6);
  });

  it("plans request_id support investigation without sensitive content access", async () => {
    const response = await app.request("/support/request-id-investigation/plan", {
      body: JSON.stringify({
        category: "mcp_connection",
        reason: "customer_reported_auth_required",
        support_agent_id: "support_agent_001",
        target_request_id: "req_mcp_123",
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-support-plan"
      },
      method: "POST"
    });
    const body = (await response.json()) as SupportInvestigationPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      persistent_writes: false,
      request_id: "req-support-plan",
      request_id_visible: true,
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(body.data.audit).toMatchObject({
      audit_event: "support.request_id_investigation.plan",
      support_agent_id: "support_agent_001",
      table: "aiphabee_audit.support_investigation_event",
      write_status: "planned_no_write"
    });
    expect(body.data.investigation).toMatchObject({
      live_billing_provider_reads: false,
      live_log_reads: false,
      target_request_id: "req_mcp_123"
    });
    expect(body.data.investigation.billing_trace).toMatchObject({
      request_id_join: true,
      usage_event_id: "usage_event_req_mcp_123"
    });
    expect(body.data.privacy).toMatchObject({
      default_sensitive_content_access: false,
      include_sensitive_content_requested: false,
      sensitive_content_released: false
    });
    expect(body.data.privacy.forbidden_fields).toContain("raw_prompt");
    expect(body.data.capability.status).toBe("support_request_id_investigation_scaffold");
    expect(body.usage.rows).toBe(1);
  });

  it("blocks support investigation when context is missing or sensitive content is requested", async () => {
    const missingResponse = await app.request("/support/request-id-investigation/plan", {
      body: JSON.stringify({}),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-support-missing"
      },
      method: "POST"
    });
    const sensitiveResponse = await app.request("/support/request-id-investigation/plan", {
      body: JSON.stringify({
        include_sensitive_content: true,
        support_agent_id: "support_agent_001",
        target_request_id: "req_mcp_123"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-support-sensitive"
      },
      method: "POST"
    });
    const missingBody = (await missingResponse.json()) as SupportInvestigationPlanBody;
    const sensitiveBody = (await sensitiveResponse.json()) as SupportInvestigationPlanBody;

    expect(missingResponse.status).toBe(200);
    expect(missingBody.data.status).toBe("blocked_missing_context");
    expect(missingBody.data.validation.required_context_present).toBe(false);
    expect(missingBody.data.support_ticket.ticket_status).toBe("blocked");
    expect(missingBody.usage.rows).toBe(0);
    expect(sensitiveResponse.status).toBe(200);
    expect(sensitiveBody.data.status).toBe("blocked_sensitive_content_request");
    expect(sensitiveBody.data.validation.sensitive_request_blocked).toBe(true);
    expect(sensitiveBody.data.privacy).toMatchObject({
      include_sensitive_content_requested: true,
      sensitive_content_released: false
    });
    expect(sensitiveBody.usage.rows).toBe(0);
  });

  it("serves private sharing runtime capabilities", async () => {
    const response = await app.request("/sharing/runtime", {
      headers: {
        "x-request-id": "req-sharing-runtime"
      }
    });
    const body = (await response.json()) as PrivateSharingRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      capability_name: "private_sharing_links",
      frontend: false,
      live_data_access: false,
      persistent_writes: false,
      recipient_data_rights_expansion: false,
      recipient_entitlement_recheck: true,
      required_scope: "exports.read",
      route: "POST /sharing/private-links/plan",
      runtime_route: "GET /sharing/runtime",
      privacy_share_release_gate: {
        account_data_request_route: "POST /account/data-requests/plan",
        private_share_route: "POST /sharing/private-links/plan",
        recipient_data_rights_expansion: false,
        route: "POST /sharing/release-gates/privacy-share/plan",
        share_expands_recipient_rights: false,
        status: "privacy_share_release_gate_scaffold"
      },
      status: "private_share_link_scaffold",
      uses_data_access_gateway: true,
      watermark_required: true
    });
    expect(body.data.supported_statuses).toContain("blocked_recipient_gateway_denied");
  });

  it("plans private share links without expanding recipient data rights", async () => {
    const response = await app.request("/sharing/private-links/plan", {
      body: JSON.stringify({
        as_of: "2026-06-21T00:00:00.000Z",
        creator_account_id: "acct_creator",
        creator_scopes: ["exports.read"],
        creator_workspace_id: "ws_creator",
        expires_in_hours: 24,
        fields: ["synthetic_profile.company_name", "synthetic_profile.revenue"],
        recipient_account_id: "acct_recipient",
        recipient_scopes: ["exports.read"],
        recipient_workspace_id: "ws_recipient",
        requested_rows: 5
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-private-share-plan"
      },
      method: "POST"
    });
    const body = (await response.json()) as PrivateShareLinkPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend: false,
      live_data_access: false,
      persistent_writes: false,
      request_id: "req-private-share-plan",
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(body.data.access_policy).toMatchObject({
      effective_fields: ["synthetic_profile.company_name"],
      recipient_data_rights_expansion: false,
      recipient_entitlement_rechecked: true,
      redacted_fields: ["synthetic_profile.revenue"],
      release_state: "planned_private_share",
      share_expands_recipient_rights: false
    });
    expect(body.data.gateway_decisions.creator.status).toBe("planned_no_write");
    expect(body.data.gateway_decisions.recipient.status).toBe("planned_no_write");
    expect(body.data.link).toMatchObject({
      link_handle_materialized: false,
      public_indexing: false,
      share_ref: "planned_no_write",
      url: "not_generated",
      visibility: "private_link"
    });
    expect(body.data.watermark).toMatchObject({
      required: true
    });
    expect(body.data.watermark.text).toContain("req-private-share-plan");
    expect(body.data.capability.status).toBe("private_share_link_scaffold");
    expect(body.usage.rows).toBe(1);
  });

  it("blocks private share planning when recipient scope is missing", async () => {
    const response = await app.request("/sharing/private-links/plan", {
      body: JSON.stringify({
        creator_account_id: "acct_creator",
        creator_scopes: ["exports.read"],
        creator_workspace_id: "ws_creator",
        recipient_account_id: "acct_recipient",
        recipient_scopes: [],
        recipient_workspace_id: "ws_recipient"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-private-share-blocked"
      },
      method: "POST"
    });
    const body = (await response.json()) as PrivateShareLinkPlanBody;

    expect(response.status).toBe(200);
    expect(body.data.status).toBe("blocked_recipient_missing_scope");
    expect(body.data.access_policy.release_state).toBe("blocked");
    expect(body.data.scope.recipient).toMatchObject({
      granted: false,
      required: "exports.read"
    });
    expect(body.data.validation.required_context_present).toBe(true);
    expect(body.usage.rows).toBe(0);
  });

  it("plans privacy/share release gate with personal-data retention and no share expansion", async () => {
    const response = await app.request("/sharing/release-gates/privacy-share/plan", {
      body: JSON.stringify({
        account_id: "acct_privacy",
        as_of: "2026-06-22T00:00:00.000Z",
        creator_account_id: "acct_creator",
        creator_scopes: ["exports.read"],
        creator_workspace_id: "ws_creator",
        fields: ["synthetic_profile.company_name", "synthetic_profile.revenue"],
        recipient_account_id: "acct_recipient",
        recipient_scopes: ["exports.read"],
        recipient_workspace_id: "ws_recipient",
        request_scopes: ["account_profile", "subscription_billing", "usage_ledger", "audit_log"],
        retention_policy_version: "retention-v1",
        workspace_id: "ws_privacy"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-privacy-share-gate"
      },
      method: "POST"
    });
    const body = (await response.json()) as PrivacyShareReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      request_id: "req-privacy-share-gate",
      route: "POST /sharing/release-gates/privacy-share/plan",
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(body.data.account_data_request_gate.download_plan).toMatchObject({
      delivery: {
        download_status: "planned_no_write",
        secure_delivery_required: true
      },
      status: "planned_no_write"
    });
    expect(body.data.account_data_request_gate.delete_plan.execution_plan).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ action: "retain", scope: "subscription_billing" }),
        expect.objectContaining({ action: "retain", scope: "usage_ledger" }),
        expect.objectContaining({ action: "retain", scope: "audit_log" })
      ])
    );
    expect(body.data.private_share_gate.no_expansion_policy).toMatchObject({
      effective_fields: ["synthetic_profile.company_name"],
      recipient_data_rights_expansion: false,
      recipient_entitlement_rechecked: true,
      redacted_fields: ["synthetic_profile.revenue"],
      share_expands_recipient_rights: false
    });
    expect(body.data.private_share_gate.plan.link).toMatchObject({
      public_indexing: false,
      url: "not_generated"
    });
    expect(body.data.validation).toMatchObject({
      all_checks_passed: true,
      personal_data_delete_respects_retention_holds: true,
      personal_data_download_delivery_is_scoped_and_no_write: true,
      private_link_has_expiry_watermark_and_no_public_index: true,
      share_link_does_not_expand_rights: true,
      share_link_effective_fields_are_intersection: true,
      share_link_rechecks_recipient_entitlement: true
    });
    expect(body.data.release_gate).toMatchObject({
      gate_status: "blocked_live_privacy_share_validation",
      no_live_release_claim: true
    });
    expect(body.data.capability.status).toBe("privacy_share_release_gate_scaffold");
    expect(body.usage.rows).toBe(body.data.release_checks.length);
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
    expect(body.data.package_pricing).toMatchObject({
      billing_provider_calls: false,
      currency: "HKD",
      frontend: false,
      live_prices: false,
      persistent_writes: false,
      route: "GET /account/package-pricing",
      sql_emitted: false,
      status: "package_pricing_scaffold"
    });
    expect(body.data.package_pricing.plan_codes).toEqual(["pro", "developer"]);
    expect(body.data.session_management).toMatchObject({
      cookie_issued: false,
      revoke_supported: true,
      status: "planned_no_write"
    });
    expect(body.data.enterprise_controls).toMatchObject({
      frontend: false,
      live_directory_sync: false,
      live_identity_provider_calls: false,
      live_private_connector_calls: false,
      persistent_writes: false,
      route: "POST /account/enterprise-controls/plan",
      sql_emitted: false,
      status: "enterprise_controls_scaffold"
    });
    expect(body.data.enterprise_controls.plan_codes).toEqual(["team", "enterprise"]);
    expect(body.data.enterprise_controls.supported_controls).toEqual([
      "seats",
      "sso",
      "audit",
      "private_data_connector"
    ]);
    expect(body.data.authorized_memory).toMatchObject({
      actual_memory_reads: false,
      editable: true,
      persistent_writes: false,
      route: "POST /account/authorized-memory/plan",
      status: "authorized_session_memory_scaffold",
      supported_actions: ["view", "upsert", "delete"],
      table: "aiphabee_core.authorized_session_memory",
      user_visible_controls: ["view", "edit", "delete"]
    });
    expect(body.data.authorized_memory.allowed_keys).toContain("mcp_scope_consent");
    expect(body.data.authorized_memory.forbidden_payloads).toEqual(
      expect.arrayContaining(["raw_prompt", "generated_answer", "oauth_access_token"])
    );
    expect(body.data.data_requests).toMatchObject({
      frontend: false,
      live_data_export: false,
      persistent_writes: false,
      route: "POST /account/data-requests/plan",
      sql_emitted: false,
      status: "account_data_request_scaffold",
      user_visible_controls: ["download", "delete_request", "status"]
    });
    expect(body.data.data_requests.request_actions).toEqual(["download", "delete"]);
    expect(body.data.data_requests.request_scopes).toContain("usage_ledger");
    expect(body.data.data_requests.retention_policy).toMatchObject({
      retention_hold_scopes: ["subscription_billing", "usage_ledger", "audit_log"],
      source: "docs/researches/AiphaBee_PRD_v1.0.md#ACC-05"
    });
    expect(body.data.data_requests.audit).toMatchObject({
      event_table: "aiphabee_audit.account_data_request_event",
      required: true,
      status: "planned_no_write"
    });
    expect(body.data.subscription_lifecycle).toMatchObject({
      billing_provider_calls: false,
      frontend: false,
      persistent_writes: false,
      route: "POST /account/subscription/lifecycle/plan",
      sql_emitted: false,
      status: "subscription_lifecycle_audit_scaffold"
    });
    expect(body.data.subscription_lifecycle.audit).toMatchObject({
      event_table: "aiphabee_audit.subscription_lifecycle_event",
      required: true,
      status: "planned_no_write"
    });
    expect(body.data.subscription_lifecycle.supported_actions).toContain("enter_grace_period");
    expect(body.data.forbidden_payloads).toContain("password");
  });

  it("serves partner runtime capabilities without live embed or API execution", async () => {
    const response = await app.request("/partner/runtime", {
      headers: {
        "x-request-id": "req-partner-runtime"
      }
    });
    const body = (await response.json()) as PartnerRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      auth_required: true,
      frontend: false,
      live_api_execution: false,
      live_embed_rendering: false,
      persistent_writes: false,
      route: "GET /partner/runtime",
      runtime_route: "GET /partner/runtime",
      sql_emitted: false,
      status: "partner_runtime_scaffold"
    });
    expect(body.data.white_label_embeds).toMatchObject({
      data_gateway_required: true,
      embed_script_generated: false,
      partner_rights_matrix_required: true,
      route: "POST /partner/white-label-embeds/plan",
      settlement_route: "POST /usage/partner-reconciliation/plan",
      status: "white_label_embed_scaffold"
    });
    expect(body.usage.rows).toBe(0);
  });

  it("plans white-label embeds and MCP API without generating frontend assets", async () => {
    const response = await app.request("/partner/white-label-embeds/plan", {
      body: JSON.stringify({
        allowed_origins: ["https://broker.example.com"],
        brand_mode: "white_label",
        commercial_model: "minimum_guarantee_overage",
        data_scopes: ["research_outputs", "analytics_results"],
        partner_id: "partner_broker_alpha",
        partner_name: "Broker Alpha",
        partner_type: "brokerage",
        requested_surfaces: ["research_widget", "mcp_api"],
        revenue_share_bps: 2500,
        workspace_id: "ws_partner_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-partner-embed"
      },
      method: "POST"
    });
    const body = (await response.json()) as PartnerWhiteLabelEmbedPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend: false,
      live_api_execution: false,
      live_embed_rendering: false,
      persistent_writes: false,
      request_id: "req-partner-embed",
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(body.data.partner).toMatchObject({
      partner_id: "partner_broker_alpha",
      partner_type: "brokerage",
      workspace_id: "ws_partner_alpha"
    });
    expect(body.data.embed).toMatchObject({
      allowed_origins: ["https://broker.example.com"],
      csp_required: true,
      public_indexing: false,
      script_bundle_generated: false,
      surfaces: ["research_widget", "mcp_api"]
    });
    expect(body.data.mcp_api).toMatchObject({
      api_key_route: "POST /mcp/api-keys/create/plan",
      live_execution: false,
      mcp_route: "POST /mcp",
      oauth_route: "POST /mcp/oauth/authorize/plan",
      usage_envelope_required: true
    });
    expect(body.data.commercial_model).toMatchObject({
      model: "minimum_guarantee_overage",
      revenue_share_bps: 2500,
      settlement_route: "POST /usage/partner-reconciliation/plan",
      settlement_status: "planned_no_write"
    });
    expect(body.data.data_governance).toMatchObject({
      default_deny_until_signed: true,
      external_redistribution_allowed: false,
      field_authorization_required: true,
      partner_rights_matrix_required: true
    });
    expect(body.data.capability).toMatchObject({
      route: "POST /partner/white-label-embeds/plan",
      status: "white_label_embed_scaffold"
    });
    expect(body.usage.rows).toBe(2);
  });

  it("blocks white-label embeds without an HTTPS origin allowlist", async () => {
    const response = await app.request("/partner/white-label-embeds/plan", {
      body: JSON.stringify({
        allowed_origins: ["http://broker.example.com"],
        commercial_model: "fixed_annual_license",
        partner_id: "partner_broker_alpha",
        partner_type: "brokerage",
        requested_surfaces: ["research_widget"],
        workspace_id: "ws_partner_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-partner-embed-blocked"
      },
      method: "POST"
    });
    const body = (await response.json()) as PartnerWhiteLabelEmbedPlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("blocked_invalid_origin");
    expect(body.data.embed.allowed_origins).toEqual([]);
    expect(body.data.validation.valid_allowed_origins).toBe(false);
    expect(body.data.persistent_writes).toBe(false);
    expect(body.usage.rows).toBe(0);
  });

  it("plans Team Enterprise controls without live providers or writes", async () => {
    const response = await app.request("/account/enterprise-controls/plan", {
      body: JSON.stringify({
        account_id: "acct_enterprise_admin_001",
        plan_code: "enterprise",
        private_connector_kind: "customer_warehouse",
        private_connector_name: "warehouse_readonly_alpha",
        requested_controls: ["seats", "sso", "audit", "private_data_connector"],
        seat_limit: 250,
        sso_domain_hash: "sha256:domain-hash",
        sso_protocol: "saml",
        workspace_id: "ws_enterprise_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-enterprise-controls"
      },
      method: "POST"
    });
    const body = (await response.json()) as AccountEnterpriseControlsPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend: false,
      live_directory_sync: false,
      live_identity_provider_calls: false,
      live_private_connector_calls: false,
      persistent_writes: false,
      plan_code: "enterprise",
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(body.data.controls.seats).toMatchObject({
      directory_sync_status: "planned_no_live",
      pending_invite_count: 3,
      seat_limit: 250,
      write_status: "planned_no_write"
    });
    expect(body.data.controls.sso).toMatchObject({
      credential_material_stored: false,
      domain_hash_provided: true,
      identity_provider_calls: false,
      metadata_validation_status: "planned_no_live",
      protocol: "saml",
      write_status: "planned_no_write"
    });
    expect(body.data.controls.audit).toMatchObject({
      export_status: "planned_no_write",
      raw_payload_stored: false,
      retention_required: true
    });
    expect(body.data.controls.private_data_connector).toMatchObject({
      connection_test_status: "planned_no_live",
      connector_kind: "customer_warehouse",
      credential_material_stored: false,
      rights_gateway_required: true,
      write_status: "planned_no_write"
    });
    expect(body.data.security).toEqual({
      credential_material_stored: false,
      default_deny_until_approved: true,
      partner_rights_matrix_required: true,
      raw_connection_string_included: false,
      raw_email_included: false
    });
    expect(body.data.capability).toMatchObject({
      route: "POST /account/enterprise-controls/plan",
      status: "enterprise_controls_scaffold"
    });
    expect(body.usage.rows).toBe(4);
  });

  it("blocks enterprise controls for non-enterprise plans", async () => {
    const response = await app.request("/account/enterprise-controls/plan", {
      body: JSON.stringify({
        account_id: "acct_internal_001",
        plan_code: "developer",
        requested_controls: ["seats"],
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-enterprise-controls-blocked"
      },
      method: "POST"
    });
    const body = (await response.json()) as AccountEnterpriseControlsPlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("blocked_enterprise_plan_required");
    expect(body.data.validation.allowed_plan_codes).toEqual(["team", "enterprise"]);
    expect(body.data.persistent_writes).toBe(false);
    expect(body.usage.rows).toBe(0);
  });

  it("serves Pro and Developer package pricing catalog without live billing", async () => {
    const response = await app.request("/account/package-pricing", {
      headers: {
        "x-request-id": "req-package-pricing"
      }
    });
    const body = (await response.json()) as AccountPackagePricingBody;
    const pro = body.data.plans.find((plan) => plan.plan_code === "pro");
    const developer = body.data.plans.find((plan) => plan.plan_code === "developer");

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      billing_provider_calls: false,
      currency: "HKD",
      persistent_writes: false,
      pricing_source: "docs/researches/AiphaBee_PRD_v1.0.md#15.2",
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(body.data.assumptions).toContain("not_final_quote");
    expect(body.data.plan_codes).toEqual(["pro", "developer"]);
    expect(body.data.capability).toMatchObject({
      route: "GET /account/package-pricing",
      status: "package_pricing_scaffold"
    });
    expect(pro).toMatchObject({
      amount_minor: 22800,
      display_price: "HK$228",
      price_status: "validation_assumption_not_final_quote"
    });
    expect(pro?.usage_quota).toMatchObject({
      credit_limit: 5000,
      quota_contract: "deploy/usage/quota-display.contract.json"
    });
    expect(developer).toMatchObject({
      amount_minor: 68800,
      display_price: "HK$688+",
      price_status: "validation_assumption_not_final_quote"
    });
    expect(developer?.entitlements).toMatchObject({
      api_key: true,
      bulk_pagination: true,
      multiple_mcp_connections: true,
      pro_web_entitlements: true
    });
    expect(developer?.overage).toMatchObject({
      billing_provider_calls: false,
      enabled: true,
      status: "planned_no_write"
    });
    expect(developer?.redistribution).toMatchObject({
      commercial_external_redistribution: false,
      export_requires_field_authorization: true,
      partner_rights_matrix_required: true
    });
    expect(body.usage).toMatchObject({
      credits: 0,
      rows: 2
    });
  });

  it("plans account data download and deletion requests with retention controls", async () => {
    const downloadResponse = await app.request("/account/data-requests/plan", {
      body: JSON.stringify({
        account_id: "acct_internal_001",
        action: "download",
        requested_at: "2026-06-21T12:00:00.000Z",
        request_scopes: ["account_profile", "authorized_memory", "usage_ledger"],
        retention_policy_version: "retention-v1",
        verified_by: "support_agent_001",
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-account-data-download"
      },
      method: "POST"
    });
    const deleteResponse = await app.request("/account/data-requests/plan", {
      body: JSON.stringify({
        accountId: "acct_internal_001",
        action: "delete",
        requestedAt: "2026-06-21T12:00:00.000Z",
        requestScopes: ["account_profile", "subscription_billing", "audit_log"],
        retentionPolicyVersion: "retention-v1",
        workspaceId: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-account-data-delete"
      },
      method: "POST"
    });
    const downloadBody = (await downloadResponse.json()) as AccountDataRequestPlanBody;
    const deleteBody = (await deleteResponse.json()) as AccountDataRequestPlanBody;

    expect(downloadResponse.status).toBe(200);
    expect(downloadBody.ok).toBe(true);
    expect(downloadBody.data).toMatchObject({
      action: "download",
      persistent_writes: false,
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(downloadBody.data.capability).toMatchObject({
      route: "POST /account/data-requests/plan",
      status: "account_data_request_scaffold"
    });
    expect(downloadBody.data.delivery).toMatchObject({
      download_format: "json",
      download_status: "planned_no_write",
      secure_delivery_required: true
    });
    expect(downloadBody.data.audit).toMatchObject({
      audit_event: "account.data_request.plan",
      policy_version: "retention-v1",
      request_id: "req-account-data-download",
      table: "aiphabee_audit.account_data_request_event",
      verified_by: "support_agent_001",
      write_status: "planned_no_write"
    });
    expect(downloadBody.data.execution_plan.map((step) => step.action)).toEqual([
      "export",
      "export",
      "export"
    ]);
    expect(downloadBody.data.privacy).toMatchObject({
      credential_material_included: false,
      raw_email_included: false,
      raw_prompt_included: false,
      retained_for_audit_scopes: ["usage_ledger"]
    });
    expect(downloadBody.usage.rows).toBe(3);

    expect(deleteResponse.status).toBe(200);
    expect(deleteBody.data.action).toBe("delete");
    expect(deleteBody.data.execution_plan).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          action: "schedule_erasure",
          scope: "account_profile"
        }),
        expect.objectContaining({
          action: "retain",
          scope: "subscription_billing"
        }),
        expect.objectContaining({
          action: "retain",
          scope: "audit_log"
        })
      ])
    );
    expect(deleteBody.data.retention_policy).toMatchObject({
      erasure_policy: "delete_or_anonymize_when_not_retained",
      policy_version: "retention-v1",
      retention_hold_scopes: ["subscription_billing", "usage_ledger", "audit_log"]
    });
    expect(deleteBody.data.validation).toMatchObject({
      audit_required: true,
      required_context_present: true,
      retention_policy_present: true
    });
    expect(deleteBody.usage.rows).toBe(3);
  });

  it("blocks unsupported account data request scopes before planning writes", async () => {
    const response = await app.request("/account/data-requests/plan", {
      body: JSON.stringify({
        account_id: "acct_internal_001",
        action: "delete",
        requested_at: "2026-06-21T12:00:00.000Z",
        request_scopes: ["account_profile", "raw_prompt_archive"],
        retention_policy_version: "retention-v1",
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-account-data-unsupported"
      },
      method: "POST"
    });
    const body = (await response.json()) as AccountDataRequestPlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("blocked_unsupported_scope");
    expect(body.data.request.unsupported_scopes).toEqual(["raw_prompt_archive"]);
    expect(body.data.validation.unsupported_scopes).toEqual(["raw_prompt_archive"]);
    expect(body.data.persistent_writes).toBe(false);
    expect(body.usage.rows).toBe(0);
  });

  it("plans authorized session memory view and deletion without live reads or writes", async () => {
    const viewResponse = await app.request("/account/authorized-memory/plan", {
      body: JSON.stringify({
        account_id: "acct_internal_001",
        action: "view",
        memory_keys: ["preferred_locale", "response_depth"],
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-authorized-memory-view"
      },
      method: "POST"
    });
    const deleteResponse = await app.request("/account/authorized-memory/plan", {
      body: JSON.stringify({
        account_id: "acct_internal_001",
        action: "delete",
        memory_key: "mcp_scope_consent",
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-authorized-memory-delete"
      },
      method: "POST"
    });
    const viewBody = (await viewResponse.json()) as AccountAuthorizedMemoryPlanBody;
    const deleteBody = (await deleteResponse.json()) as AccountAuthorizedMemoryPlanBody;

    expect(viewResponse.status).toBe(200);
    expect(viewBody.ok).toBe(true);
    expect(viewBody.data).toMatchObject({
      action: "view",
      persistent_writes: false,
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(viewBody.data.memory).toMatchObject({
      allowed_keys: ["preferred_locale", "response_depth"],
      read_status: "planned_no_live_read",
      table: "aiphabee_core.authorized_session_memory",
      upsert_status: "not_requested"
    });
    expect(viewBody.data.policy).toMatchObject({
      actual_memory_reads: false,
      authorized_information_only: true,
      credential_material_stored: false,
      financial_values_stored: false,
      generated_answers_stored: false,
      raw_prompt_stored: false,
      user_visible_controls: ["view", "edit", "delete"]
    });
    expect(viewBody.data.policy.forbidden_payload_fields).toContain("financial_fact_value");
    expect(viewBody.data.capability.status).toBe("authorized_session_memory_scaffold");
    expect(viewBody.usage.rows).toBe(2);

    expect(deleteResponse.status).toBe(200);
    expect(deleteBody.data.memory).toMatchObject({
      allowed_keys: ["mcp_scope_consent"],
      delete_status: "planned_no_write",
      read_status: "not_requested"
    });
    expect(deleteBody.usage.rows).toBe(1);
  });

  it("blocks unauthorized session memory keys before planning writes", async () => {
    const response = await app.request("/account/authorized-memory/plan", {
      body: JSON.stringify({
        account_id: "acct_internal_001",
        action: "upsert",
        memory_key: "last_research_answer",
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-authorized-memory-blocked"
      },
      method: "POST"
    });
    const body = (await response.json()) as AccountAuthorizedMemoryPlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("blocked_unsupported_memory_key");
    expect(body.data.memory.unsupported_keys).toEqual(["last_research_answer"]);
    expect(body.data.validation.unsupported_memory_keys).toEqual(["last_research_answer"]);
    expect(body.data.persistent_writes).toBe(false);
    expect(body.usage.rows).toBe(0);
  });

  it("plans auditable subscription lifecycle changes without billing provider calls", async () => {
    const response = await app.request("/account/subscription/lifecycle/plan", {
      body: JSON.stringify({
        account_id: "acct_internal_001",
        action: "upgrade",
        current_billing_state: "active",
        current_plan_code: "plus",
        effective_at: "2026-07-01T00:00:00.000Z",
        reason: "user_requested_upgrade",
        subscription_id: "sub_ws_internal_alpha_plus",
        target_plan_code: "developer",
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-subscription-lifecycle"
      },
      method: "POST"
    });
    const body = (await response.json()) as AccountSubscriptionLifecyclePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      persistent_writes: false,
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(body.data.subscription).toMatchObject({
      current_billing_state: "active",
      current_plan_code: "plus",
      lifecycle_status: "planned_no_write",
      subscription_id: "sub_ws_internal_alpha_plus",
      target_billing_state: "active",
      target_plan_code: "developer"
    });
    expect(body.data.audit).toMatchObject({
      action: "upgrade",
      audit_event: "account.subscription.lifecycle.plan",
      actor_account_id: "acct_internal_001",
      request_id: "req-subscription-lifecycle",
      table: "aiphabee_audit.subscription_lifecycle_event",
      write_status: "planned_no_write"
    });
    expect(body.data.billing_provider).toMatchObject({
      calls: false,
      invoice_preview: false,
      provider: "not_configured"
    });
    expect(body.data.capability.status).toBe("subscription_lifecycle_audit_scaffold");
    expect(body.data.validation).toMatchObject({
      audit_required: true,
      required_context_present: true
    });
    expect(body.usage.rows).toBe(1);
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
      table: "platform.account"
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
    expect(body.data.billing_reconciliation).toMatchObject({
      billing_provider_calls: false,
      freshness_target_minutes: 5,
      live_ledger_reads: false,
      persistent_writes: false,
      request_id_visible: true,
      route: "POST /usage/billing/reconciliation/plan",
      runtime_route: "GET /usage/runtime",
      sql_emitted: false,
      status: "usage_billing_reconciliation_scaffold"
    });
    expect(body.data.billing_reconciliation.trace_fields).toEqual([
      "request_id",
      "usage_event_id",
      "ledger_entry_id",
      "invoice_line_id"
    ]);
    expect(body.data.partner_reconciliation_report).toMatchObject({
      billing_provider_calls: false,
      frontend: false,
      live_ledger_reads: false,
      partner_sla_report: true,
      persistent_writes: false,
      raw_personal_contact_included: false,
      request_id_visible: true,
      route: "POST /usage/partner-reconciliation/plan",
      runtime_route: "GET /usage/runtime",
      sql_emitted: false,
      status: "partner_reconciliation_report_scaffold"
    });
    expect(body.data.partner_reconciliation_report.group_by).toEqual([
      "dataset",
      "channel",
      "package_code",
      "user_id"
    ]);
    expect(body.data.partner_reconciliation_report.trace_fields).toEqual([
      "request_id",
      "usage_event_id",
      "dataset",
      "channel",
      "package_code",
      "user_id"
    ]);
    expect(body.data.partner_sla_reconciliation_readiness).toMatchObject({
      frontend: false,
      live_ledger_reads: false,
      live_partner_report_artifact_store: false,
      live_support_log_reads: false,
      partner_portal_delivery: false,
      partner_reconciliation_route: "POST /usage/partner-reconciliation/plan",
      partner_support_release_gate_route: "POST /usage/release-gates/partner-support/plan",
      persistent_writes: false,
      route: "GET /usage/partner-sla/reconciliation-readiness",
      runtime_route: "GET /usage/runtime",
      sql_emitted: false,
      status: "partner_sla_reconciliation_readiness_scaffold"
    });
    expect(body.data.partner_sla_reconciliation_readiness.supported_cadences).toEqual([
      "daily",
      "weekly"
    ]);
    expect(body.data.partner_sla_reconciliation_readiness.required_sla_fields).toEqual([
      "data_delay_minutes",
      "missing_rows",
      "error_count",
      "backfill_count"
    ]);
    expect(body.data.high_cost_reservation).toMatchObject({
      failure_refund_required: true,
      live_ledger_writes: false,
      persistent_writes: false,
      pre_debit_required: true,
      request_id_visible: true,
      route: "POST /usage/high-cost/reservation/plan",
      runtime_route: "GET /usage/runtime",
      sql_emitted: false,
      status: "high_cost_usage_reservation_scaffold",
      usage_ledger_link_required: true
    });
    expect(body.data.billing_rules_release_gate).toMatchObject({
      account_package_route: "GET /account/package-pricing",
      billing_provider_calls: false,
      billing_reconciliation_route: "POST /usage/billing/reconciliation/plan",
      frontend: false,
      high_cost_reservation_route: "POST /usage/high-cost/reservation/plan",
      invoice_writes: false,
      live_billing_provider: false,
      live_ledger_reads: false,
      live_ledger_writes: false,
      persistent_writes: false,
      quota_route: "POST /usage/quota/plan",
      route: "POST /usage/release-gates/billing-rules/plan",
      runtime_route: "GET /usage/runtime",
      sql_emitted: false,
      status: "billing_rules_release_gate_scaffold",
      subscription_route: "POST /account/subscription/lifecycle/plan"
    });
    expect(body.data.billing_rules_release_gate.required_checks).toContain(
      "invoice_credits_match_usage_ledger_credits"
    );
    expect(body.data.partner_support_release_gate).toMatchObject({
      billing_provider_calls: false,
      frontend: false,
      live_ledger_reads: false,
      live_partner_report_artifact_store: false,
      live_support_log_reads: false,
      partner_portal_delivery: false,
      partner_reconciliation_route: "POST /usage/partner-reconciliation/plan",
      persistent_writes: false,
      request_id_drill_required: true,
      route: "POST /usage/release-gates/partner-support/plan",
      runtime_route: "GET /usage/runtime",
      sql_emitted: false,
      status: "partner_support_release_gate_scaffold",
      support_help_center_route: "GET /support/help-center",
      support_investigation_route: "POST /support/request-id-investigation/plan",
      support_runtime_route: "GET /support/runtime"
    });
    expect(body.data.partner_support_release_gate.required_checks).toContain(
      "support_request_id_investigation_metadata_only"
    );
  });

  it("serves DAT-10 partner SLA reconciliation readiness without live ledger reads", async () => {
    const response = await app.request("/usage/partner-sla/reconciliation-readiness", {
      headers: {
        "x-request-id": "req-usage-partner-sla-readiness"
      }
    });
    const body = (await response.json()) as UsagePartnerSlaReconciliationReadinessBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend: false,
      live_ledger_reads: false,
      live_partner_report_artifact_store: false,
      live_support_log_reads: false,
      partner_portal_delivery: false,
      request_id: "req-usage-partner-sla-readiness",
      sql_emitted: false,
      status: "partner_sla_reconciliation_readiness_passed"
    });
    expect(body.data.capability).toMatchObject({
      route: "GET /usage/partner-sla/reconciliation-readiness",
      status: "partner_sla_reconciliation_readiness_scaffold"
    });
    expect(body.data.daily_report.period.cadence).toBe("daily");
    expect(body.data.daily_report.status).toBe("planned_no_write");
    expect(body.data.daily_report.rows).toHaveLength(4);
    expect(body.data.weekly_report.period.cadence).toBe("weekly");
    expect(body.data.weekly_report.status).toBe("planned_no_write");
    expect(body.data.weekly_report.traceability).toMatchObject({
      traceable_to_usage_ledger: true,
      traceable_usage_event_count: 4
    });
    expect(body.data.weekly_report.sla.required_fields).toEqual([
      "data_delay_minutes",
      "missing_rows",
      "error_count",
      "backfill_count"
    ]);
    expect(body.data.weekly_report.sla.status).toBe("attention_required");
    expect(body.data.sla_summary).toEqual({
      backfill_count: 1,
      daily_line_count: 4,
      delayed_line_count: 1,
      error_count: 1,
      missing_rows: 3,
      weekly_line_count: 4
    });
    expect(body.data.readiness).toMatchObject({
      all_checks_passed: true,
      daily_report_generated: true,
      live_release_claimed: false,
      live_surfaces_blocked: true,
      partner_support_release_gate_passed: true,
      request_usage_trace_complete: true,
      sensitive_payloads_excluded: true,
      sla_counters_cover_delay_missing_error_backfill: true,
      weekly_report_generated: true
    });
    expect(body.data.release_checks).toHaveLength(7);
    expect(body.data.release_checks.every((check) => check.status === "pass")).toBe(true);
    expect(body.data.support_release_gate.validation.all_checks_passed).toBe(true);
    expect(body.data.release_gate).toEqual({
      blockers: [
        "live_usage_ledger_reads_missing",
        "live_partner_report_artifact_store_missing",
        "partner_portal_delivery_missing",
        "final_partner_settlement_approval_missing"
      ],
      status: "blocked_live_partner_sla_reconciliation"
    });
    expect(body.data.usage_fixture_rows).toHaveLength(4);
    expect(body.usage.rows).toBe(7);
  });

  it("plans billing rules release gate checks against package, subscription, and usage surfaces", async () => {
    const response = await app.request("/usage/release-gates/billing-rules/plan", {
      body: JSON.stringify({
        account_id: "acct_internal_001",
        billing_period_end: "2026-07-01T00:00:00.000Z",
        billing_period_start: "2026-06-01T00:00:00.000Z",
        invoice_id: "inv_ws_internal_alpha_202606",
        subscription_id: "sub_ws_internal_alpha_developer",
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-usage-billing-rules"
      },
      method: "POST"
    });
    const body = (await response.json()) as UsageBillingRulesReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      live_billing_provider: false,
      live_invoice_writes: false,
      live_ledger_reads: false,
      request_id: "req-usage-billing-rules",
      sql_emitted: false,
      status: "planned_no_write",
      workspace_id: "ws_internal_alpha"
    });
    expect(body.data.capability).toMatchObject({
      route: "POST /usage/release-gates/billing-rules/plan",
      status: "billing_rules_release_gate_scaffold"
    });
    expect(body.data.package_rules).toMatchObject({
      developer_credit_limit: 10000,
      developer_overage_enabled: true,
      pro_credit_limit: 5000
    });
    expect(body.data.subscription_rules.lifecycle_plan.billing_provider).toMatchObject({
      calls: false,
      proration_preview: false,
      refund_preview: false
    });
    expect(body.data.billing_reconciliation_gate.plan.consistency).toMatchObject({
      invoice_credits: 640,
      ledger_credits: 640,
      status: "matched"
    });
    expect(body.data.billing_reconciliation_gate.plan.traceability).toMatchObject({
      traceable_call_count: 2,
      traceable_to_call: true
    });
    expect(body.data.high_cost_gate.reservation_plan.pre_debit).toMatchObject({
      pre_debit_credits: 20,
      status: "planned_no_write"
    });
    expect(body.data.high_cost_gate.failed_refund_plan.failure_refund).toMatchObject({
      refund_credits: 20,
      status: "planned_no_write"
    });
    expect(body.data.high_cost_gate.failed_refund_plan.reservation.reservation_id).toBe(
      body.data.high_cost_gate.reservation_plan.reservation.reservation_id
    );
    expect(body.data.validation.all_checks_passed).toBe(true);
    expect(body.data.validation.live_release_claimed).toBe(false);
    expect(body.data.release_checks).toHaveLength(6);
    expect(body.data.release_checks.every((check) => check.status === "pass")).toBe(true);
    expect(body.data.release_gate).toMatchObject({
      status: "blocked_live_billing_rules_validation"
    });
    expect(body.data.release_gate.blockers).toContain("live_billing_provider_missing");
    expect(body.usage.rows).toBe(6);
  });

  it("plans partner support release gate by joining reconciliation rows to request_id investigation", async () => {
    const response = await app.request("/usage/release-gates/partner-support/plan", {
      body: JSON.stringify({
        partner_id: "partner_hk_data",
        period_end: "2026-06-08T00:00:00.000Z",
        period_start: "2026-06-01T00:00:00.000Z",
        support_agent_id: "support_agent_001",
        target_request_id: "req_partner_mcp_quote_001",
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-usage-partner-support-gate"
      },
      method: "POST"
    });
    const body = (await response.json()) as UsagePartnerSupportReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend: false,
      live_ledger_reads: false,
      live_partner_report_artifact_store: false,
      live_support_log_reads: false,
      partner_portal_delivery: false,
      request_id: "req-usage-partner-support-gate",
      sql_emitted: false,
      status: "planned_no_write",
      workspace_id: "ws_internal_alpha"
    });
    expect(body.data.capability).toMatchObject({
      route: "POST /usage/release-gates/partner-support/plan",
      status: "partner_support_release_gate_scaffold"
    });
    expect(body.data.partner_reconciliation_gate.plan).toMatchObject({
      status: "planned_no_write"
    });
    expect(body.data.partner_reconciliation_gate.plan.rows).toHaveLength(2);
    expect(body.data.partner_reconciliation_gate.plan.rows[1]).toMatchObject({
      channel: "mcp",
      credits: 10,
      dataset: "hk_equity_quote",
      missing_rows: 2,
      package_code: "developer",
      request_ids: ["req_partner_mcp_quote_001", "req_partner_mcp_quote_001_delayed"],
      sla_status: "exception",
      usage_count: 4,
      user_id: "user_ops_001"
    });
    expect(body.data.partner_reconciliation_gate.plan.traceability).toMatchObject({
      traceable_to_usage_ledger: true
    });
    expect(body.data.partner_reconciliation_gate.plan.sla.status).toBe("attention_required");
    expect(body.data.support_investigation_gate.plan).toMatchObject({
      status: "planned_no_write"
    });
    expect(body.data.support_investigation_gate.plan.investigation).toMatchObject({
      live_billing_provider_reads: false,
      live_log_reads: false,
      target_request_id: "req_partner_mcp_quote_001"
    });
    expect(body.data.support_investigation_gate.plan.privacy).toMatchObject({
      sensitive_content_released: false
    });
    expect(body.data.support_investigation_gate.plan.privacy.forbidden_fields).toContain(
      "generated_answer"
    );
    expect(body.data.ops_drill).toMatchObject({
      target_request_id: "req_partner_mcp_quote_001"
    });
    expect(body.data.ops_drill.request_ids_available).toContain("req_partner_mcp_quote_001");
    expect(body.data.ops_drill.usage_event_ids_available).toContain(
      "usage_event_req_partner_mcp_quote_001"
    );
    expect(body.data.validation).toMatchObject({
      all_checks_passed: true,
      live_release_claimed: false,
      partner_report_trace_links_request_id_and_usage_event: true,
      support_request_id_investigation_metadata_only: true
    });
    expect(body.data.release_checks).toHaveLength(6);
    expect(body.data.release_checks.every((check) => check.status === "pass")).toBe(true);
    expect(body.data.release_gate).toMatchObject({
      status: "blocked_live_partner_support_validation"
    });
    expect(body.data.release_gate.blockers).toContain("final_partner_settlement_approval_missing");
    expect(body.usage.rows).toBe(6);
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

  it("plans subscription bill reconciliation back to usage ledger calls", async () => {
    const response = await app.request("/usage/billing/reconciliation/plan", {
      body: JSON.stringify({
        account_id: "acct_internal_001",
        billing_period_end: "2026-07-01T00:00:00.000Z",
        billing_period_start: "2026-06-01T00:00:00.000Z",
        currency: "HKD",
        invoice_amount_minor: 68800,
        invoice_credits: 15,
        invoice_id: "inv_ws_internal_alpha_202606",
        ledger_entries: [
          {
            credit_delta: 10,
            ledger_entry_id: "usage_ledger_entry_req_tool_001",
            request_id: "req_tool_001",
            usage_event_id: "usage_event_req_tool_001"
          },
          {
            credit_delta: 5,
            ledger_entry_id: "usage_ledger_entry_req_tool_002",
            request_id: "req_tool_002",
            usage_event_id: "usage_event_req_tool_002"
          }
        ],
        subscription_id: "sub_ws_internal_alpha_developer",
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-usage-billing"
      },
      method: "POST"
    });
    const body = (await response.json()) as UsageBillingReconciliationPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      freshness_target_minutes: 5,
      live_ledger_reads: false,
      persistent_writes: false,
      request_id: "req-usage-billing",
      request_id_visible: true,
      sql_emitted: false,
      status: "planned_no_write",
      subscription_id: "sub_ws_internal_alpha_developer",
      workspace_id: "ws_internal_alpha"
    });
    expect(body.data.billing_provider).toMatchObject({
      calls: false,
      invoice_link_live: false,
      provider: "not_configured"
    });
    expect(body.data.consistency).toEqual({
      credit_delta: 0,
      invoice_credits: 15,
      ledger_credits: 15,
      status: "matched"
    });
    expect(body.data.invoice).toMatchObject({
      amount_minor: 68800,
      invoice_id: "inv_ws_internal_alpha_202606",
      source: "synthetic_billing_snapshot",
      table: "aiphabee_core.subscription_invoice"
    });
    expect(body.data.invoice_lines).toHaveLength(2);
    expect(body.data.invoice_lines[0]).toMatchObject({
      credit_delta: 10,
      ledger_entry_id: "usage_ledger_entry_req_tool_001",
      request_id: "req_tool_001",
      trace_status: "traceable",
      usage_event_id: "usage_event_req_tool_001"
    });
    expect(body.data.traceability).toEqual({
      required_fields: [
        "request_id",
        "usage_event_id",
        "ledger_entry_id",
        "invoice_line_id"
      ],
      support_investigation_by_request_id: true,
      traceable_call_count: 2,
      traceable_to_call: true
    });
    expect(body.data.capability.status).toBe("usage_billing_reconciliation_scaffold");
    expect(body.usage.rows).toBe(2);
  });

  it("plans partner reconciliation reports for dataset/channel/package/user usage export", async () => {
    const response = await app.request("/usage/partner-reconciliation/plan", {
      body: JSON.stringify({
        cadence: "weekly",
        format: "csv",
        partner_id: "partner_hk_data",
        period_end: "2026-06-08T00:00:00.000Z",
        period_start: "2026-06-01T00:00:00.000Z",
        usage_rows: [
          {
            channel: "mcp",
            credits: 8,
            dataset: "hk_equity_quote",
            metered_rows: 120,
            package_code: "developer",
            request_id: "req_mcp_001",
            usage_count: 3,
            usage_event_id: "usage_event_req_mcp_001",
            user_id: "user_ops_001"
          },
          {
            backfill_count: 1,
            channel: "mcp",
            credits: 2,
            data_delay_minutes: 10,
            dataset: "hk_equity_quote",
            metered_rows: 20,
            missing_rows: 2,
            package_code: "developer",
            request_id: "req_mcp_002",
            usage_count: 1,
            usage_event_id: "usage_event_req_mcp_002",
            user_id: "user_ops_001"
          },
          {
            channel: "web",
            credits: 5,
            dataset: "financial_facts",
            metered_rows: 50,
            package_code: "pro",
            request_id: "req_web_001",
            usage_count: 2,
            usage_event_id: "usage_event_req_web_001",
            user_id: "user_ops_002"
          }
        ],
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-usage-partner-reconciliation"
      },
      method: "POST"
    });
    const body = (await response.json()) as UsagePartnerReconciliationReportPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      billing_provider_calls: false,
      frontend: false,
      live_ledger_reads: false,
      partner_id: "partner_hk_data",
      persistent_writes: false,
      request_id: "req-usage-partner-reconciliation",
      request_id_visible: true,
      sql_emitted: false,
      status: "planned_no_write",
      workspace_id: "ws_internal_alpha"
    });
    expect(body.data.report).toMatchObject({
      export_status: "planned_no_write",
      group_by: ["dataset", "channel", "package_code", "user_id"],
      source: "usage_ledger_snapshot",
      table: "aiphabee_core.partner_reconciliation_report"
    });
    expect(body.data.rows).toHaveLength(2);
    expect(body.data.rows[1]).toMatchObject({
      backfill_count: 1,
      channel: "mcp",
      credits: 10,
      data_delay_minutes_max: 10,
      dataset: "hk_equity_quote",
      missing_rows: 2,
      package_code: "developer",
      request_ids: ["req_mcp_001", "req_mcp_002"],
      sla_status: "exception",
      usage_count: 4,
      usage_event_ids: ["usage_event_req_mcp_001", "usage_event_req_mcp_002"],
      user_id: "user_ops_001"
    });
    expect(body.data.summary).toMatchObject({
      credit_total: 15,
      dataset_count: 2,
      line_count: 2,
      missing_rows: 2,
      usage_count_total: 6,
      user_count: 2
    });
    expect(body.data.sla).toMatchObject({
      daily_weekly_report: true,
      status: "attention_required"
    });
    expect(body.data.traceability).toMatchObject({
      traceable_to_usage_ledger: true,
      traceable_usage_event_count: 3
    });
    expect(body.data.export).toMatchObject({
      artifact_writes: false,
      raw_payment_identifiers_included: false,
      raw_personal_contact_included: false,
      selected_format: "csv"
    });
    expect(body.data.privacy).toMatchObject({
      credential_material_included: false,
      raw_email_included: false,
      raw_payment_identifier_included: false
    });
    expect(body.data.capability.status).toBe("partner_reconciliation_report_scaffold");
    expect(body.usage.rows).toBe(2);
  });

  it("plans high-cost usage reservations with failure refunds without writes", async () => {
    const response = await app.request("/usage/high-cost/reservation/plan", {
      body: JSON.stringify({
        estimated_credits: 13,
        execution_status: "failed",
        subscription_id: "sub_ws_internal_alpha_developer",
        task_id: "planned_screen_securities_req_high_cost_failed",
        tool_name: "screen_securities",
        user_confirmed: true,
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-usage-high-cost"
      },
      method: "POST"
    });
    const body = (await response.json()) as UsageHighCostReservationPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      live_ledger_writes: false,
      persistent_writes: false,
      request_id: "req-usage-high-cost",
      request_id_visible: true,
      sql_emitted: false,
      status: "planned_no_write",
      usage_ledger_link_required: true,
      user_confirmed: true
    });
    expect(body.data.estimate).toEqual({
      credits: 13,
      source: "analytics_high_cost_estimate"
    });
    expect(body.data.reservation).toMatchObject({
      status: "planned_no_write",
      subscription_id: "sub_ws_internal_alpha_developer",
      task_id: "planned_screen_securities_req_high_cost_failed",
      tool_name: "screen_securities",
      workspace_id: "ws_internal_alpha"
    });
    expect(body.data.pre_debit).toMatchObject({
      pre_debit_credits: 13,
      required: true,
      status: "planned_no_write"
    });
    expect(body.data.failure_refund).toMatchObject({
      refund_credits: 13,
      required: true,
      status: "planned_no_write"
    });
    expect(body.data.capability.status).toBe("high_cost_usage_reservation_scaffold");
    expect(body.data.double_charge_guard.same_request_reuses_reservation).toBe(true);
    expect(body.usage.rows).toBe(1);
  });

  it("serves watchlist alert capabilities without live fanout", async () => {
    const response = await app.request("/watchlist/runtime", {
      headers: {
        "x-request-id": "req-watchlist-runtime"
      }
    });
    const body = (await response.json()) as WatchlistRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      create_alert_scope: "alerts.write",
      dedupe_ready: true,
      event_queue: "AIPHABEE_EVENTS_QUEUE",
      explicit_confirmation_required: true,
      frequency_controls: true,
      frontend: false,
      independent_scope_required: true,
      live_tool_execution: false,
      notification_fanout: false,
      persistent_writes: false,
      quiet_period_controls: true,
      route: "POST /watchlist/alerts/plan",
      runtime_route: "GET /watchlist/runtime",
      source_required: true,
      sql_emitted: false,
      status: "watchlist_alerts_scaffold"
    });
    expect(body.data.supported_alert_kinds).toEqual(["price", "announcement", "metric"]);
    expect(body.data.supported_frequencies).toEqual(["realtime", "daily", "weekly"]);
    expect(body.data.tables).toEqual([
      "aiphabee_core.watchlist",
      "aiphabee_core.watchlist_item",
      "aiphabee_core.watchlist_alert_rule",
      "aiphabee_core.watchlist_alert_event"
    ]);
    expect(body.data.briefings).toMatchObject({
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
    expect(body.data.briefings.supported_cadences).toEqual(["daily", "weekly"]);
    expect(body.data.briefings.tables).toEqual([
      "aiphabee_core.watchlist_briefing",
      "aiphabee_core.watchlist_briefing_item"
    ]);
  });

  it("plans watchlist price announcement and metric alerts with dedupe controls", async () => {
    const response = await app.request("/watchlist/alerts/plan", {
      body: JSON.stringify({
        alert_kinds: ["price", "announcement", "metric"],
        channels: ["in_app", "email"],
        condition: {
          comparator: "changed_by_percent",
          metric_id: "net_margin",
          price_field: "close",
          threshold: 5
        },
        explicit_confirmation: true,
        frequency: "daily",
        idempotency_key: "alert-idem-00700-daily",
        instrument_id: "instrument_hk_00700",
        metric_ids: ["return_on_equity"],
        quiet_hours_end: "08:30",
        quiet_hours_start: "21:30",
        timezone: "Asia/Hong_Kong",
        user_id: "user_internal_alpha",
        watchlist_id: "watchlist_alpha_hk",
        workspace_id: "workspace_research"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-watchlist-alerts"
      },
      method: "POST"
    });
    const body = (await response.json()) as WatchlistAlertsPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend: false,
      live_tool_execution: false,
      sql_emitted: false,
      status: "planned_no_write",
      toolName: "plan_watchlist_alerts"
    });
    expect(body.data.capability).toMatchObject({
      explicit_confirmation_required: true,
      route: "POST /watchlist/alerts/plan",
      status: "watchlist_alerts_scaffold"
    });
    expect(body.data.alert_rule).toMatchObject({
      alert_kinds: ["price", "announcement", "metric"],
      explicit_confirmation: true,
      idempotency_key: "alert-idem-00700-daily",
      independent_scope: "alerts.write",
      table: "aiphabee_core.watchlist_alert_rule",
      write_status: "planned_no_write"
    });
    expect(body.data.watchlist).toMatchObject({
      instrument_id: "instrument_hk_00700",
      watchlist_id: "watchlist_alpha_hk",
      watchlist_item_table: "aiphabee_core.watchlist_item",
      watchlist_table: "aiphabee_core.watchlist",
      write_status: "planned_no_write"
    });
    expect(body.data.frequency).toEqual({
      frequency: "daily",
      max_notifications_per_period: 1,
      quiet_period: {
        enabled: true,
        end: "08:30",
        start: "21:30",
        timezone: "Asia/Hong_Kong"
      }
    });
    expect(body.data.dedupe).toMatchObject({
      duplicate_policy: "suppress_same_source_within_window",
      source_record_id_required: true,
      window_minutes: 1440
    });
    expect(body.data.evaluation_plan).toMatchObject({
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
    expect(body.data.notification).toEqual({
      channels: ["in_app", "email"],
      evidence_required: true,
      event_queue: "AIPHABEE_EVENTS_QUEUE",
      fanout_status: "planned_no_write",
      notification_write_status: "planned_no_write"
    });
    expect(body.data.persistence_plan).toEqual({
      live_db_writes: false,
      queue_writes: false,
      sql_emitted: false,
      tables: [
        "aiphabee_core.watchlist",
        "aiphabee_core.watchlist_item",
        "aiphabee_core.watchlist_alert_rule",
        "aiphabee_core.watchlist_alert_event"
      ],
      write_status: "planned_no_write"
    });
    expect(body.data.validation).toEqual({
      explicit_confirmation_provided: true,
      explicit_confirmation_required: true,
      idempotency_key_required: true,
      required_context_present: true,
      scope_required: "alerts.write"
    });
    expect(body.usage).toEqual({
      cached: false,
      credits: 0,
      rows: 6
    });
  });

  it("plans create_alert tool writes with confirmation scope and idempotency", async () => {
    const response = await app.request("/tools/create-alert", {
      body: JSON.stringify({
        alert_kinds: ["price"],
        channels: ["in_app"],
        condition: {
          comparator: "above",
          price_field: "last",
          threshold: 390
        },
        explicit_confirmation: true,
        frequency: "realtime",
        idempotency_key: "create-alert-idem-00700-realtime",
        security_query: "00700.HK",
        user_id: "user_internal_alpha",
        workspace_id: "workspace_research"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-create-alert-tool"
      },
      method: "POST"
    });
    const body = (await response.json()) as WatchlistAlertsPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend: false,
      live_tool_execution: false,
      request_id: "req-create-alert-tool",
      sql_emitted: false,
      status: "planned_no_write",
      toolName: "create_alert"
    });
    expect(body.data.capability).toMatchObject({
      alert_planner_route: "POST /watchlist/alerts/plan",
      explicit_confirmation_required: true,
      idempotency_key_required: true,
      independent_scope_required: true,
      persistent_writes: false,
      route: "POST /tools/create-alert",
      status: "create_alert_tool_scaffold",
      tool_name: "create_alert"
    });
    expect(body.data.planner).toEqual({
      route: "POST /watchlist/alerts/plan",
      tool_name: "plan_watchlist_alerts",
      version: "2026-06-21.phase2.watchlist-alerts-scaffold.v0"
    });
    expect(body.data.alert_rule).toMatchObject({
      alert_kinds: ["price"],
      explicit_confirmation: true,
      idempotency_key: "create-alert-idem-00700-realtime",
      independent_scope: "alerts.write",
      write_status: "planned_no_write"
    });
    expect(body.data.persistence_plan).toMatchObject({
      live_db_writes: false,
      queue_writes: false,
      sql_emitted: false,
      write_status: "planned_no_write"
    });
    expect(body.data.validation).toEqual({
      explicit_confirmation_provided: true,
      explicit_confirmation_required: true,
      idempotency_key_required: true,
      required_context_present: true,
      scope_required: "alerts.write"
    });
    expect(body.usage).toMatchObject({
      credits: 0,
      rows: 2
    });
  });

  it("plans daily and weekly watchlist briefings with material change filters", async () => {
    const response = await app.request("/watchlist/briefings/plan", {
      body: JSON.stringify({
        as_of: "2026-06-21T08:00:00+08:00",
        cadence: "weekly",
        channels: ["in_app", "email"],
        max_items: 8,
        min_materiality_score: 0.7,
        timezone: "Asia/Hong_Kong",
        user_id: "user_internal_alpha",
        watchlist_id: "watchlist_alpha_hk",
        workspace_id: "workspace_research"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-watchlist-briefing"
      },
      method: "POST"
    });
    const body = (await response.json()) as WatchlistBriefingPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      as_of: "2026-06-21T08:00:00+08:00",
      channels: ["in_app", "email"],
      frontend: false,
      live_tool_execution: false,
      sql_emitted: false,
      status: "planned_no_write",
      timezone: "Asia/Hong_Kong",
      toolName: "plan_watchlist_briefing"
    });
    expect(body.data.capability).toMatchObject({
      evidence_required: true,
      route: "POST /watchlist/briefings/plan",
      status: "watchlist_briefings_scaffold"
    });
    expect(body.data.briefing).toMatchObject({
      cadence: "weekly",
      max_items: 8,
      material_changes_only: true,
      status: "planned_no_write",
      table: "aiphabee_core.watchlist_briefing",
      watchlist_id: "watchlist_alpha_hk",
      write_status: "planned_no_write"
    });
    expect(body.data.materiality_filter).toEqual({
      empty_briefing_policy: "suppress_no_material_changes",
      min_materiality_score: 0.7,
      only_substantive_changes: true
    });
    expect(body.data.source_plan).toEqual({
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
    expect(body.data.evidence_index).toEqual({
      evidence_required: true,
      item_table: "aiphabee_core.watchlist_briefing_item",
      source_record_id_required: true
    });
    expect(body.data.notification).toEqual({
      channels: ["in_app", "email"],
      evidence_required: true,
      event_queue: "AIPHABEE_EVENTS_QUEUE",
      fanout_status: "planned_no_write"
    });
    expect(body.data.persistence_plan).toEqual({
      live_db_writes: false,
      queue_writes: false,
      sql_emitted: false,
      tables: ["aiphabee_core.watchlist_briefing", "aiphabee_core.watchlist_briefing_item"],
      write_status: "planned_no_write"
    });
    expect(body.data.validation).toEqual({
      required_context_present: true,
      watchlist_required: true
    });
    expect(body.usage).toEqual({
      cached: false,
      credits: 0,
      rows: 8
    });
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
    expect(body.data.event_study).toMatchObject({
      abnormal_return_method: "security_return_minus_benchmark_return",
      formula_version: "event-study-v0",
      route: "POST /analytics/event-study",
      sample_missing_policy: "surface_missing_dates_do_not_drop",
      status: "event_study_scaffold",
      tool_name: "run_event_study"
    });
    expect(body.data.financial_ratios).toMatchObject({
      formula_version: "financial-ratios-v0",
      route: "POST /analytics/financial-ratios",
      status: "financial_ratios_scaffold",
      tool_name: "get_financial_ratios"
    });
    expect(body.data.high_cost_analytics_queue).toMatchObject({
      high_cost_threshold: 8,
      independent_concurrency_pool: true,
      max_parallel_high_cost: 2,
      queue_name: "analytics-high-cost",
      route: "POST /analytics/high-cost/plan",
      status: "high_cost_analytics_queue_scaffold",
      tool_name: "plan_high_cost_analytics"
    });
    expect(body.data.market_breadth).toMatchObject({
      authorized_market_statistics_required: true,
      route: "POST /analytics/market-breadth",
      status: "market_breadth_scaffold",
      tool_name: "get_market_breadth"
    });
    expect(body.data.ownership_and_short_selling).toMatchObject({
      authorized_market_statistics_required: true,
      route: "POST /analytics/ownership-short-selling",
      status: "ownership_short_selling_scaffold",
      tool_name: "get_ownership_and_short_selling"
    });
    expect(body.data.buybacks_and_placements).toMatchObject({
      authorized_market_statistics_required: true,
      event_types: ["buyback", "placement", "rights_issue"],
      route: "POST /analytics/buybacks-placements",
      status: "buybacks_placements_scaffold",
      tool_name: "get_buybacks_and_placements"
    });
    expect(body.data.consensus_or_estimates).toMatchObject({
      redistribution_rights_required: true,
      route: "POST /analytics/consensus-estimates",
      status: "consensus_estimates_scaffold",
      tool_name: "get_consensus_or_estimates"
    });
    expect(body.data.percentile_comparison).toMatchObject({
      benchmark_types: ["peer", "index", "history"],
      formula_version: "percentile-comparison-v0",
      route: "POST /analytics/percentile-comparison",
      status: "percentile_comparison_scaffold",
      tool_name: "compare_percentiles"
    });
    expect(body.data.portfolio_analytics).toMatchObject({
      authorized_holdings_required: true,
      personalized_advice: false,
      route: "POST /analytics/portfolio",
      status: "portfolio_analytics_scaffold",
      tool_name: "get_portfolio_analytics",
      trading_advice: false
    });
    expect(body.data.returns_risk).toMatchObject({
      formula_version: "returns-risk-v0",
      golden_tolerance: 0.000001,
      route: "POST /analytics/returns-risk",
      status: "returns_risk_scaffold",
      tool_name: "calculate_returns_risk"
    });
    expect(body.data.saved_screening).toMatchObject({
      live_db_writes: false,
      periodic_run_planning: true,
      route: "POST /analytics/saved-screenings/plan",
      status: "saved_screening_schedule_scaffold",
      tool_name: "plan_saved_screening",
      workflow_execution: false
    });
    expect(body.data.screen_securities).toMatchObject({
      editable_conditions: true,
      preview_execution: true,
      route: "POST /analytics/screen-securities",
      status: "screen_securities_scaffold",
      tool_name: "screen_securities"
    });
  });

  it("plans high-cost analytics into an independent pool after confirmation", async () => {
    const response = await app.request("/analytics/high-cost/plan", {
      body: JSON.stringify({
        securities: ["00700.HK", "00001.HK", "00005.HK", "00011.HK", "00012.HK"],
        subscription_id: "sub_ws_internal_alpha_developer",
        tool_name: "compare_securities",
        user_confirmed: true,
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-high-cost-compare"
      },
      method: "POST"
    });
    const body = (await response.json()) as HighCostAnalyticsPlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      durable_queue_writes: false,
      frontend_rendering: false,
      live_data_access: false,
      status: "queued_planned",
      toolName: "plan_high_cost_analytics"
    });
    expect(body.data.cost_estimate).toMatchObject({
      credit_weight: 8,
      high_cost_threshold: 8,
      rows_estimate: 5
    });
    expect(body.data.scheduling_decision).toMatchObject({
      concurrency_pool: "analytics_high_cost",
      independent_pool_required: true,
      max_parallel: 2,
      queue_name: "analytics-high-cost",
      queue_required: true
    });
    expect(body.data.enqueue_plan).toMatchObject({
      planned_task_id: "planned_compare_securities_req-high-cost-compare:compare_securities",
      status: "would_enqueue"
    });
    expect(body.data.usage_policy).toMatchObject({
      failure_refund_required: true,
      pre_debit_required: true,
      user_confirmed: true
    });
    expect(body.data.usage_reservation).toMatchObject({
      live_ledger_writes: false,
      persistent_writes: false,
      status: "planned_no_write",
      usage_ledger_link_required: true,
      user_confirmed: true
    });
    expect(body.data.usage_reservation.reservation).toMatchObject({
      status: "planned_no_write",
      subscription_id: "sub_ws_internal_alpha_developer",
      task_id: "planned_compare_securities_req-high-cost-compare:compare_securities",
      tool_name: "compare_securities",
      workspace_id: "ws_internal_alpha"
    });
    expect(body.data.usage_reservation.pre_debit).toMatchObject({
      pre_debit_credits: 8,
      required: true,
      status: "planned_no_write"
    });
    expect(body.data.usage_reservation.failure_refund).toMatchObject({
      refund_credits: 0,
      required: true,
      status: "not_triggered"
    });
    expect(body.usage.rows).toBe(1);
  });

  it("plans portfolio analytics only from authorized holdings without trading advice", async () => {
    const response = await app.request("/analytics/portfolio", {
      body: JSON.stringify({
        authorized_holdings: true,
        positions: [
          {
            quantity: 100,
            security_query: "00700.HK"
          },
          {
            market_value: 10000,
            security_query: "00001.HK"
          }
        ],
        workspace_id: "ws_authorized_portfolio"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-portfolio-analytics"
      },
      method: "POST"
    });
    const body = (await response.json()) as PortfolioAnalyticsBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend_rendering: false,
      live_data_access: false,
      sql_emitted: false,
      status: "planned",
      toolName: "get_portfolio_analytics"
    });
    expect(body.data.authorization).toEqual({
      authorized_holdings_required: true,
      authorized_holdings_supplied: true,
      portfolio_scope: "user_authorized_holdings_only"
    });
    expect(body.data.allocation).toMatchObject({
      included_position_count: 2,
      total_market_value: 54820
    });
    expect(body.data.concentration).toMatchObject({
      issuer_count: 2,
      top_position_weight: 0.817585
    });
    expect(body.data.risk_summary).toMatchObject({
      computed_position_count: 1,
      portfolio_beta: 0.817585,
      portfolio_total_return: 0.00997
    });
    expect(body.data.positions.map((position) => [position.symbol, position.status, position.weight])).toEqual([
      ["00700.HK", "included", 0.817585],
      ["00001.HK", "included", 0.182415]
    ]);
    expect(body.data.trading_advice).toEqual({
      buy_sell_hold_recommendation: false,
      personalized_advice: false,
      rebalance_instruction: false
    });
    expect(body.data.capability).toMatchObject({
      route: "POST /analytics/portfolio",
      status: "portfolio_analytics_scaffold",
      tool_name: "get_portfolio_analytics"
    });
    expect(body.usage.rows).toBeGreaterThan(0);
  });

  it("blocks portfolio analytics when authorized holdings are not supplied", async () => {
    const response = await app.request("/analytics/portfolio", {
      body: JSON.stringify({
        positions: [
          {
            market_value: 70000,
            security_query: "00700.HK"
          }
        ]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-portfolio-unauthorized"
      },
      method: "POST"
    });
    const body = (await response.json()) as PortfolioAnalyticsBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("blocked_authorization");
    expect(body.data.positions).toEqual([]);
    expect(body.data.authorization.authorized_holdings_supplied).toBe(false);
    expect(body.data.trading_advice.personalized_advice).toBe(false);
    expect(body.usage.credits).toBe(0);
  });

  it("plans authorized market breadth without live data", async () => {
    const response = await app.request("/analytics/market-breadth", {
      body: JSON.stringify({
        authorized_market_statistics: true,
        market: "HK",
        universe: ["00700.HK", "00001.HK", "00005.HK"]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-market-breadth"
      },
      method: "POST"
    });
    const body = (await response.json()) as MarketBreadthBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend_rendering: false,
      live_data_access: false,
      market: "HK",
      sql_emitted: false,
      status: "planned",
      toolName: "get_market_breadth"
    });
    expect(body.data.authorization).toEqual({
      authorized_market_statistics_required: true,
      authorized_market_statistics_supplied: true,
      dataset_scope: "market_statistics_authorized_only"
    });
    expect(body.data.breadth.advances).toBeGreaterThan(body.data.breadth.declines);
    expect(body.data.breadth.industry_width.map((row) => row.industry)).toEqual([
      "technology",
      "financials",
      "consumer"
    ]);
    expect(body.data.capability).toMatchObject({
      route: "POST /analytics/market-breadth",
      status: "market_breadth_scaffold",
      tool_name: "get_market_breadth"
    });
    expect(body.usage.rows).toBe(3);
  });

  it("blocks ownership and short-selling route without market statistics authorization", async () => {
    const response = await app.request("/analytics/ownership-short-selling", {
      body: JSON.stringify({
        security_query: "00700.HK"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-ownership-blocked"
      },
      method: "POST"
    });
    const body = (await response.json()) as OwnershipShortSellingBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("blocked_authorization");
    expect(body.data.authorization.authorized_market_statistics_supplied).toBe(false);
    expect(body.data.ownership.shareholding_disclosures).toEqual([]);
    expect(body.data.short_selling.short_turnover).toBe(0);
    expect(body.usage.rows).toBe(0);
  });

  it("plans authorized ownership short-selling and buybacks placements routes", async () => {
    const ownershipResponse = await app.request("/analytics/ownership-short-selling", {
      body: JSON.stringify({
        authorized_market_statistics: true,
        security_query: "00700.HK"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-ownership-authorized"
      },
      method: "POST"
    });
    const buybacksResponse = await app.request("/analytics/buybacks-placements", {
      body: JSON.stringify({
        authorized_market_statistics: true,
        security_query: "00700.HK"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-buybacks-placements"
      },
      method: "POST"
    });
    const ownership = (await ownershipResponse.json()) as OwnershipShortSellingBody;
    const buybacks = (await buybacksResponse.json()) as BuybacksPlacementsBody;

    expect(ownershipResponse.status).toBe(200);
    expect(buybacksResponse.status).toBe(200);
    expect(ownership.data).toMatchObject({
      frontend_rendering: false,
      live_data_access: false,
      sql_emitted: false,
      status: "planned",
      toolName: "get_ownership_and_short_selling"
    });
    expect(ownership.data.security).toMatchObject({
      instrument_id: "eq_hk_00700",
      symbol: "00700.HK"
    });
    expect(ownership.data.ownership.shareholding_disclosures).toHaveLength(2);
    expect(ownership.data.short_selling.short_turnover_ratio).toBe(0.0915);
    expect(ownership.data.capability).toMatchObject({
      route: "POST /analytics/ownership-short-selling",
      status: "ownership_short_selling_scaffold",
      tool_name: "get_ownership_and_short_selling"
    });
    expect(buybacks.data).toMatchObject({
      frontend_rendering: false,
      live_data_access: false,
      sql_emitted: false,
      status: "planned",
      toolName: "get_buybacks_and_placements"
    });
    expect(buybacks.data.capital_events.map((event) => event.event_type)).toEqual([
      "buyback",
      "placement",
      "rights_issue"
    ]);
    expect(buybacks.data.source_record_ids).toContain("synthetic_buyback_00700_20260105");
    expect(buybacks.data.capability).toMatchObject({
      route: "POST /analytics/buybacks-placements",
      status: "buybacks_placements_scaffold",
      tool_name: "get_buybacks_and_placements"
    });
  });

  it("blocks consensus estimates route without redistribution rights", async () => {
    const response = await app.request("/analytics/consensus-estimates", {
      body: JSON.stringify({
        security_query: "00700.HK"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-consensus-blocked"
      },
      method: "POST"
    });
    const body = (await response.json()) as ConsensusEstimatesBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend_rendering: false,
      investment_advice: false,
      live_data_access: false,
      raw_provider_payload: false,
      sql_emitted: false,
      status: "blocked_redistribution_rights",
      toolName: "get_consensus_or_estimates"
    });
    expect(body.data.rights.redistribution_rights_confirmed).toBe(false);
    expect(body.data.estimates).toEqual([]);
    expect(body.data.source_record_ids).toEqual([]);
    expect(body.usage.credits).toBe(0);
    expect(body.usage.rows).toBe(0);
  });

  it("plans consensus estimates route only with confirmed redistribution rights", async () => {
    const response = await app.request("/analytics/consensus-estimates", {
      body: JSON.stringify({
        fiscal_years: [2027],
        metrics: ["eps"],
        redistribution_rights_confirmed: true,
        security_query: "00700.HK"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-consensus-authorized"
      },
      method: "POST"
    });
    const body = (await response.json()) as ConsensusEstimatesBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend_rendering: false,
      investment_advice: false,
      live_data_access: false,
      raw_provider_payload: false,
      sql_emitted: false,
      status: "planned",
      toolName: "get_consensus_or_estimates"
    });
    expect(body.data.rights).toMatchObject({
      redistribution_rights_confirmed: true,
      redistribution_rights_required: true,
      rights_scope: "consensus_estimates_redistribution_confirmed_only"
    });
    expect(body.data.security).toMatchObject({
      instrument_id: "eq_hk_00700",
      symbol: "00700.HK"
    });
    expect(body.data.consensus.target_price.median).toBe(462);
    expect(body.data.estimates).toEqual([
      expect.objectContaining({
        fiscal_year: 2027,
        mean: 19.8,
        metric_id: "eps",
        source_record_ids: ["synthetic_consensus_eps_00700_2027"]
      })
    ]);
    expect(body.data.capability).toMatchObject({
      redistribution_rights_required: true,
      route: "POST /analytics/consensus-estimates",
      status: "consensus_estimates_scaffold",
      tool_name: "get_consensus_or_estimates"
    });
    expect(body.data.source_record_ids).toContain("synthetic_consensus_rating_00700_20260107");
    expect(body.data.source_record_ids).toContain("synthetic_consensus_eps_00700_2027");
    expect(body.usage.rows).toBe(1);
  });

  it("requires confirmation before queueing high-cost screen plans", async () => {
    const response = await app.request("/analytics/high-cost/plan", {
      body: JSON.stringify({
        subscription_id: "sub_ws_internal_alpha_developer",
        tool_name: "screen_securities",
        universe_size: 500,
        user_confirmed: false,
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-high-cost-screen"
      },
      method: "POST"
    });
    const body = (await response.json()) as HighCostAnalyticsPlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("confirmation_required");
    expect(body.data.cost_estimate).toMatchObject({
      credit_weight: 13,
      rows_estimate: 500
    });
    expect(body.data.scheduling_decision).toMatchObject({
      concurrency_pool: "analytics_high_cost",
      independent_pool_required: true,
      queue_required: true
    });
    expect(body.data.enqueue_plan).toMatchObject({
      queue_key: "analytics-high-cost:screen_securities:req-high-cost-screen:screen_securities",
      status: "awaiting_confirmation"
    });
    expect(body.data.usage_reservation).toMatchObject({
      status: "confirmation_required",
      user_confirmed: false
    });
    expect(body.data.usage_reservation.reservation).toMatchObject({
      status: "awaiting_confirmation",
      subscription_id: "sub_ws_internal_alpha_developer",
      task_id: "analytics-high-cost:screen_securities:req-high-cost-screen:screen_securities",
      tool_name: "screen_securities",
      workspace_id: "ws_internal_alpha"
    });
    expect(body.data.usage_reservation.pre_debit).toMatchObject({
      pre_debit_credits: 0,
      status: "awaiting_confirmation"
    });
  });

  it("plans high-cost event studies with reservation metadata", async () => {
    const response = await app.request("/analytics/high-cost/plan", {
      body: JSON.stringify({
        event_count: 2,
        event_window_days: 5,
        subscription_id: "sub_ws_internal_alpha_developer",
        tool_name: "run_event_study",
        user_confirmed: true,
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-high-cost-event-study"
      },
      method: "POST"
    });
    const body = (await response.json()) as HighCostAnalyticsPlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("queued_planned");
    expect(body.data.cost_estimate).toMatchObject({
      credit_weight: 27,
      high_cost_threshold: 8,
      rows_estimate: 10
    });
    expect(body.data.scheduling_decision).toMatchObject({
      concurrency_pool: "analytics_high_cost",
      independent_pool_required: true,
      queue_required: true
    });
    expect(body.data.enqueue_plan).toMatchObject({
      planned_task_id: "planned_run_event_study_req-high-cost-event-study:run_event_study",
      status: "would_enqueue"
    });
    expect(body.data.usage_reservation.reservation).toMatchObject({
      task_id: "planned_run_event_study_req-high-cost-event-study:run_event_study",
      tool_name: "run_event_study"
    });
    expect(body.data.usage_reservation.pre_debit).toMatchObject({
      pre_debit_credits: 27,
      required: true
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

  it("compares peer, index, and history percentiles with point-in-time metadata", async () => {
    const response = await app.request("/analytics/percentile-comparison", {
      body: JSON.stringify({
        metric_id: "net_margin",
        security_query: "00700.HK"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-percentile-comparison"
      },
      method: "POST"
    });
    const body = (await response.json()) as PercentileComparisonBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      formula_version: "percentile-comparison-v0",
      frontend_rendering: false,
      instrument_id: "eq_hk_00700",
      live_data_access: false,
      metric_id: "net_margin",
      status: "compared",
      toolName: "compare_percentiles"
    });
    expect(body.data.subject).toMatchObject({
      metric_id: "net_margin",
      source_tool: "get_financial_ratios",
      status: "computed",
      value: 0.189184
    });
    expect(body.data.point_in_time_policy).toEqual({
      benchmark_as_of: "2026-01-07",
      classification_as_of: "2026-01-07",
      live_constituents: false,
      no_future_constituents: true
    });
    expect(body.data.comparisons.map((comparison) => comparison.benchmark_type)).toEqual([
      "peer",
      "index",
      "history"
    ]);
    expect(body.data.comparisons.map((comparison) => comparison.percentile_rank)).toEqual([
      0.8,
      0.8,
      0.8
    ]);
    expect(body.data.comparisons[0]).toMatchObject({
      constituent_as_of: "2026-01-07",
      live_constituents: false,
      point_in_time: true,
      sample_count: 5,
      status: "computed"
    });
    expect(body.data.comparisons[0]?.constituents[0]).toMatchObject({
      included_from: "2020-01-01",
      instrument_id: "eq_hk_00700",
      symbol: "00700.HK"
    });
    expect(body.data.comparisons[2]?.history_observations.length).toBe(5);
    expect(body.data.capability).toMatchObject({
      formula_version: "percentile-comparison-v0",
      route: "POST /analytics/percentile-comparison"
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

  it("runs event study with event window, benchmark, and abnormal return method", async () => {
    const response = await app.request("/analytics/event-study", {
      body: JSON.stringify({
        benchmark_security_query: "00700.HK",
        event_date: "2026-01-06",
        security_query: "00700.HK"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-event-study"
      },
      method: "POST"
    });
    const body = (await response.json()) as EventStudyBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend_rendering: false,
      instrument_id: "eq_hk_00700",
      live_data_access: false,
      price_history_status: "found",
      status: "computed",
      toolName: "run_event_study"
    });
    expect(body.data.event).toMatchObject({
      event_date: "2026-01-06",
      event_id: "synthetic_00700_results_event"
    });
    expect(body.data.event_window).toMatchObject({
      from: "2026-01-05",
      requested_observation_count: 3,
      to: "2026-01-07"
    });
    expect(body.data.benchmark).toMatchObject({
      instrument_id: "eq_hk_00700",
      label: "resolved_security_benchmark",
      price_history_status: "found"
    });
    expect(body.data.methodology).toMatchObject({
      abnormal_return_method: "security_return_minus_benchmark_return",
      formula_version: "event-study-v0",
      sample_missing_policy: "surface_missing_dates_do_not_drop"
    });
    expect(body.data.observations.map((observation) => [
      observation.date,
      observation.relative_day,
      observation.abnormal_return,
      observation.status
    ])).toEqual([
      ["2026-01-05", -1, 0, "computed"],
      ["2026-01-06", 0, 0, "computed"],
      ["2026-01-07", 1, 0, "computed"]
    ]);
    expect(body.data.summary).toMatchObject({
      computed_observation_count: 3,
      cumulative_abnormal_return: 0,
      missing_observation_count: 0,
      requested_observation_count: 3
    });
    expect(body.data.capability).toMatchObject({
      formula_version: "event-study-v0",
      route: "POST /analytics/event-study"
    });
    expect(body.usage.rows).toBeGreaterThan(0);
  });

  it("surfaces missing event study samples through the Worker route", async () => {
    const response = await app.request("/analytics/event-study", {
      body: JSON.stringify({
        benchmark_security_query: "00700.HK",
        event_date: "2026-01-06",
        security_query: "00700.HK",
        window_pre_days: 2
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-event-study-missing"
      },
      method: "POST"
    });
    const body = (await response.json()) as EventStudyBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("partial");
    expect(body.data.event_window).toMatchObject({
      from: "2026-01-04",
      requested_observation_count: 4,
      to: "2026-01-07"
    });
    expect(body.data.missing_observations).toEqual([
      {
        date: "2026-01-04",
        reason: "missing_security_and_benchmark_return",
        relative_day: -2
      }
    ]);
    expect(body.data.summary).toMatchObject({
      computed_observation_count: 3,
      missing_observation_count: 1,
      requested_observation_count: 4
    });
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
    expect(body.data.point_in_time_guard).toEqual({
      classification_as_of: "2026-01-07",
      future_data_policy: "block_future_classification",
      requested_as_of: "2026-01-07",
      security_master_as_of: "2026-01-07",
      status: "enforced",
      uses_latest_classification: false
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

  it("blocks screen execution when classification is after historical as_of", async () => {
    const response = await app.request("/analytics/screen-securities", {
      body: JSON.stringify({
        as_of: "2024-12-31T16:00:00+08:00",
        classification_as_of: "2026-01-07",
        natural_language: "revenue above 100000"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-screen-future-guard"
      },
      method: "POST"
    });
    const body = (await response.json()) as ScreenSecuritiesBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("blocked_future_data");
    expect(body.data.execution_preview.universe_size).toBe(0);
    expect(body.data.point_in_time_guard).toEqual({
      classification_as_of: "2026-01-07",
      future_data_policy: "block_future_classification",
      requested_as_of: "2024-12-31",
      security_master_as_of: "2024-12-31",
      status: "blocked_future_data",
      uses_latest_classification: false
    });
    expect(body.usage.rows).toBe(0);
  });

  it("plans saved screening and periodic run without writes", async () => {
    const response = await app.request("/analytics/saved-screenings/plan", {
      body: JSON.stringify({
        cadence: "daily",
        name: "Revenue and profitability screen",
        natural_language: "revenue above 100000 and profitable",
        next_run_at: "2026-01-08T09:00:00+08:00",
        notification_channels: ["in_app"],
        owner_user_id: "usr_internal_001",
        workspace_id: "ws_internal_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-saved-screening"
      },
      method: "POST"
    });
    const body = (await response.json()) as SavedScreeningPlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend_rendering: false,
      live_data_access: false,
      live_execution: false,
      status: "planned_no_write",
      toolName: "plan_saved_screening"
    });
    expect(body.data.saved_screening).toMatchObject({
      screen_status: "planned_with_preview",
      status: "would_save",
      workspace_id: "ws_internal_alpha"
    });
    expect(body.data.saved_screening.parsed_conditions).toHaveLength(2);
    expect(body.data.saved_screening.query_hash).toMatch(/^screen_[0-9a-f]{8}$/u);
    expect(body.data.schedule).toEqual({
      cadence: "daily",
      enabled: true,
      next_run_at: "2026-01-08T09:00:00+08:00",
      notification_channels: ["in_app"],
      timezone: "Asia/Hong_Kong"
    });
    expect(body.data.periodic_run_policy).toMatchObject({
      high_cost_queue_route: "POST /analytics/high-cost/plan",
      point_in_time_re_evaluation: true,
      queue_writes: false,
      source_tool: "screen_securities",
      workflow_execution: false
    });
    expect(body.data.persistence_plan).toEqual({
      live_db_writes: false,
      sql_emitted: false,
      tables: [
        "aiphabee_core.saved_screening",
        "aiphabee_core.saved_screening_run_schedule",
        "aiphabee_core.saved_screening_run"
      ],
      write_status: "planned_no_write"
    });
    expect(body.data.capability).toMatchObject({
      periodic_run_planning: true,
      route: "POST /analytics/saved-screenings/plan"
    });
    expect(body.usage.rows).toBeGreaterThan(0);
  });

  it("blocks saved screening plans without workspace context", async () => {
    const response = await app.request("/analytics/saved-screenings/plan", {
      body: JSON.stringify({
        natural_language: "revenue above 100000",
        owner_user_id: "usr_internal_001"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-saved-screening-blocked"
      },
      method: "POST"
    });
    const body = (await response.json()) as SavedScreeningPlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("blocked_missing_workspace");
    expect(body.data.saved_screening.status).toBe("blocked");
    expect(body.data.persistence_plan.live_db_writes).toBe(false);
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

  it("serves document tool capabilities", async () => {
    const response = await app.request("/documents/runtime", {
      headers: {
        "x-request-id": "req-documents-runtime"
      }
    });
    const body = (await response.json()) as DocumentRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      package: "@aiphabee/document-tools",
      route: "POST /documents/search-announcements",
      runtime_route: "GET /documents/runtime",
      status: "document_tools_scaffold"
    });
    expect(body.data.search_announcements).toMatchObject({
      evidence_locator_ready: true,
      original_document_fetch: false,
      route: "POST /documents/search-announcements",
      status: "search_announcements_scaffold",
      tool_name: "search_announcements",
      untrusted_document_policy: true,
      vector_search: false
    });
    expect(body.data.get_announcement).toMatchObject({
      allowed_excerpt_scope: "synthetic_excerpt_allowlist",
      evidence_locator_ready: true,
      original_document_fetch: false,
      route: "POST /documents/get-announcement",
      sanitizer_enabled: true,
      status: "get_announcement_scaffold",
      tool_name: "get_announcement",
      untrusted_document_policy: true,
      vector_search: false
    });
    expect(body.data.document_sanitizer).toMatchObject({
      applied_route: "POST /documents/get-announcement",
      hidden_text_removed: true,
      output_contains_raw_html: false,
      raw_excerpt_returned: false,
      scripts_executable: false,
      status: "document_sanitizer_scaffold",
      tool_invocation_allowed_from_document: false,
      tool_name: "document_sanitizer"
    });
    expect(body.data.search_documents).toMatchObject({
      index_name: "document_chunks_pgvector_synthetic",
      live_pgvector: false,
      metadata_filter_pushdown: true,
      pgvector_first: true,
      route: "POST /documents/search-documents",
      search_engine: "synthetic_pgvector_scaffold",
      status: "search_documents_scaffold",
      tool_name: "search_documents",
      vector_search: true,
      vectorize_optional: true
    });
    expect(body.data.diff_announcements).toMatchObject({
      comparison_engine: "synthetic_schema_bound_numeric_diff",
      evidence_binding_ready: true,
      original_document_fetch: false,
      route: "POST /documents/diff-announcements",
      schema_id: "announcement_numeric_extraction_v0",
      schema_validation_ready: true,
      status: "diff_announcements_scaffold",
      tool_name: "diff_announcements",
      untrusted_document_policy: true,
      vector_search: false
    });
    expect(body.data.user_public_data_join_privacy).toMatchObject({
      custom_layout_metadata_only: true,
      document_sanitizer_required: true,
      field_authorization_required: true,
      gateway_access_route: "POST /gateway/access-check",
      join_execution_live: false,
      live_upload_storage: false,
      public_data_live_read: false,
      raw_file_body_persisted: false,
      route: "POST /documents/user-public-data-join/plan",
      status: "user_public_data_join_privacy_scaffold",
      tool_name: "user_public_data_join_privacy_plan"
    });
  });

  it("searches announcements by company, date, category, and keyword", async () => {
    const response = await app.request("/documents/search-announcements", {
      body: JSON.stringify({
        categories: ["dividend"],
        from: "2026-01-01",
        keyword: "timetable",
        security_query: "00700.HK",
        to: "2026-01-07"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-search-announcements"
      },
      method: "POST"
    });
    const body = (await response.json()) as SearchAnnouncementsBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      evidence_locator_ready: true,
      frontend_rendering: false,
      instrument_id: "eq_hk_00700",
      live_data_access: false,
      original_document_fetch: false,
      row_count: 1,
      search_engine: "synthetic_filter_scaffold",
      status: "found",
      toolName: "search_announcements",
      vector_search: false
    });
    expect(body.data.capability).toMatchObject({
      route: "POST /documents/search-announcements",
      untrusted_document_policy: true,
      vector_search: false
    });
    expect(body.data.filters).toMatchObject({
      date_basis: "published_at",
      from: "2026-01-01",
      keyword: "timetable",
      to: "2026-01-07"
    });
    expect(body.data.document_trust_policy).toEqual({
      content_is_untrusted_data: true,
      prompt_injection_isolated: true,
      scripts_executable: false
    });
    expect(body.data.results[0]).toMatchObject({
      category: "dividend",
      document_id: "doc_ann_00700_20260103_dividend",
      evidence_locator: {
        anchor: "dividend-timetable",
        external_href_authority: false,
        locator_type: "synthetic_original_locator",
        original_url:
          "urn:aiphabee:synthetic:announcement:ann_00700_20260103_dividend#page=2&anchor=dividend-timetable",
        page: 2
      },
      language: "en",
      matched_fields: ["title", "summary"],
      source_record_id: "src_announcement_00700_20260103_dividend",
      title: "Dividend Timetable Update",
      untrusted_document: true
    });
    expect(body.usage.rows).toBe(1);
  });

  it("does not silently choose an ambiguous announcement security", async () => {
    const response = await app.request("/documents/search-announcements", {
      body: JSON.stringify({
        keyword: "results",
        security_query: "ABC"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-search-announcements-ambiguous"
      },
      method: "POST"
    });
    const body = (await response.json()) as SearchAnnouncementsBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("blocked_resolution");
    expect(body.data.resolve_security?.status).toBe("ambiguous");
    expect(body.data.instrument_id).toBeUndefined();
    expect(body.data.results).toEqual([]);
    expect(body.usage.rows).toBe(0);
  });

  it("returns authorized announcement excerpts with source locators", async () => {
    const response = await app.request("/documents/get-announcement", {
      body: JSON.stringify({
        document_id: "doc_ann_00700_20260103_dividend",
        max_excerpt_chars: 120,
        sections: ["dividend_timetable"]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-get-announcement"
      },
      method: "POST"
    });
    const body = (await response.json()) as GetAnnouncementBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      document_id: "doc_ann_00700_20260103_dividend",
      excerpts_authorized: true,
      frontend_rendering: false,
      full_document_returned: false,
      live_data_access: false,
      original_document_fetch: false,
      row_count: 1,
      status: "found",
      toolName: "get_announcement",
      vector_search: false
    });
    expect(body.data.capability).toMatchObject({
      allowed_excerpt_scope: "synthetic_excerpt_allowlist",
      route: "POST /documents/get-announcement",
      tool_name: "get_announcement",
      untrusted_document_policy: true
    });
    expect(body.data.document_trust_policy).toEqual({
      content_is_untrusted_data: true,
      prompt_injection_isolated: true,
      scripts_executable: false
    });
    expect(body.data.excerpts[0]).toMatchObject({
      authorization: {
        excerpt_scope: "synthetic_excerpt_allowlist",
        full_text_returned: false,
        max_excerpt_chars: 120
      },
      evidence_locator: {
        anchor: "dividend-timetable",
        document_id: "doc_ann_00700_20260103_dividend",
        external_href_authority: false,
        locator_type: "synthetic_excerpt_locator",
        original_url:
          "urn:aiphabee:synthetic:announcement:ann_00700_20260103_dividend#page=2&paragraph=3&anchor=dividend-timetable",
        page: 2,
        paragraph: 3,
        source_record_id: "src_announcement_00700_20260103_dividend"
      },
      section_id: "dividend_timetable",
      section_title: "Dividend timetable",
      untrusted_document: true
    });
    expect(body.data.excerpts[0]?.sanitization).toMatchObject({
      document_instruction_executed: false,
      raw_excerpt_returned: false,
      removed_items: ["hidden_text", "script_tag", "suspicious_instruction"],
      status: "sanitized"
    });
    expect(body.data.excerpts[0]?.excerpt).not.toMatch(
      /<script|display:none|callTool|grant_access|ignore previous instructions|invoke tools|run tool_call/iu
    );
    expect(body.data.sanitization_policy).toMatchObject({
      hidden_text_removed: true,
      output_contains_raw_html: false,
      scripts_removed: true,
      suspicious_instructions_neutralized: true,
      tool_invocation_allowed_from_document: false
    });
    expect(body.data.sanitization_summary).toEqual({
      raw_document_instructions_ignored: true,
      removed_item_count: 3,
      sections_sanitized: 1,
      sections_reviewed: 1
    });
    expect(body.data.excerpts[0]?.excerpt.length).toBeLessThanOrEqual(120);
    expect(body.data.source).toMatchObject({
      source_record_id: "src_announcement_00700_20260103_dividend",
      symbol: "00700.HK"
    });
    expect(body.usage.rows).toBe(1);
  });

  it("does not fabricate missing announcement documents", async () => {
    const response = await app.request("/documents/get-announcement", {
      body: JSON.stringify({
        document_id: "doc_missing"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-get-announcement-missing"
      },
      method: "POST"
    });
    const body = (await response.json()) as GetAnnouncementBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("not_found");
    expect(body.data.excerpts).toEqual([]);
    expect(body.usage.rows).toBe(0);
  });

  it("searches document chunks through the semantic search scaffold", async () => {
    const response = await app.request("/documents/search-documents", {
      body: JSON.stringify({
        categories: ["dividend"],
        from: "2026-01-01",
        limit: 1,
        query: "payment date dividend",
        to: "2026-01-07"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-search-documents"
      },
      method: "POST"
    });
    const body = (await response.json()) as SearchDocumentsBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend_rendering: false,
      live_data_access: false,
      live_pgvector: false,
      original_document_fetch: false,
      result_count: 1,
      search_engine: "synthetic_pgvector_scaffold",
      status: "found",
      toolName: "search_documents",
      vector_search: true
    });
    expect(body.data.capability).toMatchObject({
      index_name: "document_chunks_pgvector_synthetic",
      live_pgvector: false,
      metadata_filter_pushdown: true,
      pgvector_first: true,
      route: "POST /documents/search-documents",
      vector_search: true,
      vectorize_optional: true
    });
    expect(body.data.index).toMatchObject({
      index_name: "document_chunks_pgvector_synthetic",
      metadata_filter_pushdown: true,
      pgvector_first: true,
      vectorize_optional: true
    });
    expect(body.data.results[0]).toMatchObject({
      chunk_id: "doc_ann_00700_20260103_dividend:dividend_timetable",
      document_id: "doc_ann_00700_20260103_dividend",
      evidence_locator: {
        page: 2,
        paragraph: 3,
        source_record_id: "src_announcement_00700_20260103_dividend"
      },
      rank: 1,
      section_id: "dividend_timetable",
      source_record_id: "src_announcement_00700_20260103_dividend",
      title: "Dividend Timetable Update",
      untrusted_document: true
    });
    expect(body.data.results[0]?.similarity_score).toBeGreaterThanOrEqual(0.9);
    expect(body.data.results[0]?.sanitized_snippet).not.toMatch(
      /<script|callTool|grant_access|ignore previous instructions|invoke tools|run tool_call/iu
    );
    expect(body.usage.rows).toBe(1);
  });

  it("returns no semantic document rows below the requested score threshold", async () => {
    const response = await app.request("/documents/search-documents", {
      body: JSON.stringify({
        min_score: 0.95,
        query: "unrelated macro commodity weather"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-search-documents-empty"
      },
      method: "POST"
    });
    const body = (await response.json()) as SearchDocumentsBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("not_found");
    expect(body.data.results).toEqual([]);
    expect(body.usage.rows).toBe(0);
  });

  it("plans user uploaded file and public data joins without leaking private inputs", async () => {
    const response = await app.request("/documents/user-public-data-join/plan", {
      body: JSON.stringify({
        custom_layout_id: "layout_research_view_1",
        field_authorization_policy_id: "field_policy_default_deny_v0",
        join_keys: ["instrument_id", "period", "unknown_key"],
        privacy_policy_id: "privacy_policy_v0",
        public_data_scope: "hk_market_announcements_delayed",
        requested_fields: [
          "public_data.document_id",
          "public_data.published_at",
          "user_file.metric_label"
        ],
        retention_policy_id: "retention_policy_v0",
        user_consent_id: "consent_doc05_1",
        user_file_id: "user_file_upload_1",
        user_file_sha256: "sha256:3b7c",
        workspace_id: "ws_research_1"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-user-public-data-join"
      },
      method: "POST"
    });
    const body = (await response.json()) as UserPublicDataJoinPrivacyBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      route: "POST /documents/user-public-data-join/plan",
      runtime_route: "GET /documents/runtime",
      status: "planned_no_write",
      toolName: "user_public_data_join_privacy_plan"
    });
    expect(body.data.capability).toMatchObject({
      field_authorization_required: true,
      route: "POST /documents/user-public-data-join/plan",
      status: "user_public_data_join_privacy_scaffold",
      tool_name: "user_public_data_join_privacy_plan"
    });
    expect(body.data.prd_items).toEqual(["DOC-05", "STK-08"]);
    expect(body.data.boundaries).toMatchObject({
      frontend_rendering: false,
      join_execution_live: false,
      live_upload_storage: false,
      persistent_writes: false,
      public_data_live_read: false,
      raw_file_body_persisted: false,
      sql_emitted: false
    });
    expect(body.data.user_file).toMatchObject({
      content_is_untrusted_data: true,
      file_id: "user_file_upload_1",
      file_sha256: "sha256:3b7c",
      raw_file_body_persisted: false,
      upload_storage_live: false,
      user_file_scope: "workspace_private"
    });
    expect(body.data.public_data).toMatchObject({
      field_authorization_policy_id: "field_policy_default_deny_v0",
      gateway_access_route: "POST /gateway/access-check",
      gateway_export_route: "POST /gateway/exports/plan",
      public_data_live_read: false,
      requested_fields: [
        "public_data.document_id",
        "public_data.published_at",
        "user_file.metric_label"
      ],
      scope: "hk_market_announcements_delayed"
    });
    expect(body.data.join_plan).toMatchObject({
      join_execution_live: false,
      join_key_policy: "explicit_allowlist",
      join_keys: ["instrument_id", "period"],
      public_output_contains_user_private_data: false,
      row_level_workspace_filter: true
    });
    expect(body.data.custom_layout).toMatchObject({
      layout_id: "layout_research_view_1",
      layout_metadata_only: true,
      layout_scope: "workspace_private",
      references_public_data_scope_by_id_only: true,
      references_user_file_by_id_only: true,
      save_status: "planned_no_write"
    });
    expect(body.data.privacy_contract).toMatchObject({
      consent_required: true,
      cross_workspace_join: false,
      document_sanitizer_required: true,
      field_authorization_required: true,
      public_data_rights_expansion: false
    });
    expect(body.data.blockers).toEqual([]);
    expect(body.usage.rows).toBe(1);
  });

  it("blocks user file joins when consent is missing", async () => {
    const response = await app.request("/documents/user-public-data-join/plan", {
      body: JSON.stringify({
        field_authorization_policy_id: "field_policy_default_deny_v0",
        join_keys: ["instrument_id"],
        privacy_policy_id: "privacy_policy_v0",
        public_data_scope: "hk_market_announcements_delayed",
        requested_fields: ["public_data.document_id"],
        retention_policy_id: "retention_policy_v0",
        user_file_id: "user_file_upload_1",
        user_file_sha256: "sha256:3b7c",
        workspace_id: "ws_research_1"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-user-public-data-join-missing-consent"
      },
      method: "POST"
    });
    const body = (await response.json()) as UserPublicDataJoinPrivacyBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("blocked_missing_consent");
    expect(body.data.blockers).toContain("user_consent_id_required");
    expect(body.data.boundaries.join_execution_live).toBe(false);
    expect(body.data.boundaries.persistent_writes).toBe(false);
    expect(body.usage.rows).toBe(0);
  });

  it("diffs announcement key numbers with source-bound schema extraction", async () => {
    const response = await app.request("/documents/diff-announcements", {
      body: JSON.stringify({
        base_document_id: "doc_ann_00700_20240320_results",
        comparison_document_id: "doc_ann_00700_20250320_results"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-diff-announcements"
      },
      method: "POST"
    });
    const body = (await response.json()) as DiffAnnouncementsBody;
    const revenueDiff = body.data.diffs.find((diff) => diff.field_id === "revenue");

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      comparison_engine: "synthetic_schema_bound_numeric_diff",
      diff_count: 2,
      evidence_binding_ready: true,
      extracted_value_count: 4,
      frontend_rendering: false,
      live_data_access: false,
      original_document_fetch: false,
      row_count: 2,
      schema_validation_ready: true,
      sql_emitted: false,
      status: "found",
      toolName: "diff_announcements",
      vector_search: false
    });
    expect(body.data.capability).toMatchObject({
      evidence_binding_ready: true,
      route: "POST /documents/diff-announcements",
      schema_id: "announcement_numeric_extraction_v0",
      schema_validation_ready: true,
      tool_name: "diff_announcements",
      vector_search: false
    });
    expect(body.data.documents.base).toMatchObject({
      document_id: "doc_ann_00700_20240320_results",
      source_record_id: "src_announcement_00700_20240320_results",
      symbol: "00700.HK"
    });
    expect(body.data.documents.comparison).toMatchObject({
      document_id: "doc_ann_00700_20250320_results",
      source_record_id: "src_announcement_00700_20250320_results",
      symbol: "00700.HK"
    });
    expect(body.data.schema_validation).toMatchObject({
      errors: [],
      schema_id: "announcement_numeric_extraction_v0",
      valid: true,
      validated_value_count: 4
    });
    expect(body.data.extracted_values[0]).toMatchObject({
      document_id: "doc_ann_00700_20240320_results",
      evidence_locator: {
        document_id: "doc_ann_00700_20240320_results",
        page: 4,
        paragraph: 2,
        source_record_id: "src_announcement_00700_20240320_results"
      },
      field_id: "revenue",
      schema_valid: true,
      source_record_id: "src_announcement_00700_20240320_results",
      value: 609
    });
    expect(revenueDiff).toMatchObject({
      absolute_change: 51.3,
      base_value: 609,
      comparison_value: 660.3,
      evidence_locators: {
        base: {
          page: 4,
          paragraph: 2,
          source_record_id: "src_announcement_00700_20240320_results"
        },
        comparison: {
          page: 4,
          paragraph: 2,
          source_record_id: "src_announcement_00700_20250320_results"
        }
      },
      schema_valid: true,
      unit: "HKD billion"
    });
    expect(revenueDiff?.percent_change).toBeCloseTo(0.084236, 6);
    expect(body.usage.rows).toBe(2);
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
    expect(body.data.response_presentation).toMatchObject({
      actual_tool_execution: false,
      data_contract_invariant: true,
      default_locale: "zh-Hant",
      default_response_depth: "professional",
      frontend: false,
      locale_switch_changes_data: false,
      model_calls: false,
      response_depth_changes_data: false,
      route: "POST /agent/runs/plan",
      status: "localized_response_contract_scaffold",
      supported_locales: ["zh-Hant", "zh-Hans", "en"],
      supported_response_depths: ["newbie", "professional"],
      terminology_glossary_ready: true,
      version: "2026-06-21.phase3.localized-response-contract.v0"
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
        post_generation_validation: "local_deterministic",
        post_generation_validator_ready: true,
        post_generation_validator_route: "POST /agent/runs/validate-answer",
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
      streaming_transport: "server_sent_events"
    });
    expect(body.data.workflow_tasks).toMatchObject({
      actual_workflow_execution: false,
      binding: "AIPHABEE_RESEARCH_WORKFLOW",
      disconnect_safe: true,
      event_queue: "AIPHABEE_EVENTS_QUEUE",
      frontend: false,
      live_workflow_execution: false,
      notification_plan: true,
      persistent_writes: false,
      resume_route: "GET /agent/workflows/tasks/:task_id",
      route: "POST /agent/workflows/tasks/plan",
      sql_emitted: false,
      status: "workflow_task_scaffold",
      task_id_visible: true
    });
    expect(body.data.product_agent_release_gate).toMatchObject({
      actual_tool_execution: false,
      frontend_rendering: false,
      live_db_writes: false,
      live_tool_execution: false,
      model_calls: false,
      persistent_writes: false,
      preflight_route: "POST /agent/runs/preflight",
      route: "POST /agent/release-gates/product-agent/plan",
      runtime_route: "GET /agent/runtime",
      sql_emitted: false,
      status: "product_agent_release_gate_scaffold",
      tool_loop_route: "POST /agent/runs/plan",
      version: "2026-06-21.phase3.product-agent-release-gate-scaffold.v0"
    });
    expect(body.data.product_agent_release_gate.required_checks).toEqual([
      "ambiguous_security_blocks_tool_planning",
      "silent_security_selection_blocked",
      "numeric_claim_requires_tool_result_or_calculation_ref",
      "post_generation_unsourced_numeric_claim_blocked",
      "answer_contract_blocks_unsourced_numbers",
      "deterministic_calculations_keep_model_out"
    ]);
    expect(body.data.agent_label_budget_release_gate).toMatchObject({
      actual_tool_execution: false,
      analytics_high_cost_route: "POST /analytics/high-cost/plan",
      frontend_rendering: false,
      live_db_writes: false,
      live_queue_writes: false,
      live_tool_execution: false,
      model_calls: false,
      persistent_writes: false,
      route: "POST /agent/release-gates/label-budget/plan",
      runtime_route: "GET /agent/runtime",
      sql_emitted: false,
      status: "agent_label_budget_release_gate_scaffold",
      tool_loop_route: "POST /agent/runs/plan",
      usage_reservation_route: "POST /usage/high-cost/reservation/plan",
      version: "2026-06-21.phase3.agent-label-budget-release-gate-scaffold.v0"
    });
    expect(body.data.agent_label_budget_release_gate.required_checks).toEqual([
      "fact_label_requires_evidence_card",
      "inference_label_requires_evidence_strength",
      "unknown_label_requires_missing_reason",
      "high_cost_task_requires_budget_estimate",
      "high_cost_task_requires_confirmation_before_enqueue",
      "high_cost_usage_reservation_pre_debit_and_refund"
    ]);
    expect(body.data.task_replay_mode_release_gate).toMatchObject({
      actual_tool_execution: false,
      frontend_rendering: false,
      live_db_writes: false,
      live_queue_writes: false,
      live_tool_execution: false,
      live_workflow_execution: false,
      localized_response_route: "POST /agent/runs/plan",
      model_calls: false,
      persistent_writes: false,
      research_replay_route: "POST /research/runs/replay/plan",
      research_save_route: "POST /research/runs/save/plan",
      route: "POST /agent/release-gates/task-replay-mode/plan",
      runtime_route: "GET /agent/runtime",
      sql_emitted: false,
      status: "task_replay_mode_release_gate_scaffold",
      version: "2026-06-21.phase3.task-replay-mode-release-gate-scaffold.v0",
      workflow_task_route: "POST /agent/workflows/tasks/plan"
    });
    expect(body.data.task_replay_mode_release_gate.required_checks).toEqual([
      "long_task_returns_task_id_and_resume_handle",
      "long_task_checkpoint_state_is_disconnect_safe",
      "saved_report_has_deterministic_replay_seed",
      "replay_preserves_old_report_snapshot",
      "newbie_professional_depth_preserves_data_contract",
      "mode_switch_changes_presentation_only"
    ]);
    expect(body.data.prompt_injection_tool_denial_release_gate).toMatchObject({
      actual_tool_execution: false,
      document_sanitizer_route: "POST /documents/get-announcement",
      frontend_rendering: false,
      live_db_writes: false,
      live_document_fetch: false,
      live_tool_execution: false,
      model_calls: false,
      persistent_writes: false,
      route: "POST /agent/release-gates/prompt-injection/plan",
      runtime_route: "GET /agent/runtime",
      sql_emitted: false,
      status: "prompt_injection_tool_denial_release_gate_scaffold",
      tool_loop_route: "POST /agent/runs/plan",
      version: "2026-06-21.phase3.prompt-injection-tool-denial-release-gate-scaffold.v0"
    });
    expect(body.data.prompt_injection_tool_denial_release_gate.required_checks).toEqual([
      "untrusted_document_content_is_isolated",
      "document_origin_tool_instructions_not_executed",
      "arbitrary_sql_tool_denied_pre_execution",
      "arbitrary_url_tool_denied_pre_execution",
      "unregistered_tool_denied_pre_execution",
      "registered_tools_remain_schema_bound_read_only"
    ]);
    expect(body.data.agent_user_run_persistence_release_gate).toMatchObject({
      actual_tool_execution: false,
      agent_billing_posted_ledger_smoke_route: "POST /agent/runs/billing-posted-ledger-smoke",
      agent_run_live_write_smoke_route: "POST /agent/runs/live-write-smoke",
      agent_run_state_persistence_smoke_route: "POST /agent/runs/state-persistence-smoke",
      frontend_rendering: false,
      live_db_writes: false,
      live_tool_execution: false,
      model_calls: false,
      persistent_writes: false,
      production_persistence_enabled: false,
      route: "POST /agent/release-gates/user-run-persistence/plan",
      runtime_route: "GET /agent/runtime",
      sql_emitted: false,
      status: "agent_user_run_persistence_release_gate_scaffold",
      version: "2026-06-22.phase1.agent-user-run-persistence-release-gate.v0"
    });
    expect(body.data.agent_user_run_persistence_release_gate.required_checks).toEqual([
      "agent_run_live_write_smoke_contract_linked",
      "agent_run_state_persistence_smoke_contract_linked",
      "agent_billing_posted_ledger_smoke_contract_linked",
      "hash_only_smoke_responses_enforced",
      "production_cutover_signoff_required",
      "production_retention_policy_required"
    ]);
    expect(body.data.agent_ai_gateway_observability_release_gate).toMatchObject({
      actual_tool_execution: false,
      ai_gateway_observability_smoke_command: "npm run smoke:ai-gateway-observability-live",
      ai_gateway_observability_smoke_script: "scripts/smoke-ai-gateway-observability-live.mjs",
      frontend_rendering: false,
      live_ai_gateway_reads: false,
      live_db_writes: false,
      live_model_execution: false,
      model_calls: false,
      model_execution_audit_smoke_route: "POST /agent/runs/model-execution-audit-smoke",
      model_provider_readiness_contract: "deploy/model-providers/live-smoke-readiness.contract.json",
      model_routing_audit_contract: "deploy/agent/model-routing-audit.contract.json",
      persistent_writes: false,
      route: "POST /agent/release-gates/ai-gateway-observability/plan",
      runtime_route: "GET /agent/runtime",
      sql_emitted: false,
      status: "agent_ai_gateway_observability_release_gate_scaffold",
      version: "2026-06-22.phase1.agent-ai-gateway-observability-release-gate.v0"
    });
    expect(body.data.agent_ai_gateway_observability_release_gate.required_checks).toEqual([
      "model_execution_audit_smoke_contract_linked",
      "ai_gateway_observability_smoke_script_linked",
      "ai_gateway_read_permission_evidence_required",
      "request_log_cost_cache_fields_required",
      "rate_limit_fallback_evidence_required",
      "hash_only_capture_packet_required"
    ]);
    expect(body.data.agent_live_model_streaming_release_gate).toMatchObject({
      actual_tool_execution: false,
      ai_gateway_observability_release_gate_route:
        "POST /agent/release-gates/ai-gateway-observability/plan",
      backend_progress_stream_route: "POST /agent/runs/stream",
      frontend_rendering: false,
      generated_answer_evidence_smoke_route: "POST /agent/runs/generated-answer-evidence-smoke",
      live_model_streaming: false,
      live_tool_loop_smoke_route: "POST /agent/runs/live-tool-loop-smoke",
      model_calls: false,
      model_execution_audit_smoke_route: "POST /agent/runs/model-execution-audit-smoke",
      persistent_writes: false,
      route: "POST /agent/release-gates/live-model-streaming/plan",
      runtime_route: "GET /agent/runtime",
      sql_emitted: false,
      status: "agent_live_model_streaming_release_gate_scaffold",
      version: "2026-06-22.phase1.agent-live-model-streaming-release-gate.v0"
    });
    expect(body.data.agent_live_model_streaming_release_gate.required_checks).toEqual([
      "backend_progress_stream_contract_linked",
      "model_execution_stream_text_smoke_contract_linked",
      "live_tool_loop_stream_text_smoke_contract_linked",
      "generated_answer_evidence_binding_smoke_linked",
      "ai_gateway_observability_gate_linked",
      "user_facing_stream_cutover_blocked"
    ]);
    expect(body.data.agent_user_tool_loop_execution_release_gate).toMatchObject({
      actual_tool_execution: false,
      arbitrary_user_tool_loop_execution: false,
      budget_stop_policy_route: "POST /agent/runs/plan",
      failure_recovery_policy_route: "POST /agent/runs/plan",
      fixed_tool_execution_evidence_smoke_route:
        "POST /agent/runs/tool-execution-evidence-smoke",
      frontend_rendering: false,
      live_db_writes: false,
      live_model_execution: false,
      live_tool_execution: false,
      live_tool_loop_smoke_route: "POST /agent/runs/live-tool-loop-smoke",
      model_calls: false,
      persistent_writes: false,
      preflight_route: "POST /agent/runs/preflight",
      route: "POST /agent/release-gates/user-tool-loop-execution/plan",
      runtime_route: "GET /agent/runtime",
      sql_emitted: false,
      status: "agent_user_tool_loop_execution_release_gate_scaffold",
      tool_enforcement_route: "POST /agent/runs/plan",
      tool_loop_route: "POST /agent/runs/plan",
      user_run_persistence_release_gate_route:
        "POST /agent/release-gates/user-run-persistence/plan",
      version: "2026-06-22.phase1.agent-user-tool-loop-execution-release-gate.v0"
    });
    expect(body.data.agent_user_tool_loop_execution_release_gate.required_checks).toEqual([
      "tool_loop_planner_contract_linked",
      "pre_tool_call_resolution_contract_linked",
      "tool_enforcement_contract_linked",
      "budget_stop_policy_contract_linked",
      "failure_recovery_policy_contract_linked",
      "fixed_tool_execution_evidence_smoke_linked",
      "fixed_live_tool_loop_smoke_linked",
      "user_run_persistence_gate_linked",
      "arbitrary_user_tool_loop_cutover_blocked"
    ]);
    expect(body.data.agent_model_output_corpus_release_gate).toMatchObject({
      actual_tool_execution: false,
      eval_v1_contract: "deploy/observability/eval-v1.contract.json",
      frontend_rendering: false,
      generated_answer_evidence_smoke_route: "POST /agent/runs/generated-answer-evidence-smoke",
      live_model_output_corpus_enabled: false,
      live_model_streaming_release_gate_route:
        "POST /agent/release-gates/live-model-streaming/plan",
      live_smoke_evidence_ledger_contract:
        "deploy/governance/live-smoke-evidence-ledger.contract.json",
      model_calls: false,
      model_execution_audit_smoke_route: "POST /agent/runs/model-execution-audit-smoke",
      persistent_eval_writes: false,
      persistent_writes: false,
      production_sampling_enabled: false,
      route: "POST /agent/release-gates/model-output-corpus/plan",
      runtime_route: "GET /agent/runtime",
      sql_emitted: false,
      status: "agent_model_output_corpus_release_gate_scaffold",
      unsourced_numeric_sampling_contract:
        "deploy/observability/unsourced-numeric-sampling.contract.json",
      version: "2026-06-22.phase1.agent-model-output-corpus-release-gate.v0"
    });
    expect(body.data.agent_model_output_corpus_release_gate.required_checks).toEqual([
      "unsourced_numeric_sampling_contract_linked",
      "generated_answer_evidence_smoke_linked",
      "model_execution_audit_smoke_linked",
      "live_model_streaming_gate_linked",
      "eval_v1_contract_linked",
      "live_smoke_evidence_ledger_linked",
      "production_model_output_corpus_cutover_blocked"
    ]);
    expect(body.data.agent_token_cost_fallback_release_gate).toMatchObject({
      actual_tool_execution: false,
      ai_gateway_observability_release_gate_route:
        "POST /agent/release-gates/ai-gateway-observability/plan",
      billing_posted_ledger_smoke_route: "POST /agent/runs/billing-posted-ledger-smoke",
      frontend_rendering: false,
      live_token_cost_fallback_log_writes: false,
      model_calls: false,
      model_execution_audit_smoke_route: "POST /agent/runs/model-execution-audit-smoke",
      model_routing_audit_contract: "deploy/agent/model-routing-audit.contract.json",
      persistent_writes: false,
      production_cost_ledger_enabled: false,
      route: "POST /agent/release-gates/token-cost-fallback/plan",
      run_tool_audit_fields_contract: "deploy/governance/run-tool-audit-fields.contract.json",
      runtime_route: "GET /agent/runtime",
      sql_emitted: false,
      status: "agent_token_cost_fallback_release_gate_scaffold",
      user_run_persistence_release_gate_route:
        "POST /agent/release-gates/user-run-persistence/plan",
      version: "2026-06-22.phase1.agent-token-cost-fallback-release-gate.v0"
    });
    expect(body.data.agent_token_cost_fallback_release_gate.required_checks).toEqual([
      "model_execution_audit_smoke_linked",
      "model_routing_audit_contract_linked",
      "run_tool_audit_fields_contract_linked",
      "ai_gateway_observability_gate_linked",
      "billing_posted_ledger_smoke_linked",
      "user_run_persistence_gate_linked",
      "live_token_cost_fallback_writes_blocked"
    ]);
    expect(body.data.kill_switch).toMatchObject({
      actual_tool_execution: false,
      frontend: false,
      live_flag_reads: false,
      model_calls: false,
      model_kill_switch_ready: true,
      persistent_writes: false,
      route: "POST /agent/kill-switch/plan",
      safe_degradation_ready: true,
      status: "kill_switch_scaffold",
      tool_kill_switch_ready: true
    });
    expect(body.data.registered_tools).toHaveLength(REGISTERED_TOOL_COUNT);
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

  it("plans AI Gateway observability release gate without live Cloudflare reads", async () => {
    const response = await app.request("/agent/release-gates/ai-gateway-observability/plan", {
      body: JSON.stringify({
        account_analytics_read_permission_evidence: true,
        ai_gateway_read_permission_evidence: true,
        capture_packet_accepted: true,
        cost_cache_evidence_accepted: true,
        rate_limit_fallback_evidence_accepted: true,
        request_log_evidence_accepted: true
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-agent-ai-gateway-observability-gate-route"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentAiGatewayObservabilityReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      actual_tool_execution: false,
      capability: {
        route: "POST /agent/release-gates/ai-gateway-observability/plan",
        status: "agent_ai_gateway_observability_release_gate_scaffold"
      },
      frontend_rendering: false,
      live_ai_gateway_reads: false,
      live_db_writes: false,
      live_model_execution: false,
      model_calls: false,
      persistent_writes: false,
      release_gate: {
        blockers: ["route_does_not_verify_live_capture_packet"],
        gate_status: "blocked_ai_gateway_observability_evidence",
        no_live_release_claim: true,
        required_signoffs: ["agent", "observability", "platform"]
      },
      release_transition_allowed: false,
      version: "2026-06-22.phase1.agent-ai-gateway-observability-release-gate.v0"
    });
    expect(body.data.capability.required_checks).toEqual([
      "model_execution_audit_smoke_contract_linked",
      "ai_gateway_observability_smoke_script_linked",
      "ai_gateway_read_permission_evidence_required",
      "request_log_cost_cache_fields_required",
      "rate_limit_fallback_evidence_required",
      "hash_only_capture_packet_required"
    ]);
    expect(body.data.release_checks.map((check) => check.check)).toEqual(
      body.data.capability.required_checks
    );
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.linked_evidence.map((evidence) => evidence.surface)).toEqual([
      "model_execution_audit_smoke",
      "model_provider_readiness",
      "model_routing_audit_contract",
      "ai_gateway_observability_live_smoke",
      "live_smoke_capture_packet"
    ]);
    expect(body.data.evidence_requirements.every((requirement) => requirement.status === "satisfied")).toBe(
      true
    );
    expect(body.data.validation).toMatchObject({
      account_analytics_read_permission_evidence_present: true,
      ai_gateway_observability_smoke_script_linked: true,
      ai_gateway_read_permission_evidence_present: true,
      capture_packet_accepted: true,
      cost_cache_evidence_present: true,
      model_execution_audit_smoke_linked: true,
      no_frontend_rendering: true,
      no_live_ai_gateway_reads: true,
      no_model_calls: true,
      no_persistent_writes: true,
      rate_limit_fallback_evidence_present: true,
      release_transition_allowed: false,
      request_log_evidence_present: true
    });
    expect(body.usage.rows).toBe(6);
  });

  it("plans live model streaming release gate without executing user token streams", async () => {
    const response = await app.request("/agent/release-gates/live-model-streaming/plan", {
      body: JSON.stringify({
        ai_gateway_observability_gate_accepted: true,
        backend_progress_stream_accepted: true,
        frontend_streaming_ui_accepted: true,
        generated_answer_evidence_accepted: true,
        live_tool_loop_stream_text_accepted: true,
        model_audit_stream_text_accepted: true,
        stream_auth_redaction_accepted: true
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-agent-live-model-streaming-gate-route"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentLiveModelStreamingReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      actual_tool_execution: false,
      capability: {
        route: "POST /agent/release-gates/live-model-streaming/plan",
        status: "agent_live_model_streaming_release_gate_scaffold"
      },
      frontend_rendering: false,
      live_model_execution: false,
      live_model_streaming: false,
      model_calls: false,
      persistent_writes: false,
      release_gate: {
        blockers: ["route_does_not_execute_user_model_stream"],
        gate_status: "blocked_user_facing_live_model_streaming",
        no_live_release_claim: true,
        required_signoffs: ["agent", "product", "observability", "security"]
      },
      release_transition_allowed: false,
      version: "2026-06-22.phase1.agent-live-model-streaming-release-gate.v0"
    });
    expect(body.data.capability.required_checks).toEqual([
      "backend_progress_stream_contract_linked",
      "model_execution_stream_text_smoke_contract_linked",
      "live_tool_loop_stream_text_smoke_contract_linked",
      "generated_answer_evidence_binding_smoke_linked",
      "ai_gateway_observability_gate_linked",
      "user_facing_stream_cutover_blocked"
    ]);
    expect(body.data.release_checks.map((check) => check.check)).toEqual(
      body.data.capability.required_checks
    );
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.linked_evidence.map((evidence) => evidence.surface)).toEqual([
      "backend_progress_stream",
      "model_execution_audit_smoke",
      "live_tool_loop_smoke",
      "generated_answer_evidence_smoke",
      "ai_gateway_observability_release_gate"
    ]);
    expect(body.data.evidence_requirements.every((requirement) => requirement.status === "satisfied")).toBe(
      true
    );
    expect(body.data.validation).toMatchObject({
      ai_gateway_observability_gate_accepted: true,
      ai_gateway_observability_gate_linked: true,
      backend_progress_stream_accepted: true,
      backend_progress_stream_linked: true,
      frontend_streaming_ui_accepted: true,
      generated_answer_evidence_accepted: true,
      generated_answer_evidence_smoke_linked: true,
      live_tool_loop_stream_text_accepted: true,
      live_tool_loop_stream_text_smoke_linked: true,
      model_audit_stream_text_accepted: true,
      model_execution_audit_stream_text_linked: true,
      no_frontend_rendering: true,
      no_live_model_execution: true,
      no_live_model_streaming: true,
      no_model_calls: true,
      release_transition_allowed: false,
      stream_auth_redaction_accepted: true
    });
    expect(body.usage.rows).toBe(6);
  });

  it("plans model output corpus release gate without production sampling", async () => {
    const response = await app.request("/agent/release-gates/model-output-corpus/plan", {
      body: JSON.stringify({
        eval_v1_accepted: true,
        frontend_evidence_cards_accepted: true,
        generated_answer_evidence_accepted: true,
        live_model_streaming_gate_accepted: true,
        live_smoke_evidence_ledger_accepted: true,
        model_execution_audit_accepted: true,
        partner_approved_corpus_accepted: true,
        persistent_eval_writes_accepted: true,
        unsourced_numeric_sampling_accepted: true
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-agent-model-output-corpus-gate-route"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentModelOutputCorpusReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      actual_tool_execution: false,
      capability: {
        route: "POST /agent/release-gates/model-output-corpus/plan",
        status: "agent_model_output_corpus_release_gate_scaffold"
      },
      frontend_rendering: false,
      live_model_output_corpus_enabled: false,
      model_calls: false,
      persistent_eval_writes: false,
      persistent_writes: false,
      production_sampling_enabled: false,
      release_gate: {
        blockers: ["route_does_not_ingest_live_model_output_corpus"],
        gate_status: "blocked_model_output_corpus_evidence",
        no_live_release_claim: true,
        required_signoffs: ["agent", "observability", "data", "product"]
      },
      release_transition_allowed: false,
      version: "2026-06-22.phase1.agent-model-output-corpus-release-gate.v0"
    });
    expect(body.data.capability.required_checks).toEqual([
      "unsourced_numeric_sampling_contract_linked",
      "generated_answer_evidence_smoke_linked",
      "model_execution_audit_smoke_linked",
      "live_model_streaming_gate_linked",
      "eval_v1_contract_linked",
      "live_smoke_evidence_ledger_linked",
      "production_model_output_corpus_cutover_blocked"
    ]);
    expect(body.data.release_checks.map((check) => check.check)).toEqual(
      body.data.capability.required_checks
    );
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.linked_evidence.map((evidence) => evidence.surface)).toEqual([
      "unsourced_numeric_sampling",
      "generated_answer_evidence_smoke",
      "model_execution_audit_smoke",
      "live_model_streaming_release_gate",
      "eval_v1_contract",
      "live_smoke_evidence_ledger"
    ]);
    expect(body.data.evidence_requirements.every((requirement) => requirement.status === "satisfied")).toBe(
      true
    );
    expect(body.data.validation).toMatchObject({
      eval_v1_accepted: true,
      eval_v1_contract_linked: true,
      frontend_evidence_cards_accepted: true,
      generated_answer_evidence_accepted: true,
      generated_answer_evidence_smoke_linked: true,
      live_model_output_corpus_enabled: false,
      live_model_streaming_gate_accepted: true,
      live_model_streaming_gate_linked: true,
      live_smoke_evidence_ledger_accepted: true,
      live_smoke_evidence_ledger_linked: true,
      model_execution_audit_accepted: true,
      model_execution_audit_smoke_linked: true,
      no_frontend_rendering: true,
      no_model_calls: true,
      no_persistent_eval_writes: true,
      no_persistent_writes: true,
      partner_approved_model_output_corpus_accepted: true,
      persistent_eval_writes_accepted: true,
      production_sampling_enabled: false,
      release_transition_allowed: false,
      unsourced_numeric_sampling_accepted: true,
      unsourced_numeric_sampling_contract_linked: true
    });
    expect(body.usage.rows).toBe(7);
  });

  it("plans token/cost/fallback release gate without live cost writes", async () => {
    const response = await app.request("/agent/release-gates/token-cost-fallback/plan", {
      body: JSON.stringify({
        ai_gateway_observability_gate_accepted: true,
        billing_posted_ledger_accepted: true,
        cost_rate_limit_fallback_evidence_accepted: true,
        live_cost_ledger_writer_accepted: true,
        model_execution_audit_accepted: true,
        model_routing_audit_accepted: true,
        run_tool_audit_fields_accepted: true,
        user_run_persistence_gate_accepted: true
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-agent-token-cost-fallback-gate-route"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentTokenCostFallbackReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      actual_tool_execution: false,
      capability: {
        route: "POST /agent/release-gates/token-cost-fallback/plan",
        status: "agent_token_cost_fallback_release_gate_scaffold"
      },
      frontend_rendering: false,
      live_token_cost_fallback_log_writes: false,
      model_calls: false,
      persistent_writes: false,
      production_cost_ledger_enabled: false,
      release_gate: {
        blockers: ["route_does_not_write_live_token_cost_fallback_logs"],
        gate_status: "blocked_live_token_cost_fallback_writes",
        no_live_release_claim: true,
        required_signoffs: ["agent", "observability", "finance", "platform"]
      },
      release_transition_allowed: false,
      version: "2026-06-22.phase1.agent-token-cost-fallback-release-gate.v0"
    });
    expect(body.data.capability.required_checks).toEqual([
      "model_execution_audit_smoke_linked",
      "model_routing_audit_contract_linked",
      "run_tool_audit_fields_contract_linked",
      "ai_gateway_observability_gate_linked",
      "billing_posted_ledger_smoke_linked",
      "user_run_persistence_gate_linked",
      "live_token_cost_fallback_writes_blocked"
    ]);
    expect(body.data.release_checks.map((check) => check.check)).toEqual(
      body.data.capability.required_checks
    );
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.linked_evidence.map((evidence) => evidence.surface)).toEqual([
      "model_execution_audit_smoke",
      "model_routing_audit_contract",
      "run_tool_audit_fields_contract",
      "ai_gateway_observability_release_gate",
      "billing_posted_ledger_smoke",
      "user_run_persistence_release_gate"
    ]);
    expect(body.data.evidence_requirements.every((requirement) => requirement.status === "satisfied")).toBe(
      true
    );
    expect(body.data.validation).toMatchObject({
      ai_gateway_observability_gate_accepted: true,
      ai_gateway_observability_gate_linked: true,
      billing_posted_ledger_accepted: true,
      billing_posted_ledger_smoke_linked: true,
      cost_rate_limit_fallback_evidence_accepted: true,
      live_cost_ledger_writer_accepted: true,
      live_token_cost_fallback_log_writes: false,
      model_execution_audit_accepted: true,
      model_execution_audit_smoke_linked: true,
      model_routing_audit_accepted: true,
      model_routing_audit_contract_linked: true,
      no_frontend_rendering: true,
      no_model_calls: true,
      no_persistent_writes: true,
      production_cost_ledger_enabled: false,
      release_transition_allowed: false,
      run_tool_audit_fields_accepted: true,
      run_tool_audit_fields_contract_linked: true,
      user_run_persistence_gate_accepted: true,
      user_run_persistence_gate_linked: true
    });
    expect(body.usage.rows).toBe(7);
  });

  it("plans user ToolLoop execution release gate without arbitrary user execution", async () => {
    const response = await app.request("/agent/release-gates/user-tool-loop-execution/plan", {
      body: JSON.stringify({
        budget_stop_policy_accepted: true,
        failure_recovery_policy_accepted: true,
        fixed_live_tool_loop_smoke_accepted: true,
        fixed_tool_execution_evidence_accepted: true,
        pre_tool_call_resolution_accepted: true,
        tool_enforcement_accepted: true,
        tool_loop_planner_accepted: true,
        user_auth_entitlement_accepted: true,
        user_run_persistence_gate_accepted: true
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-agent-user-tool-loop-execution-gate-route"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentUserToolLoopExecutionReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      actual_tool_execution: false,
      arbitrary_user_tool_loop_execution: false,
      capability: {
        route: "POST /agent/release-gates/user-tool-loop-execution/plan",
        status: "agent_user_tool_loop_execution_release_gate_scaffold"
      },
      frontend_rendering: false,
      live_db_writes: false,
      live_model_execution: false,
      live_tool_execution: false,
      model_calls: false,
      persistent_writes: false,
      release_gate: {
        blockers: ["route_does_not_accept_arbitrary_user_tool_loop"],
        gate_status: "blocked_arbitrary_user_tool_loop_execution",
        no_live_release_claim: true,
        required_signoffs: ["agent", "data", "security", "operations"]
      },
      release_transition_allowed: false,
      version: "2026-06-22.phase1.agent-user-tool-loop-execution-release-gate.v0"
    });
    expect(body.data.capability.required_checks).toEqual([
      "tool_loop_planner_contract_linked",
      "pre_tool_call_resolution_contract_linked",
      "tool_enforcement_contract_linked",
      "budget_stop_policy_contract_linked",
      "failure_recovery_policy_contract_linked",
      "fixed_tool_execution_evidence_smoke_linked",
      "fixed_live_tool_loop_smoke_linked",
      "user_run_persistence_gate_linked",
      "arbitrary_user_tool_loop_cutover_blocked"
    ]);
    expect(body.data.release_checks.map((check) => check.check)).toEqual(
      body.data.capability.required_checks
    );
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.linked_evidence.map((evidence) => evidence.surface)).toEqual([
      "tool_loop_planner",
      "pre_tool_call_resolution",
      "tool_enforcement",
      "budget_stop_policy",
      "failure_recovery_policy",
      "fixed_tool_execution_evidence_smoke",
      "fixed_live_tool_loop_smoke",
      "user_run_persistence_release_gate"
    ]);
    expect(body.data.evidence_requirements.every((requirement) => requirement.status === "satisfied")).toBe(
      true
    );
    expect(body.data.validation).toMatchObject({
      arbitrary_user_tool_loop_execution: false,
      budget_stop_policy_accepted: true,
      budget_stop_policy_linked: true,
      failure_recovery_policy_accepted: true,
      failure_recovery_policy_linked: true,
      fixed_live_tool_loop_smoke_accepted: true,
      fixed_live_tool_loop_smoke_linked: true,
      fixed_tool_execution_evidence_accepted: true,
      fixed_tool_execution_evidence_smoke_linked: true,
      no_frontend_rendering: true,
      no_live_db_writes: true,
      no_live_model_execution: true,
      no_live_tool_execution: true,
      no_model_calls: true,
      pre_tool_call_resolution_accepted: true,
      pre_tool_call_resolution_linked: true,
      release_transition_allowed: false,
      tool_enforcement_accepted: true,
      tool_enforcement_linked: true,
      tool_loop_planner_accepted: true,
      tool_loop_planner_linked: true,
      user_auth_entitlement_accepted: true,
      user_run_persistence_gate_accepted: true,
      user_run_persistence_gate_linked: true
    });
    expect(body.usage.rows).toBe(9);
  });

  it("plans user-run persistence release gate without enabling production writes", async () => {
    const response = await app.request("/agent/release-gates/user-run-persistence/plan", {
      body: JSON.stringify({
        operator_signoff: true,
        production_cutover_requested: true,
        retention_policy_approved: true
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-agent-user-run-persistence-gate-route"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentUserRunPersistenceReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      actual_tool_execution: false,
      capability: {
        route: "POST /agent/release-gates/user-run-persistence/plan",
        status: "agent_user_run_persistence_release_gate_scaffold"
      },
      frontend_rendering: false,
      live_db_writes: false,
      live_tool_execution: false,
      model_calls: false,
      persistent_writes: false,
      production_cutover_allowed: false,
      production_cutover_requested: true,
      production_persistence_enabled: false,
      release_gate: {
        blockers: ["production_write_path", "frontend_resume_rendering"],
        gate_status: "blocked_production_user_run_persistence",
        no_live_release_claim: true,
        required_signoffs: ["agent", "data", "billing", "operations"]
      },
      version: "2026-06-22.phase1.agent-user-run-persistence-release-gate.v0"
    });
    expect(body.data.capability.required_checks).toEqual([
      "agent_run_live_write_smoke_contract_linked",
      "agent_run_state_persistence_smoke_contract_linked",
      "agent_billing_posted_ledger_smoke_contract_linked",
      "hash_only_smoke_responses_enforced",
      "production_cutover_signoff_required",
      "production_retention_policy_required"
    ]);
    expect(body.data.release_checks.map((check) => check.check)).toEqual(
      body.data.capability.required_checks
    );
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.smoke_gates.map((gate) => gate.route)).toEqual([
      "POST /agent/runs/live-write-smoke",
      "POST /agent/runs/state-persistence-smoke",
      "POST /agent/runs/billing-posted-ledger-smoke"
    ]);
    expect(body.data.smoke_gates.every((gate) => gate.hash_only_response)).toBe(true);
    expect(body.data.production_prerequisites).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          requirement: "operator_cutover_signoff",
          status: "satisfied"
        }),
        expect.objectContaining({
          requirement: "production_retention_policy",
          status: "satisfied"
        }),
        expect.objectContaining({
          requirement: "production_write_path",
          status: "blocked"
        }),
        expect.objectContaining({
          requirement: "frontend_resume_rendering",
          status: "blocked"
        })
      ])
    );
    expect(body.data.validation).toMatchObject({
      agent_billing_posted_ledger_smoke_linked: true,
      agent_run_live_write_smoke_linked: true,
      agent_run_state_persistence_smoke_linked: true,
      hash_only_smoke_responses_required: true,
      no_frontend_rendering: true,
      no_live_db_writes: true,
      no_model_calls: true,
      operator_signoff_present: true,
      production_cutover_allowed: false,
      production_persistence_enabled: false,
      retention_policy_approved: true,
      smoke_chain_has_audit_evidence_usage_state_and_billing: true
    });
    expect(body.usage.rows).toBe(6);
  });

  it("plans product Agent release gate without silent security selection or unsourced numbers", async () => {
    const response = await app.request("/agent/release-gates/product-agent/plan", {
      body: JSON.stringify({
        ambiguous_security_query: "ABC",
        numeric_prompt: "Explain 00700.HK revenue and ROE with source records",
        tools: [
          "resolve_security",
          "get_entitlements",
          "get_financial_facts",
          "get_financial_ratios",
          "calculate_returns_risk",
          "get_data_lineage"
        ],
        user_id: "user_internal_alpha",
        workspace_id: "workspace_research"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-product-agent-gate-route"
      },
      method: "POST"
    });
    const body = (await response.json()) as ProductAgentReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      actual_tool_execution: false,
      ambiguous_security_gate: {
        ambiguous_candidate_count: 2,
        clarification_required: true,
        input_security_query: "ABC",
        silent_selection_allowed: false,
        tool_planning_allowed: false
      },
      capability: {
        route: "POST /agent/release-gates/product-agent/plan",
        status: "product_agent_release_gate_scaffold"
      },
      frontend_rendering: false,
      live_tool_execution: false,
      model_calls: false,
      numeric_evidence_gate: {
        allowed_sources: ["tool_result", "deterministic_calculation"],
        blocked_sources: ["model_memory", "training_data", "unverified_prompt", "unstated_source"],
        concrete_claims_allowed_now: false,
        concrete_numbers_allowed_without_sources: false,
        failure_code: "UNSOURCED_NUMERIC_CLAIM",
        post_generation_sourced_probe_allowed: true,
        post_generation_unsourced_probe_blocked: true,
        post_generation_validation: "local_deterministic",
        post_generation_validator_route: "POST /agent/runs/validate-answer",
        requires_calculation_ref: true,
        requires_source_record_ref: true
      },
      release_gate: {
        blockers: ["live_evidence_binding_missing", "frontend_clarification_ui_missing"],
        gate_status: "blocked_live_evidence_binding",
        no_live_release_claim: true,
        required_signoffs: ["product", "agent", "data_quality"]
      },
      post_generation_evidence_binding: {
        route: "POST /agent/runs/validate-answer",
        status: "validator_ready",
        version: "2026-06-22.phase3.post-generation-evidence-binding.v0"
      },
      version: "2026-06-21.phase3.product-agent-release-gate-scaffold.v0"
    });
    expect(body.data.ambiguous_security_gate.preflight.security.resolved).toEqual([]);
    expect(body.data.ambiguous_security_gate.preflight.tool_readiness.can_plan_tools).toBe(
      false
    );
    expect(body.data.answer_contract_gate).toMatchObject({
      calculation_requires_calculation_ref: true,
      fact_requires_evidence_card: true,
      required_claim_labels: ["fact", "calculation", "inference", "unknown"],
      unknown_requires_missing_reason: true
    });
    expect(body.data.answer_contract_gate.evidence_card_required_fields).toEqual(
      expect.arrayContaining(["source_record_id", "data_version", "methodology_version"])
    );
    expect(body.data.answer_contract_gate.validation_rules).toContain(
      "block_unsourced_specific_numbers"
    );
    expect(body.data.numeric_evidence_gate.validation_rules).toContain(
      "require_tool_result_or_calculation_ref"
    );
    expect(body.data.numeric_evidence_gate.deterministic_calculation_count).toBeGreaterThanOrEqual(
      3
    );
    expect(body.data.release_checks.map((check) => check.check)).toEqual([
      "ambiguous_security_blocks_tool_planning",
      "silent_security_selection_blocked",
      "numeric_claim_requires_tool_result_or_calculation_ref",
      "post_generation_unsourced_numeric_claim_blocked",
      "answer_contract_blocks_unsourced_numbers",
      "deterministic_calculations_keep_model_out"
    ]);
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.validation).toMatchObject({
      ambiguous_security_blocked: true,
      answer_contract_blocks_unsourced_numbers: true,
      concrete_numbers_require_evidence: true,
      deterministic_calculations_keep_model_out: true,
      no_frontend_rendering: true,
      no_live_execution: true,
      numeric_sources_restricted: true,
      post_generation_sourced_numeric_claim_allowed: true,
      post_generation_unsourced_numeric_claim_blocked: true,
      silent_selection_allowed: false,
      tool_planning_blocked_until_clarified: true
    });
    expect(body.usage.rows).toBe(6);
  });

  it("plans prompt injection and arbitrary tool denial release gate", async () => {
    const response = await app.request("/agent/release-gates/prompt-injection/plan", {
      body: JSON.stringify({
        document_id: "doc_ann_00700_20260103_dividend",
        section_id: "dividend_timetable",
        user_id: "user_internal_alpha",
        workspace_id: "workspace_research"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-prompt-injection-tool-denial-gate-route"
      },
      method: "POST"
    });
    const body = (await response.json()) as PromptInjectionToolDenialReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      actual_tool_execution: false,
      capability: {
        route: "POST /agent/release-gates/prompt-injection/plan",
        status: "prompt_injection_tool_denial_release_gate_scaffold"
      },
      frontend_rendering: false,
      live_document_fetch: false,
      live_tool_execution: false,
      model_calls: false,
      prompt_injection_gate: {
        document_sanitizer_capability: {
          prompt_injection_isolated: true,
          tool_invocation_allowed_from_document: false
        },
        malicious_document_id: "doc_ann_00700_20260103_dividend",
        malicious_section_id: "dividend_timetable",
        removed_items: ["hidden_text", "script_tag", "suspicious_instruction"],
        sanitized_excerpt_contains_script: false,
        sanitized_excerpt_contains_tool_instruction: false
      },
      release_gate: {
        gate_status: "blocked_live_prompt_injection_red_team_validation",
        no_live_release_claim: true,
        required_signoffs: ["security", "agent", "data_governance"]
      },
      version: "2026-06-21.phase3.prompt-injection-tool-denial-release-gate-scaffold.v0"
    });
    expect(body.data.prompt_injection_gate.document_result).toMatchObject({
      document_trust_policy: {
        content_is_untrusted_data: true,
        prompt_injection_isolated: true
      },
      sanitization_summary: {
        raw_document_instructions_ignored: true,
        sections_sanitized: 1
      }
    });
    expect(body.data.tool_denial_gate.baseline_tool_enforcement).toMatchObject({
      allow_arbitrary_sql: false,
      allow_arbitrary_url: false,
      all_checks_passed: true,
      status: "allowed"
    });
    expect(body.data.tool_denial_gate.denied_tool_probes).toEqual([
      expect.objectContaining({
        denied_pre_execution: true,
        denied_tools: ["sql.query"],
        kind: "arbitrary_sql_tool",
        requested_tool: "sql.query",
        runtime_error_code: "UNREGISTERED_TOOL",
        status: "denied_pre_execution"
      }),
      expect.objectContaining({
        denied_pre_execution: true,
        denied_tools: ["http.fetch"],
        kind: "arbitrary_url_tool",
        requested_tool: "http.fetch",
        runtime_error_code: "UNREGISTERED_TOOL",
        status: "denied_pre_execution"
      }),
      expect.objectContaining({
        denied_pre_execution: true,
        denied_tools: ["admin.override"],
        kind: "unregistered_tool",
        requested_tool: "admin.override",
        runtime_error_code: "UNREGISTERED_TOOL",
        status: "denied_pre_execution"
      })
    ]);
    expect(body.data.release_checks.map((check) => check.check)).toEqual([
      "untrusted_document_content_is_isolated",
      "document_origin_tool_instructions_not_executed",
      "arbitrary_sql_tool_denied_pre_execution",
      "arbitrary_url_tool_denied_pre_execution",
      "unregistered_tool_denied_pre_execution",
      "registered_tools_remain_schema_bound_read_only"
    ]);
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.validation).toMatchObject({
      arbitrary_sql_denied_pre_execution: true,
      arbitrary_url_denied_pre_execution: true,
      document_origin_tool_instructions_not_executed: true,
      no_frontend_rendering: true,
      no_live_execution: true,
      registered_tools_schema_bound_read_only: true,
      unregistered_tool_denied_pre_execution: true,
      untrusted_document_content_is_isolated: true
    });
    expect(body.usage.rows).toBe(6);
  });

  it("plans Agent label and high-cost budget release gate without live queue writes", async () => {
    const response = await app.request("/agent/release-gates/label-budget/plan", {
      body: JSON.stringify({
        event_count: 1,
        event_window_days: 11,
        high_cost_tool_name: "run_event_study",
        security_query: "00700.HK",
        subscription_id: "subscription_release_gate",
        user_id: "user_internal_alpha",
        workspace_id: "workspace_research"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-label-budget-gate-route"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentLabelBudgetReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      actual_tool_execution: false,
      capability: {
        route: "POST /agent/release-gates/label-budget/plan",
        status: "agent_label_budget_release_gate_scaffold"
      },
      frontend_rendering: false,
      live_queue_writes: false,
      live_tool_execution: false,
      model_calls: false,
      release_gate: {
        gate_status: "blocked_live_label_budget_validation",
        no_live_release_claim: true,
        required_signoffs: ["product", "agent", "analytics", "billing"]
      },
      version: "2026-06-21.phase3.agent-label-budget-release-gate-scaffold.v0"
    });
    expect(body.data.claim_label_gate.required_claim_labels).toEqual([
      "fact",
      "calculation",
      "inference",
      "unknown"
    ]);
    expect(body.data.claim_label_gate.sample_claim_controls).toEqual([
      { effective: true, label: "fact", required_binding: "evidence_card" },
      { effective: true, label: "calculation", required_binding: "calculation_ref" },
      { effective: true, label: "inference", required_binding: "evidence_strength" },
      { effective: true, label: "unknown", required_binding: "missing_reason" }
    ]);
    expect(body.data.claim_label_gate.evidence_strength.confidence_score_display).toBe(false);
    expect(body.data.claim_label_gate.validation_rules).toContain("require_layer_label_per_claim");
    expect(body.data.high_cost_budget_gate).toMatchObject({
      confirmed_plan: {
        enqueue_plan: {
          status: "would_enqueue"
        },
        scheduling_decision: {
          concurrency_pool: "analytics_high_cost",
          independent_pool_required: true
        },
        status: "queued_planned"
      },
      confirmation_required_before_enqueue: true,
      failure_refund_required: true,
      pre_debit_required: true,
      reservation_after_confirmation: {
        pre_debit: {
          status: "planned_no_write"
        },
        status: "planned_no_write",
        user_confirmed: true
      },
      reservation_before_confirmation: {
        pre_debit: {
          status: "awaiting_confirmation"
        },
        status: "confirmation_required",
        user_confirmed: false
      },
      unconfirmed_plan: {
        enqueue_plan: {
          status: "awaiting_confirmation"
        },
        status: "confirmation_required",
        usage_policy: {
          requires_confirmation_before_enqueue: true
        }
      },
      usage_ledger_link_required: true
    });
    expect(body.data.high_cost_budget_gate.unconfirmed_plan.cost_estimate.credit_weight).toBe(28);
    expect(body.data.release_checks.map((check) => check.check)).toEqual([
      "fact_label_requires_evidence_card",
      "inference_label_requires_evidence_strength",
      "unknown_label_requires_missing_reason",
      "high_cost_task_requires_budget_estimate",
      "high_cost_task_requires_confirmation_before_enqueue",
      "high_cost_usage_reservation_pre_debit_and_refund"
    ]);
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.validation).toMatchObject({
      budget_estimate_present: true,
      fact_label_requires_evidence_card: true,
      high_cost_requires_confirmation: true,
      high_cost_routes_to_independent_pool: true,
      inference_label_requires_evidence_strength: true,
      no_confidence_score_display: true,
      no_frontend_rendering: true,
      no_live_execution: true,
      pre_debit_planned_after_confirmation: true,
      unknown_label_requires_missing_reason: true,
      user_confirmation_blocks_enqueue_until_present: true
    });
    expect(body.usage.rows).toBe(6);
  });

  it("plans task replay mode release gate without live workflow or replay execution", async () => {
    const response = await app.request("/agent/release-gates/task-replay-mode/plan", {
      body: JSON.stringify({
        locale: "zh-Hant",
        prompt: "用新手和专业模式解释 00700.HK 的收入、自由现金流和 ROE",
        security_query: "00700.HK",
        user_id: "user_internal_alpha",
        workflow_kind: "deep_report",
        workspace_id: "workspace_research"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-task-replay-mode-gate-route"
      },
      method: "POST"
    });
    const body = (await response.json()) as TaskReplayModeReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      actual_tool_execution: false,
      capability: {
        route: "POST /agent/release-gates/task-replay-mode/plan",
        status: "task_replay_mode_release_gate_scaffold"
      },
      frontend_rendering: false,
      live_db_writes: false,
      live_queue_writes: false,
      live_tool_execution: false,
      live_workflow_execution: false,
      model_calls: false,
      release_gate: {
        gate_status: "blocked_live_task_replay_mode_validation",
        no_live_release_claim: true,
        required_signoffs: ["product", "agent", "research", "operations"]
      },
      status: "planned_no_write",
      version: "2026-06-21.phase3.task-replay-mode-release-gate-scaffold.v0"
    });
    expect(body.data.workflow_resume_gate).toMatchObject({
      checkpoint_state_table: "aiphabee_core.workflow_task_checkpoint",
      disconnect_safe: true,
      resume: {
        resume_route: "GET /agent/workflows/tasks/:task_id",
        resumable: true
      },
      task_id_visible: true,
      workflow: {
        binding: "AIPHABEE_RESEARCH_WORKFLOW",
        start_status: "not_started"
      }
    });
    expect(body.data.workflow_resume_gate.task_id).toContain(
      "workflow_task_req_task_replay_mode_gate_route_workflow_resume_deep_report"
    );
    expect(body.data.workflow_resume_gate.resume.resume_handle).toContain(
      body.data.workflow_resume_gate.task_id
    );
    expect(body.data.saved_report_replay_gate).toMatchObject({
      old_report: {
        immutable_report_snapshot: true,
        mutation_allowed: false,
        silent_rewrite_allowed: false
      },
      replay_diff: {
        changed: true,
        data_changed: true
      },
      replay_execution: {
        execution_status: "planned_no_write",
        live_model_call: false,
        live_tool_execution: false
      },
      save_replay_seed: {
        deterministic_replay_ready: true,
        replay_route: "POST /research/runs/replay/plan"
      }
    });
    expect(body.data.saved_report_replay_gate.old_report.preserved_snapshot_id).toBe(
      body.data.saved_report_replay_gate.saved_snapshot_id
    );
    expect(body.data.saved_report_replay_gate.save_replay_seed.snapshot_id).toBe(
      body.data.saved_report_replay_gate.saved_snapshot_id
    );
    expect(body.data.saved_report_replay_gate.replay_snapshot_id).not.toBe(
      body.data.saved_report_replay_gate.saved_snapshot_id
    );
    expect(body.data.mode_invariant_gate.changed_surface).toMatchObject({
      newbie_response_depth: "newbie",
      professional_response_depth: "professional"
    });
    expect(body.data.mode_invariant_gate.localized_response_capability).toMatchObject({
      response_depth_changes_data: false
    });
    expect(body.data.mode_invariant_gate.shared_contract).toEqual({
      newbie_depth_invariant: true,
      professional_depth_invariant: true,
      response_depth_changes_data: false,
      same_evidence_contract: true,
      same_numeric_source_policy: true,
      same_tool_policy: true
    });
    expect(body.data.release_checks.map((check) => check.check)).toEqual([
      "long_task_returns_task_id_and_resume_handle",
      "long_task_checkpoint_state_is_disconnect_safe",
      "saved_report_has_deterministic_replay_seed",
      "replay_preserves_old_report_snapshot",
      "newbie_professional_depth_preserves_data_contract",
      "mode_switch_changes_presentation_only"
    ]);
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.validation).toMatchObject({
      checkpoint_state_is_disconnect_safe: true,
      long_task_returns_task_id_and_resume_handle: true,
      mode_switch_changes_presentation_only: true,
      newbie_professional_depth_preserves_data_contract: true,
      no_frontend_rendering: true,
      no_live_execution: true,
      replay_preserves_old_report_snapshot: true,
      saved_report_has_deterministic_replay_seed: true
    });
    expect(body.usage.rows).toBe(6);
  });

  it("plans model/tool kill switch safe degradation without live flags", async () => {
    const response = await app.request("/agent/kill-switch/plan", {
      body: JSON.stringify({
        kill_switch_reason: "provider incident",
        model_kill_switch: true,
        tool_kill_switch: true
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-agent-kill-switch-route"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentKillSwitchPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      actual_tool_execution: false,
      capability: {
        live_flag_reads: false,
        model_kill_switch_ready: true,
        route: "POST /agent/kill-switch/plan",
        safe_degradation_ready: true,
        status: "kill_switch_scaffold",
        tool_kill_switch_ready: true
      },
      decision: {
        degraded: true,
        degradation_mode: "no_model_no_tools",
        model_calls_allowed: false,
        model_request_blocked: true,
        safe_degradation_required: true,
        tool_execution_allowed: false,
        tool_execution_blocked: true
      },
      frontend: false,
      live_flag_reads: false,
      model_calls: false,
      persistent_writes: false,
      reason: "provider incident",
      route: "POST /agent/kill-switch/plan",
      safe_degradation: {
        deterministic_calculation_allowed: true,
        evidence_required_for_reused_outputs: true,
        partial_answer_allowed: true,
        unknown_label_required: true,
        user_visible_state: true
      },
      status: "planned_no_live_kill_switch",
      switch_state: {
        model_kill_switch: true,
        target: "all",
        tool_kill_switch: true
      }
    });
    expect(body.data.version).toBe("2026-06-21.phase2.kill-switch-scaffold.v0");
    expect(body.usage.rows).toBe(1);
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
    expect(body.data.tool_count).toBe(REGISTERED_TOOL_COUNT);
    expect(body.data.schema_ready).toBe(true);
    expect(body.data.rights_aware).toBe(true);
    expect(body.data.standard_response_envelope).toBe(true);
    expect(body.data.execution_ready).toBe(false);
    expect(body.data.handler_ready_tool_count).toBe(REGISTERED_TOOL_COUNT);
    expect(body.data.allow_arbitrary_sql).toBe(false);
    expect(body.data.allow_arbitrary_url).toBe(false);
    expect(body.data.versioning_ready).toBe(true);
    expect(body.data.deprecation_policy_ready).toBe(true);
    expect(body.data.breaking_changes_require_new_major).toBe(true);
    expect(body.data.tools.find((tool) => tool.name === "resolve_security")).toMatchObject({
      execution: {
        handlerReady: true,
        liveDataAccess: false
      },
      lifecycle: {
        breakingChangesRequireNewMajor: true,
        deprecation: {
          minimumNoticeDays: 90,
          status: "active"
        },
        majorVersion: 1,
        publicVersion: "resolve_security@1"
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
      body.data.tools.find((tool) => tool.name === "get_event_timeline")
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
    expect(
      body.data.tools.every(
        (tool) =>
          tool.lifecycle.publicVersion === `${tool.name}@1` &&
          tool.lifecycle.deprecation.minimumNoticeDays === 90
      )
    ).toBe(true);
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

  it("returns point-in-time security history without latest classification fallback", async () => {
    const response = await app.request("/tools/get-security-history", {
      body: JSON.stringify({
        as_of: "2017-01-01",
        instrument_id: "eq_hk_00700"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-security-history"
      },
      method: "POST"
    });
    const body = (await response.json()) as SecurityHistoryBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.toolName).toBe("get_security_history");
    expect(body.data.status).toBe("found");
    expect(body.data.liveDataAccess).toBe(false);
    expect(body.data.history.activeName).toMatchObject({
      name: {
        en: "Tencent Holdings Ltd."
      },
      validFrom: "2016-01-02"
    });
    expect(body.data.history.activeIndustry).toMatchObject({
      industry: "Internet Software & Services",
      sector: "Information Technology",
      validTo: "2018-09-27"
    });
    expect(
      body.data.history.activeConstituentMemberships.map((item) => item.benchmarkSymbol)
    ).toEqual(["HSI"]);
    expect(body.data.history.pointInTimePolicy).toMatchObject({
      asOfRequired: true,
      usesLatestClassification: false,
      usesLatestConstituents: false,
      usesLatestName: false
    });
    expect(body.data.capability).toMatchObject({
      as_of_required: true,
      handler_ready: true,
      live_data_access: false,
      status: "security_history_scaffold"
    });
    expect(body.usage.rows).toBe(3);
  });

  it("returns historical constituent memberships and point-in-time input errors", async () => {
    const afterTechIndex = await app.request("/tools/get-security-history", {
      body: JSON.stringify({
        asOf: "2021-01-01",
        instrumentId: "eq_hk_00700"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-security-history-hstech"
      },
      method: "POST"
    });
    const missingAsOf = await app.request("/tools/get-security-history", {
      body: JSON.stringify({
        instrument_id: "eq_hk_00700"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-security-history-missing-as-of"
      },
      method: "POST"
    });
    const unknown = await app.request("/tools/get-security-history", {
      body: JSON.stringify({
        as_of: "2021-01-01",
        instrument_id: "eq_hk_missing"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-security-history-not-found"
      },
      method: "POST"
    });
    const afterTechIndexBody = (await afterTechIndex.json()) as SecurityHistoryBody;
    const missingAsOfBody = (await missingAsOf.json()) as ErrorBody;
    const unknownBody = (await unknown.json()) as ErrorBody;

    expect(afterTechIndex.status).toBe(200);
    expect(
      afterTechIndexBody.data.history.activeConstituentMemberships.map(
        (membership) => membership.benchmarkSymbol
      )
    ).toEqual(["HSI", "HSTECH"]);
    expect(missingAsOf.status).toBe(400);
    expect(missingAsOfBody.error.code).toBe("POINT_IN_TIME_UNAVAILABLE");
    expect(unknown.status).toBe(404);
    expect(unknownBody.error.code).toBe("NOT_FOUND");
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

  it("serves corporate action partner/public benchmark parity report", async () => {
    const response = await app.request("/data/corporate-actions/benchmark-parity", {
      headers: {
        "x-request-id": "req-corporate-action-benchmark-parity"
      }
    });
    const body = (await response.json()) as CorporateActionBenchmarkParityBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("passed");
    expect(body.data.passed).toBe(true);
    expect(body.data.sampleCount).toBe(20);
    expect(body.data.passedCount).toBe(20);
    expect(body.data.failures).toEqual([]);
    expect(body.data.sourceCounts).toEqual({
      partner_reference: 10,
      public_exchange_reference: 10
    });
    expect(body.data.livePartnerData).toBe(false);
    expect(body.data.liveServingReads).toBe(false);
    expect(body.data.sqlEmitted).toBe(false);
    expect(body.data.capability).toMatchObject({
      live_partner_data: false,
      live_serving_reads: false,
      minimum_complex_cases: 20,
      partner_reference_cases: 10,
      public_reference_cases: 10,
      sample_count: 20,
      status: "benchmark_parity_scaffold"
    });
    expect(body.usage.rows).toBe(20);
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

  it("returns event timeline rows with company, market, and related source data", async () => {
    const response = await app.request("/tools/get-event-timeline", {
      body: JSON.stringify({
        from: "2026-01-03",
        instrument_id: "eq_hk_00700",
        limit: 3,
        to: "2026-01-07"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-event-timeline"
      },
      method: "POST"
    });
    const body = (await response.json()) as EventTimelineBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.toolName).toBe("get_event_timeline");
    expect(body.data.status).toBe("found");
    expect(body.data.liveDataAccess).toBe(false);
    expect(body.data.timeline).toMatchObject({
      nextCursor: "offset:3",
      qualityState: "PASS",
      rowCount: 3,
      symbol: "00700.HK",
      totalRows: 4
    });
    expect(body.data.timeline.events.map((event) => event.eventType)).toEqual([
      "announcement",
      "market_event",
      "financial_disclosure"
    ]);
    expect(body.data.timeline.events.some((event) => event.eventScope === "market")).toBe(true);
    expect(
      body.data.timeline.events.every(
        (event) =>
          event.sourceRecordId.length > 0 &&
          event.relatedData.every((item) => item.sourceRecordId.length > 0)
      )
    ).toBe(true);
    expect(body.data.capability).toMatchObject({
      company_and_market_events: true,
      cursor_pagination: true,
      handler_ready: true,
      live_data_access: false,
      related_data_links: true,
      source_record_required: true,
      status: "get_event_timeline_scaffold",
      supported_event_types: [
        "announcement",
        "corporate_action",
        "financial_disclosure",
        "market_event"
      ]
    });
    expect(body.usage.rows).toBe(3);
    expect(body.usage.credits).toBe(9);
  });

  it("returns standard errors for event timeline licensing, quality, range, row, and input failures", async () => {
    const unlicensed = await app.request("/tools/get-event-timeline", {
      body: JSON.stringify({
        from: "2026-01-03",
        instrument_id: "eq_hk_00700",
        to: "2026-01-07",
        types: ["announcement", "rumor"]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-event-timeline-unlicensed"
      },
      method: "POST"
    });
    const qualityHold = await app.request("/tools/get-event-timeline", {
      body: JSON.stringify({
        from: "2026-01-03",
        instrument_id: "eq_hk_hold",
        to: "2026-01-07"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-event-timeline-quality"
      },
      method: "POST"
    });
    const outOfRange = await app.request("/tools/get-event-timeline", {
      body: JSON.stringify({
        from: "2026-01-02",
        instrument_id: "eq_hk_00700",
        to: "2026-01-07"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-event-timeline-range"
      },
      method: "POST"
    });
    const tooManyRows = await app.request("/tools/get-event-timeline", {
      body: JSON.stringify({
        from: "2026-01-03",
        instrument_id: "eq_hk_00700",
        limit: 6,
        to: "2026-01-07"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-event-timeline-too-many"
      },
      method: "POST"
    });
    const missing = await app.request("/tools/get-event-timeline", {
      body: JSON.stringify({
        from: "2026-01-03",
        instrument_id: "eq_hk_missing",
        to: "2026-01-07"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-event-timeline-missing"
      },
      method: "POST"
    });
    const invalid = await app.request("/tools/get-event-timeline", {
      body: JSON.stringify({
        from: "2026-01-07",
        instrument_id: "eq_hk_00700",
        to: "2026-01-03"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-event-timeline-invalid"
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
    expect(body.data.tables).toEqual(["aiphabee_core.evidence_record", "aiphabee_core.evidence_source_ref"]);
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

  it("serves research run save capabilities without live writes", async () => {
    const response = await app.request("/research/runtime", {
      headers: {
        "x-request-id": "req-research-runtime"
      }
    });
    const body = (await response.json()) as ResearchRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      immutable_report_snapshot: true,
      live_db_writes: false,
      replay_diff_ready: true,
      replay_route: "POST /research/runs/replay/plan",
      replay_seed_ready: true,
      route: "POST /research/runs/save/plan",
      runtime_route: "GET /research/runtime",
      sql_emitted: false,
      status: "research_run_save_scaffold",
      tool_name: "save_research_run"
    });
    expect(body.data.required_fields).toEqual([
      "question",
      "tool_calls",
      "evidence_records",
      "model_version",
      "prompt_version"
    ]);
    expect(body.data.supported_diffs).toEqual(["data", "model", "parameters"]);
    expect(body.data.supported_snapshots).toEqual([
      "question",
      "tool_inputs",
      "evidence_records",
      "model_version",
      "prompt_version",
      "parameters"
    ]);
    expect(body.data.tables).toEqual([
      "aiphabee_core.research_run",
      "aiphabee_core.research_run_tool_call",
      "aiphabee_core.research_run_evidence_snapshot",
      "aiphabee_core.research_run_model_snapshot"
    ]);
    expect(body.data.deep_report_workflow).toMatchObject({
      citation_validation_required: true,
      evidence_index_required: true,
      live_db_writes: false,
      live_tool_execution: false,
      live_workflow_execution: false,
      model_calls: false,
      replay_route: "POST /research/runs/replay/plan",
      route: "POST /research/reports/deep/plan",
      status: "deep_report_workflow_scaffold",
      tool_name: "plan_deep_report_workflow",
      workflow_binding: "AIPHABEE_RESEARCH_WORKFLOW"
    });
    expect(body.data.deep_report_workflow.stages).toEqual([
      "data_fetch",
      "deterministic_analysis",
      "section_generation",
      "citation_validation",
      "evidence_index",
      "rerun_seed"
    ]);
    expect(body.data.data_correction_notifications).toMatchObject({
      affected_report_marking_required: true,
      event_queue: "AIPHABEE_EVENTS_QUEUE",
      evidence_snapshot_marking_required: true,
      frontend_rendering: false,
      live_db_writes: false,
      live_tool_execution: false,
      notification_fanout: false,
      persistent_writes: false,
      route: "POST /research/data-corrections/plan",
      runtime_route: "GET /research/runtime",
      saved_report_notification_required: true,
      sql_emitted: false,
      status: "data_correction_notifications_scaffold",
      tool_name: "plan_data_correction_notifications"
    });
    expect(body.data.data_correction_notifications.supported_notification_channels).toEqual([
      "in_app",
      "email"
    ]);
    expect(body.data.data_correction_notifications.tables).toEqual([
      "aiphabee_core.data_correction_event",
      "aiphabee_core.research_run_correction_impact",
      "aiphabee_core.user_notification"
    ]);
    expect(body.data.golden_correction_rollback_drill).toMatchObject({
      correction_route: "POST /research/data-corrections/plan",
      frontend_rendering: false,
      golden_fixture_command: "npm run test:golden",
      golden_manifest_path: "tests/golden/manifest.json",
      live_db_writes: false,
      live_rollback_execution: false,
      persistent_writes: false,
      replay_route: "POST /research/runs/replay/plan",
      route: "POST /research/golden-correction-rollback-drill/plan",
      runtime_route: "GET /research/runtime",
      sql_emitted: false,
      status: "golden_correction_rollback_drill_scaffold",
      tool_golden_manifest_path: "tests/golden/tools/manifest.json"
    });
    expect(body.data.golden_correction_rollback_drill.required_steps).toEqual([
      "golden_fixture_gate",
      "correction_event_plan",
      "affected_report_mark",
      "user_notification_plan",
      "rollback_replay_plan"
    ]);
    expect(body.data.golden_correction_rollback_drill.tables).toEqual([
      "aiphabee_core.golden_correction_rollback_drill",
      "aiphabee_governance.golden_correction_rollback_drill_contract",
      "aiphabee_core.data_correction_event",
      "aiphabee_core.research_run_correction_impact"
    ]);
    expect(body.data.static_report_artifact).toMatchObject({
      artifact_writes: false,
      data_delay_required: true,
      disclaimer_required: true,
      generated_at_required: true,
      live_db_writes: false,
      required_scope: "exports.read",
      route: "POST /research/reports/static/plan",
      runtime_route: "GET /research/runtime",
      status: "static_report_metadata_scaffold",
      tool_name: "plan_static_report_artifact",
      watermark_required: true
    });
  });

  it("plans deep report workflows with linked workflow task ids", async () => {
    const response = await app.request("/research/reports/deep/plan", {
      body: JSON.stringify({
        as_of: "2026-06-21T09:30:00+08:00",
        data_delay_minutes: 15,
        model_version: "gpt-5.4-dry-run",
        notification_channels: ["email", "in_app"],
        prompt_version: "prompt.deep-report.v0",
        question: "Generate a deep report for Tencent.",
        security_query: "00700.HK",
        user_id: "user_internal_alpha",
        workspace_id: "workspace_research"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-deep-report"
      },
      method: "POST"
    });
    const body = (await response.json()) as DeepReportWorkflowPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend_rendering: false,
      live_db_writes: false,
      live_tool_execution: false,
      model_calls: false,
      sql_emitted: false,
      status: "planned_no_write",
      toolName: "plan_deep_report_workflow"
    });
    expect(body.data.capability).toMatchObject({
      citation_validation_required: true,
      evidence_index_required: true,
      route: "POST /research/reports/deep/plan",
      workflow_binding: "AIPHABEE_RESEARCH_WORKFLOW"
    });
    expect(body.data.workflow_task_id).toBe(body.data.workflow_task.task_id);
    expect(body.data.task_id).toBe(body.data.workflow_task.task_id);
    expect(response.headers.get("x-aiphabee-workflow-task-id")).toBe(
      body.data.workflow_task.task_id
    );
    expect(response.headers.get("x-aiphabee-deep-report-id")).toBe(
      body.data.report_id
    );
    expect(body.data.workflow_task).toMatchObject({
      task: {
        task_kind: "deep_report",
        status: "planned_no_write"
      },
      resume: {
        resume_route: "GET /agent/workflows/tasks/:task_id",
        resumable: true
      },
      workflow: {
        binding: "AIPHABEE_RESEARCH_WORKFLOW",
        execution_ready: false,
        start_status: "not_started"
      }
    });
    expect(body.data.workflow_task.notification).toMatchObject({
      completion_notification: "planned_no_write",
      failure_notification: "planned_no_write",
      required: true
    });
    expect(body.data.workflow).toEqual({
      binding: "AIPHABEE_RESEARCH_WORKFLOW",
      checkpoint_writes: false,
      execution_status: "planned_no_write",
      live_execution: false,
      provider: "cloudflare_workflows",
      queue_writes: false,
      task_id: body.data.workflow_task.task_id
    });
    expect(body.data.stages.map((stage) => stage.stage_id)).toEqual([
      "data_fetch",
      "deterministic_analysis",
      "section_generation",
      "citation_validation",
      "evidence_index",
      "rerun_seed"
    ]);
    expect(body.data.stages.every((stage) => stage.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.stages.every((stage) => stage.live_tool_execution === false)).toBe(
      true
    );
    expect(body.data.stages.every((stage) => stage.model_calls === false)).toBe(true);
    expect(body.data.data_fetch_plan).toMatchObject({
      live_tool_execution: false,
      registered_tools_only: true,
      status: "planned_no_write"
    });
    expect(body.data.data_fetch_plan.required_tools).toContain("search_announcements");
    expect(body.data.deterministic_analysis_plan).toEqual({
      deterministic_calculations: true,
      model_calls: false,
      output_contract: ["facts", "calculations", "inferences", "unknowns"],
      status: "planned_no_write"
    });
    expect(body.data.section_plan).toMatchObject({
      generation_status: "planned_no_model",
      model_calls: false
    });
    expect(body.data.citation_validation).toEqual({
      every_claim_requires_evidence: true,
      required: true,
      status: "planned_no_write",
      unsupported_claim_label: "unknown"
    });
    expect(body.data.evidence_index.table).toBe("aiphabee_core.deep_report_evidence_index");
    expect(body.data.evidence_index.records).toHaveLength(
      body.data.section_plan.sections.length
    );
    expect(body.data.report_snapshot).toMatchObject({
      data_delay_minutes: 15,
      immutable_report_snapshot: true,
      static_report_allowed: true,
      table: "aiphabee_core.deep_report_snapshot"
    });
    expect(body.data.report_snapshot.disclaimer).toContain("not investment advice");
    expect(body.data.rerun).toEqual({
      data_model_parameter_diff_ready: true,
      deterministic_replay_ready: true,
      old_report_mutation_allowed: false,
      replay_route: "POST /research/runs/replay/plan",
      saved_snapshot_id: body.data.report_snapshot.snapshot_id,
      silent_rewrite_allowed: false
    });
    expect(body.data.persistence_plan).toEqual({
      checkpoint_writes: false,
      live_db_writes: false,
      r2_writes: false,
      sql_emitted: false,
      tables: [
        "aiphabee_core.deep_report_snapshot",
        "aiphabee_core.deep_report_evidence_index",
        "aiphabee_core.workflow_task",
        "aiphabee_core.workflow_task_checkpoint"
      ],
      write_status: "planned_no_write"
    });
    expect(body.data.usage_estimate).toEqual({
      debit_status: "not_debited",
      estimated_credits: 20,
      failure_refund_ready: true,
      high_cost_confirmation_required: true
    });
    expect(body.usage.credits).toBe(20);
    expect(body.usage.rows).toBeGreaterThan(0);
  });

  it("plans allowed-scope static reports with required metadata", async () => {
    const response = await app.request("/research/reports/static/plan", {
      body: JSON.stringify({
        as_of: "2026-06-21T09:30:00+08:00",
        data_delay_minutes: 15,
        data_version: "static-report-data-v0",
        format: "pdf",
        generated_at: "2026-06-21T10:00:00+08:00",
        methodology_version: "static-report-method-v0",
        report_id: "report_00700_static",
        rights_policy_version: "rights-static-report-v0",
        scopes: ["exports.read"],
        sections: ["summary", "disclaimer"],
        source_run_id: "research_run_00700",
        title: "Tencent static report",
        workspace_id: "workspace_research"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-static-report"
      },
      method: "POST"
    });
    const body = (await response.json()) as StaticReportPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend_rendering: false,
      live_db_writes: false,
      live_tool_execution: false,
      model_calls: false,
      request_id: "req-static-report",
      sql_emitted: false,
      status: "planned_no_write",
      toolName: "plan_static_report_artifact"
    });
    expect(body.data.metadata).toMatchObject({
      data_delay_minutes: 15,
      data_version: "static-report-data-v0",
      generated_at: "2026-06-21T10:00:00+08:00",
      methodology_version: "static-report-method-v0",
      rights_policy_version: "rights-static-report-v0"
    });
    expect(body.data.metadata.disclaimer).toContain("not investment advice");
    expect(body.data.report).toMatchObject({
      format: "pdf",
      report_id: "report_00700_static",
      source_run_id: "research_run_00700",
      static_report_allowed: true,
      table: "aiphabee_core.static_report_artifact"
    });
    expect(body.data.artifact).toMatchObject({
      pdf: "planned_no_write",
      public_url: "not_generated",
      r2_write: false,
      written: false
    });
    expect(body.data.rights_boundary).toMatchObject({
      allowed_scope_only: true,
      raw_partner_data_embedded: false,
      redistribution_requires_rights_policy: true,
      required_scope: "exports.read",
      scope_granted: true
    });
    expect(body.data.persistence_plan).toMatchObject({
      artifact_writes: false,
      live_db_writes: false,
      r2_writes: false,
      sql_emitted: false,
      write_status: "planned_no_write"
    });
    expect(body.data.watermark.text).toContain("data_delay_minutes=15");
    expect(body.data.capability.status).toBe("static_report_metadata_scaffold");
    expect(body.usage.rows).toBeGreaterThan(0);
  });

  it("blocks static report planning when allowed-scope evidence is missing", async () => {
    const response = await app.request("/research/reports/static/plan", {
      body: JSON.stringify({
        data_delay_minutes: 15,
        scopes: [],
        source_run_id: "research_run_00700",
        workspace_id: "workspace_research"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-static-report-blocked"
      },
      method: "POST"
    });
    const body = (await response.json()) as StaticReportPlanBody;

    expect(response.status).toBe(200);
    expect(body.data.status).toBe("blocked_unlicensed_scope");
    expect(body.data.report.static_report_allowed).toBe(false);
    expect(body.data.rights_boundary.scope_granted).toBe(false);
    expect(body.data.persistence_plan.write_status).toBe("blocked");
    expect(body.usage.rows).toBe(0);
  });

  it("plans complete research run snapshots for replay without writes", async () => {
    const response = await app.request("/research/runs/save/plan", {
      body: JSON.stringify({
        answer_hash: "answer_hash_00700_revenue",
        evidence_records: [
          {
            citation_label: "Tencent FY2024 annual results financial highlights",
            data_version:
              "2026-06-21.phase2.announcement-diff-extraction-scaffold.v0",
            document_location: {
              anchor: "financial-highlights",
              document_id: "doc_ann_00700_20250320_results",
              page: 4,
              paragraph: 2,
              source_record_id: "src_announcement_00700_20250320_results"
            },
            evidence_record_id: "evidence_doc_diff_00700_fy2024",
            methodology_version:
              "2026-06-21.phase2.announcement-diff-extraction-scaffold.v0",
            source_record_ids: ["src_announcement_00700_20250320_results"]
          }
        ],
        model_provider: "cloudflare_ai_gateway",
        model_version: "gpt-5.4-dry-run",
        parameters: {
          comparison_periods: 2,
          currency: "HKD"
        },
        prompt_template_id: "research-summary-v0",
        prompt_version: "prompt.research-summary.v0",
        question:
          "Compare Tencent annual revenue and operating profit across periods.",
        run_id: "run_00700_research",
        tool_calls: [
          {
            data_version:
              "2026-06-21.phase2.announcement-diff-extraction-scaffold.v0",
            input: {
              base_document_id: "doc_ann_00700_20240320_results",
              comparison_document_id: "doc_ann_00700_20250320_results"
            },
            input_schema_id: "tool.diff_announcements.input.v0",
            methodology_version:
              "2026-06-21.phase2.announcement-diff-extraction-scaffold.v0",
            output_schema_id: "tool.diff_announcements.output.v0",
            request_id: "req-diff-announcements",
            tool_call_id: "tool_call_diff_announcements_1",
            tool_name: "diff_announcements",
            tool_version:
              "2026-06-21.phase2.announcement-diff-extraction-scaffold.v0"
          }
        ],
        user_id: "user_internal_alpha",
        workspace_id: "workspace_research"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-research-save"
      },
      method: "POST"
    });
    const body = (await response.json()) as ResearchRunSavePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      answer_snapshot: {
        answer_hash: "answer_hash_00700_revenue",
        output_hash_recorded: true
      },
      immutable_report_snapshot: true,
      live_db_writes: false,
      model_snapshot: {
        model_provider: "cloudflare_ai_gateway",
        model_version: "gpt-5.4-dry-run",
        prompt_template_id: "research-summary-v0",
        prompt_version: "prompt.research-summary.v0"
      },
      research_run_id: "run_00700_research",
      sql_emitted: false,
      status: "planned_no_write",
      toolName: "save_research_run"
    });
    expect(body.data.capability).toMatchObject({
      immutable_report_snapshot: true,
      live_db_writes: false,
      replay_diff_ready: true,
      replay_route: "POST /research/runs/replay/plan",
      replay_seed_ready: true,
      route: "POST /research/runs/save/plan",
      status: "research_run_save_scaffold",
      tool_name: "save_research_run"
    });
    expect(body.data.parameter_snapshot).toMatchObject({
      parameters: {
        comparison_periods: 2,
        currency: "HKD"
      },
      parameters_recorded: true
    });
    expect(body.data.parameter_snapshot.parameter_hash).toMatch(/^[a-f0-9]{8}$/u);
    expect(body.data.schema_validation).toEqual({
      errors: [],
      required_fields: [
        "question",
        "tool_calls",
        "evidence_records",
        "model_version",
        "prompt_version"
      ],
      valid: true
    });
    expect(body.data.persistence_plan).toMatchObject({
      old_report_mutation_allowed: false,
      sql_emitted: false,
      write_status: "planned_no_write"
    });
    expect(body.data.tool_input_snapshot).toMatchObject({
      tool_call_count: 1,
      tool_calls: [
        {
          input_schema_id: "tool.diff_announcements.input.v0",
          request_id: "req-diff-announcements",
          tool_name: "diff_announcements"
        }
      ]
    });
    expect(body.data.tool_input_snapshot.tool_calls[0]?.input_hash).toMatch(
      /^[a-f0-9]{8}$/u
    );
    expect(body.data.evidence_snapshot).toMatchObject({
      evidence_record_count: 1,
      records: [
        {
          document_location: {
            document_id: "doc_ann_00700_20250320_results",
            page: 4,
            paragraph: 2,
            source_record_id: "src_announcement_00700_20250320_results"
          },
          evidence_record_id: "evidence_doc_diff_00700_fy2024",
          source_record_ids: ["src_announcement_00700_20250320_results"]
        }
      ]
    });
    expect(body.data.snapshot_id).toBe(
      `research_snapshot_${body.data.evidence_snapshot.snapshot_hash}`
    );
    expect(body.data.replay_seed).toEqual({
      deterministic_replay_ready: true,
      replay_route: "POST /research/runs/replay/plan",
      replay_status: "planned",
      snapshot_id: body.data.snapshot_id
    });
    expect(body.data.question_snapshot.question_hash).toMatch(/^[a-f0-9]{8}$/u);
    expect(body.data.user).toEqual({
      source: "request",
      user_id: "user_internal_alpha"
    });
    expect(body.data.workspace).toEqual({
      source: "request",
      workspace_id: "workspace_research"
    });
    expect(body.usage.rows).toBe(3);
  });

  it("plans saved research run replay diffs without mutating old reports", async () => {
    const saveResponse = await app.request("/research/runs/save/plan", {
      body: JSON.stringify({
        evidence_records: [
          {
            data_version: "data-v0",
            evidence_record_id: "evidence_00700_old",
            methodology_version: "method-v0",
            source_record_ids: ["src_00700_old"]
          }
        ],
        model_provider: "cloudflare_ai_gateway",
        model_version: "gpt-5.4-dry-run",
        parameters: {
          currency: "HKD",
          period_count: 2
        },
        prompt_template_id: "research-summary-v0",
        prompt_version: "prompt.research-summary.v0",
        question: "Compare Tencent annual revenue across periods.",
        run_id: "run_00700_research",
        tool_calls: [
          {
            data_version: "data-v0",
            input: {
              document_id: "doc_ann_00700_20240320_results"
            },
            methodology_version: "method-v0",
            request_id: "req-tool-old",
            tool_call_id: "tool_call_diff_announcements_1",
            tool_name: "diff_announcements",
            tool_version: "tool-v0"
          }
        ],
        workspace_id: "workspace_research"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-research-save-for-replay"
      },
      method: "POST"
    });
    const saved = (await saveResponse.json()) as ResearchRunSavePlanBody;

    const replayResponse = await app.request("/research/runs/replay/plan", {
      body: JSON.stringify({
        current_run: {
          evidence_records: [
            {
              data_version: "data-v1",
              evidence_record_id: "evidence_00700_new",
              methodology_version: "method-v1",
              source_record_ids: ["src_00700_new"]
            }
          ],
          model_provider: "cloudflare_ai_gateway",
          model_version: "gpt-5.5-dry-run",
          parameters: {
            currency: "USD",
            include_segments: true,
            period_count: 2
          },
          prompt_template_id: "research-summary-v0",
          prompt_version: "prompt.research-summary.v1",
          question: "Compare Tencent annual revenue across periods.",
          tool_calls: [
            {
              data_version: "data-v1",
              input: {
                document_id: "doc_ann_00700_20250320_results"
              },
              methodology_version: "method-v1",
              request_id: "req-tool-new",
              tool_call_id: "tool_call_diff_announcements_1",
              tool_name: "diff_announcements",
              tool_version: "tool-v1"
            }
          ],
          workspace_id: "workspace_research"
        },
        replay_reason: "new annual results filing",
        saved_run: saved.data
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-research-replay"
      },
      method: "POST"
    });
    const body = (await replayResponse.json()) as ResearchRunReplayPlanBody;

    expect(saveResponse.status).toBe(200);
    expect(replayResponse.status).toBe(200);
    expect(replayResponse.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      old_report: {
        immutable_report_snapshot: true,
        mutation_allowed: false,
        preserved_snapshot_id: saved.data.snapshot_id,
        silent_rewrite_allowed: false
      },
      replay_execution: {
        execution_status: "planned_no_write",
        live_model_call: false,
        live_tool_execution: false,
        sql_emitted: false
      },
      replay_reason: "new annual results filing",
      route: "POST /research/runs/replay/plan",
      saved_snapshot_id: saved.data.snapshot_id,
      sql_emitted: false,
      status: "planned_no_write",
      toolName: "replay_research_run"
    });
    expect(body.data.capability).toMatchObject({
      live_db_writes: false,
      replay_diff_ready: true,
      replay_route: "POST /research/runs/replay/plan",
      replay_tool_name: "replay_research_run"
    });
    expect(body.data.diff_summary).toEqual({
      categories: ["data", "model", "parameters"],
      changed: true,
      data_changed: true,
      model_changed: true,
      parameters_changed: true
    });
    expect(body.data.diffs.data).toMatchObject({
      changed: true,
      changed_source_record_ids: ["src_00700_new", "src_00700_old"],
      current_source_record_ids: ["src_00700_new"],
      data_version_changed: true,
      previous_source_record_ids: ["src_00700_old"]
    });
    expect(body.data.diffs.model).toMatchObject({
      changed: true,
      current_model_version: "gpt-5.5-dry-run",
      current_prompt_version: "prompt.research-summary.v1",
      model_version_changed: true,
      previous_model_version: "gpt-5.4-dry-run",
      prompt_version_changed: true
    });
    expect(body.data.diffs.parameters).toMatchObject({
      added_keys: ["include_segments"],
      changed: true,
      changed_keys: ["currency"],
      question_changed: false,
      removed_keys: [],
      tool_input_changed: true
    });
    expect(body.data.replay_snapshot_id).toBe(
      body.data.current_run_plan.snapshot_id
    );
    expect(body.data.current_run_plan.parameter_snapshot.parameters).toEqual({
      currency: "USD",
      include_segments: true,
      period_count: 2
    });
  });

  it("plans data correction marks and user notifications for affected saved reports", async () => {
    const saveResponse = await app.request("/research/runs/save/plan", {
      body: JSON.stringify({
        evidence_records: [
          {
            data_version: "data-v0",
            evidence_record_id: "evidence_00700_old",
            methodology_version: "method-v0",
            source_record_ids: ["src_00700_old", "src_00700_unchanged"]
          }
        ],
        model_provider: "cloudflare_ai_gateway",
        model_version: "gpt-5.4-dry-run",
        prompt_version: "prompt.research-summary.v0",
        question: "Compare Tencent annual revenue across periods.",
        run_id: "run_00700_research",
        tool_calls: [
          {
            data_version: "data-v0",
            input: {
              document_id: "doc_ann_00700_20240320_results"
            },
            methodology_version: "method-v0",
            request_id: "req-tool-old",
            tool_call_id: "tool_call_diff_announcements_1",
            tool_name: "diff_announcements",
            tool_version: "tool-v0"
          }
        ],
        user_id: "user_internal_alpha",
        workspace_id: "workspace_research"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-research-save-for-correction"
      },
      method: "POST"
    });
    const saved = (await saveResponse.json()) as ResearchRunSavePlanBody;

    const response = await app.request("/research/data-corrections/plan", {
      body: JSON.stringify({
        affected_runs: [saved.data],
        as_of: "2026-06-21T10:15:00+08:00",
        corrections: [
          {
            corrected_data_version: "data-v1",
            correction_event_id: "correction_src_00700_old_v1",
            previous_data_version: "data-v0",
            reason: "partner_restatement",
            severity: "high",
            source_record_id: "src_00700_old"
          }
        ],
        notification_channels: ["in_app", "email"]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-data-correction-notify"
      },
      method: "POST"
    });
    const body = (await response.json()) as DataCorrectionNotificationPlanBody;

    expect(saveResponse.status).toBe(200);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend_rendering: false,
      live_db_writes: false,
      live_tool_execution: false,
      notification_fanout: false,
      sql_emitted: false,
      status: "planned_no_write",
      toolName: "plan_data_correction_notifications"
    });
    expect(body.data.capability).toMatchObject({
      affected_report_marking_required: true,
      route: "POST /research/data-corrections/plan",
      saved_report_notification_required: true,
      status: "data_correction_notifications_scaffold"
    });
    expect(body.data.corrections).toEqual([
      {
        corrected_data_version: "data-v1",
        correction_event_id: "correction_src_00700_old_v1",
        previous_data_version: "data-v0",
        reason: "partner_restatement",
        severity: "high",
        source_record_id: "src_00700_old",
        table: "aiphabee_core.data_correction_event",
        write_status: "planned_no_write"
      }
    ]);
    expect(body.data.affected_reports).toMatchObject({
      count: 1,
      marking_status: "planned_no_write"
    });
    expect(body.data.affected_reports.items[0]).toMatchObject({
      evidence_record_ids: ["evidence_00700_old"],
      impacted_source_record_ids: ["src_00700_old"],
      notification_required: true,
      research_run_id: "run_00700_research",
      snapshot_id: saved.data.snapshot_id,
      table: "aiphabee_core.research_run_correction_impact",
      user_id: "user_internal_alpha",
      workspace_id: "workspace_research",
      write_status: "planned_no_write"
    });
    expect(body.data.notification_plan).toMatchObject({
      channels: ["in_app", "email"],
      event_queue: "AIPHABEE_EVENTS_QUEUE",
      fanout_status: "planned_no_write",
      notification_required: true,
      table: "aiphabee_core.user_notification",
      user_notification_count: 2
    });
    expect(body.data.notification_plan.notifications.map((item) => item.channel)).toEqual([
      "in_app",
      "email"
    ]);
    expect(body.data.persistence_plan).toEqual({
      live_db_writes: false,
      queue_writes: false,
      sql_emitted: false,
      tables: [
        "aiphabee_core.data_correction_event",
        "aiphabee_core.research_run_correction_impact",
        "aiphabee_core.user_notification"
      ],
      write_status: "planned_no_write"
    });
    expect(body.data.replay).toEqual({
      old_report_mutation_allowed: false,
      replay_route: "POST /research/runs/replay/plan",
      rerun_recommended: true,
      silent_rewrite_allowed: false
    });
    expect(body.data.validation).toEqual({
      affected_reports_present: true,
      corrections_present: true,
      required_context_present: true
    });
    expect(body.usage.rows).toBe(4);
  });

  it("plans a golden correction rollback drill without live writes", async () => {
    const response = await app.request("/research/golden-correction-rollback-drill/plan", {
      body: JSON.stringify({
        as_of: "2026-06-21T11:00:00+08:00",
        golden_manifest_version: "golden-fixtures-version=2026-06-20.phase0.v0",
        golden_sample_count: 8,
        notification_channels: ["in_app", "email"],
        quality_rule_count: 12,
        tool_golden_sample_count: 16
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-golden-correction-rollback-drill"
      },
      method: "POST"
    });
    const body = (await response.json()) as GoldenCorrectionRollbackDrillPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend_rendering: false,
      live_db_writes: false,
      live_rollback_execution: false,
      request_id: "req-golden-correction-rollback-drill",
      sql_emitted: false,
      status: "planned_no_write",
      toolName: "plan_golden_correction_rollback_drill"
    });
    expect(body.data.capability).toMatchObject({
      correction_route: "POST /research/data-corrections/plan",
      golden_fixture_command: "npm run test:golden",
      live_rollback_execution: false,
      replay_route: "POST /research/runs/replay/plan",
      route: "POST /research/golden-correction-rollback-drill/plan",
      status: "golden_correction_rollback_drill_scaffold"
    });
    expect(body.data.golden_fixture_gate).toMatchObject({
      command: "npm run test:golden",
      manifest_path: "tests/golden/manifest.json",
      passed: true,
      production_partner_corpus_loaded: false,
      quality_rule_count: 12,
      sample_count: 8,
      status: "synthetic_fixture_gate_passed",
      tool_golden_manifest_path: "tests/golden/tools/manifest.json",
      tool_sample_count: 16
    });
    expect(body.data.drill_steps.map((step) => step.step_id)).toEqual([
      "golden_fixture_gate",
      "correction_event_plan",
      "affected_report_mark",
      "user_notification_plan",
      "rollback_replay_plan"
    ]);
    expect(body.data.correction_notification_plan).toMatchObject({
      notification_fanout: false,
      status: "planned_no_write",
      validation: {
        affected_reports_present: true,
        corrections_present: true,
        required_context_present: true
      }
    });
    expect(body.data.correction_notification_plan.affected_reports.count).toBe(1);
    expect(body.data.correction_notification_plan.notification_plan.channels).toEqual([
      "in_app",
      "email"
    ]);
    expect(body.data.rollback_replay_plan).toMatchObject({
      diff_summary: {
        changed: true,
        data_changed: true
      },
      old_report: {
        immutable_report_snapshot: true,
        mutation_allowed: false,
        silent_rewrite_allowed: false
      },
      replay_execution: {
        execution_status: "planned_no_write",
        live_model_call: false,
        live_tool_execution: false,
        sql_emitted: false
      },
      status: "planned_no_write"
    });
    expect(body.data.persistence_plan).toEqual({
      live_db_writes: false,
      queue_writes: false,
      sql_emitted: false,
      tables: [
        "aiphabee_core.golden_correction_rollback_drill",
        "aiphabee_governance.golden_correction_rollback_drill_contract",
        "aiphabee_core.data_correction_event",
        "aiphabee_core.research_run_correction_impact"
      ],
      write_status: "planned_no_write"
    });
    expect(body.data.validation).toEqual({
      correction_plan_ready: true,
      golden_fixture_gate_passed: true,
      old_report_immutable: true,
      required_context_present: true,
      rollback_replay_ready: true
    });
    expect(body.usage.rows).toBeGreaterThan(0);
  });

  it("rejects incomplete research run replay plans with standard errors", async () => {
    const response = await app.request("/research/runs/replay/plan", {
      body: JSON.stringify({
        current_run: {
          model_version: "gpt-5.5-dry-run",
          prompt_version: "prompt.research-summary.v1",
          question: "Compare Tencent"
        }
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-research-replay-invalid"
      },
      method: "POST"
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("SCOPE_DENIED");
  });

  it("rejects incomplete research run save plans with standard errors", async () => {
    const response = await app.request("/research/runs/save/plan", {
      body: JSON.stringify({
        evidence_records: [],
        model_version: "gpt-5.4-dry-run",
        prompt_version: "prompt.research-summary.v0",
        question: "Compare Tencent",
        tool_calls: []
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-research-save-invalid"
      },
      method: "POST"
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("SCOPE_DENIED");
  });

  it("serves MCP runtime capabilities with default-deny rights gate", async () => {
    const response = await app.request("/mcp/runtime", {
      headers: {
        "x-request-id": "req-mcp-runtime"
      }
    });
    const body = (await response.json()) as McpRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      api_key_create_route: "POST /mcp/api-keys/create/plan",
      api_key_hash_storage_ready: true,
      api_key_ip_allowlist_ready: true,
      api_key_one_time_display_ready: true,
      api_key_revoke_route: "POST /mcp/api-keys/revoke/plan",
      api_key_revoke_enforced_before_new_calls: true,
      api_key_rotate_route: "POST /mcp/api-keys/rotate/plan",
      api_key_rotation_old_key_denied: true,
      api_key_runtime_route: "GET /mcp/api-keys/runtime",
      api_key_rotation_ready: true,
      breaking_changes_require_new_major: true,
      cursor_pagination_ready: true,
      default_deny: true,
      deprecation_policy_ready: true,
      live_tool_execution: false,
      max_row_limit_enforced: true,
      mcp_api_redistribution_rights_confirmed: false,
      mcp_compatibility_status_ready: true,
      mcp_compatibility_status_route: "GET /mcp/compatibility/status",
      mcp_compatibility_status_version:
        "2026-06-21.phase2.mcp-compatibility-status-scaffold.v0",
      mcp_live_client_e2e_passed: false,
      mcp_auth_limits_release_gate_ready: true,
      mcp_auth_limits_release_gate_route: "POST /mcp/release-gates/auth-limits/plan",
      mcp_auth_limits_release_gate_version:
        "2026-06-21.phase3.mcp-auth-limits-release-gate-scaffold.v0",
      mcp_target_clients_console_release_gate_ready: true,
      mcp_target_clients_console_release_gate_route:
        "POST /mcp/release-gates/target-clients-console/plan",
      mcp_target_clients_console_release_gate_version:
        "2026-06-21.phase3.mcp-target-clients-console-release-gate-scaffold.v0",
      mcp_target_client_e2e_matrix_ready: true,
      mcp_developer_console_backend_ready: true,
      mcp_developer_console_live: false,
      mcp_developer_console_route: "POST /mcp/developer-console/plan",
      mcp_developer_console_version:
        "2026-06-22.phase2.mcp-developer-console-backend-scaffold.v0",
      mcp_client_maturity_ready: true,
      mcp_client_maturity_route: "POST /mcp/client-maturity/plan",
      mcp_client_maturity_version: "2026-06-22.phase4.mcp-client-maturity-scaffold.v0",
      mcp_interactive_apps_live: false,
      mcp_prompts_live: false,
      mcp_resources_live: false,
      mcp_protocol_release_gate_ready: true,
      mcp_protocol_release_gate_route: "POST /mcp/release-gates/protocol/plan",
      mcp_protocol_release_gate_version:
        "2026-06-21.phase3.mcp-protocol-release-gate-scaffold.v0",
      mcp_target_protocol_version: "2025-03-26",
      developer_console_reconciliation_ready: true,
      oauth_authorize_route: "POST /mcp/oauth/authorize/plan",
      oauth_live: false,
      oauth_pkce_ready: true,
      oauth_revoke_enforced_before_new_calls: true,
      oauth_revoke_route: "POST /mcp/oauth/revoke/plan",
      oauth_token_route: "POST /mcp/oauth/token/plan",
      origin_validation: true,
      pagination_limits_ready: true,
      pagination_limits_version: "2026-06-21.phase2.mcp-pagination-limits-scaffold.v0",
      pagination_or_rights_bypass_blocked: true,
      route: "POST /mcp",
      runtime_route: "GET /mcp/runtime",
      runtime_schema_serving: true,
      runtime_schema_snapshot_route: "GET /mcp/runtime/tool-schemas",
      runtime_schema_snapshot_version:
        "2026-06-22.phase1.mcp-runtime-schema-snapshot.v0",
      schema_source_contract: "deploy/tools/tool-schemas.contract.json",
      scopes_revocable: true,
      mcp_revocation_enforcement_error_code: "AUTH_REQUIRED",
      mcp_revocation_enforcement_live: false,
      mcp_revocation_enforcement_ready: true,
      mcp_revocation_enforcement_route: "POST /mcp/revocations/enforce/plan",
      mcp_revocation_enforcement_version:
        "2026-06-21.phase2.mcp-revocation-enforcement-scaffold.v0",
      mcp_error_detail_fields: [
        "category",
        "client_action",
        "internal_code",
        "mcp_error_version",
        "recoverable",
        "request_id",
        "retry_after_required",
        "source_record_id"
      ],
      status: "mcp_endpoint_default_deny_scaffold",
      standard_error_code_version:
        "2026-06-21.phase2.mcp-standard-error-codes-scaffold.v0",
      standard_error_codes_ready: true,
      structured_content_output_schema_ready: true,
      time_range_limits_ready: true,
      tool_call_input_strict_validation: true,
      tool_schema_validation_version:
        "2026-06-21.phase2.mcp-tool-schema-validation-scaffold.v0",
      tools_list_schema_snapshot: true,
      tool_versioning_ready: true,
      usage_envelope_ready: true,
      usage_envelope_version: "2026-06-21.phase2.mcp-usage-envelope-scaffold.v0",
      usage_remaining_ready: true,
      usage_request_id_visible: true,
      usage_reconciliation_ready: true,
      transport: "streamable_http",
      web_rights_do_not_imply_mcp: true
    });
    expect(body.data.monitored_protocol_versions).toEqual(["2025-03-26", "2025-11-25"]);
    expect(body.data.supported_methods).toEqual([
      "initialize",
      "tools/list",
      "tools/call"
    ]);
    expect(body.data.mcp_protocol_release_gate_required_checks).toEqual([
      "streamable_http_initialize_contract",
      "origin_required_and_allowed",
      "auth_enforced_before_tool_execution",
      "tools_list_default_deny_until_rights_confirmed",
      "tools_call_input_schema_validation",
      "tools_call_output_schema_contract",
      "compatibility_vectors_present"
    ]);
    expect(body.data.mcp_auth_limits_release_gate_required_checks).toEqual([
      "oauth_scope_catalog_and_pkce_ready",
      "oauth_revoke_denies_future_calls",
      "api_key_rotation_denies_old_key",
      "api_key_revoke_denies_future_calls",
      "cursor_pagination_bypass_blocked",
      "quota_and_limit_bypass_blocked",
      "standard_error_codes_stable"
    ]);
    expect(body.data.mcp_target_clients_console_release_gate_required_checks).toEqual([
      "target_client_matrix_present",
      "inspector_and_sdk_smoke_vectors_planned",
      "first_call_guide_under_10_minute_target",
      "console_reconciliation_fields_present",
      "request_usage_scope_and_key_reconciliation_ready",
      "compatibility_status_linked",
      "no_live_console_or_client_claim"
    ]);
    expect(body.data.mcp_developer_console_required_checks).toEqual([
      "connection_guide_surface_ready",
      "api_key_and_oauth_routes_linked",
      "scope_catalog_visible",
      "quota_usage_summary_visible",
      "request_log_schema_ready",
      "examples_cover_initialize_tools_list_tools_call",
      "first_call_guide_under_10_minute_target",
      "no_live_console_claim"
    ]);
    expect(body.data.mcp_developer_console_log_fields).toContain("request_id");
    expect(body.data.mcp_developer_console_forbidden_fields).toContain("raw_api_key");
    expect(body.data.mcp_client_maturity_required_checks).toEqual([
      "target_clients_capability_matrix_present",
      "resources_support_guarded_by_client_maturity",
      "prompts_support_guarded_by_client_maturity",
      "interactive_apps_support_blocked_until_client_stable",
      "fallback_to_tools_only_documented",
      "no_live_resources_prompts_apps_claim"
    ]);
    expect(body.data.supported_oauth_scopes).toContain("market.read");
    expect(body.data.standard_error_codes).toEqual([
      "AUTH_REQUIRED",
      "SCOPE_DENIED",
      "DATA_NOT_LICENSED",
      "SYMBOL_AMBIGUOUS",
      "OUT_OF_RANGE",
      "TOO_MANY_ROWS",
      "RATE_LIMITED",
      "BUDGET_EXCEEDED",
      "UPSTREAM_STALE",
      "DATA_QUALITY_HOLD",
      "INTERNAL_ERROR"
    ]);
    expect(body.data.standard_error_categories).toEqual([
      "authentication",
      "authorization",
      "data",
      "limit",
      "system"
    ]);
    expect(body.data.standard_error_definitions).toContainEqual({
      category: "limit",
      client_action: "retry_after",
      code: "RATE_LIMITED",
      recoverable: true,
      retry_after_required: true,
      source_record_id: "mcp_error_rate_limited"
    });
  });

  it("serves MCP runtime tool schema snapshots without live execution", async () => {
    const response = await app.request("/mcp/runtime/tool-schemas", {
      headers: {
        "x-request-id": "req-mcp-runtime-tool-schemas"
      }
    });
    const body = (await response.json()) as McpRuntimeSchemaSnapshotBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.usage.rows).toBe(REGISTERED_TOOL_COUNT);
    expect(body.data).toMatchObject({
      live_tool_execution: false,
      package: "@aiphabee/mcp-runtime",
      protocol_route: "POST /mcp",
      route: "GET /mcp/runtime/tool-schemas",
      runtime_schema_serving: true,
      schema_dialect: "https://json-schema.org/draft/2020-12/schema",
      schema_snapshot_version: "2026-06-22.phase1.mcp-runtime-schema-snapshot.v0",
      schema_source_contract: "deploy/tools/tool-schemas.contract.json",
      status: "runtime_schema_snapshot_scaffold",
      tool_count: REGISTERED_TOOL_COUNT,
      tools_list_schema_snapshot: true,
      version: "2026-06-22.phase1.mcp-runtime-schema-snapshot.v0"
    });
    expect(body.data.tools).toHaveLength(REGISTERED_TOOL_COUNT);
    expect(
      body.data.tools.every(
        (tool) =>
          tool.schema_snapshot.input_schema.id === tool.input_schema_id &&
          tool.schema_snapshot.input_schema.additional_properties_allowed === false &&
          tool.schema_snapshot.output_schema.id === tool.output_schema_id &&
          tool.schema_snapshot.output_schema.structured_content_required === true &&
          tool.schema_snapshot.output_schema.raw_text_only_response_allowed === false
      )
    ).toBe(true);
    expect(
      body.data.tools
        .find((tool) => tool.name === "resolve_security")
        ?.schema_snapshot.input_schema.required
    ).toEqual(["query"]);
  });

  it("serves MCP compatibility status without live SDK or Inspector smoke", async () => {
    const response = await app.request("/mcp/compatibility/status", {
      headers: {
        "x-request-id": "req-mcp-compatibility-status"
      }
    });
    const body = (await response.json()) as McpCompatibilityStatusBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      live_client_e2e_passed: false,
      protocol_route: "POST /mcp",
      release_gate: {
        live_client_smoke_required_before_ga: true,
        local_contract_required: "npm run check:mcp-compatibility",
        remote_mcp_rights_required: true
      },
      sdk: {
        latest_seen_v1_release: "v1.29.0",
        live_sdk_smoke: false,
        production_channel: "typescript-sdk-v1.x",
        v2_channel_status: "pre_alpha_not_targeted"
      },
      status: "planned_no_live_compatibility_status",
      status_page: {
        public_status_page_live: false,
        route: "GET /mcp/compatibility/status",
        shows_last_successful_client_smoke: true,
        shows_open_incidents: true,
        shows_protocol_version: true
      },
      target_protocol_version: "2025-03-26",
      version: "2026-06-21.phase2.mcp-compatibility-status-scaffold.v0"
    });
    expect(body.data.capability).toMatchObject({
      live_client_e2e_passed: false,
      production_sdk_channel: "typescript-sdk-v1.x",
      public_status_page_live: false,
      status: "mcp_compatibility_status_scaffold",
      status_route: "GET /mcp/compatibility/status",
      target_protocol_version: "2025-03-26"
    });
    expect(body.data.monitored_protocol_versions).toEqual(["2025-03-26", "2025-11-25"]);
    expect(body.data.inspector).toEqual({
      live_inspector_smoke: false,
      planned_command: "npx @modelcontextprotocol/inspector",
      required_checks: [
        "connectivity",
        "capability_negotiation",
        "tools_tab",
        "error_responses"
      ],
      target: "@modelcontextprotocol/inspector"
    });
    expect(body.data.target_clients.map((client) => client.name)).toEqual([
      "mcp_inspector",
      "typescript_sdk_client",
      "claude_desktop",
      "cursor",
      "chatgpt_connector"
    ]);
    expect(body.data.target_clients.every((client) => client.live_e2e_passed === false)).toBe(
      true
    );
    expect(body.data.test_vectors.map((vector) => vector.name)).toEqual([
      "streamable_http_post",
      "initialize_negotiation",
      "tools_list",
      "tools_call_schema_validation",
      "structured_content_text_fallback",
      "oauth_pkce",
      "api_key_lifecycle",
      "pagination_limits",
      "standard_errors",
      "usage_and_request_id",
      "as_of_delay_source_display"
    ]);
    expect(body.data.test_vectors.every((vector) => vector.local_contract_ready)).toBe(true);
    expect(body.data.test_vectors.every((vector) => vector.live_smoke_passed === false)).toBe(
      true
    );
    expect(body.usage.rows).toBe(0);
  });

  it("plans MCP protocol release gate without live auth or client smoke", async () => {
    const response = await app.request("/mcp/release-gates/protocol/plan", {
      body: JSON.stringify({
        client_name: "mcp-inspector",
        client_version: "0.16.0",
        plan_code: "developer",
        used_credits: 12,
        workspace_id: "workspace_mcp"
      }),
      headers: {
        "content-type": "application/json",
        origin: "https://app.aiphabee.com",
        "x-request-id": "req-mcp-protocol-release-gate-route"
      },
      method: "POST"
    });
    const body = (await response.json()) as McpProtocolReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      capability: {
        live_auth_middleware: false,
        live_client_e2e_passed: false,
        route: "POST /mcp/release-gates/protocol/plan",
        status: "mcp_protocol_release_gate_scaffold",
        streamable_http_ready: true
      },
      frontend_rendering: false,
      live_auth_middleware: false,
      live_client_e2e_passed: false,
      live_tool_execution: false,
      model_calls: false,
      release_gate: {
        blockers: [
          "live_oauth_provider_missing",
          "live_auth_middleware_missing",
          "live_sdk_inspector_smoke_missing",
          "target_client_e2e_missing"
        ],
        gate_status: "blocked_live_mcp_protocol_validation",
        no_live_release_claim: true,
        required_signoffs: ["platform", "security", "data-rights", "developer-relations"]
      },
      status: "planned_no_write",
      version: "2026-06-21.phase3.mcp-protocol-release-gate-scaffold.v0"
    });
    expect(body.data.release_checks.map((check) => check.check)).toEqual([
      "streamable_http_initialize_contract",
      "origin_required_and_allowed",
      "auth_enforced_before_tool_execution",
      "tools_list_default_deny_until_rights_confirmed",
      "tools_call_input_schema_validation",
      "tools_call_output_schema_contract",
      "compatibility_vectors_present"
    ]);
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.protocol_gate).toMatchObject({
      initialize: {
        protocol_version: "2025-03-26"
      },
      protocol: {
        json_rpc: "2.0",
        streamable_http: true
      },
      transport: "streamable_http"
    });
    expect(body.data.origin_gate).toMatchObject({
      allowed_origin_check: {
        required: true,
        valid: true
      },
      denied_error: {
        code: "ORIGIN_NOT_ALLOWED",
        standard_error_code: "SCOPE_DENIED"
      }
    });
    expect(body.data.auth_gate).toMatchObject({
      denied_error: {
        code: "MCP_CREDENTIAL_REVOKED",
        standard_error_code: "AUTH_REQUIRED"
      },
      live_auth_middleware: false,
      rights_denied_error: {
        code: "MCP_REDISTRIBUTION_RIGHTS_REQUIRED",
        standard_error_code: "DATA_NOT_LICENSED"
      }
    });
    expect(body.data.auth_gate.active_credential_plan?.denial).toMatchObject({
      decision: "allow_planned",
      denied: false,
      enforced_before_tool_execution: true
    });
    expect(body.data.schema_compatibility_gate).toMatchObject({
      input_schema_id: "tool.get_quote_snapshot.input.v0",
      input_validation: {
        arguments_valid: true,
        schema_validation_status: "validated"
      },
      invalid_input_denial: {
        code: "TOOL_ARGUMENT_UNSUPPORTED",
        standard_error_code: "OUT_OF_RANGE"
      },
      output_schema_id: "tool.get_quote_snapshot.output.v0",
      output_validation: {
        structured_content_matches_output_schema: "planned_no_live",
        structured_content_required: true
      },
      requested_tool_name: "get_quote_snapshot",
      required_scope: "quotes:read"
    });
    expect(body.data.compatibility_gate).toMatchObject({
      live_client_e2e_passed: false,
      target_protocol_version: "2025-03-26"
    });
    expect(body.data.compatibility_gate.test_vectors.map((vector) => vector.name)).toContain(
      "streamable_http_post"
    );
    expect(Object.values(body.data.validation).every(Boolean)).toBe(true);
    expect(body.usage.rows).toBe(7);
  });

  it("plans MCP auth, key, cursor, limit, and error release gate without live execution", async () => {
    const response = await app.request("/mcp/release-gates/auth-limits/plan", {
      body: JSON.stringify({
        plan_code: "developer",
        used_credits: 12,
        workspace_id: "workspace_mcp"
      }),
      headers: {
        "content-type": "application/json",
        origin: "https://app.aiphabee.com",
        "x-request-id": "req-mcp-auth-limits-release-gate-route"
      },
      method: "POST"
    });
    const body = (await response.json()) as McpAuthLimitsReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      capability: {
        live_auth_middleware: false,
        live_limiter_enforcement: false,
        live_oauth_provider: false,
        route: "POST /mcp/release-gates/auth-limits/plan",
        status: "mcp_auth_limits_release_gate_scaffold"
      },
      frontend_rendering: false,
      live_auth_middleware: false,
      live_limiter_enforcement: false,
      live_oauth_provider: false,
      live_tool_execution: false,
      model_calls: false,
      release_gate: {
        blockers: [
          "live_oauth_provider_missing",
          "live_token_store_missing",
          "live_api_key_secret_generation_missing",
          "live_limiter_window_reads_missing",
          "live_usage_ledger_writes_missing"
        ],
        gate_status: "blocked_live_mcp_auth_limits_validation",
        no_live_release_claim: true,
        required_signoffs: ["platform", "security", "billing", "data-rights"]
      },
      status: "planned_no_write",
      version: "2026-06-21.phase3.mcp-auth-limits-release-gate-scaffold.v0"
    });
    expect(body.data.release_checks.map((check) => check.check)).toEqual([
      "oauth_scope_catalog_and_pkce_ready",
      "oauth_revoke_denies_future_calls",
      "api_key_rotation_denies_old_key",
      "api_key_revoke_denies_future_calls",
      "cursor_pagination_bypass_blocked",
      "quota_and_limit_bypass_blocked",
      "standard_error_codes_stable"
    ]);
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.oauth_scope_gate.authorize_plan).toMatchObject({
      consent: {
        scopes: [
          {
            revocable: true,
            scope: "security.read"
          },
          {
            revocable: true,
            scope: "market.read"
          },
          {
            revocable: true,
            scope: "analytics.run"
          }
        ]
      },
      pkce: {
        code_challenge_method: "S256",
        plain_method_allowed: false
      }
    });
    expect(body.data.oauth_scope_gate.revoke_plan.revocation_plan).toMatchObject({
      future_calls_denied_after_revoke: true,
      token_invalidation_live: false
    });
    expect(body.data.oauth_scope_gate.revoked_connection_denial).toMatchObject({
      code: "MCP_CREDENTIAL_REVOKED",
      standard_error_code: "AUTH_REQUIRED"
    });
    expect(body.data.api_key_gate.rotate_plan.api_key).toMatchObject({
      live_secret_generated: false,
      old_key_future_calls_denied_after_rotation: true
    });
    expect(body.data.api_key_gate.revoke_plan.revocation_plan).toMatchObject({
      future_calls_denied_after_revoke: true,
      live_invalidation: false
    });
    expect(body.data.api_key_gate.rotated_key_denial).toMatchObject({
      code: "MCP_CREDENTIAL_REVOKED",
      standard_error_code: "AUTH_REQUIRED"
    });
    expect(body.data.limit_gate.bounded_retrieval).toMatchObject({
      cursor_pagination: {
        cursor: "cursor_1",
        cursor_bound_to_request: true,
        cursor_opaque: true,
        enabled: true,
        parameter: "cursor"
      },
      max_rows_enforced: true,
      row_limit: {
        effective_limit: 3,
        max_limit: 3,
        too_many_rows_error_code: "TOO_MANY_ROWS"
      }
    });
    expect(body.data.limit_gate.too_many_rows_denial).toMatchObject({
      code: "TOOL_LIMIT_EXCEEDED",
      standard_error_code: "TOO_MANY_ROWS"
    });
    expect(body.data.limit_gate.time_range_denial).toMatchObject({
      code: "TOOL_TIME_RANGE_EXCEEDED",
      standard_error_code: "OUT_OF_RANGE"
    });
    expect(body.data.limit_gate.tool_limits).toMatchObject({
      limiter_version: "2026-06-21.phase2.mcp-tool-limiter-scaffold.v0",
      ordinary_pool_protection: true,
      rate_limit: {
        live_window_reads: false,
        rate_limited_error_code: "RATE_LIMITED",
        status: "planned_no_live"
      }
    });
    expect(body.data.error_stability_gate.required_mappings).toMatchObject({
      MCP_CREDENTIAL_REVOKED: "AUTH_REQUIRED",
      MCP_REDISTRIBUTION_RIGHTS_REQUIRED: "DATA_NOT_LICENSED",
      TOOL_LIMIT_EXCEEDED: "TOO_MANY_ROWS",
      TOOL_SCOPE_REQUIRED: "SCOPE_DENIED",
      TOOL_TIME_RANGE_EXCEEDED: "OUT_OF_RANGE"
    });
    expect(body.data.error_stability_gate.limiter_error_codes).toEqual([
      "RATE_LIMITED",
      "BUDGET_EXCEEDED"
    ]);
    expect(Object.values(body.data.validation).every(Boolean)).toBe(true);
    expect(body.usage.rows).toBe(7);
  });

  it("plans MCP target-client and Developer Console reconciliation release gate", async () => {
    const response = await app.request("/mcp/release-gates/target-clients-console/plan", {
      body: JSON.stringify({
        client_name: "mcp-inspector",
        client_version: "0.16.0",
        plan_code: "developer",
        used_credits: 12,
        workspace_id: "workspace_mcp"
      }),
      headers: {
        "content-type": "application/json",
        origin: "https://app.aiphabee.com",
        "x-request-id": "req-mcp-target-clients-console-release-gate-route"
      },
      method: "POST"
    });
    const body = (await response.json()) as McpTargetClientsConsoleReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      capability: {
        console_reconciliation_ready: true,
        developer_console_live: false,
        live_client_e2e_passed: false,
        route: "POST /mcp/release-gates/target-clients-console/plan",
        status: "mcp_target_clients_console_release_gate_scaffold",
        target_client_matrix_ready: true
      },
      developer_console_live: false,
      frontend_rendering: false,
      live_client_e2e_passed: false,
      live_console_log_store: false,
      live_tool_execution: false,
      live_usage_ledger_reads: false,
      model_calls: false,
      release_gate: {
        blockers: [
          "live_target_client_e2e_missing",
          "developer_console_ui_missing",
          "live_console_log_store_missing",
          "live_usage_ledger_reads_missing",
          "public_status_page_deploy_missing"
        ],
        gate_status: "blocked_live_mcp_target_clients_console_validation",
        no_live_release_claim: true,
        required_signoffs: [
          "platform",
          "developer-relations",
          "support",
          "billing",
          "data-rights"
        ]
      },
      status: "planned_no_write",
      version: "2026-06-21.phase3.mcp-target-clients-console-release-gate-scaffold.v0"
    });
    expect(body.data.release_checks.map((check) => check.check)).toEqual([
      "target_client_matrix_present",
      "inspector_and_sdk_smoke_vectors_planned",
      "first_call_guide_under_10_minute_target",
      "console_reconciliation_fields_present",
      "request_usage_scope_and_key_reconciliation_ready",
      "compatibility_status_linked",
      "no_live_console_or_client_claim"
    ]);
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.target_client_gate).toMatchObject({
      first_call_time_target_minutes: 10,
      live_client_e2e_passed: false
    });
    expect(body.data.target_client_gate.matrix.map((client) => client.client_name)).toEqual([
      "mcp_inspector",
      "typescript_sdk_client",
      "claude_desktop",
      "cursor",
      "chatgpt_connector"
    ]);
    expect(
      body.data.target_client_gate.matrix.every(
        (client) =>
          client.connection_guide_artifact === "docs/public/mcp.md" &&
          client.first_call_time_target_minutes === 10 &&
          client.live_e2e_passed === false &&
          client.planned_checks.includes("console_reconciliation")
      )
    ).toBe(true);
    expect(body.data.console_reconciliation_gate).toMatchObject({
      console_live: false,
      log_store_live: false,
      request_id_visible: true,
      scope_visibility: true,
      status_source: "GET /mcp/compatibility/status",
      usage_ledger_reads_live: false
    });
    expect(body.data.console_reconciliation_gate.required_fields).toEqual([
      "request_id",
      "workspace_id",
      "client_name",
      "client_version",
      "credential_kind",
      "credential_reference",
      "scope",
      "tool_name",
      "tool_version",
      "status",
      "standard_error_code",
      "credits",
      "credits_remaining",
      "usage_event_id",
      "data_version",
      "methodology_version",
      "source_record_id"
    ]);
    expect(body.data.console_reconciliation_gate.forbidden_fields).toContain("raw_api_key");
    expect(body.data.compatibility_gate).toMatchObject({
      status_route: "GET /mcp/compatibility/status",
      target_protocol_version: "2025-03-26"
    });
    expect(body.data.compatibility_gate.inspector.live_inspector_smoke).toBe(false);
    expect(body.data.compatibility_gate.sdk.live_sdk_smoke).toBe(false);
    expect(body.data.protocol_gate).toMatchObject({
      route: "POST /mcp/release-gates/protocol/plan",
      usage: {
        request_id: "req-mcp-target-clients-console-release-gate-route:protocol",
        request_id_visible: true
      }
    });
    expect(body.data.auth_limits_gate.oauth_scope_gate.authorize_plan.consent).toMatchObject({
      clear_scope_display: true,
      requested_scope_count: 3
    });
    expect(body.data.auth_limits_gate.api_key_gate.rotate_plan.api_key).toMatchObject({
      live_secret_generated: false,
      old_key_future_calls_denied_after_rotation: true
    });
    expect(body.data.auth_limits_gate.error_stability_gate.limiter_error_codes).toEqual([
      "RATE_LIMITED",
      "BUDGET_EXCEEDED"
    ]);
    expect(Object.values(body.data.validation).every(Boolean)).toBe(true);
    expect(body.usage.rows).toBe(7);
  });

  it("plans MCP Developer Console backend payload without live Console surfaces", async () => {
    const response = await app.request("/mcp/developer-console/plan", {
      body: JSON.stringify({
        client_name: "mcp-inspector",
        client_version: "0.16.0",
        plan_code: "developer",
        used_credits: 12,
        workspace_id: "workspace_mcp"
      }),
      headers: {
        "content-type": "application/json",
        origin: "https://app.aiphabee.com",
        "x-request-id": "req-mcp-developer-console-route"
      },
      method: "POST"
    });
    const body = (await response.json()) as McpDeveloperConsolePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      capability: {
        api_key_secret_generation_live: false,
        connection_guide_artifact: "docs/public/mcp.md",
        developer_console_live: false,
        first_call_time_target_minutes: 10,
        live_console_log_store: false,
        live_usage_ledger_reads: false,
        route: "POST /mcp/developer-console/plan",
        status: "mcp_developer_console_backend_scaffold"
      },
      developer_console_live: false,
      frontend_rendering: false,
      live_api_key_generation: false,
      live_console_log_store: false,
      live_oauth_provider: false,
      live_tool_execution: false,
      live_usage_ledger_reads: false,
      model_calls: false,
      route: "POST /mcp/developer-console/plan",
      status: "planned_no_live_developer_console",
      version: "2026-06-22.phase2.mcp-developer-console-backend-scaffold.v0"
    });
    expect(body.data.release_checks.map((check) => check.check)).toEqual([
      "connection_guide_surface_ready",
      "api_key_and_oauth_routes_linked",
      "scope_catalog_visible",
      "quota_usage_summary_visible",
      "request_log_schema_ready",
      "examples_cover_initialize_tools_list_tools_call",
      "first_call_guide_under_10_minute_target",
      "no_live_console_claim"
    ]);
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.connection_guide).toMatchObject({
      artifact: "docs/public/mcp.md",
      first_call_time_target_minutes: 10,
      protocol_route: "POST /mcp"
    });
    expect(body.data.connection_guide.steps.map((step) => step.step)).toEqual([
      "choose_credential",
      "initialize",
      "list_tools",
      "first_tool_call"
    ]);
    expect(
      body.data.connection_guide.target_clients.every(
        (client) =>
          client.connection_guide_artifact === "docs/public/mcp.md" &&
          client.first_call_time_target_minutes === 10
      )
    ).toBe(true);
    expect(body.data.credentials).toMatchObject({
      api_key: {
        create_route: "POST /mcp/api-keys/create/plan",
        live_secret_generation: false,
        one_time_display: true,
        server_to_server_only: true
      },
      oauth: {
        authorize_route: "POST /mcp/oauth/authorize/plan",
        live_oauth_provider: false,
        pkce_methods: ["S256"],
        token_storage_live: false
      }
    });
    expect(body.data.scope_panel.scope_catalog.map((definition) => definition.scope)).toContain(
      "market.read"
    );
    expect(body.data.scope_panel.scope_catalog.every((definition) => definition.revocable)).toBe(
      true
    );
    expect(body.data.quota_panel).toMatchObject({
      freshness_target_minutes: 5,
      live_ledger_reads: false,
      request_id: "req-mcp-developer-console-route",
      request_id_visible: true
    });
    expect(body.data.request_log_panel).toMatchObject({
      live_log_store: false,
      usage_ledger_reads_live: false
    });
    expect(body.data.request_log_panel.fields).toEqual([
      "request_id",
      "workspace_id",
      "client_name",
      "client_version",
      "credential_kind",
      "credential_reference",
      "scope",
      "tool_name",
      "tool_version",
      "status",
      "standard_error_code",
      "credits",
      "credits_remaining",
      "usage_event_id",
      "data_version",
      "methodology_version",
      "source_record_id"
    ]);
    expect(body.data.request_log_panel.forbidden_fields).toContain("raw_api_key");
    expect(body.data.request_log_panel.sample_rows[0]).toMatchObject({
      client_name: "mcp-inspector",
      credential_kind: "oauth_connection",
      request_id: "req-mcp-developer-console-route:example-tools-call",
      scope: "quotes:read",
      tool_name: "get_quote_snapshot",
      workspace_id: "workspace_mcp"
    });
    expect(body.data.examples.calls.map((example) => example.method)).toEqual([
      "initialize",
      "tools/list",
      "tools/call"
    ]);
    expect(body.data.examples.calls.every((example) => example.live_execution === false)).toBe(
      true
    );
    expect(body.data.release_gate).toMatchObject({
      blockers: [
        "developer_console_ui_missing",
        "live_console_log_store_missing",
        "live_usage_ledger_reads_missing",
        "live_api_key_secret_generation_missing",
        "live_oauth_provider_missing",
        "live_target_client_e2e_missing"
      ],
      gate_status: "blocked_live_mcp_developer_console_validation",
      no_live_release_claim: true
    });
    expect(body.data.target_clients_console_gate).toMatchObject({
      gate_status: "blocked_live_mcp_target_clients_console_validation",
      route: "POST /mcp/release-gates/target-clients-console/plan"
    });
    expect(Object.values(body.data.validation).every(Boolean)).toBe(true);
    expect(body.usage.rows).toBe(8);
  });

  it("plans MCP resources prompts and interactive apps client maturity without live publication", async () => {
    const response = await app.request("/mcp/client-maturity/plan", {
      body: JSON.stringify({
        client_name: "ChatGPT Connector",
        client_version: "apps-sdk-preview",
        plan_code: "developer",
        requested_feature: "interactive apps",
        workspace_id: "workspace_mcp"
      }),
      headers: {
        "content-type": "application/json",
        origin: "https://app.aiphabee.com",
        "x-request-id": "req-mcp-client-maturity-route"
      },
      method: "POST"
    });
    const body = (await response.json()) as McpClientMaturityPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      capability: {
        fallback_mode: "tools_only",
        interactive_apps_live: false,
        prompts_live: false,
        resources_live: false,
        route: "POST /mcp/client-maturity/plan",
        status: "mcp_client_maturity_scaffold",
        target_client_matrix_ready: true,
        tools_only_fallback_ready: true
      },
      developer_console_live: false,
      frontend_rendering: false,
      live_client_e2e_passed: false,
      live_tool_execution: false,
      model_calls: false,
      route: "POST /mcp/client-maturity/plan",
      status: "planned_no_live_mcp_client_maturity",
      version: "2026-06-22.phase4.mcp-client-maturity-scaffold.v0"
    });
    expect(body.data.client_maturity_gate).toMatchObject({
      candidate_feature: "interactive_apps",
      requested_client: "chatgpt_connector",
      status: "client_maturity_assessment_only"
    });
    expect(body.data.client_maturity_gate.matrix.map((client) => client.client_name)).toEqual([
      "mcp_inspector",
      "typescript_sdk_client",
      "claude_desktop",
      "cursor",
      "chatgpt_connector"
    ]);
    expect(
      body.data.client_maturity_gate.matrix.every(
        (client) =>
          client.fallback_mode === "tools_only" &&
          client.live_e2e_passed === false &&
          client.resources.live_enabled === false &&
          client.prompts.live_enabled === false &&
          client.interactive_apps.live_enabled === false &&
          client.tools.live_execution === false
      )
    ).toBe(true);
    expect(body.data.publication_policy).toEqual({
      component_widgets_live: false,
      fallback_to_tools_only: true,
      interactive_apps_live: false,
      prompts_live: false,
      resources_live: false,
      tools_call_live_execution: false,
      tool_result_embedded_resources_live: false
    });
    expect(body.data.reference_urls).toContain(
      "https://developers.openai.com/apps-sdk/concepts/mcp-server"
    );
    expect(body.data.release_checks.map((check) => check.check)).toEqual([
      "target_clients_capability_matrix_present",
      "resources_support_guarded_by_client_maturity",
      "prompts_support_guarded_by_client_maturity",
      "interactive_apps_support_blocked_until_client_stable",
      "fallback_to_tools_only_documented",
      "no_live_resources_prompts_apps_claim"
    ]);
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.release_gate).toMatchObject({
      blockers: [
        "live_resources_e2e_missing",
        "live_prompts_e2e_missing",
        "interactive_apps_client_stability_missing",
        "client_capability_version_matrix_missing",
        "apps_sdk_security_review_missing"
      ],
      gate_status: "blocked_live_mcp_client_maturity_validation",
      no_live_release_claim: true
    });
    expect(Object.values(body.data.validation).every(Boolean)).toBe(true);
    expect(body.usage.rows).toBe(6);
  });

  it("serves MCP OAuth PKCE capabilities with revocable scope catalog", async () => {
    const response = await app.request("/mcp/oauth/runtime", {
      headers: {
        "x-request-id": "req-mcp-oauth-runtime"
      }
    });
    const body = (await response.json()) as McpOAuthRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      authorize_route: "POST /mcp/oauth/authorize/plan",
      live_oauth_provider: false,
      pkce_methods: ["S256"],
      revoke_route: "POST /mcp/oauth/revoke/plan",
      scopes_revocable: true,
      status: "mcp_oauth_pkce_scaffold",
      third_party_token_passthrough: false,
      token_route: "POST /mcp/oauth/token/plan"
    });
    expect(body.data.scope_catalog.map((scope) => scope.scope)).toEqual([
      "security.read",
      "market.read",
      "fundamentals.read",
      "filings.read",
      "analytics.run",
      "portfolio.read",
      "alerts.write",
      "exports.read",
      "admin.usage.read"
    ]);
  });

  it("plans MCP OAuth authorization with S256 PKCE and clear revocable scopes", async () => {
    const response = await app.request("/mcp/oauth/authorize/plan", {
      body: JSON.stringify({
        client_id: "client_mcp_inspector",
        code_challenge: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO0123456789_-",
        code_challenge_method: "S256",
        redirect_uri: "https://client.example/oauth/callback",
        scopes: ["security.read", "market.read", "analytics.run"],
        user_id: "user_internal_alpha",
        workspace_id: "workspace_mcp"
      }),
      headers: {
        "content-type": "application/json",
        origin: "https://app.aiphabee.com",
        "x-request-id": "req-mcp-oauth-authorize"
      },
      method: "POST"
    });
    const body = (await response.json()) as McpOAuthAuthorizePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      authorization_code: {
        code_emitted: false,
        expires_in_seconds: 300,
        one_time_use: true,
        token_exchange_route: "POST /mcp/oauth/token/plan"
      },
      consent: {
        clear_scope_display: true,
        requested_scope_count: 3,
        user_consent_required: true
      },
      live_oauth_provider: false,
      oauth_flow: "authorization_code_pkce",
      pkce: {
        code_challenge_method: "S256",
        code_verifier_stored: false,
        plain_method_allowed: false
      },
      revocation: {
        revoke_route: "POST /mcp/oauth/revoke/plan",
        revocable: true
      },
      route: "POST /mcp/oauth/authorize/plan",
      status: "planned_no_live_oauth",
      third_party_token_passthrough: false,
      token_issued: false
    });
    expect(body.data.capability).toMatchObject({
      authorize_route: "POST /mcp/oauth/authorize/plan",
      scopes_revocable: true,
      token_route: "POST /mcp/oauth/token/plan"
    });
    expect(body.data.consent.scopes.map((scope) => scope.scope)).toEqual([
      "security.read",
      "market.read",
      "analytics.run"
    ]);
    expect(body.data.consent.scopes.every((scope) => scope.revocable)).toBe(true);
  });

  it("plans MCP OAuth token exchange without issuing or forwarding tokens", async () => {
    const response = await app.request("/mcp/oauth/token/plan", {
      body: JSON.stringify({
        authorization_code: "auth_code_placeholder",
        client_id: "client_mcp_inspector",
        code_verifier: "verifier_placeholder",
        scopes: ["security.read", "market.read"]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-mcp-oauth-token"
      },
      method: "POST"
    });
    const body = (await response.json()) as McpOAuthTokenPlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      pkce_verification: {
        code_verifier_received: true,
        verification_status: "planned_no_live",
        verifier_hash_stored: false
      },
      scope_binding: {
        requested_scopes: ["security.read", "market.read"],
        scopes_bound_to_token: true
      },
      status: "planned_no_live_oauth",
      third_party_token_passthrough: false,
      token: {
        access_token_issued: false,
        audience: "aiphabee-mcp",
        refresh_token_issued: false
      }
    });
  });

  it("plans MCP OAuth revocation so future calls are denied after revoke", async () => {
    const response = await app.request("/mcp/oauth/revoke/plan", {
      body: JSON.stringify({
        connection_id: "mcp_connection_1",
        reason: "user_disconnect"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-mcp-oauth-revoke"
      },
      method: "POST"
    });
    const body = (await response.json()) as McpOAuthRevokePlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      connection_id: "mcp_connection_1",
      revocation_plan: {
        future_calls_denied_after_revoke: true,
        revoke_status: "planned_no_live",
        scope_grants_removed: "planned",
        token_invalidation_live: false
      },
      route: "POST /mcp/oauth/revoke/plan",
      status: "planned_no_live_oauth"
    });
  });

  it("rejects MCP OAuth authorization without S256 PKCE", async () => {
    const response = await app.request("/mcp/oauth/authorize/plan", {
      body: JSON.stringify({
        client_id: "client_mcp_inspector",
        code_challenge: "short",
        code_challenge_method: "plain",
        redirect_uri: "https://client.example/oauth/callback",
        scopes: ["market.read"]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-mcp-oauth-invalid"
      },
      method: "POST"
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("SCOPE_DENIED");
    expect(body.error.detail).toMatchObject({
      category: "authorization",
      client_action: "request_additional_scope",
      internal_code: "CODE_CHALLENGE_METHOD_UNSUPPORTED",
      mcp_error_version: "2026-06-21.phase2.mcp-standard-error-codes-scaffold.v0",
      recoverable: true,
      request_id: "req-mcp-oauth-invalid",
      retry_after_required: false,
      source_record_id: "mcp_error_scope_denied"
    });
  });

  it("serves MCP API key lifecycle capabilities", async () => {
    const response = await app.request("/mcp/api-keys/runtime", {
      headers: {
        "x-request-id": "req-mcp-api-key-runtime"
      }
    });
    const body = (await response.json()) as McpApiKeyRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      api_key_live: false,
      create_route: "POST /mcp/api-keys/create/plan",
      hash_algorithm: "hmac_sha256_with_pepper_planned",
      hash_storage_required: true,
      ip_allowlist_supported: true,
      one_time_display: true,
      revoke_route: "POST /mcp/api-keys/revoke/plan",
      rotate_route: "POST /mcp/api-keys/rotate/plan",
      rotation_supported: true,
      runtime_route: "GET /mcp/api-keys/runtime",
      server_to_server_only: true,
      status: "mcp_api_key_scaffold"
    });
    expect(body.data.supported_scopes).toContain("analytics.run");
  });

  it("plans MCP API key creation without returning raw key material", async () => {
    const response = await app.request("/mcp/api-keys/create/plan", {
      body: JSON.stringify({
        ip_allowlist: ["203.0.113.10", "2001:db8::/48"],
        key_name: "mcp-server-prod",
        owner_id: "owner_platform",
        rotation_after_days: 60,
        scopes: ["security.read", "market.read"],
        workspace_id: "workspace_mcp"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-mcp-api-key-create"
      },
      method: "POST"
    });
    const body = (await response.json()) as McpApiKeyCreatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      api_key: {
        issued: false,
        key_name: "mcp-server-prod",
        key_status: "planned_no_live",
        live_secret_generated: false
      },
      hash_storage: {
        key_hash_stored: true,
        key_last_four_stored: true,
        raw_key_stored: false
      },
      ip_restrictions: {
        allowlist: ["203.0.113.10", "2001:db8::/48"],
        ip_allowlist_supported: true,
        validated: true
      },
      key_material: {
        key_material_returned: false,
        key_prefix: "aipb_srv_",
        one_time_display: true
      },
      route: "POST /mcp/api-keys/create/plan",
      rotation: {
        default_rotation_after_days: 60,
        rotatable: true,
        rotate_route: "POST /mcp/api-keys/rotate/plan"
      },
      server_to_server: {
        allowed_only: true,
        browser_use_allowed: false
      },
      status: "planned_no_live_api_key"
    });
    expect(body.data.capability).toMatchObject({
      create_route: "POST /mcp/api-keys/create/plan",
      hash_storage_required: true,
      one_time_display: true,
      rotate_route: "POST /mcp/api-keys/rotate/plan"
    });
    expect(body.data.scope_binding).toMatchObject({
      requested_scopes: ["security.read", "market.read"],
      scopes_bound_to_key: true
    });
    expect(body.data.scope_binding.scope_grants.map((scope) => scope.scope)).toEqual([
      "security.read",
      "market.read"
    ]);
  });

  it("plans MCP API key rotation with immediate old-key denial", async () => {
    const response = await app.request("/mcp/api-keys/rotate/plan", {
      body: JSON.stringify({
        ip_allowlist: ["203.0.113.10/32"],
        key_id: "mcp_key_123",
        reason: "scheduled_rotation",
        rotation_after_days: 30,
        scopes: ["analytics.run"]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-mcp-api-key-rotate"
      },
      method: "POST"
    });
    const body = (await response.json()) as McpApiKeyRotatePlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      api_key: {
        key_id: "mcp_key_123",
        live_secret_generated: false,
        new_key_material_display_once: true,
        old_key_future_calls_denied_after_rotation: true,
        rotation_overlap_seconds: 0,
        rotation_status: "planned_no_live"
      },
      reason: "scheduled_rotation",
      route: "POST /mcp/api-keys/rotate/plan",
      rotation: {
        next_rotation_after_days: 30,
        rotatable: true
      },
      status: "planned_no_live_api_key"
    });
  });

  it("plans MCP API key revocation so future calls are denied", async () => {
    const response = await app.request("/mcp/api-keys/revoke/plan", {
      body: JSON.stringify({
        key_id: "mcp_key_123",
        reason: "compromised"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-mcp-api-key-revoke"
      },
      method: "POST"
    });
    const body = (await response.json()) as McpApiKeyRevokePlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      key_id: "mcp_key_123",
      revocation_plan: {
        future_calls_denied_after_revoke: true,
        key_hash_disabled: "planned",
        live_invalidation: false,
        revoke_status: "planned_no_live"
      },
      route: "POST /mcp/api-keys/revoke/plan",
      status: "planned_no_live_api_key"
    });
  });

  it("plans MCP revocation enforcement before tool execution", async () => {
    const response = await app.request("/mcp/revocations/enforce/plan", {
      body: JSON.stringify({
        credential_kind: "oauth_connection",
        credential_status: "revoked",
        connection_id: "mcp_connection_revoked",
        method: "tools/call",
        reason: "user_disconnect",
        revoked_at: "2026-06-21T11:20:00.000Z",
        tool_name: "get_quote_snapshot"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-mcp-revocation-enforce"
      },
      method: "POST"
    });
    const body = (await response.json()) as McpRevocationEnforcementPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      credential: {
        connection_id: "mcp_connection_revoked",
        credential_kind: "oauth_connection",
        credential_reference: "mcp_connection_revoked",
        raw_credential_stored: false,
        status: "revoked"
      },
      denial: {
        client_action: "reauthorize",
        decision: "deny_revoked",
        denied: true,
        enforced_before_tool_execution: true,
        enforced_before_usage_debit: true,
        immediate_failure_after_revoke: true,
        standard_error_code: "AUTH_REQUIRED"
      },
      live_auth_middleware: false,
      persistent_writes: false,
      route: "POST /mcp/revocations/enforce/plan",
      status: "planned_no_live_revocation_enforcement"
    });
    expect(body.data.capability).toMatchObject({
      enforced_before_tool_execution: true,
      live_auth_middleware: false,
      route: "POST /mcp/revocations/enforce/plan",
      standard_error_code: "AUTH_REQUIRED",
      status: "mcp_revocation_enforcement_scaffold"
    });
  });

  it("rejects raw API key material on MCP API key planning routes", async () => {
    const response = await app.request("/mcp/api-keys/create/plan", {
      body: JSON.stringify({
        api_key: "raw-secret-material",
        key_name: "bad-key",
        scopes: ["market.read"]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-mcp-api-key-raw"
      },
      method: "POST"
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(400);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("SCOPE_DENIED");
  });

  it("plans MCP initialize for trusted origins without live tool execution", async () => {
    const response = await app.request("/mcp", {
      body: JSON.stringify({
        method: "initialize",
        params: {
          client_name: "mcp-inspector",
          client_version: "0.16.0"
        }
      }),
      headers: {
        "content-type": "application/json",
        origin: "https://app.aiphabee.com",
        "x-request-id": "req-mcp-initialize"
      },
      method: "POST"
    });
    const body = (await response.json()) as McpProtocolPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      endpoint: "/mcp",
      live_tool_execution: false,
      method: "initialize",
      origin_check: {
        origin: "https://app.aiphabee.com",
        required: true,
        valid: true
      },
      rights_gate: {
        blocked_reason: "MCP_API_REDISTRIBUTION_RIGHTS_NOT_CONFIRMED",
        default_deny: true,
        mcp_api_redistribution_rights_confirmed: false,
        web_rights_do_not_imply_mcp: true
      },
      status: "planned_default_deny",
      transport: "streamable_http"
    });
    expect(body.data.initialize).toMatchObject({
      protocol_version: "2025-03-26",
      server_info: {
        name: "aiphabee-mcp"
      }
    });
    expect(body.data.capability).toMatchObject({
      default_deny: true,
      live_tool_execution: false,
      mcp_api_redistribution_rights_confirmed: false,
      origin_validation: true,
      route: "POST /mcp",
      supported_methods: ["initialize", "tools/list", "tools/call"]
    });
  });

  it("returns empty MCP tools/list while redistribution rights are unconfirmed", async () => {
    const response = await app.request("/mcp", {
      body: JSON.stringify({
        method: "tools/list"
      }),
      headers: {
        "content-type": "application/json",
        origin: "https://app.aiphabee.com",
        "x-request-id": "req-mcp-tools-list"
      },
      method: "POST"
    });
    const body = (await response.json()) as McpProtocolPlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("planned_default_deny");
    expect(body.data.tools_list).toEqual({
      blocked_tool_count: REGISTERED_TOOL_COUNT,
      returned_tool_count: 0,
      schema_snapshot: {
        returned_schema_count: 0,
        runtime_schema_serving: true,
        schema_catalog_available_after_rights_gate: true,
        schema_snapshot_version: "2026-06-22.phase1.mcp-runtime-schema-snapshot.v0",
        schema_source_contract: "deploy/tools/tool-schemas.contract.json",
        tool_schema_count: REGISTERED_TOOL_COUNT,
        tools_list_schema_snapshot: true
      },
      tool_catalog_available_after_rights_gate: true,
      tools: []
    });
    expect(body.usage.rows).toBe(0);
  });

  it("rejects MCP requests from untrusted origins", async () => {
    const response = await app.request("/mcp", {
      body: JSON.stringify({
        method: "tools/list"
      }),
      headers: {
        "content-type": "application/json",
        origin: "https://evil.example",
        "x-request-id": "req-mcp-origin-denied"
      },
      method: "POST"
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("SCOPE_DENIED");
    expect(body.error.detail).toMatchObject({
      category: "authorization",
      client_action: "request_additional_scope",
      internal_code: "ORIGIN_NOT_ALLOWED",
      mcp_error_version: "2026-06-21.phase2.mcp-standard-error-codes-scaffold.v0",
      recoverable: true,
      request_id: "req-mcp-origin-denied",
      retry_after_required: false,
      source_record_id: "mcp_error_scope_denied"
    });
  });

  it("rejects MCP tools/call until MCP redistribution rights are confirmed", async () => {
    const response = await app.request("/mcp", {
      body: JSON.stringify({
        method: "tools/call",
        params: {
          name: "get_quote_snapshot"
        }
      }),
      headers: {
        "content-type": "application/json",
        origin: "https://app.aiphabee.com",
        "x-request-id": "req-mcp-tool-call"
      },
      method: "POST"
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(403);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("DATA_NOT_LICENSED");
    expect(body.error.detail).toMatchObject({
      category: "authorization",
      client_action: "upgrade_or_reduce_scope",
      internal_code: "MCP_REDISTRIBUTION_RIGHTS_REQUIRED",
      mcp_error_version: "2026-06-21.phase2.mcp-standard-error-codes-scaffold.v0",
      recoverable: true,
      request_id: "req-mcp-tool-call",
      retry_after_required: false,
      source_record_id: "mcp_error_data_not_licensed"
    });
  });

  it("rejects MCP calls immediately when credential context is revoked", async () => {
    const response = await app.request("/mcp", {
      body: JSON.stringify({
        method: "tools/call",
        params: {
          credential_kind: "api_key",
          credential_status: "rotated",
          key_id: "mcp_key_old",
          name: "get_quote_snapshot",
          rotated_at: "2026-06-21T11:20:00.000Z"
        }
      }),
      headers: {
        "content-type": "application/json",
        origin: "https://app.aiphabee.com",
        "x-request-id": "req-mcp-revoked-call"
      },
      method: "POST"
    });
    const body = (await response.json()) as ErrorBody;

    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("AUTH_REQUIRED");
    expect(body.error.detail).toMatchObject({
      category: "authentication",
      client_action: "reauthorize",
      internal_code: "MCP_CREDENTIAL_REVOKED",
      mcp_error_version: "2026-06-21.phase2.mcp-standard-error-codes-scaffold.v0",
      recoverable: true,
      request_id: "req-mcp-revoked-call",
      retry_after_required: false,
      source_record_id: "mcp_error_auth_required"
    });
  });

  it("serves database runtime capabilities without live queries by default", async () => {
    const response = await app.request("/database/runtime", {
      headers: {
        "x-request-id": "req-database-runtime"
      }
    });
    const body = (await response.json()) as DatabaseRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.provider).toBe("planetscale_postgres");
    expect(body.data.connection_path).toBe("cloudflare_hyperdrive");
    expect(body.data.hyperdrive.binding_name).toBe("AIPHABEE_HYPERDRIVE");
    expect(body.data.hyperdrive.binding_configured).toBe(false);
    expect(body.data.hyperdrive.status).toBe("planned");
    expect(body.data.migration_directory).toBe("deploy/database/migrations");
    expect(body.data.live_queries).toBe(false);
    expect(body.data.live_readiness).toMatchObject({
      requested: false,
      route: "/database/runtime?live=1",
      source_route: "/cloudflare/hyperdrive/schema-inventory"
    });
    expect(body.data.live_readiness.result).toBeUndefined();
    expect(body.data.market_data_surfaces).toBe(false);
  });

  it("rejects database runtime live readiness without the smoke header", async () => {
    const response = await app.request("/database/runtime?live=1", {
      headers: {
        "x-request-id": "req-database-runtime-live-denied"
      }
    });
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-database-runtime-live-denied",
      required_header: "x-aiphabee-smoke",
      route: "GET /database/runtime?live=1",
      status: "forbidden"
    });
  });

  it("reports missing Hyperdrive binding for database runtime live readiness", async () => {
    const response = await app.request("/database/runtime?live=1", {
      headers: {
        "x-aiphabee-smoke": "cloudflare-bindings-runtime-v1",
        "x-request-id": "req-database-runtime-live-missing"
      }
    });
    const body = (await response.json()) as DatabaseRuntimeBody;

    expect(response.status).toBe(424);
    expect(body.ok).toBe(true);
    expect(body.data.live_queries).toBe(false);
    expect(body.data.hyperdrive.status).toBe("missing_binding");
    expect(body.data.live_readiness.result).toMatchObject({
      binding_name: "AIPHABEE_HYPERDRIVE",
      failure_code: "missing_hyperdrive_binding",
      status: "missing_binding",
      surface: "platform_umbrella_schema_inventory"
    });
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
        "platform.account",
        "platform.workspace",
        "platform.workspace_membership",
        "platform.subscription_plan",
        "platform.workspace_subscription",
        "aiphabee_governance.data_entitlement",
        "aiphabee_governance.workspace_entitlement"
      ],
      workspace_isolation: true
    });
    expect(body.data.contract).toBe("deploy/gateway/access.contract.json");
    expect(body.data.data_coverage_release_gate).toMatchObject({
      coverage_policy_loaded: false,
      frontend: false,
      live_partner_data_reads: false,
      persistent_writes: false,
      required_coverage_domains: [
        "corporate_actions",
        "financial_restatements",
        "delistings",
        "identifier_history"
      ],
      required_freshness_tiers: ["realtime", "delayed", "eod"],
      route: "GET /gateway/data-coverage/release-gate",
      runtime_route: "GET /gateway/runtime",
      sql_emitted: false,
      status: "data_coverage_release_gate_scaffold"
    });
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
      live_policy_source_readiness: {
        compiles_partner_matrix_to_db_rows: true,
        compiles_to_gateway_policy: true,
        default_deny_preserved: true,
        external_activation_status: "blocked_external_activation",
        frontend: false,
        live_db_reads: false,
        live_partner_rights_matrix_reads: false,
        persistent_writes: false,
        route: "GET /gateway/field-rights/live-policy-source/readiness",
        runtime_route: "GET /gateway/runtime",
        sql_emitted: false,
        status: "field_rights_live_policy_source_readiness_scaffold"
      },
      operations_config: {
        approval_required: true,
        default_deny_preserved: true,
        effective_time_required: true,
        frontend: false,
        live_db_reads: false,
        persistent_writes: false,
        policy_version_required: true,
        route: "POST /gateway/field-authorizations/changes/plan",
        runtime_route: "GET /gateway/runtime",
        sql_emitted: false,
        status: "field_authorization_config_scaffold"
      },
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
    expect(body.data.guards).toContain("serving_quality_live_readiness");
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
    expect(body.data.p0_rights_matrix_coverage).toMatchObject({
      default_rights_status: "default_deny",
      enterprise_authorization_configured: true,
      export_authorization_configured: true,
      frontend: false,
      live_rights_matrix_reads: false,
      mcp_authorization_configured: true,
      partner_signed_matrix_loaded: false,
      persistent_writes: false,
      required_p0_tool_count: REGISTERED_TOOL_COUNT,
      required_surfaces: ["web", "mcp", "export", "enterprise"],
      route: "GET /gateway/rights-matrix/p0/coverage",
      runtime_route: "GET /gateway/runtime",
      sql_emitted: false,
      status: "p0_rights_matrix_coverage_scaffold",
      web_authorization_configured: true
    });
    expect(body.data.rights_policy_version).toBe("gate0-default-deny-v0");
    expect(body.data.restricted_exports).toMatchObject({
      artifact_writes: false,
      frontend: false,
      high_risk_scope: "exports.read",
      live_data_access: false,
      route: "POST /gateway/exports/plan",
      scope_required: true,
      status: "restricted_export_scaffold",
      supported_formats: ["csv", "image", "pdf"],
      uses_data_access_gateway: true,
      watermark_required: true
    });
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
      serving_quality_live_readiness: {
        fixture_version: "serving-quality-live-readiness@quality-release-fixture-v0",
        frontend: false,
        live_partner_rows_loaded: false,
        live_serving_reads: false,
        live_serving_sql_execution: false,
        persistent_writes: false,
        required_quality_states: ["PASS", "WARN", "HOLD", "REJECT_RAW"],
        route: "GET /gateway/serving-quality/live-readiness",
        runtime_route: "GET /gateway/runtime",
        sql_executed: false,
        status: "serving_quality_live_readiness_scaffold",
        validates_gateway_quality_hold: true,
        validates_release_isolation: true,
        validates_sql_execution_guard: true
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
        "aiphabee_core.serving_dataset",
        "aiphabee_core.serving_field",
        "aiphabee_core.serving_snapshot",
        "aiphabee_core.serving_record"
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
        "aiphabee_core.usage_meter_rule",
        "aiphabee_core.usage_event",
        "aiphabee_core.usage_reconciliation_batch",
        "aiphabee_core.usage_ledger_entry"
      ],
      weighted_credits: true
    });
  });

  it("serves field rights live policy source readiness without live DB reads", async () => {
    const response = await app.request("/gateway/field-rights/live-policy-source/readiness", {
      headers: {
        "x-request-id": "req-field-rights-live-policy-source"
      }
    });
    const body = (await response.json()) as FieldRightsLivePolicySourceReadinessBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("live_policy_source_readiness_passed");
    expect(body.data.live_db_reads).toBe(false);
    expect(body.data.live_partner_rights_matrix_reads).toBe(false);
    expect(body.data.rights_policy_version).toBe("field-rights-live-policy-source-fixture-v0");
    expect(body.data.external_activation).toEqual({
      blockers: [
        "partner_signed_matrix_absent",
        "live_db_read_path_not_enabled",
        "ops_cutover_not_approved"
      ],
      status: "blocked_external_activation"
    });
    expect(body.data.partner_matrix_fixture.matrix_rows).toHaveLength(4);
    expect(body.data.partner_matrix_fixture.signed_external_matrix_loaded).toBe(false);
    expect(body.data.policy_source).toMatchObject({
      rowCounts: {
        dataEntitlements: 4,
        subscriptionRows: 3,
        workspaceEntitlements: 4
      },
      status: "policy_source_scaffold"
    });
    expect(body.data.readiness).toEqual({
      db_rows_compiled: true,
      default_deny_preserved: true,
      partner_matrix_fixture_loaded: true,
      runtime_smoke_passed: true,
      versioned_cache_key_verified: true
    });
    expect(body.data.runtime_smoke).toHaveLength(6);
    expect(body.data.runtime_smoke).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          scenario_id: "developer_mcp_quote_redaction",
          status: "pass"
        }),
        expect.objectContaining({
          scenario_id: "team_export_price_history_allowed",
          status: "pass"
        })
      ])
    );
    expect(body.data.validation).toEqual({
      partner_matrix_rows: 4,
      smoke_count: 6,
      source_records: 8
    });
    expect(body.usage.rows).toBe(6);
  });

  it("serves serving quality live readiness without executing SQL", async () => {
    const response = await app.request("/gateway/serving-quality/live-readiness", {
      headers: {
        "x-request-id": "req-serving-quality-live-readiness"
      }
    });
    const body = (await response.json()) as ServingQualityLiveReadinessBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("serving_quality_live_readiness_passed");
    expect(body.data.live_partner_rows_loaded).toBe(false);
    expect(body.data.live_serving_reads).toBe(false);
    expect(body.data.live_serving_sql_execution).toBe(false);
    expect(body.data.sql_executed).toBe(false);
    expect(body.data.activation).toEqual({
      blockers: [
        "partner_serving_rows_absent",
        "live_hyperdrive_execution_disabled",
        "quality_owner_cutover_not_approved"
      ],
      required_signoffs: ["data_engineering", "data_partner", "quality_owner"],
      status: "blocked_live_serving_activation"
    });
    expect(body.data.readiness).toEqual({
      gateway_quality_hold_guard_passed: true,
      no_blocked_quality_sql_execution: true,
      no_live_reads_or_writes: true,
      release_mapping_passed: true,
      sql_execution_guard_passed: true
    });
    expect(body.data.release_fixture.map((fixture) => fixture.quality_state)).toEqual([
      "PASS",
      "WARN",
      "HOLD",
      "REJECT_RAW"
    ]);
    expect(body.data.quality_release_checks).toHaveLength(4);
    expect(body.data.quality_release_checks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          quality_state: "PASS",
          release_state: "released",
          scenario_id: "pass_snapshot_released_deferred_execution",
          serving_execution_status: "execution_deferred",
          serving_query_status: "query_planned",
          sql_executed: false,
          sql_text_emitted: true,
          status: "pass"
        }),
        expect.objectContaining({
          quality_state: "HOLD",
          gateway_error_code: "DATA_QUALITY_HOLD",
          gateway_status: "quality_hold",
          release_state: "held",
          scenario_id: "hold_snapshot_isolated_before_sql",
          serving_execution_status: "execution_blocked",
          serving_query_status: "query_blocked",
          sql_executed: false,
          sql_text_emitted: false,
          sql_text_status: "sql_text_blocked",
          status: "pass"
        }),
        expect.objectContaining({
          quality_state: "REJECT_RAW",
          gateway_error_code: "DATA_QUALITY_HOLD",
          gateway_status: "quality_hold",
          release_state: "withdrawn",
          scenario_id: "reject_raw_snapshot_withdrawn_before_sql",
          serving_execution_status: "execution_blocked",
          serving_query_status: "query_blocked",
          sql_executed: false,
          sql_text_emitted: false,
          sql_text_status: "sql_text_blocked",
          status: "pass"
        })
      ])
    );
    expect(body.data.validation).toEqual({
      blocked_quality_states: 2,
      quality_state_count: 4,
      smoke_count: 4
    });
    expect(body.usage.rows).toBe(4);
  });

  it("serves P0 rights matrix coverage with default-deny release gate", async () => {
    const response = await app.request("/gateway/rights-matrix/p0/coverage", {
      headers: {
        "x-request-id": "req-p0-rights-matrix"
      }
    });
    const body = (await response.json()) as P0RightsMatrixCoverageBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      default_rights_status: "default_deny",
      live_rights_matrix_reads: false,
      persistent_writes: false,
      rights_policy_version: "gate0-default-deny-v0",
      sql_emitted: false,
      status: "p0_rights_matrix_coverage_scaffold"
    });
    expect(body.data.capability).toMatchObject({
      required_p0_tool_count: REGISTERED_TOOL_COUNT,
      route: "GET /gateway/rights-matrix/p0/coverage",
      status: "p0_rights_matrix_coverage_scaffold"
    });
    expect(body.data.tool_coverage).toHaveLength(REGISTERED_TOOL_COUNT);
    expect(body.data.tool_coverage.map((item) => item.tool_name)).toEqual(
      expect.arrayContaining(["resolve_security", "get_quote_snapshot", "get_entitlements"])
    );
    expect(body.data.dataset_field_coverage.map((item) => item.dataset)).toEqual(
      expect.arrayContaining(["security_master", "price_history", "financial_facts"])
    );
    expect(body.data.surface_coverage).toMatchObject({
      enterprise: {
        configured: true,
        default_rights_status: "default_deny"
      },
      export: {
        configured: true,
        default_rights_status: "default_deny"
      },
      mcp: {
        configured: true,
        default_rights_status: "default_deny"
      },
      web: {
        configured: true,
        default_rights_status: "default_deny"
      }
    });
    expect(body.data.release_gate).toMatchObject({
      gate_status: "blocked_external_rights_matrix",
      partner_signed_matrix_loaded: false,
      required_signoffs: ["data_partner", "commercial_owner", "legal_compliance"]
    });
    expect(body.data.validation).toMatchObject({
      all_required_surfaces_configured: true,
      required_p0_tool_count: REGISTERED_TOOL_COUNT,
      tool_count: REGISTERED_TOOL_COUNT,
      tool_count_matches_registry: true
    });
    expect(body.usage.rows).toBe(
      body.data.tool_coverage.length + body.data.dataset_field_coverage.length
    );
  });

  it("serves data coverage release gate for freshness and coverage labels", async () => {
    const response = await app.request("/gateway/data-coverage/release-gate", {
      headers: {
        "x-request-id": "req-data-coverage-release-gate"
      }
    });
    const body = (await response.json()) as DataCoverageReleaseGateBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      coverage_policy_version: "coverage-policy-scaffold-v0",
      live_partner_data_reads: false,
      persistent_writes: false,
      sql_emitted: false,
      status: "data_coverage_release_gate_scaffold"
    });
    expect(body.data.capability).toMatchObject({
      route: "GET /gateway/data-coverage/release-gate",
      status: "data_coverage_release_gate_scaffold"
    });
    expect(body.data.freshness_markers.map((marker) => marker.tier)).toEqual([
      "realtime",
      "delayed",
      "eod"
    ]);
    expect(body.data.freshness_markers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label_required: true,
          live_partner_rows_loaded: false,
          min_delay_minutes: 15,
          tier: "delayed"
        })
      ])
    );
    expect(body.data.coverage_domains.map((domain) => domain.domain)).toEqual([
      "corporate_actions",
      "financial_restatements",
      "delistings",
      "identifier_history"
    ]);
    expect(body.data.coverage_domains).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          domain: "identifier_history",
          evidence_surfaces: ["resolve_security", "get_security_history"],
          live_partner_rows_loaded: false,
          status: "scaffold_covered_no_live_partner_rows"
        })
      ])
    );
    expect(body.data.release_gate).toMatchObject({
      blockers: [
        "partner_coverage_files_missing",
        "live_freshness_policy_not_loaded",
        "golden_coverage_not_signed_off"
      ],
      gate_status: "blocked_live_partner_coverage",
      live_partner_coverage_loaded: false,
      required_signoffs: ["data_engineering", "data_partner", "quality_owner"]
    });
    expect(body.data.validation).toMatchObject({
      all_required_coverage_domains_present: true,
      all_required_freshness_tiers_present: true,
      coverage_domain_count: 4,
      freshness_tier_count: 3
    });
    expect(body.usage.rows).toBe(7);
  });

  it("plans operational field authorization changes with approval and effective time", async () => {
    const response = await app.request("/gateway/field-authorizations/changes/plan", {
      body: JSON.stringify({
        approval_status: "approved",
        approved_by: "compliance_001",
        as_of: "2026-06-21T00:00:00.000Z",
        channel: "mcp",
        dataset: "hk_equity_quote",
        effective_at: "2026-06-22T00:00:00.000Z",
        export_allowed: false,
        field_pattern: "quote.close",
        max_window_days: 31,
        operator_id: "ops_001",
        plan: "developer",
        policy_version: "rights-policy-20260622",
        reason: "Developer MCP delayed close authorization",
        target_status: "approved",
        workspace_id: "ws_developer_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-field-auth-config"
      },
      method: "POST"
    });
    const body = (await response.json()) as FieldAuthorizationConfigPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      default_deny_preserved: true,
      frontend: false,
      live_db_reads: false,
      persistent_writes: false,
      request_id: "req-field-auth-config",
      sql_emitted: false,
      status: "scheduled"
    });
    expect(body.data.approval).toMatchObject({
      required: true,
      status: "approved",
      table: "aiphabee_audit.field_authorization_approval",
      write_status: "planned_no_write"
    });
    expect(body.data.change).toMatchObject({
      channel: "mcp",
      dataset: "hk_equity_quote",
      effective_at: "2026-06-22T00:00:00.000Z",
      field_pattern: "quote.close",
      operator_id: "ops_001",
      plan: "developer",
      policy_version: "rights-policy-20260622",
      target_status: "approved",
      table: "aiphabee_core.field_authorization_change",
      workspace_id: "ws_developer_alpha",
      write_status: "planned_no_write"
    });
    expect(body.data.policy_effect).toMatchObject({
      activation_status: "scheduled",
      compiles_to_gateway_policy: true,
      data_entitlement_row: {
        channel: "mcp",
        dataset: "hk_equity_quote",
        field_pattern: "quote.close",
        rights_policy_version: "rights-policy-20260622",
        status: "approved",
        table: "aiphabee_governance.data_entitlement"
      },
      versioned_cache_key_required: true,
      workspace_entitlement_row: {
        table: "aiphabee_governance.workspace_entitlement",
        valid_from: "2026-06-22T00:00:00.000Z",
        workspace_id: "ws_developer_alpha"
      }
    });
    expect(body.data.validation).toEqual({
      approval_required: true,
      effective_time_required: true,
      policy_version_required: true,
      required_context_present: true
    });
    expect(body.data.capability.status).toBe("field_authorization_config_scaffold");
    expect(body.usage.rows).toBe(1);
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
        "platform.account",
        "platform.workspace",
        "platform.workspace_membership",
        "platform.subscription_plan",
        "platform.workspace_subscription",
        "aiphabee_governance.data_entitlement",
        "aiphabee_governance.workspace_entitlement"
      ],
      workspace_isolation: true
    });
    expect(body.data.corporate_actions).toMatchObject({
      adjustment_types: ["raw", "split_adjusted", "total_return_adjusted"],
      benchmark_parity: {
        live_partner_data: false,
        live_serving_reads: false,
        minimum_complex_cases: 20,
        partner_reference_cases: 10,
        public_reference_cases: 10,
        sample_count: 20,
        status: "benchmark_parity_scaffold"
      },
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
        "aiphabee_core.corporate_action",
        "aiphabee_core.adjustment_methodology",
        "aiphabee_core.price_adjustment_factor"
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
        "aiphabee_core.financial_statement",
        "aiphabee_core.financial_fact",
        "aiphabee_core.financial_restatement"
      ]
    });
    expect(body.data.live_queries).toBe(false);
    expect(body.data.market_data_loaded).toBe(false);
    expect(body.data.security_master.status).toBe("schema_scaffold");
    expect(body.data.security_master.tables).toEqual([
      "aiphabee_core.company",
      "aiphabee_core.instrument",
      "aiphabee_core.listing",
      "aiphabee_core.identifier_history"
    ]);
    expect(body.data.raw_snapshots).toMatchObject({
      immutable: true,
      quality_default_state: "HOLD",
      table: "aiphabee_core.raw_snapshot"
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
        "aiphabee_core.serving_dataset",
        "aiphabee_core.serving_field",
        "aiphabee_core.serving_snapshot",
        "aiphabee_core.serving_record"
      ]
    });
    expect(body.data.source_batches.rights_default_state).toBe("default_deny");
    expect(body.data.data_version_batches.live_batches).toBe(false);
  });

  it("serves market domain runtime capabilities without live data access", async () => {
    const response = await app.request("/market-data/domains/runtime", {
      headers: {
        "x-request-id": "req-market-domain-runtime"
      }
    });
    const body = (await response.json()) as MarketDomainRuntimeBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      auth_required: true,
      default_rights_status: "default_deny",
      frontend: false,
      live_data_access: false,
      persistent_writes: false,
      route: "GET /market-data/domains/runtime",
      runtime_route: "GET /market-data/domains/runtime",
      sql_emitted: false,
      status: "hk_data_domains_cross_market_scaffold"
    });
    expect(body.data.cross_market_plan).toMatchObject({
      data_gateway_required: true,
      point_in_time_required: true,
      rights_matrix_required: true,
      route: "POST /market-data/domains/cross-market/plan",
      status: "hk_data_domains_cross_market_scaffold"
    });
    expect(body.data.cross_market_plan.allowed_domains).toContain("ipo_pipeline");
    expect(body.data.cross_market_plan.allowed_markets).toEqual(["HK", "CN_A", "US", "SG"]);
    expect(body.usage.rows).toBe(0);
  });

  it("plans HK data domain coverage and cross-market mappings without writes", async () => {
    const response = await app.request("/market-data/domains/cross-market/plan", {
      body: JSON.stringify({
        as_of: "2026-06-22",
        comparison_markets: ["CN_A", "US"],
        mapping_types: ["dual_listing", "currency_normalization", "trading_calendar_alignment"],
        requested_domains: ["ipo_pipeline", "stock_connect_flow", "warrants_cbbc"],
        rights_matrix_version: "rights-matrix-2026-06-22",
        workspace_id: "ws_market_domain_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-market-domain-plan"
      },
      method: "POST"
    });
    const body = (await response.json()) as HkDataDomainsCrossMarketPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      frontend: false,
      live_data_access: false,
      persistent_writes: false,
      request_id: "req-market-domain-plan",
      sql_emitted: false,
      status: "planned_no_write",
      workspace_id: "ws_market_domain_alpha"
    });
    expect(body.data.coverage_contract).toMatchObject({
      default_deny_until_authorized: true,
      phase4_source: "docs/researches/AiphaBee_PRD_v1.0.md#18.5",
      point_in_time_required: true,
      prd_data_domain_source: "docs/researches/AiphaBee_PRD_v1.0.md#10.2"
    });
    expect(body.data.coverage_contract.methodology_fields_required).toEqual([
      "published_at",
      "effective_at",
      "ingested_at",
      "data_version",
      "methodology_version"
    ]);
    expect(body.data.data_domains).toHaveLength(3);
    expect(body.data.data_domains[0]).toMatchObject({
      domain: "ipo_pipeline",
      live_data_loaded: false,
      market: "HK",
      point_in_time_required: true,
      rights_state: "default_deny",
      status: "planned_no_write",
      table: "aiphabee_core.hk_ipo_pipeline_event"
    });
    expect(body.data.cross_market).toMatchObject({
      analytics_comparison_route: "POST /analytics/compare-securities",
      base_market: "HK",
      calendar_alignment_route: "POST /tools/get-market-calendar",
      comparison_markets: ["CN_A", "US"],
      mapping_types: ["dual_listing", "currency_normalization", "trading_calendar_alignment"],
      security_resolution_route: "POST /tools/resolve-security"
    });
    expect(body.data.cross_market.mapping_items).toContainEqual(
      expect.objectContaining({
        comparison_market: "US",
        fx_rate_required: true,
        live_mapping_enabled: false,
        mapping_type: "currency_normalization",
        rights_state: "default_deny",
        status: "planned_no_write"
      })
    );
    expect(body.data.rights).toMatchObject({
      default_deny_until_authorized: true,
      external_redistribution_allowed: false,
      export_allowed: false,
      field_authorization_required: true,
      mcp_redistribution_allowed: false,
      rights_matrix_required: true,
      rights_matrix_version: "rights-matrix-2026-06-22"
    });
    expect(body.data.capability.status).toBe("hk_data_domains_cross_market_scaffold");
    expect(body.usage.rows).toBe(9);
  });

  it("blocks HK data domain planning without a rights matrix", async () => {
    const response = await app.request("/market-data/domains/cross-market/plan", {
      body: JSON.stringify({
        comparison_markets: ["CN_A"],
        requested_domains: ["ipo_pipeline"],
        workspace_id: "ws_market_domain_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-market-domain-missing-rights"
      },
      method: "POST"
    });
    const body = (await response.json()) as HkDataDomainsCrossMarketPlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("blocked_rights_matrix_required");
    expect(body.data.validation.rights_matrix_present).toBe(false);
    expect(body.data.data_domains[0]?.status).toBe("not_requested");
    expect(body.usage.rows).toBe(0);
  });

  it("blocks unsupported HK data domains before planning cross-market coverage", async () => {
    const response = await app.request("/market-data/domains/cross-market/plan", {
      body: JSON.stringify({
        comparison_markets: ["CN_A"],
        requested_domains: ["ipo_pipeline", "crypto_order_book"],
        rights_matrix_version: "rights-matrix-2026-06-22",
        workspace_id: "ws_market_domain_alpha"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-market-domain-unsupported"
      },
      method: "POST"
    });
    const body = (await response.json()) as HkDataDomainsCrossMarketPlanBody;

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("blocked_unsupported_domain");
    expect(body.data.validation.unsupported_domains).toEqual(["crypto_order_book"]);
    expect(body.data.persistent_writes).toBe(false);
    expect(body.usage.rows).toBe(0);
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

  it("plans restricted CSV exports with field redaction, row policy, and watermark", async () => {
    const response = await app.request("/gateway/exports/plan", {
      body: JSON.stringify({
        dataset: "synthetic_profile",
        fields: [
          "synthetic_profile.company_name",
          "synthetic_profile.revenue"
        ],
        format: "csv",
        plan: "pro",
        requested_rows: 20,
        scopes: ["exports.read"],
        time_range: {
          from: "2024-01-01",
          to: "2024-01-31"
        },
        workspace_id: "ws_synthetic_export"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-restricted-export"
      },
      method: "POST"
    });
    const body = (await response.json()) as RestrictedExportPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      artifact: {
        csv: "planned_no_write",
        generated: false,
        image: "not_requested",
        pdf: "not_requested",
        r2_write: false
      },
      live_data_access: false,
      persistent_writes: false,
      row_policy: {
        max_rows: 100,
        requested_rows: 20,
        served_rows: 20
      },
      scope: {
        granted: true,
        required: "exports.read"
      },
      status: "planned_no_write",
      toolName: "restricted_export_plan",
      watermark: {
        required: true
      }
    });
    expect(body.data.gateway_decision).toMatchObject({
      allowed_fields: ["synthetic_profile.company_name"],
      denied_fields: [
        {
          field: "synthetic_profile.revenue",
          reason: "field_default_deny"
        }
      ],
      export_requested: true,
      status: "allow_with_redactions"
    });
    expect(body.data.capability).toMatchObject({
      high_risk_scope: "exports.read",
      route: "POST /gateway/exports/plan",
      scope_required: true,
      status: "restricted_export_scaffold",
      watermark_required: true
    });
    expect(body.data.watermark.text).toContain("req-restricted-export");
    expect(body.usage.rows).toBe(20);
  });

  it("blocks restricted exports without exports.read or over row limits", async () => {
    const missingScope = await app.request("/gateway/exports/plan", {
      body: JSON.stringify({
        dataset: "synthetic_profile",
        fields: ["synthetic_profile.company_name"],
        format: "pdf",
        plan: "pro",
        requested_rows: 1,
        scopes: [],
        workspace_id: "ws_synthetic_export"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-restricted-export-no-scope"
      },
      method: "POST"
    });
    const tooManyRows = await app.request("/gateway/exports/plan", {
      body: JSON.stringify({
        dataset: "synthetic_profile",
        fields: ["synthetic_profile.company_name"],
        format: "image",
        plan: "pro",
        requestedRows: 101,
        scopes: ["exports.read"],
        workspaceId: "ws_synthetic_export"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-restricted-export-too-many"
      },
      method: "POST"
    });
    const missingScopeBody = (await missingScope.json()) as ErrorBody;
    const tooManyRowsBody = (await tooManyRows.json()) as ErrorBody;

    expect(missingScope.status).toBe(403);
    expect(missingScopeBody.error.code).toBe("SCOPE_DENIED");
    expect(tooManyRows.status).toBe(400);
    expect(tooManyRowsBody.error.code).toBe("TOO_MANY_ROWS");
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
      "github_actions"
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

  it("rejects the AI Gateway live smoke route without the smoke header", async () => {
    const response = await app.request("/agent/model-provider/live-smoke", {
      headers: {
        "x-request-id": "req-model-provider-live-denied"
      },
      method: "POST"
    });
    const body = (await response.json()) as ModelProviderLiveSmokeBody;

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-model-provider-live-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /agent/model-provider/live-smoke",
      status: "forbidden"
    });
  });

  it("reports missing env for the AI Gateway live smoke route without secrets", async () => {
    const response = await app.request("/agent/model-provider/live-smoke", {
      headers: {
        "x-aiphabee-smoke": "model-provider-live-v1",
        "x-request-id": "req-model-provider-live-missing"
      },
      method: "POST"
    });
    const body = (await response.json()) as ModelProviderLiveSmokeBody;

    expect(response.status).toBe(424);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      missing_env: [
        "CLOUDFLARE_ACCOUNT_ID",
        "CLOUDFLARE_API_TOKEN or AI_GATEWAY_LIVE_SMOKE_TOKEN",
        "AI_GATEWAY_NAME",
        "AI_GATEWAY_SMOKE_MODEL"
      ],
      request_id: "req-model-provider-live-missing",
      route: "POST /agent/model-provider/live-smoke",
      status: "missing_env"
    });
    expect(body.response_hash).toMatch(/^sha256:[a-f0-9]{64}$/u);
  });

  it("runs the AI Gateway live smoke route through generateText and streamText", async () => {
    const { calls, fetch } = createOpenAiCompatibleMockFetch();
    vi.stubGlobal("fetch", fetch);

    const response = await app.request(
      "/agent/model-provider/live-smoke",
      {
        headers: {
          "x-aiphabee-smoke": "model-provider-live-v1",
          "x-request-id": "req-model-provider-live-ok"
        },
        method: "POST"
      },
      {
        AI_GATEWAY_NAME: "default",
        AI_GATEWAY_SMOKE_MODEL: "@cf/aiphabee/synthetic-model",
        CLOUDFLARE_ACCOUNT_ID: "synthetic-account-id",
        CLOUDFLARE_API_TOKEN: "synthetic-token"
      }
    );
    const body = (await response.json()) as ModelProviderLiveSmokeBody;
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-model-provider-live-ok",
      route: "POST /agent/model-provider/live-smoke",
      status: "ok"
    });
    expect(body.response_hash).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(body.model_provider_result).toMatchObject({
      http_status: 200,
      http_statuses: [200, 200],
      method: "ai_sdk_openai_compatible",
      operation_count: 2,
      provider: "cloudflare_ai_gateway",
      status: "ok"
    });
    expect(body.model_provider_result?.generate_text).toMatchObject({
      api: "generateText",
      exact_output_match: true,
      input_tokens: 2,
      output_tokens: 3,
      status: "passed",
      total_tokens: 5
    });
    expect(body.model_provider_result?.stream_text).toMatchObject({
      api: "streamText",
      chunk_count: 1,
      exact_output_match: true,
      input_tokens: 2,
      output_tokens: 3,
      status: "passed",
      total_tokens: 5
    });
    expect(calls).toHaveLength(2);
    expect(calls.every((call) => call.url.endsWith("/ai/v1/chat/completions"))).toBe(true);
    expect(calls.every((call) => call.headers["cf-aig-gateway-id"] === "default")).toBe(true);
    expect(calls.map((call) => call.body.stream)).toEqual([undefined, true]);
    expect(serialized).not.toContain("synthetic-token");
    expect(serialized).not.toContain("synthetic-account-id");
    expect(serialized).not.toContain("@cf/aiphabee/synthetic-model");
    expect(serialized).not.toContain("AIPHABEE_AI_GATEWAY_SMOKE_OK");
  });

  it("runs the AI Gateway live smoke route with a smoke-only token secret", async () => {
    const { calls, fetch } = createOpenAiCompatibleMockFetch();
    vi.stubGlobal("fetch", fetch);

    const response = await app.request(
      "/agent/model-provider/live-smoke",
      {
        headers: {
          "x-aiphabee-smoke": "model-provider-live-v1",
          "x-request-id": "req-model-provider-live-smoke-token"
        },
        method: "POST"
      },
      {
        AI_GATEWAY_LIVE_SMOKE_TOKEN: "synthetic-smoke-token",
        AI_GATEWAY_NAME: "default",
        AI_GATEWAY_SMOKE_MODEL: "@cf/aiphabee/synthetic-model",
        CLOUDFLARE_ACCOUNT_ID: "synthetic-account-id"
      }
    );
    const body = (await response.json()) as ModelProviderLiveSmokeBody;
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.model_provider_result?.status).toBe("ok");
    expect(calls).toHaveLength(2);
    expect(serialized).not.toContain("synthetic-smoke-token");
    expect(serialized).not.toContain("synthetic-account-id");
    expect(serialized).not.toContain("@cf/aiphabee/synthetic-model");
  });

  it("rejects the parse-chart-image live smoke route without the smoke header", async () => {
    const response = await app.request("/agent/tools/parse-chart-image/live-smoke", {
      headers: {
        "x-request-id": "req-parse-chart-image-denied"
      },
      method: "POST"
    });
    const body = (await response.json()) as ParseChartImageLiveSmokeBody;

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-parse-chart-image-denied",
      required_header: "x-aiphabee-smoke",
      route: "POST /agent/tools/parse-chart-image/live-smoke",
      status: "forbidden"
    });
  });

  it("reports missing env for the parse-chart-image live smoke route without secrets", async () => {
    const response = await app.request("/agent/tools/parse-chart-image/live-smoke", {
      headers: {
        "x-aiphabee-smoke": "parse-chart-image-live-v1",
        "x-request-id": "req-parse-chart-image-missing"
      },
      method: "POST"
    });
    const body = (await response.json()) as ParseChartImageLiveSmokeBody;

    expect(response.status).toBe(424);
    expect(body).toMatchObject({
      missing_env: [
        "AIPHABEE_PARSE_CHART_IMAGE_LIVE_SMOKE_TOKEN",
        "CLOUDFLARE_ACCOUNT_ID",
        "CLOUDFLARE_API_TOKEN or AI_GATEWAY_LIVE_SMOKE_TOKEN",
        "AI_GATEWAY_NAME"
      ],
      request_id: "req-parse-chart-image-missing",
      status: "missing_env"
    });
    expect(body.response_hash).toMatch(/^sha256:[a-f0-9]{64}$/u);
  });

  it("rejects the parse-chart-image live smoke route without the bearer secret", async () => {
    const response = await app.request(
      "/agent/tools/parse-chart-image/live-smoke",
      {
        headers: {
          "x-aiphabee-smoke": "parse-chart-image-live-v1",
          "x-request-id": "req-parse-chart-image-unauthorized"
        },
        method: "POST"
      },
      {
        AI_GATEWAY_NAME: "default",
        AIPHABEE_PARSE_CHART_IMAGE_LIVE_SMOKE_TOKEN: "synthetic-parse-chart-token",
        CLOUDFLARE_ACCOUNT_ID: "synthetic-account-id",
        CLOUDFLARE_API_TOKEN: "synthetic-token"
      }
    );
    const body = (await response.json()) as ParseChartImageLiveSmokeBody;

    expect(response.status).toBe(403);
    expect(body).toMatchObject({
      required_authorization: "Bearer AIPHABEE_PARSE_CHART_IMAGE_LIVE_SMOKE_TOKEN",
      status: "forbidden"
    });
  });

  it("parses an inline clear-sample image through the vision channel with strict structured outputs", async () => {
    const { calls, fetch } = createChartVisionMockFetch([
      JSON.stringify(CHART_VISION_SAMPLE_RESULT)
    ]);
    vi.stubGlobal("fetch", fetch);

    const response = await app.request(
      "/agent/tools/parse-chart-image/live-smoke",
      {
        body: JSON.stringify({
          image_base64: btoa("PNG-BYTES-SMOKE"),
          media_type: "image/png"
        }),
        headers: {
          authorization: "Bearer synthetic-parse-chart-token",
          "content-type": "application/json",
          "x-aiphabee-smoke": "parse-chart-image-live-v1",
          "x-request-id": "req-parse-chart-image-ok"
        },
        method: "POST"
      },
      {
        AI_GATEWAY_NAME: "default",
        AIPHABEE_PARSE_CHART_IMAGE_LIVE_SMOKE_TOKEN: "synthetic-parse-chart-token",
        CLOUDFLARE_ACCOUNT_ID: "synthetic-account-id",
        CLOUDFLARE_API_TOKEN: "synthetic-token"
      }
    );
    const body = (await response.json()) as ParseChartImageLiveSmokeBody;
    const serialized = JSON.stringify(body);

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body).toMatchObject({
      request_id: "req-parse-chart-image-ok",
      route: "POST /agent/tools/parse-chart-image/live-smoke",
      status: "ok",
      tool_version: "parse-chart-image-tool.v1"
    });
    expect(body.parse_outcome).toMatchObject({
      error_code: null,
      model_call_count: 1,
      repair_applied: false,
      status: "ready",
      usage: {
        input_tokens: 1548,
        output_tokens: 900,
        total_tokens: 2448
      }
    });
    expect(body.parse_outcome?.result?.symbol).toEqual({ confidence: 0.97, value: "0700.HK" });
    expect(body.chart_parse_record).toMatchObject({
      calibration_run_id: null,
      error_code: null,
      image_ref: "smoke/inline-image",
      status: "ready"
    });
    expect(body.chart_parse_record?.keys).toEqual([
      "analysis_run_id",
      "calibration_run_id",
      "error_code",
      "id",
      "image_ref",
      "latency_ms",
      "model_version",
      "prompt_version",
      "result_json",
      "schema_version",
      "status",
      "tenant_id",
      "token_cost"
    ]);
    expect(body.chart_parse_record?.model_version_hash).toMatch(/^sha256:[a-f0-9]{64}$/u);
    expect(body.chart_parse_record?.schema_version).not.toHaveLength(0);
    expect(body.chart_parse_record?.prompt_version).not.toHaveLength(0);

    expect(calls).toHaveLength(1);
    expect(calls[0].url.endsWith("/ai/v1/chat/completions")).toBe(true);
    expect(calls[0].headers["cf-aig-gateway-id"]).toBe("default");
    expect(calls[0].body.model).toBe("google-ai-studio/gemini-2.5-flash");
    expect((calls[0].body.response_format as { type?: string }).type).toBe("json_schema");
    expect(calls[0].body.temperature).toBe(0);
    expect(JSON.stringify(calls[0].body.messages)).toContain("data:image/png;base64");

    expect(serialized).not.toContain("synthetic-token");
    expect(serialized).not.toContain("synthetic-account-id");
    expect(serialized).not.toContain("google-ai-studio/gemini-2.5-flash");
  });

  it("degrades to parse_failed after a single vision retry on unrepairable output", async () => {
    const { calls, fetch } = createChartVisionMockFetch(['{"chart_type": {', '{"chart_type": {']);
    vi.stubGlobal("fetch", fetch);

    const response = await app.request(
      "/agent/tools/parse-chart-image/live-smoke",
      {
        body: JSON.stringify({
          image_base64: btoa("PNG-BYTES-SMOKE")
        }),
        headers: {
          authorization: "Bearer synthetic-parse-chart-token",
          "content-type": "application/json",
          "x-aiphabee-smoke": "parse-chart-image-live-v1",
          "x-request-id": "req-parse-chart-image-degraded"
        },
        method: "POST"
      },
      {
        AI_GATEWAY_NAME: "default",
        AIPHABEE_PARSE_CHART_IMAGE_LIVE_SMOKE_TOKEN: "synthetic-parse-chart-token",
        CLOUDFLARE_ACCOUNT_ID: "synthetic-account-id",
        CLOUDFLARE_API_TOKEN: "synthetic-token"
      }
    );
    const body = (await response.json()) as ParseChartImageLiveSmokeBody;

    expect(response.status).toBe(502);
    expect(body.status).toBe("failed");
    expect(body.parse_outcome).toMatchObject({
      model_call_count: 2,
      result: null,
      status: "parse_failed"
    });
    expect(body.parse_outcome?.error_code).not.toBeNull();
    expect(body.chart_parse_record?.status).toBe("parse_failed");
    expect(calls).toHaveLength(2);
  });

  it("reads image bytes for the parse-chart-image live smoke from the R2 binding", async () => {
    const { calls, fetch } = createChartVisionMockFetch([
      JSON.stringify(CHART_VISION_SAMPLE_RESULT)
    ]);
    vi.stubGlobal("fetch", fetch);

    const response = await app.request(
      "/agent/tools/parse-chart-image/live-smoke",
      {
        body: JSON.stringify({
          image_ref: "charts/smoke-tenant/chart-1.png"
        }),
        headers: {
          authorization: "Bearer synthetic-parse-chart-token",
          "content-type": "application/json",
          "x-aiphabee-smoke": "parse-chart-image-live-v1",
          "x-request-id": "req-parse-chart-image-r2"
        },
        method: "POST"
      },
      {
        AI_GATEWAY_NAME: "default",
        AIPHABEE_ARTIFACTS: {
          delete: async () => undefined,
          get: async (key: string) =>
            key === "charts/smoke-tenant/chart-1.png"
              ? {
                  arrayBuffer: async () => new TextEncoder().encode("PNG_FIXTURE").buffer,
                  httpMetadata: { contentType: "image/png" },
                  text: async () => ""
                }
              : null,
          put: async () => undefined
        },
        AIPHABEE_PARSE_CHART_IMAGE_LIVE_SMOKE_TOKEN: "synthetic-parse-chart-token",
        CLOUDFLARE_ACCOUNT_ID: "synthetic-account-id",
        CLOUDFLARE_API_TOKEN: "synthetic-token"
      }
    );
    const body = (await response.json()) as ParseChartImageLiveSmokeBody;

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.chart_parse_record?.image_ref).toBe("charts/smoke-tenant/chart-1.png");
    expect(body.parse_outcome?.status).toBe("ready");
    expect(calls).toHaveLength(1);
    expect(JSON.stringify(calls[0].body.messages)).toContain("data:image/png;base64");
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
    expect(body.data.performance_availability_release_gate).toMatchObject({
      route: "POST /observability/release-gates/performance-availability/plan",
      status: "performance_availability_release_gate_scaffold",
      targets: {
        core_api_availability_bps: 9990,
        mcp_tool_success_rate_bps: 9950,
        web_first_token_p95_ms: 2500
      }
    });
    expect(body.data.load_dr_incident_drill_release_gate).toMatchObject({
      route: "POST /observability/release-gates/load-dr-incident-drill/plan",
      status: "load_dr_incident_drill_release_gate_scaffold",
      targets: {
        dr_rpo_minutes: 15,
        dr_rto_minutes: 60,
        load_test_max_error_rate_bps: 50,
        load_test_min_peak_rps: 100
      }
    });
    expect(body.data.sinks.every((sink) => sink.live_export_enabled === false)).toBe(
      true
    );
  });

  it("plans performance availability release gate SLO checks without live writes", async () => {
    const response = await app.request(
      "/observability/release-gates/performance-availability/plan",
      {
        body: JSON.stringify({
          as_of: "2026-06-22T01:30:00.000Z"
        }),
        headers: {
          "content-type": "application/json",
          "x-request-id": "req-performance-availability-release-gate"
        },
        method: "POST"
      }
    );
    const body = (await response.json()) as PerformanceAvailabilityReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      as_of: "2026-06-22T01:30:00.000Z",
      capability: {
        route: "POST /observability/release-gates/performance-availability/plan",
        status: "performance_availability_release_gate_scaffold"
      },
      frontend: false,
      live_apm_provider_reads: false,
      live_probe_reads: false,
      live_slo_store_writes: false,
      request_id: "req-performance-availability-release-gate",
      route: "POST /observability/release-gates/performance-availability/plan",
      status: "planned_no_write",
      validation: {
        all_checks_passed: true,
        core_api_availability_target_met: true,
        live_release_claimed: false,
        live_writes_blocked: true,
        mcp_tool_p95_targets_met: true,
        request_id_and_route_coverage_present: true,
        simple_research_completion_p95_target_met: true,
        tool_success_rate_target_met: true,
        web_first_token_p95_target_met: true
      },
      version: "2026-06-22.phase3.performance-availability-release-gate-scaffold.v0"
    });
    expect(body.data.slo_report).toMatchObject({
      status: "synthetic_slo_report_ready"
    });
    expect(body.data.slo_report.route_coverage).toEqual([
      "/health",
      "/mcp",
      "/agent/runs/stream",
      "/agent/runs/plan"
    ]);
    expect(body.data.slo_report.excluded_failure_categories).toEqual([
      "user_input_error",
      "authorization_denied"
    ]);
    expect(body.data.slo_report.observations.map((observation) => observation.metric_id)).toEqual([
      "core_api_availability_bps",
      "mcp_tool_hot_p95_ms",
      "mcp_tool_cold_p95_ms",
      "web_first_token_p95_ms",
      "simple_research_completion_p95_ms",
      "mcp_tool_success_rate_bps"
    ]);
    expect(
      body.data.slo_report.observations.find(
        (observation) => observation.metric_id === "mcp_tool_hot_p95_ms"
      )
    ).toMatchObject({
      observed_value: 720,
      pass: true,
      target_value: 800,
      unit: "milliseconds"
    });
    expect(
      body.data.slo_report.observations.find(
        (observation) => observation.metric_id === "mcp_tool_success_rate_bps"
      )
    ).toMatchObject({
      observed_value: 9970,
      pass: true,
      target_value: 9950,
      unit: "basis_points"
    });
    expect(body.data.release_checks.map((check) => check.check)).toEqual([
      "core_api_availability_target_met",
      "mcp_tool_p95_targets_met",
      "web_first_token_p95_target_met",
      "simple_research_completion_p95_target_met",
      "tool_success_rate_target_met",
      "slo_report_request_id_and_route_coverage_present",
      "live_apm_and_probe_writes_blocked"
    ]);
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.release_gate).toMatchObject({
      blockers: [
        "live_apm_provider_missing",
        "live_probe_scheduler_missing",
        "slo_metric_store_missing",
        "load_test_run_artifact_missing",
        "frontend_first_token_live_measurement_missing",
        "ops_sre_signoff_missing"
      ],
      gate_status: "blocked_live_performance_availability_validation",
      no_live_release_claim: true
    });
    expect(body.usage.rows).toBe(6);
  });

  it("plans load, disaster recovery, and incident drill release gate without live execution", async () => {
    const response = await app.request(
      "/observability/release-gates/load-dr-incident-drill/plan",
      {
        body: JSON.stringify({
          as_of: "2026-06-22T02:00:00.000Z"
        }),
        headers: {
          "content-type": "application/json",
          "x-request-id": "req-load-dr-incident-release-gate"
        },
        method: "POST"
      }
    );
    const body = (await response.json()) as LoadDrIncidentDrillReleaseGatePlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      as_of: "2026-06-22T02:00:00.000Z",
      capability: {
        route: "POST /observability/release-gates/load-dr-incident-drill/plan",
        status: "load_dr_incident_drill_release_gate_scaffold"
      },
      frontend: false,
      live_incident_pager: false,
      live_load_test_runner: false,
      live_restore_execution: false,
      live_status_page_writes: false,
      request_id: "req-load-dr-incident-release-gate",
      route: "POST /observability/release-gates/load-dr-incident-drill/plan",
      status: "planned_no_write",
      validation: {
        all_checks_passed: true,
        communications_and_status_page_drill_present: true,
        dr_restore_rpo_target_met: true,
        dr_restore_rto_target_met: true,
        failover_rollback_plan_present: true,
        incident_drill_completed: true,
        live_execution_and_persistent_writes_blocked: true,
        live_release_claimed: false,
        load_test_artifact_present: true,
        load_test_targets_met: true
      },
      version: "2026-06-22.phase3.load-dr-incident-drill-release-gate-scaffold.v0"
    });
    expect(body.data.drill_report).toMatchObject({
      evidence: {
        dr_rpo_minutes: 10,
        dr_rto_minutes: 45,
        load_test_error_rate_bps: 20,
        load_test_peak_rps: 120,
        measured_from: "synthetic_release_gate_fixture"
      },
      status: "synthetic_drill_report_ready"
    });
    expect(body.data.drill_report.covered_scenarios).toEqual([
      "load_test_peak_traffic",
      "database_restore",
      "worker_failover",
      "rollback",
      "incident_response",
      "status_comms"
    ]);
    expect(body.data.release_checks.map((check) => check.check)).toEqual([
      "load_test_artifact_present",
      "load_test_targets_met",
      "dr_restore_rto_target_met",
      "dr_restore_rpo_target_met",
      "incident_drill_completed",
      "failover_rollback_plan_present",
      "communications_and_status_page_drill_present",
      "live_execution_and_persistent_writes_blocked"
    ]);
    expect(body.data.release_checks.every((check) => check.status === "planned_no_write")).toBe(
      true
    );
    expect(body.data.release_gate).toMatchObject({
      blockers: [
        "live_load_test_artifact_missing",
        "live_dr_restore_evidence_missing",
        "live_failover_execution_missing",
        "live_incident_drill_evidence_missing",
        "live_status_page_drill_missing",
        "ops_sre_product_signoff_missing"
      ],
      gate_status: "blocked_live_load_dr_incident_validation",
      no_live_release_claim: true
    });
    expect(body.usage.rows).toBe(8);
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

  it("streams no-model public agent progress events without exposing chain-of-thought", async () => {
    const response = await app.request("/agent/runs/stream", {
      body: JSON.stringify({
        prompt: "Explain 00700.HK trend",
        tools: ["resolve_security", "get_financial_facts"]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-stream-progress"
      },
      method: "POST"
    });
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(response.headers.get("x-aiphabee-run-id")).toBe("dry_req-stream-progress");
    expect(Number(response.headers.get("x-aiphabee-progress-event-count"))).toBeGreaterThan(3);
    expect(body).toContain("event: run.started");
    expect(body).toContain("event: tool.step.planned");
    expect(body).toContain("event: tool.call.started");
    expect(body).toContain("event: tool.call.completed");
    expect(body).toContain("event: run.completed");
    expect(body).toContain("\"execution\":\"streaming_no_model\"");
    expect(body).toContain("\"execution\":\"planned_no_call\"");
    expect(body).not.toContain("Explain 00700.HK trend");
  });

  it("creates an agent dry-run skeleton", async () => {
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => undefined);
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
    const auditEvent = consoleInfo.mock.calls
      .map(
        ([message]) =>
          JSON.parse(String(message)) as {
            audit?: Record<string, unknown>;
            event_type?: string;
          }
      )
      .find((event) => event.event_type === "run.audit");

    expect(auditEvent?.audit).toMatchObject({
      data_version: "agent-runtime-scaffold-v0",
      estimated_cost_usd: 0,
      input_tokens: 0,
      latency_ms: 0,
      model_calls: false,
      model_id: "dry_run_no_model",
      model_provider: "not_configured",
      model_tier: "dry_run",
      model_version: "dry_run_no_model_provider",
      output_tokens: 0,
      total_tokens: 0,
      user_id: "user_internal_alpha",
      workspace_id: "workspace_research"
    });
    expect(auditEvent?.audit?.tool_versions).toEqual([
      {
        tool_name: "resolve_security",
        tool_version: "0.0.0"
      },
      {
        tool_name: "get_financial_facts",
        tool_version: "0.0.0"
      }
    ]);
    expect(auditEvent?.audit?.tool_calls).toEqual([
      expect.objectContaining({
        status: "planned_no_execution",
        tool_name: "resolve_security",
        tool_version: "0.0.0"
      }),
      expect.objectContaining({
        status: "planned_no_execution",
        tool_name: "get_financial_facts",
        tool_version: "0.0.0"
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
        response_depth: "newbie",
        response_locale: "en",
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
    expect(body.data.answer_evidence_contract.presentation).toMatchObject({
      default_locale: "zh-Hant",
      default_response_depth: "professional",
      frontend_rendering: false,
      locale: "en",
      locale_switch_invariant: {
        currency: true,
        data_values: true,
        evidence_card_refs: true,
        methodology_versions: true,
        numeric_precision: true,
        source_record_ids: true,
        units: true
      },
      model_calls: false,
      response_depth: "newbie",
      response_depth_invariant: {
        conclusion: true,
        currency: true,
        data_values: true,
        evidence_card_refs: true,
        methodology_versions: true,
        source_record_ids: true,
        units: true
      },
      response_depth_policy: {
        newbie_adds_examples: true,
        newbie_requires_plain_language_definition: true,
        professional_can_show_raw_formula_and_source_fields: true
      },
      supported_locales: ["zh-Hant", "zh-Hans", "en"],
      supported_response_depths: ["newbie", "professional"],
      terminology_policy: {
        bilingual_terms_required: true,
        same_glossary_for_all_locales: true,
        unknown_terms_use_source_label: true
      },
      version: "2026-06-21.phase3.localized-response-contract.v0"
    });
    expect(body.data.answer_evidence_contract.presentation.terminology_glossary).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          en: "operating profit",
          metric_id: "operating_profit",
          methodology_note_required: true,
          source_record_required_when_numeric: true,
          zh_hans: "经营利润",
          zh_hant: "經營利潤"
        }),
        expect.objectContaining({
          en: "total-return adjusted",
          metric_id: "total_return_adjusted",
          zh_hans: "总回报调整",
          zh_hant: "總回報調整"
        })
      ])
    );
    expect(body.data.answer_evidence_contract.presentation.validation_rules).toEqual([
      "require_locale_in_zh_hant_zh_hans_en",
      "preserve_numeric_values_across_locale_switch",
      "preserve_source_record_ids_across_locale_switch",
      "preserve_methodology_versions_across_locale_switch",
      "preserve_conclusion_and_evidence_across_response_depth",
      "require_bilingual_financial_terms",
      "require_methodology_note_for_financial_terms"
    ]);
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
      post_generation_validation: "local_deterministic",
      status: "guarded_no_actual_results",
      validation_rules: [
        "extract_numeric_claims",
        "require_tool_result_or_calculation_ref",
        "block_model_memory_numbers",
        "label_missing_numbers_unknown"
      ],
      version: "2026-06-21.phase1.numeric-source-guard-scaffold.v0"
    });
    expect(body.data.post_generation_evidence_binding).toMatchObject({
      allowed_binding_refs: ["evidence_card", "source_record", "deterministic_calculation"],
      failure_code: "UNSOURCED_NUMERIC_CLAIM",
      route: "POST /agent/runs/validate-answer",
      status: "validator_ready",
      version: "2026-06-22.phase3.post-generation-evidence-binding.v0"
    });
    expect(body.data.numeric_source_guard.post_generation_evidence_binding).toMatchObject({
      live_evidence_binding: false,
      local_deterministic_validation: true,
      model_calls: false,
      route: "POST /agent/runs/validate-answer",
      status: "validator_ready"
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
      registered_tool_count: REGISTERED_TOOL_COUNT,
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
      transport: "server_sent_events"
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

  it("validates post-generation answer evidence binding over HTTP", async () => {
    const blockedResponse = await app.request("/agent/runs/validate-answer", {
      body: JSON.stringify({
        claims: [
          {
            claim_id: "claim_unsourced_revenue",
            label: "fact",
            text: "00700.HK revenue grew 12.4% to HK$100.2 billion."
          }
        ]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-validate-answer-block"
      },
      method: "POST"
    });
    const blockedBody = (await blockedResponse.json()) as {
      data: {
        blocked_claim_count: number;
        failure_code?: string;
        live_evidence_binding: boolean;
        model_calls: boolean;
        numeric_claims: Array<{
          binding_status: string;
          claim_id: string;
          missing_fields: string[];
          numeric_values: string[];
        }>;
        output_allowed: boolean;
        route: string;
        status: string;
        version: string;
      };
      ok: true;
      usage: {
        rows: number;
      };
    };

    expect(blockedResponse.status).toBe(200);
    expect(blockedResponse.headers.get("cache-control")).toBe("no-store");
    expect(blockedBody.ok).toBe(true);
    expect(blockedBody.data).toMatchObject({
      blocked_claim_count: 1,
      failure_code: "UNSOURCED_NUMERIC_CLAIM",
      live_evidence_binding: false,
      model_calls: false,
      output_allowed: false,
      route: "POST /agent/runs/validate-answer",
      status: "blocked_unsourced_numeric_claim",
      version: "2026-06-22.phase3.post-generation-evidence-binding.v0"
    });
    expect(blockedBody.data.numeric_claims[0]).toMatchObject({
      binding_status: "missing_source_binding",
      claim_id: "claim_unsourced_revenue",
      missing_fields: ["source_record_id", "data_version", "methodology_version"]
    });
    expect(blockedBody.data.numeric_claims[0].numeric_values).toEqual(
      expect.arrayContaining(["12.4%", "HK$100.2 billion"])
    );
    expect(blockedBody.usage.rows).toBe(1);

    const allowedResponse = await app.request("/agent/runs/validate-answer", {
      body: JSON.stringify({
        claims: [
          {
            evidence_card_id: "card_roe",
            label: "fact",
            text: "ROE was 18.2%."
          }
        ],
        evidence_cards: [
          {
            card_id: "card_roe",
            data_version: "synthetic-financial-facts-v0",
            methodology_version: "deterministic-financial-growth-v0",
            source_record_id: "financial-fact-00700-roe-2025"
          }
        ]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-validate-answer-pass"
      },
      method: "POST"
    });
    const allowedBody = (await allowedResponse.json()) as {
      data: {
        blocked_claim_count: number;
        failure_code?: string;
        numeric_claims: Array<{
          binding_status: string;
          evidence_card_id?: string;
          source_record_id?: string;
        }>;
        output_allowed: boolean;
        status: string;
      };
      ok: true;
    };

    expect(allowedResponse.status).toBe(200);
    expect(allowedBody.ok).toBe(true);
    expect(allowedBody.data).toMatchObject({
      blocked_claim_count: 0,
      output_allowed: true,
      status: "passed"
    });
    expect(allowedBody.data.failure_code).toBeUndefined();
    expect(allowedBody.data.numeric_claims[0]).toMatchObject({
      binding_status: "bound_evidence_card",
      evidence_card_id: "card_roe",
      source_record_id: "financial-fact-00700-roe-2025"
    });
  });

  it("degrades ToolLoopAgent planning when the tool kill switch is tripped", async () => {
    const response = await app.request("/agent/runs/plan", {
      body: JSON.stringify({
        kill_switch_reason: "tool provider incident",
        prompt: "Explain 00700.HK revenue and price trend",
        tool_kill_switch: true,
        tools: ["resolve_security", "get_quote_snapshot"]
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-agent-tool-loop-kill-switch"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentToolLoopPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("x-aiphabee-telemetry-event-count")).toBe("2");
    expect(body.ok).toBe(true);
    expect(body.data.status).toBe("degraded_kill_switch");
    expect(body.data.model_calls).toBe(false);
    expect(body.data.actual_tool_execution).toBe(false);
    expect(body.data.kill_switch).toMatchObject({
      decision: {
        degraded: true,
        degradation_mode: "no_model_no_tools",
        model_request_blocked: false,
        safe_degradation_required: true,
        tool_execution_blocked: true
      },
      reason: "tool provider incident",
      switch_state: {
        model_kill_switch: false,
        target: "tool",
        tool_kill_switch: true
      }
    });
    expect(body.data.planned_step_count).toBe(1);
    expect(body.data.steps).toEqual([
      expect.objectContaining({
        phase: "answer_contract",
        public_label: "Return safe degraded response while tool execution is disabled",
        tool_calls: []
      })
    ]);
    expect(body.usage.rows).toBe(1);
  });

  it("plans a resumable Workflow task for long-running Agent work", async () => {
    const response = await app.request("/agent/workflows/tasks/plan", {
      body: JSON.stringify({
        max_steps: 6,
        notification_channels: ["in_app", "email"],
        prompt: "Create a deep report for 00700.HK with cited evidence",
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
        workflow_kind: "deep_report",
        workspace_id: "workspace_research"
      }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-agent-workflow-task"
      },
      method: "POST"
    });
    const body = (await response.json()) as AgentWorkflowTaskPlanBody;

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-aiphabee-telemetry-event-count")).toBe("2");
    expect(response.headers.get("x-aiphabee-telemetry-run-id")).toBe(
      "dry_req-agent-workflow-task"
    );
    expect(response.headers.get("x-aiphabee-workflow-task-id")).toBe(
      "workflow_task_req_agent_workflow_task_deep_report"
    );
    expect(body.ok).toBe(true);
    expect(body.data).toMatchObject({
      actual_workflow_execution: false,
      frontend_rendering: false,
      live_workflow_execution: false,
      persistent_writes: false,
      request_id: "req-agent-workflow-task",
      sql_emitted: false,
      status: "planned_no_write",
      task_id: "workflow_task_req_agent_workflow_task_deep_report",
      task_id_visible: true
    });
    expect(body.data.task).toMatchObject({
      created_from: "agent_tool_loop_plan",
      request_id: "req-agent-workflow-task",
      run_id: "dry_req-agent-workflow-task",
      status: "planned_no_write",
      table: "aiphabee_core.workflow_task",
      task_id: "workflow_task_req_agent_workflow_task_deep_report",
      task_kind: "deep_report",
      user_id: "user_internal_alpha",
      workspace_id: "workspace_research"
    });
    expect(body.data.workflow).toEqual({
      binding: "AIPHABEE_RESEARCH_WORKFLOW",
      execution_ready: false,
      provider: "cloudflare_workflows",
      start_status: "not_started",
      workflow_name: "research-long-running-orchestrator"
    });
    expect(body.data.resume).toMatchObject({
      disconnect_safe: true,
      frontend_can_leave: true,
      resume_handle: "resume_workflow_task_req_agent_workflow_task_deep_report",
      resume_route: "GET /agent/workflows/tasks/:task_id",
      resumable: true,
      state_table: "aiphabee_core.workflow_task_checkpoint"
    });
    expect(body.data.notification).toEqual({
      channels: ["in_app", "email"],
      completion_notification: "planned_no_write",
      event_queue: "AIPHABEE_EVENTS_QUEUE",
      failure_notification: "planned_no_write",
      required: true,
      user_visible: true
    });
    expect(body.data.long_task_boundary).toMatchObject({
      interactive_wall_clock_limit_ms: 30000,
      transfer_reasons: ["task_kind_requires_workflow", "user_can_leave_and_resume"]
    });
    expect(body.data.tool_loop_plan).toMatchObject({
      actual_tool_execution: false,
      model_calls: false,
      planned_step_count: 6,
      run_id: "dry_req-agent-workflow-task",
      status: "planned_no_model"
    });
    expect(body.data.capability).toMatchObject({
      binding: "AIPHABEE_RESEARCH_WORKFLOW",
      route: "POST /agent/workflows/tasks/plan",
      status: "workflow_task_scaffold",
      task_id_visible: true
    });
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

  it("returns IPO workbench snapshots with provenance and sensitive fields redacted", async () => {
    const response = await app.request("/workbench/ipo/snapshot", {
      body: JSON.stringify({ ipo_id: "honeycomb" }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-ipo-snapshot"
      },
      method: "POST"
    });
    const body = (await response.json()) as {
      data: {
        accessPolicy: {
          defaultRightsStatus: string;
          redactedFields: string[];
        };
        cornerstones: Array<{
          amountText: null | string;
          redacted: boolean;
        }>;
        liveDataAccess: boolean;
        offering: {
          hkexCode: string;
        };
        provenance: Array<{
          source: string;
        }>;
        researchSignal: {
          source: string;
          status: string;
        };
      };
      ok: true;
      provenance: Array<{
        source: string;
      }>;
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.offering.hkexCode).toBe("2769");
    expect(body.data.liveDataAccess).toBe(false);
    expect(body.data.accessPolicy.defaultRightsStatus).toBe("default_deny");
    expect(body.data.accessPolicy.redactedFields).toContain("ipo_cornerstone.invest_amount");
    expect(body.data.cornerstones[0]).toMatchObject({
      amountText: null,
      redacted: true
    });
    expect(body.data.researchSignal).toMatchObject({
      source: "aiphabee_research",
      status: "descriptive_signal_not_advice"
    });
    expect(body.provenance.map((item) => item.source)).toContain("ipo-fixture");
  });

  it("screens IPOs through a rights-aware analytics envelope", async () => {
    const response = await app.request("/analytics/screen-ipos", {
      body: JSON.stringify({ has_cornerstone: true, min_oversubscription: 20 }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-screen-ipos"
      },
      method: "POST"
    });
    const body = (await response.json()) as {
      data: {
        accessPolicy: {
          exportAllowed: boolean;
          mcpRedistributionAllowed: boolean;
        };
        rows: Array<{
          id: string;
        }>;
        toolName: string;
        totalRows: number;
      };
      ok: true;
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.toolName).toBe("screen_ipos");
    expect(body.data.rows.map((row) => row.id)).toEqual(["honeycomb", "lotus"]);
    expect(body.data.totalRows).toBe(2);
    expect(body.data.accessPolicy).toMatchObject({
      exportAllowed: false,
      mcpRedistributionAllowed: false
    });
  });

  it("returns IPO calendar events for the listing filter", async () => {
    const response = await app.request("/ipos/calendar?event_type=listing", {
      headers: {
        "x-request-id": "req-ipo-calendar"
      },
      method: "GET"
    });
    const body = (await response.json()) as {
      data: {
        events: Array<{
          eventType: string;
        }>;
        toolName: string;
      };
      ok: true;
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.toolName).toBe("search_ipo_calendar");
    expect(body.data.events.length).toBeGreaterThan(0);
    expect(body.data.events.every((event) => event.eventType === "listing")).toBe(true);
  });

  it.each([
    "/tools/get-ipo-timetable",
    "/tools/get-ipo-offering",
    "/tools/get-ipo-allotment"
  ])("returns NOT_FOUND envelopes for unknown IPO tool lookups at %s", async (route) => {
    const response = await app.request(route, {
      body: JSON.stringify({ ipo_id: "missing-ipo" }),
      headers: {
        "content-type": "application/json",
        "x-request-id": `req-${route.split("/").pop()}-missing`
      },
      method: "POST"
    });
    const body = (await response.json()) as {
      error: {
        code: string;
      };
      ok: false;
    };

    expect(response.status).toBe(404);
    expect(body.ok).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("compares IPOs through the dedicated analytics route", async () => {
    const response = await app.request("/analytics/compare-ipos", {
      body: JSON.stringify({ ipo_ids: ["honeycomb", "lotus", "pearl"] }),
      headers: {
        "content-type": "application/json",
        "x-request-id": "req-compare-ipos"
      },
      method: "POST"
    });
    const body = (await response.json()) as {
      data: {
        rows: Array<{
          ticker: string;
        }>;
        toolName: string;
      };
      ok: true;
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.data.toolName).toBe("compare_ipos");
    expect(body.data.rows.map((row) => row.ticker)).toEqual([
      "2769.HK",
      "2611.HK",
      "2197.HK"
    ]);
  });
});
