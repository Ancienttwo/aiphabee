import { betterAuth, type BetterAuthOptions } from "better-auth";
import { APIError } from "better-auth/api";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { Pool } from "pg";

const AUTH_SUBJECT_PREFIX = "better-auth:";
const AUTH_SESSION_EXPIRES_SECONDS = 7 * 24 * 60 * 60;
const AUTH_SESSION_UPDATE_SECONDS = 24 * 60 * 60;
const AUTH_MAX_FIND_MANY_ROWS = 50;
const SHA256_HEX_PATTERN = /^[a-f0-9]{64}$/u;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export type AuthConfigurationErrorCode =
  | "AUTH_BINDING_MISSING"
  | "AUTH_ENVIRONMENT_DENIED"
  | "AUTH_IDENTITY_INVALID"
  | "AUTH_INVITATION_CONFIG_INVALID"
  | "AUTH_OAUTH_CONFIG_MISSING"
  | "AUTH_ORIGIN_INVALID"
  | "AUTH_SECRET_INVALID";

export interface AuthHyperdriveBinding {
  connectionString?: string;
}

export interface AuthenticatedWebIdentityBindings {
  AIPHABEE_AUTH_HYPERDRIVE?: AuthHyperdriveBinding;
  AIPHABEE_AUTH_INVITED_EMAIL_SHA256?: string;
  APP_ENV?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}

export interface AuthenticatedWebIdentityConfig {
  appEnv: "staging";
  baseUrl: string;
  connectionString: string;
  githubClientId: string;
  githubClientSecret: string;
  invitedEmailSha256: string[];
  secret: string;
}

export class AuthConfigurationError extends Error {
  readonly code: AuthConfigurationErrorCode;

  constructor(code: AuthConfigurationErrorCode) {
    super(code);
    this.code = code;
    this.name = "AuthConfigurationError";
  }
}

export function parseAuthenticatedWebIdentityBindings(
  bindings: AuthenticatedWebIdentityBindings,
): AuthenticatedWebIdentityConfig {
  if (bindings.APP_ENV !== "staging") {
    throw new AuthConfigurationError("AUTH_ENVIRONMENT_DENIED");
  }

  const connectionString = bindings.AIPHABEE_AUTH_HYPERDRIVE?.connectionString?.trim();
  if (!connectionString) {
    throw new AuthConfigurationError("AUTH_BINDING_MISSING");
  }

  const baseUrl = normalizeSecureBaseUrl(bindings.BETTER_AUTH_URL);
  const secret = bindings.BETTER_AUTH_SECRET?.trim();
  if (!secret || new TextEncoder().encode(secret).byteLength < 32) {
    throw new AuthConfigurationError("AUTH_SECRET_INVALID");
  }

  const githubClientId = bindings.GITHUB_CLIENT_ID?.trim();
  const githubClientSecret = bindings.GITHUB_CLIENT_SECRET?.trim();
  if (!githubClientId || !githubClientSecret) {
    throw new AuthConfigurationError("AUTH_OAUTH_CONFIG_MISSING");
  }

  const invitedEmailSha256 = parseInvitedEmailHashes(
    bindings.AIPHABEE_AUTH_INVITED_EMAIL_SHA256,
  );

  return {
    appEnv: "staging",
    baseUrl,
    connectionString,
    githubClientId,
    githubClientSecret,
    invitedEmailSha256,
    secret,
  };
}

export function canonicalAuthSubject(userId: string): string {
  if (!UUID_PATTERN.test(userId)) {
    throw new AuthConfigurationError("AUTH_IDENTITY_INVALID");
  }
  return `${AUTH_SUBJECT_PREFIX}${userId.toLowerCase()}`;
}

export async function hashInvitedEmail(email: string): Promise<string> {
  const normalized = normalizeEmail(email);
  if (normalized.length === 0) {
    throw new AuthConfigurationError("AUTH_IDENTITY_INVALID");
  }
  const bytes = new TextEncoder().encode(normalized);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest, (value) => value.toString(16).padStart(2, "0")).join("");
}

export async function isInvitedEmail(email: string, invitedEmailSha256: string[]) {
  const candidate = await hashInvitedEmail(email);
  return invitedEmailSha256.includes(candidate);
}

export function createBackgroundTaskTracker() {
  const pending = new Set<Promise<void>>();
  const errors: unknown[] = [];

  return {
    handler(promise: Promise<unknown>) {
      const tracked = promise
        .then(
          () => undefined,
          (error) => {
            errors.push(error);
          },
        )
        .finally(() => pending.delete(tracked));
      pending.add(tracked);
    },
    async settle() {
      while (pending.size > 0) {
        await Promise.allSettled([...pending]);
      }
      if (errors.length > 0) {
        throw new AggregateError(errors, "AUTH_BACKGROUND_TASK_FAILED");
      }
    },
  };
}

export async function closeAuthenticatedWebIdentityResources(
  backgroundTasks: Pick<ReturnType<typeof createBackgroundTaskTracker>, "settle">,
  pool: Pick<Pool, "end">,
) {
  const errors: unknown[] = [];
  try {
    await backgroundTasks.settle();
  } catch (error) {
    errors.push(error);
  }
  try {
    await pool.end();
  } catch (error) {
    errors.push(error);
  }
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) {
    throw new AggregateError(errors, "AUTH_RESOURCE_CLOSE_FAILED");
  }
}

export function createBetterAuthOptions(
  config: AuthenticatedWebIdentityConfig,
  pool: Pool,
  backgroundTaskHandler?: (promise: Promise<unknown>) => void,
): BetterAuthOptions {
  return {
    account: {
      accountLinking: {
        enabled: false,
      },
      encryptOAuthTokens: true,
      storeAccountCookie: false,
      storeStateStrategy: "database",
    },
    advanced: {
      ...(backgroundTaskHandler
        ? { backgroundTasks: { handler: backgroundTaskHandler } }
        : {}),
      cookiePrefix: "aiphabee_staging",
      database: {
        defaultFindManyLimit: AUTH_MAX_FIND_MANY_ROWS,
        generateId: "uuid",
      },
      disableCSRFCheck: false,
      disableOriginCheck: false,
      ipAddress: {
        ipAddressHeaders: ["cf-connecting-ip"],
      },
      useSecureCookies: true,
    },
    appName: "AiphaBee",
    basePath: "/api/auth",
    baseURL: config.baseUrl,
    database: pool,
    databaseHooks: {
      user: {
        create: {
          before: async (user) => {
            if (
              user.emailVerified !== true ||
              !(await isInvitedEmail(user.email, config.invitedEmailSha256))
            ) {
              throw new APIError("FORBIDDEN", {
                message: "Invitation required",
              });
            }
            return { data: user };
          },
        },
      },
    },
    logger: {
      level: "error",
    },
    plugins: [tanstackStartCookies()],
    rateLimit: {
      customRules: {
        "/sign-in/social": {
          max: 10,
          window: 60,
        },
      },
      enabled: true,
      max: 30,
      storage: "database",
      window: 60,
    },
    secret: config.secret,
    session: {
      cookieCache: {
        enabled: false,
      },
      expiresIn: AUTH_SESSION_EXPIRES_SECONDS,
      updateAge: AUTH_SESSION_UPDATE_SECONDS,
    },
    socialProviders: {
      github: {
        clientId: config.githubClientId,
        clientSecret: config.githubClientSecret,
        disableImplicitSignUp: true,
        scope: ["read:user", "user:email"],
      },
    },
    telemetry: {
      enabled: false,
    },
    trustedOrigins: [config.baseUrl],
    verification: {
      storeIdentifier: "hashed",
    },
  };
}

export function createAuthenticatedWebIdentityRuntime(
  bindings: AuthenticatedWebIdentityBindings,
) {
  const config = parseAuthenticatedWebIdentityBindings(bindings);
  const backgroundTasks = createBackgroundTaskTracker();
  const pool = new Pool({
    allowExitOnIdle: true,
    connectionString: config.connectionString,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
    max: 1,
    options: "-c search_path=aiphabee_auth,pg_catalog",
  });
  const auth = betterAuth(createBetterAuthOptions(config, pool, backgroundTasks.handler));
  return {
    auth,
    close: () => closeAuthenticatedWebIdentityResources(backgroundTasks, pool),
  };
}

export async function handleAuthenticatedWebIdentityRequest(
  bindings: AuthenticatedWebIdentityBindings,
  request: Request,
) {
  const runtime = createAuthenticatedWebIdentityRuntime(bindings);
  try {
    return await runtime.auth.handler(request);
  } finally {
    await runtime.close();
  }
}

export async function getAuthenticatedWebIdentitySession(
  bindings: AuthenticatedWebIdentityBindings,
  headers: Headers,
) {
  const runtime = createAuthenticatedWebIdentityRuntime(bindings);
  try {
    return await runtime.auth.api.getSession({ headers });
  } finally {
    await runtime.close();
  }
}

function normalizeSecureBaseUrl(value: string | undefined): string {
  if (!value) {
    throw new AuthConfigurationError("AUTH_ORIGIN_INVALID");
  }

  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      (url.pathname !== "/" && url.pathname !== "")
    ) {
      throw new AuthConfigurationError("AUTH_ORIGIN_INVALID");
    }
    return url.origin;
  } catch (error) {
    if (error instanceof AuthConfigurationError) throw error;
    throw new AuthConfigurationError("AUTH_ORIGIN_INVALID");
  }
}

function parseInvitedEmailHashes(value: string | undefined): string[] {
  const hashes = [
    ...new Set(
      (value ?? "")
        .split(",")
        .map((entry) => entry.trim().toLowerCase())
        .filter(Boolean),
    ),
  ];
  if (hashes.length === 0 || hashes.some((hash) => !SHA256_HEX_PATTERN.test(hash))) {
    throw new AuthConfigurationError("AUTH_INVITATION_CONFIG_INVALID");
  }
  return hashes.sort();
}

function normalizeEmail(value: string) {
  return value.trim().toLocaleLowerCase("en-US");
}
