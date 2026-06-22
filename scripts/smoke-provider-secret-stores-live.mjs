#!/usr/bin/env node
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";
import {
  getLiveSmokeEnvValue,
  getMissingLiveSmokeEnv
} from "./lib/live-smoke-defaults.mjs";

const dryRun = process.argv.includes("--dry-run");
const commandTimeoutMs = parsePositiveInteger(process.env.PROVIDER_SECRET_SMOKE_TIMEOUT_MS, 120_000);
const syntheticPrefix = "AIPHABEE_SECRET_STORE_SMOKE";
const smokeName = normalizeSmokeName(
  process.env.PROVIDER_SECRET_SMOKE_NAME ??
    `${syntheticPrefix}_${new Date().toISOString().slice(0, 10).replaceAll("-", "")}_${randomUUID()
      .replaceAll("-", "")
      .slice(0, 12)
      .toUpperCase()}`
);
const npxBin = process.platform === "win32" ? "npx.cmd" : "npx";
const ghBin = process.platform === "win32" ? "gh.exe" : "gh";
const requiredEnv = {
  cloudflare_workers: ["CLOUDFLARE_WORKER_NAME"],
  github_actions: ["GITHUB_REPOSITORY", "GITHUB_ENVIRONMENT"],
  supabase: ["SUPABASE_PROJECT_REF"]
};
const operations = [
  "set_synthetic_secret",
  "list_secret_metadata",
  "rotate_synthetic_secret",
  "delete_synthetic_secret",
  "confirm_absent"
];

if (dryRun) {
  emit(
    {
      auth_sources: {
        cloudflare_workers: "Wrangler authenticated session or CLOUDFLARE_API_TOKEN",
        github_actions: "gh authenticated session or GITHUB_TOKEN",
        supabase: "Supabase authenticated session or SUPABASE_ACCESS_TOKEN"
      },
      forbidden_output_fields: [
        "authorization",
        "api_key",
        "token",
        "secret_value",
        "raw_value",
        "raw_output",
        "env_file_contents"
      ],
      operations,
      providers: Object.keys(requiredEnv),
      required_env: requiredEnv,
      status: "ready_no_network",
      synthetic_secret_prefix: syntheticPrefix,
      value_policy: "generated_in_memory_not_logged"
    },
    0
  );
}

const missingEnv = Object.entries(requiredEnv).flatMap(([provider, names]) =>
  getMissingLiveSmokeEnv(names).map((name) => ({
    name,
    provider
  }))
);

if (missingEnv.length > 0) {
  emit(
    {
      missing_env: missingEnv,
      status: "missing_env"
    },
    2
  );
}

const providerResults = [];

for (const provider of Object.keys(requiredEnv)) {
  providerResults.push(await smokeProvider(provider, smokeName));
}

const failedResults = providerResults.filter((result) => result.status !== "passed");

emit(
  {
    operation_count: providerResults.reduce((total, result) => total + result.operation_count, 0),
    provider_results: providerResults,
    smoke_secret_name: smokeName,
    smoke_secret_name_hash: hashString(smokeName),
    status: failedResults.length === 0 ? "ok" : "failed",
    synthetic_secret_prefix: syntheticPrefix,
    value_policy: "generated_in_memory_not_logged"
  },
  failedResults.length === 0 ? 0 : 1
);

async function smokeProvider(provider, secretName) {
  const firstValue = createSyntheticValue(provider, "initial");
  const rotatedValue = createSyntheticValue(provider, "rotated");

  try {
    if (provider === "cloudflare_workers") {
      return await smokeCloudflareWorkers(secretName, firstValue, rotatedValue);
    }

    if (provider === "github_actions") {
      return await smokeGitHubActions(secretName, firstValue, rotatedValue);
    }

    if (provider === "supabase") {
      return await smokeSupabase(secretName, firstValue, rotatedValue);
    }

    return failedResult(provider, "unsupported_provider", "provider is not supported", secretName, 0);
  } finally {
    firstValue.fill(0);
    rotatedValue.fill(0);
  }
}

async function smokeCloudflareWorkers(secretName, firstValue, rotatedValue) {
  const workerName = getLiveSmokeEnvValue("CLOUDFLARE_WORKER_NAME");
  let operationCount = 0;

  try {
    await expectCommand(
      "cloudflare_workers",
      "set_synthetic_secret",
      runCommand(npxBin, ["wrangler", "secret", "put", secretName, "--name", workerName], {
        input: `${firstValue.toString("base64")}\n`
      })
    );
    operationCount += 1;

    await expectSecretPresence("cloudflare_workers", secretName, true, () =>
      listCloudflareWorkerSecretNames(workerName)
    );
    operationCount += 1;

    await expectCommand(
      "cloudflare_workers",
      "rotate_synthetic_secret",
      runCommand(npxBin, ["wrangler", "secret", "put", secretName, "--name", workerName], {
        input: `${rotatedValue.toString("base64")}\n`
      })
    );
    operationCount += 1;

    await expectCommand(
      "cloudflare_workers",
      "delete_synthetic_secret",
      runCommand(npxBin, ["wrangler", "secret", "delete", secretName, "--name", workerName], {
        input: "y\n"
      })
    );
    operationCount += 1;

    await expectSecretPresence("cloudflare_workers", secretName, false, () =>
      listCloudflareWorkerSecretNames(workerName)
    );
    operationCount += 1;

    return passedResult("cloudflare_workers", secretName, operationCount);
  } catch (error) {
    await runCommand(npxBin, ["wrangler", "secret", "delete", secretName, "--name", workerName], {
      input: "y\n"
    }).catch(() => undefined);
    return failedResult(
      "cloudflare_workers",
      "cloudflare_secret_smoke_failed",
      error instanceof Error ? error.message : String(error),
      secretName,
      operationCount
    );
  }
}

async function smokeGitHubActions(secretName, firstValue, rotatedValue) {
  const repository = requiredEnvValue("GITHUB_REPOSITORY");
  const environment = requiredEnvValue("GITHUB_ENVIRONMENT");
  let operationCount = 0;

  try {
    await expectCommand(
      "github_actions",
      "set_synthetic_secret",
      runCommand(ghBin, ["secret", "set", secretName, "--repo", repository, "--env", environment], {
        input: firstValue.toString("base64")
      })
    );
    operationCount += 1;

    await expectSecretPresence("github_actions", secretName, true, () =>
      listGitHubSecretNames(repository, environment)
    );
    operationCount += 1;

    await expectCommand(
      "github_actions",
      "rotate_synthetic_secret",
      runCommand(ghBin, ["secret", "set", secretName, "--repo", repository, "--env", environment], {
        input: rotatedValue.toString("base64")
      })
    );
    operationCount += 1;

    await expectCommand(
      "github_actions",
      "delete_synthetic_secret",
      runCommand(ghBin, ["secret", "delete", secretName, "--repo", repository, "--env", environment])
    );
    operationCount += 1;

    await expectSecretPresence("github_actions", secretName, false, () =>
      listGitHubSecretNames(repository, environment)
    );
    operationCount += 1;

    return passedResult("github_actions", secretName, operationCount);
  } catch (error) {
    await runCommand(ghBin, ["secret", "delete", secretName, "--repo", repository, "--env", environment])
      .catch(() => undefined);
    return failedResult(
      "github_actions",
      "github_secret_smoke_failed",
      error instanceof Error ? error.message : String(error),
      secretName,
      operationCount
    );
  }
}

async function smokeSupabase(secretName, firstValue, rotatedValue) {
  const projectRef = requiredEnvValue("SUPABASE_PROJECT_REF");
  let operationCount = 0;

  try {
    await setSupabaseSecret(secretName, firstValue, projectRef);
    operationCount += 1;

    await expectSecretPresence("supabase", secretName, true, () => listSupabaseSecretNames(projectRef));
    operationCount += 1;

    await setSupabaseSecret(secretName, rotatedValue, projectRef);
    operationCount += 1;

    await expectCommand(
      "supabase",
      "delete_synthetic_secret",
      runCommand(npxBin, [
        "supabase",
        "secrets",
        "unset",
        secretName,
        "--project-ref",
        projectRef,
        "--yes"
      ])
    );
    operationCount += 1;

    await expectSecretPresence("supabase", secretName, false, () => listSupabaseSecretNames(projectRef));
    operationCount += 1;

    return passedResult("supabase", secretName, operationCount);
  } catch (error) {
    await runCommand(npxBin, [
      "supabase",
      "secrets",
      "unset",
      secretName,
      "--project-ref",
      projectRef,
      "--yes"
    ]).catch(() => undefined);
    return failedResult(
      "supabase",
      "supabase_secret_smoke_failed",
      error instanceof Error ? error.message : String(error),
      secretName,
      operationCount
    );
  }
}

async function setSupabaseSecret(secretName, value, projectRef) {
  const directory = await mkdtemp(join(tmpdir(), "aiphabee-secret-smoke-"));
  const envFile = join(directory, "smoke.env");

  try {
    await writeFile(envFile, `${secretName}=${value.toString("base64")}\n`, { mode: 0o600 });
    await expectCommand(
      "supabase",
      "set_synthetic_secret",
      runCommand(npxBin, [
        "supabase",
        "secrets",
        "set",
        "--env-file",
        envFile,
        "--project-ref",
        projectRef
      ])
    );
  } finally {
    await rm(directory, { force: true, recursive: true }).catch(() => undefined);
  }
}

async function listCloudflareWorkerSecretNames(workerName) {
  const result = await expectCommand(
    "cloudflare_workers",
    "list_secret_metadata",
    runCommand(npxBin, [
      "wrangler",
      "secret",
      "list",
      "--name",
      workerName,
      "--format",
      "json"
    ])
  );
  return extractSecretNames(result.stdout);
}

async function listGitHubSecretNames(repository, environment) {
  const result = await expectCommand(
    "github_actions",
    "list_secret_metadata",
    runCommand(ghBin, [
      "secret",
      "list",
      "--repo",
      repository,
      "--env",
      environment,
      "--json",
      "name,updatedAt"
    ])
  );
  return extractSecretNames(result.stdout);
}

async function listSupabaseSecretNames(projectRef) {
  const result = await expectCommand(
    "supabase",
    "list_secret_metadata",
    runCommand(npxBin, ["supabase", "secrets", "list", "--project-ref", projectRef, "--output", "json"])
  );
  return extractSecretNames(result.stdout);
}

async function expectSecretPresence(provider, secretName, expectedPresent, listNames) {
  const names = await listNames();
  const present = names.includes(secretName);

  if (present !== expectedPresent) {
    throw new Error(
      `${provider} secret presence mismatch for ${secretName}: expected ${expectedPresent ? "present" : "absent"}`
    );
  }
}

async function expectCommand(provider, operation, commandPromise) {
  const result = await commandPromise;

  if (result.exitCode !== 0) {
    throw new Error(
      `${provider} ${operation} command failed: exit=${result.exitCode} stdout=${result.stdoutHash} stderr=${result.stderrHash}`
    );
  }

  return result;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"]
    });
    const stdout = [];
    const stderr = [];
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`command timed out after ${commandTimeoutMs}ms`));
    }, commandTimeoutMs);

    child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)));
    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timeout);
      const stdoutText = Buffer.concat(stdout).toString("utf8");
      const stderrText = Buffer.concat(stderr).toString("utf8");
      resolve({
        exitCode: code ?? 1,
        raw_output_hash: hashString(stdoutText),
        stderrHash: hashString(stderrText),
        stdout: stdoutText,
        stdoutHash: hashString(stdoutText)
      });
    });

    if (options.input !== undefined) {
      child.stdin.write(options.input);
    }

    child.stdin.end();
  });
}

function extractSecretNames(output) {
  try {
    return [...new Set(extractNamesFromValue(JSON.parse(output)))].sort();
  } catch {
    return [
      ...new Set(
        output
          .split(/\r?\n/u)
          .map((line) => line.trim().split(/\s+/u)[0])
          .filter((value) => /^[A-Z][A-Z0-9_]{1,127}$/u.test(value))
      )
    ].sort();
  }
}

function extractNamesFromValue(value) {
  if (Array.isArray(value)) {
    return value.flatMap((item) => extractNamesFromValue(item));
  }

  if (!isRecord(value)) {
    return [];
  }

  const directNames = ["name", "Name", "key", "Key", "secret_name", "secretName"]
    .map((field) => value[field])
    .filter((fieldValue) => typeof fieldValue === "string");
  const nestedNames = Object.values(value).flatMap((nested) => extractNamesFromValue(nested));

  return [...directNames, ...nestedNames];
}

function passedResult(provider, secretName, operationCount) {
  return {
    cleanup_verified: true,
    operation_count: operationCount,
    provider,
    raw_output_hash: hashString(`${provider}:${secretName}:${operationCount}`),
    revocation_verified: true,
    rotation_verified: true,
    secret_name_hash: hashString(secretName),
    secret_value_hash: "generated_in_memory_not_logged",
    status: "passed",
    surface: "provider_secret_store_rotation_revocation_smoke"
  };
}

function failedResult(provider, failureCode, detail, secretName, operationCount) {
  return {
    detail,
    failure_code: failureCode,
    operation_count: operationCount,
    provider,
    secret_name_hash: hashString(secretName),
    status: "failed",
    surface: "provider_secret_store_rotation_revocation_smoke"
  };
}

function createSyntheticValue(provider, phase) {
  return Buffer.concat([
    Buffer.from(`aiphabee-secret-smoke:${provider}:${phase}:`, "utf8"),
    randomBytes(32)
  ]);
}

function normalizeSmokeName(value) {
  const normalized = String(value).trim().toUpperCase();

  if (!/^AIPHABEE_SECRET_STORE_SMOKE[A-Z0-9_]{0,80}$/u.test(normalized)) {
    throw new Error("PROVIDER_SECRET_SMOKE_NAME must start with AIPHABEE_SECRET_STORE_SMOKE");
  }

  return normalized;
}

function requiredEnvValue(name) {
  const value = process.env[name];

  if (!hasValue(value)) {
    throw new Error(`${name} is required`);
  }

  return value.trim();
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ""), 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function hasValue(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hashString(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function emit(payload, exitCode) {
  console.log(JSON.stringify(payload, null, 2));
  process.exit(exitCode);
}
