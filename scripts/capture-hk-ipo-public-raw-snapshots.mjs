#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { readFileSync, writeSync } from "node:fs";
import { resolve } from "node:path";

const CAPTURE_VERSION = "2026-06-28.hk-ipo-public-raw-snapshot-capture.v0";
const contractPath = "deploy/ingest/hk-ipo-public-sources.contract.json";
const fixturePath = "skills/hkex-news-crawl-qa/evals/public-source-observation-fixtures.json";
const reconciliationScript = "scripts/reconcile-hk-ipo-public-observations.mjs";
const args = process.argv.slice(2);
const live = args.includes("--live");
const check = args.includes("--check");
const errors = [];

const contract = readJson(contractPath);
const fixtures = readJson(fixturePath);
const packet = runJsonScript(reconciliationScript, [live ? "--live" : "--fixtures", "--packet"]);

if (packet.packet_kind !== "hk_ipo_public_reconciliation_packet") {
  errors.push("reconciliation packet kind mismatch");
}

const capturePlan = await buildCapturePlan({ contract, fixtures, packet });
if (check) {
  errors.push(...validateCapturePlan(capturePlan, packet, contract));
}

if (errors.length > 0) {
  emit(
    {
      errors,
      mode: live ? "live" : "fixtures",
      plan: summarizeCapturePlan(capturePlan),
      status: "invalid_hk_ipo_public_raw_snapshot_capture",
      version: CAPTURE_VERSION
    },
    1
  );
}

emit(check ? summarizeCapturePlan(capturePlan) : capturePlan, 0);

async function buildCapturePlan({ contract: value, fixtures: fixtureSet, packet: packetValue }) {
  const sourceById = new Map(value.sources.map((source) => [source.id, source]));
  const requests = packetValue.raw_snapshot_requests ?? [];
  const requestGroups = groupBy(requests, (request) => `${request.source_id}:${request.source_url}`);
  const fetches = [];
  const fetchByKey = new Map();

  for (const [key, group] of [...requestGroups.entries()].sort()) {
    const first = group[0];
    const source = sourceById.get(first.source_id);
    if (!source) {
      errors.push(`capture source missing from contract: ${first.source_id}`);
      continue;
    }
    if (source.source_status !== "candidate") {
      errors.push(`capture source must be candidate: ${first.source_id}`);
    }
    if (first.source_url !== source.entry_url) {
      errors.push(`${first.request_id} source_url must match contract entry_url`);
    }

    const response = live ? await fetchText(first.source_url) : fixtureText(fixtureSet, first.source_id, first.source_url);
    const payloadHash = response.status_code === 200 ? prefixedHash("sha256", response.text) : null;
    const fetchSummary = {
      content_type: response.content_type,
      fetched_at: response.fetched_at,
      http_status_code: response.status_code,
      payload_bytes: Buffer.byteLength(response.text, "utf8"),
      payload_hash_sha256: payloadHash,
      payload_text_included: false,
      provider: source.provider,
      request_count: group.length,
      source_id: first.source_id,
      source_url: first.source_url,
      stores_raw_html_in_repo: false,
      writes_files: false
    };
    fetches.push(fetchSummary);
    fetchByKey.set(key, fetchSummary);
  }

  const rawSnapshotCaptures = requests.map((request) => {
    const fetchSummary = fetchByKey.get(`${request.source_id}:${request.source_url}`);
    const readyForExternalStore = fetchSummary?.http_status_code === 200 && Boolean(fetchSummary.payload_hash_sha256);
    return {
      blocker: "raw payload body or external storage reference is not emitted by this dry-run",
      captured_at: fetchSummary?.fetched_at ?? null,
      content_type: fetchSummary?.content_type ?? null,
      http_status_code: fetchSummary?.http_status_code ?? 0,
      observation_count: request.observation_ids.length,
      observation_ids_hash: prefixedHash("sha256", request.observation_ids),
      payload_bytes: fetchSummary?.payload_bytes ?? 0,
      payload_emitted: false,
      payload_hash_sha256: fetchSummary?.payload_hash_sha256 ?? null,
      payload_text_included: false,
      provider: request.provider,
      raw_snapshot_capture_id: `rsc_hk_ipo_public_${stableHash({
        payload_hash_sha256: fetchSummary?.payload_hash_sha256 ?? "missing",
        request_id: request.request_id
      }).slice(0, 24)}`,
      raw_snapshot_id: `raw_hk_ipo_public_${stableHash(request.request_id).slice(0, 24)}`,
      raw_snapshot_request_id: request.request_id,
      ready_for_external_snapshot_store: readyForExternalStore,
      ready_for_sql_payload: false,
      record_kind: "hk_ipo_public_source_record",
      security_code: request.security_code,
      source_id: request.source_id,
      source_record_id: request.source_record_id,
      source_url: request.source_url,
      stores_raw_html_in_repo: false,
      target_table: "core.raw_snapshot",
      writes_database: false,
      writes_files: false
    };
  });

  const payloadBytesTotal = rawSnapshotCaptures.reduce((sum, row) => sum + row.payload_bytes, 0);
  return {
    canonical_source: "hkex_news",
    emits_payload_text: false,
    generated_at: new Date().toISOString(),
    input_packet_version: packetValue.packet_version,
    mode: live ? "live" : "fixtures",
    packet_generated_at: packetValue.generated_at,
    promotes_facts: false,
    raw_snapshot_captures: rawSnapshotCaptures,
    source_fetches: fetches,
    status: "ok",
    stores_raw_html_in_repo: false,
    summary: {
      capture_count: rawSnapshotCaptures.length,
      failed_fetch_count: fetches.filter((fetch) => fetch.http_status_code !== 200).length,
      missing_capture_count: requests.length - rawSnapshotCaptures.length,
      payload_bytes_total: payloadBytesTotal,
      payload_hash_count: rawSnapshotCaptures.filter((row) => Boolean(row.payload_hash_sha256)).length,
      payloads_emitted_count: rawSnapshotCaptures.filter((row) => row.payload_emitted).length,
      raw_snapshot_request_count: requests.length,
      ready_for_external_snapshot_store_count: rawSnapshotCaptures.filter((row) => row.ready_for_external_snapshot_store).length,
      ready_for_sql_payload_count: rawSnapshotCaptures.filter((row) => row.ready_for_sql_payload).length,
      successful_fetch_count: fetches.filter((fetch) => fetch.http_status_code === 200).length,
      unique_fetch_count: fetches.length
    },
    version: CAPTURE_VERSION,
    writes_database: false,
    writes_files: false
  };
}

function validateCapturePlan(plan, packetValue, value) {
  const validationErrors = [];
  const requests = packetValue.raw_snapshot_requests ?? [];
  const requestIds = new Set(requests.map((request) => request.request_id));
  const captureByRequestId = new Map(plan.raw_snapshot_captures.map((row) => [row.raw_snapshot_request_id, row]));
  const sourceById = new Map(value.sources.map((source) => [source.id, source]));

  if (plan.version !== CAPTURE_VERSION) validationErrors.push("capture plan version mismatch");
  if (plan.canonical_source !== "hkex_news") validationErrors.push("capture plan canonical_source must be hkex_news");
  for (const field of ["emits_payload_text", "promotes_facts", "stores_raw_html_in_repo", "writes_database", "writes_files"]) {
    if (plan[field] !== false) validationErrors.push(`capture plan ${field} must be false`);
  }
  if (plan.summary.raw_snapshot_request_count !== requests.length) {
    validationErrors.push("raw snapshot request count mismatch");
  }
  if (plan.summary.capture_count !== requests.length) {
    validationErrors.push("each raw snapshot request must have a capture descriptor");
  }
  if (plan.summary.missing_capture_count !== 0) {
    validationErrors.push("capture plan must not have missing captures");
  }
  if (plan.summary.payloads_emitted_count !== 0) {
    validationErrors.push("capture plan must not emit payload text");
  }
  if (plan.summary.ready_for_sql_payload_count !== 0) {
    validationErrors.push("capture dry-run must not claim SQL payload readiness");
  }

  for (const fetchSummary of plan.source_fetches) {
    if (fetchSummary.http_status_code !== 200) {
      validationErrors.push(`${fetchSummary.source_id} fetch expected HTTP 200`);
    }
    if (fetchSummary.payload_text_included !== false) {
      validationErrors.push(`${fetchSummary.source_id} fetch must not include payload text`);
    }
    if (!/^sha256:[a-f0-9]{64}$/u.test(String(fetchSummary.payload_hash_sha256))) {
      validationErrors.push(`${fetchSummary.source_id} fetch missing sha256 payload hash`);
    }
  }

  for (const request of requests) {
    const source = sourceById.get(request.source_id);
    if (!source) {
      validationErrors.push(`${request.request_id} source missing from contract`);
      continue;
    }
    if (source.source_status !== "candidate") {
      validationErrors.push(`${request.request_id} source must be candidate`);
    }
    if (request.source_url !== source.entry_url) {
      validationErrors.push(`${request.request_id} source_url must match contract entry_url`);
    }
    const capture = captureByRequestId.get(request.request_id);
    if (!capture) {
      validationErrors.push(`${request.request_id} missing capture descriptor`);
      continue;
    }
    if (!requestIds.has(capture.raw_snapshot_request_id)) {
      validationErrors.push(`${capture.raw_snapshot_request_id} does not match packet request`);
    }
    if (!/^sha256:[a-f0-9]{64}$/u.test(String(capture.payload_hash_sha256))) {
      validationErrors.push(`${request.request_id} missing sha256 payload hash`);
    }
    if (capture.http_status_code !== 200) {
      validationErrors.push(`${request.request_id} expected HTTP 200 capture`);
    }
    if (capture.payload_bytes <= 0) {
      validationErrors.push(`${request.request_id} capture must include positive payload byte count`);
    }
    if (capture.payload_emitted !== false || capture.payload_text_included !== false) {
      validationErrors.push(`${request.request_id} must not emit payload text`);
    }
    if (capture.ready_for_external_snapshot_store !== true) {
      validationErrors.push(`${request.request_id} must be ready for external snapshot storage`);
    }
    if (capture.ready_for_sql_payload !== false) {
      validationErrors.push(`${request.request_id} must not claim SQL payload readiness`);
    }
    for (const forbidden of ["html", "text", "raw_html", "body", "payload"]) {
      if (Object.hasOwn(capture, forbidden)) {
        validationErrors.push(`${request.request_id} capture must not include raw ${forbidden}`);
      }
    }
  }

  return validationErrors;
}

function summarizeCapturePlan(plan) {
  return {
    canonical_source: plan.canonical_source,
    emits_payload_text: plan.emits_payload_text,
    mode: plan.mode,
    promotes_facts: plan.promotes_facts,
    source_fetches: plan.source_fetches,
    status: plan.status,
    stores_raw_html_in_repo: plan.stores_raw_html_in_repo,
    summary: plan.summary,
    version: plan.version,
    writes_database: plan.writes_database,
    writes_files: plan.writes_files
  };
}

async function fetchText(url) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,zh-HK;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AiphaBeeRawSnapshotCapture/0.1"
      },
      signal: AbortSignal.timeout(20000)
    });
    return {
      content_type: response.headers.get("content-type") ?? "unknown",
      fetched_at: new Date().toISOString(),
      status_code: response.status,
      text: await response.text()
    };
  } catch (error) {
    return {
      content_type: "fetch_error",
      fetched_at: new Date().toISOString(),
      status_code: 0,
      text: `FETCH_ERROR:${error instanceof Error ? error.message : String(error)}`
    };
  }
}

function fixtureText(fixtureSet, sourceId, sourceUrl) {
  const fixture = fixtureSet.fixtures?.find((item) => item.source_id === sourceId && item.source_url === sourceUrl);
  if (!fixture) {
    errors.push(`fixture missing source payload for ${sourceId}`);
    return {
      content_type: "missing_fixture",
      fetched_at: new Date().toISOString(),
      status_code: 0,
      text: ""
    };
  }
  return {
    content_type: "text/html; fixture=utf-8",
    fetched_at: fixture.observed_at,
    status_code: 200,
    text: fixture.html
  };
}

function runJsonScript(script, scriptArgs) {
  const result = spawnSync(process.execPath, [script, ...scriptArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 12 * 1024 * 1024
  });
  if (result.status !== 0) {
    errors.push(`${script} failed: ${result.stderr || result.stdout}`);
  }
  try {
    return JSON.parse(result.stdout);
  } catch {
    errors.push(`${script} did not emit JSON`);
    return { packet_kind: "invalid_json", raw_snapshot_requests: [] };
  }
}

function groupBy(values, keyFn) {
  const groups = new Map();
  for (const value of values) {
    const key = keyFn(value);
    const group = groups.get(key) ?? [];
    group.push(value);
    groups.set(key, group);
  }
  return groups;
}

function prefixedHash(prefix, value) {
  return `${prefix}:${stableHash(value)}`;
}

function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
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

function emit(payload, code) {
  writeSync(1, `${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
