import { describe, expect, it } from "vitest";
import {
  getPublicDocsManifest,
  getPublicOperationsCapabilities,
  getPublicStatusPage
} from "./index";

describe("public operations scaffold", () => {
  it("reports public status and docs capabilities without frontend or live feeds", () => {
    expect(getPublicOperationsCapabilities()).toMatchObject({
      auth_required: false,
      docs_route: "GET /public/docs",
      frontend: false,
      live_deployment_verified: false,
      live_incident_feed: false,
      package: "@aiphabee/public-ops",
      persistent_writes: false,
      request_id_visible: true,
      route: "GET /public/runtime",
      sql_emitted: false,
      status: "public_status_docs_scaffold",
      status_route: "GET /public/status",
      version: "2026-06-21.phase3.public-status-docs-scaffold.v0"
    });
    expect(getPublicOperationsCapabilities().document_kinds).toEqual([
      "api_reference",
      "mcp_reference",
      "privacy_policy",
      "terms_of_service"
    ]);
  });

  it("builds a public status page manifest with component evidence routes", () => {
    const statusPage = getPublicStatusPage({
      asOf: "2026-06-21T11:50:00.000Z",
      requestId: "req_public_status"
    });

    expect(statusPage).toMatchObject({
      as_of: "2026-06-21T11:50:00.000Z",
      live_incident_feed: false,
      persistent_writes: false,
      request_id: "req_public_status",
      request_id_visible: true,
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(statusPage.status_page).toMatchObject({
      auth_required: false,
      component_count: 5,
      publication_status: "local_scaffold_ready",
      route: "GET /public/status"
    });
    expect(statusPage.components.map((component) => component.component_id)).toEqual([
      "worker_api",
      "remote_mcp",
      "data_gateway",
      "usage_billing",
      "public_documentation"
    ]);
    expect(statusPage.components.every((component) => component.request_id_visible)).toBe(true);
    expect(statusPage.components.find((component) => component.component_id === "remote_mcp")).toMatchObject({
      evidence_route: "/mcp/runtime",
      status: "default_deny_scaffold"
    });
  });

  it("builds a public docs manifest for API, MCP, privacy, and terms", () => {
    const manifest = getPublicDocsManifest({ requestId: "req_public_docs" });

    expect(manifest).toMatchObject({
      live_publication_verified: false,
      persistent_writes: false,
      request_id: "req_public_docs",
      request_id_visible: true,
      route: "GET /public/docs",
      sql_emitted: false,
      status: "planned_no_write"
    });
    expect(manifest.documents.map((document) => document.kind)).toEqual([
      "api_reference",
      "mcp_reference",
      "privacy_policy",
      "terms_of_service"
    ]);
    expect(manifest.documents.find((document) => document.kind === "api_reference")).toMatchObject({
      path: "docs/public/api.md",
      publication_status: "local_draft_ready"
    });
    expect(manifest.documents.find((document) => document.kind === "privacy_policy")).toMatchObject({
      legal_review_required: true,
      path: "docs/public/privacy.md"
    });
    expect(manifest.documents.find((document) => document.kind === "terms_of_service")).toMatchObject({
      legal_review_required: true,
      path: "docs/public/terms.md"
    });
  });
});
