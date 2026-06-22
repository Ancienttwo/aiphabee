#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { validatePhase3SecurityLoadDrReleaseEvidencePackets } from "./check-phase3-security-load-dr-release-evidence-packets.mjs";

const manifestPath = "deploy/governance/phase3-security-load-dr-release-evidence-manifest.contract.json";
const packagePath = "package.json";
const requiredGateIds = [
  "compliance_legal_security_signoff",
  "live_kill_switch_incident_audit_evidence",
  "live_performance_availability_slo_evidence",
  "live_load_test_artifact",
  "live_dr_restore_failover_rollback_evidence",
  "live_incident_status_comms_drill_evidence",
  "ops_sre_product_release_signoff"
];

const manifest = readJson(manifestPath);
const packageJson = readJson(packagePath);
const errors = [];

if (!existsSync(resolve(process.cwd(), manifest.template_directory ?? ""))) {
  errors.push(`template directory missing: ${manifest.template_directory}`);
}
if (!existsSync(resolve(process.cwd(), manifest.packet_directory ?? ""))) {
  errors.push(`packet directory missing: ${manifest.packet_directory}`);
}

const readme = readText(`${manifest.template_directory}/README.md`);
for (const gateId of requiredGateIds) {
  if (!readme.includes(gateId)) {
    errors.push(`template README missing gate ${gateId}`);
  }
}

const templateFiles = existsSync(resolve(process.cwd(), manifest.template_directory ?? ""))
  ? readdirSync(resolve(process.cwd(), manifest.template_directory)).filter((name) => name.endsWith(".evidence.json")).sort()
  : [];

if (templateFiles.length !== requiredGateIds.length) {
  errors.push(`expected ${requiredGateIds.length} evidence templates but found ${templateFiles.length}`);
}

const packetResult = validatePhase3SecurityLoadDrReleaseEvidencePackets({
  manifest,
  packageJson,
  packetDirectoryExists: true,
  packetFiles: templateFiles.map((name) => ({
    path: resolve(process.cwd(), manifest.template_directory, name),
    relative: `${manifest.template_directory}/${name}`,
    packet: readJson(`${manifest.template_directory}/${name}`)
  }))
});

if (packetResult.errors.length > 0) {
  errors.push(...packetResult.errors);
}
if (packetResult.status !== "phase3_security_load_dr_release_evidence_incomplete") {
  errors.push(`templates must validate as missing evidence packets, received ${packetResult.status}`);
}

if (errors.length > 0) {
  emit({ errors, status: "invalid_phase3_security_load_dr_release_evidence_handoff" }, 1);
}

emit(
  {
    evidence_templates: templateFiles.length,
    status: "ok",
    template_status: "evidence_packets_missing",
    version: manifest.version
  },
  0
);

function readJson(path) {
  try {
    return JSON.parse(readText(path));
  } catch (error) {
    emit({ error: error instanceof Error ? error.message : String(error), path, status: "invalid_json" }, 1);
  }
}

function readText(path) {
  try {
    return readFileSync(resolve(process.cwd(), path), "utf8");
  } catch (error) {
    emit({ error: error instanceof Error ? error.message : String(error), path, status: "missing_text" }, 1);
  }
}

function emit(payload, exitCode) {
  const output = exitCode === 0 ? console.log : console.error;

  output(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
