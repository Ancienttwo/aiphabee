export const PUBLIC_OPERATIONS_VERSION =
  "2026-06-21.phase3.public-status-docs-scaffold.v0";

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

export type PublicDocumentKind = (typeof PUBLIC_DOCUMENT_KINDS)[number];
export type PublicStatusComponentId = (typeof PUBLIC_STATUS_COMPONENTS)[number];
export type PublicDocumentPublicationStatus = "local_draft_ready";
export type PublicComponentStatus =
  | "default_deny_scaffold"
  | "no_live_provider"
  | "planned_publication"
  | "scaffold_available";

export interface PublicOperationsCapabilities {
  auth_required: false;
  docs_route: "GET /public/docs";
  document_kinds: typeof PUBLIC_DOCUMENT_KINDS;
  frontend: false;
  live_deployment_verified: false;
  live_incident_feed: false;
  package: "@aiphabee/public-ops";
  persistent_writes: false;
  request_id_visible: true;
  route: "GET /public/runtime";
  sql_emitted: false;
  status: "public_status_docs_scaffold";
  status_components: typeof PUBLIC_STATUS_COMPONENTS;
  status_route: "GET /public/status";
  tables: readonly [
    "core.public_status_component",
    "core.public_document_publication",
    "governance.public_operations_contract"
  ];
  version: typeof PUBLIC_OPERATIONS_VERSION;
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
  "core.public_status_component",
  "core.public_document_publication",
  "governance.public_operations_contract"
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

export function getPublicOperationsCapabilities(): PublicOperationsCapabilities {
  return {
    auth_required: false,
    docs_route: "GET /public/docs",
    document_kinds: PUBLIC_DOCUMENT_KINDS,
    frontend: false,
    live_deployment_verified: false,
    live_incident_feed: false,
    package: "@aiphabee/public-ops",
    persistent_writes: false,
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
