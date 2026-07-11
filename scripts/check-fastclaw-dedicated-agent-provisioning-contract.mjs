#!/usr/bin/env node
import { readFileSync } from "node:fs";

const contract = JSON.parse(
  readFileSync("deploy/fastclaw/dedicated-agent-provisioning.contract.json", "utf8")
);
const capabilities = JSON.parse(readFileSync(".ai/context/capabilities.json", "utf8"));
const errors = [];

const expectedCommit = "35cd5ad006d991713c91a1fc641bcf01dbaf3a8b";
const expectedRoutes = [
  ["GET", "/api/status"],
  ["POST", "/v1/users"],
  ["POST", "/api/users/{user_id}/agents"],
  ["PUT", "/api/users/{user_id}"],
  ["DELETE", "/api/users/{user_id}"]
];

if (contract.upstream?.branch !== "dev" || contract.upstream?.commit !== expectedCommit) {
  errors.push("FastClaw upstream must be pinned to the accepted dev commit");
}
const routes = (contract.control_routes ?? []).map((route) => [route.method, route.path]);
if (JSON.stringify(routes) !== JSON.stringify(expectedRoutes)) {
  errors.push("control routes must equal the five private lifecycle route shapes");
}
if (
  JSON.stringify(contract.identity_authority?.local_unique_scope) !==
    JSON.stringify(["workspace_id", "account_id"]) ||
  JSON.stringify(contract.identity_authority?.fastclaw_user_unique_scope) !==
    JSON.stringify(["owner", "external_id"]) ||
  JSON.stringify(contract.identity_authority?.fastclaw_agent_unique_scope) !==
    JSON.stringify(["user_id", "external_id"]) ||
  contract.identity_authority?.shared_identity_fallback !== false
) {
  errors.push("identity authority must stay owner scoped with no shared fallback");
}
if (
  contract.expiry?.entitlement !== "temporal_authority_valid_to_denies_new_activation" ||
  contract.expiry?.operation_lease !== "expired_lease_may_be_reclaimed" ||
  contract.expiry?.public_expire_intent !== false
) {
  errors.push("expiry must use temporal entitlement and lease authority without a new intent");
}
if (
  contract.recovery?.competing_lease_request_audited !== true ||
  contract.recovery?.request_id_replays_same_attempt !== true ||
  contract.recovery?.retryable_attempt_requires_new_request_id !== true ||
  contract.recovery?.concurrent_duplicate_request_transient_until_owner_audit !== true
) {
  errors.push("retryable audit must preserve same-attempt replay and require a new request id");
}
if (
  contract.activation?.runner_dispatch_enabled !== false ||
  contract.activation?.production_enabled !== false ||
  contract.activation?.live_acceptance_owned_by_sprint_row !== 10
) {
  errors.push("Row 6 must keep dispatch and production disabled and leave live acceptance to Row 10");
}
const capability = capabilities.capabilities?.find(
  (entry) => entry.id === "fastclaw_personal_runner"
);
if (
  capability?.invariants?.dedicated_agent_provisioning_verified !== true ||
  capability?.invariants?.runtime_dispatch_implemented !== false
) {
  errors.push("capability truth must record verified provisioning while dispatch remains off");
}

if (errors.length > 0) {
  console.error(JSON.stringify({ errors, status: "invalid_contract" }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      commit: contract.upstream.commit,
      live_acceptance: false,
      routes: routes.length,
      status: "ok"
    },
    null,
    2
  )
);
