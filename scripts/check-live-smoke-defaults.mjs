#!/usr/bin/env node
import {
  cloudflareLiveSmokeDefaultEnvNames,
  getLiveSmokeEnvSource,
  getLiveSmokeEnvValue
} from "./lib/live-smoke-defaults.mjs";

const forbiddenContractDefaults = [
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_API_TOKEN",
  "AI_GATEWAY_SMOKE_MODEL",
  "OTLP_EXPORTER_OTLP_ENDPOINT",
  "OTLP_EXPORTER_OTLP_HEADERS",
  "GITHUB_REPOSITORY",
  "GITHUB_ENVIRONMENT",
  "SUPABASE_PROJECT_REF"
];
const errors = [];

for (const name of cloudflareLiveSmokeDefaultEnvNames) {
  const value = getLiveSmokeEnvValue(name);

  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(
      `${name} must resolve from env, local ops env file, or contract partial_provisioning.resource_names`
    );
  }
}

for (const name of forbiddenContractDefaults) {
  if (getLiveSmokeEnvSource(name) === "contract_partial_provisioning") {
    errors.push(`${name} must not resolve from contract defaults`);
  }
}

if (errors.length > 0) {
  console.error(
    JSON.stringify(
      {
        errors,
        status: "failed"
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      defaulted_env: cloudflareLiveSmokeDefaultEnvNames,
      forbidden_contract_defaults: forbiddenContractDefaults,
      status: "ok"
    },
    null,
    2
  )
);
