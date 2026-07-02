import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// RLS cross-tenant / cross-product isolation truth table for the umbrella
// schema migration. The live Worker smoke exercises this through Hyperdrive;
// this static gate locks the isolation predicate into the policy text so a
// branch cannot silently drop membership scope, the `aiphabee.account_id`
// session claim, or lower validity bounds.

const migrationPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../deploy/database/migrations/20260623010000_platform_umbrella_schema_foundation.sql"
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
    expect(accountSelf).toContain("account_id = (select platform.current_account_id())");
    expect(profileSelf).toContain("account_id = (select platform.current_account_id())");
  });

  it("platform_audit.product_access_event stays deny-all in the local migration", () => {
    expect(normalizedSql).toContain("alter table platform_audit.product_access_event enable row level security");
    expect(normalizedSql).toContain("alter table platform_audit.product_access_event force row level security");
    const auditPolicies = policyStatements
      .filter((stmt) => /on\s+platform_audit\.product_access_event/iu.test(stmt))
      .map(squish);
    expect(auditPolicies).toHaveLength(0);
  });

  it("entitlement_policy_member_read gates on an in-window product access, not just status", () => {
    const [block] = policyBlocks("entitlement_policy_member_read");
    expect(block).toBeDefined();
    expect(block).toContain("wpa.access_status in ('trialing', 'active')");
    expect(block).toContain("wpa.valid_from <= now()");
    expect(block).toContain("wpa.valid_to is null or wpa.valid_to > now()");
  });

  it("security-sensitive membership/entitlement reads are force-converged on replayed databases", () => {
    // Guarded create defers to a pre-existing policy of the same name, so an
    // idempotent `alter policy` forces the hardened predicate onto the policy.
    for (const name of [
      "workspace_membership_self_read",
      "workspace_membership_profile_self_read",
      "data_entitlement_member_read",
      "entitlement_policy_member_read"
    ]) {
      expect(normalizedSql, `${name} must be alter-converged`).toContain(`alter policy ${name}`);
    }
  });

  it("does not depend on Supabase browser roles or grants", () => {
    expect(normalizedSql).not.toContain("auth.uid(");
    expect(normalizedSql).not.toContain("to authenticated");
    expect(normalizedSql).not.toContain("to service_role");
    expect(normalizedSql).not.toContain("to anon");
    expect(normalizedSql).not.toContain("grant usage");
    expect(normalizedSql).not.toContain("grant select");
    expect(normalizedSql).not.toContain("supabase_");
  });

  it("every create policy is idempotently guarded for replay/apply validation", () => {
    // A bare `create policy` has no IF NOT EXISTS and aborts on re-apply. Each
    // policy must sit behind a pg_policies presence guard.
    const guardCount = (sql.match(/if not exists \(\s*select 1 from pg_policies/giu) ?? []).length;
    expect(policyStatements.length).toBeGreaterThanOrEqual(16);
    expect(guardCount).toBe(policyStatements.length);
  });

  it("identity helpers pin an empty search_path (no search_path injection)", () => {
    expect(isWorkspaceMemberBody).toContain("set search_path = ''");
    expect(currentAccountBody).toContain("set search_path = ''");
  });
});
