#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import { validateSprint1LiveDataEvidencePackets } from "./check-sprint1-live-data-evidence-packets.mjs";

const manifestPath = "deploy/governance/sprint1-live-data-evidence-manifest.contract.json";
const packagePath = "package.json";
const readmePath = "deploy/governance/sprint1-live-data-evidence-templates/README.md";
const transitionReviewCheckerPath = "scripts/check-sprint1-live-data-transition-review-contract.mjs";
const transitionReviewFixtureCheckerPath = "scripts/check-sprint1-live-data-transition-review-fixtures.mjs";

const manifest = readJson(manifestPath);
const packageJson = readJson(packagePath);
const readme = readText(readmePath);
const templateDirectory = manifest.template_directory;
const templateDirectoryExists =
  typeof templateDirectory === "string" && existsSync(resolve(process.cwd(), templateDirectory));
const templateFiles = templateDirectoryExists ? listTemplatePacketFiles(templateDirectory) : [];
const errors = validateHandoff({
  manifest,
  packageJson,
  readme,
  templateDirectoryExists,
  templateFiles
});

if (errors.length > 0) {
  emit(
    {
      errors,
      path: manifest.template_directory,
      status: "invalid_sprint1_live_data_evidence_handoff"
    },
    1
  );
}

emit(
  {
    evidence_templates: templateFiles.length,
    status: "ok",
    template_status: "evidence_packets_missing"
  },
  0
);

function validateHandoff({ manifest: value, packageJson, readme, templateDirectoryExists, templateFiles }) {
  const errors = [];

  if (!isRecord(value)) {
    return ["evidence manifest must be an object"];
  }

  if (value.handoff_checker !== "scripts/check-sprint1-live-data-evidence-handoff.mjs") {
    errors.push("manifest.handoff_checker must be scripts/check-sprint1-live-data-evidence-handoff.mjs");
  }

  if (value.transition_review_checker !== transitionReviewCheckerPath) {
    errors.push(`manifest.transition_review_checker must be ${transitionReviewCheckerPath}`);
  }

  if (value.transition_review_fixture_checker !== transitionReviewFixtureCheckerPath) {
    errors.push(`manifest.transition_review_fixture_checker must be ${transitionReviewFixtureCheckerPath}`);
  }

  if (value.template_directory !== "deploy/governance/sprint1-live-data-evidence-templates") {
    errors.push("manifest.template_directory must be deploy/governance/sprint1-live-data-evidence-templates");
  }

  if (value.template_file_pattern !== "<gate_id>.evidence.json") {
    errors.push("manifest.template_file_pattern must be <gate_id>.evidence.json");
  }

  if (!value.evidence_policy?.operator_handoff_templates_validate_as_missing_packets) {
    errors.push("evidence policy must require handoff templates to validate as missing packets");
  }

  if (!value.evidence_policy?.operator_handoff_readme_lists_gate_order) {
    errors.push("evidence policy must require handoff README to list gate order");
  }

  if (!value.evidence_policy?.accepted_evidence_packet_alone_never_completes_live_data) {
    errors.push("evidence policy must require accepted packets alone to never complete live data");
  }

  if (!value.evidence_policy?.transition_review_cross_checks_activation_gates) {
    errors.push("evidence policy must require transition review to cross-check activation gates");
  }

  const scripts = packageJson?.scripts ?? {};
  if (
    scripts["check:sprint1-live-data-evidence-handoff"] !==
    "node scripts/check-sprint1-live-data-evidence-handoff.mjs"
  ) {
    errors.push("package.json check:sprint1-live-data-evidence-handoff script is missing");
  }
  if (!String(scripts.check ?? "").includes("npm run check:sprint1-live-data-evidence-handoff")) {
    errors.push("root check must include check:sprint1-live-data-evidence-handoff");
  }
  if (
    scripts["check:sprint1-live-data-transition-review"] !==
    "node scripts/check-sprint1-live-data-transition-review-contract.mjs"
  ) {
    errors.push("package.json check:sprint1-live-data-transition-review script is missing");
  }
  if (
    scripts["check:sprint1-live-data-transition-review-fixtures"] !==
    "node scripts/check-sprint1-live-data-transition-review-fixtures.mjs"
  ) {
    errors.push("package.json check:sprint1-live-data-transition-review-fixtures script is missing");
  }
  if (!String(scripts.check ?? "").includes("npm run check:sprint1-live-data-transition-review")) {
    errors.push("root check must include check:sprint1-live-data-transition-review");
  }
  if (!String(scripts.check ?? "").includes("npm run check:sprint1-live-data-transition-review-fixtures")) {
    errors.push("root check must include check:sprint1-live-data-transition-review-fixtures");
  }

  if (!templateDirectoryExists) {
    errors.push(`template directory missing ${value.template_directory}`);
    return errors;
  }

  const requiredGates = value.required_gates ?? [];
  const requiredGateIds = requiredGates.map((entry) => entry.id);
  const missingTemplates = requiredGateIds.filter(
    (id) => !templateFiles.some((file) => basename(file.path) === `${id}.evidence.json`)
  );
  const unexpectedTemplates = templateFiles.filter(
    (file) => !requiredGateIds.includes(basename(file.path).replace(/\.evidence\.json$/u, ""))
  );

  for (const id of missingTemplates) {
    errors.push(`template missing ${id}.evidence.json`);
  }
  for (const file of unexpectedTemplates) {
    errors.push(`unexpected template ${file.relative}`);
  }

  const validation = validateSprint1LiveDataEvidencePackets({
    manifest: value,
    packageJson,
    packetDirectoryExists: true,
    packetFiles: templateFiles
  });

  errors.push(...validation.errors.map((error) => `template packet invalid: ${error}`));

  if (validation.status !== "evidence_packets_missing") {
    errors.push(`template packet status must be evidence_packets_missing, got ${validation.status}`);
  }

  for (const file of templateFiles) {
    const packet = file.packet;

    if (!isRecord(packet)) {
      continue;
    }

    if (packet.status !== "missing") {
      errors.push(`${file.relative}: template status must be missing`);
    }
    if (!Array.isArray(packet.evidence_refs) || packet.evidence_refs.length !== 0) {
      errors.push(`${file.relative}: template evidence_refs must be empty`);
    }
    if (packet.evidence_sha256 !== null) {
      errors.push(`${file.relative}: template evidence_sha256 must be null`);
    }
    if (packet.signed_at !== null) {
      errors.push(`${file.relative}: template signed_at must be null`);
    }
    if (packet.approver_role !== null) {
      errors.push(`${file.relative}: template approver_role must be null`);
    }
    if (packet.redaction_status !== "missing") {
      errors.push(`${file.relative}: template redaction_status must be missing`);
    }
  }

  for (const gate of requiredGates) {
    if (!readme.includes(gate.id)) {
      errors.push(`handoff README must mention ${gate.id}`);
    }
    for (const evidenceName of gate.required_evidence ?? []) {
      if (!readme.includes(evidenceName)) {
        errors.push(`handoff README must mention ${evidenceName}`);
      }
    }
  }

  for (const text of [
    "npm run check:sprint1-live-data-evidence-handoff",
    "npm run check:sprint1-live-data-evidence-packets",
    "npm run check:sprint1-live-data-evidence-manifest",
    "npm run check:sprint1-live-data-transition-review",
    "deploy/governance/sprint1-live-data-evidence-packets",
    "sha256:"
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
    .filter((entry) => entry.isFile() && entry.name.endsWith(".evidence.json"))
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
