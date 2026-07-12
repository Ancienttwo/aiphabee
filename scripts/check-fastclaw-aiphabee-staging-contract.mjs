#!/usr/bin/env node
import { readFileSync } from "node:fs";

const roleContract = JSON.parse(
  readFileSync("deploy/database/roles/fastclaw-aiphabee-staging.contract.json", "utf8")
);
const roleSql = readFileSync(
  "deploy/database/roles/fastclaw-aiphabee-staging.sql",
  "utf8"
);
const wrangler = readFileSync("apps/worker/wrangler.jsonc", "utf8");
const caddy = readFileSync("deploy/fastclaw/vps/Caddyfile", "utf8");
const transport = readFileSync("apps/worker/src/fastclaw-service-transport.ts", "utf8");
const bindings = JSON.parse(
  readFileSync("deploy/cloudflare/bindings.contract.json", "utf8")
);

const errors = [];
const expectedRole = "fastclaw_aiphabee_staging";
const expectedSchema = "fastclaw_aiphabee";

if (roleContract.role !== expectedRole || roleContract.schema !== expectedSchema) {
  errors.push("role contract must name the dedicated staging role and schema");
}
if (roleContract.role_attributes?.bypassrls !== false) {
  errors.push("FastClaw staging role must not bypass RLS");
}
if (!roleSql.includes("NOBYPASSRLS") || !roleSql.includes("NOINHERIT")) {
  errors.push("role SQL must be non-inheriting and non-BYPASSRLS");
}
if (!roleSql.includes("SET search_path TO fastclaw_aiphabee, pg_catalog")) {
  errors.push("role SQL must pin the FastClaw schema search_path");
}
if (
  !roleSql.includes(`GRANT ${expectedRole} TO CURRENT_USER`) ||
  !roleSql.includes(`REVOKE ${expectedRole} FROM CURRENT_USER`)
) {
  errors.push("role SQL must bound temporary schema-owner membership inside the transaction");
}
for (const schema of roleContract.forbidden_schemas ?? []) {
  if (!roleSql.includes(`REVOKE ALL ON SCHEMA ${schema} FROM ${expectedRole}`)) {
    errors.push(`role SQL must revoke schema ${schema}`);
  }
}
if (wrangler.includes('"binding": "FASTCLAW_CONTROL_SERVICE"')) {
  errors.push("AiphaBee staging Worker must not retain the removed Cloudflare FastClaw binding");
}
if (!wrangler.includes('"FASTCLAW_BASE_URL": "https://89-167-47-141.sslip.io/"')) {
  errors.push("AiphaBee staging Worker must target the dedicated VPS FastClaw HTTPS origin");
}
if (
  !transport.includes(
    'requestHeaders.set(VPS_SHARED_TOKEN_HEADER, `Bearer ${input.shared_token}`)'
  ) ||
  !caddy.includes('header Authorization "Bearer {$AIPHABEE_VPS_SHARED_TOKEN}"') ||
  !caddy.includes('header_up Authorization "Bearer {$FASTCLAW_CONTROL_API_KEY}"') ||
  !caddy.includes('respond "Not found" 404')
) {
  errors.push(
    "VPS ingress must replace caller authorization with the shared token, then Caddy must replace it with the host-local FastClaw control key and deny unmatched routes"
  );
}
const obsoleteBinding = bindings.bindings.find(
  (entry) => entry.name === "FASTCLAW_CONTROL_SERVICE"
);
if (obsoleteBinding !== undefined) {
  errors.push("binding contract must remove the obsolete Cloudflare FastClaw service");
}

if (errors.length > 0) {
  console.error(JSON.stringify({ errors, status: "invalid_contract" }, null, 2));
  process.exit(1);
}
console.log(
  JSON.stringify(
    {
      provisioned: roleContract.provisioned,
      role: roleContract.role,
      schema: roleContract.schema,
      service: "https://89-167-47-141.sslip.io/",
      status: "ok"
    },
    null,
    2
  )
);
