import { Client } from "pg";

interface Env {
  AIPHABEE_RESEARCH_AGENT_CONTROL_HYPERDRIVE: { connectionString: string };
  STAGING_MIGRATION_HYPERDRIVE: { connectionString: string };
  ROW10_APPLY_TOKEN: string;
}

const EXPECTED_MIGRATIONS = new Map([
  [
    "deploy/database/migrations/20260620090000_usage_ledger_scaffold.sql",
    "2a9be30af702f4896271b5ad25fd703eb4decc9f95de7d392e13b6f194b9db58"
  ],
  [
    "deploy/database/migrations/20260710120000_research_agent_lifecycle.sql",
    "bc34091942b03f30104b0c7015c17fe11337bf5437c41055cb35c098023864b3"
  ],
  [
    "deploy/database/migrations/20260711140000_durable_memory_artifact_handoff.sql",
    "61d8434688ffe8b772bb0f570a58f7e750cd8dfc5aea10302349923afff87b23"
  ],
  [
    "deploy/database/migrations/20260711151100_research_agent_product_control.sql",
    "87eead99b7e581aaf5a7d9769cf31c1c79f1a18bede3dd641f8d82251fff26b5"
  ],
  [
    "deploy/database/migrations/20260711164500_fastclaw_live_runtime_policies.sql",
    "d89477b29152c24dd9fb4c49893cd6a36c1789ef8443414ba79ef0fd27862577"
  ]
]);

async function sha256(value: string): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  );
  return [...digest].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function authorized(request: Request, expected: string): Promise<boolean> {
  const provided = request.headers.get("authorization")?.replace(/^Bearer /u, "") ?? "";
  if (provided.length === 0 || expected.length < 32) return false;
  return (await sha256(provided)) === (await sha256(expected));
}

function json(status: number, body: unknown): Response {
  return Response.json(body, { headers: { "cache-control": "no-store" }, status });
}

function quoteIdentifier(value: string): string {
  return `"${value.replace(/"/gu, '""')}"`;
}

function exactMigrations(value: unknown): value is Array<{
  file: string;
  sha256: string;
  sql: string;
}> {
  if (!Array.isArray(value) || value.length !== EXPECTED_MIGRATIONS.size) return false;
  return value.every((migration, index) => {
    if (typeof migration !== "object" || migration === null || Array.isArray(migration)) {
      return false;
    }
    const record = migration as Record<string, unknown>;
    const file = [...EXPECTED_MIGRATIONS.keys()][index];
    return (
      Object.keys(record).sort().join(",") === "file,sha256,sql" &&
      record.file === file &&
      record.sha256 === EXPECTED_MIGRATIONS.get(file) &&
      typeof record.sql === "string" &&
      record.sql.length > 0 &&
      record.sql.length <= 100_000
    );
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") {
      return json(200, { service: "row10-migration-operator", status: "ready" });
    }
    if (
      request.method !== "POST" ||
      ![
        "/internal/row10/apply-migrations",
        "/internal/row10/rotate-fastclaw-vps-role",
        "/internal/row10/runtime-identity"
      ].includes(url.pathname)
    ) {
      return json(404, { status: "not_found" });
    }
    if (!(await authorized(request, env.ROW10_APPLY_TOKEN))) {
      return json(403, { status: "forbidden" });
    }
    if (url.pathname === "/internal/row10/runtime-identity") {
      const runtimeClient = new Client({
        connectionString: env.AIPHABEE_RESEARCH_AGENT_CONTROL_HYPERDRIVE.connectionString
      });
      try {
        await runtimeClient.connect();
        const result = await runtimeClient.query<{ origin_user: string }>(
          "select current_user as origin_user"
        );
        const runtimeRole = result.rows[0]?.origin_user ?? "";
        if (!/^[A-Za-z_][A-Za-z0-9_.-]{0,127}$/u.test(runtimeRole)) {
          throw new Error("runtime identity is invalid");
        }
        return json(200, { runtime_role: runtimeRole, status: "passed" });
      } catch (error) {
        return json(500, {
          error_hash: `sha256:${await sha256(
            error instanceof Error ? error.message : "runtime identity error"
          )}`,
          status: "failed"
        });
      } finally {
        await runtimeClient.end().catch(() => undefined);
      }
    }

    if (url.pathname === "/internal/row10/rotate-fastclaw-vps-role") {
      const input = (await request.json().catch(() => null)) as {
        password?: unknown;
      } | null;
      if (
        typeof input?.password !== "string" ||
        !/^[A-Za-z0-9_-]{48,128}$/u.test(input.password)
      ) {
        return json(400, { status: "invalid_role_rotation" });
      }
      const client = new Client({
        connectionString: env.STAGING_MIGRATION_HYPERDRIVE.connectionString
      });
      try {
        await client.connect();
        await client.query("begin");
        await client.query(
          "select pg_advisory_xact_lock(hashtext('aiphabee-fastclaw-vps-role-rotation'))"
        );
        await client.query(
          `alter role fastclaw_aiphabee_staging password '${input.password}'`
        );
        const result = await client.query<{
          can_login: boolean;
          role_name: string;
        }>(`select rolcanlogin as can_login, rolname as role_name
            from pg_roles where rolname = 'fastclaw_aiphabee_staging'`);
        const row = result.rows[0];
        if (row?.can_login !== true || row.role_name !== "fastclaw_aiphabee_staging") {
          throw new Error("FastClaw VPS role readback failed");
        }
        await client.query("commit");
        return json(200, {
          role_hash: `sha256:${await sha256(row.role_name)}`,
          status: "passed"
        });
      } catch (error) {
        await client.query("rollback").catch(() => undefined);
        return json(500, {
          error_hash: `sha256:${await sha256(
            error instanceof Error ? error.message : "role rotation failed"
          )}`,
          status: "failed"
        });
      } finally {
        await client.end().catch(() => undefined);
      }
    }

    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > 200_000) {
      return json(413, { status: "payload_too_large" });
    }
    const input = (await request.json().catch(() => null)) as {
      migrations?: unknown;
      runtime_role?: unknown;
    } | null;
    if (
      !exactMigrations(input?.migrations) ||
      typeof input?.runtime_role !== "string" ||
      !/^[A-Za-z_][A-Za-z0-9_.-]{0,127}$/u.test(input.runtime_role)
    ) {
      return json(400, { status: "invalid_migration_packet" });
    }
    for (const migration of input.migrations) {
      if ((await sha256(migration.sql)) !== migration.sha256) {
        return json(409, { status: "migration_hash_mismatch" });
      }
    }

    const client = new Client({
      connectionString: env.STAGING_MIGRATION_HYPERDRIVE.connectionString
    });
    let phase = "connect";
    try {
      phase = "admin_connect";
      await client.connect();
      phase = "begin";
      await client.query("begin");
      phase = "lock";
      await client.query(
        "select pg_advisory_xact_lock(hashtext('aiphabee-fastclaw-row10-migrations'))"
      );
      for (const [index, migration] of input.migrations.entries()) {
        phase = `migration_${index + 1}`;
        await client.query(migration.sql);
      }

      phase = "runtime_grants";
      const runtimeRole = quoteIdentifier(input.runtime_role);
      await client.query(`grant usage on schema aiphabee_core, aiphabee_audit,
        aiphabee_governance to ${runtimeRole}`);
      await client.query(`grant select, insert, update on table
        aiphabee_core.research_agent_profile to ${runtimeRole}`);
      await client.query(`grant select, insert on table
        aiphabee_audit.research_agent_lifecycle_event,
        aiphabee_core.durable_agent_handoff,
        aiphabee_core.research_agent_run_usage,
        aiphabee_core.usage_event,
        aiphabee_core.usage_ledger_entry to ${runtimeRole}`);
      await client.query(`grant select on table
        aiphabee_core.usage_meter_rule,
        aiphabee_governance.fastclaw_live_runtime_policy_contract to ${runtimeRole}`);
      await client.query(`grant select, insert, update on table
        aiphabee_audit.research_agent_admin_event to ${runtimeRole}`);

      phase = "readback";
      const readback = await client.query<{
        admin_audit_table: boolean;
        durable_handoff_table: boolean;
        forced_rls_count: number | string;
        lifecycle_profile_table: boolean;
        origin_user: string;
        product_usage_table: boolean;
        usage_meter_rule: boolean;
      }>(`select
        to_regclass('aiphabee_core.research_agent_profile') is not null as lifecycle_profile_table,
        to_regclass('aiphabee_core.durable_agent_handoff') is not null as durable_handoff_table,
        to_regclass('aiphabee_core.research_agent_run_usage') is not null as product_usage_table,
        to_regclass('aiphabee_audit.research_agent_admin_event') is not null as admin_audit_table,
        exists (
          select 1 from aiphabee_core.usage_meter_rule
          where meter_rule_id = 'meter_api_fastclaw_personal_agent_agent_run_credit'
            and methodology_version = 'fastclaw-cost-pending-live-row10-v0'
            and rights_policy_version = 'default_deny'
        ) as usage_meter_rule,
        (
          select count(*)::int from pg_class relation
          join pg_namespace namespace on namespace.oid = relation.relnamespace
          where namespace.nspname in ('aiphabee_core', 'aiphabee_audit')
            and relation.relname in (
              'research_agent_profile', 'durable_agent_handoff',
              'research_agent_run_usage', 'research_agent_admin_event'
            )
            and relation.relrowsecurity and relation.relforcerowsecurity
        ) as forced_rls_count,
        current_user as origin_user`);
      const row = readback.rows[0];
      if (row === undefined) throw new Error("migration readback returned no row");
      await client.query("commit");

      phase = "runtime_privilege_readback";
      const runtimeReadback = await client.query<{
        runtime_privileges: boolean;
      }>(`select
        has_schema_privilege($1, 'aiphabee_core', 'USAGE')
        and has_schema_privilege($1, 'aiphabee_audit', 'USAGE')
        and has_table_privilege($1, 'aiphabee_core.research_agent_profile', 'SELECT,INSERT,UPDATE')
        and has_table_privilege($1, 'aiphabee_audit.research_agent_lifecycle_event', 'SELECT,INSERT')
        and has_table_privilege($1, 'aiphabee_core.durable_agent_handoff', 'SELECT,INSERT')
        and has_table_privilege($1, 'aiphabee_core.research_agent_run_usage', 'SELECT,INSERT')
        and has_table_privilege($1, 'aiphabee_core.usage_event', 'SELECT,INSERT')
        and has_table_privilege($1, 'aiphabee_core.usage_ledger_entry', 'SELECT,INSERT')
        and has_table_privilege($1, 'aiphabee_core.usage_meter_rule', 'SELECT')
        and has_table_privilege($1, 'aiphabee_audit.research_agent_admin_event', 'SELECT,INSERT,UPDATE')
        as runtime_privileges`, [input.runtime_role]);
      const runtimeRow = runtimeReadback.rows[0];
      if (runtimeRow === undefined || !runtimeRow.runtime_privileges) {
        throw new Error("restricted runtime privilege readback failed");
      }

      const publicReadback = {
        admin_audit_table: row.admin_audit_table,
        durable_handoff_table: row.durable_handoff_table,
        forced_rls_count: Number(row.forced_rls_count),
        lifecycle_profile_table: row.lifecycle_profile_table,
        origin_user_hash: `sha256:${await sha256(row.origin_user)}`,
        product_usage_table: row.product_usage_table,
        runtime_origin_user_hash: `sha256:${await sha256(input.runtime_role)}`,
        runtime_privileges: runtimeRow.runtime_privileges,
        usage_meter_rule: row.usage_meter_rule
      };
      return json(200, {
        migration_hashes: input.migrations.map((migration) => `sha256:${migration.sha256}`),
        readback: publicReadback,
        schema_hash: `sha256:${await sha256(JSON.stringify(publicReadback))}`,
        status: "passed"
      });
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      const sqlstate =
        typeof (error as { code?: unknown })?.code === "string" &&
        /^[0-9A-Z]{5}$/u.test((error as { code: string }).code)
          ? (error as { code: string }).code
          : null;
      const failureClass =
        sqlstate === "42501"
          ? "insufficient_privilege"
          : sqlstate === "42P01"
            ? "undefined_table"
            : sqlstate === "42703"
              ? "undefined_column"
              : sqlstate === "23503"
                ? "foreign_key_violation"
                : "database_error";
      return json(500, {
        error_hash: `sha256:${await sha256(
          error instanceof Error ? error.message : "unknown migration error"
        )}`,
        failure_class: failureClass,
        phase,
        sqlstate,
        status: "failed"
      });
    } finally {
      await client.end().catch(() => undefined);
    }
  }
} satisfies ExportedHandler<Env>;
