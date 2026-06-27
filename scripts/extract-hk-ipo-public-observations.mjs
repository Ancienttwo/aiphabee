#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFileSync, writeSync } from "node:fs";
import { resolve } from "node:path";

const ADAPTER_VERSION = "2026-06-28.hk-ipo-public-observation-adapter.v0";
const contractPath = "deploy/ingest/hk-ipo-public-sources.contract.json";
const fixturePath = "skills/hkex-news-crawl-qa/evals/public-source-observation-fixtures.json";
const args = process.argv.slice(2);
const live = args.includes("--live");
const fixturesMode = args.includes("--fixtures") || !live;
const check = args.includes("--check");
const sourceFilter = optionValues("--source");

const contract = readJson(contractPath);
const sourceById = new Map(contract.sources.map((source) => [source.id, source]));
const errors = [];
const runs = fixturesMode ? runFixtures() : await runLive();

if (check) {
  for (const run of runs) {
    errors.push(...validateObservationRun(run));
  }
}

if (errors.length > 0) {
  emit(
    {
      adapter_version: ADAPTER_VERSION,
      errors,
      mode: live ? "live" : "fixtures",
      runs: summarizeRuns(runs),
      status: "invalid_public_ipo_observations"
    },
    1
  );
}

emit(
  check
    ? {
        adapter_version: ADAPTER_VERSION,
        mode: live ? "live" : "fixtures",
        runs: summarizeRuns(runs),
        status: "ok"
      }
    : {
        adapter_version: ADAPTER_VERSION,
        mode: live ? "live" : "fixtures",
        runs,
        status: "ok"
      },
  0
);

function runFixtures() {
  const fixtureSet = readJson(fixturePath);
  if (fixtureSet.version !== "2026-06-28.hk-ipo-public-observation-fixtures.v0") {
    errors.push("fixture version mismatch");
  }
  if (fixtureSet.adapter_version !== ADAPTER_VERSION) {
    errors.push("fixture adapter_version mismatch");
  }
  if (!Array.isArray(fixtureSet.fixtures)) {
    errors.push("fixtures must be an array");
    return [];
  }

  return fixtureSet.fixtures
    .filter((fixture) => selectedSource(fixture.source_id))
    .map((fixture) => {
      const source = sourceById.get(fixture.source_id);
      if (!source) {
        errors.push(`fixture source not found in contract: ${fixture.source_id}`);
        return emptyRun(fixture.source_id, fixture.source_url, fixture.observed_at);
      }
      const run = parseSourceHtml({
        html: fixture.html,
        observedAt: fixture.observed_at,
        source,
        sourceUrl: fixture.source_url
      });
      if (check) {
        errors.push(...validateFixtureExpected(run, fixture.expected, fixture.source_id));
      }
      return run;
    });
}

async function runLive() {
  const candidates = contract.sources.filter((source) => source.source_status === "candidate" && selectedSource(source.id));
  const liveRuns = [];
  for (const source of candidates) {
    const response = await fetchText(source.entry_url);
    if (response.status !== 200) {
      errors.push(`${source.id} expected HTTP 200, got ${response.status}`);
      liveRuns.push(emptyRun(source.id, source.entry_url, new Date().toISOString()));
      continue;
    }
    liveRuns.push(
      parseSourceHtml({
        html: response.text,
        observedAt: new Date().toISOString(),
        source,
        sourceUrl: source.entry_url
      })
    );
  }
  return liveRuns;
}

function parseSourceHtml({ html, observedAt, source, sourceUrl }) {
  if (source.id === "aastocks_ipo_plus") {
    return parseAastocks({ html, observedAt, source, sourceUrl });
  }
  if (source.id === "vbkr_hk_ipo") {
    return parseVbkr({ html, observedAt, source, sourceUrl });
  }
  return emptyRun(source.id, sourceUrl, observedAt);
}

function parseAastocks({ html, observedAt, source, sourceUrl }) {
  const observations = [];
  const tables = extractTitledTables(html);
  for (const table of tables) {
    const headers = extractCells(table.thead).map(cleanText);
    const rows = extractRows(table.tbody);
    for (const rowHtml of rows) {
      const symbol = firstMatch(rowHtml, /company-summary\?symbol=(\d{5})/iu);
      if (!symbol) continue;
      const securityCode = normalizeSecurityCode(symbol);
      const cells = extractCells(rowHtml).map(cleanText);
      const companyName = cleanText(firstMatch(rowHtml, /company-summary\?symbol=\d{5}[^>]*>([\s\S]*?)<\/a>/iu));
      const sourceRecordId = `${source.id}:${slug(table.title)}:${securityCode}`;
      const companySummaryUrl = absoluteUrl(
        firstMatch(rowHtml, /href="([^"]*company-summary\?symbol=\d{5}[^"]*)"/iu),
        sourceUrl
      );

      addObservation(observations, {
        confidence: 0.82,
        fieldName: "company_name",
        fieldValue: companyName,
        locator: `${table.title};field=Name/Code`,
        observedAt,
        provider: source.provider,
        securityCode,
        sourceId: source.id,
        sourceRecordId,
        sourceUrl
      });
      addObservation(observations, {
        confidence: 0.82,
        fieldName: "company_summary_url",
        fieldValue: companySummaryUrl,
        locator: `${table.title};field=Name/Code.link`,
        observedAt,
        provider: source.provider,
        securityCode,
        sourceId: source.id,
        sourceRecordId,
        sourceUrl
      });

      for (let index = 1; index < headers.length && index < cells.length; index += 1) {
        const fieldName = aastocksHeaderToField(headers[index]);
        if (!fieldName) continue;
        addObservation(observations, {
          confidence: 0.78,
          fieldName,
          fieldValue: normalizeFieldValue(fieldName, cells[index]),
          locator: `${table.title};row=${securityCode};column=${headers[index]}`,
          observedAt,
          provider: source.provider,
          securityCode,
          sourceId: source.id,
          sourceRecordId,
          sourceUrl
        });
      }
    }
  }

  return runFromObservations({ observations, observedAt, source, sourceUrl });
}

function parseVbkr({ html, observedAt, source, sourceUrl }) {
  const observations = [];
  const nuxt = extractNuxtExpression(html);
  if (!nuxt) {
    return runFromObservations({ observations, observedAt, source, sourceUrl });
  }
  const variables = parseNuxtVariables(nuxt);
  for (const arrayName of ["enableApplyList", "prepareListed"]) {
    const section = arrayName === "enableApplyList" ? "enable_apply" : "prepare_listed";
    for (const objectText of extractNuxtObjects(nuxt, arrayName)) {
      const securityCode = normalizeSecurityCode(readObjectField(objectText, "securityCode", variables));
      if (!securityCode) continue;
      const sourceRecordId = `${source.id}:${section}:${securityCode}`;
      const fieldMap = {
        applyEndTime: "apply_end_time",
        applyRate: "apply_rate",
        applyResultDate: "apply_result_date",
        applyStartDate: "apply_start_date",
        issueHighPrice: "issue_high_price",
        issueLowPrice: "issue_low_price",
        listedDate: "listed_date",
        lotSize: "lot_size",
        lowestFee: "lowest_fee_hkd",
        prospectusPath: "prospectus_url",
        securityName: "security_name",
        securityNameEn: "security_name_en",
        securityNameTc: "security_name_zh_hant",
        sponsors: "sponsors",
        sponsorsHk: "sponsors_zh_hant",
        stockStatus: "stock_status"
      };

      for (const [sourceField, fieldName] of Object.entries(fieldMap)) {
        const value = readObjectField(objectText, sourceField, variables);
        addObservation(observations, {
          confidence: 0.88,
          fieldName,
          fieldValue: normalizeFieldValue(fieldName, value),
          locator: `${arrayName};row=${securityCode};field=${sourceField}`,
          observedAt,
          provider: source.provider,
          securityCode,
          sourceId: source.id,
          sourceRecordId,
          sourceUrl
        });
      }
    }
  }
  return runFromObservations({ observations, observedAt, source, sourceUrl });
}

function runFromObservations({ observations, observedAt, source, sourceUrl }) {
  return {
    observation_kind: "third_party_ipo_observation",
    observed_at: observedAt,
    observations,
    provider: source.provider,
    record_count: new Set(observations.map((observation) => observation.source_record_id)).size,
    source_id: source.id,
    source_url: sourceUrl,
    writes_database: false
  };
}

function addObservation(observations, input) {
  if (input.fieldValue === undefined || input.fieldValue === null || input.fieldValue === "") return;
  if (Array.isArray(input.fieldValue) && input.fieldValue.length === 0) return;
  const payload = {
    confidence: input.confidence,
    conflict_status: "unreconciled",
    field_name: input.fieldName,
    field_value: input.fieldValue,
    field_value_type: fieldValueType(input.fieldValue),
    locator: input.locator,
    observed_at: input.observedAt,
    provider: input.provider,
    raw_snapshot_id: null,
    raw_snapshot_required: true,
    reconciled_with_hkex: false,
    security_code: input.securityCode,
    source_id: input.sourceId,
    source_record_id: input.sourceRecordId,
    source_url: input.sourceUrl
  };
  const idPayload = {
    ...payload,
    observed_at: undefined
  };
  observations.push({
    observation_id: `obs_${stableHash(idPayload).slice(0, 24)}`,
    ...payload
  });
}

function extractTitledTables(html) {
  const tables = [];
  const titlePattern = /<div[^>]*class="[^"]*\btitle\b[^"]*"[^>]*>([\s\S]*?)<\/div>/giu;
  for (const match of html.matchAll(titlePattern)) {
    const title = cleanText(match[1]);
    if (!isIpoSectionTitle(title)) continue;
    const afterTitle = html.slice(match.index + match[0].length);
    const tableMatch = afterTitle.match(/<table[\s\S]*?<\/table>/iu);
    if (!tableMatch) continue;
    const tableHtml = tableMatch[0];
    tables.push({
      tbody: firstMatch(tableHtml, /<tbody[^>]*>([\s\S]*?)<\/tbody>/iu) ?? tableHtml,
      thead: firstMatch(tableHtml, /<thead[^>]*>([\s\S]*?)<\/thead>/iu) ?? "",
      title
    });
  }
  return tables;
}

function isIpoSectionTitle(title) {
  return /Current IPOs|Upcoming Grey Market|Listed IPO|Grey Market Today/iu.test(title);
}

function extractRows(html) {
  return [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/giu)].map((match) => match[1]);
}

function extractCells(html) {
  return [...html.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/giu)].map((match) => match[1]);
}

function aastocksHeaderToField(header) {
  const normalized = header.toLowerCase().replace(/\s+/gu, " ").trim();
  const map = new Map([
    ["industry", "industry"],
    ["offer price", "offer_price_or_range"],
    ["listing price", "listing_price"],
    ["lot size", "lot_size"],
    ["entry fee", "entry_fee_hkd"],
    ["closing date", "closing_date"],
    ["listing date", "listing_date"],
    ["over-sub. rate", "oversubscription_rate"],
    ["one lot success rate", "one_lot_success_rate"],
    ["applied lots for 1 lot", "applied_lots_for_one_lot"],
    ["grey market date", "grey_market_date"]
  ]);
  return map.get(normalized);
}

function extractNuxtExpression(html) {
  const marker = "window.__NUXT__=";
  const start = html.indexOf(marker);
  if (start < 0) return null;
  const expressionStart = start + marker.length;
  const scriptEnd = html.indexOf(";</script>", expressionStart);
  if (scriptEnd < 0) return null;
  return html.slice(expressionStart, scriptEnd).trim();
}

function parseNuxtVariables(expression) {
  const functionMatch = expression.match(/^\(function\(([^)]*)\)\{return /u);
  if (!functionMatch) return new Map();
  const params = functionMatch[1].split(",").map((param) => param.trim()).filter(Boolean);
  let callStart = expression.lastIndexOf("})(");
  let argsOffset = 3;
  if (callStart < 0) {
    callStart = expression.lastIndexOf("}(");
    argsOffset = 2;
  }
  const callEnd = expression.lastIndexOf(")");
  if (callStart < 0 || callEnd <= callStart) return new Map();
  const argsText = expression.slice(callStart + argsOffset, callEnd);
  const values = splitTopLevel(argsText, ",").map(parseJsValueToken);
  return new Map(params.map((param, index) => [param, values[index]]));
}

function extractNuxtObjects(expression, arrayName) {
  const marker = `${arrayName}:[`;
  const start = expression.indexOf(marker);
  if (start < 0) return [];
  const bracketStart = start + marker.length - 1;
  const bracketEnd = findMatching(expression, bracketStart, "[", "]");
  if (bracketEnd < 0) return [];
  const arrayBody = expression.slice(bracketStart + 1, bracketEnd).trim();
  if (!arrayBody) return [];
  return splitTopLevel(arrayBody, ",").filter((part) => part.trim().startsWith("{"));
}

function readObjectField(objectText, key, variables) {
  const position = findObjectKey(objectText, key);
  if (position < 0) return undefined;
  const valueStart = objectText.indexOf(":", position) + 1;
  const valueText = readTopLevelValue(objectText, valueStart);
  return parseJsValueToken(valueText, variables);
}

function findObjectKey(objectText, key) {
  let quote = null;
  for (let index = 0; index < objectText.length; index += 1) {
    const char = objectText[index];
    if (quote) {
      if (char === "\\" && index + 1 < objectText.length) index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "\"" || char === "'") {
      quote = char;
      continue;
    }
    if (objectText.startsWith(`${key}:`, index)) {
      const previous = objectText[index - 1];
      if (previous === "{" || previous === "," || /\s/u.test(previous)) {
        return index;
      }
    }
  }
  return -1;
}

function readTopLevelValue(text, start) {
  let depth = 0;
  let quote = null;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === "\\" && index + 1 < text.length) index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "\"" || char === "'") {
      quote = char;
      continue;
    }
    if (char === "[" || char === "{" || char === "(") depth += 1;
    if (char === "]" || char === "}" || char === ")") {
      if (depth === 0) return text.slice(start, index).trim();
      depth -= 1;
    }
    if (char === "," && depth === 0) return text.slice(start, index).trim();
  }
  return text.slice(start).replace(/\}\s*$/u, "").trim();
}

function parseJsValueToken(rawToken, variables = new Map()) {
  const token = String(rawToken ?? "").trim();
  if (token === "" || token === "void 0" || token === "undefined") return undefined;
  if (token === "true") return true;
  if (token === "false") return false;
  if (token === "null") return null;
  if (/^-?\d+(?:\.\d+)?$/u.test(token)) return Number(token);
  if (token.startsWith("\"") || token.startsWith("'")) return parseJsString(token);
  if (token.startsWith("[") && token.endsWith("]")) {
    return splitTopLevel(token.slice(1, -1), ",")
      .map((part) => parseJsValueToken(part, variables))
      .filter((value) => value !== undefined && value !== null && value !== "");
  }
  if (variables.has(token)) return variables.get(token);
  return token;
}

function parseJsString(token) {
  if (token.startsWith("\"")) {
    try {
      return JSON.parse(token);
    } catch {
      return token.slice(1, -1);
    }
  }
  return token.slice(1, -1).replace(/\\'/gu, "'");
}

function splitTopLevel(text, delimiter) {
  const parts = [];
  let start = 0;
  let depth = 0;
  let quote = null;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === "\\" && index + 1 < text.length) index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "\"" || char === "'") {
      quote = char;
      continue;
    }
    if (char === "[" || char === "{" || char === "(") depth += 1;
    if (char === "]" || char === "}" || char === ")") depth -= 1;
    if (char === delimiter && depth === 0) {
      parts.push(text.slice(start, index).trim());
      start = index + 1;
    }
  }
  const tail = text.slice(start).trim();
  if (tail) parts.push(tail);
  return parts;
}

function findMatching(text, start, open, close) {
  let depth = 0;
  let quote = null;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (quote) {
      if (char === "\\" && index + 1 < text.length) index += 1;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "\"" || char === "'") {
      quote = char;
      continue;
    }
    if (char === open) depth += 1;
    if (char === close) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function validateObservationRun(run) {
  const validationErrors = [];
  if (!run.source_id || !run.provider || !run.source_url) {
    validationErrors.push("run must include source_id, provider, and source_url");
  }
  if (run.writes_database !== false) {
    validationErrors.push(`${run.source_id} must remain read-only`);
  }
  if (!Array.isArray(run.observations) || run.observations.length === 0) {
    validationErrors.push(`${run.source_id} must produce observations`);
    return validationErrors;
  }
  for (const observation of run.observations) {
    for (const field of [
      "observation_id",
      "source_id",
      "provider",
      "source_url",
      "observed_at",
      "source_record_id",
      "security_code",
      "field_name",
      "field_value",
      "field_value_type",
      "locator"
    ]) {
      if (observation[field] === undefined || observation[field] === null || observation[field] === "") {
        validationErrors.push(`${run.source_id} observation missing ${field}`);
      }
    }
    if (observation.raw_snapshot_id !== null) {
      validationErrors.push(`${observation.observation_id} must not claim a raw_snapshot_id before persistence`);
    }
    if (observation.raw_snapshot_required !== true) {
      validationErrors.push(`${observation.observation_id} must require a raw snapshot before promotion`);
    }
    if (observation.reconciled_with_hkex !== false || observation.conflict_status !== "unreconciled") {
      validationErrors.push(`${observation.observation_id} must stay unreconciled`);
    }
  }
  return validationErrors;
}

function validateFixtureExpected(run, expected, sourceId) {
  const validationErrors = [];
  if (!expected || typeof expected !== "object") return [`${sourceId} fixture missing expected contract`];
  const securityCodes = new Set(run.observations.map((observation) => observation.security_code));
  const fieldNames = new Set(run.observations.map((observation) => observation.field_name));
  if (run.record_count < expected.min_records) {
    validationErrors.push(`${sourceId} fixture expected at least ${expected.min_records} records`);
  }
  if (run.observations.length < expected.min_observations) {
    validationErrors.push(`${sourceId} fixture expected at least ${expected.min_observations} observations`);
  }
  for (const code of expected.required_security_codes ?? []) {
    if (!securityCodes.has(code)) validationErrors.push(`${sourceId} fixture missing security code ${code}`);
  }
  for (const field of expected.required_field_names ?? []) {
    if (!fieldNames.has(field)) validationErrors.push(`${sourceId} fixture missing field ${field}`);
  }
  return validationErrors;
}

function summarizeRuns(values) {
  return values.map((run) => ({
    field_names: [...new Set(run.observations.map((observation) => observation.field_name))].sort(),
    observation_count: run.observations.length,
    provider: run.provider,
    record_count: run.record_count,
    security_codes: [...new Set(run.observations.map((observation) => observation.security_code))].sort().slice(0, 20),
    source_id: run.source_id,
    source_url: run.source_url,
    writes_database: run.writes_database
  }));
}

function emptyRun(sourceId, sourceUrl, observedAt) {
  const source = sourceById.get(sourceId) ?? { id: sourceId, provider: "unknown" };
  return runFromObservations({
    observations: [],
    observedAt,
    source,
    sourceUrl
  });
}

async function fetchText(url) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,zh-HK;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AiphaBeePublicObservationAdapter/0.1"
      },
      signal: AbortSignal.timeout(20000)
    });
    return {
      status: response.status,
      text: await response.text()
    };
  } catch (error) {
    return {
      status: 0,
      text: `FETCH_ERROR:${error instanceof Error ? error.message : String(error)}`
    };
  }
}

function normalizeFieldValue(fieldName, value) {
  if (Array.isArray(value)) return value.map((item) => cleanScalar(item)).filter(Boolean);
  const clean = cleanScalar(value);
  if (clean === "") return undefined;
  if (fieldName.endsWith("_date") || fieldName === "listed_date") return normalizeDate(clean);
  if (["lot_size", "entry_fee_hkd", "lowest_fee_hkd", "issue_low_price", "issue_high_price", "stock_status"].includes(fieldName)) {
    const number = parseNumber(clean);
    return Number.isFinite(number) ? number : clean;
  }
  if (fieldName === "apply_rate" || fieldName === "oversubscription_rate" || fieldName === "one_lot_success_rate") {
    const number = parseNumber(clean.replace(/倍$/u, ""));
    return Number.isFinite(number) ? number : clean;
  }
  return clean;
}

function normalizeDate(value) {
  const match = value.match(/^(\d{4})[/-](\d{2})[/-](\d{2})$/u);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : value;
}

function parseNumber(value) {
  return Number(String(value).replace(/,/gu, "").trim());
}

function cleanScalar(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "number" || typeof value === "boolean") return value;
  return cleanText(String(value));
}

function cleanText(value) {
  return decodeHtml(String(value ?? ""))
    .replace(/<br\s*\/?>/giu, "\n")
    .replace(/<[^>]*>/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;/giu, "\"")
    .replace(/&#39;|&#x27;/giu, "'")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">");
}

function firstMatch(value, pattern) {
  return value.match(pattern)?.[1];
}

function absoluteUrl(value, baseUrl) {
  if (!value) return undefined;
  return new URL(decodeHtml(value), baseUrl).toString();
}

function normalizeSecurityCode(value) {
  const raw = cleanScalar(value);
  const match = raw.match(/(\d{5})(?:\.HK)?/iu);
  return match ? `${match[1]}.HK` : undefined;
}

function fieldValueType(value) {
  if (Array.isArray(value)) return "array";
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (/^\d{4}-\d{2}-\d{2}$/u.test(String(value))) return "date";
  if (/^https?:\/\//iu.test(String(value))) return "url";
  return "text";
}

function selectedSource(sourceId) {
  return sourceFilter.length === 0 || sourceFilter.includes(sourceId);
}

function optionValues(name) {
  const values = [];
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === name && args[index + 1]) values.push(args[index + 1]);
  }
  return values;
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "") || "section";
}

function stableHash(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(resolve(process.cwd(), path), "utf8"));
  } catch (error) {
    emit(
      {
        error: error instanceof Error ? error.message : String(error),
        path,
        status: "invalid_json"
      },
      1
    );
  }
}

function emit(payload, code) {
  writeSync(1, `${JSON.stringify(payload, null, 2)}\n`);
  process.exit(code);
}
