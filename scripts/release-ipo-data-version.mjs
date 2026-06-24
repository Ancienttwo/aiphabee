#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const { Client } = pg;

const REMOTE_TARGET_ENVS = new Set(["staging", "production"]);
const DEFAULT_MANIFEST_PATH = "_ops/ipo-prod-held-ingest-manifest.json";

const args = parseArgs(process.argv.slice(2));
const manifest = readManifest(args.manifestPath ?? DEFAULT_MANIFEST_PATH);
const dataVersion = args.dataVersion ?? manifest.ingest_result?.data_version;
const dryRun = args.dryRun === true || args.allowRelease !== true;

if (!dataVersion) {
  fail("Missing --data-version and manifest ingest_result.data_version.");
}

const databaseUrl = args.databaseUrl ?? process.env.IPO_DATABASE_URL ?? process.env.DATABASE_URL;
if (!databaseUrl) {
  fail("Missing --database-url or IPO_DATABASE_URL/DATABASE_URL.");
}

const databaseTarget = databaseWriteTarget(databaseUrl);
assertReleaseAllowed(databaseTarget, dryRun);
assertManifestMatchesDataVersion(manifest, dataVersion);

const client = new Client({ connectionString: databaseUrl });
await client.connect();

let result;
try {
  await configureReleaseSession(client, databaseTarget);
  await client.query("begin");
  result = await buildReleasePlan(client, manifest, dataVersion, databaseTarget);

  if (dryRun) {
    await client.query("rollback");
  } else {
    await client.query(
      `
        update core.data_version_batch
        set release_state = 'released',
            released_at = now()
        where data_version = $1
          and release_state = 'held'
      `,
      [dataVersion]
    );
    await client.query("commit");
    result.release_state_after = "released";
  }
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}

const output = {
  ...result,
  dry_run: dryRun,
  status: dryRun ? "release_dry_run_complete" : "released"
};

if (args.output) {
  writeFileSync(resolve(process.cwd(), args.output), `${JSON.stringify(output, null, 2)}\n`);
}

console.log(JSON.stringify(output, null, 2));

async function buildReleasePlan(client, manifest, dataVersion, target) {
  const batch = await client.query(
    `
      select data_version, release_state, released_at
      from core.data_version_batch
      where data_version = $1
      for update
    `,
    [dataVersion]
  );

  if (batch.rows.length !== 1) {
    fail(`Expected exactly one data_version_batch row for ${dataVersion}, got ${batch.rows.length}.`);
  }

  if (batch.rows[0].release_state !== "held") {
    fail(`Refusing release because ${dataVersion} is ${batch.rows[0].release_state}, not held.`);
  }

  const released = await client.query(
    `
      select data_version
      from core.data_version_batch
      where data_version like 'ipo-mdb-%'
        and release_state = 'released'
        and data_version <> $1
      order by data_version
      limit 5
    `,
    [dataVersion]
  );

  if (released.rows.length > 0) {
    fail("Refusing release because another IPO data_version is already released.");
  }

  const counts = await readReleaseCounts(client, dataVersion);
  const expectedCounts = expectedReleaseCounts(manifest);
  for (const [name, expected] of Object.entries(expectedCounts)) {
    if (counts[name] !== expected) {
      fail(`Refusing release because ${name} row_count=${counts[name]} does not match manifest=${expected}.`);
    }
  }

  const contract = await client.query(
    `
      select
        default_data_rights_status,
        field_authorization_required,
        export_allowed,
        mcp_redistribution_allowed
      from governance.ipo_contract
      where contract_key = 'phase1.ipo_pipeline'
    `
  );

  if (
    contract.rows.length !== 1 ||
    contract.rows[0].default_data_rights_status !== "default_deny" ||
    contract.rows[0].field_authorization_required !== true ||
    contract.rows[0].export_allowed !== false ||
    contract.rows[0].mcp_redistribution_allowed !== false
  ) {
    fail("Refusing release because governance.ipo_contract is not default-deny/export-blocked/MCP-blocked.");
  }

  const catalog = await client.query(
    `
      select
        count(*) filter (where dataset.domain = 'ipo_pipeline' and dataset.default_rights_status = 'default_deny')::int as default_deny_datasets,
        count(*) filter (where field.rights_status = 'blocked')::int as blocked_fields
      from core.serving_dataset dataset
      left join core.serving_field field
        on field.serving_dataset_id = dataset.serving_dataset_id
      where dataset.domain = 'ipo_pipeline'
    `
  );

  const defaultDenyDatasets = catalog.rows[0]?.default_deny_datasets ?? 0;
  const blockedFields = catalog.rows[0]?.blocked_fields ?? 0;
  if (defaultDenyDatasets < 7 || blockedFields < 4) {
    fail("Refusing release because IPO serving catalog default-deny coverage is incomplete.");
  }

  return {
    data_version: dataVersion,
    release_state_before: batch.rows[0].release_state,
    release_state_after: batch.rows[0].release_state,
    target_env: target.target_env,
    counts,
    expected_counts: expectedCounts,
    governance: {
      blocked_fields: blockedFields,
      default_deny_datasets: defaultDenyDatasets,
      export_allowed: false,
      field_authorization_required: true,
      mcp_redistribution_allowed: false
    }
  };
}

async function readReleaseCounts(client, dataVersion) {
  const result = await client.query(
    `
      select 'raw_snapshot' as name, count(*)::int as row_count from core.raw_snapshot where data_version = $1
      union all select 'vendor_code', count(*)::int from core.vendor_code where data_version = $1
      union all select 'ipo_offering', count(*)::int from core.ipo_offering where data_version = $1
      union all select 'ipo_narrative', count(*)::int from core.ipo_narrative where data_version = $1
      union all select 'ipo_timetable_event', count(*)::int from core.ipo_timetable_event where data_version = $1
      union all select 'ipo_offer_statistic', count(*)::int from core.ipo_offer_statistic where data_version = $1
      union all select 'ipo_cornerstone', count(*)::int from core.ipo_cornerstone where data_version = $1
      union all select 'ipo_allotment_summary', count(*)::int from core.ipo_allotment_summary where data_version = $1
      union all select 'ipo_pipeline_application', count(*)::int from core.ipo_pipeline_application where data_version = $1
    `,
    [dataVersion]
  );

  return Object.fromEntries(result.rows.map((row) => [row.name, Number(row.row_count)]));
}

function expectedReleaseCounts(manifest) {
  const serving = manifest.ingest_result?.serving_counts ?? {};
  return {
    raw_snapshot: Number(manifest.ingest_result?.raw_snapshot_count),
    vendor_code: Number(serving.vendor_code),
    ipo_offering: Number(serving.ipo_offering),
    ipo_narrative: Number(serving.ipo_narrative),
    ipo_timetable_event: Number(serving.ipo_timetable_event),
    ipo_offer_statistic: Number(serving.ipo_offer_statistic),
    ipo_cornerstone: Number(serving.ipo_cornerstone),
    ipo_allotment_summary: Number(serving.ipo_allotment_summary),
    ipo_pipeline_application: Number(serving.ipo_pipeline_application)
  };
}

function assertManifestMatchesDataVersion(manifest, dataVersion) {
  if (manifest.ingest_result?.data_version !== dataVersion) {
    fail("Manifest ingest_result.data_version does not match release data_version.");
  }

  if (manifest.ingest_result?.release_state !== "held") {
    fail("Manifest ingest_result.release_state must be held before release.");
  }

  if (manifest.write_plan?.runtime_source_of_truth !== "postgres") {
    fail("Manifest must declare Postgres as runtime source of truth.");
  }

  if (manifest.write_plan?.supplier_inflow !== "mdb") {
    fail("Manifest must declare MDB as supplier inflow only.");
  }

  if (manifest.write_plan?.data_version_release_state !== "held") {
    fail("Manifest write plan must begin with held data_version release state.");
  }
}

function readManifest(path) {
  try {
    return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
  } catch (error) {
    fail(`Unable to read IPO release manifest ${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--allow-release") parsed.allowRelease = true;
    else if (value === "--database-url") parsed.databaseUrl = values[++index];
    else if (value === "--data-version") parsed.dataVersion = values[++index];
    else if (value === "--dry-run") parsed.dryRun = true;
    else if (value === "--manifest-path") parsed.manifestPath = values[++index];
    else if (value === "--output") parsed.output = values[++index];
    else if (value === "--target-env") parsed.targetEnv = values[++index];
  }
  return parsed;
}

function databaseWriteTarget(databaseUrl) {
  const url = new URL(databaseUrl);
  if (["127.0.0.1", "localhost"].includes(url.hostname)) {
    return {
      hostname: url.hostname,
      kind: "local",
      target_env: "local"
    };
  }

  return {
    hostname: url.hostname,
    kind: "remote",
    target_env: args.targetEnv
  };
}

function assertReleaseAllowed(target, dryRun) {
  if (target.kind === "local") {
    return;
  }

  if (!REMOTE_TARGET_ENVS.has(target.target_env)) {
    fail("Refusing remote IPO release without --target-env staging|production.");
  }

  if (!dryRun && args.allowRelease !== true) {
    fail("Refusing remote IPO release without --allow-release.");
  }
}

async function configureReleaseSession(client, target) {
  if (target.kind !== "remote") {
    return;
  }

  await client.query("set statement_timeout = '120s'");
  await client.query("set idle_in_transaction_session_timeout = '120s'");
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
