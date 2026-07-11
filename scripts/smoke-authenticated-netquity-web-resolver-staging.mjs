#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const STAGING_WEB_ORIGIN = "https://aiphabee-web-staging.metalabs.workers.dev";
const STAGING_API_ORIGIN = "https://aiphabee-worker-staging.metalabs.workers.dev";
const PRODUCTION_WEB_ORIGIN = "https://aiphabee-web.metalabs.workers.dev";
const ACCOUNT_ID = "ab66185011440a6f8a698d61ad58703a";
const EXPECTED_PRODUCTION_API_VERSION = "0ab3f7d0-517e-4fa3-91b7-1ccc92e90a88";

const invalidSession = await fetch(`${STAGING_WEB_ORIGIN}/api/auth/get-session`, {
  headers: { cookie: "aiphabee_staging.session_token=invalid" },
});
const invalidBody = await invalidSession.json().catch(() => undefined);
const productionAuth = await fetch(`${PRODUCTION_WEB_ORIGIN}/api/auth/get-session`, { redirect: "manual" });
const publicResolver = await fetch(`${STAGING_API_ORIGIN}/tools/resolve-security`, {
  body: JSON.stringify({ query: "00700.HK" }),
  headers: { "content-type": "application/json", "x-request-id": crypto.randomUUID() },
  method: "POST",
});
const publicBody = await publicResolver.json().catch(() => undefined);
const guessedPrivateRoute = await fetch(`${STAGING_API_ORIGIN}/authenticated-netquity-resolver`, { redirect: "manual" });

const evidence = {
  guessed_private_route_not_found: guessedPrivateRoute.status === 404,
  invalid_session_denied: invalidSession.status === 200 && invalidBody === null,
  production_auth_route_not_found: productionAuth.status === 404,
  production_api_unchanged: readWorkerVersion("aiphabee-worker") === EXPECTED_PRODUCTION_API_VERSION,
  production_web_absent: readWorkerAbsent("aiphabee-web"),
  public_resolver_remains_synthetic: publicResolver.status === 200 && publicBody?.ok === true && publicBody?.data?.liveDataAccess === false,
};
const passed = Object.values(evidence).every(Boolean);
console.log(JSON.stringify({ evidence, observed_at: new Date().toISOString(), status: passed ? "preflight_ok" : "preflight_failed" }, null, 2));
process.exit(passed ? 0 : 1);

function readWorkerVersion(name) {
  const result = wrangler(["deployments", "list", "--name", name, "--json"]);
  if (result.status !== 0) return undefined;
  const deployments = JSON.parse(result.stdout);
  const versions = deployments.at(-1)?.versions;
  return Array.isArray(versions) && versions.length === 1 && versions[0]?.percentage === 100 ? versions[0]?.version_id : undefined;
}
function readWorkerAbsent(name) {
  const result = wrangler(["deployments", "list", "--name", name, "--json"]);
  return result.status !== 0 && /\[code:\s*10007\]/u.test(result.stderr);
}
function wrangler(args) {
  const env = { CLOUDFLARE_ACCOUNT_ID: ACCOUNT_ID };
  for (const name of ["CI", "HOME", "NO_COLOR", "PATH", "TMPDIR", "XDG_CONFIG_HOME"]) if (process.env[name]) env[name] = process.env[name];
  return spawnSync("npx", ["wrangler", ...args], { encoding: "utf8", env });
}
