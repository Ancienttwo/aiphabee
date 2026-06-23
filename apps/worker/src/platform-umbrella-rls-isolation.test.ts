import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// RLS cross-tenant / cross-product isolation truth table for the umbrella
// schema migration. This repo is Phase 0 / `status: local_contract` with no
// provisioned Postgres (no `pg`/`supabase` dependency, no database service in
// ci.yml), so RLS cannot be exercised against a live engine here. Instead we
// lock the *isolation predicate* into the policy text: every workspace-scoped
// read must gate on active membership and bound BOTH ends of every validity
// window. This is the regression gate that fails when a temporal lower bound
// (`valid_from`) or a membership scope is dropped from a policy.
//
// The executable A/B-workspace truth table (two tenants, a future-dated
// membership, shared vs B-only entitlements, a zero-visibility audit row)
// belongs against the planned Supabase provider once it exists; this static
// gate is its standing proxy until then.

const migrationPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../supabase/migrations/20260623010000_platform_umbrella_schema_foundation.sql"
);
const sql = readFileSync(migrationPath, "utf8");

const squish = (text: string): string => text.replace(/\s+/gu, " ").trim().toLowerCase();
const normalizedSql = squish(sql);

const policyStatements: string[] = sql.match(/create policy[\s\S]*?;/giu) ?? [];

const policyBlocks = (name: string): string[] =>
  policyStatements
    .filter((stmt) => new RegExp(`create policy\\s+${name}\\b`, "iu").test(stmt))
    .map(squish);

const functionBody = (name: string): string =>
  squish(sql.match(new RegExp(`create or replace function platform\\.${name}[\\s\\S]*?\\$\\$;`, "iu"))?.[0] ?? "");

const isWorkspaceMemberBody = functionBody("is_workspace_member");
const currentAccountBody = functionBody("current_account_id");

describe("platform umbrella RLS isolation truth table", () => {
  it("parses the migration into discrete policy statements and helper bodies", () => {
    expect(policyStatements.length).toBeGreaterThanOrEqual(13);
    expect(isWorkspaceMemberBody).not.toBe("");
    expect(currentAccountBody).not.toBe("");
  });

  // Core anti-regression invariant: any predicate that bounds the upper end of a
  // validity window (`valid_to`) MUST also bound the lower end (`valid_from`),
  // or a not-yet-effective `status='active'` row would grant access early. This
  // is exactly the defect this test was added to prevent.
  const validityScopes: Array<{ label: string; body: string }> = [
    { label: "platform.is_workspace_member()", body: isWorkspaceMemberBody },
    ...policyStatements.map((stmt) => ({
      label: stmt.match(/create policy\s+(\w+)/iu)?.[1] ?? "policy",
      body: squish(stmt)
    }))
  ];

  for (const scope of validityScopes) {
    if (scope.body.includes("valid_to")) {
      it(`${scope.label} bounds valid_from wherever it bounds valid_to`, () => {
        expect(scope.body).toContain("valid_from <= now()");
      });
    }
  }

  it("is_workspace_member() is account-scoped, active, and fully time-bounded", () => {
    expect(isWorkspaceMemberBody).toContain("wm.account_id = (select platform.current_account_id())");
    expect(isWorkspaceMemberBody).toContain("wm.status = 'active'");
    expect(isWorkspaceMemberBody).toContain("wm.valid_from <= now()");
    expect(isWorkspaceMemberBody).toContain("wm.valid_to is null or wm.valid_to > now()");
  });

  it("workspace_membership_self_read is self-scoped and fully time-bounded", () => {
    const [block] = policyBlocks("workspace_membership_self_read");
    expect(block).toBeDefined();
    expect(block).toContain("account_id = (select platform.current_account_id())");
    expect(block).toContain("status = 'active'");
    expect(block).toContain("valid_from <= now()");
    expect(block).toContain("valid_to is null or valid_to > now()");
  });

  it("workspace_membership_profile_self_read is membership-scoped and fully time-bounded", () => {
    const [block] = policyBlocks("workspace_membership_profile_self_read");
    expect(block).toBeDefined();
    expect(block).toContain("wm.membership_id = workspace_membership_profile.membership_id");
    expect(block).toContain("wm.account_id = (select platform.current_account_id())");
    expect(block).toContain("wm.valid_from <= now()");
  });

  it("data_entitlement_member_read reverse-looks-up via the workspace_entitlement FK, workspace- and time-bounded", () => {
    const [block] = policyBlocks("data_entitlement_member_read");
    expect(block).toBeDefined();
    // FK reverse path: catalog row visible only through a workspace grant the caller belongs to.
    expect(block).toContain("we.entitlement_id = data_entitlement.entitlement_id");
    expect(block).toContain("platform.is_workspace_member(we.workspace_id)");
    expect(block).toContain("we.valid_from <= now()");
    expect(block).toContain("we.valid_to is null or we.valid_to > now()");
  });

  it("every tenant-scoped read gates on active workspace membership", () => {
    const membershipGated = [
      "workspace_member_read",
      "workspace_subscription_member_read",
      "workspace_product_access_member_read",
      "workspace_profile_member_read",
      "workspace_entitlement_member_read" // defined on both platform.* and aiphabee_governance.*
    ];
    for (const name of membershipGated) {
      const blocks = policyBlocks(name);
      expect(blocks.length, `${name} must exist`).toBeGreaterThan(0);
      for (const block of blocks) {
        expect(block, `${name} must call is_workspace_member`).toContain("is_workspace_member(");
      }
    }
  });

  it("account_self_read / account_profile_self_read stay self-scoped (no cross-account read)", () => {
    const [accountSelf] = policyBlocks("account_self_read");
    const [profileSelf] = policyBlocks("account_profile_self_read");
    expect(accountSelf).toContain("auth_user_id = (select auth.uid())");
    expect(profileSelf).toContain("account_id = (select platform.current_account_id())");
  });

  it("platform_audit.product_access_event is RLS-locked with no read policy (deny-all to authenticated)", () => {
    expect(normalizedSql).toContain("alter table platform_audit.product_access_event enable row level security");
    expect(normalizedSql).toContain("alter table platform_audit.product_access_event force row level security");
    const hasAuditPolicy = policyStatements.some((stmt) =>
      /on\s+platform_audit\.product_access_event/iu.test(stmt)
    );
    expect(hasAuditPolicy, "audit event table must expose no SELECT policy").toBe(false);
  });

  it("identity helpers pin an empty search_path (no search_path injection)", () => {
    expect(isWorkspaceMemberBody).toContain("set search_path = ''");
    expect(currentAccountBody).toContain("set search_path = ''");
  });
});
