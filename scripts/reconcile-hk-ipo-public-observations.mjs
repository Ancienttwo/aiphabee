#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { writeSync } from "node:fs";

const RECONCILIATION_VERSION = "2026-06-28.hk-ipo-public-reconciliation-dry-run.v0";
const PACKET_VERSION = "2026-06-28.hk-ipo-public-reconciliation-packet.v0";
const observationAdapterScript = "scripts/extract-hk-ipo-public-observations.mjs";
const args = process.argv.slice(2);
const live = args.includes("--live");
const check = args.includes("--check");
const packetMode = args.includes("--packet");
const errors = [];

const adapterPayload = runObservationAdapter(live ? ["--live"] : ["--fixtures"]);
if (adapterPayload.status !== "ok") {
  errors.push(`observation adapter returned status ${adapterPayload.status}`);
}

const report = buildReconciliationReport(adapterPayload);
const output = packetMode ? buildReconciliationPacket(report, adapterPayload) : report;
if (check) {
  errors.push(...validateReport(report));
  if (packetMode) {
    errors.push(...validatePacket(output));
  }
}

if (errors.length > 0) {
  emit(
    {
      errors,
      mode: live ? "live" : "fixtures",
      report: packetMode ? summarizePacket(output) : summarizeReport(report),
      status: packetMode ? "invalid_public_ipo_reconciliation_packet" : "invalid_public_ipo_reconciliation_dry_run",
      version: packetMode ? PACKET_VERSION : RECONCILIATION_VERSION
    },
    1
  );
}

emit(check ? (packetMode ? summarizePacket(output) : summarizeReport(report)) : output, 0);

function buildReconciliationReport(payload) {
  const observations = payload.runs.flatMap((run) => run.observations ?? []);
  const observationsBySecurityCode = groupBy(observations, (observation) => observation.security_code);
  const securities = [];

  for (const [securityCode, securityObservations] of [...observationsBySecurityCode.entries()].sort()) {
    const comparisons = [
      compareFact(securityObservations, "lot_size", [
        { field_name: "lot_size", source_id: "aastocks_ipo_plus" },
        { field_name: "lot_size", source_id: "vbkr_hk_ipo" }
      ]),
      compareFact(securityObservations, "listing_date", [
        { field_name: "listing_date", source_id: "aastocks_ipo_plus" },
        { field_name: "listed_date", source_id: "vbkr_hk_ipo" }
      ]),
      comparePriceRange(securityObservations)
    ].filter(Boolean);

    const hkexEvidence = collectHkexEvidence(securityObservations);
    const conflictCount = comparisons.filter((comparison) => comparison.status === "conflict").length;
    const agreementCount = comparisons.filter((comparison) => comparison.status === "agreement").length;
    const supplementCandidates = collectSupplementCandidates(securityObservations, comparisons);

    securities.push({
      agreement_count: agreementCount,
      comparison_count: comparisons.length,
      comparisons,
      conflict_count: conflictCount,
      dry_run_status: conflictCount > 0 ? "needs_review" : "ready_for_raw_snapshot_reconciliation",
      hkex_evidence: hkexEvidence,
      providers: [...new Set(securityObservations.map((observation) => observation.provider))].sort(),
      security_code: securityCode,
      source_ids: [...new Set(securityObservations.map((observation) => observation.source_id))].sort(),
      supplement_candidates: supplementCandidates
    });
  }

  const allComparisons = securities.flatMap((security) => security.comparisons);
  const allHkexEvidence = securities.flatMap((security) => security.hkex_evidence);
  const supplementCandidates = securities.flatMap((security) => security.supplement_candidates);

  return {
    generated_at: new Date().toISOString(),
    input_adapter_version: payload.adapter_version,
    mode: live ? "live" : "fixtures",
    promotes_facts: false,
    securities,
    summary: {
      agreement_count: allComparisons.filter((comparison) => comparison.status === "agreement").length,
      conflict_count: allComparisons.filter((comparison) => comparison.status === "conflict").length,
      compared_field_count: allComparisons.length,
      hkex_url_evidence_count: allHkexEvidence.length,
      security_count: securities.length,
      single_source_count: allComparisons.filter((comparison) => comparison.status === "single_source").length,
      supplement_candidate_count: supplementCandidates.length
    },
    version: RECONCILIATION_VERSION,
    writes_database: false,
    writes_files: false
  };
}

function buildReconciliationPacket(report, payload) {
  const observations = payload.runs.flatMap((run) => run.observations ?? []);
  const rawSnapshotRequests = buildRawSnapshotRequests(observations);
  const rawSnapshotRequestIdsByObservationId = new Map();
  for (const request of rawSnapshotRequests) {
    for (const observationId of request.observation_ids) {
      rawSnapshotRequestIdsByObservationId.set(observationId, request.request_id);
    }
  }

  const reconciliationRows = report.securities.flatMap((security) =>
    security.comparisons.map((comparison) => {
      const sourceObservationIds = observationIdsFromValues(comparison.values);
      return {
        canonical_candidate: comparison.canonical_candidate,
        confidence: comparison.confidence,
        conflict_requires_manual_review: comparison.status === "conflict",
        fact_name: comparison.fact_name,
        hkex_evidence_ids: security.hkex_evidence.map((evidence) => evidence.evidence_id),
        raw_snapshot_required: true,
        raw_snapshot_request_ids: unique(
          sourceObservationIds
            .map((observationId) => rawSnapshotRequestIdsByObservationId.get(observationId))
            .filter(Boolean)
        ),
        reason: comparison.reason,
        row_id: `ipo_public_reconciliation_${stableHash({
          fact_name: comparison.fact_name,
          security_code: security.security_code,
          source_observation_ids: sourceObservationIds.sort()
        }).slice(0, 24)}`,
        security_code: security.security_code,
        source_observation_ids: sourceObservationIds,
        source_ids: unique(comparison.values.map((value) => value.source_id)).sort(),
        status: comparison.status
      };
    })
  );

  const supplementCandidateRows = report.securities.flatMap((security) =>
    security.supplement_candidates.map((candidate) => ({
      field_name: candidate.field_name,
      field_value_type: candidate.field_value_type,
      provider: candidate.provider,
      raw_snapshot_required: true,
      raw_snapshot_request_id: rawSnapshotRequestIdsByObservationId.get(candidate.observation_id),
      reason: candidate.reason,
      row_id: `ipo_public_supplement_${stableHash({
        field_name: candidate.field_name,
        observation_id: candidate.observation_id,
        security_code: security.security_code
      }).slice(0, 24)}`,
      security_code: security.security_code,
      source_id: candidate.source_id,
      source_observation_id: candidate.observation_id,
      source_record_id: candidate.source_record_id,
      status: "candidate"
    }))
  );

  return {
    canonical_source: "hkex_news",
    generated_at: report.generated_at,
    input_adapter_version: report.input_adapter_version,
    mode: report.mode,
    packet_kind: "hk_ipo_public_reconciliation_packet",
    packet_version: PACKET_VERSION,
    promotes_facts: false,
    promotion_policy: {
      conflict_status: "conflict",
      hkex_url_host_required: "www1.hkexnews.hk",
      may_promote_statuses: ["agreement"],
      never_overwrite_hkex_fact_without_conflict_record: true,
      raw_snapshot_required_before_promotion: true,
      single_source_status: "single_source",
      source_attribution_required: true
    },
    raw_snapshot_requests: rawSnapshotRequests,
    reconciliation_rows: reconciliationRows,
    source_report_version: report.version,
    stores_raw_html_in_repo: false,
    summary: {
      ...report.summary,
      raw_snapshot_request_count: rawSnapshotRequests.length,
      reconciliation_row_count: reconciliationRows.length,
      supplement_candidate_row_count: supplementCandidateRows.length
    },
    supplement_candidate_rows: supplementCandidateRows,
    writes_database: false,
    writes_files: false
  };
}

function buildRawSnapshotRequests(observations) {
  const groups = groupBy(
    observations,
    (observation) => `${observation.source_id}:${observation.source_record_id}:${observation.source_url}`
  );
  return [...groups.values()]
    .map((group) => {
      const first = group[0];
      return {
        observation_ids: group.map((observation) => observation.observation_id).sort(),
        observed_at: first.observed_at,
        provider: first.provider,
        raw_snapshot_id: null,
        request_id: `raw_snapshot_request_${stableHash({
          source_id: first.source_id,
          source_record_id: first.source_record_id,
          source_url: first.source_url
        }).slice(0, 24)}`,
        required_before_promotion: true,
        security_code: first.security_code,
        source_id: first.source_id,
        source_record_id: first.source_record_id,
        source_url: first.source_url,
        status: "pending_snapshot",
        storage_target: "external_raw_snapshot_store",
        stores_raw_html_in_repo: false
      };
    })
    .sort((a, b) => a.request_id.localeCompare(b.request_id));
}

function compareFact(observations, factName, selectors) {
  const values = selectors
    .flatMap((selector) =>
      observations.filter(
        (observation) => observation.source_id === selector.source_id && observation.field_name === selector.field_name
      )
    )
    .map(toComparableValue)
    .filter((value) => value.normalized_value !== "");

  if (values.length === 0) return null;
  const uniqueValues = new Set(values.map((value) => value.normalized_value));
  return {
    canonical_candidate: uniqueValues.size === 1 ? values[0].field_value : null,
    confidence: uniqueValues.size === 1 && values.length > 1 ? "medium" : "low",
    fact_name: factName,
    reason:
      values.length === 1
        ? "only one public source supplied this fact"
        : uniqueValues.size === 1
          ? "public sources agree after normalization"
          : "public sources disagree after normalization",
    status: values.length === 1 ? "single_source" : uniqueValues.size === 1 ? "agreement" : "conflict",
    values
  };
}

function comparePriceRange(observations) {
  const aastocksRange = observations
    .filter((observation) => observation.source_id === "aastocks_ipo_plus" && observation.field_name === "offer_price_or_range")
    .map((observation) => {
      const parsed = parsePriceRange(observation.field_value);
      return parsed
        ? {
            field_name: observation.field_name,
            field_value: parsed,
            normalized_value: `${parsed.low}-${parsed.high}`,
            observed_at: observation.observed_at,
            observation_id: observation.observation_id,
            provider: observation.provider,
            source_id: observation.source_id,
            source_record_id: observation.source_record_id
          }
        : null;
    })
    .filter(Boolean);
  const low = observations.find((observation) => observation.source_id === "vbkr_hk_ipo" && observation.field_name === "issue_low_price");
  const high = observations.find((observation) => observation.source_id === "vbkr_hk_ipo" && observation.field_name === "issue_high_price");
  const vbkrRange =
    low && high
      ? [
          {
            field_name: "issue_price_range",
            field_value: { high: high.field_value, low: low.field_value },
            normalized_value: `${normalizeNumber(low.field_value)}-${normalizeNumber(high.field_value)}`,
            observed_at: low.observed_at,
            observation_id: `${low.observation_id}|${high.observation_id}`,
            provider: low.provider,
            source_id: low.source_id,
            source_record_id: low.source_record_id
          }
        ]
      : [];

  const values = [...aastocksRange, ...vbkrRange];
  if (values.length === 0) return null;
  const uniqueValues = new Set(values.map((value) => value.normalized_value));
  return {
    canonical_candidate: uniqueValues.size === 1 ? values[0].field_value : null,
    confidence: uniqueValues.size === 1 && values.length > 1 ? "medium" : "low",
    fact_name: "issue_price_range",
    reason:
      values.length === 1
        ? "only one public source supplied this fact"
        : uniqueValues.size === 1
          ? "public sources agree after normalization"
          : "public sources disagree after normalization",
    status: values.length === 1 ? "single_source" : uniqueValues.size === 1 ? "agreement" : "conflict",
    values
  };
}

function collectHkexEvidence(observations) {
  return observations
    .filter((observation) => observation.field_name === "prospectus_url")
    .filter((observation) => isOfficialHkexUrl(observation.field_value))
    .map((observation) => ({
      evidence_id: `hkex_evidence_${stableHash(observation.observation_id).slice(0, 16)}`,
      evidence_type: "official_hkex_url",
      field_name: observation.field_name,
      observed_at: observation.observed_at,
      provider: observation.provider,
      source_id: observation.source_id,
      source_record_id: observation.source_record_id,
      url: observation.field_value
    }));
}

function collectSupplementCandidates(observations, comparisons) {
  const comparedFields = new Set(comparisons.flatMap((comparison) => comparison.values.map((value) => value.field_name)));
  const candidates = [];
  for (const observation of observations) {
    if (comparedFields.has(observation.field_name)) continue;
    if (["company_summary_url"].includes(observation.field_name)) continue;
    candidates.push({
      field_name: observation.field_name,
      field_value_type: observation.field_value_type,
      observation_id: observation.observation_id,
      observed_at: observation.observed_at,
      provider: observation.provider,
      reason: "third-party field not yet available from HKEX document observation dry run",
      source_id: observation.source_id,
      source_record_id: observation.source_record_id
    });
  }
  return uniqueBy(candidates, (candidate) => `${candidate.source_id}:${candidate.source_record_id}:${candidate.field_name}`);
}

function toComparableValue(observation) {
  return {
    field_name: observation.field_name,
    field_value: observation.field_value,
    normalized_value: normalizeComparable(observation.field_value),
    observed_at: observation.observed_at,
    observation_id: observation.observation_id,
    provider: observation.provider,
    source_id: observation.source_id,
    source_record_id: observation.source_record_id
  };
}

function validateReport(report) {
  const validationErrors = [];
  if (report.version !== RECONCILIATION_VERSION) {
    validationErrors.push("reconciliation version mismatch");
  }
  if (report.writes_database !== false || report.writes_files !== false || report.promotes_facts !== false) {
    validationErrors.push("reconciliation dry-run must not write or promote facts");
  }
  if (report.summary.security_count < 1) {
    validationErrors.push("reconciliation must include at least one security");
  }
  if (report.summary.compared_field_count < 1) {
    validationErrors.push("reconciliation must compare at least one field");
  }
  if (report.summary.agreement_count < 1) {
    validationErrors.push("reconciliation must find at least one agreement in fixture/current source overlap");
  }
  if (report.summary.hkex_url_evidence_count < 1) {
    validationErrors.push("reconciliation must find at least one official HKEX URL evidence");
  }
  for (const security of report.securities) {
    if (!/^\d{5}\.HK$/u.test(security.security_code)) {
      validationErrors.push(`${security.security_code} must use 00000.HK format`);
    }
    for (const comparison of security.comparisons) {
      if (!["agreement", "conflict", "single_source"].includes(comparison.status)) {
        validationErrors.push(`${security.security_code}.${comparison.fact_name} has invalid status ${comparison.status}`);
      }
    }
    for (const evidence of security.hkex_evidence) {
      if (!isOfficialHkexUrl(evidence.url)) {
        validationErrors.push(`${security.security_code} hkex evidence must use official HKEX URL`);
      }
    }
  }
  return validationErrors;
}

function validatePacket(packet) {
  const validationErrors = [];
  if (packet.packet_version !== PACKET_VERSION) {
    validationErrors.push("packet version mismatch");
  }
  if (packet.packet_kind !== "hk_ipo_public_reconciliation_packet") {
    validationErrors.push("packet kind mismatch");
  }
  if (packet.source_report_version !== RECONCILIATION_VERSION) {
    validationErrors.push("packet source_report_version mismatch");
  }
  if (
    packet.writes_database !== false ||
    packet.writes_files !== false ||
    packet.promotes_facts !== false ||
    packet.stores_raw_html_in_repo !== false
  ) {
    validationErrors.push("reconciliation packet must not write, store raw HTML in repo, or promote facts");
  }
  if (packet.canonical_source !== "hkex_news") {
    validationErrors.push("packet canonical_source must remain hkex_news");
  }
  if (!packet.promotion_policy?.raw_snapshot_required_before_promotion) {
    validationErrors.push("packet promotion policy must require raw snapshot before promotion");
  }
  if (!packet.promotion_policy?.source_attribution_required) {
    validationErrors.push("packet promotion policy must require source attribution");
  }
  if (packet.promotion_policy?.hkex_url_host_required !== "www1.hkexnews.hk") {
    validationErrors.push("packet promotion policy must require www1.hkexnews.hk evidence host");
  }
  if (
    !Array.isArray(packet.promotion_policy?.may_promote_statuses) ||
    packet.promotion_policy.may_promote_statuses.length !== 1 ||
    packet.promotion_policy.may_promote_statuses[0] !== "agreement"
  ) {
    validationErrors.push("packet promotion policy must allow only reconciled agreement promotion candidates");
  }
  if (!Array.isArray(packet.raw_snapshot_requests) || packet.raw_snapshot_requests.length < 1) {
    validationErrors.push("packet must include raw_snapshot_requests");
  }
  if (!Array.isArray(packet.reconciliation_rows) || packet.reconciliation_rows.length < 1) {
    validationErrors.push("packet must include reconciliation_rows");
  }
  if (!Array.isArray(packet.supplement_candidate_rows)) {
    validationErrors.push("packet must include supplement_candidate_rows");
  }
  if (packet.summary?.raw_snapshot_request_count !== packet.raw_snapshot_requests?.length) {
    validationErrors.push("packet raw_snapshot_request_count mismatch");
  }
  if (packet.summary?.reconciliation_row_count !== packet.reconciliation_rows?.length) {
    validationErrors.push("packet reconciliation_row_count mismatch");
  }
  if (packet.summary?.supplement_candidate_row_count !== packet.supplement_candidate_rows?.length) {
    validationErrors.push("packet supplement_candidate_row_count mismatch");
  }
  const rawSnapshotRequestIds = new Set();
  for (const request of packet.raw_snapshot_requests ?? []) {
    rawSnapshotRequestIds.add(request.request_id);
    if (!/^raw_snapshot_request_[a-f0-9]{24}$/u.test(request.request_id)) {
      validationErrors.push(`raw snapshot request id invalid: ${request.request_id}`);
    }
    if (request.status !== "pending_snapshot") {
      validationErrors.push(`${request.request_id} status must be pending_snapshot`);
    }
    if (request.raw_snapshot_id !== null || request.required_before_promotion !== true) {
      validationErrors.push(`${request.request_id} must require a future raw snapshot id`);
    }
    if (request.stores_raw_html_in_repo !== false || request.storage_target !== "external_raw_snapshot_store") {
      validationErrors.push(`${request.request_id} must keep raw HTML out of repo storage`);
    }
    if (!isIsoInstant(request.observed_at)) {
      validationErrors.push(`${request.request_id} observed_at must be an ISO timestamp`);
    }
    if (!isHttpUrl(request.source_url)) {
      validationErrors.push(`${request.request_id} source_url must be an HTTP URL`);
    }
  }
  for (const row of packet.reconciliation_rows ?? []) {
    if (!["agreement", "conflict", "single_source"].includes(row.status)) {
      validationErrors.push(`${row.row_id} has invalid status ${row.status}`);
    }
    if (!/^\d{5}\.HK$/u.test(row.security_code)) {
      validationErrors.push(`${row.row_id} must include 00000.HK security_code`);
    }
    if (!Array.isArray(row.source_observation_ids) || row.source_observation_ids.length < 1) {
      validationErrors.push(`${row.row_id} must reference source observations`);
    }
    if (!Array.isArray(row.raw_snapshot_request_ids) || row.raw_snapshot_request_ids.length < 1) {
      validationErrors.push(`${row.row_id} must reference raw snapshot requests`);
    }
    for (const requestId of row.raw_snapshot_request_ids ?? []) {
      if (!rawSnapshotRequestIds.has(requestId)) {
        validationErrors.push(`${row.row_id} references unknown raw snapshot request ${requestId}`);
      }
    }
    if (row.status === "conflict" && row.conflict_requires_manual_review !== true) {
      validationErrors.push(`${row.row_id} conflict must require manual review`);
    }
  }
  for (const row of packet.supplement_candidate_rows ?? []) {
    if (row.status !== "candidate") {
      validationErrors.push(`${row.row_id} supplement status must be candidate`);
    }
    if (!rawSnapshotRequestIds.has(row.raw_snapshot_request_id)) {
      validationErrors.push(`${row.row_id} references unknown raw snapshot request ${row.raw_snapshot_request_id}`);
    }
    if (row.raw_snapshot_required !== true) {
      validationErrors.push(`${row.row_id} must require raw snapshot`);
    }
  }
  return validationErrors;
}

function summarizeReport(report) {
  return {
    mode: report.mode,
    promotes_facts: report.promotes_facts,
    securities: report.securities.map((security) => ({
      agreement_count: security.agreement_count,
      comparison_count: security.comparison_count,
      conflict_count: security.conflict_count,
      dry_run_status: security.dry_run_status,
      hkex_evidence_count: security.hkex_evidence.length,
      providers: security.providers,
      security_code: security.security_code,
      source_ids: security.source_ids,
      supplement_candidate_count: security.supplement_candidates.length
    })),
    status: "ok",
    summary: report.summary,
    version: report.version,
    writes_database: report.writes_database,
    writes_files: report.writes_files
  };
}

function summarizePacket(packet) {
  return {
    canonical_source: packet.canonical_source,
    mode: packet.mode,
    packet_kind: packet.packet_kind,
    promotes_facts: packet.promotes_facts,
    promotion_policy: packet.promotion_policy,
    source_report_version: packet.source_report_version,
    status: "ok",
    summary: packet.summary,
    version: packet.packet_version,
    writes_database: packet.writes_database,
    writes_files: packet.writes_files
  };
}

function runObservationAdapter(adapterArgs) {
  const result = spawnSync(process.execPath, [observationAdapterScript, ...adapterArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024
  });
  if (result.status !== 0) {
    errors.push(`observation adapter failed: ${result.stderr || result.stdout}`);
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    errors.push("observation adapter did not emit JSON");
    return { runs: [], status: "invalid_json" };
  }
}

function parsePriceRange(value) {
  const text = String(value ?? "").replace(/\s+/gu, "");
  const match = text.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/u);
  if (!match) return null;
  return {
    high: Number(match[2]),
    low: Number(match[1])
  };
}

function normalizeComparable(value) {
  if (typeof value === "number") return normalizeNumber(value);
  if (typeof value === "boolean") return String(value);
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value ?? "")
    .toLowerCase()
    .replace(/,/gu, "")
    .replace(/\s+/gu, "")
    .trim();
}

function normalizeNumber(value) {
  const number = Number(String(value).replace(/,/gu, ""));
  return Number.isFinite(number) ? String(number) : "";
}

function isIsoInstant(value) {
  if (typeof value !== "string" || value.length === 0) return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed);
}

function isHttpUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function isOfficialHkexUrl(value) {
  try {
    const url = new URL(String(value));
    return url.hostname === "www1.hkexnews.hk";
  } catch {
    return false;
  }
}

function groupBy(values, keyFn) {
  const grouped = new Map();
  for (const value of values) {
    const key = keyFn(value);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(value);
  }
  return grouped;
}

function uniqueBy(values, keyFn) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    const key = keyFn(value);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(value);
  }
  return output;
}

function unique(values) {
  return [...new Set(values)];
}

function observationIdsFromValues(values) {
  return unique(
    values.flatMap((value) =>
      Array.isArray(value.observation_ids)
        ? value.observation_ids
        : String(value.observation_id)
            .split("|")
            .filter(Boolean)
    )
  );
}

function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function emit(payload, code) {
  writeSync(1, `${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
