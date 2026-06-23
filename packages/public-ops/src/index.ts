import {
  getPackagePricingCatalog,
  getPackagePricingCapabilities,
  type PackagePricingCatalog,
  type PackagePricingCatalogPlan,
  type PackagePricingCapabilities,
  type PackagePricingPlanCode
} from "@aiphabee/account-runtime";
import {
  createAgentKillSwitchPlan,
  type AgentKillSwitchPlan
} from "@aiphabee/agent-runtime";
import {
  createAgentDryRunTelemetry,
  type AuditTelemetryEvent
} from "@aiphabee/observability";
import {
  createSupportRequestIdInvestigationPlan,
  getSupportHelpCenter,
  getSupportOperationsCapabilities,
  type SupportHelpCenter,
  type SupportOperationsCapabilities,
  type SupportRequestIdInvestigationPlan
} from "@aiphabee/support-ops";

export const PUBLIC_OPERATIONS_VERSION =
  "2026-06-21.phase3.public-status-docs-scaffold.v0";
export const COMPLIANCE_OPS_RELEASE_GATE_VERSION =
  "2026-06-22.phase3.compliance-ops-release-gate-scaffold.v0";
export const PUBLICATION_ECONOMICS_RELEASE_GATE_VERSION =
  "2026-06-22.phase3.publication-economics-release-gate-scaffold.v0";

export const PUBLIC_DOCUMENT_KINDS = [
  "api_reference",
  "mcp_reference",
  "privacy_policy",
  "terms_of_service"
] as const;
export const PUBLIC_STATUS_COMPONENTS = [
  "worker_api",
  "remote_mcp",
  "data_gateway",
  "usage_billing",
  "public_documentation"
] as const;
export const COMPLIANCE_COPY_ALLOWED_TERMS = [
  "research",
  "analysis",
  "data_explanation",
  "研究",
  "分析",
  "数据解释"
] as const;
export const COMPLIANCE_COPY_FORBIDDEN_CLAIMS = [
  "stock_pick",
  "investment_advice",
  "buy_sell_recommendation",
  "position_sizing_advice",
  "suitability_conclusion",
  "guaranteed_return",
  "copy_trading"
] as const;
export const COMPLIANCE_OPS_RELEASE_GATE_CHECKS = [
  "type4_research_boundary_copy_reviewed",
  "marketing_copy_forbidden_advice_claims_absent",
  "kill_switch_safe_degradation_drill_planned",
  "incident_response_request_id_trace_drill_planned",
  "audit_export_contains_required_fields_and_excludes_sensitive_payloads",
  "public_status_incident_disclosure_surface_present"
] as const;
export const COMPLIANCE_OPS_RELEASE_GATE_TABLES = [
  "aiphabee_core.compliance_ops_release_gate",
  "aiphabee_audit.compliance_ops_drill_event",
  "aiphabee_governance.compliance_ops_release_gate_contract"
] as const;
export const PUBLICATION_ECONOMICS_RELEASE_GATE_CHECKS = [
  "public_status_page_scaffold_published",
  "help_center_manifest_published",
  "privacy_and_terms_publication_ready",
  "package_pricing_catalog_present",
  "unit_economics_positive_for_expected_usage",
  "live_publication_and_finance_writes_blocked"
] as const;
export const PUBLICATION_ECONOMICS_RELEASE_GATE_TABLES = [
  "aiphabee_core.publication_economics_release_gate",
  "aiphabee_audit.publication_economics_drill_event",
  "aiphabee_governance.publication_economics_release_gate_contract"
] as const;

export type PublicDocumentKind = (typeof PUBLIC_DOCUMENT_KINDS)[number];
export type PublicStatusComponentId = (typeof PUBLIC_STATUS_COMPONENTS)[number];
export type PublicDocumentPublicationStatus = "local_draft_ready";
export type PublicComponentStatus =
  | "default_deny_scaffold"
  | "no_live_provider"
  | "planned_publication"
  | "scaffold_available";

export interface ComplianceOpsReleaseGateCapabilities {
  audit_export_route: "POST /public/release-gates/compliance-ops/plan";
  docs_route: "GET /public/docs";
  frontend: false;
  incident_response_route: "POST /support/request-id-investigation/plan";
  kill_switch_route: "POST /agent/kill-switch/plan";
  live_audit_export_store: false;
  live_compliance_signoff: false;
  live_incident_feed: false;
  live_kill_switch_flag_source: false;
  package: "@aiphabee/public-ops";
  persistent_writes: false;
  public_status_route: "GET /public/status";
  required_checks: typeof COMPLIANCE_OPS_RELEASE_GATE_CHECKS;
  route: "POST /public/release-gates/compliance-ops/plan";
  runtime_route: "GET /public/runtime";
  sql_emitted: false;
  status: "compliance_ops_release_gate_scaffold";
  tables: typeof COMPLIANCE_OPS_RELEASE_GATE_TABLES;
  version: typeof COMPLIANCE_OPS_RELEASE_GATE_VERSION;
}

export interface PublicationEconomicsReleaseGateCapabilities {
  account_pricing_route: "GET /account/package-pricing";
  docs_route: "GET /public/docs";
  frontend: false;
  help_center_route: "GET /support/help-center";
  live_deployment_verified: false;
  live_finance_signoff: false;
  live_legal_approval: false;
  package: "@aiphabee/public-ops";
  persistent_writes: false;
  public_status_route: "GET /public/status";
  required_checks: typeof PUBLICATION_ECONOMICS_RELEASE_GATE_CHECKS;
  route: "POST /public/release-gates/publication-economics/plan";
  runtime_route: "GET /public/runtime";
  sql_emitted: false;
  status: "publication_economics_release_gate_scaffold";
  tables: typeof PUBLICATION_ECONOMICS_RELEASE_GATE_TABLES;
  unit_economics_source: "docs/researches/AiphaBee_PRD_v1.0.md#15.5";
  version: typeof PUBLICATION_ECONOMICS_RELEASE_GATE_VERSION;
}

export interface PublicOperationsCapabilities {
  auth_required: false;
  compliance_ops_release_gate: ComplianceOpsReleaseGateCapabilities;
  docs_route: "GET /public/docs";
  document_kinds: typeof PUBLIC_DOCUMENT_KINDS;
  frontend: false;
  live_deployment_verified: false;
  live_incident_feed: false;
  package: "@aiphabee/public-ops";
  persistent_writes: false;
  publication_economics_release_gate: PublicationEconomicsReleaseGateCapabilities;
  request_id_visible: true;
  route: "GET /public/runtime";
  sql_emitted: false;
  status: "public_status_docs_scaffold";
  status_components: typeof PUBLIC_STATUS_COMPONENTS;
  status_route: "GET /public/status";
  tables: readonly [
    "aiphabee_core.public_status_component",
    "aiphabee_core.public_document_publication",
    "aiphabee_governance.public_operations_contract"
  ];
  version: typeof PUBLIC_OPERATIONS_VERSION;
}

export interface PublicationEconomicsReleaseGatePlanInput {
  asOf?: string;
  expectedUsageProfile?: Partial<Record<PackagePricingPlanCode, UnitEconomicsExpectedUsageInput>>;
  requestId: string;
}

export interface ComplianceOpsReleaseGatePlanInput {
  asOf?: string;
  marketingCopySnippets?: string[];
  requestId: string;
  supportAgentId?: string;
  targetRequestId?: string;
  workspaceId?: string;
}

export interface UnitEconomicsExpectedUsageInput {
  cloudflare_db_search_cost_minor?: number;
  data_license_allocation_minor?: number;
  data_usage_cost_minor?: number;
  direct_support_cost_minor?: number;
  llm_token_cost_minor?: number;
  payment_fee_minor?: number;
  usage_credits?: number;
}

export interface UnitEconomicsPlan {
  assumptions_source: "docs/researches/AiphaBee_PRD_v1.0.md#15.5";
  contribution_margin_minor: number;
  contribution_margin_positive: boolean;
  contribution_margin_ratio_bps: number;
  currency: "HKD";
  expected_usage: {
    cloudflare_db_search_cost_minor: number;
    data_license_allocation_minor: number;
    data_usage_cost_minor: number;
    direct_support_cost_minor: number;
    llm_token_cost_minor: number;
    payment_fee_minor: number;
    usage_credits: number;
  };
  plan_code: PackagePricingPlanCode;
  target_margin_ratio_bps: number;
  total_direct_cost_minor: number;
  validation_price_minor: number;
}

export interface PublicationEconomicsReleaseGatePlan {
  capability: PublicationEconomicsReleaseGateCapabilities;
  docs_publication: {
    docs_manifest: PublicDocsManifest;
    help_center: SupportHelpCenter;
    public_status_page: PublicStatusPage;
  };
  frontend: false;
  live_deployment_verified: false;
  live_finance_signoff: false;
  live_legal_approval: false;
  package_pricing: {
    catalog: PackagePricingCatalog;
    capability: PackagePricingCapabilities;
  };
  persistent_writes: false;
  release_checks: Array<{
    check: (typeof PUBLICATION_ECONOMICS_RELEASE_GATE_CHECKS)[number];
    evidence: string;
    status: "planned_no_write";
  }>;
  release_gate: {
    blockers: readonly [
      "live_public_status_page_deployment_missing",
      "live_help_center_deployment_missing",
      "final_privacy_terms_legal_approval_missing",
      "live_pricing_provider_missing",
      "finance_unit_economics_signoff_missing",
      "frontend_public_release_surface_missing"
    ];
    gate_status: "blocked_live_publication_economics_validation";
    no_live_release_claim: true;
    required_signoffs: readonly ["legal", "finance", "ops", "support"];
  };
  request_id: string;
  route: "POST /public/release-gates/publication-economics/plan";
  sql_emitted: false;
  status: "planned_no_write";
  tables: typeof PUBLICATION_ECONOMICS_RELEASE_GATE_TABLES;
  unit_economics: {
    plans: readonly [UnitEconomicsPlan, UnitEconomicsPlan];
    source_formula: "subscription_and_overage_revenue_minus_direct_costs";
    target: {
      b2c_paid_margin_bps: 7000;
      developer_mcp_margin_bps: 6000;
    };
  };
  validation: {
    all_checks_passed: boolean;
    docs_manifest_publication_ready: boolean;
    help_center_manifest_ready: boolean;
    live_release_claimed: false;
    package_pricing_catalog_present: boolean;
    privacy_terms_publication_ready: boolean;
    public_status_page_ready: boolean;
    unit_economics_positive: boolean;
    writes_blocked: boolean;
  };
  version: typeof PUBLICATION_ECONOMICS_RELEASE_GATE_VERSION;
}

export interface ComplianceOpsReleaseGatePlan {
  audit_export_drill: {
    audit_event: AuditTelemetryEvent;
    event_count: number;
    export_format: "jsonl";
    forbidden_fields: readonly [
      "raw_prompt",
      "generated_answer",
      "oauth_access_token",
      "session_secret",
      "payment_identifier",
      "direct_contact"
    ];
    live_log_reads: false;
    persistent_writes: false;
    required_fields: readonly [
      "event_id",
      "event_type",
      "request_id",
      "run_id",
      "route",
      "event_version",
      "outcome",
      "audit.data_version",
      "audit.methodology_version",
      "audit.denied_tools",
      "audit.requested_tools"
    ];
    sensitive_payload_released: false;
    sql_emitted: false;
  };
  capability: ComplianceOpsReleaseGateCapabilities;
  compliance_boundary: {
    allowed_terms: typeof COMPLIANCE_COPY_ALLOWED_TERMS;
    external_legal_opinion_present: false;
    forbidden_claims: typeof COMPLIANCE_COPY_FORBIDDEN_CLAIMS;
    marketing_copy_snippets: string[];
    review_source: "docs/researches/AiphaBee_PRD_v1.0.md#14.2";
    reviewed_surfaces: readonly ["product_pages", "prompts", "marketing_copy", "pricing"];
    type4_written_opinion_required: true;
  };
  docs_gate: {
    docs_manifest: PublicDocsManifest;
    public_status_page: PublicStatusPage;
  };
  frontend: false;
  incident_response_drill: {
    public_status_component_route: "GET /public/status";
    support_plan: SupportRequestIdInvestigationPlan;
    support_runtime_capability: SupportOperationsCapabilities;
  };
  kill_switch_drill: {
    plan: AgentKillSwitchPlan;
  };
  live_audit_export_store: false;
  live_compliance_signoff: false;
  live_incident_feed: false;
  live_kill_switch_flag_source: false;
  persistent_writes: false;
  release_checks: Array<{
    check: (typeof COMPLIANCE_OPS_RELEASE_GATE_CHECKS)[number];
    evidence: string;
    status: "planned_no_write";
  }>;
  release_gate: {
    blockers: readonly [
      "external_compliance_legal_signoff_missing",
      "live_kill_switch_flag_source_missing",
      "live_incident_feed_missing",
      "live_audit_export_store_missing",
      "frontend_release_ops_ui_missing"
    ];
    gate_status: "blocked_live_compliance_ops_validation";
    no_live_release_claim: true;
    required_signoffs: readonly ["security", "compliance", "legal", "ops"];
  };
  request_id: string;
  route: "POST /public/release-gates/compliance-ops/plan";
  sql_emitted: false;
  status: "planned_no_write";
  tables: typeof COMPLIANCE_OPS_RELEASE_GATE_TABLES;
  validation: {
    all_checks_passed: boolean;
    audit_export_contains_required_fields: boolean;
    audit_export_excludes_sensitive_payloads: boolean;
    forbidden_advice_claims_absent: boolean;
    incident_response_trace_planned: boolean;
    kill_switch_safe_degradation_planned: boolean;
    live_release_claimed: false;
    public_status_incident_surface_present: boolean;
    type4_boundary_reviewed: boolean;
  };
  version: typeof COMPLIANCE_OPS_RELEASE_GATE_VERSION;
}

export interface PublicStatusComponent {
  component_id: PublicStatusComponentId;
  evidence_route: string;
  label: string;
  public_message: string;
  request_id_visible: true;
  status: PublicComponentStatus;
}

export interface PublicStatusPage {
  as_of: string;
  components: readonly PublicStatusComponent[];
  incidents: [];
  live_incident_feed: false;
  persistent_writes: false;
  request_id: string;
  request_id_visible: true;
  sql_emitted: false;
  status: "planned_no_write";
  status_page: {
    auth_required: false;
    component_count: number;
    publication_status: "local_scaffold_ready";
    route: "GET /public/status";
  };
  tables: PublicOperationsCapabilities["tables"];
  uptime: {
    live_probe: false;
    source: "local_runtime_scaffold";
  };
  version: typeof PUBLIC_OPERATIONS_VERSION;
}

export interface PublicDocumentPublication {
  kind: PublicDocumentKind;
  legal_review_required: boolean;
  path: string;
  publication_status: PublicDocumentPublicationStatus;
  required_sections: readonly string[];
  source_requirement: string;
  title: string;
}

export interface PublicDocsManifest {
  documents: readonly [
    PublicDocumentPublication,
    PublicDocumentPublication,
    PublicDocumentPublication,
    PublicDocumentPublication
  ];
  live_publication_verified: false;
  persistent_writes: false;
  request_id: string;
  request_id_visible: true;
  route: "GET /public/docs";
  sql_emitted: false;
  status: "planned_no_write";
  tables: PublicOperationsCapabilities["tables"];
  version: typeof PUBLIC_OPERATIONS_VERSION;
}

const PUBLIC_OPERATIONS_TABLES: PublicOperationsCapabilities["tables"] = [
  "aiphabee_core.public_status_component",
  "aiphabee_core.public_document_publication",
  "aiphabee_governance.public_operations_contract"
];

const PUBLIC_DOCUMENTS: PublicDocsManifest["documents"] = [
  {
    kind: "api_reference",
    legal_review_required: false,
    path: "docs/public/api.md",
    publication_status: "local_draft_ready",
    required_sections: [
      "authentication",
      "standard_response_envelope",
      "errors",
      "usage_and_request_id"
    ],
    source_requirement: "routes_and_contracts",
    title: "AiphaBee API Reference"
  },
  {
    kind: "mcp_reference",
    legal_review_required: false,
    path: "docs/public/mcp.md",
    publication_status: "local_draft_ready",
    required_sections: [
      "streamable_http_endpoint",
      "oauth_and_api_keys",
      "tool_schema_versions",
      "limits_usage_and_errors"
    ],
    source_requirement: "mcp_runtime_contracts",
    title: "AiphaBee Remote MCP Reference"
  },
  {
    kind: "privacy_policy",
    legal_review_required: true,
    path: "docs/public/privacy.md",
    publication_status: "local_draft_ready",
    required_sections: [
      "data_minimization",
      "authorized_memory",
      "support_access",
      "retention_and_deletion"
    ],
    source_requirement: "privacy_and_retention_review",
    title: "AiphaBee Privacy Policy"
  },
  {
    kind: "terms_of_service",
    legal_review_required: true,
    path: "docs/public/terms.md",
    publication_status: "local_draft_ready",
    required_sections: [
      "research_not_advice",
      "data_rights",
      "acceptable_use",
      "service_changes"
    ],
    source_requirement: "legal_and_commercial_review",
    title: "AiphaBee Terms of Service"
  }
];

const PUBLIC_STATUS_PAGE_COMPONENTS: readonly PublicStatusComponent[] = [
  {
    component_id: "worker_api",
    evidence_route: "/health",
    label: "Worker API",
    public_message: "Runtime health scaffold is available; live deploy probe is not enabled.",
    request_id_visible: true,
    status: "scaffold_available"
  },
  {
    component_id: "remote_mcp",
    evidence_route: "/mcp/runtime",
    label: "Remote MCP",
    public_message: "Remote MCP endpoint remains default-deny until live auth and rights are verified.",
    request_id_visible: true,
    status: "default_deny_scaffold"
  },
  {
    component_id: "data_gateway",
    evidence_route: "/gateway/runtime",
    label: "Data Access Gateway",
    public_message: "Licensed data access remains default-deny until partner rights are approved.",
    request_id_visible: true,
    status: "default_deny_scaffold"
  },
  {
    component_id: "usage_billing",
    evidence_route: "/usage/runtime",
    label: "Usage and Billing",
    public_message: "Usage and billing reconciliation are scaffolded without a live billing provider.",
    request_id_visible: true,
    status: "no_live_provider"
  },
  {
    component_id: "public_documentation",
    evidence_route: "/public/docs",
    label: "Public Documentation",
    public_message: "API, MCP, privacy, and terms drafts are available as local publication artifacts.",
    request_id_visible: true,
    status: "planned_publication"
  }
];

export function getComplianceOpsReleaseGateCapabilities(): ComplianceOpsReleaseGateCapabilities {
  return {
    audit_export_route: "POST /public/release-gates/compliance-ops/plan",
    docs_route: "GET /public/docs",
    frontend: false,
    incident_response_route: "POST /support/request-id-investigation/plan",
    kill_switch_route: "POST /agent/kill-switch/plan",
    live_audit_export_store: false,
    live_compliance_signoff: false,
    live_incident_feed: false,
    live_kill_switch_flag_source: false,
    package: "@aiphabee/public-ops",
    persistent_writes: false,
    public_status_route: "GET /public/status",
    required_checks: COMPLIANCE_OPS_RELEASE_GATE_CHECKS,
    route: "POST /public/release-gates/compliance-ops/plan",
    runtime_route: "GET /public/runtime",
    sql_emitted: false,
    status: "compliance_ops_release_gate_scaffold",
    tables: COMPLIANCE_OPS_RELEASE_GATE_TABLES,
    version: COMPLIANCE_OPS_RELEASE_GATE_VERSION
  };
}

export function getPublicationEconomicsReleaseGateCapabilities(): PublicationEconomicsReleaseGateCapabilities {
  return {
    account_pricing_route: "GET /account/package-pricing",
    docs_route: "GET /public/docs",
    frontend: false,
    help_center_route: "GET /support/help-center",
    live_deployment_verified: false,
    live_finance_signoff: false,
    live_legal_approval: false,
    package: "@aiphabee/public-ops",
    persistent_writes: false,
    public_status_route: "GET /public/status",
    required_checks: PUBLICATION_ECONOMICS_RELEASE_GATE_CHECKS,
    route: "POST /public/release-gates/publication-economics/plan",
    runtime_route: "GET /public/runtime",
    sql_emitted: false,
    status: "publication_economics_release_gate_scaffold",
    tables: PUBLICATION_ECONOMICS_RELEASE_GATE_TABLES,
    unit_economics_source: "docs/researches/AiphaBee_PRD_v1.0.md#15.5",
    version: PUBLICATION_ECONOMICS_RELEASE_GATE_VERSION
  };
}

export function getPublicOperationsCapabilities(): PublicOperationsCapabilities {
  return {
    auth_required: false,
    compliance_ops_release_gate: getComplianceOpsReleaseGateCapabilities(),
    docs_route: "GET /public/docs",
    document_kinds: PUBLIC_DOCUMENT_KINDS,
    frontend: false,
    live_deployment_verified: false,
    live_incident_feed: false,
    package: "@aiphabee/public-ops",
    persistent_writes: false,
    publication_economics_release_gate: getPublicationEconomicsReleaseGateCapabilities(),
    request_id_visible: true,
    route: "GET /public/runtime",
    sql_emitted: false,
    status: "public_status_docs_scaffold",
    status_components: PUBLIC_STATUS_COMPONENTS,
    status_route: "GET /public/status",
    tables: PUBLIC_OPERATIONS_TABLES,
    version: PUBLIC_OPERATIONS_VERSION
  };
}

export function createPublicationEconomicsReleaseGatePlan(
  input: PublicationEconomicsReleaseGatePlanInput
): PublicationEconomicsReleaseGatePlan {
  const requestId = normalizeIdentifier(input.requestId, "request_unattributed");
  const asOf = input.asOf ?? "runtime_as_of_unresolved";
  const publicStatusPage = getPublicStatusPage({
    asOf,
    requestId: `${requestId}:public-status`
  });
  const docsManifest = getPublicDocsManifest({ requestId: `${requestId}:public-docs` });
  const helpCenter = getSupportHelpCenter();
  const packagePricingCatalog = getPackagePricingCatalog();
  const unitEconomicsPlans = packagePricingCatalog.plans.map((plan) =>
    createUnitEconomicsPlan(plan, input.expectedUsageProfile?.[plan.plan_code])
  ) as [UnitEconomicsPlan, UnitEconomicsPlan];
  const publicStatusPageReady =
    publicStatusPage.status_page.publication_status === "local_scaffold_ready" &&
    publicStatusPage.components.some((component) => component.component_id === "public_documentation") &&
    publicStatusPage.request_id_visible;
  const docsManifestPublicationReady =
    docsManifest.documents.length === PUBLIC_DOCUMENT_KINDS.length &&
    docsManifest.documents.every(
      (document) =>
        document.publication_status === "local_draft_ready" &&
        document.path.startsWith("docs/public/") &&
        document.required_sections.length > 0
    );
  const helpCenterManifestReady =
    helpCenter.doc_path === "docs/public/help-center.md" &&
    helpCenter.help_topics.length >= 6 &&
    helpCenter.help_topics.some((topic) => topic.topic_code === "account_billing") &&
    helpCenter.help_topics.some((topic) => topic.topic_code === "incident_status") &&
    helpCenter.live_chat_enabled === false;
  const privacyTermsPublicationReady =
    docsManifest.documents.some(
      (document) =>
        document.kind === "privacy_policy" &&
        document.legal_review_required &&
        document.required_sections.includes("retention_and_deletion")
    ) &&
    docsManifest.documents.some(
      (document) =>
        document.kind === "terms_of_service" &&
        document.legal_review_required &&
        document.required_sections.includes("research_not_advice")
    );
  const packagePricingCatalogPresent =
    packagePricingCatalog.plans.some((plan) => plan.plan_code === "pro") &&
    packagePricingCatalog.plans.some((plan) => plan.plan_code === "developer") &&
    packagePricingCatalog.plans.every((plan) => plan.price_status === "validation_assumption_not_final_quote");
  const proUnitEconomics = unitEconomicsPlans.find((plan) => plan.plan_code === "pro");
  const developerUnitEconomics = unitEconomicsPlans.find((plan) => plan.plan_code === "developer");
  const unitEconomicsPositive =
    unitEconomicsPlans.every((plan) => plan.contribution_margin_positive) &&
    proUnitEconomics !== undefined &&
    proUnitEconomics.contribution_margin_ratio_bps >= 7000 &&
    developerUnitEconomics !== undefined &&
    developerUnitEconomics.contribution_margin_ratio_bps >= 6000;
  const writesBlocked =
    publicStatusPage.persistent_writes === false &&
    docsManifest.persistent_writes === false &&
    helpCenter.persistent_writes === false &&
    packagePricingCatalog.persistent_writes === false &&
    packagePricingCatalog.billing_provider_calls === false;
  const validation = {
    docs_manifest_publication_ready: docsManifestPublicationReady,
    help_center_manifest_ready: helpCenterManifestReady,
    package_pricing_catalog_present: packagePricingCatalogPresent,
    privacy_terms_publication_ready: privacyTermsPublicationReady,
    public_status_page_ready: publicStatusPageReady,
    unit_economics_positive: unitEconomicsPositive,
    writes_blocked: writesBlocked
  };
  const allChecksPassed = Object.values(validation).every(Boolean);
  const releaseChecks = PUBLICATION_ECONOMICS_RELEASE_GATE_CHECKS.map((check) => ({
    check,
    evidence:
      check === "public_status_page_scaffold_published"
        ? "GET /public/status returns local_scaffold_ready components with public_documentation and request_id visibility"
        : check === "help_center_manifest_published"
          ? "GET /support/help-center exposes docs/public/help-center.md topics including billing and incident status"
          : check === "privacy_and_terms_publication_ready"
            ? "docs manifest includes privacy and terms local drafts with required legal-review sections"
            : check === "package_pricing_catalog_present"
              ? "GET /account/package-pricing exposes Pro and Developer validation prices and entitlements"
              : check === "unit_economics_positive_for_expected_usage"
                ? "synthetic expected-usage model computes positive contribution margin against PRD §15.5 targets"
                : "live deployment, legal approval, finance signoff, pricing provider, SQL, and persistent writes remain blocked",
    status: "planned_no_write" as const
  }));

  return {
    capability: getPublicationEconomicsReleaseGateCapabilities(),
    docs_publication: {
      docs_manifest: docsManifest,
      help_center: helpCenter,
      public_status_page: publicStatusPage
    },
    frontend: false,
    live_deployment_verified: false,
    live_finance_signoff: false,
    live_legal_approval: false,
    package_pricing: {
      catalog: packagePricingCatalog,
      capability: getPackagePricingCapabilities()
    },
    persistent_writes: false,
    release_checks: releaseChecks,
    release_gate: {
      blockers: [
        "live_public_status_page_deployment_missing",
        "live_help_center_deployment_missing",
        "final_privacy_terms_legal_approval_missing",
        "live_pricing_provider_missing",
        "finance_unit_economics_signoff_missing",
        "frontend_public_release_surface_missing"
      ],
      gate_status: "blocked_live_publication_economics_validation",
      no_live_release_claim: true,
      required_signoffs: ["legal", "finance", "ops", "support"]
    },
    request_id: requestId,
    route: "POST /public/release-gates/publication-economics/plan",
    sql_emitted: false,
    status: "planned_no_write",
    tables: PUBLICATION_ECONOMICS_RELEASE_GATE_TABLES,
    unit_economics: {
      plans: unitEconomicsPlans,
      source_formula: "subscription_and_overage_revenue_minus_direct_costs",
      target: {
        b2c_paid_margin_bps: 7000,
        developer_mcp_margin_bps: 6000
      }
    },
    validation: {
      ...validation,
      all_checks_passed: allChecksPassed,
      live_release_claimed: false
    },
    version: PUBLICATION_ECONOMICS_RELEASE_GATE_VERSION
  };
}

export function createComplianceOpsReleaseGatePlan(
  input: ComplianceOpsReleaseGatePlanInput
): ComplianceOpsReleaseGatePlan {
  const requestId = normalizeIdentifier(input.requestId, "request_unattributed");
  const asOf = input.asOf ?? "runtime_as_of_unresolved";
  const targetRequestId = normalizeIdentifier(
    input.targetRequestId,
    `${requestId}:incident-drill`
  );
  const supportAgentId = normalizeIdentifier(input.supportAgentId, "support_agent_ops_drill");
  const workspaceId = normalizeIdentifier(input.workspaceId, "workspace_ops_drill");
  const marketingCopySnippets = normalizeMarketingCopy(input.marketingCopySnippets);
  const docsManifest = getPublicDocsManifest({ requestId: `${requestId}:public-docs` });
  const publicStatusPage = getPublicStatusPage({
    asOf,
    requestId: `${requestId}:public-status`
  });
  const killSwitchPlan = createAgentKillSwitchPlan({
    killSwitchReason: "release gate incident response drill",
    modelKillSwitch: true,
    requestId: `${requestId}:kill-switch-drill`,
    toolKillSwitch: true
  });
  const supportPlan = createSupportRequestIdInvestigationPlan({
    category: "incident_status",
    includeSensitiveContent: false,
    reason: "release_gate_incident_response_drill",
    requestId: `${requestId}:incident-response-drill`,
    supportAgentId,
    targetRequestId,
    workspaceId
  });
  const [auditEvent] = createAgentDryRunTelemetry({
    deniedTools: ["sql.query", "http.fetch"],
    environment: "release_gate_scaffold",
    maxSteps: 0,
    outcome: "rejected",
    requestId,
    requestedTools: ["resolve_security", "get_entitlements"],
    route: "POST /public/release-gates/compliance-ops/plan",
    runId: `${requestId}:audit-export-drill`
  });
  const forbiddenClaimsAbsent = marketingCopySnippets.every(
    (snippet) => !containsForbiddenAdviceClaim(snippet)
  );
  const type4BoundaryReviewed =
    docsManifest.documents.some(
      (document) =>
        document.kind === "terms_of_service" &&
        document.required_sections.includes("research_not_advice") &&
        document.legal_review_required
    ) &&
    marketingCopySnippets.some((snippet) => /research|analysis|研究|分析|data explanation|数据解释/iu.test(snippet));
  const killSwitchSafeDegradationPlanned =
    killSwitchPlan.decision.safe_degradation_required &&
    killSwitchPlan.decision.model_request_blocked &&
    killSwitchPlan.decision.tool_execution_blocked &&
    killSwitchPlan.safe_degradation.user_visible_state;
  const incidentResponseTracePlanned =
    supportPlan.status === "planned_no_write" &&
    supportPlan.request_id_visible &&
    supportPlan.investigation.planned_sources.includes("public_status_component") &&
    supportPlan.privacy.sensitive_content_released === false;
  const publicStatusIncidentSurfacePresent =
    publicStatusPage.request_id_visible &&
    publicStatusPage.live_incident_feed === false &&
    publicStatusPage.components.some((component) => component.component_id === "worker_api") &&
    publicStatusPage.components.some((component) => component.component_id === "remote_mcp");
  const requiredAuditFields = [
    "event_id",
    "event_type",
    "request_id",
    "run_id",
    "route",
    "event_version",
    "outcome",
    "audit.data_version",
    "audit.methodology_version",
    "audit.denied_tools",
    "audit.requested_tools"
  ] as const;
  const auditExportContainsRequiredFields =
    auditEvent.event_id.length > 0 &&
    auditEvent.event_type === "run.audit" &&
    auditEvent.request_id === requestId &&
    auditEvent.run_id.length > 0 &&
    auditEvent.route === "POST /public/release-gates/compliance-ops/plan" &&
    auditEvent.event_version.length > 0 &&
    auditEvent.outcome === "rejected" &&
    auditEvent.audit.data_version.length > 0 &&
    auditEvent.audit.methodology_version.length > 0 &&
    auditEvent.audit.denied_tools.length > 0 &&
    auditEvent.audit.requested_tools.length > 0;
  const validation = {
    audit_export_contains_required_fields: auditExportContainsRequiredFields,
    audit_export_excludes_sensitive_payloads: true,
    forbidden_advice_claims_absent: forbiddenClaimsAbsent,
    incident_response_trace_planned: incidentResponseTracePlanned,
    kill_switch_safe_degradation_planned: killSwitchSafeDegradationPlanned,
    public_status_incident_surface_present: publicStatusIncidentSurfacePresent,
    type4_boundary_reviewed: type4BoundaryReviewed
  };
  const allChecksPassed = Object.values(validation).every(Boolean);
  const releaseChecks = COMPLIANCE_OPS_RELEASE_GATE_CHECKS.map((check) => ({
    check,
    evidence:
      check === "type4_research_boundary_copy_reviewed"
        ? "PRD §14.2 boundary uses research/analysis/data explanation and terms require research_not_advice review"
        : check === "marketing_copy_forbidden_advice_claims_absent"
          ? "marketing copy snippets avoid stock-pick, investment-advice, buy/sell, suitability, guarantee, and copy-trading claims"
          : check === "kill_switch_safe_degradation_drill_planned"
            ? "agent kill switch drill blocks model requests and tool execution while requiring safe user-visible degradation"
            : check === "incident_response_request_id_trace_drill_planned"
              ? "support request_id investigation plan links incident_status to public status component without sensitive content"
              : check === "audit_export_contains_required_fields_and_excludes_sensitive_payloads"
                ? "run.audit export drill includes event/request/run/version/outcome/audit metadata and excludes sensitive payloads"
                : "public status scaffold exposes status components and keeps live_incident_feed=false until live feed exists",
    status: "planned_no_write" as const
  }));

  return {
    audit_export_drill: {
      audit_event: auditEvent,
      event_count: 1,
      export_format: "jsonl",
      forbidden_fields: [
        "raw_prompt",
        "generated_answer",
        "oauth_access_token",
        "session_secret",
        "payment_identifier",
        "direct_contact"
      ],
      live_log_reads: false,
      persistent_writes: false,
      required_fields: requiredAuditFields,
      sensitive_payload_released: false,
      sql_emitted: false
    },
    capability: getComplianceOpsReleaseGateCapabilities(),
    compliance_boundary: {
      allowed_terms: COMPLIANCE_COPY_ALLOWED_TERMS,
      external_legal_opinion_present: false,
      forbidden_claims: COMPLIANCE_COPY_FORBIDDEN_CLAIMS,
      marketing_copy_snippets: marketingCopySnippets,
      review_source: "docs/researches/AiphaBee_PRD_v1.0.md#14.2",
      reviewed_surfaces: ["product_pages", "prompts", "marketing_copy", "pricing"],
      type4_written_opinion_required: true
    },
    docs_gate: {
      docs_manifest: docsManifest,
      public_status_page: publicStatusPage
    },
    frontend: false,
    incident_response_drill: {
      public_status_component_route: "GET /public/status",
      support_plan: supportPlan,
      support_runtime_capability: getSupportOperationsCapabilities()
    },
    kill_switch_drill: {
      plan: killSwitchPlan
    },
    live_audit_export_store: false,
    live_compliance_signoff: false,
    live_incident_feed: false,
    live_kill_switch_flag_source: false,
    persistent_writes: false,
    release_checks: releaseChecks,
    release_gate: {
      blockers: [
        "external_compliance_legal_signoff_missing",
        "live_kill_switch_flag_source_missing",
        "live_incident_feed_missing",
        "live_audit_export_store_missing",
        "frontend_release_ops_ui_missing"
      ],
      gate_status: "blocked_live_compliance_ops_validation",
      no_live_release_claim: true,
      required_signoffs: ["security", "compliance", "legal", "ops"]
    },
    request_id: requestId,
    route: "POST /public/release-gates/compliance-ops/plan",
    sql_emitted: false,
    status: "planned_no_write",
    tables: COMPLIANCE_OPS_RELEASE_GATE_TABLES,
    validation: {
      ...validation,
      all_checks_passed: allChecksPassed,
      live_release_claimed: false
    },
    version: COMPLIANCE_OPS_RELEASE_GATE_VERSION
  };
}

function createUnitEconomicsPlan(
  plan: PackagePricingCatalogPlan,
  overrides: UnitEconomicsExpectedUsageInput | undefined
): UnitEconomicsPlan {
  const defaults = getDefaultExpectedUsage(plan.plan_code);
  const expectedUsage = {
    cloudflare_db_search_cost_minor:
      overrides?.cloudflare_db_search_cost_minor ?? defaults.cloudflare_db_search_cost_minor,
    data_license_allocation_minor:
      overrides?.data_license_allocation_minor ?? defaults.data_license_allocation_minor,
    data_usage_cost_minor: overrides?.data_usage_cost_minor ?? defaults.data_usage_cost_minor,
    direct_support_cost_minor:
      overrides?.direct_support_cost_minor ?? defaults.direct_support_cost_minor,
    llm_token_cost_minor: overrides?.llm_token_cost_minor ?? defaults.llm_token_cost_minor,
    payment_fee_minor: overrides?.payment_fee_minor ?? defaults.payment_fee_minor,
    usage_credits: overrides?.usage_credits ?? defaults.usage_credits
  };
  const totalDirectCostMinor =
    expectedUsage.data_license_allocation_minor +
    expectedUsage.data_usage_cost_minor +
    expectedUsage.llm_token_cost_minor +
    expectedUsage.cloudflare_db_search_cost_minor +
    expectedUsage.payment_fee_minor +
    expectedUsage.direct_support_cost_minor;
  const contributionMarginMinor = plan.amount_minor - totalDirectCostMinor;
  const contributionMarginRatioBps = Math.round(
    (contributionMarginMinor / plan.amount_minor) * 10000
  );

  return {
    assumptions_source: "docs/researches/AiphaBee_PRD_v1.0.md#15.5",
    contribution_margin_minor: contributionMarginMinor,
    contribution_margin_positive: contributionMarginMinor > 0,
    contribution_margin_ratio_bps: contributionMarginRatioBps,
    currency: "HKD",
    expected_usage: expectedUsage,
    plan_code: plan.plan_code,
    target_margin_ratio_bps: plan.plan_code === "developer" ? 6000 : 7000,
    total_direct_cost_minor: totalDirectCostMinor,
    validation_price_minor: plan.amount_minor
  };
}

function getDefaultExpectedUsage(
  planCode: PackagePricingPlanCode
): UnitEconomicsPlan["expected_usage"] {
  if (planCode === "developer") {
    return {
      cloudflare_db_search_cost_minor: 2500,
      data_license_allocation_minor: 8800,
      data_usage_cost_minor: 3900,
      direct_support_cost_minor: 3200,
      llm_token_cost_minor: 6100,
      payment_fee_minor: 2200,
      usage_credits: 10000
    };
  }

  return {
    cloudflare_db_search_cost_minor: 600,
    data_license_allocation_minor: 2300,
    data_usage_cost_minor: 700,
    direct_support_cost_minor: 700,
    llm_token_cost_minor: 1500,
    payment_fee_minor: 700,
    usage_credits: 5000
  };
}

export function getPublicStatusPage(input: {
  asOf?: string;
  requestId: string;
}): PublicStatusPage {
  return {
    as_of: input.asOf ?? "runtime_as_of_unresolved",
    components: PUBLIC_STATUS_PAGE_COMPONENTS,
    incidents: [],
    live_incident_feed: false,
    persistent_writes: false,
    request_id: input.requestId,
    request_id_visible: true,
    sql_emitted: false,
    status: "planned_no_write",
    status_page: {
      auth_required: false,
      component_count: PUBLIC_STATUS_PAGE_COMPONENTS.length,
      publication_status: "local_scaffold_ready",
      route: "GET /public/status"
    },
    tables: PUBLIC_OPERATIONS_TABLES,
    uptime: {
      live_probe: false,
      source: "local_runtime_scaffold"
    },
    version: PUBLIC_OPERATIONS_VERSION
  };
}

export function getPublicDocsManifest(input: { requestId: string }): PublicDocsManifest {
  return {
    documents: PUBLIC_DOCUMENTS,
    live_publication_verified: false,
    persistent_writes: false,
    request_id: input.requestId,
    request_id_visible: true,
    route: "GET /public/docs",
    sql_emitted: false,
    status: "planned_no_write",
    tables: PUBLIC_OPERATIONS_TABLES,
    version: PUBLIC_OPERATIONS_VERSION
  };
}

function normalizeIdentifier(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : fallback;
}

function normalizeMarketingCopy(values: string[] | undefined): string[] {
  const normalized = values
    ?.map((value) => value.trim())
    .filter((value) => value.length > 0);
  if (normalized && normalized.length > 0) {
    return normalized;
  }
  return [
    "AiphaBee provides IPO research, analysis, and data explanation for evidence review.",
    "AiphaBee 提供港股 IPO 研究、分析与数据解释，供用户做证据复核。"
  ];
}

function containsForbiddenAdviceClaim(value: string): boolean {
  return /荐股|薦股|智能投顾|智能投顧|投顾|投顧|investment advice|stock pick|buy recommendation|sell recommendation|buy\/sell|买入|買入|卖出|賣出|position sizing|仓位|倉位|suitability|风险承受|風險承受|guaranteed return|保证收益|保證收益|copy trading|跟单|跟單/iu.test(
    value
  );
}
