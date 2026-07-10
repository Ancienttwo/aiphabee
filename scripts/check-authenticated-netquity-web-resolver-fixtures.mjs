#!/usr/bin/env node
import { readFileSync } from "node:fs";
import {
  validateAuthenticatedNetquityWebResolverContract,
  validateProvisioningReplaySafety,
} from "./check-authenticated-netquity-web-resolver-contract.mjs";

const source = JSON.parse(readFileSync("deploy/account/authenticated-netquity-web-resolver-staging.contract.json", "utf8"));
const fixtures = [
  ["public RPC", (value) => { value.rpc.public_http_exposed = true; }],
  ["caller identity", (value) => { value.web.allowed_input_fields.push("authSubject"); }],
  ["partial fields", (value) => { value.authorization.requested_fields.pop(); }],
  ["wildcard field", (value) => { value.authorization.requested_fields[0] = "security_master.*"; }],
  ["API rights", (value) => { value.authorization.api_rights_approved = true; }],
  ["synthetic fallback", (value) => { value.serving.synthetic_fallback = true; }],
  ["raw access", (value) => { value.database.raw_netquity_access = true; }],
  ["production deployment", (value) => { value.production.deployment_allowed = true; }],
];

for (const [label, mutate] of fixtures) {
  const value = structuredClone(source);
  mutate(value);
  if (validateAuthenticatedNetquityWebResolverContract(value).length === 0) {
    console.error(JSON.stringify({ fixture: label, status: "fixture_not_rejected" }));
    process.exit(1);
  }
}

const provisioning = readFileSync("deploy/account/authenticated-netquity-web-resolver-staging.sql", "utf8");
for (const [label, value] of [
  ["missing replay status guard", provisioning.replace("WHERE aiphabee_governance.data_entitlement.status = 'approved'", "")],
  ["replay reactivates block", provisioning.replace("export_allowed = false,", "export_allowed = false,\n  status = 'approved',")],
]) {
  if (validateProvisioningReplaySafety(value).length === 0) {
    console.error(JSON.stringify({ fixture: label, status: "fixture_not_rejected" }));
    process.exit(1);
  }
}

console.log(JSON.stringify({ fixtures: fixtures.length + 2, status: "ok" }));
