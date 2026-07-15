import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ResponseEnvelope } from "@aiphabee/data-contracts";

const pgState = vi.hoisted(() => ({
  accountRows: [{ account_id: "account_test" }] as Record<string, unknown>[],
  candidateRows: [] as Record<string, unknown>[],
  connectCount: 0,
  constructorCount: 0,
  contextRows: [] as Record<string, unknown>[],
  endCount: 0,
  endFails: false,
  failOn: "",
  queries: [] as Array<{ text: string; values: unknown[] }>,
  rightsRows: [] as Record<string, unknown>[],
  snapshotRows: [] as Record<string, unknown>[],
}));

vi.mock("pg", () => ({
  Client: class MockPgClient {
    constructor() {
      pgState.constructorCount += 1;
    }

    async connect() {
      pgState.connectCount += 1;
    }

    async end() {
      pgState.endCount += 1;
      if (pgState.endFails) throw new Error("forced close failure");
    }

    async query(text: string, values: unknown[] = []) {
      pgState.queries.push({ text, values });
      const normalized = text.toLowerCase();
      if (pgState.failOn && normalized.includes(pgState.failOn)) {
        throw new Error("forced query failure");
      }
      if (normalized.includes("resolve_active_account_id_by_auth_subject")) {
        return { rows: pgState.accountRows };
      }
      if (normalized.includes("from platform.workspace_membership membership")) {
        return { rows: pgState.contextRows };
      }
      if (normalized.includes("from aiphabee_governance.workspace_entitlement")) {
        return { rows: pgState.rightsRows };
      }
      if (normalized.includes("from aiphabee_core.serving_dataset dataset")) {
        return {
          rows: pgState.snapshotRows.filter(
            (row) => row.rights_policy_version === values[0] && row.quality_state === "PASS",
          ),
        };
      }
      if (normalized.includes("from aiphabee_core.serving_record record")) {
        return { rows: pgState.candidateRows };
      }
      return { rows: [] };
    }
  },
}));

const {
  AUTHENTICATED_NETQUITY_FINANCIAL_FACTS_REQUIRED_FIELDS,
  AUTHENTICATED_NETQUITY_PROFILE_REQUIRED_FIELDS,
  AUTHENTICATED_NETQUITY_REQUIRED_FIELDS,
  resolveAuthenticatedNetquityFinancialFacts,
  resolveAuthenticatedNetquityProfile,
  resolveAuthenticatedNetquitySecurity,
} = await import("./authenticated-netquity-web-resolver");

const AUTH_SUBJECT = "better-auth:123e4567-e89b-12d3-a456-426614174000";
const bindings = {
  AIPHABEE_HYPERDRIVE: { connectionString: "postgresql://runtime:test@localhost/db" },
  APP_ENV: "staging",
};

describe("private authenticated Netquity resolver", () => {
  beforeEach(() => {
    pgState.accountRows = [{ account_id: "account_test" }];
    pgState.candidateRows = [createCandidateRow("00001.HK", "canonical_symbol")];
    pgState.connectCount = 0;
    pgState.constructorCount = 0;
    pgState.contextRows = [createContextRow()];
    pgState.endCount = 0;
    pgState.endFails = false;
    pgState.failOn = "";
    pgState.queries = [];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_REQUIRED_FIELDS.map(createRightsRow);
    pgState.snapshotRows = [createSnapshotRow()];
  });

  it.each([
    ["invalid subject", { authSubject: "email@example.com", query: "00001.HK" }],
    ["empty query", { authSubject: AUTH_SUBJECT, query: "" }],
    ["oversized query", { authSubject: AUTH_SUBJECT, query: "x".repeat(513) }],
    ["caller-shaped market", { authSubject: AUTH_SUBJECT, market: "hk", query: "00001.HK" }],
  ])("rejects %s before creating a database client", async (_label, input) => {
    const result = await resolveAuthenticatedNetquitySecurity(bindings, {
      requestId: "request_test",
      ...input,
    });

    expect(result.envelope.ok).toBe(false);
    expect(pgState.constructorCount).toBe(0);
  });

  it("stays unavailable outside staging before binding access", async () => {
    let bindingReads = 0;
    const result = await resolveAuthenticatedNetquitySecurity(
      {
        APP_ENV: "prod",
        get AIPHABEE_HYPERDRIVE(): { connectionString?: string } | undefined {
          bindingReads += 1;
          throw new Error("production binding must not be read");
        },
      },
      validInput(),
    );

    expect(result.status).toBe(403);
    expect(bindingReads).toBe(0);
  });

  it("returns unavailable for a missing private database binding", async () => {
    const result = await resolveAuthenticatedNetquitySecurity(
      { APP_ENV: "staging" },
      validInput(),
    );

    expect(result.status).toBe(424);
    expect(pgState.constructorCount).toBe(0);
  });

  it("denies an unmapped account before membership or Serving reads", async () => {
    pgState.accountRows = [{ account_id: null }];
    const result = await resolveAuthenticatedNetquitySecurity(bindings, validInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(
      queryTexts().some((text) => text.includes("from platform.workspace_membership membership")),
    ).toBe(false);
    expect(hasServingRead()).toBe(false);
  });

  it.each(["no membership", "inactive membership", "expired subscription"])(
    "denies %s before rights or Serving reads",
    async () => {
      pgState.contextRows = [];
      const result = await resolveAuthenticatedNetquitySecurity(bindings, validInput());

      expect(result.status).toBe(403);
      expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
      expect(
        queryTexts().some((text) =>
          text.includes("from aiphabee_governance.workspace_entitlement"),
        ),
      ).toBe(false);
      expect(hasServingRead()).toBe(false);
      const contextSql = pgState.queries.find((query) =>
        query.text.toLowerCase().includes("from platform.workspace_membership membership"),
      )?.text;
      expect(contextSql).toContain("subscription.billing_state = 'active'");
      expect(contextSql).toContain("subscription.valid_to IS NULL OR subscription.valid_to > now()");
    },
  );

  it("fails closed when more than one entitled workspace is active", async () => {
    pgState.contextRows = [createContextRow(), { ...createContextRow(), workspace_id: "workspace_2" }];
    const result = await resolveAuthenticatedNetquitySecurity(bindings, validInput());

    expect(result.status).toBe(409);
    expect(hasServingRead()).toBe(false);
  });

  it("pins field rights to the active product-access policy version", async () => {
    await resolveAuthenticatedNetquitySecurity(bindings, validInput());

    const rightsQuery = pgState.queries.find((query) =>
      query.text.toLowerCase().includes("from aiphabee_governance.workspace_entitlement"),
    );
    expect(rightsQuery?.text).toContain("data_entitlement.rights_policy_version = $3");
    expect(rightsQuery?.values).toEqual([
      "workspace_test",
      "subscription_test",
      "netquity-collaboration-staging.v1",
    ]);
  });

  it("denies missing exact field rights before the released snapshot query", async () => {
    pgState.rightsRows = pgState.rightsRows.slice(0, -1);
    const result = await resolveAuthenticatedNetquitySecurity(bindings, validInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("denies wildcard authority even when every exact field row is also present", async () => {
    pgState.rightsRows.push(createRightsRow("security_master.*"));
    const result = await resolveAuthenticatedNetquitySecurity(bindings, validInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("lets a blocked field win over approved rows", async () => {
    pgState.rightsRows.push({
      ...createRightsRow("security_master.symbol"),
      entitlement_id: "entitlement_blocked_symbol",
      entitlement_status: "blocked",
      workspace_entitlement_id: "workspace_entitlement_blocked_symbol",
      workspace_status: "blocked",
    });
    const result = await resolveAuthenticatedNetquitySecurity(bindings, validInput());

    expect(result.status).toBe(403);
    expect(hasServingRead()).toBe(false);
  });

  it.each([
    ["mismatched rights policy", { rights_policy_version: "netquity-collaboration-staging.v2" }],
    ["non-PASS quality", { quality_state: "HOLD" }],
  ])("fails closed for a released snapshot with %s", async (_label, override) => {
    pgState.snapshotRows = [{ ...createSnapshotRow(), ...override }];
    const result = await resolveAuthenticatedNetquitySecurity(bindings, validInput());

    expect(result.status).toBe(409);
    expect(errorCode(result)).toBe("DATA_QUALITY_HOLD");
    expect(
      queryTexts().some((text) => text.includes("from aiphabee_core.serving_record record")),
    ).toBe(false);
    const snapshotQuery = pgState.queries.find((query) =>
      query.text.toLowerCase().includes("from aiphabee_core.serving_dataset dataset"),
    );
    expect(snapshotQuery?.values).toEqual(["netquity-collaboration-staging.v1"]);
  });

  it.each([
    ["00001.HK", "canonical_symbol"],
    ["Alpha Holdings Limited", "name"],
    ["阿爾法控股有限公司", "name"],
    ["阿尔法控股有限公司", "name"],
  ])("resolves entitled exact query %s after rights evaluation", async (query, reason) => {
    pgState.candidateRows = [createCandidateRow(query, reason)];
    const result = await resolveAuthenticatedNetquitySecurity(bindings, validInput(query));

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.liveDataAccess).toBe(true);
      expect(result.envelope.data.candidates[0]?.matchReason).toBe(reason);
    }
    const texts = queryTexts();
    expect(texts.findIndex((text) => text.includes("from aiphabee_governance.workspace_entitlement"))).toBeLessThan(
      texts.findIndex((text) => text.includes("from aiphabee_core.serving_dataset dataset")),
    );
  });

  it("returns an explicit failure and closes the client on database error", async () => {
    pgState.failOn = "from aiphabee_governance.workspace_entitlement";
    const result = await resolveAuthenticatedNetquitySecurity(bindings, validInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
    expect(hasServingRead()).toBe(false);
  });

  it("does not return an authorized result when the database client cannot close", async () => {
    pgState.endFails = true;

    const result = await resolveAuthenticatedNetquitySecurity(bindings, validInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
  });
});

describe("private authenticated Netquity profile resolver", () => {
  beforeEach(() => {
    pgState.accountRows = [{ account_id: "account_test" }];
    pgState.candidateRows = [createProfileRecordRow()];
    pgState.connectCount = 0;
    pgState.constructorCount = 0;
    pgState.contextRows = [createContextRow()];
    pgState.endCount = 0;
    pgState.endFails = false;
    pgState.failOn = "";
    pgState.queries = [];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_PROFILE_REQUIRED_FIELDS.map(createProfileRightsRow);
    pgState.snapshotRows = [createSnapshotRow()];
  });

  it.each([
    ["invalid subject", { authSubject: "email@example.com", instrumentId: "hkex_security_00001" }],
    ["malformed instrument id", { authSubject: AUTH_SUBJECT, instrumentId: "eq_hk_00001" }],
    ["empty instrument id", { authSubject: AUTH_SUBJECT, instrumentId: "" }],
  ])("rejects %s before creating a database client", async (_label, input) => {
    const result = await resolveAuthenticatedNetquityProfile(bindings, {
      requestId: "request_test",
      ...input,
    });

    expect(result.envelope.ok).toBe(false);
    expect(pgState.constructorCount).toBe(0);
  });

  it("stays unavailable outside staging before binding access", async () => {
    let bindingReads = 0;
    const result = await resolveAuthenticatedNetquityProfile(
      {
        APP_ENV: "prod",
        get AIPHABEE_HYPERDRIVE(): { connectionString?: string } | undefined {
          bindingReads += 1;
          throw new Error("production binding must not be read");
        },
      },
      profileValidInput(),
    );

    expect(result.status).toBe(403);
    expect(bindingReads).toBe(0);
  });

  it("returns unavailable for a missing private database binding", async () => {
    const result = await resolveAuthenticatedNetquityProfile(
      { APP_ENV: "staging" },
      profileValidInput(),
    );

    expect(result.status).toBe(424);
    expect(pgState.constructorCount).toBe(0);
  });

  it("denies an unmapped account before membership or Serving reads", async () => {
    pgState.accountRows = [{ account_id: null }];
    const result = await resolveAuthenticatedNetquityProfile(bindings, profileValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it.each(["no membership", "inactive membership", "expired subscription"])(
    "denies %s before rights or Serving reads",
    async () => {
      pgState.contextRows = [];
      const result = await resolveAuthenticatedNetquityProfile(bindings, profileValidInput());

      expect(result.status).toBe(403);
      expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
      expect(
        queryTexts().some((text) => text.includes("from aiphabee_governance.workspace_entitlement")),
      ).toBe(false);
      expect(hasServingRead()).toBe(false);
    },
  );

  it("fails closed when more than one entitled workspace is active", async () => {
    pgState.contextRows = [createContextRow(), { ...createContextRow(), workspace_id: "workspace_2" }];
    const result = await resolveAuthenticatedNetquityProfile(bindings, profileValidInput());

    expect(result.status).toBe(409);
    expect(hasServingRead()).toBe(false);
  });

  it("pins field rights to the active product-access policy version", async () => {
    await resolveAuthenticatedNetquityProfile(bindings, profileValidInput());

    const rightsQuery = pgState.queries.find((query) =>
      query.text.toLowerCase().includes("from aiphabee_governance.workspace_entitlement"),
    );
    expect(rightsQuery?.text).toContain("data_entitlement.dataset = 'security_profile'");
    expect(rightsQuery?.text).toContain("data_entitlement.rights_policy_version = $3");
    expect(rightsQuery?.values).toEqual([
      "workspace_test",
      "subscription_test",
      "netquity-collaboration-staging.v1",
    ]);
  });

  it("denies missing exact field rights before the released snapshot query", async () => {
    pgState.rightsRows = pgState.rightsRows.slice(0, -1);
    const result = await resolveAuthenticatedNetquityProfile(bindings, profileValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("denies wildcard authority even when every exact field row is also present", async () => {
    pgState.rightsRows.push(createProfileRightsRow("security_profile.*"));
    const result = await resolveAuthenticatedNetquityProfile(bindings, profileValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("lets a blocked field win over approved rows", async () => {
    pgState.rightsRows.push({
      ...createProfileRightsRow("security_profile.symbol"),
      entitlement_id: "entitlement_blocked_symbol",
      entitlement_status: "blocked",
      workspace_entitlement_id: "workspace_entitlement_blocked_symbol",
      workspace_status: "blocked",
    });
    const result = await resolveAuthenticatedNetquityProfile(bindings, profileValidInput());

    expect(result.status).toBe(403);
    expect(hasServingRead()).toBe(false);
  });

  it.each([
    ["mismatched rights policy", { rights_policy_version: "netquity-collaboration-staging.v2" }],
    ["non-PASS quality", { quality_state: "HOLD" }],
  ])("fails closed for a released snapshot with %s", async (_label, override) => {
    pgState.snapshotRows = [{ ...createSnapshotRow(), ...override }];
    const result = await resolveAuthenticatedNetquityProfile(bindings, profileValidInput());

    expect(result.status).toBe(409);
    expect(errorCode(result)).toBe("DATA_QUALITY_HOLD");
    expect(
      queryTexts().some((text) => text.includes("from aiphabee_core.serving_record record")),
    ).toBe(false);
  });

  it("resolves an entitled instrument id after rights evaluation", async () => {
    const result = await resolveAuthenticatedNetquityProfile(bindings, profileValidInput());

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.liveDataAccess).toBe(true);
      expect(result.envelope.data.profile?.symbol).toBe("00001.HK");
      expect(result.envelope.data.profile?.listingStatus).toBe("listed");
      expect(result.envelope.data.profile?.coverage.industry.status).toBe("planned");
      expect(result.envelope.data.profile?.listingId).toBeUndefined();
    }
    const texts = queryTexts();
    expect(texts.findIndex((text) => text.includes("from aiphabee_governance.workspace_entitlement"))).toBeLessThan(
      texts.findIndex((text) => text.includes("from aiphabee_core.serving_dataset dataset")),
    );
  });

  it("returns 404 NOT_FOUND when no released row matches the instrument id, never a synthetic fallback", async () => {
    pgState.candidateRows = [];
    const result = await resolveAuthenticatedNetquityProfile(bindings, profileValidInput());

    expect(result.status).toBe(404);
    expect(errorCode(result)).toBe("NOT_FOUND");
  });

  it("fails closed on a malformed released row rather than exposing it", async () => {
    pgState.candidateRows = [{ ...createProfileRecordRow(), data_version: "wrong-version" }];
    const result = await resolveAuthenticatedNetquityProfile(bindings, profileValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
  });

  it("returns an explicit failure and closes the client on database error", async () => {
    pgState.failOn = "from aiphabee_governance.workspace_entitlement";
    const result = await resolveAuthenticatedNetquityProfile(bindings, profileValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
    expect(hasServingRead()).toBe(false);
  });

  it("does not return an authorized result when the database client cannot close", async () => {
    pgState.endFails = true;

    const result = await resolveAuthenticatedNetquityProfile(bindings, profileValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
  });
});

describe("private authenticated Netquity financial facts resolver", () => {
  beforeEach(() => {
    pgState.accountRows = [{ account_id: "account_test" }];
    pgState.candidateRows = [createFinancialFactsRecordRow()];
    pgState.connectCount = 0;
    pgState.constructorCount = 0;
    pgState.contextRows = [createContextRow()];
    pgState.endCount = 0;
    pgState.endFails = false;
    pgState.failOn = "";
    pgState.queries = [];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_FINANCIAL_FACTS_REQUIRED_FIELDS.map(createFinancialFactsRightsRow);
    pgState.snapshotRows = [createSnapshotRow()];
  });

  it.each([
    ["invalid subject", { authSubject: "email@example.com", instrumentId: "hkex_security_00700" }],
    ["malformed instrument id", { authSubject: AUTH_SUBJECT, instrumentId: "eq_hk_00700" }],
    ["empty instrument id", { authSubject: AUTH_SUBJECT, instrumentId: "" }],
  ])("rejects %s before creating a database client", async (_label, input) => {
    const result = await resolveAuthenticatedNetquityFinancialFacts(bindings, {
      requestId: "request_test",
      ...input,
    });

    expect(result.envelope.ok).toBe(false);
    expect(pgState.constructorCount).toBe(0);
  });

  it("stays unavailable outside staging before binding access", async () => {
    let bindingReads = 0;
    const result = await resolveAuthenticatedNetquityFinancialFacts(
      {
        APP_ENV: "prod",
        get AIPHABEE_HYPERDRIVE(): { connectionString?: string } | undefined {
          bindingReads += 1;
          throw new Error("production binding must not be read");
        },
      },
      financialFactsValidInput(),
    );

    expect(result.status).toBe(403);
    expect(bindingReads).toBe(0);
  });

  it("returns unavailable for a missing private database binding", async () => {
    const result = await resolveAuthenticatedNetquityFinancialFacts(
      { APP_ENV: "staging" },
      financialFactsValidInput(),
    );

    expect(result.status).toBe(424);
    expect(pgState.constructorCount).toBe(0);
  });

  it("denies an unmapped account before membership or Serving reads", async () => {
    pgState.accountRows = [{ account_id: null }];
    const result = await resolveAuthenticatedNetquityFinancialFacts(bindings, financialFactsValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it.each(["no membership", "inactive membership", "expired subscription"])(
    "denies %s before rights or Serving reads",
    async () => {
      pgState.contextRows = [];
      const result = await resolveAuthenticatedNetquityFinancialFacts(bindings, financialFactsValidInput());

      expect(result.status).toBe(403);
      expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
      expect(
        queryTexts().some((text) => text.includes("from aiphabee_governance.workspace_entitlement")),
      ).toBe(false);
      expect(hasServingRead()).toBe(false);
    },
  );

  it("fails closed when more than one entitled workspace is active", async () => {
    pgState.contextRows = [createContextRow(), { ...createContextRow(), workspace_id: "workspace_2" }];
    const result = await resolveAuthenticatedNetquityFinancialFacts(bindings, financialFactsValidInput());

    expect(result.status).toBe(409);
    expect(hasServingRead()).toBe(false);
  });

  it("pins field rights to the active product-access policy version", async () => {
    await resolveAuthenticatedNetquityFinancialFacts(bindings, financialFactsValidInput());

    const rightsQuery = pgState.queries.find((query) =>
      query.text.toLowerCase().includes("from aiphabee_governance.workspace_entitlement"),
    );
    expect(rightsQuery?.text).toContain("data_entitlement.dataset = 'financial_facts'");
    expect(rightsQuery?.text).toContain("data_entitlement.rights_policy_version = $3");
    expect(rightsQuery?.values).toEqual([
      "workspace_test",
      "subscription_test",
      "netquity-collaboration-staging.v1",
    ]);
  });

  it("denies missing exact field rights before the released snapshot query", async () => {
    pgState.rightsRows = pgState.rightsRows.slice(0, -1);
    const result = await resolveAuthenticatedNetquityFinancialFacts(bindings, financialFactsValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("denies wildcard authority even when every exact field row is also present", async () => {
    pgState.rightsRows.push(createFinancialFactsRightsRow("financial_facts.*"));
    const result = await resolveAuthenticatedNetquityFinancialFacts(bindings, financialFactsValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("lets a blocked field win over approved rows", async () => {
    pgState.rightsRows.push({
      ...createFinancialFactsRightsRow("financial_facts.facts.revenue"),
      entitlement_id: "entitlement_blocked_revenue",
      entitlement_status: "blocked",
      workspace_entitlement_id: "workspace_entitlement_blocked_revenue",
      workspace_status: "blocked",
    });
    const result = await resolveAuthenticatedNetquityFinancialFacts(bindings, financialFactsValidInput());

    expect(result.status).toBe(403);
    expect(hasServingRead()).toBe(false);
  });

  it.each([
    ["mismatched rights policy", { rights_policy_version: "netquity-collaboration-staging.v2" }],
    ["non-PASS quality", { quality_state: "HOLD" }],
  ])("fails closed for a released snapshot with %s", async (_label, override) => {
    pgState.snapshotRows = [{ ...createSnapshotRow(), ...override }];
    const result = await resolveAuthenticatedNetquityFinancialFacts(bindings, financialFactsValidInput());

    expect(result.status).toBe(409);
    expect(errorCode(result)).toBe("DATA_QUALITY_HOLD");
    expect(
      queryTexts().some((text) => text.includes("from aiphabee_core.serving_record record")),
    ).toBe(false);
  });

  it("resolves an entitled instrument id with available facts after rights evaluation", async () => {
    const result = await resolveAuthenticatedNetquityFinancialFacts(bindings, financialFactsValidInput());

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.liveDataAccess).toBe(true);
      expect(result.envelope.data.coverage).toEqual({ status: "available" });
      expect(result.envelope.data.facts?.map((fact) => fact.metricId)).toEqual(["revenue", "net_income"]);
    }
    const texts = queryTexts();
    expect(texts.findIndex((text) => text.includes("from aiphabee_governance.workspace_entitlement"))).toBeLessThan(
      texts.findIndex((text) => text.includes("from aiphabee_core.serving_dataset dataset")),
    );
  });

  it("resolves an entitled bank/insurance instrument id with an unavailable coverage marker, never fabricated facts", async () => {
    pgState.candidateRows = [createUnavailableFinancialFactsRecordRow()];
    const result = await resolveAuthenticatedNetquityFinancialFacts(
      bindings,
      financialFactsValidInput("hkex_security_00005"),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.coverage?.status).toBe("unavailable");
      expect(result.envelope.data.facts).toEqual([]);
    }
  });

  it("returns 404 NOT_FOUND when no released row matches the instrument id, never a synthetic fallback", async () => {
    pgState.candidateRows = [];
    const result = await resolveAuthenticatedNetquityFinancialFacts(bindings, financialFactsValidInput());

    expect(result.status).toBe(404);
    expect(errorCode(result)).toBe("NOT_FOUND");
  });

  it("fails closed on a malformed released row rather than exposing it", async () => {
    pgState.candidateRows = [{ ...createFinancialFactsRecordRow(), data_version: "wrong-version" }];
    const result = await resolveAuthenticatedNetquityFinancialFacts(bindings, financialFactsValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
  });

  it("returns an explicit failure and closes the client on database error", async () => {
    pgState.failOn = "from aiphabee_governance.workspace_entitlement";
    const result = await resolveAuthenticatedNetquityFinancialFacts(bindings, financialFactsValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
    expect(hasServingRead()).toBe(false);
  });

  it("does not return an authorized result when the database client cannot close", async () => {
    pgState.endFails = true;

    const result = await resolveAuthenticatedNetquityFinancialFacts(bindings, financialFactsValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
  });
});

function financialFactsValidInput(instrumentId = "hkex_security_00700") {
  return {
    authSubject: AUTH_SUBJECT,
    instrumentId,
    requestId: "request_test",
  };
}

function createFinancialFactsRightsRow(fieldPattern: string) {
  return {
    channel: "web",
    dataset: "financial_facts",
    entitlement_id: `entitlement_${fieldPattern.replaceAll(".", "_")}`,
    entitlement_source_record_id: `source:${fieldPattern}`,
    entitlement_status: "approved",
    export_allowed: false,
    field_pattern: fieldPattern,
    rights_policy_version: "netquity-collaboration-staging.v1",
    time_range_days: null,
    valid_from: "2026-07-10T00:00:00.000Z",
    valid_to: null,
    workspace_entitlement_id: `workspace_entitlement_${fieldPattern.replaceAll(".", "_")}`,
    workspace_source_record_id: `workspace-source:${fieldPattern}`,
    workspace_status: "approved",
  };
}

function createFinancialFactsRecordRow(overrides: Record<string, unknown> = {}) {
  return {
    data_version: "netquity-basicdata-test.v1",
    entity_id: "hkex_security_00700",
    payload: {
      coverage: { status: "available" },
      facts: [
        {
          currency: "RMB",
          metricId: "revenue",
          periodEnd: "2025-12-31",
          periodType: "FY",
          publishedAt: "2026-03-18T00:00:00+08:00",
          qualityState: "PASS",
          scale: 1,
          sourceRecordId: "netquity:finreport.pla_nb.totalturnover:00700:2025-12-31:F",
          statementId: "netquity:finreport.stmt:00700:2025-12-31:F",
          statementType: "income_statement",
          unit: "unit",
          value: 751766000000,
        },
        {
          currency: "RMB",
          metricId: "net_income",
          periodEnd: "2025-12-31",
          periodType: "FY",
          publishedAt: "2026-03-18T00:00:00+08:00",
          qualityState: "PASS",
          scale: 1,
          sourceRecordId: "netquity:finreport.pla_nb.net_prof:00700:2025-12-31:F",
          statementId: "netquity:finreport.stmt:00700:2025-12-31:F",
          statementType: "income_statement",
          unit: "unit",
          value: 224842000000,
        },
      ],
    },
    source_record_id: "netquity:finreport.nb:00700",
    ...overrides,
  };
}

function createUnavailableFinancialFactsRecordRow(overrides: Record<string, unknown> = {}) {
  return {
    data_version: "netquity-basicdata-test.v1",
    entity_id: "hkex_security_00005",
    payload: {
      coverage: {
        reason:
          "reports under the bank/insurance statement schema (pla_b/pla_i/bal_b/bal_i), which is not rights-pinned by this promotion",
        status: "unavailable",
      },
      facts: [],
    },
    source_record_id: "netquity:finreport.bank_insurance_excluded:00005",
    ...overrides,
  };
}

function profileValidInput(instrumentId = "hkex_security_00001") {
  return {
    authSubject: AUTH_SUBJECT,
    instrumentId,
    requestId: "request_test",
  };
}

function createProfileRightsRow(fieldPattern: string) {
  return {
    channel: "web",
    dataset: "security_profile",
    entitlement_id: `entitlement_${fieldPattern.replaceAll(".", "_")}`,
    entitlement_source_record_id: `source:${fieldPattern}`,
    entitlement_status: "approved",
    export_allowed: false,
    field_pattern: fieldPattern,
    rights_policy_version: "netquity-collaboration-staging.v1",
    time_range_days: null,
    valid_from: "2026-07-10T00:00:00.000Z",
    valid_to: null,
    workspace_entitlement_id: `workspace_entitlement_${fieldPattern.replaceAll(".", "_")}`,
    workspace_source_record_id: `workspace-source:${fieldPattern}`,
    workspace_status: "approved",
  };
}

function createProfileRecordRow(overrides: Record<string, unknown> = {}) {
  return {
    data_version: "netquity-basicdata-test.v1",
    entity_id: "hkex_security_00001",
    payload: {
      currency: "HKD",
      exchange: "HKEX",
      lifecycle: { listedAt: "2000-01-01" },
      listingStatus: "listed",
      market: "HK",
      name: {
        en: "Alpha Holdings Limited",
        zhHans: "阿尔法控股有限公司",
        zhHant: "阿爾法控股有限公司",
      },
      symbol: "00001.HK",
    },
    source_record_id: "netquity:basicdata.stock:00001",
    ...overrides,
  };
}

function validInput(query = "00001.HK") {
  return {
    authSubject: AUTH_SUBJECT,
    query,
    requestId: "request_test",
  };
}

function createContextRow() {
  return {
    membership_id: "membership_test",
    plan_code: "pro",
    rights_policy_version: "netquity-collaboration-staging.v1",
    subscription_id: "subscription_test",
    subscription_valid_from: "2026-07-10T00:00:00.000Z",
    subscription_valid_to: null,
    workspace_id: "workspace_test",
  };
}

function createRightsRow(fieldPattern: string) {
  return {
    channel: "web",
    dataset: "security_master",
    entitlement_id: `entitlement_${fieldPattern.replaceAll(".", "_")}`,
    entitlement_source_record_id: `source:${fieldPattern}`,
    entitlement_status: "approved",
    export_allowed: false,
    field_pattern: fieldPattern,
    rights_policy_version: "netquity-collaboration-staging.v1",
    time_range_days: null,
    valid_from: "2026-07-10T00:00:00.000Z",
    valid_to: null,
    workspace_entitlement_id: `workspace_entitlement_${fieldPattern.replaceAll(".", "_")}`,
    workspace_source_record_id: `workspace-source:${fieldPattern}`,
    workspace_status: "approved",
  };
}

function createSnapshotRow() {
  return {
    as_of: "2026-07-10T16:00:00.000Z",
    data_version: "netquity-basicdata-test.v1",
    quality_state: "PASS",
    rights_policy_version: "netquity-collaboration-staging.v1",
    serving_snapshot_id: "serving-netquity-basicdata-test-v1",
  };
}

function createCandidateRow(query: string, reason: string) {
  return {
    data_version: "netquity-basicdata-test.v1",
    entity_id: "hkex_security_00001",
    match_reason: reason,
    payload: {
      aliases: [{ reason, value: query.toLocaleLowerCase("en-US") }],
      code: "00001",
      currency: "HKD",
      exchange: "HKEX",
      listingStatus: "listed",
      market: "HK",
      name: {
        en: "Alpha Holdings Limited",
        zhHans: "阿尔法控股有限公司",
        zhHant: "阿爾法控股有限公司",
      },
      symbol: "00001.HK",
    },
    source_record_id: "netquity:basicdata.stock:00001",
  };
}

function queryTexts() {
  return pgState.queries.map((query) => query.text.toLowerCase());
}

function hasServingRead() {
  return queryTexts().some((text) => text.includes("from aiphabee_core.serving_dataset dataset"));
}

function errorCode(result: { envelope: ResponseEnvelope<unknown> }) {
  return result.envelope.ok ? undefined : result.envelope.error.code;
}
