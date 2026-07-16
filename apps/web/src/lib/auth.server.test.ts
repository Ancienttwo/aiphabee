import { describe, expect, it, vi } from "vitest";
import { Pool } from "pg";
import {
  AuthConfigurationError,
  canonicalAuthSubject,
  closeAuthenticatedWebIdentityResources,
  createBackgroundTaskTracker,
  createBetterAuthOptions,
  parseAuthenticatedWebIdentityBindings,
  type AuthenticatedWebIdentityBindings,
} from "./auth.server";

async function validBindings(): Promise<AuthenticatedWebIdentityBindings> {
  return {
    AIPHABEE_AUTH_HYPERDRIVE: {
      connectionString: "postgresql://auth:secret@localhost:5432/aiphabee",
    },
    APP_ENV: "staging",
    BETTER_AUTH_SECRET: "a".repeat(48),
    BETTER_AUTH_URL: "https://aiphabee-web-staging.example.test",
    GOOGLE_CLIENT_ID: "google-client-id",
    GOOGLE_CLIENT_SECRET: "google-client-secret",
  };
}

describe("authenticated Web identity configuration", () => {
  it("keeps request-scoped database resources open until background work settles", async () => {
    const tracker = createBackgroundTaskTracker();
    let resolveTask: (() => void) | undefined;
    const task = new Promise<void>((resolve) => {
      resolveTask = resolve;
    });
    tracker.handler(task);

    let settled = false;
    const settling = tracker.settle().then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);

    resolveTask?.();
    await settling;
    expect(settled).toBe(true);
  });

  it("fails closed when a background database task fails", async () => {
    const tracker = createBackgroundTaskTracker();
    tracker.handler(Promise.reject(new Error("cleanup failed")));

    await expect(tracker.settle()).rejects.toThrow("AUTH_BACKGROUND_TASK_FAILED");
  });

  it("closes the request pool even when a background task fails", async () => {
    const pool = { end: vi.fn().mockResolvedValue(undefined) };
    const backgroundTasks = {
      settle: vi.fn().mockRejectedValue(new Error("cleanup failed")),
    };

    await expect(
      closeAuthenticatedWebIdentityResources(backgroundTasks, pool),
    ).rejects.toThrow("cleanup failed");
    expect(pool.end).toHaveBeenCalledOnce();
  });

  it("reports both background and pool close failures", async () => {
    const pool = { end: vi.fn().mockRejectedValue(new Error("pool close failed")) };
    const backgroundTasks = {
      settle: vi.fn().mockRejectedValue(new Error("cleanup failed")),
    };

    await expect(
      closeAuthenticatedWebIdentityResources(backgroundTasks, pool),
    ).rejects.toMatchObject({
      errors: [expect.objectContaining({ message: "cleanup failed" }), expect.objectContaining({ message: "pool close failed" })],
      message: "AUTH_RESOURCE_CLOSE_FAILED",
    });
    expect(pool.end).toHaveBeenCalledOnce();
  });

  it("accepts only the staging authority and parses the Google OAuth credentials", async () => {
    const parsed = parseAuthenticatedWebIdentityBindings(await validBindings());

    expect(parsed.appEnv).toBe("staging");
    expect(parsed.baseUrl).toBe("https://aiphabee-web-staging.example.test");
    expect(parsed.googleClientId).toBe("google-client-id");
    expect(parsed.googleClientSecret).toBe("google-client-secret");
  });

  it("fails closed outside staging", async () => {
    const bindings = await validBindings();
    bindings.APP_ENV = "prod";

    expect(() => parseAuthenticatedWebIdentityBindings(bindings)).toThrowError(
      new AuthConfigurationError("AUTH_ENVIRONMENT_DENIED"),
    );
  });

  it.each([
    "AIPHABEE_AUTH_HYPERDRIVE",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ] as const)("fails closed when %s is absent", async (name) => {
    const bindings = await validBindings();
    delete bindings[name];

    expect(() => parseAuthenticatedWebIdentityBindings(bindings)).toThrow(AuthConfigurationError);
  });

  it("rejects insecure origins and short secrets", async () => {
    const insecure = await validBindings();
    insecure.BETTER_AUTH_URL = "http://aiphabee-web-staging.example.test";
    expect(() => parseAuthenticatedWebIdentityBindings(insecure)).toThrow(AuthConfigurationError);

    const shortSecret = await validBindings();
    shortSecret.BETTER_AUTH_SECRET = "too-short";
    expect(() => parseAuthenticatedWebIdentityBindings(shortSecret)).toThrow(
      AuthConfigurationError,
    );
  });

  it("uses a stable Better Auth subject and rejects non-canonical ids", () => {
    expect(canonicalAuthSubject("123e4567-e89b-12d3-a456-426614174000")).toBe(
      "better-auth:123e4567-e89b-12d3-a456-426614174000",
    );
    expect(() => canonicalAuthSubject(" user id ")).toThrow(AuthConfigurationError);
    expect(() => canonicalAuthSubject("")).toThrow(AuthConfigurationError);
  });

  it("builds hardened OAuth, session, token-storage, and rate-limit options", async () => {
    const config = parseAuthenticatedWebIdentityBindings(await validBindings());
    const pool = new Pool({ connectionString: config.connectionString });
    const backgroundTasks = createBackgroundTaskTracker();
    const options = createBetterAuthOptions(config, pool, backgroundTasks.handler);

    expect(options.emailAndPassword).toBeUndefined();
    expect(options.trustedOrigins).toEqual([config.baseUrl]);
    expect(options.socialProviders?.github).toBeUndefined();
    expect(options.socialProviders?.google).toMatchObject({
      clientId: config.googleClientId,
      clientSecret: config.googleClientSecret,
      disableImplicitSignUp: true,
    });
    expect(options.socialProviders?.google).not.toHaveProperty("disableSignUp");
    expect(options.account).toMatchObject({
      encryptOAuthTokens: true,
      storeAccountCookie: false,
      storeStateStrategy: "database",
    });
    expect(options.session).toMatchObject({
      cookieCache: { enabled: false },
      expiresIn: 604_800,
      updateAge: 86_400,
    });
    expect(options.rateLimit).toMatchObject({
      enabled: true,
      storage: "database",
    });
    expect(options.advanced).toMatchObject({
      backgroundTasks: { handler: backgroundTasks.handler },
      disableCSRFCheck: false,
      disableOriginCheck: false,
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      useSecureCookies: true,
    });

    await backgroundTasks.settle();
    await pool.end();
  });

  it("uses the database user-create hook to require a verified OAuth email, open to any address", async () => {
    const config = parseAuthenticatedWebIdentityBindings(await validBindings());
    const pool = new Pool({ connectionString: config.connectionString });
    const options = createBetterAuthOptions(config, pool);
    const beforeCreate = options.databaseHooks?.user?.create?.before;

    expect(beforeCreate).toBeTypeOf("function");
    await expect(
      beforeCreate?.(
        { email: "unverified@example.com", emailVerified: false } as Parameters<NonNullable<typeof beforeCreate>>[0],
        {} as Parameters<NonNullable<typeof beforeCreate>>[1],
      ),
    ).rejects.toMatchObject({ status: "FORBIDDEN" });
    await expect(
      beforeCreate?.(
        { email: "anyone@example.com", emailVerified: true } as Parameters<NonNullable<typeof beforeCreate>>[0],
        {} as Parameters<NonNullable<typeof beforeCreate>>[1],
      ),
    ).resolves.toMatchObject({ data: { email: "anyone@example.com" } });
    await expect(
      beforeCreate?.(
        { email: "someone.else@example.com", emailVerified: true } as Parameters<NonNullable<typeof beforeCreate>>[0],
        {} as Parameters<NonNullable<typeof beforeCreate>>[1],
      ),
    ).resolves.toMatchObject({ data: { email: "someone.else@example.com" } });

    await pool.end();
  });
});
