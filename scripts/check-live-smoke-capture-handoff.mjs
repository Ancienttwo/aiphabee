#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { validateCapturePackets } from "./check-live-smoke-capture-packets.mjs";

const contractPath = "deploy/governance/live-smoke-capture-artifacts.contract.json";
const ledgerPath = "deploy/governance/live-smoke-evidence-ledger.contract.json";
const packagePath = "package.json";
const readmePath = "deploy/governance/live-smoke-capture-templates/README.md";

const contract = readJson(contractPath);
const ledger = readJson(ledgerPath);
const packageJson = readJson(packagePath);
const readme = readText(readmePath);
const templateDirectory = contract.template_directory;
const templateDirectoryExists =
  typeof templateDirectory === "string" && existsSync(resolve(process.cwd(), templateDirectory));
const templateFiles = templateDirectoryExists ? listTemplatePacketFiles(templateDirectory) : [];
const errors = validateHandoff({
  contract,
  ledger,
  packageJson,
  readme,
  templateDirectoryExists,
  templateFiles
});

if (errors.length > 0) {
  emit(
    {
      errors,
      path: contract.template_directory,
      status: "invalid_live_smoke_capture_handoff"
    },
    1
  );
}

emit(
  {
    capture_templates: templateFiles.length,
    status: "ok",
    template_status: "capture_packets_missing_env"
  },
  0
);

function validateHandoff({
  contract: value,
  ledger,
  packageJson,
  readme,
  templateDirectoryExists,
  templateFiles
}) {
  const errors = [];

  if (!isRecord(value)) {
    return ["capture artifact contract must be an object"];
  }

  if (value.handoff_checker !== "scripts/check-live-smoke-capture-handoff.mjs") {
    errors.push("contract.handoff_checker must be scripts/check-live-smoke-capture-handoff.mjs");
  }

  if (value.template_directory !== "deploy/governance/live-smoke-capture-templates") {
    errors.push("contract.template_directory must be deploy/governance/live-smoke-capture-templates");
  }

  if (value.template_file_pattern !== "<capture_id>.capture.json") {
    errors.push("contract.template_file_pattern must be <capture_id>.capture.json");
  }

  if (!value.artifact_policy?.operator_handoff_templates_validate_as_missing_env_packets) {
    errors.push("artifact policy must require handoff templates to validate as missing-env packets");
  }

  if (!value.artifact_policy?.operator_handoff_readme_lists_external_env_and_order) {
    errors.push("artifact policy must require handoff README to list env and command order");
  }
  if (!value.artifact_policy?.operator_handoff_readme_lists_run_plan_gate) {
    errors.push("artifact policy must require handoff README to list the operator run-plan gate");
  }

  const scripts = packageJson?.scripts ?? {};
  if (scripts["check:live-smoke-capture-handoff"] !== "node scripts/check-live-smoke-capture-handoff.mjs") {
    errors.push("package.json check:live-smoke-capture-handoff script is missing");
  }
  if (!String(scripts.check ?? "").includes("npm run check:live-smoke-capture-handoff")) {
    errors.push("root check must include check:live-smoke-capture-handoff");
  }

  if (!templateDirectoryExists) {
    errors.push(`template directory missing ${value.template_directory}`);
    return errors;
  }

  const requiredCaptures = value.required_captures ?? [];
  const requiredCaptureIds = requiredCaptures.map((entry) => entry.id);
  const missingTemplates = requiredCaptureIds.filter(
    (id) => !templateFiles.some((file) => basename(file.path) === `${id}.capture.json`)
  );
  const unexpectedTemplates = templateFiles.filter(
    (file) => !requiredCaptureIds.includes(basename(file.path).replace(/\.capture\.json$/u, ""))
  );

  for (const id of missingTemplates) {
    errors.push(`template missing ${id}.capture.json`);
  }
  for (const file of unexpectedTemplates) {
    errors.push(`unexpected template ${file.relative}`);
  }

  const validation = validateCapturePackets({
    artifactDirectoryExists: true,
    contract: value,
    ledger,
    packageJson,
    packetFiles: templateFiles
  });

  errors.push(...validation.errors.map((error) => `template packet invalid: ${error}`));

  if (validation.status !== "capture_packets_missing_env") {
    errors.push(`template packet status must be capture_packets_missing_env, got ${validation.status}`);
  }

  for (const file of templateFiles) {
    const packet = file.packet;

    if (!isRecord(packet)) {
      continue;
    }

    if (packet.status !== "missing_env") {
      errors.push(`${file.relative}: template status must be missing_env`);
    }
    if (packet.output_sha256 !== null) {
      errors.push(`${file.relative}: template output_sha256 must be null`);
    }
    if (!Array.isArray(packet.evidence_refs) || packet.evidence_refs.length !== 0) {
      errors.push(`${file.relative}: template evidence_refs must be empty`);
    }
    if (packet.cleanup_verified !== false) {
      errors.push(`${file.relative}: template cleanup_verified must be false before live execution`);
    }
  }

  for (const envName of ledger.non_inferable_env ?? []) {
    if (!readme.includes(envName)) {
      errors.push(`handoff README must mention ${envName}`);
    }
  }

  for (const capture of requiredCaptures) {
    if (!readme.includes(capture.command)) {
      errors.push(`handoff README must mention ${capture.command}`);
    }
  }

  for (const text of [
    "npm run check:live-smoke-external-env-preflight",
    "npm run check:live-smoke-operator-run-plan",
    "npm run check:live-smoke-capture-handoff",
    "npm run check:live-smoke-capture-packets",
    "deploy/governance/live-smoke-capture-packets"
  ]) {
    if (!readme.includes(text)) {
      errors.push(`handoff README must mention ${text}`);
    }
  }

  return errors;
}

function listTemplatePacketFiles(directory) {
  const absoluteDirectory = resolve(process.cwd(), directory);

  return readdirSync(absoluteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".capture.json"))
    .map((entry) => {
      const path = join(absoluteDirectory, entry.name);
      return {
        packet: readJson(path),
        path,
        relative: join(directory, entry.name)
      };
    })
    .sort((a, b) => a.relative.localeCompare(b.relative));
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function readText(path) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function emit(value, code) {
  const output = code === 0 ? console.log : console.error;

  output(JSON.stringify(value, null, 2));
  process.exit(code);
}
