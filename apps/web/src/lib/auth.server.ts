import { betterAuth, type BetterAuthOptions } from "better-auth";
import { APIError } from "better-auth/api";
import { tanstackStartCookies } from "better-auth/tanstack-start";
import { Pool } from "pg";

const AUTH_SUBJECT_PREFIX = "better-auth:";
const AUTH_SESSION_EXPIRES_SECONDS = 7 * 24 * 60 * 60;
const AUTH_SESSION_UPDATE_SECONDS = 24 * 60 * 60;
const AUTH_MAX_FIND_MANY_ROWS = 50;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export type AuthConfigurationErrorCode =
  | "AUTH_BINDING_MISSING"
  | "AUTH_ENVIRONMENT_DENIED"
  | "AUTH_IDENTITY_INVALID"
  | "AUTH_OAUTH_CONFIG_MISSING"
  | "AUTH_ORIGIN_INVALID"
  | "AUTH_SECRET_INVALID";

export interface AuthHyperdriveBinding {
  connectionString?: string;
}

export interface AuthenticatedWebIdentityBindings {
  AIPHABEE_AUTH_HYPERDRIVE?: AuthHyperdriveBinding;
  APP_ENV?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

export interface AuthenticatedWebIdentityConfig {
  appEnv: "staging";
  baseUrl: string;
  connectionString: string;
  googleClientId: string;
  googleClientSecret: string;
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

  const googleClientId = bindings.GOOGLE_CLIENT_ID?.trim();
  const googleClientSecret = bindings.GOOGLE_CLIENT_SECRET?.trim();
  if (!googleClientId || !googleClientSecret) {
    throw new AuthConfigurationError("AUTH_OAUTH_CONFIG_MISSING");
  }

  return {
    appEnv: "staging",
    baseUrl,
    connectionString,
    googleClientId,
    googleClientSecret,
    secret,
  };
}

export function canonicalAuthSubject(userId: string): string {
  if (!UUID_PATTERN.test(userId)) {
    throw new AuthConfigurationError("AUTH_IDENTITY_INVALID");
  }
  return `${AUTH_SUBJECT_PREFIX}${userId.toLowerCase()}`;
}

/**
 * Sentinel auth subject for the anonymous public read layer. It is a
 * syntactically valid canonical Better Auth subject (passes UUID_PATTERN
 * above and platform.resolve_active_account_id_by_auth_subject(text)'s own
 * identical regex), provisioned to a dedicated platform.account/workspace
 * by deploy/account/netquity-public-anonymous-provisioning-staging.sql --
 * there is no corresponding aiphabee_auth."user" row and none is required.
 */
export const PUBLIC_ANONYMOUS_AUTH_SUBJECT =
  "better-auth:00000000-0000-4000-8000-000000000000";

export interface WebRequestSubjectResolution {
  authSubject: string;
  isPublic: boolean;
}

/**
 * Resolves the auth subject a private RPC call should use: the caller's own
 * canonical subject when a session is present, otherwise the public
 * anonymous sentinel. This is the only branch point for anonymous access --
 * the resolver, validateInput, and the SECURITY DEFINER account-resolution
 * function downstream never know or care which case produced the subject
 * they were called with.
 */
export function resolveWebRequestSubject(
  session: Awaited<ReturnType<typeof getAuthenticatedWebIdentitySession>>,
): WebRequestSubjectResolution {
  if (session?.user?.id) {
    return { authSubject: canonicalAuthSubject(session.user.id), isPublic: false };
  }
  return { authSubject: PUBLIC_ANONYMOUS_AUTH_SUBJECT, isPublic: true };
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
            if (user.emailVerified !== true) {
              throw new APIError("FORBIDDEN", {
                message: "Email verification required",
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
      google: {
        clientId: config.googleClientId,
        clientSecret: config.googleClientSecret,
        disableImplicitSignUp: true,
        scope: ["openid", "email", "profile"],
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
