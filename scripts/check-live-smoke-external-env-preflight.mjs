#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  getLiveSmokeEnvSource,
  getMissingLiveSmokeEnv
} from "./lib/live-smoke-defaults.mjs";

const packagePath = "package.json";
const ledgerPath = "deploy/governance/live-smoke-evidence-ledger.contract.json";
const contracts = {
  cloudflare: readJson("deploy/cloudflare/resource-smoke-readiness.contract.json"),
  ledger: readJson(ledgerPath),
  modelProvider: readJson("deploy/model-providers/live-smoke-readiness.contract.json"),
  observability: readJson("deploy/observability/live-smoke-readiness.contract.json"),
  packageJson: readJson(packagePath),
  secrets: readJson("deploy/secrets/live-smoke-readiness.contract.json")
};

const commandPreflights = buildCommandPreflights(contracts);
const errors = validatePreflight({ commandPreflights, contracts });

if (errors.length > 0) {
  emit(
    {
      errors,
      status: "invalid_preflight_contract"
    },
    1
  );
}

const uniqueMissingEnv = [
  ...new Set(commandPreflights.flatMap((entry) => entry.missing_env.map((item) => item.name)))
].sort();
const uniqueDefaultedEnv = [
  ...new Set(
    commandPreflights
      .flatMap((entry) => entry.env_sources)
      .filter((entry) => entry.source === "contract_partial_provisioning")
      .map((entry) => entry.name)
  )
].sort();
const readyCommands = commandPreflights.filter((entry) => entry.status === "ready_for_live_smoke");

emit(
  {
    blocked_commands: commandPreflights.length - readyCommands.length,
    command_preflights: commandPreflights,
    defaulted_env: uniqueDefaultedEnv,
    missing_env: uniqueMissingEnv,
    ready_commands: readyCommands.length,
    status: uniqueMissingEnv.length === 0 ? "ready_for_live_smoke" : "missing_external_env",
    total_commands: commandPreflights.length
  },
  0
);

function buildCommandPreflights({ cloudflare, ledger, modelProvider, observability, secrets }) {
  const providerSecretRequiredEnv = Object.fromEntries(
    secrets.providers.map((provider) => [provider.name, provider.required_env])
  );
  const specs = {
    ai_gateway_model_execution: {
      auth_sources: ["CLOUDFLARE_API_TOKEN"],
      command: modelProvider.live_smoke_command,
      required_env: modelProvider.required_env,
      script: modelProvider.live_smoke_script
    },
    ai_gateway_observability: {
      auth_sources: ["CLOUDFLARE_API_TOKEN with AI Gateway Read and Account Analytics Read"],
      command: modelProvider.observability_smoke_command,
      required_env: modelProvider.observability_required_env,
      script: modelProvider.observability_smoke_script
    },
    cloudflare_bindings_functional: {
      auth_sources: ["CLOUDFLARE_API_TOKEN or Wrangler authenticated session"],
      command: cloudflare.functional_smoke.command,
      required_env: cloudflare.functional_smoke.required_env,
      script: cloudflare.functional_smoke_script
    },
    cloudflare_resource_inventory: {
      auth_sources: ["CLOUDFLARE_API_TOKEN"],
      command: cloudflare.live_smoke_command,
      required_env: cloudflare.required_env,
      script: cloudflare.live_smoke_script
    },
    observability_otlp_eval_store: {
      auth_sources: ["OTLP destination headers", "Wrangler authenticated session or CLOUDFLARE_API_TOKEN"],
      command: "npm run smoke:observability-live",
      required_env: observability.required_env,
      script: observability.script
    },
    provider_secret_store_rotation: {
      auth_sources: [
        "Wrangler authenticated session or CLOUDFLARE_API_TOKEN",
        "gh authenticated session or GITHUB_TOKEN"
      ],
      command: "npm run smoke:provider-secret-stores-live",
      provider_required_env: providerSecretRequiredEnv,
      required_env: Object.values(providerSecretRequiredEnv).flat(),
      script: secrets.script
    }
  };

  return ledger.live_smoke_commands.map((entry) => {
    const spec = specs[entry.id];
    const envSources = spec.required_env.map((name) => ({
      name,
      source: getLiveSmokeEnvSource(name)
    }));
    const missingEnv = getMissingLiveSmokeEnv(spec.required_env).map((name) => ({
      name,
      source: getLiveSmokeEnvSource(name)
    }));
    const commandPreflight = {
      auth_sources: spec.auth_sources,
      command: spec.command,
      env_sources: envSources,
      id: entry.id,
      missing_env: missingEnv,
      required_env: spec.required_env,
      script: spec.script,
      status: missingEnv.length === 0 ? "ready_for_live_smoke" : "missing_env"
    };

    if (spec.provider_required_env) {
      commandPreflight.provider_required_env = spec.provider_required_env;
    }

    return commandPreflight;
  });
}

function validatePreflight({ commandPreflights, contracts: { ledger, packageJson } }) {
  const errors = [];
  const ledgerById = new Map(ledger.live_smoke_commands.map((entry) => [entry.id, entry]));
  const expectedIds = [
    "cloudflare_resource_inventory",
    "cloudflare_bindings_functional",
    "ai_gateway_model_execution",
    "ai_gateway_observability",
    "observability_otlp_eval_store",
    "provider_secret_store_rotation"
  ];

  for (const id of expectedIds) {
    if (!ledgerById.has(id)) {
      errors.push(`ledger live_smoke_commands missing ${id}`);
    }
  }

  for (const entry of commandPreflights) {
    const ledgerEntry = ledgerById.get(entry.id);

    if (!ledgerEntry) {
      errors.push(`unexpected command preflight ${entry.id}`);
      continue;
    }

    if (entry.command !== ledgerEntry.command) {
      errors.push(`${entry.id}.command must match ledger command`);
    }

    if (entry.script !== ledgerEntry.script) {
      errors.push(`${entry.id}.script must match ledger script`);
    }

    for (const envSource of entry.env_sources) {
      if (ledger.non_inferable_env.includes(envSource.name) && envSource.source === "contract_partial_provisioning") {
        errors.push(`${envSource.name} must not resolve from contract defaults`);
      }
    }

    for (const missingEnv of entry.missing_env) {
      if (!ledger.non_inferable_env.includes(missingEnv.name)) {
        errors.push(`${entry.id}.missing_env ${missingEnv.name} is not listed as non_inferable_env`);
      }
    }
  }

  const scripts = packageJson.scripts ?? {};

  if (scripts["check:live-smoke-external-env-preflight"] !== "node scripts/check-live-smoke-external-env-preflight.mjs") {
    errors.push("package.json check:live-smoke-external-env-preflight script is missing");
  }

  if (!String(scripts.check ?? "").includes("npm run check:live-smoke-external-env-preflight")) {
    errors.push("root check must include check:live-smoke-external-env-preflight");
  }

  return errors;
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
}

function emit(value, code) {
  const output = code === 0 ? console.log : console.error;

  output(JSON.stringify(value, null, 2));
  process.exit(code);
}
