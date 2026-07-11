#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const STAGING_ORIGIN = "https://aiphabee-web-staging.metalabs.workers.dev";
const PRODUCTION_ORIGIN = "https://aiphabee-web.metalabs.workers.dev";
const PRODUCTION_WEB_WORKER = "aiphabee-web";
const PRODUCTION_WORKER = "aiphabee-worker";
const EXPECTED_PRODUCTION_WORKER_VERSION = "0ab3f7d0-517e-4fa3-91b7-1ccc92e90a88";
const CLOUDFLARE_ACCOUNT_ID = "ab66185011440a6f8a698d61ad58703a";
const stagingOrigin = normalizeOrigin(
  process.env.AIPHABEE_AUTH_STAGING_ORIGIN ?? STAGING_ORIGIN,
  "staging",
  STAGING_ORIGIN,
);
const productionOrigin = normalizeOrigin(
  process.env.AIPHABEE_AUTH_PRODUCTION_ORIGIN ?? PRODUCTION_ORIGIN,
  "production",
  PRODUCTION_ORIGIN,
);
const currentSessionCookie = process.env.AIPHABEE_AUTH_STAGING_SESSION_COOKIE?.trim();
const revokeSessionCookie = process.env.AIPHABEE_AUTH_STAGING_REVOKE_SESSION_COOKIE?.trim();
const revokePeerSessionCookie =
  process.env.AIPHABEE_AUTH_STAGING_REVOKE_PEER_SESSION_COOKIE?.trim();
const preflightOnly = process.argv.includes("--preflight-only");
const observedAt = new Date().toISOString();
const evidence = {
  invalid_session_denied: false,
  logout: false,
  production_auth_route_not_found: false,
  production_web_absent: false,
  production_worker_unchanged: false,
  revoke_all_sessions: false,
  session_readback: false,
};

const invalidResponse = await fetch(`${stagingOrigin}/api/auth/get-session`, {
  headers: { cookie: "aiphabee_staging.session_token=invalid" },
});
const invalidBody = await readJson(invalidResponse);
evidence.invalid_session_denied =
  invalidResponse.status === 200 && invalidBody.valid && invalidBody.value === null;

const productionResponse = await fetch(`${productionOrigin}/api/auth/get-session`, {
  redirect: "manual",
});
evidence.production_auth_route_not_found = productionResponse.status === 404;
const productionWebState = readWorkerDeploymentState(PRODUCTION_WEB_WORKER);
const productionWorkerState = readWorkerDeploymentState(PRODUCTION_WORKER);
evidence.production_web_absent = productionWebState?.exists === false;
evidence.production_worker_unchanged =
  productionWorkerState?.exists === true &&
  productionWorkerState.version_id === EXPECTED_PRODUCTION_WORKER_VERSION;

if (preflightOnly) {
  emit({
    evidence,
    observed_at: observedAt,
    production_status: productionResponse.status,
    staging_invalid_session_status: invalidResponse.status,
    status:
      evidence.invalid_session_denied &&
      evidence.production_auth_route_not_found &&
      evidence.production_web_absent &&
      evidence.production_worker_unchanged
        ? "preflight_ok"
        : "preflight_failed",
  });
  process.exit(
    evidence.invalid_session_denied &&
      evidence.production_auth_route_not_found &&
      evidence.production_web_absent &&
      evidence.production_worker_unchanged
      ? 0
      : 1,
  );
}

if (!currentSessionCookie || !revokeSessionCookie || !revokePeerSessionCookie) {
  emit({
    evidence,
    observed_at: observedAt,
    status: "live_session_cookies_required",
  });
  process.exit(2);
}

const currentSession = await getSession(stagingOrigin, currentSessionCookie);
const userId = currentSession.body.value?.user?.id;
evidence.session_readback =
  currentSession.response.status === 200 &&
  currentSession.body.valid &&
  typeof userId === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
    userId,
  );

const signOutResponse = await postAuth(stagingOrigin, "/api/auth/sign-out", currentSessionCookie);
const signedOutSession = await getSession(stagingOrigin, currentSessionCookie);
evidence.logout =
  signOutResponse.ok &&
  signedOutSession.response.status === 200 &&
  signedOutSession.body.valid &&
  signedOutSession.body.value === null;

const revokeSession = await getSession(stagingOrigin, revokeSessionCookie);
const revokePeerSession = await getSession(stagingOrigin, revokePeerSessionCookie);
const revokeUserId = revokeSession.body.value?.user?.id;
const revokePeerUserId = revokePeerSession.body.value?.user?.id;
if (
  revokeSession.response.ok &&
  revokePeerSession.response.ok &&
  typeof revokeUserId === "string" &&
  revokePeerUserId === revokeUserId
) {
  const revokeResponse = await postAuth(
    stagingOrigin,
    "/api/auth/revoke-sessions",
    revokeSessionCookie,
  );
  const revokedSession = await getSession(stagingOrigin, revokeSessionCookie);
  const revokedPeerSession = await getSession(stagingOrigin, revokePeerSessionCookie);
  evidence.revoke_all_sessions =
    revokeResponse.ok &&
    revokedSession.response.status === 200 &&
    revokedPeerSession.response.status === 200 &&
    revokedSession.body.valid &&
    revokedPeerSession.body.valid &&
    revokedSession.body.value === null &&
    revokedPeerSession.body.value === null;
}

const passed = Object.values(evidence).every(Boolean);
emit({
  canonical_subject_hash:
    typeof userId === "string" ? sha256(`better-auth:${userId.toLowerCase()}`) : undefined,
  evidence,
  observed_at: observedAt,
  status: passed ? "ok" : "live_smoke_failed",
});
process.exit(passed ? 0 : 1);

async function getSession(origin, cookie) {
  const response = await fetch(`${origin}/api/auth/get-session`, {
    headers: { cookie },
  });
  return { body: await readJson(response), response };
}

async function postAuth(origin, path, cookie) {
  return fetch(`${origin}${path}`, {
    body: "{}",
    headers: {
      "content-type": "application/json",
      cookie,
      origin,
    },
    method: "POST",
  });
}

async function readJson(response) {
  if (!response.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return { valid: false, value: undefined };
  }
  try {
    return { valid: true, value: await response.json() };
  } catch {
    return { valid: false, value: undefined };
  }
}

function normalizeOrigin(value, label, expectedOrigin) {
  const url = new URL(value);
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.pathname !== "/" && url.pathname !== "") ||
    url.origin !== expectedOrigin
  ) {
    throw new Error(`${label}_origin_invalid`);
  }
  return url.origin;
}

function readWorkerDeploymentState(workerName) {
  const commandEnv = { CLOUDFLARE_ACCOUNT_ID };
  for (const name of ["CI", "HOME", "NO_COLOR", "PATH", "TMPDIR", "XDG_CONFIG_HOME"]) {
    if (process.env[name]) commandEnv[name] = process.env[name];
  }
  const result = spawnSync(
    "npx",
    ["wrangler", "deployments", "list", "--name", workerName, "--json"],
    {
      encoding: "utf8",
      env: commandEnv,
    },
  );
  if (result.status !== 0) {
    return /\[code:\s*10007\]/u.test(result.stderr) ? { exists: false } : undefined;
  }
  try {
    const deployments = JSON.parse(result.stdout);
    const active = deployments.at(-1);
    const versions = active?.versions;
    if (!Array.isArray(versions) || versions.length !== 1 || versions[0]?.percentage !== 100) {
      return undefined;
    }
    return { exists: true, version_id: versions[0]?.version_id };
  } catch {
    return undefined;
  }
}

function sha256(value) {
  return `sha256:${createHash("sha256").update(value).digest("hex")}`;
}

function emit(payload) {
  const redacted = JSON.parse(JSON.stringify(payload));
  console.log(JSON.stringify(redacted, null, 2));
}
