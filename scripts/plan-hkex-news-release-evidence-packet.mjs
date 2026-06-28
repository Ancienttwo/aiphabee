#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const { Client } = pg;

const contractPath = "deploy/ingest/hkex-news-release-evidence-packet.contract.json";
const sourceContractPath = "deploy/ingest/hkex-news-ingest.contract.json";
const readbackContractPath = "deploy/ingest/hkex-news-release-readback.contract.json";
const packagePath = "package.json";
const expectedVersion = "2026-06-28.hkex-news-release-evidence-packet.v0";
const expectedScript = "node scripts/plan-hkex-news-release-evidence-packet.mjs --check";
const args = process.argv.slice(2);
const live = args.includes("--live");

const contract = readJson(contractPath);
const sourceContract = readJson(sourceContractPath);
const readbackContract = readJson(readbackContractPath);
const packageJson = readJson(packagePath);
const errors = [
  ...validateContract(contract),
  ...validateSourceContract(sourceContract),
  ...validateReadbackContract(readbackContract),
  ...validatePackage(packageJson),
  ...validateNoSecrets(contract),
  ...validateNoSecrets(sourceContract.release_evidence_packet ?? {})
];

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contractPath,
      status: "invalid_contract",
      version: expectedVersion
    },
    1
  );
}

if (!live) {
  emit(
    {
      mode: "local_contract",
      live_requires_flag: "--live",
      packet_kind: contract.packet_kind,
      status: "ok",
      version: expectedVersion
    },
    0
  );
}

const databaseUrl = databaseUrlFromEnv();
if (!databaseUrl) {
  emit(
    releaseEvidencePacket({
      dataVersion: null,
      metrics: {},
      releaseReadbackPass: false,
      releaseState: null,
      releaseValidationPass: false,
      status: "missing_database_url"
    }),
    1
  );
}

const client = new Client({ connectionString: databaseUrl });
await client.connect();
try {
  await configureReadOnlySession(client);
  const state = await readReleaseState(client, optionValue("--data-version"));
  const packet = releaseEvidencePacket(state);
  emit(packet, acceptedPacketStatuses().includes(packet.status) ? 0 : 1);
} finally {
  await client.end().catch(() => undefined);
}

async function configureReadOnlySession(client) {
  await client.query("set application_name = 'aiphabee-hkex-release-evidence-packet'");
  await client.query("set statement_timeout = '2min'");
  await client.query("set default_transaction_read_only = on");
}

async function readReleaseState(client, dataVersion) {
  const targetWhere = dataVersion
    ? "where data_version = $1 and data_version like 'dv_hkex_news_%'"
    : "where data_version like 'dv_hkex_news_%'";
  const params = dataVersion ? [dataVersion] : [];
  const result = await client.query(
    `
      with target as (
        select
          data_version,
          source_batch_id,
          release_state,
          released_at,
          created_at
        from core.data_version_batch
        ${targetWhere}
        order by released_at desc nulls last, created_at desc, data_version desc
        limit 1
      ),
      latest_crawl as (
        select status, error_count
        from core.hkex_news_crawl_run
        where data_version = (select data_version from target)
        order by completed_at desc nulls last, crawl_run_id desc
        limit 1
      ),
      observation_counts as (
        select count(distinct document_id)::int as document_count
        from core.hkex_news_document_observation
        where data_version = (select data_version from target)
      ),
      fact_counts as (
        select count(distinct extracted_fact_id)::int as extracted_fact_count
        from core.hkex_news_extracted_fact
        where data_version = (select data_version from target)
          and fact_namespace = 'hkex_news'
      ),
      latest_transform as (
        select status, validation_report
        from core.hkex_news_transform_run
        where data_version = (select data_version from target)
        order by completed_at desc nulls last, transform_run_id desc
        limit 1
      )
      select
        target.data_version,
        target.source_batch_id,
        target.release_state,
        target.released_at,
        cr.status as crawl_status,
        cr.error_count,
        coalesce(obs.document_count, 0)::int as document_count,
        coalesce(fact.extracted_fact_count, 0)::int as extracted_fact_count,
        tx.status as transform_status,
        tx.validation_report
      from target
      left join latest_crawl cr on true
      left join observation_counts obs on true
      left join fact_counts fact on true
      left join latest_transform tx on true
    `,
    params
  );
  const row = result.rows[0];
  if (!row) {
    return {
      dataVersion: null,
      metrics: {},
      releaseReadbackPass: false,
      releaseState: null,
      releaseValidationPass: false,
      status: "blocked_no_hkex_data_version"
    };
  }

  const validationReport = isRecord(row.validation_report) ? row.validation_report : {};
  const documentCount = Number(row.document_count ?? 0);
  const extractedFactCount = Number(row.extracted_fact_count ?? 0);
  const expectedDocumentCount = integerOrNull(validationReport.document_count);
  const expectedFactCount = integerOrNull(validationReport.candidate_fact_count);
  const countsMatchTransform = (expectedDocumentCount === null || documentCount === expectedDocumentCount)
    && (expectedFactCount === null || extractedFactCount === expectedFactCount);
  const releaseValidationPass = row.release_state === "held"
    && row.crawl_status === "completed"
    && Number(row.error_count ?? 0) === 0
    && (documentCount === 0 || extractedFactCount > 0)
    && row.transform_status === "completed"
    && countsMatchTransform;
  const releaseReadbackPass = row.release_state === "released"
    && Boolean(row.released_at)
    && row.crawl_status === "completed"
    && Number(row.error_count ?? 0) === 0
    && row.transform_status === "completed";

  return {
    dataVersion: row.data_version,
    metrics: {
      counts_match_transform: countsMatchTransform,
      crawl_error_count: Number(row.error_count ?? 0),
      crawl_status: row.crawl_status ?? null,
      document_count: documentCount,
      expected_document_count: expectedDocumentCount,
      expected_fact_count: expectedFactCount,
      extracted_fact_count: extractedFactCount,
      released_at_present: Boolean(row.released_at),
      source_batch_id_hash: prefixedHash("sha256", row.source_batch_id),
      transform_status: row.transform_status ?? null,
      validation_report_hash: prefixedHash("sha256", JSON.stringify(validationReport))
    },
    releaseReadbackPass,
    releaseState: row.release_state,
    releaseValidationPass,
    status: statusForReleaseState(row.release_state, releaseValidationPass, releaseReadbackPass)
  };
}

function releaseEvidencePacket({
  dataVersion,
  metrics,
  releaseReadbackPass,
  releaseState,
  releaseValidationPass,
  status
}) {
  const packet = {
    approval_id_required_for_release: true,
    approval_id_supplied: false,
    data_version_hash: dataVersion ? prefixedHash("sha256", dataVersion) : null,
    manual_approval_required: true,
    metrics,
    packet_kind: "hkex_news_release_evidence_packet",
    release_execution_allowed_by_packet: false,
    release_readback_pass: releaseReadbackPass,
    release_state: releaseState,
    release_validation_pass: releaseValidationPass,
    status,
    version: expectedVersion,
    writes_database: false,
    writes_object_store: false,
    writes_serving_tables: false
  };
  return {
    ...packet,
    packet_hash: prefixedHash("sha256", JSON.stringify(packet))
  };
}

function statusForReleaseState(releaseState, releaseValidationPass, releaseReadbackPass) {
  if (releaseState === "held") {
    return releaseValidationPass ? "ready_for_manual_release_approval" : "blocked_release_validation_failed";
  }
  if (releaseState === "released") {
    return releaseReadbackPass ? "released_readback_passed" : "blocked_release_readback_failed";
  }
  return "blocked_unexpected_release_state";
}

function validateContract(value) {
  const validationErrors = [];
  if (!isRecord(value)) return ["release evidence packet contract must be an object"];
  for (const [field, expected] of Object.entries({
    checker: "scripts/plan-hkex-news-release-evidence-packet.mjs",
    package: "@aiphabee/data-ingest",
    package_script: "npm run check:hkex-news-release-evidence-packet",
    packet_kind: "hkex_news_release_evidence_packet",
    provider: "postgres",
    release_readback_contract: readbackContractPath,
    source_contract: sourceContractPath,
    status: "local_contract",
    version: expectedVersion
  })) {
    if (value[field] !== expected) validationErrors.push(`${field} must be ${expected}`);
  }
  if (value.live_command !== "DATA_INGEST_DATABASE_URL=<database_url> node scripts/plan-hkex-news-release-evidence-packet.mjs --live --check") {
    validationErrors.push("live_command mismatch");
  }
  validationErrors.push(
    ...validateStringArray(
      value.database_url_env,
      ["DATA_INGEST_DATABASE_URL", "IPO_DATABASE_URL", "DATABASE_URL"],
      "database_url_env"
    ),
    ...validateStringArray(value.accepted_packet_statuses, acceptedPacketStatuses(), "accepted_packet_statuses"),
    ...validateStringArray(
      value.blocking_packet_statuses,
      [
        "blocked_no_hkex_data_version",
        "blocked_release_validation_failed",
        "blocked_release_readback_failed",
        "blocked_unexpected_release_state",
        "missing_database_url"
      ],
      "blocking_packet_statuses"
    ),
    ...validateStringArray(
      value.target_tables,
      [
        "core.data_version_batch",
        "core.hkex_news_crawl_run",
        "core.hkex_news_document_observation",
        "core.hkex_news_extracted_fact",
        "core.hkex_news_transform_run"
      ],
      "target_tables"
    ),
    ...validateStringArray(
      value.response_fields,
      [
        "data_version_hash",
        "release_state",
        "release_validation_pass",
        "release_readback_pass",
        "manual_approval_required",
        "approval_id_required_for_release",
        "writes_database",
        "packet_hash"
      ],
      "response_fields"
    ),
    ...validateSafeOutputPolicy(value.safe_output_policy, "safe_output_policy")
  );
  for (const field of ["manual_approval_required", "approval_id_required_for_release", "read_only_database", "hash_only_response"]) {
    if (value[field] !== true) validationErrors.push(`${field} must be true`);
  }
  for (const field of [
    "writes_database",
    "writes_object_store",
    "writes_serving_tables",
    "promotes_facts",
    "releases_data_version"
  ]) {
    if (value[field] !== false) validationErrors.push(`${field} must be false`);
  }
  if (value.approval_id_output !== "not_accepted_or_emitted") {
    validationErrors.push("approval_id_output must be not_accepted_or_emitted");
  }
  if (value.verification?.contract_check !== "npm run check:hkex-news-release-evidence-packet") {
    validationErrors.push("verification.contract_check mismatch");
  }
  if (
    value.verification?.live_packet !==
    "DATA_INGEST_DATABASE_URL=<database_url> node scripts/plan-hkex-news-release-evidence-packet.mjs --live --check"
  ) {
    validationErrors.push("verification.live_packet mismatch");
  }
  return validationErrors;
}

function validateSourceContract(value) {
  const validationErrors = [];
  if (!isRecord(value)) return ["source contract must be an object"];
  const packet = value.release_evidence_packet;
  if (!isRecord(packet)) return ["source contract must include release_evidence_packet"];
  for (const [field, expected] of Object.entries({
    checker: "scripts/plan-hkex-news-release-evidence-packet.mjs",
    contract: contractPath,
    package_script: "npm run check:hkex-news-release-evidence-packet",
    version: expectedVersion
  })) {
    if (packet[field] !== expected) {
      validationErrors.push(`source contract release_evidence_packet.${field} must be ${expected}`);
    }
  }
  for (const field of ["manual_approval_required", "hash_only_response", "read_only_database"]) {
    if (packet[field] !== true) validationErrors.push(`source contract release_evidence_packet.${field} must be true`);
  }
  for (const field of ["writes_database", "releases_data_version", "emits_approval_id"]) {
    if (packet[field] !== false) validationErrors.push(`source contract release_evidence_packet.${field} must be false`);
  }
  return validationErrors;
}

function validateReadbackContract(value) {
  const validationErrors = [];
  if (value.version !== "2026-06-28.hkex-news-release-readback.v0") {
    validationErrors.push("release readback contract version mismatch");
  }
  if (value.checker !== "scripts/check-hkex-news-release-readback.mjs") {
    validationErrors.push("release readback checker mismatch");
  }
  if (value.writes_database !== false || value.hash_only_response !== true) {
    validationErrors.push("release readback contract must remain read-only and hash-only");
  }
  return validationErrors;
}

function validatePackage(value) {
  const scripts = value?.scripts ?? {};
  const validationErrors = [];
  if (scripts["check:hkex-news-release-evidence-packet"] !== expectedScript) {
    validationErrors.push(`package.json check:hkex-news-release-evidence-packet must be ${expectedScript}`);
  }
  const rootCheck = String(scripts.check ?? "");
  const readbackIndex = rootCheck.indexOf("npm run check:hkex-news-release-readback");
  const packetIndex = rootCheck.indexOf("npm run check:hkex-news-release-evidence-packet");
  const publicSourceIndex = rootCheck.indexOf("npm run check:hk-ipo-public-sources");
  if (packetIndex < 0) validationErrors.push("root check must include check:hkex-news-release-evidence-packet");
  if (readbackIndex < 0 || packetIndex < readbackIndex) {
    validationErrors.push("root check must run release evidence packet after release readback");
  }
  if (publicSourceIndex < 0 || packetIndex > publicSourceIndex) {
    validationErrors.push("root check must run release evidence packet before HK IPO public source checks");
  }
  return validationErrors;
}

function validateSafeOutputPolicy(value, name) {
  if (!isRecord(value)) return [`${name} must be an object`];
  const validationErrors = [];
  for (const field of [
    "no_database_url",
    "no_password",
    "no_secret",
    "no_raw_payload",
    "no_raw_html",
    "no_source_url",
    "no_security_code",
    "no_approval_id",
    "counts_and_hashes_only"
  ]) {
    if (value[field] !== true) validationErrors.push(`${name}.${field} must be true`);
  }
  return validationErrors;
}

function validateStringArray(value, expectedValues, name) {
  const validationErrors = [];
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    return [`${name} must be a string array`];
  }
  for (const expected of expectedValues) {
    if (!value.includes(expected)) validationErrors.push(`${name} missing ${expected}`);
  }
  return validationErrors;
}

function validateNoSecrets(value) {
  const serialized = JSON.stringify(value);
  return [
    /postgres(?:ql)?:\/\//iu,
    /Bearer\s+[A-Za-z0-9._-]{20,}/u,
    /sk-[A-Za-z0-9_-]{10,}/u,
    /gh[pousr]_[A-Za-z0-9_]{20,}/u,
    /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
  ]
    .filter((pattern) => pattern.test(serialized))
    .map((pattern) => `secret-like value matched ${pattern.source}`);
}

function acceptedPacketStatuses() {
  return ["ready_for_manual_release_approval", "released_readback_passed"];
}

function databaseUrlFromEnv() {
  return process.env.DATA_INGEST_DATABASE_URL ?? process.env.IPO_DATABASE_URL ?? process.env.DATABASE_URL;
}

function optionValue(name) {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const value = args[index + 1];
  return value && !value.startsWith("--") ? value : undefined;
}

function integerOrNull(value) {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && /^\d+$/u.test(value)) return Number(value);
  return null;
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
}

function prefixedHash(prefix, value) {
  return `${prefix}:${createHash(prefix).update(String(value ?? "")).digest("hex")}`;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
