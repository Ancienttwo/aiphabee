#!/usr/bin/env node
import { createHash, randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const accountId = "ab66185011440a6f8a698d61ad58703a";
const sandboxApplicationId = "a035c710-c9d5-4a51-846e-56edbe96fd19";
const operatorConfig = resolve(root, "deploy/fastclaw/row10-live-acceptance.wrangler.jsonc");
const workerConfig = resolve(root, "apps/worker/wrangler.jsonc");
const defaultPacket = "_ops/fastclaw-row10/live-release-evidence.json";
const operatorWorkerName = "aiphabee-row10-live-acceptance-operator";
const admissionBatchDelayMs = 75_000;
const deployedOperatorUrl =
  "https://aiphabee-row10-live-acceptance-operator.metalabs.workers.dev";
const pricing = Object.freeze({
  container_cpu_per_second: 0.00002,
  container_disk_gb_second: 0.00000007,
  container_egress_per_gb: 0.04,
  container_memory_gib_second: 0.0000025,
  currency: "USD",
  durable_object_gb_second: 12.5 / 1_000_000,
  durable_object_request: 0.15 / 1_000_000,
  logs_event: 0.6 / 1_000_000,
  r2_class_a_operation: 4.5 / 1_000_000,
  r2_class_b_operation: 0.36 / 1_000_000,
  r2_gb_month: 0.015,
  retrieved_on: "2026-07-11",
  worker_cpu_ms: 0.02 / 1_000_000,
  worker_request: 0.3 / 1_000_000
});
const diagnosticIndexArgument = process.argv.indexOf("--diagnostic-run-one");
const diagnosticIndex =
  diagnosticIndexArgument < 0
    ? null
    : Number.parseInt(process.argv[diagnosticIndexArgument + 1] ?? "", 10);
if (
  diagnosticIndex !== null &&
  (!Number.isSafeInteger(diagnosticIndex) || diagnosticIndex < 0 || diagnosticIndex >= 10)
) {
  fail({ status: "invalid_diagnostic_index" });
}

if (process.argv.includes("--dry-run")) {
  emit({
    account_id_hash: hash(accountId),
    billing_allocation_requires_billing_read: true,
    operator_config: "deploy/fastclaw/row10-live-acceptance.wrangler.jsonc",
    required_concurrent_runs: 10,
    status: "ready_no_mutation"
  });
}

const checkIndex = process.argv.indexOf("--check-packet");
if (checkIndex >= 0) {
  const path = process.argv[checkIndex + 1];
  if (!path) fail({ status: "missing_packet_path" });
  const packetText = await readFile(resolve(root, path), "utf8");
  const packet = JSON.parse(packetText);
  validatePacket(packet);
  emit({ packet_hash: hash(packetText), status: "passed" });
}

const rebuildIndex = process.argv.indexOf("--rebuild-packet");
if (rebuildIndex >= 0) {
  const path = process.argv[rebuildIndex + 1];
  if (!path) fail({ status: "missing_packet_path" });
  const absolutePath = resolve(root, path);
  const previous = JSON.parse(await readFile(absolutePath, "utf8"));
  const rebuilt = buildPacket(
    previous.acceptance.application,
    previous.provider,
    previous.acceptance.cleanup
  );
  const packetHash = await writePacket(absolutePath, rebuilt);
  emit({
    blockers: rebuilt.release_gate.blockers,
    packet_hash: packetHash,
    packet_path: path,
    status: rebuilt.release_gate.release_allowed ? "passed" : "captured_blocked"
  });
}

const refreshProviderIndex = process.argv.indexOf("--refresh-provider");
if (refreshProviderIndex >= 0) {
  const path = process.argv[refreshProviderIndex + 1] ?? defaultPacket;
  const absolutePath = resolve(root, path);
  const previous = JSON.parse(await readFile(absolutePath, "utf8"));
  validatePacket(previous);
  const application = previous.acceptance.application;
  const starts = application.runs.map((run) => Date.parse(run.sandbox_active_from));
  const ends = application.runs.map((run) => Date.parse(run.sandbox_active_until));
  if ([...starts, ...ends].some((value) => !Number.isFinite(value))) {
    fail({ status: "invalid_provider_refresh_window" });
  }
  // Include admission and provider-ingestion boundaries around the measured
  // sandbox lifetime. Exact per-run joins use provider IDs, never timestamps.
  const start = new Date(Math.min(...starts) - 10 * 60_000);
  const end = new Date(Math.max(...ends) + 60_000);
  const provider = await collectProviderEvidence(start, end, application);
  const refreshed = buildPacket(application, provider, previous.acceptance.cleanup);
  const packetHash = await writePacket(absolutePath, refreshed);
  emit({
    blockers: refreshed.release_gate.blockers,
    packet_hash: packetHash,
    packet_path: path,
    status: refreshed.release_gate.release_allowed ? "passed" : "captured_blocked"
  });
}

const recoverProviderIndex = process.argv.indexOf("--recover-provider");
if (recoverProviderIndex >= 0) {
  const recoveryPath = process.argv[recoverProviderIndex + 1];
  const targetPath = process.argv[recoverProviderIndex + 2] ?? defaultPacket;
  if (!recoveryPath) fail({ status: "missing_provider_recovery_path" });
  const recovery = JSON.parse(await readFile(resolve(root, recoveryPath), "utf8"));
  const application = recovery.application;
  const cleanup = recovery.cleanup;
  if (!Array.isArray(application?.runs) || application.runs.length !== 10) {
    fail({ status: "invalid_provider_recovery_application" });
  }
  const starts = application.runs.map((run) => Date.parse(run.sandbox_active_from));
  const ends = application.runs.map((run) => Date.parse(run.sandbox_active_until));
  const provider = await collectProviderEvidence(
    new Date(Math.min(...starts) - 10 * 60_000),
    new Date(Math.max(...ends) + 60_000),
    application
  );
  const recovered = buildPacket(application, provider, cleanup);
  const packetHash = await writePacket(resolve(root, targetPath), recovered);
  await rm(resolve(root, recoveryPath), { force: true });
  emit({
    blockers: recovered.release_gate.blockers,
    packet_hash: packetHash,
    packet_path: targetPath,
    status: recovered.release_gate.release_allowed ? "passed" : "captured_blocked"
  });
}

const packetIndex = process.argv.indexOf("--packet");
const packetPath = packetIndex >= 0 ? process.argv[packetIndex + 1] : defaultPacket;
if (!packetPath) fail({ status: "missing_packet_path" });

const acceptanceId = `row10-${randomBytes(12).toString("hex")}`;
const token = randomBytes(32).toString("base64url");
const statePath = resolve(root, "_ops/fastclaw-row10/operator-state.json");
const port = await freePort();
const logs = [];
let child;
let operatorDeployed = false;
let operatorEndpoint;
let applicationPacket;
let cleanupPacket;
let providerPacket;
let failure;
let operatorPhase = "initialize";
const startedAt = new Date(Date.now() - 30_000);
await mkdir(dirname(statePath), { recursive: true });
await writeFile(
  statePath,
  `${JSON.stringify({ acceptance_id: acceptanceId, token }, null, 2)}\n`,
  { mode: 0o600 }
);

try {
  operatorPhase = "secret_put";
  await wranglerSecret("put", token);
  await wranglerDeploy();
  operatorPhase = "remote_preview";
  await deployOperator(token);
  operatorDeployed = true;
  operatorEndpoint = deployedOperatorUrl;
  await waitForReady(operatorEndpoint);
  await waitForAuth(operatorEndpoint, token);
  await waitForOperatorJobs(operatorEndpoint, token);
  operatorPhase = "live_run";
  if (diagnosticIndex === null) {
    const prepared = await operatorRequest(
      operatorEndpoint,
      token,
      "/internal/row10/prepare",
      acceptanceId
    );
    const releaseAt = new Date(Date.now() + 8 * 60_000).toISOString();
    const settledRuns = await Promise.allSettled(
      Array.from({ length: 10 }, (_, index) =>
        delay(Math.floor(index / 2) * admissionBatchDelayMs).then(() =>
          operatorRequest(
            operatorEndpoint,
            token,
            "/internal/row10/run-one",
            acceptanceId,
            { index, release_at: releaseAt }
          )
        )
      )
    );
    const failedRun = settledRuns.find((result) => result.status === "rejected");
    if (failedRun !== undefined) throw failedRun.reason;
    const runs = settledRuns.map((result) => result.value);
    applicationPacket = {
      acceptance_id_hash: prepared.acceptance_id_hash,
      callback_contract: "2026-07-11.aiphabee-tool-callback.v1",
      concurrent_runs: 10,
      environment: "staging",
      fixture_authority_hash: prepared.fixture_authority_hash,
      observed_at: new Date().toISOString(),
      runs,
      status: "live_application_evidence_captured"
    };
    applicationPacket.max_concurrent_sandboxes = maxConcurrentSandboxes(
      applicationPacket.runs
    );
    const endedAt = new Date(Date.now() + 30_000);
    operatorPhase = "provider_evidence";
    providerPacket = await collectProviderEvidence(startedAt, endedAt, applicationPacket);
  } else {
    await operatorRequest(
      operatorEndpoint,
      token,
      "/internal/row10/prepare",
      acceptanceId
    );
    applicationPacket = await operatorRequest(
      operatorEndpoint,
      token,
      "/internal/row10/run-one",
      acceptanceId,
      {
        index: diagnosticIndex,
        release_at: new Date(Date.now() + 5_000).toISOString()
      }
    );
  }
  operatorPhase = "cleanup";
  cleanupPacket = await operatorRequest(
    operatorEndpoint,
    token,
    "/internal/row10/cleanup",
    acceptanceId
  );
} catch (error) {
  const failureMessage =
    error instanceof Error ? error.message : "row10 live operator failed";
  failure = {
    error_hash: hash(failureMessage),
    failure_code: /^[A-Za-z0-9_:.-]{1,240}$/u.test(failureMessage)
      ? failureMessage
      : "ROW10_LIVE_OPERATOR_FAILED",
    failure_phase: operatorPhase,
    operator_log_hash: hash(logs.join("")),
    status: "live_operator_failed"
  };
  const debugPath = resolve(root, "_ops/fastclaw-row10/operator-debug.log");
  await mkdir(dirname(debugPath), { recursive: true });
  await writeFile(
    debugPath,
    `${JSON.stringify({ failure_message: failureMessage, failure_phase: operatorPhase })}\n${logs.join("")}`,
    { mode: 0o600 }
  );
  if (operatorEndpoint !== undefined) {
    try {
      cleanupPacket = await operatorRequest(
        operatorEndpoint,
        token,
        "/internal/row10/cleanup",
        acceptanceId
      );
    } catch (cleanupError) {
      failure.cleanup_error_hash = hash(
        cleanupError instanceof Error ? cleanupError.message : "row10 cleanup failed"
      );
    }
  }
} finally {
  if (child !== undefined) {
    child.kill("SIGTERM");
    await Promise.race([
      new Promise((resolveExit) => child.once("exit", resolveExit)),
      new Promise((resolveTimeout) => setTimeout(resolveTimeout, 5_000))
    ]);
    if (child.exitCode === null) child.kill("SIGKILL");
  }
  if (operatorDeployed) {
    await deleteOperator().catch((error) => {
      failure ??= { status: "live_operator_failed" };
      failure.operator_cleanup_error_hash = hash(
        error instanceof Error ? error.message : "operator cleanup failed"
      );
    });
  }
  let secretRemoved = false;
  if (cleanupPacket?.status === "cleanup_confirmed") {
    secretRemoved = true;
    await wranglerSecret("delete").catch((error) => {
      secretRemoved = false;
      failure ??= { status: "live_operator_failed" };
      failure.secret_cleanup_error_hash = hash(
        error instanceof Error ? error.message : "secret cleanup failed"
      );
    });
  }
  if (cleanupPacket?.status === "cleanup_confirmed" && secretRemoved) {
    await rm(statePath, { force: true });
  }
}

if (failure !== undefined) {
  if (
    applicationPacket?.status === "live_application_evidence_captured" &&
    cleanupPacket?.status === "cleanup_confirmed"
  ) {
    const recoveryPath = resolve(root, "_ops/fastclaw-row10/provider-recovery.json");
    await writeFile(
      recoveryPath,
      `${JSON.stringify({ application: applicationPacket, cleanup: cleanupPacket }, null, 2)}\n`,
      { mode: 0o600 }
    );
    failure.provider_recovery_path = "_ops/fastclaw-row10/provider-recovery.json";
  }
  fail(failure);
}
if (diagnosticIndex !== null) {
  emit({
    cleanup: cleanupPacket,
    diagnostic_index: diagnosticIndex,
    run: applicationPacket,
    status: "diagnostic_run_captured"
  });
}
const packet = buildPacket(applicationPacket, providerPacket, cleanupPacket);
const absolutePacket = resolve(root, packetPath);
await mkdir(dirname(absolutePacket), { recursive: true });
const packetHash = await writePacket(absolutePacket, packet);
emit({
  blockers: packet.release_gate.blockers,
  packet_hash: packetHash,
  packet_path: packetPath,
  status: packet.release_gate.release_allowed ? "passed" : "captured_blocked"
});

function buildPacket(application, provider, cleanup) {
  const containerByHash = new Map(
    provider.container_usage.groups.map((group) => [hash(group.dimensions.instanceId), group])
  );
  const r2UsageByRunHash = new Map(
    (cleanup.r2_usage ?? []).map((usage) => [usage.run_hash, number(usage.byte_seconds)])
  );
  const durableObjectByHash = new Map(
    (provider.durable_object_metrics.runs ?? []).map((usage) => [usage.object_id_hash, usage])
  );
  const workerByRunHash = new Map(
    (provider.worker_metrics.runs ?? []).map((usage) => [usage.run_hash, usage])
  );
  const logsByRunHash = new Map(
    (provider.logs.runs ?? []).map((usage) => [usage.run_hash, usage])
  );
  const runs = application.runs.map((run) => {
    const group = containerByHash.get(run.provider_instance_hash);
    const container = group?.sum;
    const cpuSeconds = number(container?.cpuTimeSec);
    const memoryGibSeconds = number(container?.allocatedMemory) / 2 ** 30;
    const diskGbSeconds = number(container?.allocatedDisk) / 1_000_000_000;
    const egressBytes = number(container?.txBytes);
    const containerMetricsPresent = group !== undefined;
    const containerCost = containerMetricsPresent
      ? cpuSeconds * pricing.container_cpu_per_second +
        memoryGibSeconds * pricing.container_memory_gib_second +
        diskGbSeconds * pricing.container_disk_gb_second +
        (egressBytes / 1_000_000_000) * pricing.container_egress_per_gb
      : null;
    const durableObject = durableObjectByHash.get(run.provider_instance_hash);
    const durableObjectRequests =
      durableObject === undefined ? null : number(durableObject.requests);
    const durableObjectGbSeconds =
      durableObject === undefined ? null : number(durableObject.gb_seconds);
    const durableObjectCost =
      durableObject === undefined
        ? null
        : durableObjectRequests * pricing.durable_object_request +
          durableObjectGbSeconds * pricing.durable_object_gb_second;
    const worker = workerByRunHash.get(run.run_hash);
    const workerRequests = worker === undefined ? null : number(worker.worker_requests);
    const workerCpuMs = worker === undefined ? null : number(worker.worker_cpu_ms);
    const logEventsWritten =
      logsByRunHash.get(run.run_hash) === undefined
        ? null
        : number(logsByRunHash.get(run.run_hash)?.log_events_written);
    const r2ByteSeconds =
      r2UsageByRunHash.get(run.run_hash) ??
      (run.terminal_state === "kill_switch" ? 0 : null);
    const r2Cost =
      r2ByteSeconds === null
        ? null
        : number(run.r2_class_a_operations) * pricing.r2_class_a_operation +
          number(run.r2_class_b_operations) * pricing.r2_class_b_operation +
          (r2ByteSeconds / 1_000_000_000 / (30 * 24 * 60 * 60)) * pricing.r2_gb_month;
    const workerCost =
      workerRequests !== null && workerCpuMs !== null
        ? workerRequests * pricing.worker_request + workerCpuMs * pricing.worker_cpu_ms
        : null;
    const logsCost =
      logEventsWritten !== null
        ? logEventsWritten * pricing.logs_event
        : null;
    const measuredComponentCost =
      [containerCost, durableObjectCost, r2Cost]
        .filter((value) => value !== null)
        .reduce((sum, value) => sum + value, 0);
    const totalRawListCost =
      containerCost !== null &&
      durableObjectCost !== null &&
      r2Cost !== null &&
      workerCost !== null &&
      logsCost !== null
        ? containerCost + durableObjectCost + r2Cost + workerCost + logsCost
        : null;
    return {
      ...run,
      allocated_invoice_cost_usd: null,
      container_raw_list_cost_usd: containerCost,
      container_cpu_seconds: containerMetricsPresent ? cpuSeconds : null,
      container_disk_gb_seconds: containerMetricsPresent ? diskGbSeconds : null,
      container_egress_bytes: containerMetricsPresent ? egressBytes : null,
      container_memory_gib_seconds: containerMetricsPresent ? memoryGibSeconds : null,
      durable_object_gb_seconds: durableObjectGbSeconds,
      durable_object_raw_list_cost_usd: durableObjectCost,
      durable_object_requests: durableObjectRequests,
      log_events_written: logEventsWritten,
      measured_partial_raw_list_cost_usd: measuredComponentCost,
      r2_raw_list_cost_usd: r2Cost,
      r2_storage_byte_seconds: r2ByteSeconds,
      raw_list_cost_usd: totalRawListCost,
      worker_cpu_ms: workerCpuMs,
      worker_requests: workerRequests
    };
  });
  const containerComplete = runs.every((run) => run.container_cpu_seconds !== null);
  const blockers = [];
  if (
    application?.status !== "live_application_evidence_captured" ||
    !Array.isArray(application?.runs) ||
    application.runs.length !== 10 ||
    application.max_concurrent_sandboxes !== 10 ||
    new Set(application.runs.map((run) => run.workspace_hash)).size !== 10 ||
    new Set(application.runs.map((run) => run.account_hash)).size !== 10 ||
    new Set(application.runs.map((run) => run.sandbox_hash)).size !== 10 ||
    application.runs.some(
      (run) =>
        run.cross_tenant_rejected !== true ||
        run.destroy_confirmed !== true ||
        (run.terminal_state === "kill_switch"
          ? run.kill_switch_confirmed !== true
          : run.terminal_state !== "completed" ||
            run.scan_status !== "clean" ||
            run.handoff_confirmed !== true)
    )
  ) {
    blockers.push("application_acceptance_incomplete");
  }
  if (cleanup?.status !== "cleanup_confirmed" || cleanup?.residual_rows !== 0) {
    blockers.push("cleanup_readback_incomplete");
  }
  if (!containerComplete) blockers.push("container_usage_per_run_missing");
  if (!provider.worker_metrics.complete) blockers.push("worker_metrics_per_run_missing");
  if (!provider.durable_object_metrics.complete) blockers.push("durable_object_metrics_per_run_missing");
  if (!provider.logs.complete) blockers.push("logs_per_run_missing");
  if (!provider.billing.read_proven) blockers.push("billing_read_missing");
  if (runs.some((run) => run.r2_storage_byte_seconds === null)) {
    blockers.push("r2_storage_duration_per_run_missing");
  }
  return {
    acceptance: {
      application: application,
      cleanup,
      runs
    },
    environment: "staging",
    observed_at: new Date().toISOString(),
    pricing: {
      ...pricing,
      actual_bill: provider.billing.read_proven,
      raw_list_cost_is_actual_bill: false,
      sources: [
        "https://developers.cloudflare.com/containers/pricing/",
        "https://developers.cloudflare.com/workers/platform/pricing/",
        "https://developers.cloudflare.com/r2/pricing/",
        "https://developers.cloudflare.com/hyperdrive/platform/pricing/",
        "https://developers.cloudflare.com/billing/manage/billable-usage/"
      ]
    },
    provider,
    release_gate: {
      blockers,
      feature_enabled: false,
      release_allowed: blockers.length === 0,
      row_complete: blockers.length === 0
    },
    status: blockers.length === 0 ? "passed" : "blocked",
    version: "2026-07-11.fastclaw-live-release-evidence.v0"
  };
}

async function collectProviderEvidence(start, end, application) {
  const oauth = await cloudflareProviderToken();
  const providerInstanceHashes = new Set(
    application.runs.map((run) => run.provider_instance_hash)
  );
  let containerGroups = [];
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await graphql(
      oauth,
      `query Row10Containers($accountTag: String, $start: Time, $end: Time) {
        viewer { accounts(filter: {accountTag: $accountTag}) {
          containersUsageAdaptiveGroups(
            limit: 1000,
            filter: {
              datetime_geq: $start,
              datetime_leq: $end,
              applicationId: "${sandboxApplicationId}"
            }
          ) {
            dimensions { applicationId instanceId region }
            sum { allocatedDisk allocatedMemory cpuTimeSec txBytes }
          }
        } }
      }`,
      { accountTag: accountId, end: end.toISOString(), start: start.toISOString() }
    );
    containerGroups =
      result?.data?.viewer?.accounts?.[0]?.containersUsageAdaptiveGroups ?? [];
    const matched = containerGroups.filter((group) =>
      providerInstanceHashes.has(hash(group.dimensions.instanceId))
    ).length;
    if (matched === application.runs.length) break;
    await delay(15_000);
  }
  const observability = await collectObservabilityMetrics(oauth, start, end, application);
  const durableObjectMetrics = await collectDurableObjectMetrics(
    oauth,
    start,
    end,
    providerInstanceHashes
  );
  const billing = await billingRead(oauth);
  return {
    billing,
    container_usage: {
      application_id_hash: hash(sandboxApplicationId),
      groups: containerGroups,
      query_hash: hash(`${start.toISOString()}\u0000${end.toISOString()}\u0000containersUsageAdaptiveGroups`),
      read_proven: true
    },
    durable_object_metrics: durableObjectMetrics,
    logs: observability.logs,
    worker_metrics: observability.worker_metrics
  };
}

async function collectDurableObjectMetrics(token, start, end, providerInstanceHashes) {
  let invocationGroups = [];
  let periodicGroups = [];
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const result = await graphql(
      token,
      `query Row10DurableObjects($accountTag: string, $start: string, $end: string) {
        viewer { accounts(filter: {accountTag: $accountTag}) {
          invocations: durableObjectsInvocationsAdaptiveGroups(
            limit: 10000,
            filter: {
              datetime_geq: $start,
              datetime_leq: $end,
              scriptName: "aiphabee-sandbox-bridge-staging"
            }
          ) {
            dimensions { objectId status type }
            sum { errors requests }
          }
          periodic: durableObjectsPeriodicGroups(
            limit: 10000,
            filter: { datetime_geq: $start, datetime_leq: $end }
          ) {
            dimensions { objectId }
            sum { duration }
          }
        } }
      }`,
      { accountTag: accountId, end: end.toISOString(), start: start.toISOString() }
    );
    const account = result?.data?.viewer?.accounts?.[0];
    invocationGroups = account?.invocations ?? [];
    periodicGroups = account?.periodic ?? [];
    const periodicHashes = new Set(
      periodicGroups.map((group) => hash(group.dimensions.objectId))
    );
    if ([...providerInstanceHashes].every((value) => periodicHashes.has(value))) break;
    await delay(15_000);
  }
  const runs = [...providerInstanceHashes].map((objectIdHash) => {
    const invocations = invocationGroups.filter(
      (group) => hash(group.dimensions.objectId) === objectIdHash
    );
    const periodic = periodicGroups.filter(
      (group) => hash(group.dimensions.objectId) === objectIdHash
    );
    return {
      errors: invocations.reduce((sum, group) => sum + number(group.sum?.errors), 0),
      gb_seconds:
        periodic.length === 1 ? number(periodic[0]?.sum?.duration) : null,
      object_id_hash: objectIdHash,
      requests: invocations.reduce((sum, group) => sum + number(group.sum?.requests), 0)
    };
  });
  const complete = runs.every(
    (run) => run.gb_seconds !== null && run.requests > 0
  );
  return {
    complete,
    query_hash: hash(
      `${start.toISOString()}\u0000${end.toISOString()}\u0000durableObjectsByObjectId`
    ),
    read_proven: true,
    reason: complete ? null : "provider_object_id_join_incomplete",
    runs
  };
}

async function collectObservabilityMetrics(token, start, end, application) {
  const rows = [];
  let lastHttpStatus = 0;
  let lastResponseHash = hash("no_response");
  for (let attempt = 0; attempt < 8; attempt += 1) {
    rows.length = 0;
    let denied = false;
    for (const run of application.runs) {
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/observability/telemetry/query`,
        {
          body: JSON.stringify({
            dry: true,
            limit: 2000,
            parameters: {
              datasets: ["cloudflare-workers"],
              needle: { isRegex: false, matchCase: true, value: run.run_hash }
            },
            queryId: `row10-${run.run_hash.slice(-16)}`,
            timeframe: { from: start.getTime(), to: end.getTime() },
            view: "invocations"
          }),
          headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          method: "POST"
        }
      );
      const body = await response.json().catch(() => null);
      lastHttpStatus = response.status;
      lastResponseHash = hash(JSON.stringify(body));
      if (!response.ok || body?.success !== true) {
        denied = true;
        break;
      }
      const invocationMap = body?.result?.invocations;
      const events =
        invocationMap !== null && typeof invocationMap === "object"
          ? Object.values(invocationMap).flatMap((value) =>
              Array.isArray(value) ? value : []
            )
          : [];
      const invocationEvents = events.filter(
        (event) =>
          typeof event?.$workers?.cpuTimeMs === "number" &&
          (event.$workers.scriptName === "aiphabee-worker-staging" ||
            event.$workers.scriptName === "aiphabee-sandbox-bridge-staging")
      );
      rows.push({
        log_events_written: events.length,
        run_hash: run.run_hash,
        worker_cpu_ms: invocationEvents.reduce(
          (sum, event) => sum + number(event.$workers.cpuTimeMs),
          0
        ),
        worker_requests: new Set(
          invocationEvents.map((event) => event.$workers.requestId)
        ).size
      });
    }
    if (denied) break;
    if (
      rows.length === application.runs.length &&
      rows.every((row) => row.log_events_written > 0 && row.worker_requests > 0)
    ) {
      break;
    }
    await delay(15_000);
  }
  const complete =
    rows.length === application.runs.length &&
    rows.every((row) => row.log_events_written > 0 && row.worker_requests > 0);
  return {
    logs: {
      complete,
      http_status: lastHttpStatus,
      read_proven: lastHttpStatus >= 200 && lastHttpStatus < 300,
      reason: complete ? null : "per_run_observability_logs_unavailable",
      response_hash: lastResponseHash,
      runs: rows.map(({ log_events_written, run_hash }) => ({ log_events_written, run_hash }))
    },
    worker_metrics: {
      complete,
      read_proven: lastHttpStatus >= 200 && lastHttpStatus < 300,
      reason: complete ? null : "per_run_observability_invocations_unavailable",
      runs: rows.map(({ run_hash, worker_cpu_ms, worker_requests }) => ({
        run_hash,
        worker_cpu_ms,
        worker_requests
      }))
    }
  };
}

async function billingRead(token) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/paygo-usage`,
    { headers: { authorization: `Bearer ${token}` } }
  );
  const body = await response.json().catch(() => null);
  const readProven = response.ok && body?.success === true && Array.isArray(body?.result);
  const records = readProven ? body.result : [];
  return {
    account_period_contracted_cost_usd: readProven
      ? records.reduce((sum, record) => sum + number(record?.ContractedCost), 0)
      : null,
    actual_bill: readProven,
    endpoint_version: "paygo_usage_v1_alpha",
    http_status: response.status,
    read_proven: readProven,
    response_hash: hash(JSON.stringify(body)),
    usage_record_count: records.length
  };
}

async function graphql(token, query, variables) {
  const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    body: JSON.stringify({ query, variables }),
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    method: "POST"
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body || (Array.isArray(body.errors) && body.errors.length > 0)) {
    throw new Error(`CLOUDFLARE_GRAPHQL_FAILED:${response.status}:${hash(JSON.stringify(body))}`);
  }
  return body;
}

async function operatorRequest(baseUrl, token, path, acceptanceId, extra = {}) {
  const phase = path.split("/").at(-1)?.replace(/[^a-z0-9-]/gu, "-") ?? "unknown";
  const index = Number.isSafeInteger(extra.index) ? `-${extra.index}` : "";
  const jobId = `${acceptanceId}-${phase}${index}`;
  const jobUrl = `${baseUrl}/jobs/${jobId}`;
  let accepted = false;
  let lastStatus = 0;
  let lastBodyStatus = "no_response";
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await fetch(jobUrl, {
      body: JSON.stringify({ acceptance_id: acceptanceId, path, ...extra }),
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      method: "POST",
      signal: AbortSignal.timeout(30_000)
    }).catch(() => null);
    const body = await response?.json().catch(() => null);
    lastStatus = response?.status ?? 0;
    lastBodyStatus =
      typeof body?.status === "string" && /^[a-z0-9_-]{1,80}$/u.test(body.status)
        ? body.status
        : "invalid_response";
    if (
      (response?.status === 202 && body?.status === "accepted") ||
      (response?.status === 409 && body?.status === "job_exists")
    ) {
      accepted = true;
      break;
    }
    await delay(1_000);
  }
  if (!accepted) {
    throw new Error(
      `ROW10_OPERATOR_JOB_REJECTED_${lastStatus}_${lastBodyStatus.toUpperCase()}`
    );
  }
  const deadline = Date.now() + 25 * 60_000;
  let consecutivePollFailures = 0;
  try {
    while (Date.now() < deadline) {
      await delay(1_000);
      const poll = await fetch(jobUrl, {
        headers: { authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(30_000)
      }).catch(() => null);
      if (poll === null || poll.status >= 500) {
        consecutivePollFailures += 1;
        if (consecutivePollFailures < 5) continue;
        throw new Error(`ROW10_OPERATOR_JOB_POLL_TRANSIENT_FAILURE_${poll?.status ?? 0}`);
      }
      consecutivePollFailures = 0;
      const state = await poll.json().catch(() => null);
      if (!poll.ok || state === null) {
        throw new Error(`ROW10_OPERATOR_JOB_POLL_FAILED_${poll.status}`);
      }
      if (state.status === "pending" || state.status === "running") continue;
      const body = state.body;
      if (state.status === "complete" && body !== null && typeof body === "object") {
        return body;
      }
      const failurePhase =
        typeof body?.failure_phase === "string" && /^[a-z_]{1,80}$/u.test(body.failure_phase)
          ? body.failure_phase
          : "unclassified";
      const sqlstate =
        typeof body?.sqlstate === "string" && /^[0-9A-Z]{5}$/u.test(body.sqlstate)
          ? body.sqlstate
          : "none";
      throw new Error(
        typeof body?.failure_code === "string"
          ? `${body.failure_code}:${failurePhase}:${sqlstate}`
          : `ROW10_OPERATOR_JOB_FAILED:${hash(JSON.stringify(state))}`
      );
    }
    throw new Error("ROW10_OPERATOR_JOB_TIMEOUT");
  } finally {
    await fetch(jobUrl, {
      headers: { authorization: `Bearer ${token}` },
      method: "DELETE"
    }).catch(() => undefined);
  }
}

function maxConcurrentSandboxes(runs) {
  const events = runs.flatMap((run) => [
    { delta: 1, time: Date.parse(run.sandbox_active_from) },
    { delta: -1, time: Date.parse(run.sandbox_active_until) }
  ]);
  if (events.some((event) => !Number.isFinite(event.time))) return 0;
  events.sort((left, right) => left.time - right.time || right.delta - left.delta);
  let active = 0;
  let maximum = 0;
  for (const event of events) {
    active += event.delta;
    maximum = Math.max(maximum, active);
  }
  return maximum;
}

async function wranglerSecret(action, value) {
  const args = [
    resolve(root, "node_modules/wrangler/bin/wrangler.js"),
    "secret",
    action,
    "FASTCLAW_ROW10_ACCEPTANCE_TOKEN",
    "--env",
    "staging",
    "--config",
    workerConfig
  ];
  await new Promise((resolvePromise, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: accountId },
      stdio: ["pipe", "pipe", "pipe"]
    });
    let output = "";
    child.stdout.on("data", (chunk) => (output += String(chunk)));
    child.stderr.on("data", (chunk) => (output += String(chunk)));
    child.once("exit", (code) =>
      code === 0
        ? resolvePromise()
        : reject(new Error(`wrangler secret ${action} failed:${hash(output)}`))
    );
    child.stdin.end(action === "put" ? value : "y\n");
  });
}

async function wranglerDeploy() {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(
      process.execPath,
      [
        resolve(root, "node_modules/wrangler/bin/wrangler.js"),
        "deploy",
        "--env",
        "staging",
        "--keep-vars",
        "--config",
        workerConfig
      ],
      {
        cwd: root,
        env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: accountId },
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
    let output = "";
    child.stdout.on("data", (chunk) => (output += String(chunk)));
    child.stderr.on("data", (chunk) => (output += String(chunk)));
    child.once("exit", (code) =>
      code === 0
        ? resolvePromise()
        : reject(new Error(`wrangler deploy failed:${hash(output)}`))
    );
  });
}

async function deployOperator(token) {
  await runWranglerMutation(["deploy", "--config", operatorConfig], "operator deploy");
  await new Promise((resolvePromise, reject) => {
    const child = spawn(
      process.execPath,
      [
        resolve(root, "node_modules/wrangler/bin/wrangler.js"),
        "secret",
        "put",
        "ROW10_OPERATOR_TOKEN",
        "--config",
        operatorConfig
      ],
      {
        cwd: root,
        env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: accountId },
        stdio: ["pipe", "pipe", "pipe"]
      }
    );
    let output = "";
    child.stdout.on("data", (chunk) => (output += String(chunk)));
    child.stderr.on("data", (chunk) => (output += String(chunk)));
    child.once("exit", (code) =>
      code === 0
        ? resolvePromise()
        : reject(new Error(`operator secret failed:${hash(output)}`))
    );
    child.stdin.end(token);
  });
  // Secret writes create a new Worker version. Publish the config once more
  // so every operator isolate and Durable Object stub resolves the same
  // token-bearing version before the authenticated job fan-out begins.
  await runWranglerMutation(
    ["deploy", "--config", operatorConfig],
    "operator post-secret deploy"
  );
}

async function deleteOperator() {
  await runWranglerMutation(
    ["delete", operatorWorkerName, "--force", "--config", operatorConfig],
    "operator delete"
  );
}

async function runWranglerMutation(args, label) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(
      process.execPath,
      [resolve(root, "node_modules/wrangler/bin/wrangler.js"), ...args],
      {
        cwd: root,
        env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: accountId },
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
    let output = "";
    child.stdout.on("data", (chunk) => (output += String(chunk)));
    child.stderr.on("data", (chunk) => (output += String(chunk)));
    child.once("exit", (code) =>
      code === 0
        ? resolvePromise()
        : reject(new Error(`${label} failed:${hash(output)}`))
    );
  });
}

async function wranglerOauthToken() {
  await runWranglerRead(["whoami"], "wrangler oauth refresh");
  const config = await readFile(
    `${process.env.HOME}/Library/Preferences/.wrangler/config/default.toml`,
    "utf8"
  );
  const token = config.match(/^oauth_token\s*=\s*"([^"]+)"/mu)?.[1];
  if (!token) throw new Error("CLOUDFLARE_OAUTH_TOKEN_MISSING");
  return token;
}

async function cloudflareProviderToken() {
  const dedicated = process.env.FASTCLAW_ROW10_PROVIDER_API_TOKEN;
  if (dedicated !== undefined) {
    if (dedicated.length < 20 || /\s/u.test(dedicated)) {
      throw new Error("FASTCLAW_ROW10_PROVIDER_API_TOKEN_INVALID");
    }
    return dedicated;
  }
  return wranglerOauthToken();
}

async function runWranglerRead(args, label) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(
      process.execPath,
      [resolve(root, "node_modules/wrangler/bin/wrangler.js"), ...args],
      {
        cwd: root,
        env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: accountId },
        stdio: ["ignore", "pipe", "pipe"]
      }
    );
    let output = "";
    child.stdout.on("data", (chunk) => (output += String(chunk)));
    child.stderr.on("data", (chunk) => (output += String(chunk)));
    child.once("exit", (code) =>
      code === 0
        ? resolvePromise()
        : reject(new Error(`${label} failed:${hash(output)}`))
    );
  });
}

async function waitForReady(baseUrl, child) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    if (child !== undefined && child.exitCode !== null) {
      throw new Error("ROW10_REMOTE_DEV_EXITED");
    }
    try {
      const response = await fetch(`${baseUrl}/health`);
      const body = await response.json();
      if (
        response.ok &&
        body?.service === "row10-live-acceptance-operator" &&
        body?.status === "ready"
      ) {
        return;
      }
    } catch {}
    await delay(500);
  }
  throw new Error("ROW10_REMOTE_DEV_NOT_READY");
}

async function waitForAuth(baseUrl, token) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await fetch(`${baseUrl}/internal/row10/auth-readback`, {
      headers: { authorization: `Bearer ${token}` },
      method: "POST"
    }).catch(() => null);
    const body = await response?.json().catch(() => null);
    if (
      response?.ok &&
      body?.authorization_matches === true &&
      body?.authorization_present === true &&
      body?.secret_configured === true
    ) {
      return;
    }
    await delay(1_000);
  }
  throw new Error("ROW10_AUTH_READBACK_FAILED");
}

async function waitForOperatorJobs(baseUrl, token) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await fetch(`${baseUrl}/jobs/operator-preflight`, {
      headers: { authorization: `Bearer ${token}` }
    }).catch(() => null);
    const body = await response?.json().catch(() => null);
    if (response?.ok && body?.status === "missing") return;
    await delay(1_000);
  }
  throw new Error("ROW10_OPERATOR_JOB_BINDING_NOT_READY");
}

async function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address !== null ? address.port : 0;
      server.close((error) => (error ? reject(error) : resolvePort(port)));
    });
  });
}

function validatePacket(packet) {
  if (
    packet?.version !== "2026-07-11.fastclaw-live-release-evidence.v0" ||
    packet?.environment !== "staging" ||
    !Array.isArray(packet?.acceptance?.runs) ||
    packet.acceptance.runs.length !== 10 ||
    new Set(packet.acceptance.runs.map((run) => run.workspace_hash)).size !== 10 ||
    new Set(packet.acceptance.runs.map((run) => run.account_hash)).size !== 10 ||
    new Set(packet.acceptance.runs.map((run) => run.sandbox_hash)).size !== 10 ||
    packet.acceptance.cleanup?.status !== "cleanup_confirmed" ||
    packet.acceptance.cleanup?.residual_rows !== 0 ||
    packet.release_gate?.feature_enabled !== false ||
    !Array.isArray(packet.release_gate?.blockers)
  ) {
    fail({ status: "invalid_live_release_packet" });
  }
}

function number(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}

async function writePacket(path, packet) {
  const content = `${JSON.stringify(packet, null, 2)}\n`;
  await writeFile(path, content, { mode: 0o600 });
  return hash(content);
}

function hash(value) {
  return `sha256:${createHash("sha256").update(String(value)).digest("hex")}`;
}

function delay(milliseconds) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

function emit(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
  process.exit(0);
}

function fail(value) {
  process.stderr.write(`${JSON.stringify(value, null, 2)}\n`);
  process.exit(1);
}
