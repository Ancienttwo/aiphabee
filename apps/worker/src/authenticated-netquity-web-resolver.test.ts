import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ResponseEnvelope } from "@aiphabee/data-contracts";

const pgState = vi.hoisted(() => ({
  accountRows: [{ account_id: "account_test" }] as Record<string, unknown>[],
  candidateRows: [] as Record<string, unknown>[],
  // Keyed overrides for the two-gate derived-metrics resolver, which issues
  // two rights queries and two snapshot/record query pairs (one per
  // dataset) in a single call -- the generic FROM-clause dispatch below
  // can't tell those apart by itself. Only ever set by the "derived metrics
  // resolver" describe block (placed last in this file); every other
  // describe block leaves these empty, so the dispatcher falls through to
  // the original single-bucket fields below unchanged.
  candidateRowsBySnapshotId: {} as Record<string, Record<string, unknown>[]>,
  connectCount: 0,
  constructorCount: 0,
  contextRows: [] as Record<string, unknown>[],
  endCount: 0,
  endFails: false,
  failOn: "",
  queries: [] as Array<{ text: string; values: unknown[] }>,
  rightsRows: [] as Record<string, unknown>[],
  rightsRowsByDataset: {} as Record<string, Record<string, unknown>[]>,
  snapshotRows: [] as Record<string, unknown>[],
  snapshotRowsByDataset: {} as Record<string, Record<string, unknown>[]>,
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
        const dataset = /data_entitlement\.dataset = '([a-z_]+)'/u.exec(normalized)?.[1];
        if (dataset && pgState.rightsRowsByDataset[dataset] !== undefined) {
          return { rows: pgState.rightsRowsByDataset[dataset] };
        }
        return { rows: pgState.rightsRows };
      }
      if (normalized.includes("from aiphabee_core.serving_dataset dataset")) {
        const dataset = /dataset\.dataset = '([a-z_]+)'/u.exec(normalized)?.[1];
        const rows =
          dataset && pgState.snapshotRowsByDataset[dataset] !== undefined
            ? pgState.snapshotRowsByDataset[dataset]
            : pgState.snapshotRows;
        return {
          rows: rows.filter(
            (row) => row.rights_policy_version === values[0] && row.quality_state === "PASS",
          ),
        };
      }
      if (normalized.includes("from aiphabee_core.serving_record record")) {
        const snapshotId = values[0];
        if (typeof snapshotId === "string" && pgState.candidateRowsBySnapshotId[snapshotId] !== undefined) {
          return { rows: pgState.candidateRowsBySnapshotId[snapshotId] };
        }
        return { rows: pgState.candidateRows };
      }
      return { rows: [] };
    }
  },
}));

const {
  AUTHENTICATED_NETQUITY_CORPORATE_ACTIONS_REQUIRED_FIELDS,
  AUTHENTICATED_NETQUITY_DIRECTORATE_REQUIRED_FIELDS,
  AUTHENTICATED_NETQUITY_FINANCIAL_FACTS_REQUIRED_FIELDS,
  AUTHENTICATED_NETQUITY_OWNERSHIP_REQUIRED_FIELDS,
  AUTHENTICATED_NETQUITY_PROFILE_REQUIRED_FIELDS,
  AUTHENTICATED_NETQUITY_QUOTE_SNAPSHOT_REQUIRED_FIELDS,
  AUTHENTICATED_NETQUITY_RELATED_WARRANTS_REQUIRED_FIELDS,
  AUTHENTICATED_NETQUITY_REQUIRED_FIELDS,
  AUTHENTICATED_NETQUITY_SDI_DISCLOSURE_REQUIRED_FIELDS,
  resolveAuthenticatedNetquityCorporateActions,
  resolveAuthenticatedNetquityDerivedMetrics,
  resolveAuthenticatedNetquityDirectorate,
  resolveAuthenticatedNetquityFinancialFacts,
  resolveAuthenticatedNetquityOwnership,
  resolveAuthenticatedNetquityProfile,
  resolveAuthenticatedNetquityQuoteSnapshot,
  resolveAuthenticatedNetquityRelatedWarrants,
  resolveAuthenticatedNetquitySdiDisclosure,
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

describe("private authenticated Netquity quote snapshot resolver", () => {
  beforeEach(() => {
    pgState.accountRows = [{ account_id: "account_test" }];
    pgState.candidateRows = [createQuoteSnapshotRecordRow()];
    pgState.connectCount = 0;
    pgState.constructorCount = 0;
    pgState.contextRows = [createContextRow()];
    pgState.endCount = 0;
    pgState.endFails = false;
    pgState.failOn = "";
    pgState.queries = [];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_QUOTE_SNAPSHOT_REQUIRED_FIELDS.map(createQuoteSnapshotRightsRow);
    pgState.snapshotRows = [createQuoteSnapshotSnapshotRow()];
  });

  it.each([
    ["invalid subject", { authSubject: "email@example.com", instrumentId: "hkex_security_00700" }],
    ["malformed instrument id", { authSubject: AUTH_SUBJECT, instrumentId: "eq_hk_00700" }],
    ["empty instrument id", { authSubject: AUTH_SUBJECT, instrumentId: "" }],
  ])("rejects %s before creating a database client", async (_label, input) => {
    const result = await resolveAuthenticatedNetquityQuoteSnapshot(bindings, {
      requestId: "request_test",
      ...input,
    });

    expect(result.envelope.ok).toBe(false);
    expect(pgState.constructorCount).toBe(0);
  });

  it("stays unavailable outside staging before binding access", async () => {
    let bindingReads = 0;
    const result = await resolveAuthenticatedNetquityQuoteSnapshot(
      {
        APP_ENV: "prod",
        get AIPHABEE_HYPERDRIVE(): { connectionString?: string } | undefined {
          bindingReads += 1;
          throw new Error("production binding must not be read");
        },
      },
      quoteSnapshotValidInput(),
    );

    expect(result.status).toBe(403);
    expect(bindingReads).toBe(0);
  });

  it("returns unavailable for a missing private database binding", async () => {
    const result = await resolveAuthenticatedNetquityQuoteSnapshot(
      { APP_ENV: "staging" },
      quoteSnapshotValidInput(),
    );

    expect(result.status).toBe(424);
    expect(pgState.constructorCount).toBe(0);
  });

  it("denies an unmapped account before membership or Serving reads", async () => {
    pgState.accountRows = [{ account_id: null }];
    const result = await resolveAuthenticatedNetquityQuoteSnapshot(bindings, quoteSnapshotValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it.each(["no membership", "inactive membership", "expired subscription"])(
    "denies %s before rights or Serving reads",
    async () => {
      pgState.contextRows = [];
      const result = await resolveAuthenticatedNetquityQuoteSnapshot(bindings, quoteSnapshotValidInput());

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
    const result = await resolveAuthenticatedNetquityQuoteSnapshot(bindings, quoteSnapshotValidInput());

    expect(result.status).toBe(409);
    expect(hasServingRead()).toBe(false);
  });

  it("pins field rights to its own hardcoded market-data policy version, independent of the account's product-access policy version", async () => {
    await resolveAuthenticatedNetquityQuoteSnapshot(bindings, quoteSnapshotValidInput());

    const rightsQuery = pgState.queries.find((query) =>
      query.text.toLowerCase().includes("from aiphabee_governance.workspace_entitlement"),
    );
    expect(rightsQuery?.text).toContain("data_entitlement.dataset = 'quote_snapshot'");
    expect(rightsQuery?.text).toContain("data_entitlement.rights_policy_version = $3");
    // The account context itself still carries 'netquity-collaboration-staging.v1'
    // (createContextRow, unchanged) -- this proves quote_snapshot's rights
    // query uses the hardcoded NETQUITY_MARKET_DATA_RIGHTS_POLICY_VERSION
    // constant instead, exactly as the contract documents.
    expect(rightsQuery?.values).toEqual([
      "workspace_test",
      "subscription_test",
      "netquity-market-data-staging.v1",
    ]);
  });

  it("denies missing exact field rights before the released snapshot query", async () => {
    pgState.rightsRows = pgState.rightsRows.slice(0, -1);
    const result = await resolveAuthenticatedNetquityQuoteSnapshot(bindings, quoteSnapshotValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("denies wildcard authority even when every exact field row is also present", async () => {
    pgState.rightsRows.push(createQuoteSnapshotRightsRow("quote_snapshot.*"));
    const result = await resolveAuthenticatedNetquityQuoteSnapshot(bindings, quoteSnapshotValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("lets a blocked field win over approved rows", async () => {
    pgState.rightsRows.push({
      ...createQuoteSnapshotRightsRow("quote_snapshot.quote.close"),
      entitlement_id: "entitlement_blocked_close",
      entitlement_status: "blocked",
      workspace_entitlement_id: "workspace_entitlement_blocked_close",
      workspace_status: "blocked",
    });
    const result = await resolveAuthenticatedNetquityQuoteSnapshot(bindings, quoteSnapshotValidInput());

    expect(result.status).toBe(403);
    expect(hasServingRead()).toBe(false);
  });

  it.each([
    ["mismatched rights policy", { rights_policy_version: "netquity-market-data-staging.v2" }],
    ["non-PASS quality", { quality_state: "HOLD" }],
  ])("fails closed for a released snapshot with %s", async (_label, override) => {
    pgState.snapshotRows = [{ ...createQuoteSnapshotSnapshotRow(), ...override }];
    const result = await resolveAuthenticatedNetquityQuoteSnapshot(bindings, quoteSnapshotValidInput());

    expect(result.status).toBe(409);
    expect(errorCode(result)).toBe("DATA_QUALITY_HOLD");
    expect(
      queryTexts().some((text) => text.includes("from aiphabee_core.serving_record record")),
    ).toBe(false);
  });

  it("resolves an entitled instrument id with an available quote after rights evaluation", async () => {
    const result = await resolveAuthenticatedNetquityQuoteSnapshot(bindings, quoteSnapshotValidInput());

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.liveDataAccess).toBe(true);
      expect(result.envelope.data.coverage).toEqual({ status: "available" });
      expect(result.envelope.data.quote).toMatchObject({ close: 461.2, tradeDate: "2026-07-07" });
    }
    const texts = queryTexts();
    expect(texts.findIndex((text) => text.includes("from aiphabee_governance.workspace_entitlement"))).toBeLessThan(
      texts.findIndex((text) => text.includes("from aiphabee_core.serving_dataset dataset")),
    );
  });

  it("resolves an entitled no-daily-row instrument id with an unavailable coverage marker, never a fabricated quote", async () => {
    pgState.candidateRows = [createUnavailableQuoteSnapshotRecordRow()];
    const result = await resolveAuthenticatedNetquityQuoteSnapshot(
      bindings,
      quoteSnapshotValidInput("hkex_security_09999"),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.coverage?.status).toBe("unavailable");
      expect(result.envelope.data.quote).toBeUndefined();
    }
  });

  it("returns 404 NOT_FOUND when no released row matches the instrument id, never a synthetic fallback", async () => {
    pgState.candidateRows = [];
    const result = await resolveAuthenticatedNetquityQuoteSnapshot(bindings, quoteSnapshotValidInput());

    expect(result.status).toBe(404);
    expect(errorCode(result)).toBe("NOT_FOUND");
  });

  it("fails closed on a malformed released row rather than exposing it", async () => {
    pgState.candidateRows = [{ ...createQuoteSnapshotRecordRow(), data_version: "wrong-version" }];
    const result = await resolveAuthenticatedNetquityQuoteSnapshot(bindings, quoteSnapshotValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
  });

  it("returns an explicit failure and closes the client on database error", async () => {
    pgState.failOn = "from aiphabee_governance.workspace_entitlement";
    const result = await resolveAuthenticatedNetquityQuoteSnapshot(bindings, quoteSnapshotValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
    expect(hasServingRead()).toBe(false);
  });

  it("does not return an authorized result when the database client cannot close", async () => {
    pgState.endFails = true;

    const result = await resolveAuthenticatedNetquityQuoteSnapshot(bindings, quoteSnapshotValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
  });
});

describe("private authenticated Netquity corporate actions resolver", () => {
  beforeEach(() => {
    pgState.accountRows = [{ account_id: "account_test" }];
    pgState.candidateRows = [createCorporateActionsRecordRow()];
    pgState.connectCount = 0;
    pgState.constructorCount = 0;
    pgState.contextRows = [createContextRow()];
    pgState.endCount = 0;
    pgState.endFails = false;
    pgState.failOn = "";
    pgState.queries = [];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_CORPORATE_ACTIONS_REQUIRED_FIELDS.map(createCorporateActionsRightsRow);
    pgState.snapshotRows = [createSnapshotRow()];
  });

  it.each([
    ["invalid subject", { authSubject: "email@example.com", instrumentId: "hkex_security_00697" }],
    ["malformed instrument id", { authSubject: AUTH_SUBJECT, instrumentId: "eq_hk_00697" }],
    ["empty instrument id", { authSubject: AUTH_SUBJECT, instrumentId: "" }],
  ])("rejects %s before creating a database client", async (_label, input) => {
    const result = await resolveAuthenticatedNetquityCorporateActions(bindings, {
      requestId: "request_test",
      ...input,
    });

    expect(result.envelope.ok).toBe(false);
    expect(pgState.constructorCount).toBe(0);
  });

  it("stays unavailable outside staging before binding access", async () => {
    let bindingReads = 0;
    const result = await resolveAuthenticatedNetquityCorporateActions(
      {
        APP_ENV: "prod",
        get AIPHABEE_HYPERDRIVE(): { connectionString?: string } | undefined {
          bindingReads += 1;
          throw new Error("production binding must not be read");
        },
      },
      corporateActionsValidInput(),
    );

    expect(result.status).toBe(403);
    expect(bindingReads).toBe(0);
  });

  it("returns unavailable for a missing private database binding", async () => {
    const result = await resolveAuthenticatedNetquityCorporateActions(
      { APP_ENV: "staging" },
      corporateActionsValidInput(),
    );

    expect(result.status).toBe(424);
    expect(pgState.constructorCount).toBe(0);
  });

  it("denies an unmapped account before membership or Serving reads", async () => {
    pgState.accountRows = [{ account_id: null }];
    const result = await resolveAuthenticatedNetquityCorporateActions(bindings, corporateActionsValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it.each(["no membership", "inactive membership", "expired subscription"])(
    "denies %s before rights or Serving reads",
    async () => {
      pgState.contextRows = [];
      const result = await resolveAuthenticatedNetquityCorporateActions(bindings, corporateActionsValidInput());

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
    const result = await resolveAuthenticatedNetquityCorporateActions(bindings, corporateActionsValidInput());

    expect(result.status).toBe(409);
    expect(hasServingRead()).toBe(false);
  });

  it("pins field rights to the active product-access policy version", async () => {
    await resolveAuthenticatedNetquityCorporateActions(bindings, corporateActionsValidInput());

    const rightsQuery = pgState.queries.find((query) =>
      query.text.toLowerCase().includes("from aiphabee_governance.workspace_entitlement"),
    );
    expect(rightsQuery?.text).toContain("data_entitlement.dataset = 'corporate_actions'");
    expect(rightsQuery?.text).toContain("data_entitlement.rights_policy_version = $3");
    expect(rightsQuery?.values).toEqual([
      "workspace_test",
      "subscription_test",
      "netquity-collaboration-staging.v1",
    ]);
  });

  it("denies missing exact field rights before the released snapshot query", async () => {
    pgState.rightsRows = pgState.rightsRows.slice(0, -1);
    const result = await resolveAuthenticatedNetquityCorporateActions(bindings, corporateActionsValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("denies wildcard authority even when every exact field row is also present", async () => {
    pgState.rightsRows.push(createCorporateActionsRightsRow("corporate_actions.*"));
    const result = await resolveAuthenticatedNetquityCorporateActions(bindings, corporateActionsValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("lets a blocked field win over approved rows", async () => {
    pgState.rightsRows.push({
      ...createCorporateActionsRightsRow("corporate_actions.actions.dividend"),
      entitlement_id: "entitlement_blocked_dividend",
      entitlement_status: "blocked",
      workspace_entitlement_id: "workspace_entitlement_blocked_dividend",
      workspace_status: "blocked",
    });
    const result = await resolveAuthenticatedNetquityCorporateActions(bindings, corporateActionsValidInput());

    expect(result.status).toBe(403);
    expect(hasServingRead()).toBe(false);
  });

  it.each([
    ["mismatched rights policy", { rights_policy_version: "netquity-collaboration-staging.v2" }],
    ["non-PASS quality", { quality_state: "HOLD" }],
  ])("fails closed for a released snapshot with %s", async (_label, override) => {
    pgState.snapshotRows = [{ ...createSnapshotRow(), ...override }];
    const result = await resolveAuthenticatedNetquityCorporateActions(bindings, corporateActionsValidInput());

    expect(result.status).toBe(409);
    expect(errorCode(result)).toBe("DATA_QUALITY_HOLD");
    expect(
      queryTexts().some((text) => text.includes("from aiphabee_core.serving_record record")),
    ).toBe(false);
  });

  it("resolves an entitled instrument id with available actions after rights evaluation", async () => {
    const result = await resolveAuthenticatedNetquityCorporateActions(bindings, corporateActionsValidInput());

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.liveDataAccess).toBe(true);
      expect(result.envelope.data.coverage).toEqual({ status: "available" });
      expect(result.envelope.data.actions?.map((action) => action.actionType)).toEqual(["dividend", "buyback"]);
    }
    const texts = queryTexts();
    expect(texts.findIndex((text) => text.includes("from aiphabee_governance.workspace_entitlement"))).toBeLessThan(
      texts.findIndex((text) => text.includes("from aiphabee_core.serving_dataset dataset")),
    );
  });

  it("resolves an entitled zero-event instrument id with an unavailable coverage marker, never fabricated actions", async () => {
    pgState.candidateRows = [createUnavailableCorporateActionsRecordRow()];
    const result = await resolveAuthenticatedNetquityCorporateActions(
      bindings,
      corporateActionsValidInput("hkex_security_00007"),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.coverage?.status).toBe("unavailable");
      expect(result.envelope.data.actions).toEqual([]);
    }
  });

  it("returns 404 NOT_FOUND when no released row matches the instrument id, never a synthetic fallback", async () => {
    pgState.candidateRows = [];
    const result = await resolveAuthenticatedNetquityCorporateActions(bindings, corporateActionsValidInput());

    expect(result.status).toBe(404);
    expect(errorCode(result)).toBe("NOT_FOUND");
  });

  it("fails closed on a malformed released row rather than exposing it", async () => {
    pgState.candidateRows = [{ ...createCorporateActionsRecordRow(), data_version: "wrong-version" }];
    const result = await resolveAuthenticatedNetquityCorporateActions(bindings, corporateActionsValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
  });

  it("returns an explicit failure and closes the client on database error", async () => {
    pgState.failOn = "from aiphabee_governance.workspace_entitlement";
    const result = await resolveAuthenticatedNetquityCorporateActions(bindings, corporateActionsValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
    expect(hasServingRead()).toBe(false);
  });

  it("does not return an authorized result when the database client cannot close", async () => {
    pgState.endFails = true;

    const result = await resolveAuthenticatedNetquityCorporateActions(bindings, corporateActionsValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
  });
});

describe("private authenticated Netquity sdi disclosure resolver", () => {
  beforeEach(() => {
    pgState.accountRows = [{ account_id: "account_test" }];
    pgState.candidateRows = [createSdiDisclosureRecordRow()];
    pgState.connectCount = 0;
    pgState.constructorCount = 0;
    pgState.contextRows = [createContextRow()];
    pgState.endCount = 0;
    pgState.endFails = false;
    pgState.failOn = "";
    pgState.queries = [];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_SDI_DISCLOSURE_REQUIRED_FIELDS.map(createSdiDisclosureRightsRow);
    pgState.snapshotRows = [createSnapshotRow()];
  });

  it.each([
    ["invalid subject", { authSubject: "email@example.com", instrumentId: "hkex_security_00001" }],
    ["malformed instrument id", { authSubject: AUTH_SUBJECT, instrumentId: "eq_hk_00001" }],
    ["empty instrument id", { authSubject: AUTH_SUBJECT, instrumentId: "" }],
  ])("rejects %s before creating a database client", async (_label, input) => {
    const result = await resolveAuthenticatedNetquitySdiDisclosure(bindings, {
      requestId: "request_test",
      ...input,
    });

    expect(result.envelope.ok).toBe(false);
    expect(pgState.constructorCount).toBe(0);
  });

  it("stays unavailable outside staging before binding access", async () => {
    let bindingReads = 0;
    const result = await resolveAuthenticatedNetquitySdiDisclosure(
      {
        APP_ENV: "prod",
        get AIPHABEE_HYPERDRIVE(): { connectionString?: string } | undefined {
          bindingReads += 1;
          throw new Error("production binding must not be read");
        },
      },
      sdiDisclosureValidInput(),
    );

    expect(result.status).toBe(403);
    expect(bindingReads).toBe(0);
  });

  it("returns unavailable for a missing private database binding", async () => {
    const result = await resolveAuthenticatedNetquitySdiDisclosure(
      { APP_ENV: "staging" },
      sdiDisclosureValidInput(),
    );

    expect(result.status).toBe(424);
    expect(pgState.constructorCount).toBe(0);
  });

  it("denies an unmapped account before membership or Serving reads", async () => {
    pgState.accountRows = [{ account_id: null }];
    const result = await resolveAuthenticatedNetquitySdiDisclosure(bindings, sdiDisclosureValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it.each(["no membership", "inactive membership", "expired subscription"])(
    "denies %s before rights or Serving reads",
    async () => {
      pgState.contextRows = [];
      const result = await resolveAuthenticatedNetquitySdiDisclosure(bindings, sdiDisclosureValidInput());

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
    const result = await resolveAuthenticatedNetquitySdiDisclosure(bindings, sdiDisclosureValidInput());

    expect(result.status).toBe(409);
    expect(hasServingRead()).toBe(false);
  });

  it("pins field rights to the active product-access policy version", async () => {
    await resolveAuthenticatedNetquitySdiDisclosure(bindings, sdiDisclosureValidInput());

    const rightsQuery = pgState.queries.find((query) =>
      query.text.toLowerCase().includes("from aiphabee_governance.workspace_entitlement"),
    );
    expect(rightsQuery?.text).toContain("data_entitlement.dataset = 'sdi_disclosure'");
    expect(rightsQuery?.text).toContain("data_entitlement.rights_policy_version = $3");
    expect(rightsQuery?.values).toEqual([
      "workspace_test",
      "subscription_test",
      "netquity-collaboration-staging.v1",
    ]);
  });

  it("denies missing exact field rights before the released snapshot query", async () => {
    pgState.rightsRows = pgState.rightsRows.slice(0, -1);
    const result = await resolveAuthenticatedNetquitySdiDisclosure(bindings, sdiDisclosureValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("denies wildcard authority even when every exact field row is also present", async () => {
    pgState.rightsRows.push(createSdiDisclosureRightsRow("sdi_disclosure.*"));
    const result = await resolveAuthenticatedNetquitySdiDisclosure(bindings, sdiDisclosureValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("lets a blocked field win over approved rows", async () => {
    pgState.rightsRows.push({
      ...createSdiDisclosureRightsRow("sdi_disclosure.disclosures.long"),
      entitlement_id: "entitlement_blocked_long",
      entitlement_status: "blocked",
      workspace_entitlement_id: "workspace_entitlement_blocked_long",
      workspace_status: "blocked",
    });
    const result = await resolveAuthenticatedNetquitySdiDisclosure(bindings, sdiDisclosureValidInput());

    expect(result.status).toBe(403);
    expect(hasServingRead()).toBe(false);
  });

  it.each([
    ["mismatched rights policy", { rights_policy_version: "netquity-collaboration-staging.v2" }],
    ["non-PASS quality", { quality_state: "HOLD" }],
  ])("fails closed for a released snapshot with %s", async (_label, override) => {
    pgState.snapshotRows = [{ ...createSnapshotRow(), ...override }];
    const result = await resolveAuthenticatedNetquitySdiDisclosure(bindings, sdiDisclosureValidInput());

    expect(result.status).toBe(409);
    expect(errorCode(result)).toBe("DATA_QUALITY_HOLD");
    expect(
      queryTexts().some((text) => text.includes("from aiphabee_core.serving_record record")),
    ).toBe(false);
  });

  it("resolves an entitled instrument id with available disclosures after rights evaluation", async () => {
    const result = await resolveAuthenticatedNetquitySdiDisclosure(bindings, sdiDisclosureValidInput());

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.liveDataAccess).toBe(true);
      expect(result.envelope.data.coverage).toEqual({ status: "available" });
      expect(result.envelope.data.disclosures?.map((disclosure) => disclosure.formType)).toEqual(["2"]);
      expect(result.envelope.data.disclosures?.[0].positions.map((position) => position.positionType)).toEqual([
        "long",
        "short",
      ]);
    }
    const texts = queryTexts();
    expect(texts.findIndex((text) => text.includes("from aiphabee_governance.workspace_entitlement"))).toBeLessThan(
      texts.findIndex((text) => text.includes("from aiphabee_core.serving_dataset dataset")),
    );
  });

  it("resolves an entitled zero-filing instrument id with an unavailable coverage marker, never fabricated disclosures", async () => {
    pgState.candidateRows = [createUnavailableSdiDisclosureRecordRow()];
    const result = await resolveAuthenticatedNetquitySdiDisclosure(
      bindings,
      sdiDisclosureValidInput("hkex_security_00007"),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.coverage?.status).toBe("unavailable");
      expect(result.envelope.data.disclosures).toEqual([]);
    }
  });

  it("returns 404 NOT_FOUND when no released row matches the instrument id, never a synthetic fallback", async () => {
    pgState.candidateRows = [];
    const result = await resolveAuthenticatedNetquitySdiDisclosure(bindings, sdiDisclosureValidInput());

    expect(result.status).toBe(404);
    expect(errorCode(result)).toBe("NOT_FOUND");
  });

  it("fails closed on a malformed released row rather than exposing it", async () => {
    pgState.candidateRows = [{ ...createSdiDisclosureRecordRow(), data_version: "wrong-version" }];
    const result = await resolveAuthenticatedNetquitySdiDisclosure(bindings, sdiDisclosureValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
  });

  it("returns an explicit failure and closes the client on database error", async () => {
    pgState.failOn = "from aiphabee_governance.workspace_entitlement";
    const result = await resolveAuthenticatedNetquitySdiDisclosure(bindings, sdiDisclosureValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
    expect(hasServingRead()).toBe(false);
  });

  it("does not return an authorized result when the database client cannot close", async () => {
    pgState.endFails = true;

    const result = await resolveAuthenticatedNetquitySdiDisclosure(bindings, sdiDisclosureValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
  });
});

describe("private authenticated Netquity directorate resolver", () => {
  beforeEach(() => {
    pgState.accountRows = [{ account_id: "account_test" }];
    pgState.candidateRows = [createDirectorateRecordRow()];
    pgState.connectCount = 0;
    pgState.constructorCount = 0;
    pgState.contextRows = [createContextRow()];
    pgState.endCount = 0;
    pgState.endFails = false;
    pgState.failOn = "";
    pgState.queries = [];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_DIRECTORATE_REQUIRED_FIELDS.map(createDirectorateRightsRow);
    pgState.snapshotRows = [createSnapshotRow()];
  });

  it.each([
    ["invalid subject", { authSubject: "email@example.com", instrumentId: "hkex_security_00001" }],
    ["malformed instrument id", { authSubject: AUTH_SUBJECT, instrumentId: "eq_hk_00001" }],
    ["empty instrument id", { authSubject: AUTH_SUBJECT, instrumentId: "" }],
  ])("rejects %s before creating a database client", async (_label, input) => {
    const result = await resolveAuthenticatedNetquityDirectorate(bindings, {
      requestId: "request_test",
      ...input,
    });

    expect(result.envelope.ok).toBe(false);
    expect(pgState.constructorCount).toBe(0);
  });

  it("stays unavailable outside staging before binding access", async () => {
    let bindingReads = 0;
    const result = await resolveAuthenticatedNetquityDirectorate(
      {
        APP_ENV: "prod",
        get AIPHABEE_HYPERDRIVE(): { connectionString?: string } | undefined {
          bindingReads += 1;
          throw new Error("production binding must not be read");
        },
      },
      directorateValidInput(),
    );

    expect(result.status).toBe(403);
    expect(bindingReads).toBe(0);
  });

  it("returns unavailable for a missing private database binding", async () => {
    const result = await resolveAuthenticatedNetquityDirectorate(
      { APP_ENV: "staging" },
      directorateValidInput(),
    );

    expect(result.status).toBe(424);
    expect(pgState.constructorCount).toBe(0);
  });

  it("denies an unmapped account before membership or Serving reads", async () => {
    pgState.accountRows = [{ account_id: null }];
    const result = await resolveAuthenticatedNetquityDirectorate(bindings, directorateValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it.each(["no membership", "inactive membership", "expired subscription"])(
    "denies %s before rights or Serving reads",
    async () => {
      pgState.contextRows = [];
      const result = await resolveAuthenticatedNetquityDirectorate(bindings, directorateValidInput());

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
    const result = await resolveAuthenticatedNetquityDirectorate(bindings, directorateValidInput());

    expect(result.status).toBe(409);
    expect(hasServingRead()).toBe(false);
  });

  it("pins field rights to the active product-access policy version", async () => {
    await resolveAuthenticatedNetquityDirectorate(bindings, directorateValidInput());

    const rightsQuery = pgState.queries.find((query) =>
      query.text.toLowerCase().includes("from aiphabee_governance.workspace_entitlement"),
    );
    expect(rightsQuery?.text).toContain("data_entitlement.dataset = 'directorate'");
    expect(rightsQuery?.text).toContain("data_entitlement.rights_policy_version = $3");
    expect(rightsQuery?.values).toEqual([
      "workspace_test",
      "subscription_test",
      "netquity-collaboration-staging.v1",
    ]);
  });

  it("denies missing exact field rights before the released snapshot query", async () => {
    pgState.rightsRows = pgState.rightsRows.slice(0, -1);
    const result = await resolveAuthenticatedNetquityDirectorate(bindings, directorateValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("denies wildcard authority even when every exact field row is also present", async () => {
    pgState.rightsRows.push(createDirectorateRightsRow("directorate.*"));
    const result = await resolveAuthenticatedNetquityDirectorate(bindings, directorateValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("lets a blocked field win over approved rows", async () => {
    pgState.rightsRows.push({
      ...createDirectorateRightsRow("directorate.directors.remuneration"),
      entitlement_id: "entitlement_blocked_remuneration",
      entitlement_status: "blocked",
      workspace_entitlement_id: "workspace_entitlement_blocked_remuneration",
      workspace_status: "blocked",
    });
    const result = await resolveAuthenticatedNetquityDirectorate(bindings, directorateValidInput());

    expect(result.status).toBe(403);
    expect(hasServingRead()).toBe(false);
  });

  it.each([
    ["mismatched rights policy", { rights_policy_version: "netquity-collaboration-staging.v2" }],
    ["non-PASS quality", { quality_state: "HOLD" }],
  ])("fails closed for a released snapshot with %s", async (_label, override) => {
    pgState.snapshotRows = [{ ...createSnapshotRow(), ...override }];
    const result = await resolveAuthenticatedNetquityDirectorate(bindings, directorateValidInput());

    expect(result.status).toBe(409);
    expect(errorCode(result)).toBe("DATA_QUALITY_HOLD");
    expect(
      queryTexts().some((text) => text.includes("from aiphabee_core.serving_record record")),
    ).toBe(false);
  });

  it("resolves an entitled instrument id with available directors after rights evaluation", async () => {
    const result = await resolveAuthenticatedNetquityDirectorate(bindings, directorateValidInput());

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.liveDataAccess).toBe(true);
      expect(result.envelope.data.coverage).toEqual({ status: "available" });
      expect(result.envelope.data.directors?.map((director) => director.capacity)).toEqual(["D", "S"]);
      expect(result.envelope.data.directors?.[0].remuneration?.currentAmount).toBe(53180000);
    }
    const texts = queryTexts();
    expect(texts.findIndex((text) => text.includes("from aiphabee_governance.workspace_entitlement"))).toBeLessThan(
      texts.findIndex((text) => text.includes("from aiphabee_core.serving_dataset dataset")),
    );
  });

  it("resolves an entitled zero-biography instrument id with an unavailable coverage marker, never fabricated directors", async () => {
    pgState.candidateRows = [createUnavailableDirectorateRecordRow()];
    const result = await resolveAuthenticatedNetquityDirectorate(
      bindings,
      directorateValidInput("hkex_security_01687"),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.coverage?.status).toBe("unavailable");
      expect(result.envelope.data.directors).toEqual([]);
    }
  });

  it("returns 404 NOT_FOUND when no released row matches the instrument id, never a synthetic fallback", async () => {
    pgState.candidateRows = [];
    const result = await resolveAuthenticatedNetquityDirectorate(bindings, directorateValidInput());

    expect(result.status).toBe(404);
    expect(errorCode(result)).toBe("NOT_FOUND");
  });

  it("fails closed on a malformed released row rather than exposing it", async () => {
    pgState.candidateRows = [{ ...createDirectorateRecordRow(), data_version: "wrong-version" }];
    const result = await resolveAuthenticatedNetquityDirectorate(bindings, directorateValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
  });

  it("returns an explicit failure and closes the client on database error", async () => {
    pgState.failOn = "from aiphabee_governance.workspace_entitlement";
    const result = await resolveAuthenticatedNetquityDirectorate(bindings, directorateValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
    expect(hasServingRead()).toBe(false);
  });

  it("does not return an authorized result when the database client cannot close", async () => {
    pgState.endFails = true;

    const result = await resolveAuthenticatedNetquityDirectorate(bindings, directorateValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
  });
});

describe("private authenticated Netquity ownership resolver", () => {
  beforeEach(() => {
    pgState.accountRows = [{ account_id: "account_test" }];
    pgState.candidateRows = [createOwnershipRecordRow()];
    pgState.connectCount = 0;
    pgState.constructorCount = 0;
    pgState.contextRows = [createContextRow()];
    pgState.endCount = 0;
    pgState.endFails = false;
    pgState.failOn = "";
    pgState.queries = [];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_OWNERSHIP_REQUIRED_FIELDS.map(createOwnershipRightsRow);
    pgState.snapshotRows = [createSnapshotRow()];
  });

  it.each([
    ["invalid subject", { authSubject: "email@example.com", instrumentId: "hkex_security_00001" }],
    ["malformed instrument id", { authSubject: AUTH_SUBJECT, instrumentId: "eq_hk_00001" }],
    ["empty instrument id", { authSubject: AUTH_SUBJECT, instrumentId: "" }],
  ])("rejects %s before creating a database client", async (_label, input) => {
    const result = await resolveAuthenticatedNetquityOwnership(bindings, {
      requestId: "request_test",
      ...input,
    });

    expect(result.envelope.ok).toBe(false);
    expect(pgState.constructorCount).toBe(0);
  });

  it("stays unavailable outside staging before binding access", async () => {
    let bindingReads = 0;
    const result = await resolveAuthenticatedNetquityOwnership(
      {
        APP_ENV: "prod",
        get AIPHABEE_HYPERDRIVE(): { connectionString?: string } | undefined {
          bindingReads += 1;
          throw new Error("production binding must not be read");
        },
      },
      ownershipValidInput(),
    );

    expect(result.status).toBe(403);
    expect(bindingReads).toBe(0);
  });

  it("returns unavailable for a missing private database binding", async () => {
    const result = await resolveAuthenticatedNetquityOwnership(
      { APP_ENV: "staging" },
      ownershipValidInput(),
    );

    expect(result.status).toBe(424);
    expect(pgState.constructorCount).toBe(0);
  });

  it("denies an unmapped account before membership or Serving reads", async () => {
    pgState.accountRows = [{ account_id: null }];
    const result = await resolveAuthenticatedNetquityOwnership(bindings, ownershipValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it.each(["no membership", "inactive membership", "expired subscription"])(
    "denies %s before rights or Serving reads",
    async () => {
      pgState.contextRows = [];
      const result = await resolveAuthenticatedNetquityOwnership(bindings, ownershipValidInput());

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
    const result = await resolveAuthenticatedNetquityOwnership(bindings, ownershipValidInput());

    expect(result.status).toBe(409);
    expect(hasServingRead()).toBe(false);
  });

  it("pins field rights to the active product-access policy version", async () => {
    await resolveAuthenticatedNetquityOwnership(bindings, ownershipValidInput());

    const rightsQuery = pgState.queries.find((query) =>
      query.text.toLowerCase().includes("from aiphabee_governance.workspace_entitlement"),
    );
    expect(rightsQuery?.text).toContain("data_entitlement.dataset = 'ownership'");
    expect(rightsQuery?.text).toContain("data_entitlement.rights_policy_version = $3");
    expect(rightsQuery?.values).toEqual([
      "workspace_test",
      "subscription_test",
      "netquity-collaboration-staging.v1",
    ]);
  });

  it("denies missing exact field rights before the released snapshot query", async () => {
    pgState.rightsRows = pgState.rightsRows.slice(0, -1);
    const result = await resolveAuthenticatedNetquityOwnership(bindings, ownershipValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("denies wildcard authority even when every exact field row is also present", async () => {
    pgState.rightsRows.push(createOwnershipRightsRow("ownership.*"));
    const result = await resolveAuthenticatedNetquityOwnership(bindings, ownershipValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("lets a blocked field win over approved rows", async () => {
    pgState.rightsRows.push({
      ...createOwnershipRightsRow("ownership.holders.crossHolding"),
      entitlement_id: "entitlement_blocked_cross_holding",
      entitlement_status: "blocked",
      workspace_entitlement_id: "workspace_entitlement_blocked_cross_holding",
      workspace_status: "blocked",
    });
    const result = await resolveAuthenticatedNetquityOwnership(bindings, ownershipValidInput());

    expect(result.status).toBe(403);
    expect(hasServingRead()).toBe(false);
  });

  it.each([
    ["mismatched rights policy", { rights_policy_version: "netquity-collaboration-staging.v2" }],
    ["non-PASS quality", { quality_state: "HOLD" }],
  ])("fails closed for a released snapshot with %s", async (_label, override) => {
    pgState.snapshotRows = [{ ...createSnapshotRow(), ...override }];
    const result = await resolveAuthenticatedNetquityOwnership(bindings, ownershipValidInput());

    expect(result.status).toBe(409);
    expect(errorCode(result)).toBe("DATA_QUALITY_HOLD");
    expect(
      queryTexts().some((text) => text.includes("from aiphabee_core.serving_record record")),
    ).toBe(false);
  });

  it("resolves an entitled instrument id with available shareCapital/freeFloat/holders after rights evaluation", async () => {
    const result = await resolveAuthenticatedNetquityOwnership(bindings, ownershipValidInput());

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.liveDataAccess).toBe(true);
      expect(result.envelope.data.coverage).toEqual({ status: "available" });
      expect(result.envelope.data.shareCapital?.issuedShares).toBe(3830044500);
      expect(result.envelope.data.freeFloat?.freeFloatPercent).toBe(69.64);
      expect(result.envelope.data.holders?.map((holder) => holder.holderType)).toEqual(["I", "F"]);
    }
    const texts = queryTexts();
    expect(texts.findIndex((text) => text.includes("from aiphabee_governance.workspace_entitlement"))).toBeLessThan(
      texts.findIndex((text) => text.includes("from aiphabee_core.serving_dataset dataset")),
    );
  });

  it("resolves an entitled zero-coverage instrument id with an unavailable coverage marker, never fabricated buckets", async () => {
    pgState.candidateRows = [createUnavailableOwnershipRecordRow()];
    const result = await resolveAuthenticatedNetquityOwnership(
      bindings,
      ownershipValidInput("hkex_security_09999"),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.coverage?.status).toBe("unavailable");
      expect(result.envelope.data.shareCapital).toBeUndefined();
      expect(result.envelope.data.freeFloat).toBeUndefined();
      expect(result.envelope.data.holders).toBeUndefined();
    }
  });

  it("returns 404 NOT_FOUND when no released row matches the instrument id, never a synthetic fallback", async () => {
    pgState.candidateRows = [];
    const result = await resolveAuthenticatedNetquityOwnership(bindings, ownershipValidInput());

    expect(result.status).toBe(404);
    expect(errorCode(result)).toBe("NOT_FOUND");
  });

  it("fails closed on a malformed released row rather than exposing it", async () => {
    pgState.candidateRows = [{ ...createOwnershipRecordRow(), data_version: "wrong-version" }];
    const result = await resolveAuthenticatedNetquityOwnership(bindings, ownershipValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
  });

  it("returns an explicit failure and closes the client on database error", async () => {
    pgState.failOn = "from aiphabee_governance.workspace_entitlement";
    const result = await resolveAuthenticatedNetquityOwnership(bindings, ownershipValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
    expect(hasServingRead()).toBe(false);
  });

  it("does not return an authorized result when the database client cannot close", async () => {
    pgState.endFails = true;

    const result = await resolveAuthenticatedNetquityOwnership(bindings, ownershipValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
  });
});

describe("private authenticated Netquity related-warrants resolver", () => {
  beforeEach(() => {
    pgState.accountRows = [{ account_id: "account_test" }];
    pgState.candidateRows = [createRelatedWarrantsRecordRow()];
    pgState.connectCount = 0;
    pgState.constructorCount = 0;
    pgState.contextRows = [createContextRow()];
    pgState.endCount = 0;
    pgState.endFails = false;
    pgState.failOn = "";
    pgState.queries = [];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_RELATED_WARRANTS_REQUIRED_FIELDS.map(createRelatedWarrantsRightsRow);
    pgState.snapshotRows = [createSnapshotRow()];
  });

  it.each([
    ["invalid subject", { authSubject: "email@example.com", instrumentId: "hkex_security_00001" }],
    ["malformed instrument id", { authSubject: AUTH_SUBJECT, instrumentId: "eq_hk_00001" }],
    ["empty instrument id", { authSubject: AUTH_SUBJECT, instrumentId: "" }],
  ])("rejects %s before creating a database client", async (_label, input) => {
    const result = await resolveAuthenticatedNetquityRelatedWarrants(bindings, {
      requestId: "request_test",
      ...input,
    });

    expect(result.envelope.ok).toBe(false);
    expect(pgState.constructorCount).toBe(0);
  });

  it("stays unavailable outside staging before binding access", async () => {
    let bindingReads = 0;
    const result = await resolveAuthenticatedNetquityRelatedWarrants(
      {
        APP_ENV: "prod",
        get AIPHABEE_HYPERDRIVE(): { connectionString?: string } | undefined {
          bindingReads += 1;
          throw new Error("production binding must not be read");
        },
      },
      relatedWarrantsValidInput(),
    );

    expect(result.status).toBe(403);
    expect(bindingReads).toBe(0);
  });

  it("returns unavailable for a missing private database binding", async () => {
    const result = await resolveAuthenticatedNetquityRelatedWarrants(
      { APP_ENV: "staging" },
      relatedWarrantsValidInput(),
    );

    expect(result.status).toBe(424);
    expect(pgState.constructorCount).toBe(0);
  });

  it("denies an unmapped account before membership or Serving reads", async () => {
    pgState.accountRows = [{ account_id: null }];
    const result = await resolveAuthenticatedNetquityRelatedWarrants(bindings, relatedWarrantsValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it.each(["no membership", "inactive membership", "expired subscription"])(
    "denies %s before rights or Serving reads",
    async () => {
      pgState.contextRows = [];
      const result = await resolveAuthenticatedNetquityRelatedWarrants(bindings, relatedWarrantsValidInput());

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
    const result = await resolveAuthenticatedNetquityRelatedWarrants(bindings, relatedWarrantsValidInput());

    expect(result.status).toBe(409);
    expect(hasServingRead()).toBe(false);
  });

  it("pins field rights to the active product-access policy version", async () => {
    await resolveAuthenticatedNetquityRelatedWarrants(bindings, relatedWarrantsValidInput());

    const rightsQuery = pgState.queries.find((query) =>
      query.text.toLowerCase().includes("from aiphabee_governance.workspace_entitlement"),
    );
    expect(rightsQuery?.text).toContain("data_entitlement.dataset = 'related_warrants'");
    expect(rightsQuery?.text).toContain("data_entitlement.rights_policy_version = $3");
    expect(rightsQuery?.values).toEqual([
      "workspace_test",
      "subscription_test",
      "netquity-collaboration-staging.v1",
    ]);
  });

  it("denies missing exact field rights before the released snapshot query", async () => {
    pgState.rightsRows = pgState.rightsRows.slice(0, -1);
    const result = await resolveAuthenticatedNetquityRelatedWarrants(bindings, relatedWarrantsValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("denies wildcard authority even when every exact field row is also present", async () => {
    pgState.rightsRows.push(createRelatedWarrantsRightsRow("related_warrants.*"));
    const result = await resolveAuthenticatedNetquityRelatedWarrants(bindings, relatedWarrantsValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("lets a blocked field win over approved rows", async () => {
    pgState.rightsRows.push({
      ...createRelatedWarrantsRightsRow("related_warrants.warrants"),
      entitlement_id: "entitlement_blocked_warrants",
      entitlement_status: "blocked",
      workspace_entitlement_id: "workspace_entitlement_blocked_warrants",
      workspace_status: "blocked",
    });
    const result = await resolveAuthenticatedNetquityRelatedWarrants(bindings, relatedWarrantsValidInput());

    expect(result.status).toBe(403);
    expect(hasServingRead()).toBe(false);
  });

  it.each([
    ["mismatched rights policy", { rights_policy_version: "netquity-collaboration-staging.v2" }],
    ["non-PASS quality", { quality_state: "HOLD" }],
  ])("fails closed for a released snapshot with %s", async (_label, override) => {
    pgState.snapshotRows = [{ ...createSnapshotRow(), ...override }];
    const result = await resolveAuthenticatedNetquityRelatedWarrants(bindings, relatedWarrantsValidInput());

    expect(result.status).toBe(409);
    expect(errorCode(result)).toBe("DATA_QUALITY_HOLD");
    expect(
      queryTexts().some((text) => text.includes("from aiphabee_core.serving_record record")),
    ).toBe(false);
  });

  it("resolves an entitled instrument id with available warrants after rights evaluation", async () => {
    const result = await resolveAuthenticatedNetquityRelatedWarrants(bindings, relatedWarrantsValidInput());

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.liveDataAccess).toBe(true);
      expect(result.envelope.data.coverage).toEqual({ status: "available" });
      expect(result.envelope.data.warrants?.map((warrant) => warrant.category)).toEqual([
        "dp_warrant",
        "dc_warrant",
      ]);
      expect(result.envelope.data.warrants?.[0]?.instrumentId).toBe("hkex_security_14662");
    }
    const texts = queryTexts();
    expect(texts.findIndex((text) => text.includes("from aiphabee_governance.workspace_entitlement"))).toBeLessThan(
      texts.findIndex((text) => text.includes("from aiphabee_core.serving_dataset dataset")),
    );
  });

  it("resolves an entitled zero-coverage instrument id with an unavailable coverage marker, never a fabricated warrants array", async () => {
    pgState.candidateRows = [createUnavailableRelatedWarrantsRecordRow()];
    const result = await resolveAuthenticatedNetquityRelatedWarrants(
      bindings,
      relatedWarrantsValidInput("hkex_security_00007"),
    );

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.coverage?.status).toBe("unavailable");
      expect(result.envelope.data.warrants).toBeUndefined();
    }
  });

  it("returns 404 NOT_FOUND when no released row matches the instrument id, never a synthetic fallback", async () => {
    pgState.candidateRows = [];
    const result = await resolveAuthenticatedNetquityRelatedWarrants(bindings, relatedWarrantsValidInput());

    expect(result.status).toBe(404);
    expect(errorCode(result)).toBe("NOT_FOUND");
  });

  it("fails closed on a malformed released row rather than exposing it", async () => {
    pgState.candidateRows = [{ ...createRelatedWarrantsRecordRow(), data_version: "wrong-version" }];
    const result = await resolveAuthenticatedNetquityRelatedWarrants(bindings, relatedWarrantsValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
  });

  it("returns an explicit failure and closes the client on database error", async () => {
    pgState.failOn = "from aiphabee_governance.workspace_entitlement";
    const result = await resolveAuthenticatedNetquityRelatedWarrants(bindings, relatedWarrantsValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
    expect(hasServingRead()).toBe(false);
  });

  it("does not return an authorized result when the database client cannot close", async () => {
    pgState.endFails = true;

    const result = await resolveAuthenticatedNetquityRelatedWarrants(bindings, relatedWarrantsValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
  });
});

// Two-gate conjunction: financial_facts and quote_snapshot are each gated
// exactly as their own single-dataset resolvers gate them (see
// resolveAuthenticatedNetquityDerivedMetrics's own comment) -- neither gate
// is relaxed, and there is no separate "derived metrics" entitlement row.
// This describe block is deliberately placed last in the file: it is the
// only one that sets the *ByDataset/*BySnapshotId keyed pgState overrides
// (see the mock's own comment above), so every earlier describe block keeps
// running against the original single-bucket fields, completely unaffected.
describe("private authenticated Netquity derived metrics resolver", () => {
  beforeEach(() => {
    pgState.accountRows = [{ account_id: "account_test" }];
    pgState.candidateRows = [];
    pgState.candidateRowsBySnapshotId = {
      "serving-netquity-basicdata-test-v1": [createFinancialFactsRecordRow()],
      "serving-netquity-quote-snapshot-test-v1": [createQuoteSnapshotRecordRow()],
    };
    pgState.connectCount = 0;
    pgState.constructorCount = 0;
    pgState.contextRows = [createContextRow()];
    pgState.endCount = 0;
    pgState.endFails = false;
    pgState.failOn = "";
    pgState.queries = [];
    pgState.rightsRows = [];
    pgState.rightsRowsByDataset = {
      financial_facts: AUTHENTICATED_NETQUITY_FINANCIAL_FACTS_REQUIRED_FIELDS.map(createFinancialFactsRightsRow),
      quote_snapshot: AUTHENTICATED_NETQUITY_QUOTE_SNAPSHOT_REQUIRED_FIELDS.map(createQuoteSnapshotRightsRow),
    };
    pgState.snapshotRows = [];
    pgState.snapshotRowsByDataset = {
      financial_facts: [createSnapshotRow()],
      quote_snapshot: [createQuoteSnapshotSnapshotRow()],
    };
  });

  afterEach(() => {
    pgState.candidateRowsBySnapshotId = {};
    pgState.rightsRowsByDataset = {};
    pgState.snapshotRowsByDataset = {};
  });

  it.each([
    ["invalid subject", { authSubject: "email@example.com", instrumentId: "hkex_security_00700" }],
    ["malformed instrument id", { authSubject: AUTH_SUBJECT, instrumentId: "eq_hk_00700" }],
    ["empty instrument id", { authSubject: AUTH_SUBJECT, instrumentId: "" }],
  ])("rejects %s before creating a database client", async (_label, input) => {
    const result = await resolveAuthenticatedNetquityDerivedMetrics(bindings, {
      requestId: "request_test",
      ...input,
    });

    expect(result.envelope.ok).toBe(false);
    expect(pgState.constructorCount).toBe(0);
  });

  it("stays unavailable outside staging before binding access", async () => {
    let bindingReads = 0;
    const result = await resolveAuthenticatedNetquityDerivedMetrics(
      {
        APP_ENV: "prod",
        get AIPHABEE_HYPERDRIVE(): { connectionString?: string } | undefined {
          bindingReads += 1;
          throw new Error("production binding must not be read");
        },
      },
      derivedMetricsValidInput(),
    );

    expect(result.status).toBe(403);
    expect(bindingReads).toBe(0);
  });

  it("returns unavailable for a missing private database binding", async () => {
    const result = await resolveAuthenticatedNetquityDerivedMetrics(
      { APP_ENV: "staging" },
      derivedMetricsValidInput(),
    );

    expect(result.status).toBe(424);
    expect(pgState.constructorCount).toBe(0);
  });

  it("denies an unmapped account before membership or Serving reads", async () => {
    pgState.accountRows = [{ account_id: null }];
    const result = await resolveAuthenticatedNetquityDerivedMetrics(bindings, derivedMetricsValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it.each(["no membership", "inactive membership", "expired subscription"])(
    "denies %s before rights or Serving reads",
    async () => {
      pgState.contextRows = [];
      const result = await resolveAuthenticatedNetquityDerivedMetrics(bindings, derivedMetricsValidInput());

      expect(result.status).toBe(403);
      expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
      expect(hasServingRead()).toBe(false);
    },
  );

  it("fails closed when more than one entitled workspace is active", async () => {
    pgState.contextRows = [createContextRow(), { ...createContextRow(), workspace_id: "workspace_2" }];
    const result = await resolveAuthenticatedNetquityDerivedMetrics(bindings, derivedMetricsValidInput());

    expect(result.status).toBe(409);
    expect(hasServingRead()).toBe(false);
  });

  it("denies the whole request when only financial_facts rights are granted (Gate B fails)", async () => {
    pgState.rightsRowsByDataset.quote_snapshot = [];
    const result = await resolveAuthenticatedNetquityDerivedMetrics(bindings, derivedMetricsValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    if (!result.envelope.ok) {
      expect(result.envelope.error.message).toContain("quote snapshot");
    }
    expect(hasServingRead()).toBe(false);
    const rightsQueries = pgState.queries.filter((query) =>
      query.text.toLowerCase().includes("from aiphabee_governance.workspace_entitlement"),
    );
    expect(rightsQueries).toHaveLength(2);
  });

  it("denies the whole request when only quote_snapshot rights are granted (Gate A fails first)", async () => {
    pgState.rightsRowsByDataset.financial_facts = [];
    const result = await resolveAuthenticatedNetquityDerivedMetrics(bindings, derivedMetricsValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    if (!result.envelope.ok) {
      expect(result.envelope.error.message).toContain("financial facts");
    }
    expect(hasServingRead()).toBe(false);
    // Gate A fails before Gate B is even queried.
    const rightsQueries = pgState.queries.filter((query) =>
      query.text.toLowerCase().includes("from aiphabee_governance.workspace_entitlement"),
    );
    expect(rightsQueries).toHaveLength(1);
  });

  it("denies the whole request when neither dataset has field rights", async () => {
    pgState.rightsRowsByDataset = { financial_facts: [], quote_snapshot: [] };
    const result = await resolveAuthenticatedNetquityDerivedMetrics(bindings, derivedMetricsValidInput());

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(hasServingRead()).toBe(false);
  });

  it("resolves both datasets and computes metrics when both gates are granted", async () => {
    const result = await resolveAuthenticatedNetquityDerivedMetrics(bindings, derivedMetricsValidInput());

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.live_data_access).toBe(true);
      // The reused createFinancialFactsRecordRow() fixture only carries
      // revenue/net_income (no assets/equity), so this is "partial", not
      // fully "computed": exactly the metrics needing only revenue/net_income
      // resolve, the rest block on missing_input rather than a fabricated
      // value.
      expect(result.envelope.data.status).toBe("partial");
      // createFinancialFactsRecordRow() carries 2 facts (revenue,
      // net_income) -> 2 financial provenance entries (one per fact) plus 1
      // quote provenance entry.
      expect(
        result.envelope.data.provenance.filter((p) => p.source === "netquity-finreport-nb"),
      ).toHaveLength(2);
      expect(
        result.envelope.data.provenance.filter((p) => p.source === "netquity-unadjprice2-daily"),
      ).toHaveLength(1);
      const byId = new Map(result.envelope.data.metrics.map((m) => [m.metric_id, m]));
      expect(byId.get("net_margin")).toMatchObject({ status: "computed" });
      expect(byId.get("price_to_sales")).toMatchObject({ status: "computed" });
      const priceToEarnings = byId.get("price_to_earnings");
      expect(priceToEarnings?.status).toBe("computed");
      expect(priceToEarnings?.value).toBeCloseTo((461.2 * 9092370719) / 224842000000, 6);
      expect(byId.get("return_on_assets")).toMatchObject({ blocked_reason: "missing_input", status: "blocked" });
      expect(byId.get("return_on_equity")).toMatchObject({ blocked_reason: "missing_input", status: "blocked" });
      expect(byId.get("price_to_book")).toMatchObject({ blocked_reason: "missing_input", status: "blocked" });
    }
  });

  it("passes undefined for financial_facts to the engine on a 404 (never a synthetic fallback), while quote_snapshot still contributes", async () => {
    pgState.candidateRowsBySnapshotId["serving-netquity-basicdata-test-v1"] = [];
    const result = await resolveAuthenticatedNetquityDerivedMetrics(bindings, derivedMetricsValidInput());

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.financial_facts_as_of).toBeUndefined();
      expect(result.envelope.data.quote_as_of).toBeDefined();
      for (const metric of result.envelope.data.metrics) {
        expect(metric.status).toBe("blocked");
        expect(metric.blocked_reason).toBe("financial_facts_not_found");
      }
    }
  });

  it("passes undefined for quote_snapshot to the engine on a 404, while financial_facts still contributes and profitability still computes", async () => {
    // Full 4-metric fact set (unlike the default createFinancialFactsRecordRow()
    // fixture's revenue/net_income only) so every profitability metric can
    // resolve here -- this test isolates "quote absent" from "financial fact
    // absent" instead of conflating the two.
    pgState.candidateRowsBySnapshotId["serving-netquity-basicdata-test-v1"] = [
      createFinancialFactsRecordRow({
        payload: {
          coverage: { status: "available" },
          facts: [
            { currency: "RMB", metricId: "revenue", periodEnd: "2025-12-31", periodType: "FY", publishedAt: "2026-03-18T00:00:00+08:00", qualityState: "PASS", scale: 1, sourceRecordId: "netquity:finreport.pla_nb.totalturnover:00700:2025-12-31:F", statementId: "netquity:finreport.stmt:00700:2025-12-31:F", statementType: "income_statement", unit: "unit", value: 751766000000 },
            { currency: "RMB", metricId: "net_income", periodEnd: "2025-12-31", periodType: "FY", publishedAt: "2026-03-18T00:00:00+08:00", qualityState: "PASS", scale: 1, sourceRecordId: "netquity:finreport.pla_nb.net_prof:00700:2025-12-31:F", statementId: "netquity:finreport.stmt:00700:2025-12-31:F", statementType: "income_statement", unit: "unit", value: 224842000000 },
            { currency: "RMB", metricId: "assets", periodEnd: "2025-12-31", periodType: "FY", publishedAt: "2026-03-18T00:00:00+08:00", qualityState: "PASS", scale: 1, sourceRecordId: "netquity:finreport.pla_nb.total_assets:00700:2025-12-31:F", statementId: "netquity:finreport.stmt:00700:2025-12-31:F", statementType: "balance_sheet", unit: "unit", value: 3064000000000 },
            { currency: "RMB", metricId: "equity", periodEnd: "2025-12-31", periodType: "FY", publishedAt: "2026-03-18T00:00:00+08:00", qualityState: "PASS", scale: 1, sourceRecordId: "netquity:finreport.pla_nb.total_equity:00700:2025-12-31:F", statementId: "netquity:finreport.stmt:00700:2025-12-31:F", statementType: "balance_sheet", unit: "unit", value: 1616000000000 },
          ],
        },
      }),
    ];
    pgState.candidateRowsBySnapshotId["serving-netquity-quote-snapshot-test-v1"] = [];
    const result = await resolveAuthenticatedNetquityDerivedMetrics(bindings, derivedMetricsValidInput());

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.status).toBe("partial");
      expect(result.envelope.data.quote_as_of).toBeUndefined();
      const profitability = result.envelope.data.metrics.filter((m) => m.category === "profitability");
      const valuation = result.envelope.data.metrics.filter((m) => m.category === "valuation");
      for (const metric of profitability) expect(metric.status).toBe("computed");
      for (const metric of valuation) {
        expect(metric.status).toBe("blocked");
        expect(metric.blocked_reason).toBe("quote_unavailable");
      }
    }
  });

  it("surfaces the shares_outstanding_unavailable blocked_reason end-to-end when the quote has a close price but no share count", async () => {
    pgState.candidateRowsBySnapshotId["serving-netquity-quote-snapshot-test-v1"] = [
      createQuoteSnapshotRecordRow({
        payload: {
          coverage: { status: "available" },
          quote: {
            close: 461.2,
            currency: "HKD",
            tradeDate: "2026-07-07",
          },
        },
      }),
    ];
    const result = await resolveAuthenticatedNetquityDerivedMetrics(bindings, derivedMetricsValidInput());

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      const priceToEarnings = result.envelope.data.metrics.find((m) => m.metric_id === "price_to_earnings");
      expect(priceToEarnings).toMatchObject({
        blocked_reason: "shares_outstanding_unavailable",
        status: "blocked",
      });
    }
  });

  it("propagates 409 DATA_QUALITY_HOLD when the financial_facts Serving snapshot has no released row, without ever reading quote_snapshot", async () => {
    pgState.snapshotRowsByDataset.financial_facts = [];
    const result = await resolveAuthenticatedNetquityDerivedMetrics(bindings, derivedMetricsValidInput());

    expect(result.status).toBe(409);
    expect(errorCode(result)).toBe("DATA_QUALITY_HOLD");
    const snapshotQueries = pgState.queries.filter((query) =>
      query.text.toLowerCase().includes("from aiphabee_core.serving_dataset dataset"),
    );
    expect(snapshotQueries).toHaveLength(1);
  });

  it("propagates 409 DATA_QUALITY_HOLD when the quote_snapshot Serving snapshot has no released row", async () => {
    pgState.snapshotRowsByDataset.quote_snapshot = [];
    const result = await resolveAuthenticatedNetquityDerivedMetrics(bindings, derivedMetricsValidInput());

    expect(result.status).toBe(409);
    expect(errorCode(result)).toBe("DATA_QUALITY_HOLD");
  });

  it("never fabricates a market cap or financial fact when both live datasets have no released row at all", async () => {
    pgState.candidateRowsBySnapshotId = {
      "serving-netquity-basicdata-test-v1": [],
      "serving-netquity-quote-snapshot-test-v1": [],
    };
    const result = await resolveAuthenticatedNetquityDerivedMetrics(bindings, derivedMetricsValidInput());

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    if (result.envelope.ok) {
      expect(result.envelope.data.status).toBe("blocked");
      expect(result.envelope.data.data_version).toBe("");
      expect(result.envelope.data.provenance).toEqual([]);
      for (const metric of result.envelope.data.metrics) {
        expect(metric.value).toBeUndefined();
        expect(metric.blocked_reason).toBe("financial_facts_not_found");
      }
    }
  });

  it("returns an explicit failure and closes the client on database error", async () => {
    pgState.failOn = "from aiphabee_governance.workspace_entitlement";
    const result = await resolveAuthenticatedNetquityDerivedMetrics(bindings, derivedMetricsValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
    expect(hasServingRead()).toBe(false);
  });

  it("does not return an authorized result when the database client cannot close", async () => {
    pgState.endFails = true;

    const result = await resolveAuthenticatedNetquityDerivedMetrics(bindings, derivedMetricsValidInput());

    expect(result.status).toBe(500);
    expect(errorCode(result)).toBe("INTERNAL_ERROR");
    expect(pgState.endCount).toBe(1);
  });
});

// Every resolver above is subject-agnostic: it never branches on the
// literal authSubject value, only on what
// platform.resolve_active_account_id_by_auth_subject(text) resolves it to
// (mocked here purely by pgState.accountRows, which the mock Client.query
// above returns for ANY "resolve_active_account_id_by_auth_subject" query
// regardless of the subject text). These tests replay each resolver's
// happy path with the anonymous public sentinel subject
// ("better-auth:00000000-0000-4000-8000-000000000000") and
// account_public_netquity_staging as the resolved account -- the same IDs
// deploy/account/netquity-public-anonymous-provisioning-staging.sql
// provisions -- proving that slice needs zero resolver/validateInput/
// SECURITY DEFINER changes to work.
const PUBLIC_AUTH_SUBJECT = "better-auth:00000000-0000-4000-8000-000000000000";

describe("public anonymous account (sentinel subject, zero resolver code changes)", () => {
  beforeEach(() => {
    pgState.accountRows = [{ account_id: "account_public_netquity_staging" }];
    pgState.candidateRows = [];
    pgState.candidateRowsBySnapshotId = {};
    pgState.connectCount = 0;
    pgState.constructorCount = 0;
    pgState.contextRows = [createContextRow()];
    pgState.endCount = 0;
    pgState.endFails = false;
    pgState.failOn = "";
    pgState.queries = [];
    pgState.rightsRows = [];
    pgState.rightsRowsByDataset = {};
    pgState.snapshotRows = [];
    pgState.snapshotRowsByDataset = {};
  });

  it("resolves security for the public account", async () => {
    pgState.candidateRows = [createCandidateRow("00001.HK", "canonical_symbol")];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_REQUIRED_FIELDS.map(createRightsRow);
    pgState.snapshotRows = [createSnapshotRow()];

    const result = await resolveAuthenticatedNetquitySecurity(bindings, {
      authSubject: PUBLIC_AUTH_SUBJECT,
      query: "00001.HK",
      requestId: "request_test",
    });

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
  });

  it("resolves profile for the public account", async () => {
    pgState.candidateRows = [createProfileRecordRow()];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_PROFILE_REQUIRED_FIELDS.map(createProfileRightsRow);
    pgState.snapshotRows = [createSnapshotRow()];

    const result = await resolveAuthenticatedNetquityProfile(bindings, {
      authSubject: PUBLIC_AUTH_SUBJECT,
      instrumentId: "hkex_security_00001",
      requestId: "request_test",
    });

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
  });

  it("resolves financial facts for the public account", async () => {
    pgState.candidateRows = [createFinancialFactsRecordRow()];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_FINANCIAL_FACTS_REQUIRED_FIELDS.map(createFinancialFactsRightsRow);
    pgState.snapshotRows = [createSnapshotRow()];

    const result = await resolveAuthenticatedNetquityFinancialFacts(bindings, {
      authSubject: PUBLIC_AUTH_SUBJECT,
      instrumentId: "hkex_security_00700",
      requestId: "request_test",
    });

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
  });

  it("resolves quote snapshot for the public account", async () => {
    pgState.candidateRows = [createQuoteSnapshotRecordRow()];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_QUOTE_SNAPSHOT_REQUIRED_FIELDS.map(createQuoteSnapshotRightsRow);
    pgState.snapshotRows = [createQuoteSnapshotSnapshotRow()];

    const result = await resolveAuthenticatedNetquityQuoteSnapshot(bindings, {
      authSubject: PUBLIC_AUTH_SUBJECT,
      instrumentId: "hkex_security_00700",
      requestId: "request_test",
    });

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
  });

  it("resolves corporate actions for the public account", async () => {
    pgState.candidateRows = [createCorporateActionsRecordRow()];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_CORPORATE_ACTIONS_REQUIRED_FIELDS.map(createCorporateActionsRightsRow);
    pgState.snapshotRows = [createSnapshotRow()];

    const result = await resolveAuthenticatedNetquityCorporateActions(bindings, {
      authSubject: PUBLIC_AUTH_SUBJECT,
      instrumentId: "hkex_security_00697",
      requestId: "request_test",
    });

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
  });

  it("resolves sdi disclosure for the public account", async () => {
    pgState.candidateRows = [createSdiDisclosureRecordRow()];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_SDI_DISCLOSURE_REQUIRED_FIELDS.map(createSdiDisclosureRightsRow);
    pgState.snapshotRows = [createSnapshotRow()];

    const result = await resolveAuthenticatedNetquitySdiDisclosure(bindings, {
      authSubject: PUBLIC_AUTH_SUBJECT,
      instrumentId: "hkex_security_00001",
      requestId: "request_test",
    });

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
  });

  it("resolves directorate for the public account", async () => {
    pgState.candidateRows = [createDirectorateRecordRow()];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_DIRECTORATE_REQUIRED_FIELDS.map(createDirectorateRightsRow);
    pgState.snapshotRows = [createSnapshotRow()];

    const result = await resolveAuthenticatedNetquityDirectorate(bindings, {
      authSubject: PUBLIC_AUTH_SUBJECT,
      instrumentId: "hkex_security_00001",
      requestId: "request_test",
    });

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
  });

  it("resolves ownership for the public account", async () => {
    pgState.candidateRows = [createOwnershipRecordRow()];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_OWNERSHIP_REQUIRED_FIELDS.map(createOwnershipRightsRow);
    pgState.snapshotRows = [createSnapshotRow()];

    const result = await resolveAuthenticatedNetquityOwnership(bindings, {
      authSubject: PUBLIC_AUTH_SUBJECT,
      instrumentId: "hkex_security_00001",
      requestId: "request_test",
    });

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
  });

  it("resolves related warrants for the public account", async () => {
    pgState.candidateRows = [createRelatedWarrantsRecordRow()];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_RELATED_WARRANTS_REQUIRED_FIELDS.map(createRelatedWarrantsRightsRow);
    pgState.snapshotRows = [createSnapshotRow()];

    const result = await resolveAuthenticatedNetquityRelatedWarrants(bindings, {
      authSubject: PUBLIC_AUTH_SUBJECT,
      instrumentId: "hkex_security_00001",
      requestId: "request_test",
    });

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
  });

  it("resolves derived metrics for the public account across both dataset gates (dual authorization)", async () => {
    pgState.rightsRowsByDataset = {
      financial_facts: AUTHENTICATED_NETQUITY_FINANCIAL_FACTS_REQUIRED_FIELDS.map(createFinancialFactsRightsRow),
      quote_snapshot: AUTHENTICATED_NETQUITY_QUOTE_SNAPSHOT_REQUIRED_FIELDS.map(createQuoteSnapshotRightsRow),
    };
    pgState.snapshotRowsByDataset = {
      financial_facts: [createSnapshotRow()],
      quote_snapshot: [createQuoteSnapshotSnapshotRow()],
    };
    pgState.candidateRowsBySnapshotId = {
      "serving-netquity-basicdata-test-v1": [createFinancialFactsRecordRow()],
      "serving-netquity-quote-snapshot-test-v1": [createQuoteSnapshotRecordRow()],
    };

    const result = await resolveAuthenticatedNetquityDerivedMetrics(bindings, {
      authSubject: PUBLIC_AUTH_SUBJECT,
      instrumentId: "hkex_security_00700",
      requestId: "request_test",
    });

    expect(result.status).toBe(200);
    expect(result.envelope.ok).toBe(true);
    // Dual-gate: both financial_facts and quote_snapshot rights were
    // separately queried and both granted -- this is the "two dataset
    // gates" the provisioning slice's broad workspace_entitlement INSERT
    // must supply for the public workspace.
    const rightsQueries = pgState.queries.filter((query) =>
      query.text.toLowerCase().includes("from aiphabee_governance.workspace_entitlement"),
    );
    expect(rightsQueries).toHaveLength(2);
    if (result.envelope.ok) {
      const byId = new Map(result.envelope.data.metrics.map((m) => [m.metric_id, m]));
      expect(byId.get("net_margin")).toMatchObject({ status: "computed" });
      expect(byId.get("price_to_sales")).toMatchObject({ status: "computed" });
    }
  });

  it("denies a non-sentinel, non-invited subject even with the public workspace fixtures present (no bypass)", async () => {
    // An arbitrary valid-shaped but unmapped subject: pgState.accountRows
    // reflects what platform.resolve_active_account_id_by_auth_subject(text)
    // returns for it (NULL -- no matching platform.account row), exactly as
    // for any other unrecognized subject. The public workspace's own
    // fixtures below (rights/snapshot data) being present and valid must
    // not matter: denial happens at the account-mapping gate, before any
    // rights or Serving read.
    pgState.accountRows = [{ account_id: null }];
    pgState.rightsRows = AUTHENTICATED_NETQUITY_REQUIRED_FIELDS.map(createRightsRow);
    pgState.snapshotRows = [createSnapshotRow()];

    const result = await resolveAuthenticatedNetquitySecurity(bindings, {
      authSubject: "better-auth:11111111-1111-4111-8111-111111111111",
      query: "00001.HK",
      requestId: "request_test",
    });

    expect(result.status).toBe(403);
    expect(errorCode(result)).toBe("DATA_NOT_LICENSED");
    expect(
      queryTexts().some((text) => text.includes("from platform.workspace_membership membership")),
    ).toBe(false);
    expect(hasServingRead()).toBe(false);
  });
});

function derivedMetricsValidInput(instrumentId = "hkex_security_00700") {
  return {
    authSubject: AUTH_SUBJECT,
    instrumentId,
    requestId: "request_test",
  };
}

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

function quoteSnapshotValidInput(instrumentId = "hkex_security_00700") {
  return {
    authSubject: AUTH_SUBJECT,
    instrumentId,
    requestId: "request_test",
  };
}

function createQuoteSnapshotRightsRow(fieldPattern: string) {
  return {
    channel: "web",
    dataset: "quote_snapshot",
    entitlement_id: `entitlement_${fieldPattern.replaceAll(".", "_")}`,
    entitlement_source_record_id: `source:${fieldPattern}`,
    entitlement_status: "approved",
    export_allowed: false,
    field_pattern: fieldPattern,
    rights_policy_version: "netquity-market-data-staging.v1",
    time_range_days: null,
    valid_from: "2026-07-10T00:00:00.000Z",
    valid_to: null,
    workspace_entitlement_id: `workspace_entitlement_${fieldPattern.replaceAll(".", "_")}`,
    workspace_source_record_id: `workspace-source:${fieldPattern}`,
    workspace_status: "approved",
  };
}

function createQuoteSnapshotSnapshotRow() {
  return {
    as_of: "2026-07-15T00:00:00.000Z",
    data_version: "netquity-quote-snapshot-test.v1",
    quality_state: "PASS",
    rights_policy_version: "netquity-market-data-staging.v1",
    serving_snapshot_id: "serving-netquity-quote-snapshot-test-v1",
  };
}

function createQuoteSnapshotRecordRow(overrides: Record<string, unknown> = {}) {
  return {
    data_version: "netquity-quote-snapshot-test.v1",
    entity_id: "hkex_security_00700",
    payload: {
      coverage: { status: "available" },
      quote: {
        close: 461.2,
        currency: "HKD",
        high: 465,
        low: 458.4,
        open: 460,
        sharesOutstanding: 9092370719,
        tradeDate: "2026-07-07",
        turnover: 25937523114,
        volume: 55418434,
      },
    },
    source_record_id: "netquity:unadjprice2.daily:00700",
    ...overrides,
  };
}

function createUnavailableQuoteSnapshotRecordRow(overrides: Record<string, unknown> = {}) {
  return {
    data_version: "netquity-quote-snapshot-test.v1",
    entity_id: "hkex_security_09999",
    payload: {
      coverage: {
        reason:
          "no EOD price row exists in nq_unadjprice2.daily for this instrument as of the mirrored snapshot date; nq_unadjprice2.daily does not encode a reason (delisting, an instrument type outside this price feed's coverage, or a vendor coverage gap are all possible and indistinguishable from this table alone)",
        status: "unavailable",
      },
    },
    source_record_id: "netquity:unadjprice2.unavailable:09999",
    ...overrides,
  };
}

function corporateActionsValidInput(instrumentId = "hkex_security_00697") {
  return {
    authSubject: AUTH_SUBJECT,
    instrumentId,
    requestId: "request_test",
  };
}

function createCorporateActionsRightsRow(fieldPattern: string) {
  return {
    channel: "web",
    dataset: "corporate_actions",
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

function createCorporateActionsRecordRow(overrides: Record<string, unknown> = {}) {
  return {
    data_version: "netquity-basicdata-test.v1",
    entity_id: "hkex_security_00697",
    payload: {
      actions: [
        {
          actionId: "corp_action_dividend_00697_135063_sd",
          actionType: "dividend",
          announcementDate: "2026-03-27",
          effectiveDate: "2026-12-10",
          exDate: "2026-12-10",
          paymentDate: "2026-12-29",
          sourceRecordId: "netquity:dividendinfo.dividendinfo:00697:135063:sd",
          summary: "Special Dividend: HKD 0.0284",
          terms: { cashAmount: 0.0284, currency: "HKD" },
        },
        {
          actionId: "corp_action_buyback_00697_20260707",
          actionType: "buyback",
          announcementDate: "2026-07-07",
          effectiveDate: "2026-07-07",
          sourceRecordId: "netquity:sharebuyback.daily_data:00697:2026-07-07",
          terms: { buybackValue: 1566857.44, currency: "HKD", shares: 1000000 },
        },
      ],
      coverage: { status: "available" },
    },
    source_record_id: "netquity:corporate_actions.available:00697",
    ...overrides,
  };
}

function createUnavailableCorporateActionsRecordRow(overrides: Record<string, unknown> = {}) {
  return {
    data_version: "netquity-basicdata-test.v1",
    entity_id: "hkex_security_00007",
    payload: {
      actions: [],
      coverage: {
        reason:
          "no dividend, buyback, split, or consolidation event found in nq_dividendinfo/nq_sharebuyback/nq_corpact for this instrument in the current mirrored snapshot",
        status: "unavailable",
      },
    },
    source_record_id: "netquity:corporate_actions.unavailable:00007",
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

function sdiDisclosureValidInput(instrumentId = "hkex_security_00001") {
  return {
    authSubject: AUTH_SUBJECT,
    instrumentId,
    requestId: "request_test",
  };
}

function createSdiDisclosureRightsRow(fieldPattern: string) {
  return {
    channel: "web",
    dataset: "sdi_disclosure",
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

// Mirrors the real hkex_security_00001 (CK Hutchison Holdings) row spot-
// checked via psql against the local netquity mirror: a 2026-06-26
// BlackRock Form 2 filing reporting a long-position change (4.91% ->
// 5.17%) alongside an unchanged short-position balance (0.06%).
function createSdiDisclosureRecordRow(overrides: Record<string, unknown> = {}) {
  return {
    data_version: "netquity-basicdata-test.v1",
    entity_id: "hkex_security_00001",
    payload: {
      coverage: { status: "available" },
      disclosures: [
        {
          disclosureId: "sdi_disclosure_00001_2_2606260526",
          formType: "2",
          holderName: { en: "BlackRock, Inc.", zhHans: "贝莱德", zhHant: "貝萊德" },
          positions: [
            {
              currency: "HKD",
              eventCode: "1004",
              positionType: "long",
              presentBalancePercent: 5.17,
              presentBalanceShares: 197978928,
              previousBalancePercent: 4.91,
              previousBalanceShares: 188109983,
              shares: 9868945,
            },
            {
              positionType: "short",
              presentBalancePercent: 0.06,
              presentBalanceShares: 2385750,
              previousBalancePercent: 0.06,
              previousBalanceShares: 2327250,
            },
          ],
          referenceNo: "CS20260626E00526",
          reportDate: "2026-06-26",
          shareClass: "O",
          sourceRecordId: "netquity:sdidata.sdi:00001:2:2606260526",
          transactionDate: "2026-06-23",
        },
      ],
    },
    source_record_id: "netquity:sdi_disclosure.available:00001",
    ...overrides,
  };
}

function createUnavailableSdiDisclosureRecordRow(overrides: Record<string, unknown> = {}) {
  return {
    data_version: "netquity-basicdata-test.v1",
    entity_id: "hkex_security_00007",
    payload: {
      coverage: {
        reason:
          "no substantial-shareholder or director/chief-executive disclosure-of-interests filing found in nq_sdidata.sdi for this instrument in the current mirrored snapshot",
        status: "unavailable",
      },
      disclosures: [],
    },
    source_record_id: "netquity:sdi_disclosure.unavailable:00007",
    ...overrides,
  };
}

function directorateValidInput(instrumentId = "hkex_security_00001") {
  return {
    authSubject: AUTH_SUBJECT,
    instrumentId,
    requestId: "request_test",
  };
}

function createDirectorateRightsRow(fieldPattern: string) {
  return {
    channel: "web",
    dataset: "directorate",
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

// Mirrors the real hkex_security_00001 (CK Hutchison Holdings) rows spot-
// checked via psql against the local netquity mirror: capacity='D' director
// LI Tzar Kuoi, Victor (chairman, age 61, HKD remuneration) and capacity='S'
// senior-management CHEUNG Kwan Hoi (Group CFO, no age/biography/
// remuneration disclosed).
function createDirectorateRecordRow(overrides: Record<string, unknown> = {}) {
  return {
    data_version: "netquity-basicdata-test.v1",
    entity_id: "hkex_security_00001",
    payload: {
      coverage: { status: "available" },
      directors: [
        {
          age: 61,
          biography: {
            en: "LI Tzar Kuoi, Victor aged 61, has been a Director of the Company since December 2014.",
            zhHans: "李泽巨61岁，自2014年12月起出任本公司董事。",
            zhHant: "李澤鉅61歲，自2014年12月起出任本公司董事。",
          },
          capacity: "D",
          name: { en: "LI Tzar Kuoi, Victor", zhHans: "李泽巨", zhHant: "李澤鉅" },
          profileId: "directorate_00001_001",
          remuneration: {
            currency: "HKD",
            currentAmount: 53180000,
            currentYearEnd: "2025-12-31",
            previousAmount: 51660000,
            previousYearEnd: "2024-12-31",
          },
          sourceRecordId: "netquity:biography.biography:00001:001",
          title: { en: "Chairman and Executive Director", zhHans: "主席兼执行董事", zhHant: "主席兼執行董事" },
        },
        {
          capacity: "S",
          name: { en: "CHEUNG Kwan Hoi", zhHans: "张钧海", zhHant: "張鈞海" },
          profileId: "directorate_00001_002",
          sourceRecordId: "netquity:biography.biography:00001:002",
          title: { en: "Group Chief Financial Officer", zhHans: "集团首席财务官", zhHant: "集團首席財務官" },
        },
      ],
    },
    source_record_id: "netquity:directorate.available:00001",
    ...overrides,
  };
}

function createUnavailableDirectorateRecordRow(overrides: Record<string, unknown> = {}) {
  return {
    data_version: "netquity-basicdata-test.v1",
    entity_id: "hkex_security_01687",
    payload: {
      coverage: {
        reason:
          "no director or senior-management biography record found in nq_biography.biography for this instrument in the current mirrored snapshot",
        status: "unavailable",
      },
      directors: [],
    },
    source_record_id: "netquity:directorate.unavailable:01687",
    ...overrides,
  };
}

function ownershipValidInput(instrumentId = "hkex_security_00001") {
  return {
    authSubject: AUTH_SUBJECT,
    instrumentId,
    requestId: "request_test",
  };
}

function createOwnershipRightsRow(fieldPattern: string) {
  return {
    channel: "web",
    dataset: "ownership",
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

// Mirrors the real hkex_security_00001 (CK Hutchison Holdings) rows spot-
// checked via psql against the local netquity mirror: latest
// nq_issueshare.issueshare row (2026-07-07, issued shares 3,830,044,500),
// latest nq_freefloatshare2.freefloatshare row (2026-07-06, free float
// 69.64%), and its top 2 nq_listcompheld.data holders (Li Ka-Shing 30.363%,
// BlackRock 4.938%, neither a cross-holding).
function createOwnershipRecordRow(overrides: Record<string, unknown> = {}) {
  return {
    data_version: "netquity-basicdata-test.v1",
    entity_id: "hkex_security_00001",
    payload: {
      coverage: { status: "available" },
      freeFloat: {
        asOf: "2026-07-06",
        freeFloatPercent: 69.64,
        freeFloatShares: 2667112490,
        issuedShares: 3830044500,
        nonFreeFloatShares: 1162932010,
      },
      holders: [
        {
          asOf: "2025-12-31",
          groupType: "F",
          heldPercent: 30.363,
          heldShares: 1162932010,
          holderId: "ownership_00001_01",
          holderType: "I",
          name: { en: "Li Ka-Shing", zhHans: "李嘉诚", zhHant: "李嘉誠" },
          sourceRecordId: "netquity:listcompheld.data:00001:01",
          sourceType: "AR",
        },
        {
          asOf: "2026-06-23",
          groupType: "N",
          heldPercent: 4.938,
          heldShares: 189128928,
          holderId: "ownership_00001_02",
          holderType: "F",
          name: { en: "BlackRock, Inc.", zhHans: "贝莱德", zhHant: "貝萊德" },
          sourceRecordId: "netquity:listcompheld.data:00001:02",
          sourceType: "SD",
        },
      ],
      shareCapital: {
        asOf: "2026-07-07",
        hasSecondaryListing: "N",
        hkShareClass: "OS",
        hkShares: 3830044500,
        isHShare: "N",
        issuedShares: 3830044500,
        issuedSharesChange: 0,
        sharesInCcass: 2555770354,
        sharesOutsideCcass: 1274274146,
      },
    },
    source_record_id: "netquity:ownership.available:00001",
    ...overrides,
  };
}

function createUnavailableOwnershipRecordRow(overrides: Record<string, unknown> = {}) {
  return {
    data_version: "netquity-basicdata-test.v1",
    entity_id: "hkex_security_09999",
    payload: {
      coverage: {
        reason:
          "no share capital, free float, or substantial-shareholder/cross-holding record found in nq_issueshare.issueshare, nq_freefloatshare2.freefloatshare, or nq_listcompheld.data for this instrument in the current mirrored snapshot",
        status: "unavailable",
      },
    },
    source_record_id: "netquity:ownership.unavailable:09999",
    ...overrides,
  };
}

function relatedWarrantsValidInput(instrumentId = "hkex_security_00001") {
  return {
    authSubject: AUTH_SUBJECT,
    instrumentId,
    requestId: "request_test",
  };
}

function createRelatedWarrantsRightsRow(fieldPattern: string) {
  return {
    channel: "web",
    dataset: "related_warrants",
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

// Mirrors the real hkex_security_00001 (CK Hutchison Holdings) row spot-
// checked via psql against the local netquity mirror: 2 of its 20 related
// warrants (dp_warrant code 14662 "CI-CK Hutchison@EP2612A", dc_warrant code
// 24792 "MB-CK Hutchison@EC2610A").
function createRelatedWarrantsRecordRow(overrides: Record<string, unknown> = {}) {
  return {
    data_version: "netquity-basicdata-test.v1",
    entity_id: "hkex_security_00001",
    payload: {
      coverage: { status: "available" },
      warrants: [
        {
          category: "dp_warrant",
          instrumentId: "hkex_security_14662",
          name: { en: "CI-CK Hutchison@EP2612A", zhHans: "长和信证EP2612A", zhHant: "長和信證EP2612A" },
          sourceRecordId: "netquity:relatedcode.dp_warrant:00001:14662",
        },
        {
          category: "dc_warrant",
          instrumentId: "hkex_security_24792",
          name: { en: "MB-CK Hutchison@EC2610A", zhHans: "长和麦银EC2610A", zhHant: "長和麥銀EC2610A" },
          sourceRecordId: "netquity:relatedcode.dc_warrant:00001:24792",
        },
      ],
    },
    source_record_id: "netquity:related_warrants.available:00001",
    ...overrides,
  };
}

function createUnavailableRelatedWarrantsRecordRow(overrides: Record<string, unknown> = {}) {
  return {
    data_version: "netquity-basicdata-test.v1",
    entity_id: "hkex_security_00007",
    payload: {
      coverage: {
        reason:
          "no derivative warrant or CBBC code is associated with this instrument in nq_basicdata.relatedcode in the current mirrored snapshot",
        status: "unavailable",
      },
    },
    source_record_id: "netquity:related_warrants.unavailable:00007",
    ...overrides,
  };
}
