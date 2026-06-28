#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const contractPath = "deploy/ingest/hk-ipo-public-sources.contract.json";
const researchPath = "docs/researches/20260627-hk-ipo-public-source-readiness.md";
const packagePath = "package.json";
const observationAdapterScript = "scripts/extract-hk-ipo-public-observations.mjs";
const reconciliationScript = "scripts/reconcile-hk-ipo-public-observations.mjs";
const schemaCheckerScript = "scripts/check-hk-ipo-public-observation-schema.mjs";
const rawSnapshotCaptureScript = "scripts/capture-hk-ipo-public-raw-snapshots.mjs";
const rawSnapshotStorageScript = "scripts/plan-hk-ipo-public-raw-snapshot-storage.mjs";
const rawSnapshotR2WriterScript = "scripts/smoke-hk-ipo-public-raw-snapshot-r2-writer.mjs";
const applyPlannerScript = "scripts/plan-hk-ipo-public-observation-apply.mjs";
const heldDbApplyPacketScript = "scripts/plan-hk-ipo-public-held-db-apply-packet.mjs";
const heldDbApplyLiveScript = "scripts/apply-hk-ipo-public-held-db-live.mjs";
const heldDbApplySmokeContractScript = "scripts/check-hk-ipo-public-held-db-apply-smoke-contract.mjs";
const heldDbReadbackScript = "scripts/check-hk-ipo-public-held-db-readback.mjs";
const heldReviewPacketScript = "scripts/plan-hk-ipo-public-held-review-packet.mjs";
const heldPromotionPreflightScript = "scripts/plan-hk-ipo-public-held-promotion-preflight.mjs";
const live = process.argv.includes("--live");

const contract = readJson(contractPath);
const research = readText(researchPath);
const rootPackage = readJson(packagePath);
const errors = validateStatic(contract, research, rootPackage);
const liveChecks = [];
const adapterChecks = [runObservationAdapterCheck(["--fixtures", "--check"])];
const reconciliationChecks = [runReconciliationCheck(["--fixtures", "--check"])];
const packetChecks = [runReconciliationPacketCheck(["--fixtures", "--packet", "--check"])];
const schemaChecks = [runSchemaPreflightCheck()];
const rawSnapshotCaptureChecks = [runRawSnapshotCaptureCheck(["--fixtures", "--check"])];
const rawSnapshotStorageChecks = [runRawSnapshotStorageCheck(["--fixtures", "--check"])];
const rawSnapshotR2WriterChecks = [runRawSnapshotR2WriterCheck(["--fixtures", "--check"])];
const applyPlanChecks = [runApplyPlanCheck(["--fixtures", "--check"])];
const heldDbApplyPacketChecks = [runHeldDbApplyPacketCheck(["--fixtures", "--check"])];
const heldDbApplySmokeChecks = [runHeldDbApplySmokeContractCheck()];
const heldDbReadbackChecks = [runHeldDbReadbackCheck()];
const heldReviewPacketChecks = [runHeldReviewPacketCheck(["--fixtures", "--check"])];
const heldPromotionPreflightChecks = [runHeldPromotionPreflightCheck(["--fixtures", "--check"])];
errors.push(...adapterChecks[0].errors);
errors.push(...reconciliationChecks[0].errors);
errors.push(...packetChecks[0].errors);
errors.push(...schemaChecks[0].errors);
errors.push(...rawSnapshotCaptureChecks[0].errors);
errors.push(...rawSnapshotStorageChecks[0].errors);
errors.push(...rawSnapshotR2WriterChecks[0].errors);
errors.push(...applyPlanChecks[0].errors);
errors.push(...heldDbApplyPacketChecks[0].errors);
errors.push(...heldDbApplySmokeChecks[0].errors);
errors.push(...heldDbReadbackChecks[0].errors);
errors.push(...heldReviewPacketChecks[0].errors);
errors.push(...heldPromotionPreflightChecks[0].errors);

if (errors.length === 0 && live) {
  liveChecks.push(...(await runLiveChecks(contract)));
  adapterChecks.push(runObservationAdapterCheck(["--live", "--check"]));
  reconciliationChecks.push(runReconciliationCheck(["--live", "--check"]));
  packetChecks.push(runReconciliationPacketCheck(["--live", "--packet", "--check"]));
  rawSnapshotCaptureChecks.push(runRawSnapshotCaptureCheck(["--live", "--check"]));
  rawSnapshotStorageChecks.push(runRawSnapshotStorageCheck(["--live", "--check"]));
  rawSnapshotR2WriterChecks.push(runRawSnapshotR2WriterCheck(["--live", "--check"]));
  applyPlanChecks.push(runApplyPlanCheck(["--live", "--check"]));
  heldDbApplyPacketChecks.push(runHeldDbApplyPacketCheck(["--live", "--check"]));
  heldReviewPacketChecks.push(runHeldReviewPacketCheck(["--live", "--check"]));
  heldPromotionPreflightChecks.push(runHeldPromotionPreflightCheck(["--live", "--check"]));
}

const liveErrors = [
  ...liveChecks.flatMap((check) => check.errors),
  ...adapterChecks.slice(1).flatMap((check) => check.errors),
  ...reconciliationChecks.slice(1).flatMap((check) => check.errors),
  ...packetChecks.slice(1).flatMap((check) => check.errors),
  ...rawSnapshotCaptureChecks.slice(1).flatMap((check) => check.errors),
  ...rawSnapshotStorageChecks.slice(1).flatMap((check) => check.errors),
  ...rawSnapshotR2WriterChecks.slice(1).flatMap((check) => check.errors),
  ...applyPlanChecks.slice(1).flatMap((check) => check.errors),
  ...heldDbApplyPacketChecks.slice(1).flatMap((check) => check.errors),
  ...heldReviewPacketChecks.slice(1).flatMap((check) => check.errors),
  ...heldPromotionPreflightChecks.slice(1).flatMap((check) => check.errors)
];
if (errors.length > 0 || liveErrors.length > 0) {
  emit(
    {
      adapter_checks: adapterChecks,
      apply_plan_checks: applyPlanChecks,
      contract: contractPath,
      errors: [...errors, ...liveErrors],
      held_db_apply_packet_checks: heldDbApplyPacketChecks,
      held_db_apply_smoke_checks: heldDbApplySmokeChecks,
      held_db_readback_checks: heldDbReadbackChecks,
      held_review_packet_checks: heldReviewPacketChecks,
      held_promotion_preflight_checks: heldPromotionPreflightChecks,
      live_checked: live,
      live_checks: liveChecks,
      packet_checks: packetChecks,
      raw_snapshot_capture_checks: rawSnapshotCaptureChecks,
      raw_snapshot_r2_writer_checks: rawSnapshotR2WriterChecks,
      raw_snapshot_storage_checks: rawSnapshotStorageChecks,
      reconciliation_checks: reconciliationChecks,
      schema_checks: schemaChecks,
      status: live ? "invalid_live_probe" : "invalid_contract"
    },
    1
  );
}

emit(
  {
    adapter_checks: adapterChecks,
    apply_plan_checks: applyPlanChecks,
    candidate_sources: contract.sources.filter((source) => source.source_status === "candidate").map((source) => source.id),
    contract: contractPath,
    held_db_apply_packet_checks: heldDbApplyPacketChecks,
    held_db_apply_smoke_checks: heldDbApplySmokeChecks,
    held_db_readback_checks: heldDbReadbackChecks,
    held_review_packet_checks: heldReviewPacketChecks,
    held_promotion_preflight_checks: heldPromotionPreflightChecks,
    live_checked: live,
    live_checks: liveChecks,
    packet_checks: packetChecks,
    raw_snapshot_capture_checks: rawSnapshotCaptureChecks,
    raw_snapshot_r2_writer_checks: rawSnapshotR2WriterChecks,
    raw_snapshot_storage_checks: rawSnapshotStorageChecks,
    reconciliation_checks: reconciliationChecks,
    schema_checks: schemaChecks,
    status: "ok",
    verification: contract.verification
  },
  0
);

function validateStatic(value, researchText, pkg) {
  const validationErrors = [];

  if (!isRecord(value)) {
    return ["contract must be an object"];
  }

  if (value.version !== "2026-06-27.hk-ipo-public-sources.v0") {
    validationErrors.push("contract version must be 2026-06-27.hk-ipo-public-sources.v0");
  }
  if (value.status !== "public_observation_contract") {
    validationErrors.push("contract status must be public_observation_contract");
  }
  if (value.canonical_source !== "hkex_news") {
    validationErrors.push("canonical_source must remain hkex_news");
  }

  validationErrors.push(...validateTruthContract(value.truth_contract));
  validationErrors.push(...validateProposedObservationRecord(value.proposed_observation_record));
  validationErrors.push(...validateObservationAdapter(value.observation_adapter));
  validationErrors.push(...validateReconciliationDryRun(value.reconciliation_dry_run));
  validationErrors.push(...validateReconciliationPacket(value.reconciliation_packet));
  validationErrors.push(...validateSchemaPreflight(value.schema_preflight));
  validationErrors.push(...validateRawSnapshotCapture(value.raw_snapshot_capture));
  validationErrors.push(...validateRawSnapshotStorage(value.raw_snapshot_storage));
  validationErrors.push(...validateRawSnapshotR2Writer(value.raw_snapshot_r2_writer_smoke));
  validationErrors.push(...validateApplyPlanner(value.apply_planner));
  validationErrors.push(...validateHeldDbApplyPacket(value.held_db_apply_packet));
  validationErrors.push(...validateHeldDbApplyLive(value.held_db_apply_live));
  validationErrors.push(...validateHeldDbApplySmoke(value.held_db_apply_smoke));
  validationErrors.push(...validateHeldDbReadback(value.held_db_readback));
  validationErrors.push(...validateHeldReviewPacket(value.held_review_packet));
  validationErrors.push(...validateHeldPromotionPreflight(value.held_promotion_preflight));
  validationErrors.push(...validateSources(value.sources));
  validationErrors.push(...validateVerification(value.verification));

  if (pkg.scripts?.["check:hk-ipo-public-sources"] !== "node scripts/check-hk-ipo-public-sources.mjs") {
    validationErrors.push("root package.json must expose check:hk-ipo-public-sources");
  }
  if (pkg.scripts?.["check:hk-ipo-public-observations"] !== "node scripts/extract-hk-ipo-public-observations.mjs --fixtures --check") {
    validationErrors.push("root package.json must expose check:hk-ipo-public-observations");
  }
  if (pkg.scripts?.["check:hk-ipo-public-reconciliation"] !== "node scripts/reconcile-hk-ipo-public-observations.mjs --fixtures --check") {
    validationErrors.push("root package.json must expose check:hk-ipo-public-reconciliation");
  }
  if (
    pkg.scripts?.["check:hk-ipo-public-reconciliation-packet"] !==
    "node scripts/reconcile-hk-ipo-public-observations.mjs --fixtures --packet --check"
  ) {
    validationErrors.push("root package.json must expose check:hk-ipo-public-reconciliation-packet");
  }
  if (pkg.scripts?.["check:hk-ipo-public-observation-schema"] !== `node ${schemaCheckerScript}`) {
    validationErrors.push("root package.json must expose check:hk-ipo-public-observation-schema");
  }
  if (
    pkg.scripts?.["check:hk-ipo-public-raw-snapshot-capture"] !==
    `node ${rawSnapshotCaptureScript} --fixtures --check`
  ) {
    validationErrors.push("root package.json must expose check:hk-ipo-public-raw-snapshot-capture");
  }
  if (
    pkg.scripts?.["check:hk-ipo-public-raw-snapshot-storage"] !==
    `node ${rawSnapshotStorageScript} --fixtures --check`
  ) {
    validationErrors.push("root package.json must expose check:hk-ipo-public-raw-snapshot-storage");
  }
  if (
    pkg.scripts?.["check:hk-ipo-public-raw-snapshot-r2-writer"] !==
    `node ${rawSnapshotR2WriterScript} --fixtures --check`
  ) {
    validationErrors.push("root package.json must expose check:hk-ipo-public-raw-snapshot-r2-writer");
  }
  if (pkg.scripts?.["check:hk-ipo-public-apply-plan"] !== `node ${applyPlannerScript} --fixtures --check`) {
    validationErrors.push("root package.json must expose check:hk-ipo-public-apply-plan");
  }
  if (
    pkg.scripts?.["check:hk-ipo-public-held-db-apply-packet"] !==
    `node ${heldDbApplyPacketScript} --fixtures --check`
  ) {
    validationErrors.push("root package.json must expose check:hk-ipo-public-held-db-apply-packet");
  }
  if (
    pkg.scripts?.["check:hk-ipo-public-held-db-apply-live"] !==
    `node ${heldDbApplyLiveScript} --check`
  ) {
    validationErrors.push("root package.json must expose check:hk-ipo-public-held-db-apply-live");
  }
  if (
    pkg.scripts?.["check:hk-ipo-public-held-db-apply-smoke"] !==
    `node ${heldDbApplySmokeContractScript}`
  ) {
    validationErrors.push("root package.json must expose check:hk-ipo-public-held-db-apply-smoke");
  }
  if (
    pkg.scripts?.["check:hk-ipo-public-held-db-readback"] !==
    `node ${heldDbReadbackScript} --check`
  ) {
    validationErrors.push("root package.json must expose check:hk-ipo-public-held-db-readback");
  }
  if (
    pkg.scripts?.["check:hk-ipo-public-held-review-packet"] !==
    `node ${heldReviewPacketScript} --fixtures --check`
  ) {
    validationErrors.push("root package.json must expose check:hk-ipo-public-held-review-packet");
  }
  if (
    pkg.scripts?.["check:hk-ipo-public-held-promotion-preflight"] !==
    `node ${heldPromotionPreflightScript} --fixtures --check`
  ) {
    validationErrors.push("root package.json must expose check:hk-ipo-public-held-promotion-preflight");
  }

  for (const fragment of [
    "AASTOCKS and VBKR/Huasheng are usable as public observation sources",
    "HKEX official crawler",
    "deploy/ingest/hk-ipo-public-sources.contract.json",
    "scripts/extract-hk-ipo-public-observations.mjs",
    "scripts/reconcile-hk-ipo-public-observations.mjs",
    "third_party_ipo_observation",
    "Reconciliation dry-run contract",
    "Reconciliation packet contract",
    "Schema preflight contract",
    "scripts/check-hk-ipo-public-observation-schema.mjs",
    "Raw snapshot capture dry-run",
    "scripts/capture-hk-ipo-public-raw-snapshots.mjs",
    "Raw snapshot storage reference plan",
    "scripts/plan-hk-ipo-public-raw-snapshot-storage.mjs",
    "Raw snapshot R2 writer smoke",
    "scripts/smoke-hk-ipo-public-raw-snapshot-r2-writer.mjs",
    "AIPHABEE_ARTIFACTS",
    "Apply planner dry-run",
    "scripts/plan-hk-ipo-public-observation-apply.mjs",
    "Held DB apply packet smoke",
    "scripts/plan-hk-ipo-public-held-db-apply-packet.mjs",
    "Live held DB apply",
    "scripts/apply-hk-ipo-public-held-db-live.mjs",
    "POST /ingest/hk-ipo-public/held-db-apply",
    "Held DB apply/readback smoke",
    "scripts/check-hk-ipo-public-held-db-apply-smoke-contract.mjs",
    "POST /ingest/hk-ipo-public/held-db-apply-smoke",
    "POST /ingest/hk-ipo-public/held-db-readback",
    "Held review packet",
    "scripts/plan-hk-ipo-public-held-review-packet.mjs",
    "Held promotion preflight",
    "scripts/plan-hk-ipo-public-held-promotion-preflight.mjs",
    "npm run check:hk-ipo-public-sources -- --live",
    "npm run check:hk-ipo-public-reconciliation-packet",
    "npm run check:hk-ipo-public-observation-schema",
    "npm run check:hk-ipo-public-raw-snapshot-capture",
    "npm run check:hk-ipo-public-raw-snapshot-storage",
    "npm run check:hk-ipo-public-raw-snapshot-r2-writer",
    "npm run check:hk-ipo-public-apply-plan",
    "npm run check:hk-ipo-public-held-db-apply-packet",
    "npm run check:hk-ipo-public-held-db-apply-live",
    "npm run check:hk-ipo-public-held-db-apply-smoke",
    "npm run check:hk-ipo-public-held-db-readback",
    "npm run check:hk-ipo-public-held-review-packet",
    "npm run check:hk-ipo-public-held-promotion-preflight",
    "ETNet and Futu/Moomoo stay out of default automation",
    "provider",
    "source_url",
    "observed_at",
    "raw snapshot"
  ]) {
    if (!researchText.includes(fragment)) {
      validationErrors.push(`${researchPath} missing fragment: ${fragment}`);
    }
  }

  return validationErrors;
}

function validateReconciliationPacket(value) {
  const validationErrors = [];
  if (!isRecord(value)) {
    return ["reconciliation_packet must be an object"];
  }
  if (value.version !== "2026-06-28.hk-ipo-public-reconciliation-packet.v0") {
    validationErrors.push("reconciliation_packet.version mismatch");
  }
  if (value.script !== reconciliationScript) {
    validationErrors.push(`reconciliation_packet.script must be ${reconciliationScript}`);
  }
  if (value.package_script !== "npm run check:hk-ipo-public-reconciliation-packet") {
    validationErrors.push("reconciliation_packet.package_script mismatch");
  }
  if (value.input_script !== observationAdapterScript) {
    validationErrors.push(`reconciliation_packet.input_script must be ${observationAdapterScript}`);
  }
  if (value.output_mode_flag !== "--packet") {
    validationErrors.push("reconciliation_packet.output_mode_flag must be --packet");
  }
  if (value.packet_kind !== "hk_ipo_public_reconciliation_packet") {
    validationErrors.push("reconciliation_packet.packet_kind mismatch");
  }
  if (value.source_report_version !== "2026-06-28.hk-ipo-public-reconciliation-dry-run.v0") {
    validationErrors.push("reconciliation_packet.source_report_version mismatch");
  }
  for (const field of ["writes_database", "writes_files", "stores_raw_html_in_repo", "promotes_facts"]) {
    if (value[field] !== false) {
      validationErrors.push(`reconciliation_packet.${field} must be false`);
    }
  }
  for (const status of ["pending_snapshot"]) {
    if (!value.raw_snapshot_request_statuses?.includes(status)) {
      validationErrors.push(`reconciliation_packet.raw_snapshot_request_statuses missing ${status}`);
    }
  }
  for (const status of ["agreement", "conflict", "single_source"]) {
    if (!value.reconciliation_row_statuses?.includes(status)) {
      validationErrors.push(`reconciliation_packet.reconciliation_row_statuses missing ${status}`);
    }
  }
  if (!value.supplement_row_statuses?.includes("candidate")) {
    validationErrors.push("reconciliation_packet.supplement_row_statuses missing candidate");
  }
  for (const section of [
    "raw_snapshot_requests",
    "reconciliation_rows",
    "supplement_candidate_rows",
    "promotion_policy",
    "summary"
  ]) {
    if (!value.required_sections?.includes(section)) {
      validationErrors.push(`reconciliation_packet.required_sections missing ${section}`);
    }
  }
  for (const field of ["raw_snapshot_request_count", "reconciliation_row_count", "supplement_candidate_row_count"]) {
    if (!value.required_summary_fields?.includes(field)) {
      validationErrors.push(`reconciliation_packet.required_summary_fields missing ${field}`);
    }
  }
  if (value.promotion_policy?.source_attribution_required !== true) {
    validationErrors.push("reconciliation_packet.promotion_policy.source_attribution_required must be true");
  }
  if (value.promotion_policy?.raw_snapshot_required_before_promotion !== true) {
    validationErrors.push("reconciliation_packet.promotion_policy.raw_snapshot_required_before_promotion must be true");
  }
  if (
    !Array.isArray(value.promotion_policy?.may_promote_statuses) ||
    value.promotion_policy.may_promote_statuses.length !== 1 ||
    value.promotion_policy.may_promote_statuses[0] !== "agreement"
  ) {
    validationErrors.push("reconciliation_packet.promotion_policy.may_promote_statuses must be [agreement]");
  }
  if (value.promotion_policy?.conflict_status !== "conflict") {
    validationErrors.push("reconciliation_packet.promotion_policy.conflict_status must be conflict");
  }
  if (value.promotion_policy?.single_source_status !== "single_source") {
    validationErrors.push("reconciliation_packet.promotion_policy.single_source_status must be single_source");
  }
  if (value.promotion_policy?.never_overwrite_hkex_fact_without_conflict_record !== true) {
    validationErrors.push(
      "reconciliation_packet.promotion_policy.never_overwrite_hkex_fact_without_conflict_record must be true"
    );
  }
  if (value.promotion_policy?.hkex_url_host_required !== "www1.hkexnews.hk") {
    validationErrors.push("reconciliation_packet.promotion_policy.hkex_url_host_required must be www1.hkexnews.hk");
  }
  return validationErrors;
}

function validateSchemaPreflight(value) {
  const validationErrors = [];
  if (!isRecord(value)) {
    return ["schema_preflight must be an object"];
  }
  if (value.version !== "2026-06-28.hk-ipo-public-observation-preflight.v0") {
    validationErrors.push("schema_preflight.version mismatch");
  }
  if (value.migration !== "supabase/migrations/20260628001000_hk_ipo_public_observation_preflight.sql") {
    validationErrors.push("schema_preflight.migration mismatch");
  }
  if (value.checker !== schemaCheckerScript) {
    validationErrors.push(`schema_preflight.checker must be ${schemaCheckerScript}`);
  }
  if (value.package_script !== "npm run check:hk-ipo-public-observation-schema") {
    validationErrors.push("schema_preflight.package_script mismatch");
  }
  if (value.database_contract !== "deploy/database/migrations.contract.json") {
    validationErrors.push("schema_preflight.database_contract mismatch");
  }
  for (const field of [
    "writes_database",
    "applies_remote_database",
    "loads_public_web_data",
    "stores_raw_html_in_repo",
    "promotes_facts"
  ]) {
    if (value[field] !== false) {
      validationErrors.push(`schema_preflight.${field} must be false`);
    }
  }
  if (value.canonical_source !== "hkex_news") {
    validationErrors.push("schema_preflight.canonical_source must be hkex_news");
  }
  for (const table of [
    "core.hk_ipo_public_source_run",
    "core.hk_ipo_public_observation",
    "core.hk_ipo_public_reconciliation_row",
    "core.hk_ipo_public_supplement_candidate",
    "governance.hk_ipo_public_observation_contract"
  ]) {
    if (!value.persistent_tables?.includes(table)) {
      validationErrors.push(`schema_preflight.persistent_tables missing ${table}`);
    }
  }
  for (const recordKind of [
    "hk_ipo_public_source_record",
    "hk_ipo_public_observation",
    "hk_ipo_public_reconciliation_packet"
  ]) {
    if (!value.raw_snapshot_record_kinds?.includes(recordKind)) {
      validationErrors.push(`schema_preflight.raw_snapshot_record_kinds missing ${recordKind}`);
    }
  }
  const guards = value.promotion_guards;
  if (!isRecord(guards)) {
    return [...validationErrors, "schema_preflight.promotion_guards must be an object"];
  }
  for (const field of [
    "third_party_observations_are_canonical",
    "writes_serving_tables_allowed",
    "automation_release_allowed",
    "raw_html_repo_storage_allowed",
    "export_allowed",
    "mcp_redistribution_allowed"
  ]) {
    if (guards[field] !== false) {
      validationErrors.push(`schema_preflight.promotion_guards.${field} must be false`);
    }
  }
  for (const field of ["source_attribution_required", "raw_snapshot_required_before_promotion"]) {
    if (guards[field] !== true) {
      validationErrors.push(`schema_preflight.promotion_guards.${field} must be true`);
    }
  }
  return validationErrors;
}

function validateRawSnapshotCapture(value) {
  const validationErrors = [];
  if (!isRecord(value)) {
    return ["raw_snapshot_capture must be an object"];
  }
  if (value.version !== "2026-06-28.hk-ipo-public-raw-snapshot-capture.v0") {
    validationErrors.push("raw_snapshot_capture.version mismatch");
  }
  if (value.script !== rawSnapshotCaptureScript) {
    validationErrors.push(`raw_snapshot_capture.script must be ${rawSnapshotCaptureScript}`);
  }
  if (value.package_script !== "npm run check:hk-ipo-public-raw-snapshot-capture") {
    validationErrors.push("raw_snapshot_capture.package_script mismatch");
  }
  if (value.fixture_command !== "npm run check:hk-ipo-public-raw-snapshot-capture") {
    validationErrors.push("raw_snapshot_capture.fixture_command mismatch");
  }
  if (value.live_command !== "node scripts/capture-hk-ipo-public-raw-snapshots.mjs --live --check") {
    validationErrors.push("raw_snapshot_capture.live_command mismatch");
  }
  if (value.input_packet_script !== reconciliationScript) {
    validationErrors.push(`raw_snapshot_capture.input_packet_script must be ${reconciliationScript}`);
  }
  if (value.fixture_path !== "skills/hkex-news-crawl-qa/evals/public-source-observation-fixtures.json") {
    validationErrors.push("raw_snapshot_capture.fixture_path mismatch");
  }
  for (const field of ["writes_database", "writes_files", "stores_raw_html_in_repo", "emits_payload_text"]) {
    if (value[field] !== false) {
      validationErrors.push(`raw_snapshot_capture.${field} must be false`);
    }
  }
  if (value.computes_payload_hash_sha256 !== true) {
    validationErrors.push("raw_snapshot_capture.computes_payload_hash_sha256 must be true");
  }
  if (value.target_table !== "core.raw_snapshot") {
    validationErrors.push("raw_snapshot_capture.target_table must be core.raw_snapshot");
  }
  if (value.storage_target !== "external_raw_snapshot_store") {
    validationErrors.push("raw_snapshot_capture.storage_target must be external_raw_snapshot_store");
  }
  for (const field of [
    "raw_snapshot_capture_id",
    "raw_snapshot_request_id",
    "raw_snapshot_id",
    "source_id",
    "source_record_id",
    "source_url",
    "payload_hash_sha256",
    "payload_bytes",
    "http_status_code",
    "payload_emitted",
    "ready_for_external_snapshot_store",
    "ready_for_sql_payload"
  ]) {
    if (!value.required_capture_fields?.includes(field)) {
      validationErrors.push(`raw_snapshot_capture.required_capture_fields missing ${field}`);
    }
  }
  for (const field of [
    "raw_snapshot_request_count",
    "capture_count",
    "unique_fetch_count",
    "successful_fetch_count",
    "payload_hash_count",
    "payloads_emitted_count",
    "ready_for_external_snapshot_store_count",
    "ready_for_sql_payload_count",
    "missing_capture_count"
  ]) {
    if (!value.required_summary_fields?.includes(field)) {
      validationErrors.push(`raw_snapshot_capture.required_summary_fields missing ${field}`);
    }
  }
  const guards = value.promotion_guards;
  if (!isRecord(guards)) {
    return [...validationErrors, "raw_snapshot_capture.promotion_guards must be an object"];
  }
  for (const field of [
    "writes_serving_tables_allowed",
    "automation_release_allowed",
    "raw_html_repo_storage_allowed",
    "export_allowed",
    "mcp_redistribution_allowed"
  ]) {
    if (guards[field] !== false) {
      validationErrors.push(`raw_snapshot_capture.promotion_guards.${field} must be false`);
    }
  }
  for (const field of ["source_attribution_required", "raw_snapshot_required_before_promotion"]) {
    if (guards[field] !== true) {
      validationErrors.push(`raw_snapshot_capture.promotion_guards.${field} must be true`);
    }
  }
  return validationErrors;
}

function validateRawSnapshotStorage(value) {
  const validationErrors = [];
  if (!isRecord(value)) {
    return ["raw_snapshot_storage must be an object"];
  }
  if (value.version !== "2026-06-28.hk-ipo-public-raw-snapshot-storage.v0") {
    validationErrors.push("raw_snapshot_storage.version mismatch");
  }
  if (value.script !== rawSnapshotStorageScript) {
    validationErrors.push(`raw_snapshot_storage.script must be ${rawSnapshotStorageScript}`);
  }
  if (value.package_script !== "npm run check:hk-ipo-public-raw-snapshot-storage") {
    validationErrors.push("raw_snapshot_storage.package_script mismatch");
  }
  if (value.fixture_command !== "npm run check:hk-ipo-public-raw-snapshot-storage") {
    validationErrors.push("raw_snapshot_storage.fixture_command mismatch");
  }
  if (value.live_command !== "node scripts/plan-hk-ipo-public-raw-snapshot-storage.mjs --live --check") {
    validationErrors.push("raw_snapshot_storage.live_command mismatch");
  }
  if (value.input_capture_script !== rawSnapshotCaptureScript) {
    validationErrors.push(`raw_snapshot_storage.input_capture_script must be ${rawSnapshotCaptureScript}`);
  }
  if (value.target_table !== "core.raw_snapshot") {
    validationErrors.push("raw_snapshot_storage.target_table must be core.raw_snapshot");
  }
  if (value.storage_target !== "external_raw_snapshot_store") {
    validationErrors.push("raw_snapshot_storage.storage_target must be external_raw_snapshot_store");
  }
  if (value.storage_binding !== "AIPHABEE_ARTIFACTS") {
    validationErrors.push("raw_snapshot_storage.storage_binding must be AIPHABEE_ARTIFACTS");
  }
  if (value.bucket_hint !== "aiphabee-artifacts") {
    validationErrors.push("raw_snapshot_storage.bucket_hint must be aiphabee-artifacts");
  }
  for (const field of [
    "writes_database",
    "writes_files",
    "writes_object_store",
    "stores_raw_html_in_repo",
    "emits_payload_text",
    "promotes_facts"
  ]) {
    if (value[field] !== false) {
      validationErrors.push(`raw_snapshot_storage.${field} must be false`);
    }
  }
  if (value.produces_payload_envelope !== true) {
    validationErrors.push("raw_snapshot_storage.produces_payload_envelope must be true");
  }
  for (const field of [
    "raw_snapshot_storage_ref_id",
    "raw_snapshot_capture_id",
    "raw_snapshot_request_id",
    "raw_snapshot_id",
    "storage_binding",
    "object_key",
    "object_key_hash",
    "payload_envelope_hash_sha256",
    "payload_hash_sha256",
    "payload_bytes",
    "payload_body_included",
    "ready_for_sql_payload"
  ]) {
    if (!value.required_storage_ref_fields?.includes(field)) {
      validationErrors.push(`raw_snapshot_storage.required_storage_ref_fields missing ${field}`);
    }
  }
  for (const field of [
    "storage_target",
    "storage_binding",
    "object_key",
    "payload_hash_sha256",
    "payload_bytes",
    "content_type",
    "source_url",
    "payload_body_included"
  ]) {
    if (!value.required_payload_envelope_fields?.includes(field)) {
      validationErrors.push(`raw_snapshot_storage.required_payload_envelope_fields missing ${field}`);
    }
  }
  for (const field of [
    "raw_snapshot_request_count",
    "capture_count",
    "payload_envelope_count",
    "payload_envelope_hash_count",
    "object_key_count",
    "payload_bodies_emitted_count",
    "ready_for_sql_payload_count",
    "writes_object_store_count",
    "missing_payload_envelope_count"
  ]) {
    if (!value.required_summary_fields?.includes(field)) {
      validationErrors.push(`raw_snapshot_storage.required_summary_fields missing ${field}`);
    }
  }
  const guards = value.promotion_guards;
  if (!isRecord(guards)) {
    return [...validationErrors, "raw_snapshot_storage.promotion_guards must be an object"];
  }
  for (const field of [
    "writes_serving_tables_allowed",
    "automation_release_allowed",
    "raw_html_repo_storage_allowed",
    "export_allowed",
    "mcp_redistribution_allowed"
  ]) {
    if (guards[field] !== false) {
      validationErrors.push(`raw_snapshot_storage.promotion_guards.${field} must be false`);
    }
  }
  for (const field of ["source_attribution_required", "raw_snapshot_required_before_promotion"]) {
    if (guards[field] !== true) {
      validationErrors.push(`raw_snapshot_storage.promotion_guards.${field} must be true`);
    }
  }
  return validationErrors;
}

function validateRawSnapshotR2Writer(value) {
  const validationErrors = [];
  if (!isRecord(value)) {
    return ["raw_snapshot_r2_writer_smoke must be an object"];
  }
  if (value.version !== "2026-06-28.hk-ipo-public-raw-snapshot-r2-writer-smoke.v0") {
    validationErrors.push("raw_snapshot_r2_writer_smoke.version mismatch");
  }
  if (value.script !== rawSnapshotR2WriterScript) {
    validationErrors.push(`raw_snapshot_r2_writer_smoke.script must be ${rawSnapshotR2WriterScript}`);
  }
  if (value.package_script !== "npm run check:hk-ipo-public-raw-snapshot-r2-writer") {
    validationErrors.push("raw_snapshot_r2_writer_smoke.package_script mismatch");
  }
  if (value.fixture_command !== "npm run check:hk-ipo-public-raw-snapshot-r2-writer") {
    validationErrors.push("raw_snapshot_r2_writer_smoke.fixture_command mismatch");
  }
  if (value.live_command !== "node scripts/smoke-hk-ipo-public-raw-snapshot-r2-writer.mjs --live --check") {
    validationErrors.push("raw_snapshot_r2_writer_smoke.live_command mismatch");
  }
  if (value.remote_command !== "node scripts/smoke-hk-ipo-public-raw-snapshot-r2-writer.mjs --live --remote --check") {
    validationErrors.push("raw_snapshot_r2_writer_smoke.remote_command mismatch");
  }
  if (value.input_storage_script !== rawSnapshotStorageScript) {
    validationErrors.push(`raw_snapshot_r2_writer_smoke.input_storage_script must be ${rawSnapshotStorageScript}`);
  }
  if (value.storage_binding !== "AIPHABEE_ARTIFACTS") {
    validationErrors.push("raw_snapshot_r2_writer_smoke.storage_binding must be AIPHABEE_ARTIFACTS");
  }
  if (value.bucket_hint !== "aiphabee-artifacts") {
    validationErrors.push("raw_snapshot_r2_writer_smoke.bucket_hint must be aiphabee-artifacts");
  }
  if (value.default_mode !== "mock_r2_bucket_put_get_delete") {
    validationErrors.push("raw_snapshot_r2_writer_smoke.default_mode mismatch");
  }
  if (value.remote_mode !== "smoke_prefixed_wrangler_r2_object_put_get_delete") {
    validationErrors.push("raw_snapshot_r2_writer_smoke.remote_mode mismatch");
  }
  for (const field of [
    "writes_database",
    "writes_repo_files",
    "default_remote_object_store_writes",
    "stores_raw_html_in_repo",
    "emits_payload_text",
    "promotes_facts"
  ]) {
    if (value[field] !== false) {
      validationErrors.push(`raw_snapshot_r2_writer_smoke.${field} must be false`);
    }
  }
  for (const field of ["remote_object_store_writes_requires_remote_flag", "delete_after_readback"]) {
    if (value[field] !== true) {
      validationErrors.push(`raw_snapshot_r2_writer_smoke.${field} must be true`);
    }
  }
  for (const field of [
    "binding_name",
    "surface",
    "object_key_hash",
    "value_hash",
    "readback_hash",
    "payload_hash_matched",
    "payload_body_output",
    "cleanup_status",
    "writes_database",
    "writes_repo_files"
  ]) {
    if (!value.required_result_fields?.includes(field)) {
      validationErrors.push(`raw_snapshot_r2_writer_smoke.required_result_fields missing ${field}`);
    }
  }
  for (const field of [
    "storage_ref_count",
    "object_key_count",
    "write_attempt_count",
    "payload_hash_match_count",
    "readback_count",
    "cleanup_delete_count",
    "mock_object_store_write_count",
    "remote_object_store_write_count",
    "payload_body_output_count",
    "writes_database_count",
    "writes_repo_file_count"
  ]) {
    if (!value.required_summary_fields?.includes(field)) {
      validationErrors.push(`raw_snapshot_r2_writer_smoke.required_summary_fields missing ${field}`);
    }
  }
  const guards = value.promotion_guards;
  if (!isRecord(guards)) {
    return [...validationErrors, "raw_snapshot_r2_writer_smoke.promotion_guards must be an object"];
  }
  for (const field of [
    "writes_serving_tables_allowed",
    "automation_release_allowed",
    "raw_html_repo_storage_allowed",
    "export_allowed",
    "mcp_redistribution_allowed"
  ]) {
    if (guards[field] !== false) {
      validationErrors.push(`raw_snapshot_r2_writer_smoke.promotion_guards.${field} must be false`);
    }
  }
  for (const field of ["source_attribution_required", "raw_snapshot_required_before_promotion"]) {
    if (guards[field] !== true) {
      validationErrors.push(`raw_snapshot_r2_writer_smoke.promotion_guards.${field} must be true`);
    }
  }
  return validationErrors;
}

function validateApplyPlanner(value) {
  const validationErrors = [];
  if (!isRecord(value)) {
    return ["apply_planner must be an object"];
  }
  if (value.version !== "2026-06-28.hk-ipo-public-observation-apply-plan.v0") {
    validationErrors.push("apply_planner.version mismatch");
  }
  if (value.script !== applyPlannerScript) {
    validationErrors.push(`apply_planner.script must be ${applyPlannerScript}`);
  }
  if (value.package_script !== "npm run check:hk-ipo-public-apply-plan") {
    validationErrors.push("apply_planner.package_script mismatch");
  }
  if (value.fixture_command !== "npm run check:hk-ipo-public-apply-plan") {
    validationErrors.push("apply_planner.fixture_command mismatch");
  }
  if (value.live_command !== "node scripts/plan-hk-ipo-public-observation-apply.mjs --live --check") {
    validationErrors.push("apply_planner.live_command mismatch");
  }
  if (value.input_adapter_script !== observationAdapterScript) {
    validationErrors.push(`apply_planner.input_adapter_script must be ${observationAdapterScript}`);
  }
  if (value.input_packet_script !== reconciliationScript) {
    validationErrors.push(`apply_planner.input_packet_script must be ${reconciliationScript}`);
  }
  if (value.input_capture_script !== rawSnapshotCaptureScript) {
    validationErrors.push(`apply_planner.input_capture_script must be ${rawSnapshotCaptureScript}`);
  }
  if (value.input_storage_script !== rawSnapshotStorageScript) {
    validationErrors.push(`apply_planner.input_storage_script must be ${rawSnapshotStorageScript}`);
  }
  if (value.schema_checker !== schemaCheckerScript) {
    validationErrors.push(`apply_planner.schema_checker must be ${schemaCheckerScript}`);
  }
  for (const field of [
    "writes_database",
    "writes_files",
    "executes_sql",
    "emits_sql_text",
    "applies_remote_database",
    "stores_raw_html_in_repo",
    "promotes_facts"
  ]) {
    if (value[field] !== false) {
      validationErrors.push(`apply_planner.${field} must be false`);
    }
  }
  if (value.parameterized_statements !== true) {
    validationErrors.push("apply_planner.parameterized_statements must be true");
  }
  for (const table of [
    "core.raw_source_batch",
    "core.data_version_batch",
    "core.hk_ipo_public_source_run",
    "core.raw_snapshot",
    "core.hk_ipo_public_observation",
    "core.hk_ipo_public_reconciliation_row",
    "core.hk_ipo_public_supplement_candidate"
  ]) {
    if (!value.target_tables?.includes(table)) {
      validationErrors.push(`apply_planner.target_tables missing ${table}`);
    }
  }
  for (const statementId of [
    "upsert_core_raw_source_batch",
    "upsert_core_data_version_batch",
    "upsert_core_hk_ipo_public_source_run",
    "upsert_core_raw_snapshot",
    "upsert_core_hk_ipo_public_observation",
    "upsert_core_hk_ipo_public_reconciliation_row",
    "upsert_core_hk_ipo_public_supplement_candidate"
  ]) {
    if (!value.statement_ids?.includes(statementId)) {
      validationErrors.push(`apply_planner.statement_ids missing ${statementId}`);
    }
  }
  if (!Array.isArray(value.deferred_statement_ids) || value.deferred_statement_ids.length !== 0) {
    validationErrors.push("apply_planner.deferred_statement_ids must be empty after storage reference planning");
  }
  if (value.statement_ids?.includes("defer_core_raw_snapshot_until_payload_body_or_external_ref")) {
    validationErrors.push("apply_planner.statement_ids must not include raw snapshot deferral");
  }
  for (const field of [
    "source_batch_row_count",
    "data_version_batch_row_count",
    "source_run_row_count",
    "deferred_raw_snapshot_count",
    "external_raw_snapshot_ref_count",
    "captured_raw_snapshot_hash_count",
    "ready_raw_snapshot_payload_count",
    "observation_row_count",
    "reconciliation_row_count",
    "supplement_candidate_row_count",
    "unresolved_source_observation_count"
  ]) {
    if (!value.required_summary_fields?.includes(field)) {
      validationErrors.push(`apply_planner.required_summary_fields missing ${field}`);
    }
  }
  const guards = value.promotion_guards;
  if (!isRecord(guards)) {
    return [...validationErrors, "apply_planner.promotion_guards must be an object"];
  }
  for (const field of [
    "third_party_observations_are_canonical",
    "writes_serving_tables_allowed",
    "automation_release_allowed",
    "raw_html_repo_storage_allowed",
    "export_allowed",
    "mcp_redistribution_allowed"
  ]) {
    if (guards[field] !== false) {
      validationErrors.push(`apply_planner.promotion_guards.${field} must be false`);
    }
  }
  for (const field of ["source_attribution_required", "raw_snapshot_required_before_promotion"]) {
    if (guards[field] !== true) {
      validationErrors.push(`apply_planner.promotion_guards.${field} must be true`);
    }
  }
  return validationErrors;
}

function validateHeldDbApplyPacket(value) {
  const validationErrors = [];
  if (!isRecord(value)) {
    return ["held_db_apply_packet must be an object"];
  }
  if (value.version !== "2026-06-28.hk-ipo-public-held-db-apply-packet.v0") {
    validationErrors.push("held_db_apply_packet.version mismatch");
  }
  if (value.script !== heldDbApplyPacketScript) {
    validationErrors.push(`held_db_apply_packet.script must be ${heldDbApplyPacketScript}`);
  }
  if (value.package_script !== "npm run check:hk-ipo-public-held-db-apply-packet") {
    validationErrors.push("held_db_apply_packet.package_script mismatch");
  }
  if (value.fixture_command !== "npm run check:hk-ipo-public-held-db-apply-packet") {
    validationErrors.push("held_db_apply_packet.fixture_command mismatch");
  }
  if (value.live_command !== "node scripts/plan-hk-ipo-public-held-db-apply-packet.mjs --live --check") {
    validationErrors.push("held_db_apply_packet.live_command mismatch");
  }
  if (value.input_apply_plan_script !== applyPlannerScript) {
    validationErrors.push(`held_db_apply_packet.input_apply_plan_script must be ${applyPlannerScript}`);
  }
  if (value.provider !== "planetscale_postgres") {
    validationErrors.push("held_db_apply_packet.provider must be planetscale_postgres");
  }
  if (value.packet_kind !== "hk_ipo_public_held_db_apply_packet") {
    validationErrors.push("held_db_apply_packet.packet_kind mismatch");
  }
  for (const field of [
    "writes_database",
    "writes_files",
    "executes_sql",
    "emits_sql_text",
    "emits_payload_text",
    "applies_remote_database",
    "stores_raw_html_in_repo",
    "promotes_facts"
  ]) {
    if (value[field] !== false) {
      validationErrors.push(`held_db_apply_packet.${field} must be false`);
    }
  }
  if (value.parameterized_statements !== true) {
    validationErrors.push("held_db_apply_packet.parameterized_statements must be true");
  }
  for (const table of [
    "core.raw_source_batch",
    "core.data_version_batch",
    "core.hk_ipo_public_source_run",
    "core.raw_snapshot",
    "core.hk_ipo_public_observation",
    "core.hk_ipo_public_reconciliation_row",
    "core.hk_ipo_public_supplement_candidate"
  ]) {
    if (!value.target_tables?.includes(table)) {
      validationErrors.push(`held_db_apply_packet.target_tables missing ${table}`);
    }
  }
  for (const statementId of [
    "upsert_core_raw_source_batch",
    "upsert_core_data_version_batch",
    "upsert_core_hk_ipo_public_source_run",
    "upsert_core_raw_snapshot",
    "upsert_core_hk_ipo_public_observation",
    "upsert_core_hk_ipo_public_reconciliation_row",
    "upsert_core_hk_ipo_public_supplement_candidate"
  ]) {
    if (!value.statement_ids?.includes(statementId)) {
      validationErrors.push(`held_db_apply_packet.statement_ids missing ${statementId}`);
    }
  }
  for (const field of [
    "statement_count",
    "ready_statement_count",
    "target_table_count",
    "total_row_count",
    "raw_snapshot_row_count",
    "ready_raw_snapshot_payload_count",
    "payload_body_output_count",
    "sql_text_output_count",
    "remote_apply_count",
    "writes_database_count",
    "unresolved_source_observation_count"
  ]) {
    if (!value.required_summary_fields?.includes(field)) {
      validationErrors.push(`held_db_apply_packet.required_summary_fields missing ${field}`);
    }
  }
  const policy = value.safe_output_policy;
  if (!isRecord(policy)) {
    validationErrors.push("held_db_apply_packet.safe_output_policy must be an object");
  } else {
    for (const field of ["no_database_url", "no_password", "no_secret", "no_sql_text", "no_payload_body", "counts_and_hashes_only"]) {
      if (policy[field] !== true) {
        validationErrors.push(`held_db_apply_packet.safe_output_policy.${field} must be true`);
      }
    }
  }
  const guards = value.promotion_guards;
  if (!isRecord(guards)) {
    return [...validationErrors, "held_db_apply_packet.promotion_guards must be an object"];
  }
  for (const field of [
    "third_party_observations_are_canonical",
    "writes_serving_tables_allowed",
    "automation_release_allowed",
    "raw_html_repo_storage_allowed",
    "export_allowed",
    "mcp_redistribution_allowed"
  ]) {
    if (guards[field] !== false) {
      validationErrors.push(`held_db_apply_packet.promotion_guards.${field} must be false`);
    }
  }
  for (const field of ["source_attribution_required", "raw_snapshot_required_before_promotion"]) {
    if (guards[field] !== true) {
      validationErrors.push(`held_db_apply_packet.promotion_guards.${field} must be true`);
    }
  }
  return validationErrors;
}

function validateHeldDbApplyLive(value) {
  const validationErrors = [];
  if (!isRecord(value)) {
    return ["held_db_apply_live must be an object"];
  }
  if (value.version !== "2026-06-28.hk-ipo-public-held-db-apply-live.v0") {
    validationErrors.push("held_db_apply_live.version mismatch");
  }
  if (value.script !== heldDbApplyLiveScript) {
    validationErrors.push(`held_db_apply_live.script must be ${heldDbApplyLiveScript}`);
  }
  if (value.package_script !== "npm run check:hk-ipo-public-held-db-apply-live") {
    validationErrors.push("held_db_apply_live.package_script mismatch");
  }
  if (value.check_command !== "npm run check:hk-ipo-public-held-db-apply-live") {
    validationErrors.push("held_db_apply_live.check_command mismatch");
  }
  if (
    value.remote_command !==
    "AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN=<token> AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_ENDPOINT=<endpoint> node scripts/apply-hk-ipo-public-held-db-live.mjs --remote --check"
  ) {
    validationErrors.push("held_db_apply_live.remote_command mismatch");
  }
  if (value.route !== "POST /ingest/hk-ipo-public/held-db-apply") {
    validationErrors.push("held_db_apply_live.route mismatch");
  }
  if (value.worker_entrypoint !== "apps/worker/src/index.ts") {
    validationErrors.push("held_db_apply_live.worker_entrypoint mismatch");
  }
  if (value.provider !== "planetscale_postgres") {
    validationErrors.push("held_db_apply_live.provider must be planetscale_postgres");
  }
  if (value.hyperdrive_binding !== "AIPHABEE_HYPERDRIVE") {
    validationErrors.push("held_db_apply_live.hyperdrive_binding must be AIPHABEE_HYPERDRIVE");
  }
  if (value.object_store_binding !== "AIPHABEE_ARTIFACTS") {
    validationErrors.push("held_db_apply_live.object_store_binding must be AIPHABEE_ARTIFACTS");
  }
  if (value.token_binding !== "AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN") {
    validationErrors.push("held_db_apply_live.token_binding mismatch");
  }
  if (!isRecord(value.smoke_header)) {
    validationErrors.push("held_db_apply_live.smoke_header must be an object");
  } else {
    if (value.smoke_header.name !== "x-aiphabee-smoke") {
      validationErrors.push("held_db_apply_live.smoke_header.name must be x-aiphabee-smoke");
    }
    if (value.smoke_header.value !== "hk-ipo-public-held-db-apply-live-v1") {
      validationErrors.push("held_db_apply_live.smoke_header.value mismatch");
    }
  }
  if (value.default_check_writes_database !== false) {
    validationErrors.push("held_db_apply_live.default_check_writes_database must be false");
  }
  for (const field of ["remote_writes_database", "remote_writes_object_store", "hash_only_response"]) {
    if (value[field] !== true) {
      validationErrors.push(`held_db_apply_live.${field} must be true`);
    }
  }
  for (const field of [
    "writes_serving_tables",
    "promotes_facts",
    "releases_data_version",
    "emits_sql_text",
    "emits_payload_text",
    "stores_raw_html_in_repo"
  ]) {
    if (value[field] !== false) {
      validationErrors.push(`held_db_apply_live.${field} must be false`);
    }
  }
  if (value.release_state !== "held") {
    validationErrors.push("held_db_apply_live.release_state must be held");
  }
  for (const table of [
    "core.raw_source_batch",
    "core.data_version_batch",
    "core.raw_snapshot",
    "core.hk_ipo_public_source_run",
    "core.hk_ipo_public_observation",
    "core.hk_ipo_public_reconciliation_row",
    "core.hk_ipo_public_supplement_candidate"
  ]) {
    if (!value.target_tables?.includes(table)) {
      validationErrors.push(`held_db_apply_live.target_tables missing ${table}`);
    }
  }
  for (const field of [
    "inserted_or_updated_rows",
    "object_store_write_count",
    "selected_rows",
    "release_state",
    "writes_serving_tables"
  ]) {
    if (!value.required_remote_summary_fields?.includes(field)) {
      validationErrors.push(`held_db_apply_live.required_remote_summary_fields missing ${field}`);
    }
  }
  const policy = value.safe_output_policy;
  if (!isRecord(policy)) {
    validationErrors.push("held_db_apply_live.safe_output_policy must be an object");
  } else {
    for (const field of ["no_database_url", "no_password", "no_secret", "no_sql_text", "no_payload_body", "counts_and_hashes_only"]) {
      if (policy[field] !== true) {
        validationErrors.push(`held_db_apply_live.safe_output_policy.${field} must be true`);
      }
    }
  }
  const guards = value.promotion_guards;
  if (!isRecord(guards)) {
    return [...validationErrors, "held_db_apply_live.promotion_guards must be an object"];
  }
  for (const field of [
    "third_party_observations_are_canonical",
    "writes_serving_tables_allowed",
    "automation_release_allowed",
    "raw_html_repo_storage_allowed",
    "export_allowed",
    "mcp_redistribution_allowed"
  ]) {
    if (guards[field] !== false) {
      validationErrors.push(`held_db_apply_live.promotion_guards.${field} must be false`);
    }
  }
  for (const field of ["source_attribution_required", "raw_snapshot_required_before_promotion"]) {
    if (guards[field] !== true) {
      validationErrors.push(`held_db_apply_live.promotion_guards.${field} must be true`);
    }
  }
  return validationErrors;
}

function validateHeldDbApplySmoke(value) {
  const validationErrors = [];
  if (!isRecord(value)) {
    return ["held_db_apply_smoke must be an object"];
  }
  if (value.version !== "2026-06-28.hk-ipo-public-held-db-apply-smoke.v0") {
    validationErrors.push("held_db_apply_smoke.version mismatch");
  }
  if (value.contract !== "deploy/ingest/hk-ipo-public-held-db-apply-smoke.contract.json") {
    validationErrors.push("held_db_apply_smoke.contract mismatch");
  }
  if (value.checker !== heldDbApplySmokeContractScript) {
    validationErrors.push(`held_db_apply_smoke.checker must be ${heldDbApplySmokeContractScript}`);
  }
  if (value.package_script !== "npm run check:hk-ipo-public-held-db-apply-smoke") {
    validationErrors.push("held_db_apply_smoke.package_script mismatch");
  }
  if (
    value.unit_test_command !==
    "npm run test -- apps/worker/src/hk-ipo-public-held-db-apply-smoke.test.ts"
  ) {
    validationErrors.push("held_db_apply_smoke.unit_test_command mismatch");
  }
  if (value.aggregate_check_command !== "npm run check:hk-ipo-public-sources") {
    validationErrors.push("held_db_apply_smoke.aggregate_check_command mismatch");
  }
  if (value.route !== "POST /ingest/hk-ipo-public/held-db-apply-smoke") {
    validationErrors.push("held_db_apply_smoke.route mismatch");
  }
  if (value.worker_entrypoint !== "apps/worker/src/index.ts") {
    validationErrors.push("held_db_apply_smoke.worker_entrypoint mismatch");
  }
  if (value.test_file !== "apps/worker/src/hk-ipo-public-held-db-apply-smoke.test.ts") {
    validationErrors.push("held_db_apply_smoke.test_file mismatch");
  }
  if (value.input_apply_packet_script !== heldDbApplyPacketScript) {
    validationErrors.push(`held_db_apply_smoke.input_apply_packet_script must be ${heldDbApplyPacketScript}`);
  }
  if (value.provider !== "planetscale_postgres") {
    validationErrors.push("held_db_apply_smoke.provider must be planetscale_postgres");
  }
  if (value.hyperdrive_binding !== "AIPHABEE_HYPERDRIVE") {
    validationErrors.push("held_db_apply_smoke.hyperdrive_binding must be AIPHABEE_HYPERDRIVE");
  }
  if (value.smoke_token_binding !== "AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_TOKEN") {
    validationErrors.push(
      "held_db_apply_smoke.smoke_token_binding must be AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_SMOKE_TOKEN"
    );
  }
  if (!isRecord(value.smoke_header)) {
    validationErrors.push("held_db_apply_smoke.smoke_header must be an object");
  } else {
    if (value.smoke_header.name !== "x-aiphabee-smoke") {
      validationErrors.push("held_db_apply_smoke.smoke_header.name must be x-aiphabee-smoke");
    }
    if (value.smoke_header.value !== "hk-ipo-public-held-db-apply-v1") {
      validationErrors.push("held_db_apply_smoke.smoke_header.value mismatch");
    }
  }
  for (const field of [
    "actual_hyperdrive_execution",
    "single_transaction",
    "insert_smoke",
    "select_readback",
    "delete_cleanup",
    "synthetic_only",
    "hash_only_response"
  ]) {
    if (value[field] !== true) {
      validationErrors.push(`held_db_apply_smoke.${field} must be true`);
    }
  }
  for (const field of [
    "production_observation_persistence",
    "writes_serving_tables",
    "promotes_facts",
    "releases_data_version",
    "third_party_observations_are_canonical"
  ]) {
    if (value[field] !== false) {
      validationErrors.push(`held_db_apply_smoke.${field} must be false`);
    }
  }
  for (const table of [
    "core.raw_source_batch",
    "core.data_version_batch",
    "core.raw_snapshot",
    "core.hk_ipo_public_source_run",
    "core.hk_ipo_public_observation",
    "core.hk_ipo_public_reconciliation_row",
    "core.hk_ipo_public_supplement_candidate"
  ]) {
    if (!value.target_tables?.includes(table)) {
      validationErrors.push(`held_db_apply_smoke.target_tables missing ${table}`);
    }
  }
  for (const table of [
    "core.ipo_offering",
    "core.ipo_timetable_event",
    "core.ipo_narrative",
    "core.ipo_cornerstone"
  ]) {
    if (!value.blocked_tables?.includes(table)) {
      validationErrors.push(`held_db_apply_smoke.blocked_tables missing ${table}`);
    }
  }
  for (const field of [
    "inserted_rows",
    "selected_rows",
    "deleted_rows",
    "cleanup_verified",
    "data_version_hash",
    "source_run_id_hash",
    "raw_snapshot_id_hash",
    "readback_hash",
    "query_hash"
  ]) {
    if (!value.required_response_fields?.includes(field)) {
      validationErrors.push(`held_db_apply_smoke.required_response_fields missing ${field}`);
    }
  }
  const policy = value.safe_output_policy;
  if (!isRecord(policy)) {
    validationErrors.push("held_db_apply_smoke.safe_output_policy must be an object");
  } else {
    for (const field of [
      "no_database_url",
      "no_password",
      "no_secret",
      "no_raw_payload",
      "no_sql_text",
      "counts_and_hashes_only"
    ]) {
      if (policy[field] !== true) {
        validationErrors.push(`held_db_apply_smoke.safe_output_policy.${field} must be true`);
      }
    }
  }
  const guards = value.promotion_guards;
  if (!isRecord(guards)) {
    return [...validationErrors, "held_db_apply_smoke.promotion_guards must be an object"];
  }
  for (const field of [
    "third_party_observations_are_canonical",
    "writes_serving_tables_allowed",
    "automation_release_allowed",
    "raw_html_repo_storage_allowed",
    "export_allowed",
    "mcp_redistribution_allowed"
  ]) {
    if (guards[field] !== false) {
      validationErrors.push(`held_db_apply_smoke.promotion_guards.${field} must be false`);
    }
  }
  for (const field of ["source_attribution_required", "raw_snapshot_required_before_promotion"]) {
    if (guards[field] !== true) {
      validationErrors.push(`held_db_apply_smoke.promotion_guards.${field} must be true`);
    }
  }
  return validationErrors;
}

function validateHeldDbReadback(value) {
  const validationErrors = [];
  if (!isRecord(value)) {
    return ["held_db_readback must be an object"];
  }
  if (value.version !== "2026-06-28.hk-ipo-public-held-db-readback.v0") {
    validationErrors.push("held_db_readback.version mismatch");
  }
  if (value.contract !== "deploy/ingest/hk-ipo-public-held-db-readback.contract.json") {
    validationErrors.push("held_db_readback.contract mismatch");
  }
  if (value.checker !== heldDbReadbackScript) {
    validationErrors.push(`held_db_readback.checker must be ${heldDbReadbackScript}`);
  }
  if (value.package_script !== "npm run check:hk-ipo-public-held-db-readback") {
    validationErrors.push("held_db_readback.package_script mismatch");
  }
  if (value.route !== "POST /ingest/hk-ipo-public/held-db-readback") {
    validationErrors.push("held_db_readback.route mismatch");
  }
  if (value.worker_entrypoint !== "apps/worker/src/index.ts") {
    validationErrors.push("held_db_readback.worker_entrypoint mismatch");
  }
  if (value.provider !== "planetscale_postgres") {
    validationErrors.push("held_db_readback.provider must be planetscale_postgres");
  }
  if (value.hyperdrive_binding !== "AIPHABEE_HYPERDRIVE") {
    validationErrors.push("held_db_readback.hyperdrive_binding must be AIPHABEE_HYPERDRIVE");
  }
  if (value.object_store_binding !== "AIPHABEE_ARTIFACTS") {
    validationErrors.push("held_db_readback.object_store_binding must be AIPHABEE_ARTIFACTS");
  }
  if (value.token_binding !== "AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN") {
    validationErrors.push("held_db_readback.token_binding mismatch");
  }
  if (!isRecord(value.smoke_header)) {
    validationErrors.push("held_db_readback.smoke_header must be an object");
  } else {
    if (value.smoke_header.name !== "x-aiphabee-smoke") {
      validationErrors.push("held_db_readback.smoke_header.name must be x-aiphabee-smoke");
    }
    if (value.smoke_header.value !== "hk-ipo-public-held-db-readback-v1") {
      validationErrors.push("held_db_readback.smoke_header.value mismatch");
    }
  }
  for (const field of [
    "read_only_database",
    "latest_live_held_default",
    "specific_run_supported",
    "r2_object_existence_readback",
    "hash_only_response"
  ]) {
    if (value[field] !== true) {
      validationErrors.push(`held_db_readback.${field} must be true`);
    }
  }
  for (const field of [
    "writes_database",
    "writes_object_store",
    "writes_serving_tables",
    "promotes_facts",
    "releases_data_version",
    "emits_raw_payload"
  ]) {
    if (value[field] !== false) {
      validationErrors.push(`held_db_readback.${field} must be false`);
    }
  }
  for (const table of [
    "core.raw_source_batch",
    "core.data_version_batch",
    "core.raw_snapshot",
    "core.hk_ipo_public_source_run",
    "core.hk_ipo_public_observation",
    "core.hk_ipo_public_reconciliation_row",
    "core.hk_ipo_public_supplement_candidate"
  ]) {
    if (!value.target_tables?.includes(table)) {
      validationErrors.push(`held_db_readback.target_tables missing ${table}`);
    }
  }
  const guards = value.promotion_guards;
  if (!isRecord(guards)) {
    return [...validationErrors, "held_db_readback.promotion_guards must be an object"];
  }
  for (const field of [
    "third_party_observations_are_canonical",
    "writes_serving_tables_allowed",
    "automation_release_allowed",
    "raw_html_repo_storage_allowed",
    "export_allowed",
    "mcp_redistribution_allowed"
  ]) {
    if (guards[field] !== false) {
      validationErrors.push(`held_db_readback.promotion_guards.${field} must be false`);
    }
  }
  for (const field of ["source_attribution_required", "raw_snapshot_required_before_promotion"]) {
    if (guards[field] !== true) {
      validationErrors.push(`held_db_readback.promotion_guards.${field} must be true`);
    }
  }
  return validationErrors;
}

function validateHeldReviewPacket(value) {
  const validationErrors = [];
  if (!isRecord(value)) {
    return ["held_review_packet must be an object"];
  }
  if (value.version !== "2026-06-28.hk-ipo-public-held-review-packet.v0") {
    validationErrors.push("held_review_packet.version mismatch");
  }
  if (value.script !== heldReviewPacketScript) {
    validationErrors.push(`held_review_packet.script must be ${heldReviewPacketScript}`);
  }
  if (value.package_script !== "npm run check:hk-ipo-public-held-review-packet") {
    validationErrors.push("held_review_packet.package_script mismatch");
  }
  if (value.fixture_command !== "npm run check:hk-ipo-public-held-review-packet") {
    validationErrors.push("held_review_packet.fixture_command mismatch");
  }
  if (value.live_command !== "node scripts/plan-hk-ipo-public-held-review-packet.mjs --live --check") {
    validationErrors.push("held_review_packet.live_command mismatch");
  }
  if (value.input_apply_plan_script !== applyPlannerScript) {
    validationErrors.push(`held_review_packet.input_apply_plan_script must be ${applyPlannerScript}`);
  }
  if (value.input_apply_packet_script !== heldDbApplyPacketScript) {
    validationErrors.push(`held_review_packet.input_apply_packet_script must be ${heldDbApplyPacketScript}`);
  }
  if (value.provider !== "planetscale_postgres") {
    validationErrors.push("held_review_packet.provider must be planetscale_postgres");
  }
  if (value.packet_kind !== "hk_ipo_public_held_review_packet") {
    validationErrors.push("held_review_packet.packet_kind mismatch");
  }
  if (value.review_status !== "ready_for_manual_review") {
    validationErrors.push("held_review_packet.review_status mismatch");
  }
  if (value.promotion_status !== "blocked_pending_manual_review") {
    validationErrors.push("held_review_packet.promotion_status mismatch");
  }
  for (const field of [
    "manual_review_required",
    "requires_db_readback",
    "requires_object_store_readback",
    "counts_and_hashes_only"
  ]) {
    if (value[field] !== true) {
      validationErrors.push(`held_review_packet.${field} must be true`);
    }
  }
  for (const field of [
    "automation_release_allowed",
    "writes_database",
    "writes_files",
    "writes_object_store",
    "writes_serving_tables",
    "executes_sql",
    "emits_sql_text",
    "emits_payload_text",
    "stores_raw_html_in_repo",
    "promotes_facts",
    "releases_data_version",
    "third_party_observations_are_canonical"
  ]) {
    if (value[field] !== false) {
      validationErrors.push(`held_review_packet.${field} must be false`);
    }
  }
  for (const table of [
    "core.raw_source_batch",
    "core.data_version_batch",
    "core.hk_ipo_public_source_run",
    "core.raw_snapshot",
    "core.hk_ipo_public_observation",
    "core.hk_ipo_public_reconciliation_row",
    "core.hk_ipo_public_supplement_candidate"
  ]) {
    if (!value.target_tables?.includes(table)) {
      validationErrors.push(`held_review_packet.target_tables missing ${table}`);
    }
  }
  for (const table of [
    "core.ipo_offering",
    "core.ipo_timetable_event",
    "core.ipo_narrative",
    "core.ipo_cornerstone"
  ]) {
    if (!value.blocked_tables?.includes(table)) {
      validationErrors.push(`held_review_packet.blocked_tables missing ${table}`);
    }
  }
  for (const gateId of [
    "held_db_apply_packet_ready",
    "raw_snapshot_payload_envelopes_ready",
    "held_db_readback_required",
    "manual_reviewer_required",
    "serving_promotion_blocked"
  ]) {
    if (!value.required_review_gates?.includes(gateId)) {
      validationErrors.push(`held_review_packet.required_review_gates missing ${gateId}`);
    }
  }
  for (const field of [
    "total_row_count",
    "raw_snapshot_row_count",
    "ready_raw_snapshot_payload_count",
    "observation_row_count",
    "reconciliation_row_count",
    "supplement_candidate_row_count",
    "review_gate_count",
    "pass_gate_count",
    "manual_gate_count",
    "blocked_promotion_gate_count",
    "payload_body_output_count",
    "sql_text_output_count",
    "writes_database_count",
    "writes_object_store_count",
    "writes_serving_table_count",
    "unresolved_source_observation_count"
  ]) {
    if (!value.required_summary_fields?.includes(field)) {
      validationErrors.push(`held_review_packet.required_summary_fields missing ${field}`);
    }
  }
  const policy = value.safe_output_policy;
  if (!isRecord(policy)) {
    validationErrors.push("held_review_packet.safe_output_policy must be an object");
  } else {
    for (const field of [
      "no_database_url",
      "no_password",
      "no_secret",
      "no_source_url",
      "no_security_code",
      "no_raw_payload",
      "no_sql_text",
      "counts_and_hashes_only"
    ]) {
      if (policy[field] !== true) {
        validationErrors.push(`held_review_packet.safe_output_policy.${field} must be true`);
      }
    }
  }
  const guards = value.promotion_guards;
  if (!isRecord(guards)) {
    return [...validationErrors, "held_review_packet.promotion_guards must be an object"];
  }
  for (const field of [
    "third_party_observations_are_canonical",
    "writes_serving_tables_allowed",
    "automation_release_allowed",
    "raw_html_repo_storage_allowed",
    "export_allowed",
    "mcp_redistribution_allowed"
  ]) {
    if (guards[field] !== false) {
      validationErrors.push(`held_review_packet.promotion_guards.${field} must be false`);
    }
  }
  for (const field of ["source_attribution_required", "raw_snapshot_required_before_promotion"]) {
    if (guards[field] !== true) {
      validationErrors.push(`held_review_packet.promotion_guards.${field} must be true`);
    }
  }
  return validationErrors;
}

function validateHeldPromotionPreflight(value) {
  const validationErrors = [];
  if (!isRecord(value)) {
    return ["held_promotion_preflight must be an object"];
  }
  if (value.version !== "2026-06-28.hk-ipo-public-held-promotion-preflight.v0") {
    validationErrors.push("held_promotion_preflight.version mismatch");
  }
  if (value.script !== heldPromotionPreflightScript) {
    validationErrors.push(`held_promotion_preflight.script must be ${heldPromotionPreflightScript}`);
  }
  if (value.package_script !== "npm run check:hk-ipo-public-held-promotion-preflight") {
    validationErrors.push("held_promotion_preflight.package_script mismatch");
  }
  if (value.fixture_command !== "npm run check:hk-ipo-public-held-promotion-preflight") {
    validationErrors.push("held_promotion_preflight.fixture_command mismatch");
  }
  if (value.live_command !== "node scripts/plan-hk-ipo-public-held-promotion-preflight.mjs --live --check") {
    validationErrors.push("held_promotion_preflight.live_command mismatch");
  }
  if (
    value.live_with_readback_command !==
    "node scripts/plan-hk-ipo-public-held-promotion-preflight.mjs --live --review-file <review_json> --readback-file <readback_json> --check"
  ) {
    validationErrors.push("held_promotion_preflight.live_with_readback_command mismatch");
  }
  if (value.review_file_supported !== true) {
    validationErrors.push("held_promotion_preflight.review_file_supported must be true");
  }
  if (value.input_review_packet_script !== heldReviewPacketScript) {
    validationErrors.push(`held_promotion_preflight.input_review_packet_script must be ${heldReviewPacketScript}`);
  }
  if (value.input_readback_script !== heldDbReadbackScript) {
    validationErrors.push(`held_promotion_preflight.input_readback_script must be ${heldDbReadbackScript}`);
  }
  if (value.provider !== "planetscale_postgres") {
    validationErrors.push("held_promotion_preflight.provider must be planetscale_postgres");
  }
  if (value.packet_kind !== "hk_ipo_public_held_promotion_preflight") {
    validationErrors.push("held_promotion_preflight.packet_kind mismatch");
  }
  if (value.review_status !== "ready_for_manual_review") {
    validationErrors.push("held_promotion_preflight.review_status mismatch");
  }
  if (value.promotion_status !== "blocked_pending_manual_review") {
    validationErrors.push("held_promotion_preflight.promotion_status mismatch");
  }
  for (const field of [
    "manual_review_required",
    "manual_review_acceptance_required",
    "readback_required",
    "counts_and_hashes_only"
  ]) {
    if (value[field] !== true) {
      validationErrors.push(`held_promotion_preflight.${field} must be true`);
    }
  }
  for (const field of [
    "automation_release_allowed",
    "writes_database",
    "writes_files",
    "writes_object_store",
    "writes_serving_tables",
    "executes_sql",
    "emits_sql_text",
    "emits_payload_text",
    "stores_raw_html_in_repo",
    "promotes_facts",
    "promotion_execution_allowed",
    "releases_data_version",
    "third_party_observations_are_canonical"
  ]) {
    if (value[field] !== false) {
      validationErrors.push(`held_promotion_preflight.${field} must be false`);
    }
  }
  for (const table of [
    "core.raw_source_batch",
    "core.data_version_batch",
    "core.hk_ipo_public_source_run",
    "core.raw_snapshot",
    "core.hk_ipo_public_observation",
    "core.hk_ipo_public_reconciliation_row",
    "core.hk_ipo_public_supplement_candidate"
  ]) {
    if (!value.target_tables?.includes(table)) {
      validationErrors.push(`held_promotion_preflight.target_tables missing ${table}`);
    }
  }
  for (const table of [
    "core.ipo_offering",
    "core.ipo_timetable_event",
    "core.ipo_narrative",
    "core.ipo_cornerstone"
  ]) {
    if (!value.blocked_tables?.includes(table)) {
      validationErrors.push(`held_promotion_preflight.blocked_tables missing ${table}`);
    }
  }
  for (const gateId of [
    "held_review_packet_ready",
    "held_db_readback_verified",
    "manual_review_acceptance_required",
    "serving_promotion_blocked"
  ]) {
    if (!value.required_preflight_gates?.includes(gateId)) {
      validationErrors.push(`held_promotion_preflight.required_preflight_gates missing ${gateId}`);
    }
  }
  for (const field of [
    "promotion_gate_count",
    "pass_gate_count",
    "manual_gate_count",
    "blocked_gate_count",
    "held_db_readback_verified",
    "review_total_row_count",
    "readback_selected_rows",
    "object_store_missing_count",
    "object_store_readback_count",
    "raw_snapshot_payload_leak_count",
    "writes_database_count",
    "writes_object_store_count",
    "writes_serving_table_count"
  ]) {
    if (!value.required_summary_fields?.includes(field)) {
      validationErrors.push(`held_promotion_preflight.required_summary_fields missing ${field}`);
    }
  }
  const policy = value.safe_output_policy;
  if (!isRecord(policy)) {
    validationErrors.push("held_promotion_preflight.safe_output_policy must be an object");
  } else {
    for (const field of [
      "no_database_url",
      "no_password",
      "no_secret",
      "no_source_url",
      "no_security_code",
      "no_raw_payload",
      "no_sql_text",
      "counts_and_hashes_only"
    ]) {
      if (policy[field] !== true) {
        validationErrors.push(`held_promotion_preflight.safe_output_policy.${field} must be true`);
      }
    }
  }
  const guards = value.promotion_guards;
  if (!isRecord(guards)) {
    return [...validationErrors, "held_promotion_preflight.promotion_guards must be an object"];
  }
  for (const field of [
    "third_party_observations_are_canonical",
    "writes_serving_tables_allowed",
    "automation_release_allowed",
    "raw_html_repo_storage_allowed",
    "export_allowed",
    "mcp_redistribution_allowed"
  ]) {
    if (guards[field] !== false) {
      validationErrors.push(`held_promotion_preflight.promotion_guards.${field} must be false`);
    }
  }
  for (const field of [
    "manual_review_acceptance_required",
    "source_attribution_required",
    "raw_snapshot_required_before_promotion"
  ]) {
    if (guards[field] !== true) {
      validationErrors.push(`held_promotion_preflight.promotion_guards.${field} must be true`);
    }
  }
  return validationErrors;
}

function validateReconciliationDryRun(value) {
  const validationErrors = [];
  if (!isRecord(value)) {
    return ["reconciliation_dry_run must be an object"];
  }
  if (value.version !== "2026-06-28.hk-ipo-public-reconciliation-dry-run.v0") {
    validationErrors.push("reconciliation_dry_run.version mismatch");
  }
  if (value.script !== reconciliationScript) {
    validationErrors.push(`reconciliation_dry_run.script must be ${reconciliationScript}`);
  }
  if (value.package_script !== "npm run check:hk-ipo-public-reconciliation") {
    validationErrors.push("reconciliation_dry_run.package_script mismatch");
  }
  if (value.input_script !== observationAdapterScript) {
    validationErrors.push(`reconciliation_dry_run.input_script must be ${observationAdapterScript}`);
  }
  for (const field of ["writes_database", "writes_files", "promotes_facts"]) {
    if (value[field] !== false) {
      validationErrors.push(`reconciliation_dry_run.${field} must be false`);
    }
  }
  if (value.requires_hkex_url_host !== "www1.hkexnews.hk") {
    validationErrors.push("reconciliation_dry_run.requires_hkex_url_host must be www1.hkexnews.hk");
  }
  for (const status of ["agreement", "conflict", "single_source"]) {
    if (!value.comparison_statuses?.includes(status)) {
      validationErrors.push(`reconciliation_dry_run.comparison_statuses missing ${status}`);
    }
  }
  for (const fact of ["lot_size", "listing_date", "issue_price_range"]) {
    if (!value.compared_facts?.includes(fact)) {
      validationErrors.push(`reconciliation_dry_run.compared_facts missing ${fact}`);
    }
  }
  for (const field of [
    "security_count",
    "compared_field_count",
    "agreement_count",
    "conflict_count",
    "single_source_count",
    "hkex_url_evidence_count",
    "supplement_candidate_count"
  ]) {
    if (!value.required_summary_fields?.includes(field)) {
      validationErrors.push(`reconciliation_dry_run.required_summary_fields missing ${field}`);
    }
  }
  return validationErrors;
}

function validateObservationAdapter(value) {
  const validationErrors = [];
  if (!isRecord(value)) {
    return ["observation_adapter must be an object"];
  }
  if (value.version !== "2026-06-28.hk-ipo-public-observation-adapter.v0") {
    validationErrors.push("observation_adapter.version mismatch");
  }
  if (value.script !== observationAdapterScript) {
    validationErrors.push(`observation_adapter.script must be ${observationAdapterScript}`);
  }
  if (value.fixture_path !== "skills/hkex-news-crawl-qa/evals/public-source-observation-fixtures.json") {
    validationErrors.push("observation_adapter.fixture_path mismatch");
  }
  if (value.package_script !== "npm run check:hk-ipo-public-observations") {
    validationErrors.push("observation_adapter.package_script mismatch");
  }
  if (value.output_kind !== "third_party_ipo_observation") {
    validationErrors.push("observation_adapter.output_kind must be third_party_ipo_observation");
  }
  for (const field of ["writes_database", "writes_files", "executes_source_script", "stores_raw_html_in_repo"]) {
    if (value[field] !== false) {
      validationErrors.push(`observation_adapter.${field} must be false`);
    }
  }
  for (const field of [
    "observation_id",
    "source_id",
    "provider",
    "source_url",
    "observed_at",
    "source_record_id",
    "security_code",
    "field_name",
    "field_value",
    "field_value_type",
    "raw_snapshot_id",
    "raw_snapshot_required",
    "reconciled_with_hkex",
    "conflict_status",
    "locator"
  ]) {
    if (!value.required_observation_fields?.includes(field)) {
      validationErrors.push(`observation_adapter.required_observation_fields missing ${field}`);
    }
  }
  for (const [sourceId, fields] of Object.entries({
    aastocks_ipo_plus: ["company_name", "company_summary_url", "industry", "listing_date", "lot_size"],
    vbkr_hk_ipo: [
      "security_name",
      "security_name_en",
      "issue_low_price",
      "issue_high_price",
      "lot_size",
      "apply_rate",
      "apply_result_date",
      "listed_date",
      "prospectus_url"
    ]
  })) {
    for (const field of fields) {
      if (!value.required_live_fields_by_source?.[sourceId]?.includes(field)) {
        validationErrors.push(`observation_adapter.required_live_fields_by_source.${sourceId} missing ${field}`);
      }
    }
  }
  return validationErrors;
}

function validateTruthContract(value) {
  const validationErrors = [];
  if (!isRecord(value)) {
    return ["truth_contract must be an object"];
  }

  const requiredTrue = [
    "source_attribution_required",
    "source_url_required",
    "observed_at_required",
    "provider_required",
    "raw_snapshot_required_before_promotion",
    "may_fill_missing_fields_after_reconciliation",
    "never_overwrite_hkex_fact_without_conflict_record"
  ];
  for (const field of requiredTrue) {
    if (value[field] !== true) {
      validationErrors.push(`truth_contract.${field} must be true`);
    }
  }
  if (value.third_party_observations_are_canonical !== false) {
    validationErrors.push("truth_contract.third_party_observations_are_canonical must be false");
  }
  return validationErrors;
}

function validateProposedObservationRecord(value) {
  const validationErrors = [];
  if (!isRecord(value)) {
    return ["proposed_observation_record must be an object"];
  }

  for (const field of [
    "provider",
    "source_url",
    "observed_at",
    "source_record_id",
    "security_code",
    "field_name",
    "field_value",
    "raw_snapshot_id",
    "reconciled_with_hkex",
    "conflict_status"
  ]) {
    if (typeof value[field] !== "string" || value[field].length === 0) {
      validationErrors.push(`proposed_observation_record.${field} must be declared`);
    }
  }
  return validationErrors;
}

function validateSources(value) {
  const validationErrors = [];
  if (!Array.isArray(value)) {
    return ["sources must be an array"];
  }

  const expectedIds = ["aastocks_ipo_plus", "vbkr_hk_ipo", "etnet_ipo", "futu_moomoo_ipo"];
  const sourceById = new Map(value.map((source) => [source.id, source]));
  for (const id of expectedIds) {
    if (!sourceById.has(id)) {
      validationErrors.push(`sources missing ${id}`);
    }
  }

  for (const source of value) {
    if (!isRecord(source)) {
      validationErrors.push("each source must be an object");
      continue;
    }
    for (const field of ["id", "provider", "entry_url", "mode", "source_status", "default_use"]) {
      if (typeof source[field] !== "string" || source[field].length === 0) {
        validationErrors.push(`${source.id ?? "source"}.${field} must be a non-empty string`);
      }
    }
    if (source.id !== "futu_moomoo_ipo" && typeof source.robots_url !== "string") {
      validationErrors.push(`${source.id}.robots_url must be declared`);
    }
    if (!isRecord(source.live_probe)) {
      validationErrors.push(`${source.id}.live_probe must be declared`);
    }
  }

  const aastocks = sourceById.get("aastocks_ipo_plus");
  if (isRecord(aastocks)) {
    validationErrors.push(
      ...validateCandidateSource(aastocks, [
        "security_code",
        "listing_date",
        "listing_price",
        "grey_market",
        "sponsor_performance"
      ])
    );
  }

  const vbkr = sourceById.get("vbkr_hk_ipo");
  if (isRecord(vbkr)) {
    validationErrors.push(
      ...validateCandidateSource(vbkr, [
        "security_code",
        "issue_low_price",
        "issue_high_price",
        "lot_size",
        "apply_rate",
        "apply_result_date",
        "listed_date",
        "prospectus_path",
        "sponsors"
      ])
    );
  }

  const etnet = sourceById.get("etnet_ipo");
  if (isRecord(etnet) && etnet.source_status !== "do_not_crawl_by_default") {
    validationErrors.push("etnet_ipo must remain do_not_crawl_by_default");
  }

  const futu = sourceById.get("futu_moomoo_ipo");
  if (isRecord(futu) && futu.source_status !== "do_not_crawl_by_default") {
    validationErrors.push("futu_moomoo_ipo must remain do_not_crawl_by_default");
  }

  return validationErrors;
}

function validateCandidateSource(source, requiredFields) {
  const validationErrors = [];
  if (source.source_status !== "candidate") {
    validationErrors.push(`${source.id} must be a candidate source`);
  }
  if (source.default_use !== "supplemental_public_observation") {
    validationErrors.push(`${source.id} must default to supplemental_public_observation`);
  }
  if (source.live_probe?.enabled !== true) {
    validationErrors.push(`${source.id}.live_probe.enabled must be true`);
  }
  if (source.live_probe?.required_status !== 200) {
    validationErrors.push(`${source.id}.live_probe.required_status must be 200`);
  }
  for (const field of requiredFields) {
    if (!source.fields_observed?.includes(field)) {
      validationErrors.push(`${source.id}.fields_observed missing ${field}`);
    }
  }
  if (!Array.isArray(source.live_probe?.required_fragments) || source.live_probe.required_fragments.length < 5) {
    validationErrors.push(`${source.id}.live_probe.required_fragments must have at least 5 fragments`);
  }
  return validationErrors;
}

function validateVerification(value) {
  const validationErrors = [];
  if (!isRecord(value)) {
    return ["verification must be an object"];
  }
  if (value.static_command !== "npm run check:hk-ipo-public-sources") {
    validationErrors.push("verification.static_command must be npm run check:hk-ipo-public-sources");
  }
  if (value.live_command !== "npm run check:hk-ipo-public-sources -- --live") {
    validationErrors.push("verification.live_command must be npm run check:hk-ipo-public-sources -- --live");
  }
  if (value.adapter_fixture_command !== "npm run check:hk-ipo-public-observations") {
    validationErrors.push("verification.adapter_fixture_command must be npm run check:hk-ipo-public-observations");
  }
  if (value.adapter_live_command !== "node scripts/extract-hk-ipo-public-observations.mjs --live --check") {
    validationErrors.push("verification.adapter_live_command mismatch");
  }
  if (value.reconciliation_fixture_command !== "npm run check:hk-ipo-public-reconciliation") {
    validationErrors.push("verification.reconciliation_fixture_command must be npm run check:hk-ipo-public-reconciliation");
  }
  if (value.reconciliation_live_command !== "node scripts/reconcile-hk-ipo-public-observations.mjs --live --check") {
    validationErrors.push("verification.reconciliation_live_command mismatch");
  }
  if (value.reconciliation_packet_fixture_command !== "npm run check:hk-ipo-public-reconciliation-packet") {
    validationErrors.push(
      "verification.reconciliation_packet_fixture_command must be npm run check:hk-ipo-public-reconciliation-packet"
    );
  }
  if (
    value.reconciliation_packet_live_command !==
    "node scripts/reconcile-hk-ipo-public-observations.mjs --live --packet --check"
  ) {
    validationErrors.push("verification.reconciliation_packet_live_command mismatch");
  }
  if (value.schema_preflight_command !== "npm run check:hk-ipo-public-observation-schema") {
    validationErrors.push("verification.schema_preflight_command must be npm run check:hk-ipo-public-observation-schema");
  }
  if (value.raw_snapshot_capture_fixture_command !== "npm run check:hk-ipo-public-raw-snapshot-capture") {
    validationErrors.push(
      "verification.raw_snapshot_capture_fixture_command must be npm run check:hk-ipo-public-raw-snapshot-capture"
    );
  }
  if (
    value.raw_snapshot_capture_live_command !==
    "node scripts/capture-hk-ipo-public-raw-snapshots.mjs --live --check"
  ) {
    validationErrors.push("verification.raw_snapshot_capture_live_command mismatch");
  }
  if (value.raw_snapshot_storage_fixture_command !== "npm run check:hk-ipo-public-raw-snapshot-storage") {
    validationErrors.push(
      "verification.raw_snapshot_storage_fixture_command must be npm run check:hk-ipo-public-raw-snapshot-storage"
    );
  }
  if (
    value.raw_snapshot_storage_live_command !==
    "node scripts/plan-hk-ipo-public-raw-snapshot-storage.mjs --live --check"
  ) {
    validationErrors.push("verification.raw_snapshot_storage_live_command mismatch");
  }
  if (value.raw_snapshot_r2_writer_fixture_command !== "npm run check:hk-ipo-public-raw-snapshot-r2-writer") {
    validationErrors.push(
      "verification.raw_snapshot_r2_writer_fixture_command must be npm run check:hk-ipo-public-raw-snapshot-r2-writer"
    );
  }
  if (
    value.raw_snapshot_r2_writer_live_command !==
    "node scripts/smoke-hk-ipo-public-raw-snapshot-r2-writer.mjs --live --check"
  ) {
    validationErrors.push("verification.raw_snapshot_r2_writer_live_command mismatch");
  }
  if (
    value.raw_snapshot_r2_writer_remote_command !==
    "node scripts/smoke-hk-ipo-public-raw-snapshot-r2-writer.mjs --live --remote --check"
  ) {
    validationErrors.push("verification.raw_snapshot_r2_writer_remote_command mismatch");
  }
  if (value.apply_plan_fixture_command !== "npm run check:hk-ipo-public-apply-plan") {
    validationErrors.push("verification.apply_plan_fixture_command must be npm run check:hk-ipo-public-apply-plan");
  }
  if (value.apply_plan_live_command !== "node scripts/plan-hk-ipo-public-observation-apply.mjs --live --check") {
    validationErrors.push("verification.apply_plan_live_command mismatch");
  }
  if (value.held_db_apply_packet_fixture_command !== "npm run check:hk-ipo-public-held-db-apply-packet") {
    validationErrors.push(
      "verification.held_db_apply_packet_fixture_command must be npm run check:hk-ipo-public-held-db-apply-packet"
    );
  }
  if (
    value.held_db_apply_packet_live_command !==
    "node scripts/plan-hk-ipo-public-held-db-apply-packet.mjs --live --check"
  ) {
    validationErrors.push("verification.held_db_apply_packet_live_command mismatch");
  }
  if (value.held_db_apply_live_check_command !== "npm run check:hk-ipo-public-held-db-apply-live") {
    validationErrors.push("verification.held_db_apply_live_check_command mismatch");
  }
  if (
    value.held_db_apply_live_remote_command !==
    "AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN=<token> AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_ENDPOINT=<endpoint> node scripts/apply-hk-ipo-public-held-db-live.mjs --remote --check"
  ) {
    validationErrors.push("verification.held_db_apply_live_remote_command mismatch");
  }
  if (value.held_db_apply_smoke_contract_command !== "npm run check:hk-ipo-public-held-db-apply-smoke") {
    validationErrors.push(
      "verification.held_db_apply_smoke_contract_command must be npm run check:hk-ipo-public-held-db-apply-smoke"
    );
  }
  if (
    value.held_db_apply_smoke_unit_test_command !==
    "npm run test -- apps/worker/src/hk-ipo-public-held-db-apply-smoke.test.ts"
  ) {
    validationErrors.push("verification.held_db_apply_smoke_unit_test_command mismatch");
  }
  if (value.held_db_readback_contract_command !== "npm run check:hk-ipo-public-held-db-readback") {
    validationErrors.push(
      "verification.held_db_readback_contract_command must be npm run check:hk-ipo-public-held-db-readback"
    );
  }
  if (
    value.held_db_readback_unit_test_command !==
    "npm run test -- apps/worker/src/hk-ipo-public-held-db-readback.test.ts"
  ) {
    validationErrors.push("verification.held_db_readback_unit_test_command mismatch");
  }
  if (
    value.held_db_readback_remote_command !==
    "AIPHABEE_HK_IPO_PUBLIC_HELD_DB_APPLY_TOKEN=<token> AIPHABEE_HK_IPO_PUBLIC_HELD_DB_READBACK_ENDPOINT=http://127.0.0.1:8798 node scripts/check-hk-ipo-public-held-db-readback.mjs --remote"
  ) {
    validationErrors.push("verification.held_db_readback_remote_command mismatch");
  }
  if (value.held_review_packet_fixture_command !== "npm run check:hk-ipo-public-held-review-packet") {
    validationErrors.push(
      "verification.held_review_packet_fixture_command must be npm run check:hk-ipo-public-held-review-packet"
    );
  }
  if (
    value.held_review_packet_live_command !==
    "node scripts/plan-hk-ipo-public-held-review-packet.mjs --live --check"
  ) {
    validationErrors.push("verification.held_review_packet_live_command mismatch");
  }
  if (value.held_promotion_preflight_fixture_command !== "npm run check:hk-ipo-public-held-promotion-preflight") {
    validationErrors.push(
      "verification.held_promotion_preflight_fixture_command must be npm run check:hk-ipo-public-held-promotion-preflight"
    );
  }
  if (
    value.held_promotion_preflight_live_command !==
    "node scripts/plan-hk-ipo-public-held-promotion-preflight.mjs --live --check"
  ) {
    validationErrors.push("verification.held_promotion_preflight_live_command mismatch");
  }
  if (
    value.held_promotion_preflight_live_with_readback_command !==
    "node scripts/plan-hk-ipo-public-held-promotion-preflight.mjs --live --review-file <review_json> --readback-file <readback_json> --check"
  ) {
    validationErrors.push("verification.held_promotion_preflight_live_with_readback_command mismatch");
  }
  if (value.live_network_writes !== false) {
    validationErrors.push("verification.live_network_writes must be false");
  }
  if (value.raw_html_committed_to_repo !== false) {
    validationErrors.push("verification.raw_html_committed_to_repo must be false");
  }
  return validationErrors;
}

function runObservationAdapterCheck(adapterArgs) {
  const command = `${process.execPath} ${observationAdapterScript} ${adapterArgs.join(" ")}`;
  const result = spawnSync(process.execPath, [observationAdapterScript, ...adapterArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  const check = {
    command,
    errors: [],
    mode: adapterArgs.includes("--live") ? "live" : "fixtures",
    runs: [],
    status: result.status === 0 ? "ok" : "failed"
  };
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    check.errors.push(`observation adapter did not emit JSON for ${check.mode}`);
    if (result.stdout) check.stdout = result.stdout.slice(0, 1000);
    if (result.stderr) check.stderr = result.stderr.slice(0, 1000);
    return check;
  }
  check.status = parsed.status;
  check.runs = parsed.runs ?? [];
  if (result.status !== 0 || parsed.status !== "ok") {
    check.errors.push(`observation adapter ${check.mode} check failed`);
    for (const error of parsed.errors ?? []) check.errors.push(error);
  }
  return check;
}

function runReconciliationCheck(reconciliationArgs) {
  const command = `${process.execPath} ${reconciliationScript} ${reconciliationArgs.join(" ")}`;
  const result = spawnSync(process.execPath, [reconciliationScript, ...reconciliationArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024
  });
  const check = {
    command,
    errors: [],
    mode: reconciliationArgs.includes("--live") ? "live" : "fixtures",
    securities: [],
    status: result.status === 0 ? "ok" : "failed",
    summary: null
  };
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    check.errors.push(`reconciliation dry-run did not emit JSON for ${check.mode}`);
    if (result.stdout) check.stdout = result.stdout.slice(0, 1000);
    if (result.stderr) check.stderr = result.stderr.slice(0, 1000);
    return check;
  }
  check.status = parsed.status;
  check.summary = parsed.summary ?? null;
  check.securities = parsed.securities ?? [];
  if (result.status !== 0 || parsed.status !== "ok") {
    check.errors.push(`reconciliation dry-run ${check.mode} check failed`);
    for (const error of parsed.errors ?? []) check.errors.push(error);
  }
  return check;
}

function runReconciliationPacketCheck(packetArgs) {
  const command = `${process.execPath} ${reconciliationScript} ${packetArgs.join(" ")}`;
  const result = spawnSync(process.execPath, [reconciliationScript, ...packetArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024
  });
  const check = {
    command,
    errors: [],
    mode: packetArgs.includes("--live") ? "live" : "fixtures",
    packet_kind: null,
    status: result.status === 0 ? "ok" : "failed",
    summary: null
  };
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    check.errors.push(`reconciliation packet did not emit JSON for ${check.mode}`);
    if (result.stdout) check.stdout = result.stdout.slice(0, 1000);
    if (result.stderr) check.stderr = result.stderr.slice(0, 1000);
    return check;
  }
  check.status = parsed.status;
  check.packet_kind = parsed.packet_kind ?? null;
  check.summary = parsed.summary ?? null;
  if (result.status !== 0 || parsed.status !== "ok") {
    check.errors.push(`reconciliation packet ${check.mode} check failed`);
    for (const error of parsed.errors ?? []) check.errors.push(error);
  }
  return check;
}

function runSchemaPreflightCheck() {
  const command = `${process.execPath} ${schemaCheckerScript}`;
  const result = spawnSync(process.execPath, [schemaCheckerScript], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024
  });
  const check = {
    command,
    errors: [],
    migration: null,
    status: result.status === 0 ? "ok" : "failed",
    tables: null
  };
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    check.errors.push("schema preflight check did not emit JSON");
    if (result.stdout) check.stdout = result.stdout.slice(0, 1000);
    if (result.stderr) check.stderr = result.stderr.slice(0, 1000);
    return check;
  }
  check.status = parsed.status;
  check.migration = parsed.migration ?? null;
  check.tables = parsed.tables ?? null;
  if (result.status !== 0 || parsed.status !== "ok") {
    check.errors.push("schema preflight check failed");
    for (const error of parsed.errors ?? []) check.errors.push(error);
  }
  return check;
}

function runRawSnapshotCaptureCheck(captureArgs) {
  const command = `${process.execPath} ${rawSnapshotCaptureScript} ${captureArgs.join(" ")}`;
  const result = spawnSync(process.execPath, [rawSnapshotCaptureScript, ...captureArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024
  });
  const check = {
    command,
    errors: [],
    mode: captureArgs.includes("--live") ? "live" : "fixtures",
    status: result.status === 0 ? "ok" : "failed",
    summary: null
  };
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    check.errors.push(`raw snapshot capture did not emit JSON for ${check.mode}`);
    if (result.stdout) check.stdout = result.stdout.slice(0, 1000);
    if (result.stderr) check.stderr = result.stderr.slice(0, 1000);
    return check;
  }
  check.status = parsed.status;
  check.summary = parsed.summary ?? null;
  if (result.status !== 0 || parsed.status !== "ok") {
    check.errors.push(`raw snapshot capture ${check.mode} check failed`);
    for (const error of parsed.errors ?? []) check.errors.push(error);
  }
  return check;
}

function runRawSnapshotStorageCheck(storageArgs) {
  const command = `${process.execPath} ${rawSnapshotStorageScript} ${storageArgs.join(" ")}`;
  const result = spawnSync(process.execPath, [rawSnapshotStorageScript, ...storageArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024
  });
  const check = {
    command,
    errors: [],
    mode: storageArgs.includes("--live") ? "live" : "fixtures",
    status: result.status === 0 ? "ok" : "failed",
    summary: null
  };
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    check.errors.push(`raw snapshot storage did not emit JSON for ${check.mode}`);
    if (result.stdout) check.stdout = result.stdout.slice(0, 1000);
    if (result.stderr) check.stderr = result.stderr.slice(0, 1000);
    return check;
  }
  check.status = parsed.status;
  check.summary = parsed.summary ?? null;
  if (result.status !== 0 || parsed.status !== "ok") {
    check.errors.push(`raw snapshot storage ${check.mode} check failed`);
    for (const error of parsed.errors ?? []) check.errors.push(error);
  }
  return check;
}

function runRawSnapshotR2WriterCheck(writerArgs) {
  const command = `${process.execPath} ${rawSnapshotR2WriterScript} ${writerArgs.join(" ")}`;
  const result = spawnSync(process.execPath, [rawSnapshotR2WriterScript, ...writerArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024
  });
  const check = {
    command,
    errors: [],
    mode: writerArgs.includes("--live") ? "live" : "fixtures",
    remote: writerArgs.includes("--remote"),
    status: result.status === 0 ? "ok" : "failed",
    summary: null
  };
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    check.errors.push(`raw snapshot R2 writer did not emit JSON for ${check.mode}`);
    if (result.stdout) check.stdout = result.stdout.slice(0, 1000);
    if (result.stderr) check.stderr = result.stderr.slice(0, 1000);
    return check;
  }
  check.status = parsed.status;
  check.summary = parsed.summary ?? null;
  if (result.status !== 0 || parsed.status !== "ok") {
    check.errors.push(`raw snapshot R2 writer ${check.mode} check failed`);
    for (const error of parsed.errors ?? []) check.errors.push(error);
  }
  return check;
}

function runApplyPlanCheck(planArgs) {
  const command = `${process.execPath} ${applyPlannerScript} ${planArgs.join(" ")}`;
  const result = spawnSync(process.execPath, [applyPlannerScript, ...planArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024
  });
  const check = {
    command,
    errors: [],
    mode: planArgs.includes("--live") ? "live" : "fixtures",
    status: result.status === 0 ? "ok" : "failed",
    summary: null
  };
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    check.errors.push(`apply planner did not emit JSON for ${check.mode}`);
    if (result.stdout) check.stdout = result.stdout.slice(0, 1000);
    if (result.stderr) check.stderr = result.stderr.slice(0, 1000);
    return check;
  }
  check.status = parsed.status;
  check.summary = parsed.summary ?? null;
  if (result.status !== 0 || parsed.status !== "ok") {
    check.errors.push(`apply planner ${check.mode} check failed`);
    for (const error of parsed.errors ?? []) check.errors.push(error);
  }
  return check;
}

function runHeldDbApplyPacketCheck(packetArgs) {
  const command = `${process.execPath} ${heldDbApplyPacketScript} ${packetArgs.join(" ")}`;
  const result = spawnSync(process.execPath, [heldDbApplyPacketScript, ...packetArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024
  });
  const check = {
    command,
    errors: [],
    mode: packetArgs.includes("--live") ? "live" : "fixtures",
    status: result.status === 0 ? "ok" : "failed",
    summary: null
  };
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    check.errors.push(`held DB apply packet did not emit JSON for ${check.mode}`);
    if (result.stdout) check.stdout = result.stdout.slice(0, 1000);
    if (result.stderr) check.stderr = result.stderr.slice(0, 1000);
    return check;
  }
  check.status = parsed.status;
  check.summary = parsed.summary ?? null;
  if (result.status !== 0 || parsed.status !== "ok") {
    check.errors.push(`held DB apply packet ${check.mode} check failed`);
    for (const error of parsed.errors ?? []) check.errors.push(error);
  }
  return check;
}

function runHeldDbApplySmokeContractCheck() {
  const command = `${process.execPath} ${heldDbApplySmokeContractScript}`;
  const result = spawnSync(process.execPath, [heldDbApplySmokeContractScript], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024
  });
  const check = {
    command,
    errors: [],
    route: null,
    status: result.status === 0 ? "ok" : "failed",
    tables: null
  };
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    check.errors.push("held DB apply smoke contract check did not emit JSON");
    if (result.stdout) check.stdout = result.stdout.slice(0, 1000);
    if (result.stderr) check.stderr = result.stderr.slice(0, 1000);
    return check;
  }
  check.status = parsed.status;
  check.route = parsed.route ?? null;
  check.tables = parsed.tables ?? null;
  if (result.status !== 0 || parsed.status !== "ok") {
    check.errors.push("held DB apply smoke contract check failed");
    for (const error of parsed.errors ?? []) check.errors.push(error);
  }
  return check;
}

function runHeldDbReadbackCheck() {
  const command = `${process.execPath} ${heldDbReadbackScript} --check`;
  const result = spawnSync(process.execPath, [heldDbReadbackScript, "--check"], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024
  });
  const check = {
    command,
    errors: [],
    route: null,
    status: result.status === 0 ? "ok" : "failed",
    version: null
  };
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    check.errors.push("held DB readback check did not emit JSON");
    if (result.stdout) check.stdout = result.stdout.slice(0, 1000);
    if (result.stderr) check.stderr = result.stderr.slice(0, 1000);
    return check;
  }
  check.status = parsed.status;
  check.route = parsed.route ?? null;
  check.version = parsed.version ?? null;
  if (result.status !== 0 || parsed.status !== "ok") {
    check.errors.push("held DB readback check failed");
    for (const error of parsed.errors ?? []) check.errors.push(error);
  }
  return check;
}

function runHeldReviewPacketCheck(packetArgs) {
  const command = `${process.execPath} ${heldReviewPacketScript} ${packetArgs.join(" ")}`;
  const result = spawnSync(process.execPath, [heldReviewPacketScript, ...packetArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024
  });
  const check = {
    command,
    errors: [],
    mode: packetArgs.includes("--live") ? "live" : "fixtures",
    promotion_status: null,
    review_status: null,
    status: result.status === 0 ? "ok" : "failed",
    summary: null
  };
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    check.errors.push(`held review packet did not emit JSON for ${check.mode}`);
    if (result.stdout) check.stdout = result.stdout.slice(0, 1000);
    if (result.stderr) check.stderr = result.stderr.slice(0, 1000);
    return check;
  }
  check.status = parsed.status;
  check.review_status = parsed.review_status ?? null;
  check.promotion_status = parsed.promotion_status ?? null;
  check.summary = parsed.summary ?? null;
  if (result.status !== 0 || parsed.status !== "ok") {
    check.errors.push(`held review packet ${check.mode} check failed`);
    for (const error of parsed.errors ?? []) check.errors.push(error);
  }
  return check;
}

function runHeldPromotionPreflightCheck(preflightArgs) {
  const command = `${process.execPath} ${heldPromotionPreflightScript} ${preflightArgs.join(" ")}`;
  const result = spawnSync(process.execPath, [heldPromotionPreflightScript, ...preflightArgs], {
    cwd: process.cwd(),
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024
  });
  const check = {
    command,
    errors: [],
    held_db_readback_status: null,
    mode: preflightArgs.includes("--live") ? "live" : "fixtures",
    promotion_status: null,
    status: result.status === 0 ? "ok" : "failed",
    summary: null
  };
  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    check.errors.push(`held promotion preflight did not emit JSON for ${check.mode}`);
    if (result.stdout) check.stdout = result.stdout.slice(0, 1000);
    if (result.stderr) check.stderr = result.stderr.slice(0, 1000);
    return check;
  }
  check.status = parsed.status;
  check.held_db_readback_status = parsed.held_db_readback_status ?? null;
  check.promotion_status = parsed.promotion_status ?? null;
  check.summary = parsed.summary ?? null;
  if (result.status !== 0 || !["blocked_missing_held_db_readback", "blocked_pending_manual_review"].includes(parsed.status)) {
    check.errors.push(`held promotion preflight ${check.mode} check failed`);
    for (const error of parsed.errors ?? []) check.errors.push(error);
  }
  return check;
}

async function runLiveChecks(value) {
  const checks = [];

  for (const source of value.sources) {
    if (!source.live_probe?.enabled) {
      if (source.live_probe?.robots_only === true) {
        checks.push(await runRobotsOnlyCheck(source));
      }
      continue;
    }

    const sourceErrors = [];
    const page = await fetchText(source.entry_url);
    if (page.status !== source.live_probe.required_status) {
      sourceErrors.push(`${source.id} expected HTTP ${source.live_probe.required_status}, got ${page.status}`);
    }
    for (const fragment of source.live_probe.required_fragments ?? []) {
      if (!page.text.includes(fragment)) {
        sourceErrors.push(`${source.id} missing live fragment: ${fragment}`);
      }
    }

    if (source.robots_url && source.live_probe.robots_required_fragments?.length > 0) {
      const robots = await fetchText(source.robots_url);
      if (robots.status !== 200) {
        sourceErrors.push(`${source.id} robots expected HTTP 200, got ${robots.status}`);
      }
      for (const fragment of source.live_probe.robots_required_fragments) {
        if (!robots.text.includes(fragment)) {
          sourceErrors.push(`${source.id} robots missing fragment: ${fragment}`);
        }
      }
    }

    checks.push({
      bytes_seen: page.text.length,
      errors: sourceErrors,
      id: source.id,
      provider: source.provider,
      status_code: page.status
    });
  }

  return checks;
}

async function runRobotsOnlyCheck(source) {
  const sourceErrors = [];
  const robots = await fetchText(source.robots_url);
  if (robots.status !== 200) {
    sourceErrors.push(`${source.id} robots expected HTTP 200, got ${robots.status}`);
  }
  for (const fragment of source.live_probe.robots_required_fragments ?? []) {
    if (!robots.text.includes(fragment)) {
      sourceErrors.push(`${source.id} robots missing fragment: ${fragment}`);
    }
  }
  return {
    bytes_seen: robots.text.length,
    errors: sourceErrors,
    id: source.id,
    provider: source.provider,
    robots_only: true,
    status_code: robots.status
  };
}

async function fetchText(url) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,zh-HK;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AiphaBeePublicSourceReadiness/0.1"
      },
      signal: AbortSignal.timeout(20000)
    });
    return {
      status: response.status,
      text: await response.text()
    };
  } catch (error) {
    return {
      status: 0,
      text: `FETCH_ERROR:${error instanceof Error ? error.message : String(error)}`
    };
  }
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

function readText(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), "utf8");
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "missing_file"
      },
      1
    );
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(payload, code) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(code);
}
