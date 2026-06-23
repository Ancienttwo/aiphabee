#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { validateCapturePackets } from "./check-live-smoke-capture-packets.mjs";

const contractPath = "deploy/governance/live-smoke-capture-artifacts.contract.json";
const ledgerPath = "deploy/governance/live-smoke-evidence-ledger.contract.json";
const packagePath = "package.json";
const runnerPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/u;
const sha256Pattern = /^sha256:[a-f0-9]{64}$/u;
const allowedStatuses = new Set(["passed", "permission_denied", "failed"]);
const secretLikePatterns = [
  /(^|[^A-Za-z])sk-[A-Za-z0-9_-]{20,}/u,
  /postgres(?:ql)?:\/\/[^"\\\s]+/iu,
  /Bearer\s+[A-Za-z0-9._-]{20,}/u,
  /gh[pousr]_[A-Za-z0-9_]{20,}/u,
  /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/u
];

export function createLiveSmokeCapturePacket({
  args,
  contract,
  ledger,
  now = () => new Date()
}) {
  const options = parseArgs(args);
  const capture = (contract.required_captures ?? []).find((entry) => entry.id === options.captureId);
  const ledgerCommand = (ledger.live_smoke_commands ?? []).find((entry) => entry.id === options.captureId);

  if (!capture || !ledgerCommand) {
    throw new Error(`unknown capture_id ${options.captureId}`);
  }
  if (capture.command !== ledgerCommand.command || capture.script !== ledgerCommand.script) {
    throw new Error(`capture ${options.captureId} command/script does not match ledger`);
  }
  if (!allowedStatuses.has(options.status)) {
    throw new Error("--status must be passed, permission_denied, or failed");
  }
  if (!runnerPattern.test(options.runner)) {
    throw new Error("--runner must be a redacted label matching [A-Za-z0-9][A-Za-z0-9._:-]{0,79}");
  }
  if (options.sourceLocator.trim().length === 0) {
    throw new Error("--source-locator must be a non-empty redacted locator");
  }
  if (options.status === "passed" && options.exitCode !== 0) {
    throw new Error("passed capture requires --exit-code 0");
  }
  if (options.captureId === "provider_secret_store_rotation" && options.status === "passed" && !options.cleanupVerified) {
    throw new Error("provider_secret_store_rotation passed capture requires --cleanup-verified");
  }
  if (options.captureId !== "provider_secret_store_rotation" && options.cleanupVerified) {
    throw new Error("non-destructive captures must not set --cleanup-verified");
  }

  const redactedOutput = readFileSync(resolve(process.cwd(), options.redactedOutput), "utf8");
  assertRedactedOutputSafe(redactedOutput, contract);
  const outputHash = hash(redactedOutput);
  const evidenceRefs = options.evidenceRefs.length > 0 ? options.evidenceRefs : [outputHash];

  for (const ref of evidenceRefs) {
    if (!sha256Pattern.test(ref)) {
      throw new Error(`invalid --evidence-ref ${ref}; expected sha256:<64 lowercase hex chars>`);
    }
  }

  return {
    capture_id: options.captureId,
    command: capture.command,
    script: capture.script,
    observed_at: options.observedAt ?? now().toISOString(),
    runner: options.runner,
    exit_code: options.exitCode,
    status: options.status,
    output_sha256: outputHash,
    redaction_status: "redacted_no_secrets",
    source_locator: options.sourceLocator,
    evidence_refs: evidenceRefs,
    cleanup_verified: options.cleanupVerified
  };
}

function parseArgs(args) {
  const values = {
    cleanupVerified: false,
    evidenceRefs: [],
    exitCode: undefined,
    observedAt: undefined,
    output: undefined,
    status: "passed"
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const next = () => {
      index += 1;
      if (index >= args.length) {
        throw new Error(`${arg} requires a value`);
      }
      return args[index];
    };

    if (arg === "--capture-id") {
      values.captureId = next();
    } else if (arg === "--redacted-output") {
      values.redactedOutput = next();
    } else if (arg === "--runner") {
      values.runner = next();
    } else if (arg === "--source-locator") {
      values.sourceLocator = next();
    } else if (arg === "--exit-code") {
      values.exitCode = Number(next());
    } else if (arg === "--status") {
      values.status = next();
    } else if (arg === "--observed-at") {
      values.observedAt = next();
    } else if (arg === "--evidence-ref") {
      values.evidenceRefs.push(next());
    } else if (arg === "--output") {
      values.output = next();
    } else if (arg === "--cleanup-verified") {
      values.cleanupVerified = true;
    } else {
      throw new Error(`unknown argument ${arg}`);
    }
  }

  for (const required of ["captureId", "redactedOutput", "runner", "sourceLocator"]) {
    if (!values[required]) {
      throw new Error(`missing --${required.replace(/[A-Z]/gu, (char) => `-${char.toLowerCase()}`)}`);
    }
  }
  if (!Number.isInteger(values.exitCode)) {
    throw new Error("--exit-code must be an integer");
  }
  if (values.observedAt && !Number.isFinite(Date.parse(values.observedAt))) {
    throw new Error("--observed-at must be an ISO-8601 timestamp");
  }
  if (!existsSync(resolve(process.cwd(), values.redactedOutput))) {
    throw new Error(`--redacted-output file does not exist: ${values.redactedOutput}`);
  }

  return values;
}

function assertRedactedOutputSafe(text, contract) {
  for (const pattern of secretLikePatterns) {
    if (pattern.test(text)) {
      throw new Error(`redacted output contains forbidden secret-like pattern ${pattern.source}`);
    }
  }

  for (const field of contract.forbidden_fields ?? []) {
    const pattern = new RegExp(`["']?${escapeRegExp(field)}["']?\\s*:`, "iu");
    if (pattern.test(text)) {
      throw new Error(`redacted output contains forbidden field ${field}`);
    }
  }
}

function hash(text) {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}

function validateGeneratedPacket({ contract, ledger, packageJson, outputPath, packet }) {
  const artifactDirectory = contract.artifact_directory;
  const artifactDirectoryExists = existsSync(resolve(process.cwd(), artifactDirectory));
  const packetFiles = artifactDirectoryExists
    ? readdirSync(resolve(process.cwd(), artifactDirectory), { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
        .map((entry) => {
          const path = join(resolve(process.cwd(), artifactDirectory), entry.name);
          return {
            packet: readJson(path),
            path,
            relative: join(artifactDirectory, entry.name)
          };
        })
    : [];
  const relative = outputPath.startsWith(artifactDirectory)
    ? outputPath
    : join(artifactDirectory, basename(outputPath));
  const mergedPacketFiles = [
    ...packetFiles.filter((file) => basename(file.path) !== basename(outputPath)),
    {
      packet,
      path: resolve(process.cwd(), outputPath),
      relative
    }
  ];
  const validation = validateCapturePackets({
    artifactDirectoryExists: true,
    contract,
    ledger,
    packageJson,
    packetFiles: mergedPacketFiles
  });

  if (validation.errors.length > 0) {
    throw new Error(validation.errors.join("; "));
  }

  return validation;
}

function runCli() {
  try {
    const contract = readJson(contractPath);
    const ledger = readJson(ledgerPath);
    const packageJson = readJson(packagePath);
    const packet = createLiveSmokeCapturePacket({
      args: process.argv.slice(2),
      contract,
      ledger
    });
    const outputPath = parseArgs(process.argv.slice(2)).output ?? join(contract.artifact_directory, `${packet.capture_id}.capture.json`);
    const validation = validateGeneratedPacket({ contract, ledger, outputPath, packageJson, packet });

    mkdirSync(resolve(process.cwd(), contract.artifact_directory), { recursive: true });
    writeFileSync(resolve(process.cwd(), outputPath), `${JSON.stringify(packet, null, 2)}\n`);
    console.log(
      JSON.stringify(
        {
          capture_id: packet.capture_id,
          output: outputPath,
          output_sha256: packet.output_sha256,
          packet_status: packet.status,
          validation_status: validation.status,
          status: "ok"
        },
        null,
        2
      )
    );
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          error: error instanceof Error ? error.message : String(error),
          status: "invalid_live_smoke_capture_packet_input"
        },
        null,
        2
      )
    );
    process.exit(1);
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
