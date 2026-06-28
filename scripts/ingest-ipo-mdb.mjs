#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import pg from "pg";

const { Client } = pg;

const SOURCE_NAME = "netquity_hk_ipo";
const SOURCE_DATASET = "ipo_mdb_bundle";
const METHODOLOGY_VERSION = "2026-06-24.ipo-mdb-postgres-ingest.v0";
const RIGHTS_POLICY_VERSION = "ipo-rights-policy-scaffold-v0";
const SANITIZER_VERSION = "ipo-memo-sanitizer@v0";
const REMOTE_TARGET_ENVS = new Set(["staging", "production"]);
const SERVING_UPSERT_CHUNK_SIZE = 250;

const EXPECTED_NEWIPO_TABLES = [
  ["DataPeriod", "Nil", "ipo_data_period"],
  ["DataPeriod_LockUpPeriod", "Nil", "ipo_data_period"],
  ["DataPeriod_Plan", "Nil", "ipo_data_period"],
  ["NewIPOInfo", "Code + ListingDate", "ipo_overview"],
  ["ExpectedTimetable", "Code + ListingDate", "ipo_timetable"],
  ["CompanySummary", "Code + ListingDate", "ipo_summary"],
  ["OfferStatistics", "Code + ListingDate", "ipo_offer_statistics"],
  ["PartiesInvolved", "Code + ListingDate", "ipo_parties"],
  ["CompInfo", "Code + ListingDate", "ipo_corporate_info"],
  ["CSI_Info", "Code + ListingDate + CSI_EngName", "ipo_cornerstone"],
  ["Pool", "Code + ListingDate", "ipo_pool"],
  ["ClawBack", "Code + ListingDate", "ipo_clawback"],
  ["AllotmentResult", "Code + ListingDate + Pool + Share_App", "ipo_allotment"],
  ["AllotmentSummary", "Code + ListingDate", "ipo_allotment"],
  ["Plan_Info", "AppCode", "ipo_pipeline"],
  ["App_Detail", "Code + ListingDate", "ipo_application"],
  ["App_Share", "Code + ListingDate + Pool + Share_App", "ipo_application"],
  ["LockUpPeriod", "Code + ListingDate + LockUpShareType + LockUpEndDate1", "ipo_lockup"]
].map(([name, primaryKey, recordKind]) => ({ name, primaryKey, recordKind }));

const REFERENCED_CODE_TABLES = [
  ["CurrencyCode", "CurrCode"],
  ["SectorCode", "SectorCode"],
  ["IndustryCode", "IndustryCode"],
  ["SubIndustryCode", "SubIndustryCode"],
  ["RegistrarCode", "RegistrarCode"],
  ["LockUpShareType", "LockUpShareType"]
].map(([name, codeField]) => ({ name, codeField, recordKind: "vendor_code" }));

const NARRATIVE_SECTIONS = [
  ["business_overview", "EngBusinessOverview", "ChiBusinessOverview", "SimBusinessOverview"],
  ["future_plans", "EngFurturePlan", "ChiFurturePlan", "SimFurturePlan"],
  ["use_of_proceeds", "EngUProceed", "ChiUProceed", "SimUProceed"],
  ["risk_factors", "EngRiskFactor", "ChiRiskFactor", "SimRiskFactor"],
  ["competitive_strengths", "EngCompStrength", "ChiCompStrength", "SimCompStrength"],
  ["sponsor_summary", "EngSponsorName", "ChiSponsorName", "SimSponsorName"]
];

const OFFER_STAT_METRICS = [
  ["pre_pat", "EngPrePATStr", "ChiPrePATStr", "SimPrePATStr", true],
  ["pre_avg_eps", "EngPreAvgEPSStr", "ChiPreAvgEPSStr", "SimPreAvgEPSStr", true],
  ["pre_eps", "EngPreEPSStr", "ChiPreEPSStr", "SimPreEPSStr", true],
  ["pre_avg_pe", "EngPreAvgPEStr", "ChiPreAvgPEStr", "SimPreAvgPEStr", true],
  ["pre_pe", "EngPrePEStr", "ChiPrePEStr", "SimPrePEStr", true],
  ["pre_yield", "EngPreYieldStr", "ChiPreYieldStr", "SimPreYieldStr", true]
];

const TIMETABLE_EVENT_TYPES = new Map([
  ["ETDate00", "application_start"],
  ["ETDate05", "application_end"],
  ["ETDate06", "application_end"],
  ["ETDate08", "pricing"],
  ["ETDate13", "listing"],
  ["GM_TradeDate", "grey_market"]
]);

const args = parseArgs(process.argv.slice(2));
const datasetDir = resolve(process.cwd(), args.datasetDir ?? "docs/ipo-dataset");
const dryRun = args.dryRun === true || args.allowDbWrite !== true;
const manifestMode = args.manifest === true;
const progressEnabled = !dryRun;

if (!dryRun && args.allowDbWrite !== true) {
  fail("Refusing IPO MDB ingest write mode without --allow-db-write.");
}

const manifest = buildManifest(datasetDir, dryRun);
let ingestResult = null;

if (!dryRun) {
  if (manifest.status !== "dry_run_complete" || manifest.schema_diff.status !== "match") {
    fail(`Refusing DB write because MDB manifest is not clean: status=${manifest.status}, schema=${manifest.schema_diff.status}`);
  }
  ingestResult = await ingestToLocalPostgres(manifest);
}

const output = ingestResult === null ? manifest : { ...manifest, db_writes: true, ingest_result: ingestResult };

if (args.output) {
  writeFileSync(resolve(process.cwd(), args.output), `${JSON.stringify(output, null, 2)}\n`);
}

if (manifestMode) {
  console.log(JSON.stringify(output, null, 2));
} else {
  console.log(
    [
      `status=${output.status}`,
      `dataset_dir=${output.dataset_dir}`,
      `dry_run=${output.dry_run}`,
      `db_writes=${output.db_writes}`,
      `expected_newipo_tables=${output.expected_newipo_table_count}`,
      `referenced_code_tables=${output.referenced_code_table_count}`,
      `mdb_tools=${output.tools.mdb_tools_ready ? "ready" : "missing"}`,
      ingestResult ? `data_version=${ingestResult.data_version}` : null,
      ingestResult ? `raw_snapshots=${ingestResult.raw_snapshot_count}` : null,
      ingestResult ? `serving_rows=${ingestResult.serving_row_count}` : null
    ].filter(Boolean).join("\n")
  );
}

function buildManifest(root, isDryRun) {
  const newIpoPath = resolve(root, "NewIPO2.mdb");
  const codeTablePath = resolve(root, "CodeTable.mdb");
  const files = [
    newIpoPath,
    codeTablePath,
    resolve(root, "Master - Initial Public Offering (IPO) Information (2026-06-09).doc"),
    resolve(root, "Master - Code Table (Access) (2026-06-08).doc")
  ].map(fileManifest);
  const tools = {
    mdb_export: commandAvailable("mdb-export"),
    mdb_schema: commandAvailable("mdb-schema"),
    mdb_tables: commandAvailable("mdb-tables")
  };
  const mdbToolsReady = tools.mdb_export && tools.mdb_schema && tools.mdb_tables;
  const actualNewIpoTables =
    mdbToolsReady && existsSync(newIpoPath) ? readMdbTables(newIpoPath) : [];
  const actualCodeTables =
    mdbToolsReady && existsSync(codeTablePath) ? readMdbTables(codeTablePath) : [];
  const schemaDiff =
    mdbToolsReady && existsSync(newIpoPath)
      ? diffExpectedTables(EXPECTED_NEWIPO_TABLES.map((table) => table.name), actualNewIpoTables)
      : {
          missing_expected_tables: [],
          unexpected_tables: [],
          status: "not_run"
        };
  const codeSchemaDiff =
    mdbToolsReady && existsSync(codeTablePath)
      ? diffRequiredTables(REFERENCED_CODE_TABLES.map((table) => table.name), actualCodeTables)
      : {
          missing_expected_tables: [],
          unexpected_tables: [],
          status: "not_run"
        };
  const rowCounts =
    mdbToolsReady && existsSync(newIpoPath)
      ? Object.fromEntries(
          EXPECTED_NEWIPO_TABLES.map((table) => [
            table.name,
            readExportedRowCount(newIpoPath, table.name)
          ])
        )
      : {};
  const codeTableRowCounts =
    mdbToolsReady && existsSync(codeTablePath)
      ? Object.fromEntries(
          REFERENCED_CODE_TABLES.map((table) => [
            table.name,
            readExportedRowCount(codeTablePath, table.name)
          ])
        )
      : {};

  return {
    code_schema_diff: codeSchemaDiff,
    code_table_row_counts: codeTableRowCounts,
    code_tables: REFERENCED_CODE_TABLES.map((table) => table.name),
    dataset_dir: root,
    db_writes: !isDryRun,
    dry_run: isDryRun,
    expected_newipo_table_count: EXPECTED_NEWIPO_TABLES.length,
    expected_newipo_tables: EXPECTED_NEWIPO_TABLES,
    files,
    generated_at: new Date().toISOString(),
    manifest_version: "2026-06-24.ipo-mdb-dry-run-manifest.v0",
    referenced_code_table_count: REFERENCED_CODE_TABLES.length,
    row_counts: rowCounts,
    schema_diff: schemaDiff,
    source_name: SOURCE_NAME,
    status: computeStatus(files, mdbToolsReady),
    tools: {
      ...tools,
      mdb_tools_ready: mdbToolsReady
    },
    write_plan: {
      data_version_release_state: "held",
      first_write_target: "aiphabee_core.raw_source_batch",
      remote_held_ingest_requires_explicit_target: true,
      production_write_allowed: false,
      raw_target: "aiphabee_core.raw_snapshot",
      runtime_source_of_truth: "postgres",
      serving_targets: [
        "aiphabee_core.ipo_offering",
        "aiphabee_core.ipo_narrative",
        "aiphabee_core.ipo_timetable_event",
        "aiphabee_core.ipo_offer_statistic",
        "aiphabee_core.ipo_cornerstone",
        "aiphabee_core.ipo_allotment_summary",
        "aiphabee_core.ipo_pipeline_application"
      ],
      supplier_inflow: "mdb"
    }
  };
}

async function ingestToLocalPostgres(manifest) {
  const databaseUrl = args.databaseUrl ?? process.env.IPO_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    fail("Missing --database-url or IPO_DATABASE_URL/DATABASE_URL for local Postgres ingest.");
  }
  const databaseTarget = databaseWriteTarget(databaseUrl);
  assertDatabaseWriteAllowed(databaseTarget);

  const newIpoPath = resolve(manifest.dataset_dir, "NewIPO2.mdb");
  const codeTablePath = resolve(manifest.dataset_dir, "CodeTable.mdb");
  const bundleHash = createHash("sha256")
    .update(JSON.stringify(manifest.files.filter((file) => file.exists).map(({ name, sha256 }) => [name, sha256])))
    .digest("hex");
  const dataVersion = args.dataVersion ?? `ipo-mdb-${bundleHash.slice(0, 16)}`;
  const sourceBatchId = `ipo-mdb-batch-${bundleHash.slice(0, 16)}`;
  const sourceAsOf = new Date().toISOString();

  const tableRows = new Map();
  for (const table of EXPECTED_NEWIPO_TABLES) {
    tableRows.set(table.name, exportMdbTable(newIpoPath, table.name));
  }
  for (const table of REFERENCED_CODE_TABLES) {
    tableRows.set(table.name, exportMdbTable(codeTablePath, table.name));
  }

  const rawRows = [];
  for (const table of EXPECTED_NEWIPO_TABLES) {
    const rows = tableRows.get(table.name) ?? [];
    rows.forEach((row, index) => {
      const sourceRecordId = sourceRecordIdFor(table, row, index);
      rawRows.push(rawSnapshotRow({
        dataVersion,
        recordKind: table.recordKind,
        row,
        sourceBatchId,
        sourceRecordId,
        tableName: table.name
      }));
    });
  }
  for (const table of REFERENCED_CODE_TABLES) {
    const rows = tableRows.get(table.name) ?? [];
    rows.forEach((row, index) => {
      const sourceRecordId = sourceRecordIdFor(table, row, index);
      rawRows.push(rawSnapshotRow({
        dataVersion,
        recordKind: table.recordKind,
        row,
        sourceBatchId,
        sourceRecordId,
        tableName: table.name
      }));
    });
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  try {
    await configureIngestSession(client, databaseTarget);
    const remoteGuard =
      databaseTarget.kind === "remote"
        ? await assertRemoteHeldIngestPreconditions(client, dataVersion)
        : { kind: "local" };
    progress(`preflight target=${databaseTarget.target_env} data_version=${dataVersion}`);
    await client.query("begin");
    await upsertSourceBatch(client, {
      checksum: bundleHash,
      rowCount: rawRows.length,
      sourceAsOf,
      sourceBatchId
    });
    progress("raw_source_batch upserted");
    await upsertDataVersion(client, {
      dataVersion,
      sourceBatchId
    });
    progress("data_version_batch held upserted");
    await insertRawSnapshots(client, rawRows);
    progress(`raw_snapshot inserted rows=${rawRows.length}`);

    const servingCounts = {};
    servingCounts.vendor_code = await upsertVendorCodes(client, tableRows, dataVersion);
    progress(`vendor_code upserted rows=${servingCounts.vendor_code}`);
    servingCounts.ipo_offering = await upsertOfferings(client, tableRows, dataVersion);
    progress(`ipo_offering upserted rows=${servingCounts.ipo_offering}`);
    servingCounts.ipo_narrative = await upsertNarratives(client, tableRows, dataVersion);
    progress(`ipo_narrative upserted rows=${servingCounts.ipo_narrative}`);
    servingCounts.ipo_timetable_event = await upsertTimetableEvents(client, tableRows, dataVersion);
    progress(`ipo_timetable_event upserted rows=${servingCounts.ipo_timetable_event}`);
    servingCounts.ipo_offer_statistic = await upsertOfferStatistics(client, tableRows, dataVersion);
    progress(`ipo_offer_statistic upserted rows=${servingCounts.ipo_offer_statistic}`);
    servingCounts.ipo_cornerstone = await upsertCornerstones(client, tableRows, dataVersion);
    progress(`ipo_cornerstone upserted rows=${servingCounts.ipo_cornerstone}`);
    servingCounts.ipo_allotment_summary = await upsertAllotmentSummaries(client, tableRows, dataVersion);
    progress(`ipo_allotment_summary upserted rows=${servingCounts.ipo_allotment_summary}`);
    servingCounts.ipo_pipeline_application = await upsertPipelineApplications(client, tableRows, dataVersion);
    progress(`ipo_pipeline_application upserted rows=${servingCounts.ipo_pipeline_application}`);

    await client.query("commit");
    progress("transaction committed");
    return {
      data_version: dataVersion,
      release_state: "held",
      remote_ingest_guard: remoteGuard,
      raw_snapshot_count: rawRows.length,
      serving_row_count: Object.values(servingCounts).reduce((sum, count) => sum + count, 0),
      serving_counts: servingCounts,
      source_batch_id: sourceBatchId
    };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}

async function upsertSourceBatch(client, { checksum, rowCount, sourceAsOf, sourceBatchId }) {
  await client.query(
    `
      insert into aiphabee_core.raw_source_batch (
        source_batch_id,
        source_name,
        source_dataset,
        received_at,
        source_as_of,
        source_rights_status,
        checksum_sha256,
        row_count
      )
      values ($1, $2, $3, now(), $4, 'default_deny', $5, $6)
      on conflict (source_batch_id) do update set
        checksum_sha256 = excluded.checksum_sha256,
        row_count = excluded.row_count,
        source_as_of = excluded.source_as_of
    `,
    [sourceBatchId, SOURCE_NAME, SOURCE_DATASET, sourceAsOf, checksum, rowCount]
  );
}

async function upsertDataVersion(client, { dataVersion, sourceBatchId }) {
  await client.query(
    `
      insert into aiphabee_core.data_version_batch (
        data_version,
        source_batch_id,
        methodology_version,
        rights_policy_version,
        release_state
      )
      values ($1, $2, $3, $4, 'held')
      on conflict (data_version) do update set
        source_batch_id = excluded.source_batch_id,
        methodology_version = excluded.methodology_version,
        rights_policy_version = excluded.rights_policy_version,
        release_state = 'held',
        released_at = null
    `,
    [dataVersion, sourceBatchId, METHODOLOGY_VERSION, RIGHTS_POLICY_VERSION]
  );
}

async function insertRawSnapshots(client, rows) {
  for (const chunk of chunkRows(rows, 500)) {
    await client.query(
      `
        insert into aiphabee_core.raw_snapshot (
          raw_snapshot_id,
          source_batch_id,
          source_record_id,
          record_kind,
          payload,
          payload_hash_sha256,
          received_at,
          immutable,
          quality_state,
          data_version,
          methodology_version
        )
        select
          raw_snapshot_id,
          source_batch_id,
          source_record_id,
          record_kind,
          payload,
          payload_hash_sha256,
          now(),
          true,
          'HOLD',
          data_version,
          methodology_version
        from jsonb_to_recordset($1::jsonb) as row(
          raw_snapshot_id text,
          source_batch_id text,
          source_record_id text,
          record_kind text,
          payload jsonb,
          payload_hash_sha256 text,
          data_version text,
          methodology_version text
        )
        on conflict (raw_snapshot_id) do nothing
      `,
      [JSON.stringify(chunk)]
    );
  }
}

async function queryJsonbRecordsetChunks(client, sql, rows, chunkSize = SERVING_UPSERT_CHUNK_SIZE) {
  for (const chunk of chunkRows(rows, chunkSize)) {
    await client.query(sql, [JSON.stringify(chunk)]);
  }
}

async function upsertVendorCodes(client, tableRows, dataVersion) {
  const rows = [];
  for (const table of REFERENCED_CODE_TABLES) {
    const records = tableRows.get(table.name) ?? [];
    records.forEach((record, index) => {
      const code = text(record[table.codeField]);
      if (!code) return;
      const sourceRecordId = sourceRecordIdFor(table, record, index);
      rows.push({
        code,
        data_version: dataVersion,
        extra: record,
        name_en: text(record.EngName),
        name_zh_hans: text(record.SimName),
        name_zh_hant: text(record.ChiName),
        methodology_version: METHODOLOGY_VERSION,
        quality_state: "HOLD",
        raw_snapshot_id: rawSnapshotId(dataVersion, table.name, sourceRecordId),
        source_record_id: sourceRecordId,
        table_name: table.name
      });
    });
  }
  await queryJsonbRecordsetChunks(
    client,
    `
      insert into aiphabee_core.vendor_code (
        table_name, code, name_en, name_zh_hant, name_zh_hans, extra,
        source_record_id, raw_snapshot_id, data_version, methodology_version, quality_state
      )
      select
        table_name, code, name_en, name_zh_hant, name_zh_hans, extra,
        source_record_id, raw_snapshot_id, data_version, methodology_version, quality_state
      from jsonb_to_recordset($1::jsonb) as row(
        table_name text,
        code text,
        name_en text,
        name_zh_hant text,
        name_zh_hans text,
        extra jsonb,
        source_record_id text,
        raw_snapshot_id text,
        data_version text,
        methodology_version text,
        quality_state text
      )
      on conflict (table_name, code, data_version) do update set
        name_en = excluded.name_en,
        name_zh_hant = excluded.name_zh_hant,
        name_zh_hans = excluded.name_zh_hans,
        extra = excluded.extra,
        source_record_id = excluded.source_record_id,
        raw_snapshot_id = excluded.raw_snapshot_id,
        methodology_version = excluded.methodology_version,
        quality_state = excluded.quality_state,
        updated_at = now()
    `,
    rows
  );
  return rows.length;
}

async function upsertOfferings(client, tableRows, dataVersion) {
  const summaryRows = tableRows.get("CompanySummary") ?? [];
  const infoByOffering = byOfferingId(tableRows.get("NewIPOInfo") ?? []);
  let count = 0;
  for (let index = 0; index < summaryRows.length; index += 1) {
    const row = summaryRows[index];
    const listingDate = accessDate(row.ListingDate);
    if (!text(row.Code) || !listingDate) continue;
    const offeringId = offeringIdFor(row);
    const info = infoByOffering.get(offeringId) ?? {};
    const sourceRecordId = sourceRecordIdFor(tableSpec("CompanySummary"), row, index);
    await client.query(
      `
        insert into aiphabee_core.ipo_offering (
          offering_id, hkex_code, listing_date, ipo_status, listing_board, listing_type,
          listing_method_en, listing_method_zh_hant, listing_method_zh_hans,
          name_en, name_zh_hant, name_zh_hans, security_type, currency_code,
          sector_code, industry_code, sub_industry_code, offer_price_min, offer_price_max,
          final_offer_price, board_lot, entry_fee, par_value, public_offer_shares,
          placing_shares, international_offer_shares, preferential_offer_shares, new_shares,
          sale_shares, over_allotment_shares, total_offer_shares, market_cap_text_en,
          market_cap_text_zh_hant, market_cap_text_zh_hans, funds_raised_text_en,
          funds_raised_text_zh_hant, funds_raised_text_zh_hans, net_proceeds_text_en,
          net_proceeds_text_zh_hant, net_proceeds_text_zh_hans, one_lot_success_rate,
          over_subscription_multiple, clawback_type, lockup_end_date, eprospectus_url,
          eipo_url, contact, source_record_id, raw_snapshot_id, data_version,
          methodology_version, rights_policy_version, quality_state
        )
        values (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9,
          $10, $11, $12, $13, $14,
          $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24,
          $25, $26, $27, $28,
          $29, $30, $31, $32,
          $33, $34, $35,
          $36, $37, $38,
          $39, $40, $41,
          $42, $43, $44, $45,
          $46, $47::jsonb, $48, $49, $50,
          $51, $52, 'HOLD'
        )
        on conflict (offering_id) do update set
          hkex_code = excluded.hkex_code,
          listing_date = excluded.listing_date,
          ipo_status = excluded.ipo_status,
          listing_board = excluded.listing_board,
          listing_type = excluded.listing_type,
          listing_method_en = excluded.listing_method_en,
          listing_method_zh_hant = excluded.listing_method_zh_hant,
          listing_method_zh_hans = excluded.listing_method_zh_hans,
          name_en = excluded.name_en,
          name_zh_hant = excluded.name_zh_hant,
          name_zh_hans = excluded.name_zh_hans,
          currency_code = excluded.currency_code,
          sector_code = excluded.sector_code,
          industry_code = excluded.industry_code,
          sub_industry_code = excluded.sub_industry_code,
          offer_price_min = excluded.offer_price_min,
          offer_price_max = excluded.offer_price_max,
          final_offer_price = excluded.final_offer_price,
          board_lot = excluded.board_lot,
          entry_fee = excluded.entry_fee,
          public_offer_shares = excluded.public_offer_shares,
          placing_shares = excluded.placing_shares,
          international_offer_shares = excluded.international_offer_shares,
          preferential_offer_shares = excluded.preferential_offer_shares,
          new_shares = excluded.new_shares,
          sale_shares = excluded.sale_shares,
          over_allotment_shares = excluded.over_allotment_shares,
          total_offer_shares = excluded.total_offer_shares,
          market_cap_text_en = excluded.market_cap_text_en,
          market_cap_text_zh_hant = excluded.market_cap_text_zh_hant,
          market_cap_text_zh_hans = excluded.market_cap_text_zh_hans,
          funds_raised_text_en = excluded.funds_raised_text_en,
          funds_raised_text_zh_hant = excluded.funds_raised_text_zh_hant,
          funds_raised_text_zh_hans = excluded.funds_raised_text_zh_hans,
          net_proceeds_text_en = excluded.net_proceeds_text_en,
          net_proceeds_text_zh_hant = excluded.net_proceeds_text_zh_hant,
          net_proceeds_text_zh_hans = excluded.net_proceeds_text_zh_hans,
          one_lot_success_rate = excluded.one_lot_success_rate,
          over_subscription_multiple = excluded.over_subscription_multiple,
          clawback_type = excluded.clawback_type,
          lockup_end_date = excluded.lockup_end_date,
          eprospectus_url = excluded.eprospectus_url,
          eipo_url = excluded.eipo_url,
          contact = excluded.contact,
          source_record_id = excluded.source_record_id,
          raw_snapshot_id = excluded.raw_snapshot_id,
          data_version = excluded.data_version,
          methodology_version = excluded.methodology_version,
          rights_policy_version = excluded.rights_policy_version,
          quality_state = excluded.quality_state,
          updated_at = now()
      `,
      [
        offeringId,
        text(row.Code),
        listingDate,
        ipoStatus(row.IPOStatus),
        listingBoard(row.ListingBoard),
        listingType(row.ListingType),
        text(row.EngListMethod),
        text(row.ChiListMethod),
        text(row.SimListMethod),
        text(info.EngName),
        text(info.ChiName),
        text(info.SimName),
        null,
        text(row.OfferPrice_Curr) ?? text(row.Application_Currency),
        text(row.SectorCode),
        text(row.IndustryCode),
        text(row.SubIndustryCode),
        numeric(row.OfferPriceFrom),
        numeric(row.OfferPriceTo),
        numeric(row.OfferPrice),
        integer(row.BoardLot),
        text(row.Application_Amt),
        text(row.Par),
        numeric(row.PublicOfferedAmt),
        numeric(row.PlacingAmt),
        numeric(row.GlobalOfferedAmt),
        numeric(row.ReservedAmt),
        numeric(row.NewIssueAmt),
        numeric(row.SaleShareAmt),
        numeric(row.OverAllotmentAmt),
        numeric(row.TotalShareAmt),
        text(row.EngMarketCap),
        text(row.ChiMarketCap),
        text(row.SimMarketCap),
        text(row.EngFundsRaised),
        text(row.ChiFundsRaised),
        text(row.SimFundsRaised),
        text(row.EngNet_Proceed),
        text(row.ChiNet_Proceed),
        text(row.SimNet_Proceed),
        numeric(row.SuccessRate),
        numeric(row.SubscriptionRate),
        clawbackType(row.ClawbackType),
        accessDate(row.LockUpEndDate),
        text(row.eProspectus),
        text(row.eIPO_Link),
        JSON.stringify({
          email: text(row.Email),
          fax: text(row.Fax),
          tel: text(row.Tel),
          website: text(row.WebSite)
        }),
        sourceRecordId,
        rawSnapshotId(dataVersion, "CompanySummary", sourceRecordId),
        dataVersion,
        METHODOLOGY_VERSION,
        RIGHTS_POLICY_VERSION
      ]
    );
    count += 1;
  }
  return count;
}

async function upsertNarratives(client, tableRows, dataVersion) {
  const rows = tableRows.get("NewIPOInfo") ?? [];
  const records = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const offeringId = offeringIdFor(row);
    if (!offeringId) continue;
    const sourceRecordId = sourceRecordIdFor(tableSpec("NewIPOInfo"), row, rowIndex);
    for (const [sectionKey, enField, zhHantField, zhHansField] of NARRATIVE_SECTIONS) {
      for (const [lang, field] of [["en", enField], ["zh_hant", zhHantField], ["zh_hans", zhHansField]]) {
        const raw = text(row[field]);
        if (!raw) continue;
        const html = sanitizeHtml(raw);
        records.push({
          content_html: html,
          content_text: htmlToText(html),
          data_version: dataVersion,
          ipo_narrative_id: stableId("ipo_narrative", dataVersion, offeringId, sectionKey, lang),
          lang,
          methodology_version: METHODOLOGY_VERSION,
          offering_id: offeringId,
          quality_state: "HOLD",
          raw_snapshot_id: rawSnapshotId(dataVersion, "NewIPOInfo", sourceRecordId),
          rights_policy_version: RIGHTS_POLICY_VERSION,
          sanitizer_version: SANITIZER_VERSION,
          section_key: sectionKey,
          source_record_id: sourceRecordId
        });
      }
    }
  }
  await queryJsonbRecordsetChunks(
    client,
    `
      insert into aiphabee_core.ipo_narrative (
        ipo_narrative_id, offering_id, section_key, lang, content_html, content_text,
        sanitizer_version, source_record_id, raw_snapshot_id, data_version,
        methodology_version, rights_policy_version, quality_state
      )
      select
        ipo_narrative_id, offering_id, section_key, lang, content_html, content_text,
        sanitizer_version, source_record_id, raw_snapshot_id, data_version,
        methodology_version, rights_policy_version, quality_state
      from jsonb_to_recordset($1::jsonb) as row(
        ipo_narrative_id text,
        offering_id text,
        section_key text,
        lang text,
        content_html text,
        content_text text,
        sanitizer_version text,
        source_record_id text,
        raw_snapshot_id text,
        data_version text,
        methodology_version text,
        rights_policy_version text,
        quality_state text
      )
      on conflict (offering_id, section_key, lang, data_version) do update set
        content_html = excluded.content_html,
        content_text = excluded.content_text,
        sanitizer_version = excluded.sanitizer_version,
        source_record_id = excluded.source_record_id,
        raw_snapshot_id = excluded.raw_snapshot_id,
        methodology_version = excluded.methodology_version,
        rights_policy_version = excluded.rights_policy_version,
        quality_state = excluded.quality_state,
        updated_at = now()
    `,
    records
  );
  return records.length;
}

async function upsertTimetableEvents(client, tableRows, dataVersion) {
  const rows = tableRows.get("ExpectedTimetable") ?? [];
  const records = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const offeringId = offeringIdFor(row);
    if (!offeringId) continue;
    const sourceRecordId = sourceRecordIdFor(tableSpec("ExpectedTimetable"), row, rowIndex);
    const eventCodes = ["GM_TradeDate", ...Array.from({ length: 24 }, (_, index) => `ETDate${String(index).padStart(2, "0")}`)];
    for (const eventCode of eventCodes) {
      const eventDate = accessDate(row[eventCode]);
      if (!eventDate) continue;
      const suffix = eventCode.startsWith("ETDate") ? eventCode.slice("ETDate".length) : null;
      const eventType = TIMETABLE_EVENT_TYPES.get(eventCode) ?? "market_event";
      records.push({
        data_version: dataVersion,
        event_at: accessTimestamp(row[eventCode]),
        event_code: eventCode,
        event_date: eventDate,
        event_type: eventType,
        has_time: hasTime(row[eventCode]),
        ipo_timetable_event_id: stableId("ipo_timetable_event", dataVersion, offeringId, eventCode),
        methodology_version: METHODOLOGY_VERSION,
        offering_id: offeringId,
        quality_state: "HOLD",
        raw_snapshot_id: rawSnapshotId(dataVersion, "ExpectedTimetable", sourceRecordId),
        rights_policy_version: RIGHTS_POLICY_VERSION,
        source_record_id: sourceRecordId,
        title_en: suffix ? text(row[`EngTitle${suffix}`]) ?? eventCode : "Grey market trading",
        title_zh_hans: suffix ? text(row[`SimTitle${suffix}`]) ?? eventCode : "暗盘交易",
        title_zh_hant: suffix ? text(row[`ChiTitle${suffix}`]) ?? eventCode : "暗盤交易"
      });
    }
  }
  await queryJsonbRecordsetChunks(
    client,
    `
      insert into aiphabee_core.ipo_timetable_event (
        ipo_timetable_event_id, offering_id, event_code, event_at, event_date, has_time,
        event_type, title_en, title_zh_hant, title_zh_hans, source_record_id,
        raw_snapshot_id, data_version, methodology_version, rights_policy_version, quality_state
      )
      select
        ipo_timetable_event_id, offering_id, event_code, event_at, event_date, has_time,
        event_type, title_en, title_zh_hant, title_zh_hans, source_record_id,
        raw_snapshot_id, data_version, methodology_version, rights_policy_version, quality_state
      from jsonb_to_recordset($1::jsonb) as row(
        ipo_timetable_event_id text,
        offering_id text,
        event_code text,
        event_at timestamptz,
        event_date date,
        has_time boolean,
        event_type text,
        title_en text,
        title_zh_hant text,
        title_zh_hans text,
        source_record_id text,
        raw_snapshot_id text,
        data_version text,
        methodology_version text,
        rights_policy_version text,
        quality_state text
      )
      on conflict (ipo_timetable_event_id) do update set
        event_at = excluded.event_at,
        event_date = excluded.event_date,
        has_time = excluded.has_time,
        event_type = excluded.event_type,
        title_en = excluded.title_en,
        title_zh_hant = excluded.title_zh_hant,
        title_zh_hans = excluded.title_zh_hans,
        source_record_id = excluded.source_record_id,
        raw_snapshot_id = excluded.raw_snapshot_id,
        methodology_version = excluded.methodology_version,
        rights_policy_version = excluded.rights_policy_version,
        quality_state = excluded.quality_state,
        updated_at = now()
    `,
    records
  );
  return records.length;
}

async function upsertOfferStatistics(client, tableRows, dataVersion) {
  const rows = tableRows.get("OfferStatistics") ?? [];
  const records = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const offeringId = offeringIdFor(row);
    if (!offeringId) continue;
    const sourceRecordId = sourceRecordIdFor(tableSpec("OfferStatistics"), row, rowIndex);
    for (const [metricKey, enField, zhHantField, zhHansField, forwardLooking] of OFFER_STAT_METRICS) {
      if (!text(row[enField]) && !text(row[zhHantField]) && !text(row[zhHansField])) continue;
      records.push({
        data_version: dataVersion,
        forward_looking: Boolean(forwardLooking),
        ipo_offer_statistic_id: stableId("ipo_offer_statistic", dataVersion, offeringId, reportType(row.ReportType), metricKey),
        methodology_version: METHODOLOGY_VERSION,
        metric_key: metricKey,
        offering_id: offeringId,
        quality_state: "HOLD",
        raw_snapshot_id: rawSnapshotId(dataVersion, "OfferStatistics", sourceRecordId),
        report_type: reportType(row.ReportType),
        rights_policy_version: RIGHTS_POLICY_VERSION,
        source_record_id: sourceRecordId,
        value_en: text(row[enField]),
        value_zh_hans: text(row[zhHansField]),
        value_zh_hant: text(row[zhHantField])
      });
    }
  }
  await queryJsonbRecordsetChunks(
    client,
    `
      insert into aiphabee_core.ipo_offer_statistic (
        ipo_offer_statistic_id, offering_id, report_type, report_date, metric_key,
        value_en, value_zh_hant, value_zh_hans, forward_looking, source_record_id,
        raw_snapshot_id, data_version, methodology_version, rights_policy_version, quality_state
      )
      select
        ipo_offer_statistic_id, offering_id, report_type, null::date, metric_key,
        value_en, value_zh_hant, value_zh_hans, forward_looking, source_record_id,
        raw_snapshot_id, data_version, methodology_version, rights_policy_version, quality_state
      from jsonb_to_recordset($1::jsonb) as row(
        ipo_offer_statistic_id text,
        offering_id text,
        report_type text,
        metric_key text,
        value_en text,
        value_zh_hant text,
        value_zh_hans text,
        forward_looking boolean,
        source_record_id text,
        raw_snapshot_id text,
        data_version text,
        methodology_version text,
        rights_policy_version text,
        quality_state text
      )
      on conflict (offering_id, report_type, metric_key, data_version) do update set
        value_en = excluded.value_en,
        value_zh_hant = excluded.value_zh_hant,
        value_zh_hans = excluded.value_zh_hans,
        forward_looking = excluded.forward_looking,
        source_record_id = excluded.source_record_id,
        raw_snapshot_id = excluded.raw_snapshot_id,
        methodology_version = excluded.methodology_version,
        rights_policy_version = excluded.rights_policy_version,
        quality_state = excluded.quality_state,
        updated_at = now()
    `,
    records
  );
  return records.length;
}

async function upsertCornerstones(client, tableRows, dataVersion) {
  const rows = tableRows.get("CSI_Info") ?? [];
  const records = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const offeringId = offeringIdFor(row);
    if (!offeringId) continue;
    const sourceRecordId = sourceRecordIdFor(tableSpec("CSI_Info"), row, rowIndex);
    records.push({
      data_version: dataVersion,
      final_subscribed_shares: numeric(row.SubShare_Final),
      invest_amount: numeric(row.Invest_Amt),
      invest_currency_code: text(row.Invest_Currency),
      investor_name_en: text(row.CSI_EngName),
      investor_name_zh_hans: text(row.CSI_SimName),
      investor_name_zh_hant: text(row.CSI_ChiName),
      ipo_cornerstone_id: stableId("ipo_cornerstone", dataVersion, sourceRecordId),
      issued_share_pct: numeric(row.SubShare_FinalPer_IS) ?? numeric(row.SubShare_HighPer_IS),
      lockup_period_text: accessDate(row.CSI_LockUpExpDate),
      max_subscribed_shares: numeric(row.SubShare_High),
      methodology_version: METHODOLOGY_VERSION,
      offer_share_pct: numeric(row.SubShare_FinalPer_OS) ?? numeric(row.SubShare_HighPer_OS),
      offering_id: offeringId,
      profile_en: text(row.CSI_EngProfile),
      profile_zh_hans: text(row.CSI_SimProfile),
      profile_zh_hant: text(row.CSI_ChiProfile),
      quality_state: "HOLD",
      raw_snapshot_id: rawSnapshotId(dataVersion, "CSI_Info", sourceRecordId),
      rights_policy_version: RIGHTS_POLICY_VERSION,
      source_record_id: sourceRecordId
    });
  }
  await queryJsonbRecordsetChunks(
    client,
    `
      insert into aiphabee_core.ipo_cornerstone (
        ipo_cornerstone_id, offering_id, investor_name_en, investor_name_zh_hant,
        investor_name_zh_hans, invest_currency_code, invest_amount, max_subscribed_shares,
        final_subscribed_shares, offer_share_pct, issued_share_pct, lockup_period_text,
        profile_en, profile_zh_hant, profile_zh_hans, source_record_id, raw_snapshot_id,
        data_version, methodology_version, rights_policy_version, quality_state
      )
      select
        ipo_cornerstone_id, offering_id, investor_name_en, investor_name_zh_hant,
        investor_name_zh_hans, invest_currency_code, invest_amount, max_subscribed_shares,
        final_subscribed_shares, offer_share_pct, issued_share_pct, lockup_period_text,
        profile_en, profile_zh_hant, profile_zh_hans, source_record_id, raw_snapshot_id,
        data_version, methodology_version, rights_policy_version, quality_state
      from jsonb_to_recordset($1::jsonb) as row(
        ipo_cornerstone_id text,
        offering_id text,
        investor_name_en text,
        investor_name_zh_hant text,
        investor_name_zh_hans text,
        invest_currency_code text,
        invest_amount numeric,
        max_subscribed_shares numeric,
        final_subscribed_shares numeric,
        offer_share_pct numeric,
        issued_share_pct numeric,
        lockup_period_text text,
        profile_en text,
        profile_zh_hant text,
        profile_zh_hans text,
        source_record_id text,
        raw_snapshot_id text,
        data_version text,
        methodology_version text,
        rights_policy_version text,
        quality_state text
      )
      on conflict (ipo_cornerstone_id) do update set
        investor_name_en = excluded.investor_name_en,
        investor_name_zh_hant = excluded.investor_name_zh_hant,
        investor_name_zh_hans = excluded.investor_name_zh_hans,
        invest_currency_code = excluded.invest_currency_code,
        invest_amount = excluded.invest_amount,
        max_subscribed_shares = excluded.max_subscribed_shares,
        final_subscribed_shares = excluded.final_subscribed_shares,
        offer_share_pct = excluded.offer_share_pct,
        issued_share_pct = excluded.issued_share_pct,
        lockup_period_text = excluded.lockup_period_text,
        profile_en = excluded.profile_en,
        profile_zh_hant = excluded.profile_zh_hant,
        profile_zh_hans = excluded.profile_zh_hans,
        source_record_id = excluded.source_record_id,
        raw_snapshot_id = excluded.raw_snapshot_id,
        methodology_version = excluded.methodology_version,
        rights_policy_version = excluded.rights_policy_version,
        quality_state = excluded.quality_state,
        updated_at = now()
    `,
    records
  );
  return records.length;
}

async function upsertAllotmentSummaries(client, tableRows, dataVersion) {
  const rows = tableRows.get("AllotmentSummary") ?? [];
  let count = 0;
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const offeringId = offeringIdFor(row);
    if (!offeringId) continue;
    const sourceRecordId = sourceRecordIdFor(tableSpec("AllotmentSummary"), row, rowIndex);
    await client.query(
      `
        insert into aiphabee_core.ipo_allotment_summary (
          offering_id, final_offer_price_text_en, final_offer_price_text_zh_hant,
          final_offer_price_text_zh_hans, valid_application_count, applied_shares,
          applied_amount_text_en, applied_amount_text_zh_hant, applied_amount_text_zh_hans,
          over_subscription_multiple, one_lot_success_rate, one_lot_guarantee,
          maximum_application_text, cornerstone_total_text, result_url, source_record_id,
          raw_snapshot_id, data_version, methodology_version, rights_policy_version, quality_state
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'HOLD')
        on conflict (offering_id) do update set
          final_offer_price_text_en = excluded.final_offer_price_text_en,
          final_offer_price_text_zh_hant = excluded.final_offer_price_text_zh_hant,
          final_offer_price_text_zh_hans = excluded.final_offer_price_text_zh_hans,
          valid_application_count = excluded.valid_application_count,
          applied_shares = excluded.applied_shares,
          applied_amount_text_en = excluded.applied_amount_text_en,
          applied_amount_text_zh_hant = excluded.applied_amount_text_zh_hant,
          applied_amount_text_zh_hans = excluded.applied_amount_text_zh_hans,
          over_subscription_multiple = excluded.over_subscription_multiple,
          one_lot_success_rate = excluded.one_lot_success_rate,
          one_lot_guarantee = excluded.one_lot_guarantee,
          maximum_application_text = excluded.maximum_application_text,
          cornerstone_total_text = excluded.cornerstone_total_text,
          result_url = excluded.result_url,
          source_record_id = excluded.source_record_id,
          raw_snapshot_id = excluded.raw_snapshot_id,
          data_version = excluded.data_version,
          methodology_version = excluded.methodology_version,
          rights_policy_version = excluded.rights_policy_version,
          quality_state = excluded.quality_state,
          updated_at = now()
      `,
      [
        offeringId,
        text(row.EngPreOfferPriceStr),
        text(row.ChiPreOfferPriceStr),
        text(row.SimPreOfferPriceStr),
        integer(row.App_Count),
        numeric(row.TotalShare_Applied),
        text(row.TotalAmount_Application),
        text(row.TotalAmount_Application),
        text(row.TotalAmount_Application),
        numeric(row.SubscriptionRate),
        numeric(row.SuccessRate),
        text(row.One_Lot_Guard_Lot),
        text(row.Max_Share_App_No),
        text(row.Invest_Amt_CSI),
        text(row.AllotmentResultLink),
        sourceRecordId,
        rawSnapshotId(dataVersion, "AllotmentSummary", sourceRecordId),
        dataVersion,
        METHODOLOGY_VERSION,
        RIGHTS_POLICY_VERSION
      ]
    );
    count += 1;
  }
  return count;
}

async function upsertPipelineApplications(client, tableRows, dataVersion) {
  const rows = tableRows.get("Plan_Info") ?? [];
  const knownOfferingIds = new Set((tableRows.get("CompanySummary") ?? []).map(offeringIdFor).filter(Boolean));
  const records = [];
  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];
    const appCode = text(row.AppCode);
    if (!appCode) continue;
    const listDate = accessDate(row.ListDate);
    const offeringId = text(row.ListCode) && listDate ? `${text(row.ListCode)}|${listDate}` : null;
    const linkedOfferingId = offeringId && knownOfferingIds.has(offeringId) ? offeringId : null;
    const sourceRecordId = sourceRecordIdFor(tableSpec("Plan_Info"), row, rowIndex);
    records.push({
      app_code: appCode,
      business_overview_en: text(row.AppBOEngText),
      business_overview_zh_hans: text(row.AppBOSimText),
      business_overview_zh_hant: text(row.AppBOChiText),
      data_version: dataVersion,
      industry_code: text(row.IndustryCode),
      list_code: text(row.ListCode),
      list_date: listDate,
      market: listMarket(row.ListMarket),
      methodology_version: METHODOLOGY_VERSION,
      name_en: text(row.EngName),
      name_zh_hans: text(row.SimName),
      name_zh_hant: text(row.ChiName),
      offering_id: linkedOfferingId,
      phip_date: accessDate(row.PHIPDate),
      pipeline_status: pipelineStatus(row.Status),
      publish_date: accessDate(row.PostDate),
      quality_state: "HOLD",
      raw_snapshot_id: rawSnapshotId(dataVersion, "Plan_Info", sourceRecordId),
      rights_policy_version: RIGHTS_POLICY_VERSION,
      sector_code: text(row.SectorCode),
      source_record_id: sourceRecordId,
      sponsor_en: text(row.EngSponsorName),
      sponsor_zh_hans: text(row.SimSponsorName),
      sponsor_zh_hant: text(row.ChiSponsorName)
    });
  }
  await queryJsonbRecordsetChunks(
    client,
    `
      insert into aiphabee_core.ipo_pipeline_application (
        app_code, publish_date, phip_date, market, pipeline_status, name_en,
        name_zh_hant, name_zh_hans, sector_code, industry_code, sponsor_en,
        sponsor_zh_hant, sponsor_zh_hans, business_overview_en,
        business_overview_zh_hant, business_overview_zh_hans, list_code, list_date,
        offering_id, source_record_id, raw_snapshot_id, data_version,
        methodology_version, rights_policy_version, quality_state
      )
      select
        app_code, publish_date, phip_date, market, pipeline_status, name_en,
        name_zh_hant, name_zh_hans, sector_code, industry_code, sponsor_en,
        sponsor_zh_hant, sponsor_zh_hans, business_overview_en,
        business_overview_zh_hant, business_overview_zh_hans, list_code, list_date,
        offering_id, source_record_id, raw_snapshot_id, data_version,
        methodology_version, rights_policy_version, quality_state
      from jsonb_to_recordset($1::jsonb) as row(
        app_code text,
        publish_date date,
        phip_date date,
        market text,
        pipeline_status text,
        name_en text,
        name_zh_hant text,
        name_zh_hans text,
        sector_code text,
        industry_code text,
        sponsor_en text,
        sponsor_zh_hant text,
        sponsor_zh_hans text,
        business_overview_en text,
        business_overview_zh_hant text,
        business_overview_zh_hans text,
        list_code text,
        list_date date,
        offering_id text,
        source_record_id text,
        raw_snapshot_id text,
        data_version text,
        methodology_version text,
        rights_policy_version text,
        quality_state text
      )
      on conflict (app_code) do update set
        publish_date = excluded.publish_date,
        phip_date = excluded.phip_date,
        market = excluded.market,
        pipeline_status = excluded.pipeline_status,
        name_en = excluded.name_en,
        name_zh_hant = excluded.name_zh_hant,
        name_zh_hans = excluded.name_zh_hans,
        sector_code = excluded.sector_code,
        industry_code = excluded.industry_code,
        sponsor_en = excluded.sponsor_en,
        sponsor_zh_hant = excluded.sponsor_zh_hant,
        sponsor_zh_hans = excluded.sponsor_zh_hans,
        business_overview_en = excluded.business_overview_en,
        business_overview_zh_hant = excluded.business_overview_zh_hant,
        business_overview_zh_hans = excluded.business_overview_zh_hans,
        list_code = excluded.list_code,
        list_date = excluded.list_date,
        source_record_id = excluded.source_record_id,
        raw_snapshot_id = excluded.raw_snapshot_id,
        data_version = excluded.data_version,
        methodology_version = excluded.methodology_version,
        rights_policy_version = excluded.rights_policy_version,
        quality_state = excluded.quality_state,
        updated_at = now()
    `,
    records
  );
  return records.length;
}

function rawSnapshotRow({ dataVersion, recordKind, row, sourceBatchId, sourceRecordId, tableName }) {
  const payload = {
    row,
    source_dataset: tableName,
    source_name: SOURCE_NAME
  };
  const payloadJson = JSON.stringify(payload);
  return {
    data_version: dataVersion,
    methodology_version: METHODOLOGY_VERSION,
    payload,
    payload_hash_sha256: sha256Text(payloadJson),
    raw_snapshot_id: rawSnapshotId(dataVersion, tableName, sourceRecordId),
    record_kind: recordKind,
    source_batch_id: sourceBatchId,
    source_record_id: sourceRecordId
  };
}

function exportMdbTable(path, tableName) {
  const result = spawnSync(
    "mdb-export",
    ["-D", "%Y-%m-%d %H:%M:%S", path, tableName],
    {
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 512
    }
  );
  if (result.status !== 0) {
    fail(`mdb-export failed for ${tableName}: ${result.stderr || result.stdout}`);
  }
  const parsed = parseCsv(result.stdout);
  if (parsed.length === 0) return [];
  const [headers, ...records] = parsed;
  return records
    .filter((record) => record.some((value) => value !== ""))
    .map((record) => Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""])));
}

function parseCsv(input) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    const next = input[index + 1];
    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--dry-run") parsed.dryRun = true;
    else if (value === "--manifest") parsed.manifest = true;
    else if (value === "--allow-db-write") parsed.allowDbWrite = true;
    else if (value === "--allow-remote-held-ingest") parsed.allowRemoteHeldIngest = true;
    else if (value === "--dataset-dir") parsed.datasetDir = values[++index];
    else if (value === "--output") parsed.output = values[++index];
    else if (value === "--database-url") parsed.databaseUrl = values[++index];
    else if (value === "--data-version") parsed.dataVersion = values[++index];
    else if (value === "--progress") parsed.progress = true;
    else if (value === "--target-env") parsed.targetEnv = values[++index];
  }
  return parsed;
}

function commandAvailable(command) {
  const result = spawnSync("command", ["-v", command], {
    encoding: "utf8",
    shell: true
  });
  return result.status === 0;
}

function fileManifest(path) {
  if (!existsSync(path)) {
    return {
      exists: false,
      name: basename(path)
    };
  }

  const stats = statSync(path);
  return {
    exists: true,
    name: basename(path),
    sha256: sha256File(path),
    size_bytes: stats.size
  };
}

function sha256File(path) {
  const hash = createHash("sha256");
  hash.update(readFileSync(path));
  return hash.digest("hex");
}

function sha256Text(value) {
  return createHash("sha256").update(value).digest("hex");
}

function readMdbTables(path) {
  const result = spawnSync("mdb-tables", ["-1", path], {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 8
  });
  if (result.status !== 0) {
    return [];
  }
  return result.stdout.split(/\r?\n/u).map((line) => line.trim()).filter(Boolean);
}

function readExportedRowCount(path, tableName) {
  const result = spawnSync(
    "mdb-export",
    ["-D", "%Y-%m-%d %H:%M:%S", path, tableName],
    {
      encoding: "utf8",
      maxBuffer: 1024 * 1024 * 512
    }
  );
  if (result.status !== 0) {
    return null;
  }
  return Math.max(0, parseCsv(result.stdout).length - 1);
}

function diffExpectedTables(expected, actual) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const missing = expected.filter((table) => !actualSet.has(table));
  const unexpected = actual.filter((table) => !expectedSet.has(table));
  return {
    missing_expected_tables: missing,
    status: missing.length === 0 && unexpected.length === 0 ? "match" : "mismatch",
    unexpected_tables: unexpected
  };
}

function diffRequiredTables(expected, actual) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const missing = expected.filter((table) => !actualSet.has(table));
  const unexpected = actual.filter((table) => !expectedSet.has(table));
  return {
    missing_expected_tables: missing,
    status: missing.length === 0 ? "match" : "mismatch",
    unreferenced_tables: unexpected
  };
}

function computeStatus(files, mdbToolsReady) {
  const mdbFilesPresent = files
    .filter((file) => file.name.endsWith(".mdb"))
    .every((file) => file.exists);
  if (!mdbFilesPresent) {
    return "dry_run_fixture_missing";
  }
  if (!mdbToolsReady) {
    return "blocked_missing_mdb_tools";
  }
  return "dry_run_complete";
}

function sourceRecordIdFor(table, row, index) {
  if (table.primaryKey === "Nil") {
    return `${table.name}|${index + 1}`;
  }
  if (table.codeField) {
    return `${table.name}|${text(row[table.codeField]) ?? index + 1}`;
  }
  const parts = table.primaryKey.split("+").map((part) => part.trim());
  return `${table.name}|${parts.map((part) => normalizedKeyPart(row[part])).join("|")}`;
}

function normalizedKeyPart(value) {
  const date = accessDate(value);
  return date ?? text(value) ?? "";
}

function rawSnapshotId(dataVersion, tableName, sourceRecordId) {
  return stableId("ipo_raw", dataVersion, tableName, sourceRecordId);
}

function stableId(prefix, ...parts) {
  return `${prefix}_${sha256Text(parts.join("|")).slice(0, 32)}`;
}

function tableSpec(name) {
  const spec = EXPECTED_NEWIPO_TABLES.find((table) => table.name === name);
  if (!spec) {
    throw new Error(`Unknown IPO table spec ${name}`);
  }
  return spec;
}

function byOfferingId(rows) {
  const map = new Map();
  for (const row of rows) {
    const offeringId = offeringIdFor(row);
    if (offeringId) map.set(offeringId, row);
  }
  return map;
}

function offeringIdFor(row) {
  const code = text(row.Code);
  const listingDate = accessDate(row.ListingDate);
  return code && listingDate ? `${code}|${listingDate}` : null;
}

function text(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === "" ? null : trimmed;
}

function numeric(value) {
  const raw = text(value);
  if (!raw) return null;
  const normalized = raw.replace(/,/gu, "");
  if (!/^-?\d+(?:\.\d+)?$/u.test(normalized)) return null;
  return Number(normalized);
}

function integer(value) {
  const number = numeric(value);
  return number === null ? null : Math.trunc(number);
}

function accessDate(value) {
  const raw = text(value);
  if (!raw) return null;
  const match = raw.match(/^(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})(?:\s+\d{1,2}:\d{2}:\d{2})?$/u);
  if (!match) return null;
  let year;
  let month;
  let day;
  if (match[1].length === 4) {
    year = Number(match[1]);
    month = Number(match[2]);
    day = Number(match[3]);
  } else {
    month = Number(match[1]);
    day = Number(match[2]);
    year = Number(match[3]);
    if (year < 100) year += year >= 70 ? 1900 : 2000;
  }
  if (!validDateParts(year, month, day)) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function accessTimestamp(value) {
  const date = accessDate(value);
  if (!date) return null;
  const raw = text(value) ?? "";
  const timeMatch = raw.match(/\s+(\d{1,2}):(\d{2}):(\d{2})$/u);
  const time = timeMatch
    ? `${String(Number(timeMatch[1])).padStart(2, "0")}:${timeMatch[2]}:${timeMatch[3]}`
    : "00:00:00";
  return `${date} ${time}+08`;
}

function hasTime(value) {
  const raw = text(value);
  return raw !== null && /\s+\d{1,2}:\d{2}:\d{2}$/u.test(raw) && !/\s+00:00:00$/u.test(raw);
}

function validDateParts(year, month, day) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

function ipoStatus(value) {
  const status = text(value);
  if (status === "Y") return "in_process";
  if (status === "N") return "cancelled";
  if (status === "S") return "suspended";
  if (status === "W") return "withdrawn";
  return "unknown";
}

function listingBoard(value) {
  const board = text(value)?.toUpperCase();
  if (board === "MAIN" || board === "GEM" || board === "NASQ") return board;
  return "UNKNOWN";
}

function listingType(value) {
  const current = text(value);
  if (current === "Normal" || current === "18A" || current === "18C") return current;
  return "Unknown";
}

function clawbackType(value) {
  const current = text(value)?.toUpperCase();
  if (current === "A" || current === "B" || current === "NA") return current;
  return "Unknown";
}

function reportType(value) {
  const current = text(value)?.toUpperCase();
  if (current === "F" || current === "H") return current;
  return "Unknown";
}

function listMarket(value) {
  const current = text(value);
  if (current === "1" || current === "MAIN") return "MAIN";
  if (current === "2" || current === "GEM") return "GEM";
  return "Unknown";
}

function pipelineStatus(value) {
  const current = text(value)?.toUpperCase();
  if (current && ["A", "L", "R", "W", "U"].includes(current)) return current;
  return "Unknown";
}

function sanitizeHtml(raw) {
  return raw
    .replace(/<script[\s\S]*?<\/script>/giu, "")
    .replace(/<style[\s\S]*?<\/style>/giu, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/giu, "")
    .replace(/\son\w+\s*=\s*'[^']*'/giu, "")
    .replace(/javascript:/giu, "")
    .replace(/<\s*br\s*\/?\s*>/giu, "<br>")
    .replace(/<\s*b\s*>/giu, "<b>")
    .replace(/<\s*\/\s*b\s*>/giu, "</b>")
    .replace(/<\s*i\s*>/giu, "<i>")
    .replace(/<\s*\/\s*i\s*>/giu, "</i>")
    .replace(/<\s*u\s*>/giu, "<u>")
    .replace(/<\s*\/\s*u\s*>/giu, "</u>")
    .replace(/<(?!\/?(?:br|b|i|u)\b)[^>]+>/giu, "")
    .trim();
}

function htmlToText(html) {
  return html
    .replace(/<br>/giu, "\n")
    .replace(/<\/?[^>]+>/gu, "")
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
}

function chunkRows(rows, size) {
  const chunks = [];
  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }
  return chunks;
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

function assertDatabaseWriteAllowed(target) {
  if (target.kind === "local") {
    return;
  }

  if (args.allowRemoteHeldIngest !== true) {
    fail("Refusing IPO ingest write to non-local database URL without --allow-remote-held-ingest.");
  }

  if (!REMOTE_TARGET_ENVS.has(target.target_env)) {
    fail("Refusing remote IPO ingest without --target-env staging|production.");
  }
}

async function configureIngestSession(client, target) {
  if (target.kind !== "remote") {
    return;
  }

  await client.query("set statement_timeout = '120s'");
  await client.query("set idle_in_transaction_session_timeout = '120s'");
}

async function assertRemoteHeldIngestPreconditions(client, dataVersion) {
  const released = await client.query(
    `
      select data_version
      from aiphabee_core.data_version_batch
      where data_version like 'ipo-mdb-%'
        and release_state = 'released'
      order by data_version
      limit 5
    `
  );

  if (released.rows.length > 0) {
    fail("Refusing remote IPO held ingest because released IPO data_version rows already exist.");
  }

  const conflictingServing = await client.query(
    `
      select table_name, count(*)::int as row_count
      from (
        select 'aiphabee_core.ipo_offering' as table_name
        from aiphabee_core.ipo_offering
        where data_version <> $1
        union all
        select 'aiphabee_core.ipo_allotment_summary' as table_name
        from aiphabee_core.ipo_allotment_summary
        where data_version <> $1
        union all
        select 'aiphabee_core.ipo_pipeline_application' as table_name
        from aiphabee_core.ipo_pipeline_application
        where data_version <> $1
      ) conflicts
      group by table_name
      order by table_name
    `,
    [dataVersion]
  );

  if (conflictingServing.rows.length > 0) {
    fail("Refusing remote IPO held ingest because non-versioned serving tables contain a different IPO data_version.");
  }

  const existing = await client.query(
    `
      select release_state, count(*)::int as row_count
      from aiphabee_core.data_version_batch
      where data_version like 'ipo-mdb-%'
      group by release_state
      order by release_state
    `
  );

  return {
    existing_ipo_data_versions: existing.rows,
    kind: "remote_held_ingest",
    target_env: args.targetEnv
  };
}

function progress(message) {
  if (!progressEnabled && args.progress !== true) {
    return;
  }

  console.error(`[ipo-ingest] ${new Date().toISOString()} ${message}`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
