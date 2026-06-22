#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const trackerPath = "docs/AiphaBee_Sprint_Tracker_v1.0.md";
const packageJsonPath = "package.json";
const requiredChecked = [
  "ACC-01",
  "ACC-02",
  "ACC-03",
  "ACC-04",
  "SEC-01",
  "SEC-02",
  "SEC-03",
  "SEC-04",
  "AGT-02",
  "AGT-03",
  "AGT-04",
  "AGT-05",
  "AGT-06",
  "AGT-08",
  "AGT-09",
  "STK-01",
  "STK-02",
  "STK-03",
  "STK-04",
  "STK-05",
  "STK-06",
  "ANA-01",
  "ANA-02",
  "ANA-03",
  "ANA-04",
  "ANA-05",
  "ANA-07",
  "DOC-01",
  "DOC-02",
  "DOC-03",
  "DOC-04",
  "RES-01",
  "RES-02",
  "RES-03",
  "RES-04",
  "RES-05",
  "RES-06",
  "MCP-01",
  "MCP-02",
  "MCP-03",
  "MCP-04",
  "MCP-05",
  "MCP-06",
  "MCP-07",
  "MCP-08",
  "MCP-10",
  "DAT-01",
  "DAT-02",
  "DAT-03",
  "DAT-04",
  "DAT-05",
  "DAT-06",
  "DAT-07",
  "DAT-08",
  "DAT-10"
];
const requiredUnchecked = [
  "AGT-01",
  "AGT-07",
  "STK-07",
  "MCP-09"
];
const evidencePaths = [
  "docs/governance/traceability-matrix-sync.md",
  "tasks/contracts/traceability-matrix-sync.contract.md",
  "tasks/notes/traceability-matrix-sync.notes.md",
  "deploy/account/enterprise-controls.contract.json",
  "deploy/account/session.contract.json",
  "deploy/account/subscription-lifecycle.contract.json",
  "deploy/agent/answer-evidence-contract.contract.json",
  "deploy/agent/budget-stop-policy.contract.json",
  "deploy/agent/failure-recovery-policy.contract.json",
  "deploy/agent/numeric-source-guard.contract.json",
  "deploy/agent/pre-tool-call-resolution.contract.json",
  "deploy/agent/tool-enforcement.contract.json",
  "deploy/agent/workflow-task.contract.json",
  "deploy/analytics/compare-securities.contract.json",
  "deploy/analytics/percentile-comparison.contract.json",
  "deploy/analytics/returns-risk.contract.json",
  "deploy/analytics/saved-screening-schedule.contract.json",
  "deploy/analytics/screen-securities.contract.json",
  "deploy/database/migrations.contract.json",
  "deploy/governance/corporate-action-benchmark-parity.contract.json",
  "deploy/governance/field-rights-live-policy-source.contract.json",
  "deploy/governance/serving-quality-live-readiness.contract.json",
  "deploy/documents/announcement-diff-extraction.contract.json",
  "deploy/documents/document-sanitizer.contract.json",
  "deploy/documents/get-announcement.contract.json",
  "deploy/documents/search-announcements.contract.json",
  "deploy/mcp/api-key.contract.json",
  "deploy/mcp/endpoint.contract.json",
  "deploy/mcp/error-codes.contract.json",
  "deploy/mcp/oauth-pkce.contract.json",
  "deploy/mcp/pagination-limits.contract.json",
  "deploy/mcp/tool-schema-validation.contract.json",
  "deploy/mcp/tool-versioning.contract.json",
  "deploy/mcp/usage-envelope.contract.json",
  "deploy/research/research-run-save.contract.json",
  "deploy/research/research-run-replay.contract.json",
  "deploy/research/static-report.contract.json",
  "deploy/research/data-correction-notifications.contract.json",
  "deploy/sharing/private-share-link.contract.json",
  "deploy/tools/get-financial-facts.contract.json",
  "deploy/tools/get-price-history.contract.json",
  "deploy/tools/get-quote-snapshot.contract.json",
  "deploy/tools/get-security-profile.contract.json",
  "deploy/tools/p0-tool-catalog.contract.json",
  "deploy/tools/resolve-security.contract.json",
  "deploy/usage/quota-display.contract.json",
  "deploy/usage/partner-sla-reconciliation-readiness.contract.json",
  "deploy/watchlist/alerts.contract.json",
  "deploy/watchlist/briefings.contract.json",
  "docs/governance/corporate-action-benchmark-parity-scaffold.md",
  "docs/governance/field-rights-live-policy-source-readiness.md",
  "docs/governance/serving-quality-live-readiness.md",
  "docs/governance/partner-sla-reconciliation-readiness.md",
  "tasks/contracts/corporate-action-benchmark-parity-scaffold.contract.md",
  "tasks/contracts/field-rights-live-policy-source-readiness.contract.md",
  "tasks/contracts/serving-quality-live-readiness.contract.md",
  "tasks/contracts/partner-sla-reconciliation-readiness.contract.md",
  "tasks/notes/corporate-action-benchmark-parity-scaffold.notes.md",
  "tasks/notes/field-rights-live-policy-source-readiness.notes.md",
  "tasks/notes/serving-quality-live-readiness.notes.md",
  "tasks/notes/partner-sla-reconciliation-readiness.notes.md"
];

const tracker = readText(trackerPath);
const packageJson = readJson(packageJsonPath);
const errors = [
  ...validateMatrix(tracker),
  ...validateEvidencePaths(),
  ...validatePackageScripts(packageJson),
  ...validateChangelog(tracker)
];

if (errors.length > 0) {
  emit(
    {
      errors,
      path: trackerPath,
      status: "invalid_traceability_matrix"
    },
    1
  );
}

emit(
  {
    checked_rows: requiredChecked.length,
    guarded_unchecked_rows: requiredUnchecked.length,
    status: "ok"
  },
  0
);

function validateMatrix(text) {
  const errors = [];
  const matrix = extractSection(text, "## §M 需求 → Sprint 追溯矩阵", "## §F 接入 harness");
  const statuses = parseStatuses(matrix);

  for (const code of requiredChecked) {
    if (statuses.get(code) !== "☑") {
      errors.push(`${code} must be checked in §M traceability matrix`);
    }
  }

  for (const code of requiredUnchecked) {
    if (statuses.get(code) !== "☐") {
      errors.push(`${code} must remain unchecked until live/UI/external evidence is complete`);
    }
  }

  return errors;
}

function parseStatuses(section) {
  const statuses = new Map();

  for (const line of section.split("\n")) {
    const match = line.match(/^\|\s+([A-Z]+-\d{2})\b.*\|\s*([☐☑])\s*\|\s*$/u);
    if (match) {
      statuses.set(match[1], match[2]);
    }
  }

  return statuses;
}

function validateEvidencePaths() {
  return evidencePaths
    .filter((path) => !existsSync(resolve(process.cwd(), path)))
    .map((path) => `evidence path missing: ${path}`);
}

function validatePackageScripts(value) {
  const errors = [];
  const scripts = value?.scripts ?? {};

  if (scripts["check:traceability-matrix"] !== "node scripts/check-traceability-matrix-status.mjs") {
    errors.push("package.json scripts.check:traceability-matrix must run the matrix checker");
  }

  if (!String(scripts.check ?? "").includes("npm run check:traceability-matrix")) {
    errors.push("package.json scripts.check must include npm run check:traceability-matrix");
  }

  return errors;
}

function validateChangelog(text) {
  if (!text.includes("| 2026-06-22 | 1.0fl | 完成 `traceability-matrix-sync`")) {
    return ["tracker changelog must include version 1.0fl for traceability-matrix-sync"];
  }

  if (!text.includes("| 2026-06-22 | 1.0fq | 完成 `partner-sla-reconciliation-readiness`")) {
    return ["tracker changelog must include version 1.0fq for partner-sla-reconciliation-readiness"];
  }

  return [];
}

function extractSection(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start);

  if (start === -1 || end === -1 || end <= start) {
    emit(
      {
        endMarker,
        startMarker,
        status: "missing_section"
      },
      1
    );
  }

  return text.slice(start, end);
}

function readText(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), "utf8");
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "missing_text"
      },
      1
    );
  }
}

function readJson(path) {
  try {
    return JSON.parse(readText(path));
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "invalid_json"
      },
      1
    );
  }
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
