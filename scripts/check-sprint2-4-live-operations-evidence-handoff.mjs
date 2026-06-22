#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { validateSprint24LiveOperationsEvidencePackets } from "./check-sprint2-4-live-operations-evidence-packets.mjs";

const contractPath = "deploy/governance/sprint2-4-live-operations-evidence-manifest.contract.json";
const packagePath = "package.json";
const templateReadmePath = "deploy/governance/sprint2-4-live-operations-evidence-templates/README.md";
const packetReadmePath = "deploy/governance/sprint2-4-live-operations-evidence-packets/README.md";

const manifest = readJson(contractPath);
const packageJson = readJson(packagePath);
const templateReadme = readText(templateReadmePath);
const packetReadme = readText(packetReadmePath);
const templateDirectoryExists = existsSync(resolve(process.cwd(), manifest.template_directory));
const templateFiles = templateDirectoryExists ? listTemplatePacketFiles(manifest.template_directory) : [];
const errors = [
  ...validateReadmes(manifest, templateReadme, packetReadme),
  ...validateTemplates(manifest, packageJson, templateDirectoryExists, templateFiles)
];

if (errors.length > 0) {
  emit({ errors, path: contractPath, status: "invalid_handoff" }, 1);
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

function validateReadmes(manifest, templateReadme, packetReadme) {
  const errors = [];

  for (const gateId of manifest.required_gate_ids ?? []) {
    if (!templateReadme.includes(gateId)) {
      errors.push(`template README must mention ${gateId}`);
    }
  }
  for (const forbidden of [
    "raw billing payloads",
    "workflow payloads",
    "notification payloads",
    "credential material",
    "database URLs",
    "invoice IDs",
    "tokens",
    "secrets"
  ]) {
    if (!packetReadme.includes(forbidden) && !templateReadme.includes(forbidden)) {
      errors.push(`handoff docs must warn against ${forbidden}`);
    }
  }

  return errors;
}

function validateTemplates(manifest, packageJson, templateDirectoryExists, templateFiles) {
  const errors = [];

  if (!templateDirectoryExists) {
    errors.push(`template directory missing ${manifest.template_directory}`);
    return errors;
  }

  if (templateFiles.length !== manifest.required_gate_ids.length) {
    errors.push(`template directory expected ${manifest.required_gate_ids.length} templates but found ${templateFiles.length}`);
  }

  const templateResult = validateSprint24LiveOperationsEvidencePackets({
    manifest,
    packageJson,
    packetDirectoryExists: true,
    packetFiles: templateFiles
  });

  if (templateResult.errors.length > 0) {
    errors.push(...templateResult.errors.map((error) => `template invalid: ${error}`));
  }
  if (templateResult.status !== "evidence_packets_incomplete") {
    errors.push(`template packet status expected evidence_packets_incomplete but received ${templateResult.status}`);
  }

  for (const file of templateFiles) {
    const gateId = file.packet?.gate_id;
    if (!manifest.required_gate_ids.includes(gateId)) {
      errors.push(`${file.relative}: unexpected template gate_id ${gateId}`);
      continue;
    }
    if (basename(file.relative) !== `${gateId}.evidence.json`) {
      errors.push(`${file.relative}: template filename must match gate id`);
    }
    if (file.packet.status !== "missing") {
      errors.push(`${file.relative}: template status must be missing`);
    }
  }

  return errors;
}

function listTemplatePacketFiles(directory) {
  const absoluteDirectory = resolve(process.cwd(), directory);

  return readdirSync(absoluteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".evidence.json"))
    .map((entry) => ({
      packet: readJson(join(directory, entry.name)),
      path: join(directory, entry.name),
      relative: join(directory, entry.name)
    }));
}

function readJson(path) {
  return JSON.parse(readText(path));
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
