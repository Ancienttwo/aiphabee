#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { validateAuthenticatedWebIdentityContract } from "./check-authenticated-web-identity-staging-contract.mjs";

const source = JSON.parse(
  readFileSync("deploy/account/authenticated-web-identity-staging.contract.json", "utf8"),
);
const fixtures = [
  {
    label: "email identity authority",
    mutate: (value) => {
      value.identity.email_is_identity_key = true;
    },
  },
  {
    label: "OAuth token plaintext",
    mutate: (value) => {
      value.oauth_token_storage.encrypted = false;
    },
  },
  {
    label: "product data enabled",
    mutate: (value) => {
      value.product_data_access.enabled = true;
    },
  },
  {
    label: "elevated auth role",
    mutate: (value) => {
      value.runtime_role_policy.bypassrls = true;
    },
  },
  {
    label: "production deployment",
    mutate: (value) => {
      value.production.deployment_allowed = true;
    },
  },
];

for (const fixture of fixtures) {
  const value = structuredClone(source);
  fixture.mutate(value);
  const errors = validateAuthenticatedWebIdentityContract(value);
  if (errors.length === 0) {
    console.error(JSON.stringify({ fixture: fixture.label, status: "fixture_not_rejected" }));
    process.exit(1);
  }
}

console.log(JSON.stringify({ fixtures: fixtures.length, status: "ok" }));
