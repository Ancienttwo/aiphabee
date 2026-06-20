export const FINANCIAL_RESTATEMENT_ENGINE_VERSION =
  "2026-06-20.phase1.financial-restatement-engine.v0";
export const FINANCIAL_RESTATEMENT_METHODOLOGY_VERSION =
  "financial-restatement@synthetic-v0";
export const GET_FINANCIAL_FACTS_VERSION =
  "2026-06-21.phase1.get-financial-facts-tool-scaffold.v0";
export const GET_FINANCIAL_FACTS_DATA_VERSION = "financial-facts-synthetic-v0";

export type FinancialRestatementErrorCode =
  | "ACCOUNTING_IDENTITY_INVALID"
  | "PUBLISHED_AT_INVALID"
  | "RESTATEMENT_CHAIN_INVALID"
  | "STATEMENT_DIMENSION_MISMATCH";
export type FinancialFactsInputErrorCode =
  | "AS_OF_INVALID"
  | "INSTRUMENT_ID_REQUIRED"
  | "INVALID_CURSOR"
  | "INVALID_LIMIT"
  | "INVALID_RANGE";
export type FinancialFactsStatus =
  | "data_not_licensed"
  | "data_quality_hold"
  | "found"
  | "not_found"
  | "out_of_range"
  | "point_in_time_unavailable"
  | "too_many_rows";
export type FinancialFactStatementType =
  | "balance_sheet"
  | "cash_flow"
  | "income_statement";
export type FinancialFactMetric =
  | "assets"
  | "equity"
  | "free_cash_flow"
  | "liabilities"
  | "net_income"
  | "operating_cash_flow"
  | "revenue";
export type FinancialFactQualityState = "HOLD" | "PASS";

export interface FinancialStatementVersionInput {
  accountingStandard: string;
  companyId: string;
  currency: string;
  facts: Record<string, number>;
  isRestatement?: boolean;
  periodEnd: string;
  priorVersionId?: string;
  publishedAt: string;
  restatementReason?: string;
  scale: number;
  sourceRecordId: string;
  statementId: string;
  unit: string;
}

export interface GetFinancialFactsInput {
  asOf?: string;
  cursor?: string;
  from: string;
  instrumentId: string;
  limit?: number;
  metrics?: string[];
  statementTypes?: string[];
  to: string;
}

export interface FinancialFactRow {
  accountingStandard: string;
  companyId: string;
  currency: string;
  instrumentId: string;
  metricId: FinancialFactMetric;
  periodEnd: string;
  periodType: "FY" | "H1";
  publishedAt: string;
  qualityState: FinancialFactQualityState;
  restatementVersion: number;
  scale: number;
  sourceRecordId: string;
  statementId: string;
  statementType: FinancialFactStatementType;
  unit: string;
  value: number;
  versionStatus: "latest" | "prior";
}

export interface FinancialFactsDataset {
  accountingStandard: string;
  asOf: string;
  companyId: string;
  currency: string;
  facts: FinancialFactRow[];
  from: string;
  instrumentId: string;
  nextCursor?: string;
  qualityState: FinancialFactQualityState;
  rowCount: number;
  symbol: string;
  to: string;
  totalRows: number;
  unit: string;
}

export interface GetFinancialFactsResult {
  asOf: string;
  cursor?: string;
  dataVersion: typeof GET_FINANCIAL_FACTS_DATA_VERSION;
  facts?: FinancialFactsDataset;
  from: string;
  instrumentId: string;
  limit: number;
  liveDataAccess: false;
  methodologyVersion: typeof GET_FINANCIAL_FACTS_VERSION;
  provenance: Array<{
    data_version: string;
    methodology_version?: string;
    source: string;
    source_record_id: string;
  }>;
  rejectedMetrics: string[];
  rejectedStatementTypes: string[];
  requestedMetrics: FinancialFactMetric[];
  requestedStatementTypes: FinancialFactStatementType[];
  status: FinancialFactsStatus;
  to: string;
  toolName: "get_financial_facts";
  usage: {
    cached: boolean;
    credits: number;
    rows: number;
  };
}

export interface FinancialStatementVersion {
  accountingStandard: string;
  companyId: string;
  currency: string;
  facts: Record<string, number>;
  isLatest: boolean;
  isRestatement: boolean;
  periodEnd: string;
  priorVersionId?: string;
  publishedAt: string;
  restatementReason?: string;
  restatementVersion: number;
  scale: number;
  sourceRecordId: string;
  statementId: string;
  unit: string;
}

export interface FinancialRestatementDelta {
  metricId: string;
  originalValue: number;
  restatedValue: number;
  unit: string;
  valueDelta: number;
}

export interface FinancialRestatementEvent {
  companyId: string;
  dataVersionAfter: string;
  dataVersionBefore: string;
  deltas: FinancialRestatementDelta[];
  originalStatementId: string;
  reason: string;
  restatedAt: string;
  restatedStatementId: string;
}

export interface FinancialRestatementTimeline {
  engineVersion: typeof FINANCIAL_RESTATEMENT_ENGINE_VERSION;
  events: FinancialRestatementEvent[];
  methodologyVersion: string;
  status: "pass";
  versions: FinancialStatementVersion[];
}

export interface FinancialRestatementGoldenCase {
  asOfAfter: string;
  asOfBefore: string;
  caseId: string;
  expectedAfterStatementId: string;
  expectedBeforeStatementId: string;
  expectedDeltas: Array<Pick<FinancialRestatementDelta, "metricId" | "valueDelta">>;
  statements: FinancialStatementVersionInput[];
  tolerance: number;
}

export interface FinancialRestatementGoldenResult {
  engineVersion: typeof FINANCIAL_RESTATEMENT_ENGINE_VERSION;
  failures: Array<{
    caseId: string;
    reason: string;
  }>;
  methodologyVersion: typeof FINANCIAL_RESTATEMENT_METHODOLOGY_VERSION;
  passed: boolean;
  sampleCount: number;
}

export class FinancialRestatementError extends Error {
  readonly code: FinancialRestatementErrorCode;
  readonly details: Record<string, unknown>;

  constructor(
    code: FinancialRestatementErrorCode,
    message: string,
    details: Record<string, unknown> = {}
  ) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

export class FinancialFactsInputError extends Error {
  readonly code: FinancialFactsInputErrorCode;

  constructor(code: FinancialFactsInputErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

const DEFAULT_FINANCIAL_FACT_METRICS: readonly FinancialFactMetric[] = [
  "revenue",
  "net_income",
  "assets",
  "liabilities",
  "equity",
  "operating_cash_flow",
  "free_cash_flow"
];
const DEFAULT_FINANCIAL_FACT_STATEMENT_TYPES: readonly FinancialFactStatementType[] = [
  "income_statement",
  "balance_sheet",
  "cash_flow"
];
const DEFAULT_FINANCIAL_FACT_LIMIT = 4;
const MAX_FINANCIAL_FACT_LIMIT = 4;
const DEFAULT_FINANCIAL_FACT_AS_OF = "2024-04-01T00:00:00Z";

interface SyntheticFinancialFactsRecord {
  accountingStandard: string;
  companyId: string;
  currency: string;
  facts: readonly FinancialFactRow[];
  instrumentId: string;
  qualityState: FinancialFactQualityState;
  symbol: string;
  unit: string;
}

const SYNTHETIC_FINANCIAL_FACTS: readonly SyntheticFinancialFactsRecord[] = [
  {
    accountingStandard: "HKFRS",
    companyId: "co_hk_00700",
    currency: "HKD",
    facts: [
      createFactRow("eq_hk_00700", "co_hk_00700", "00700.HK", "income_statement", "revenue", 609015, "2023-12-31", "2024-03-20T08:00:00Z", 1),
      createFactRow("eq_hk_00700", "co_hk_00700", "00700.HK", "income_statement", "net_income", 115216, "2023-12-31", "2024-03-20T08:00:00Z", 1),
      createFactRow("eq_hk_00700", "co_hk_00700", "00700.HK", "balance_sheet", "assets", 1570000, "2023-12-31", "2024-03-20T08:00:00Z", 1),
      createFactRow("eq_hk_00700", "co_hk_00700", "00700.HK", "balance_sheet", "liabilities", 742000, "2023-12-31", "2024-03-20T08:00:00Z", 1),
      createFactRow("eq_hk_00700", "co_hk_00700", "00700.HK", "balance_sheet", "equity", 828000, "2023-12-31", "2024-03-20T08:00:00Z", 1),
      createFactRow("eq_hk_00700", "co_hk_00700", "00700.HK", "cash_flow", "operating_cash_flow", 222450, "2023-12-31", "2024-03-20T08:00:00Z", 1),
      createFactRow("eq_hk_00700", "co_hk_00700", "00700.HK", "cash_flow", "free_cash_flow", 198100, "2023-12-31", "2024-03-20T08:00:00Z", 1),
      createFactRow("eq_hk_00700", "co_hk_00700", "00700.HK", "income_statement", "revenue", 554552, "2022-12-31", "2023-03-22T08:00:00Z", 0),
      createFactRow("eq_hk_00700", "co_hk_00700", "00700.HK", "income_statement", "net_income", 94882, "2022-12-31", "2023-03-22T08:00:00Z", 0)
    ],
    instrumentId: "eq_hk_00700",
    qualityState: "PASS",
    symbol: "00700.HK",
    unit: "million"
  },
  {
    accountingStandard: "HKFRS",
    companyId: "co_hk_08001",
    currency: "HKD",
    facts: [
      {
        ...createFactRow("eq_hk_08001", "co_hk_08001", "08001.HK", "income_statement", "revenue", 12, "2023-12-31", "2024-03-20T08:00:00Z", 0),
        qualityState: "HOLD" as const
      }
    ],
    instrumentId: "eq_hk_08001",
    qualityState: "HOLD",
    symbol: "08001.HK",
    unit: "million"
  }
] as const;

export function getFinancialFacts(input: GetFinancialFactsInput): GetFinancialFactsResult {
  const instrumentId = input.instrumentId.trim();
  const from = input.from.trim();
  const to = input.to.trim();
  const limit = input.limit ?? DEFAULT_FINANCIAL_FACT_LIMIT;
  const asOf = input.asOf ?? DEFAULT_FINANCIAL_FACT_AS_OF;

  if (instrumentId.length === 0) {
    throw new FinancialFactsInputError(
      "INSTRUMENT_ID_REQUIRED",
      "instrument_id is required"
    );
  }

  if (!isIsoDate(from) || !isIsoDate(to) || from > to) {
    throw new FinancialFactsInputError(
      "INVALID_RANGE",
      "from and to must be YYYY-MM-DD dates with from <= to"
    );
  }

  if (Number.isNaN(Date.parse(asOf))) {
    throw new FinancialFactsInputError("AS_OF_INVALID", "as_of must be an ISO timestamp");
  }

  if (!Number.isInteger(limit) || limit <= 0) {
    throw new FinancialFactsInputError("INVALID_LIMIT", "limit must be a positive integer");
  }

  const normalizedMetrics = normalizeFinancialFactMetrics(input.metrics);
  const normalizedStatementTypes = normalizeFinancialStatementTypes(input.statementTypes);
  const offset = parseFinancialFactCursor(input.cursor);

  if (
    normalizedMetrics.rejectedMetrics.length > 0 ||
    normalizedStatementTypes.rejectedStatementTypes.length > 0
  ) {
    return createFinancialFactsResult({
      asOf,
      cursor: input.cursor,
      facts: undefined,
      from,
      instrumentId,
      limit,
      rejectedMetrics: normalizedMetrics.rejectedMetrics,
      rejectedStatementTypes: normalizedStatementTypes.rejectedStatementTypes,
      requestedMetrics: normalizedMetrics.requestedMetrics,
      requestedStatementTypes: normalizedStatementTypes.requestedStatementTypes,
      status: "data_not_licensed",
      to
    });
  }

  if (limit > MAX_FINANCIAL_FACT_LIMIT) {
    return createFinancialFactsResult({
      asOf,
      cursor: input.cursor,
      facts: undefined,
      from,
      instrumentId,
      limit,
      rejectedMetrics: [],
      rejectedStatementTypes: [],
      requestedMetrics: normalizedMetrics.requestedMetrics,
      requestedStatementTypes: normalizedStatementTypes.requestedStatementTypes,
      status: "too_many_rows",
      to
    });
  }

  const record = SYNTHETIC_FINANCIAL_FACTS.find(
    (candidate) =>
      normalizeInstrumentId(candidate.instrumentId) === normalizeInstrumentId(instrumentId)
  );

  if (record === undefined) {
    return createFinancialFactsResult({
      asOf,
      cursor: input.cursor,
      facts: undefined,
      from,
      instrumentId,
      limit,
      rejectedMetrics: [],
      rejectedStatementTypes: [],
      requestedMetrics: normalizedMetrics.requestedMetrics,
      requestedStatementTypes: normalizedStatementTypes.requestedStatementTypes,
      status: "not_found",
      to
    });
  }

  if (record.qualityState === "HOLD") {
    return createFinancialFactsResult({
      asOf,
      cursor: input.cursor,
      facts: undefined,
      from,
      instrumentId,
      limit,
      rejectedMetrics: [],
      rejectedStatementTypes: [],
      requestedMetrics: normalizedMetrics.requestedMetrics,
      requestedStatementTypes: normalizedStatementTypes.requestedStatementTypes,
      status: "data_quality_hold",
      to
    });
  }

  const coverage = getFinancialFactCoverage(record);
  if (from < coverage.from || to > coverage.to) {
    return createFinancialFactsResult({
      asOf,
      cursor: input.cursor,
      facts: undefined,
      from,
      instrumentId,
      limit,
      rejectedMetrics: [],
      rejectedStatementTypes: [],
      requestedMetrics: normalizedMetrics.requestedMetrics,
      requestedStatementTypes: normalizedStatementTypes.requestedStatementTypes,
      status: "out_of_range",
      to
    });
  }

  const visibleFacts = record.facts.filter((fact) => Date.parse(fact.publishedAt) <= Date.parse(asOf));

  if (visibleFacts.length === 0) {
    return createFinancialFactsResult({
      asOf,
      cursor: input.cursor,
      facts: undefined,
      from,
      instrumentId,
      limit,
      rejectedMetrics: [],
      rejectedStatementTypes: [],
      requestedMetrics: normalizedMetrics.requestedMetrics,
      requestedStatementTypes: normalizedStatementTypes.requestedStatementTypes,
      status: "point_in_time_unavailable",
      to
    });
  }

  const matchingFacts = visibleFacts.filter(
    (fact) =>
      fact.periodEnd >= from &&
      fact.periodEnd <= to &&
      normalizedMetrics.requestedMetrics.includes(fact.metricId) &&
      normalizedStatementTypes.requestedStatementTypes.includes(fact.statementType)
  );

  if (matchingFacts.length === 0) {
    return createFinancialFactsResult({
      asOf,
      cursor: input.cursor,
      facts: undefined,
      from,
      instrumentId,
      limit,
      rejectedMetrics: [],
      rejectedStatementTypes: [],
      requestedMetrics: normalizedMetrics.requestedMetrics,
      requestedStatementTypes: normalizedStatementTypes.requestedStatementTypes,
      status: "out_of_range",
      to
    });
  }

  const facts = createFinancialFactsDataset({
    asOf,
    facts: matchingFacts,
    from,
    limit,
    offset,
    record,
    to
  });

  return createFinancialFactsResult({
    asOf,
    cursor: input.cursor,
    facts,
    from,
    instrumentId,
    limit,
    rejectedMetrics: [],
    rejectedStatementTypes: [],
    requestedMetrics: normalizedMetrics.requestedMetrics,
    requestedStatementTypes: normalizedStatementTypes.requestedStatementTypes,
    status: "found",
    to
  });
}

export function getFinancialFactsCapabilities() {
  return {
    currency_unit_metadata: true,
    data_version: GET_FINANCIAL_FACTS_DATA_VERSION,
    handler_ready: true,
    input_schema: "tool.get_financial_facts.input.v0",
    live_data_access: false,
    max_rows_per_request: MAX_FINANCIAL_FACT_LIMIT,
    output_schema: "tool.get_financial_facts.output.v0",
    point_in_time_selection: true,
    restatement_versions: true,
    status: "get_financial_facts_scaffold" as const,
    supported_metrics: DEFAULT_FINANCIAL_FACT_METRICS,
    supported_statement_types: DEFAULT_FINANCIAL_FACT_STATEMENT_TYPES,
    synthetic_fact_rows: SYNTHETIC_FINANCIAL_FACTS.reduce(
      (count, record) => count + record.facts.length,
      0
    ),
    version: GET_FINANCIAL_FACTS_VERSION
  };
}

export function buildFinancialRestatementTimeline(
  statements: FinancialStatementVersionInput[],
  methodologyVersion: string = FINANCIAL_RESTATEMENT_METHODOLOGY_VERSION
): FinancialRestatementTimeline {
  const sortedStatements = [...statements].sort((left, right) =>
    left.publishedAt.localeCompare(right.publishedAt)
  );

  sortedStatements.forEach(validateStatement);
  validateDimensions(sortedStatements);

  const statementById = new Map<string, FinancialStatementVersionInput>();
  const restatementVersionById = new Map<string, number>();
  const latestStatement = sortedStatements.at(-1);

  sortedStatements.forEach((statement, index) => {
    statementById.set(statement.statementId, statement);
    restatementVersionById.set(statement.statementId, index);
  });

  const versions: FinancialStatementVersion[] = sortedStatements.map((statement) => ({
    accountingStandard: statement.accountingStandard,
    companyId: statement.companyId,
    currency: statement.currency,
    facts: { ...statement.facts },
    isLatest: statement.statementId === latestStatement?.statementId,
    isRestatement: statement.isRestatement === true,
    periodEnd: statement.periodEnd,
    priorVersionId: statement.priorVersionId,
    publishedAt: statement.publishedAt,
    restatementReason: statement.restatementReason,
    restatementVersion: restatementVersionById.get(statement.statementId) ?? 0,
    scale: statement.scale,
    sourceRecordId: statement.sourceRecordId,
    statementId: statement.statementId,
    unit: statement.unit
  }));
  const events = sortedStatements
    .filter((statement) => statement.isRestatement === true)
    .map((statement) =>
      createRestatementEvent(statement, statementById, restatementVersionById)
    );

  return {
    engineVersion: FINANCIAL_RESTATEMENT_ENGINE_VERSION,
    events,
    methodologyVersion,
    status: "pass",
    versions
  };
}

export function selectFinancialStatementAsOf(
  timeline: FinancialRestatementTimeline,
  asOf: string
): FinancialStatementVersion | undefined {
  const asOfTime = Date.parse(asOf);

  if (Number.isNaN(asOfTime)) {
    throw new FinancialRestatementError(
      "PUBLISHED_AT_INVALID",
      "asOf must be an ISO timestamp",
      {
        asOf
      }
    );
  }

  return [...timeline.versions]
    .filter((version) => Date.parse(version.publishedAt) <= asOfTime)
    .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt))[0];
}

export function getFinancialRestatementCapabilities() {
  const golden = runSyntheticFinancialRestatementGolden();

  return {
    engine_version: FINANCIAL_RESTATEMENT_ENGINE_VERSION,
    golden_cases: {
      passed: golden.passed,
      sample_count: golden.sampleCount
    },
    live_partner_data: false,
    methodology_version: FINANCIAL_RESTATEMENT_METHODOLOGY_VERSION,
    point_in_time_selection: true,
    preserve_prior_versions: true,
    status: "engine_scaffold" as const,
    supported_statement_types: ["balance_sheet"] as const
  };
}

export function runSyntheticFinancialRestatementGolden(): FinancialRestatementGoldenResult {
  const failures = SYNTHETIC_FINANCIAL_RESTATEMENT_GOLDEN_CASES.flatMap(
    (goldenCase) => {
      const timeline = buildFinancialRestatementTimeline(goldenCase.statements);
      const before = selectFinancialStatementAsOf(timeline, goldenCase.asOfBefore);
      const after = selectFinancialStatementAsOf(timeline, goldenCase.asOfAfter);
      const event = timeline.events.at(0);

      if (before?.statementId !== goldenCase.expectedBeforeStatementId) {
        return [
          {
            caseId: goldenCase.caseId,
            reason: `expected before statement ${goldenCase.expectedBeforeStatementId}, got ${before?.statementId ?? "none"}`
          }
        ];
      }

      if (after?.statementId !== goldenCase.expectedAfterStatementId) {
        return [
          {
            caseId: goldenCase.caseId,
            reason: `expected after statement ${goldenCase.expectedAfterStatementId}, got ${after?.statementId ?? "none"}`
          }
        ];
      }

      if (event === undefined) {
        return [
          {
            caseId: goldenCase.caseId,
            reason: "expected a restatement event"
          }
        ];
      }

      const unexpectedDelta = goldenCase.expectedDeltas.find((expectedDelta) => {
        const actualDelta = event.deltas.find(
          (delta) => delta.metricId === expectedDelta.metricId
        );

        return (
          actualDelta === undefined ||
          !withinTolerance(
            actualDelta.valueDelta,
            expectedDelta.valueDelta,
            goldenCase.tolerance
          )
        );
      });

      return unexpectedDelta === undefined
        ? []
        : [
            {
              caseId: goldenCase.caseId,
              reason: `delta mismatch for ${unexpectedDelta.metricId}`
            }
          ];
    }
  );

  return {
    engineVersion: FINANCIAL_RESTATEMENT_ENGINE_VERSION,
    failures,
    methodologyVersion: FINANCIAL_RESTATEMENT_METHODOLOGY_VERSION,
    passed: failures.length === 0,
    sampleCount: SYNTHETIC_FINANCIAL_RESTATEMENT_GOLDEN_CASES.length
  };
}

export const SYNTHETIC_FINANCIAL_RESTATEMENT_GOLDEN_CASES: FinancialRestatementGoldenCase[] = [
  {
    asOfAfter: "2023-08-02T00:00:00Z",
    asOfBefore: "2023-07-31T23:59:59Z",
    caseId: "balance_sheet_partner_correction",
    expectedAfterStatementId: "financial_stmt_00001_2022_restatement_1",
    expectedBeforeStatementId: "financial_stmt_00001_2022_original",
    expectedDeltas: [
      {
        metricId: "liabilities",
        valueDelta: -20
      },
      {
        metricId: "equity",
        valueDelta: 20
      }
    ],
    statements: [
      {
        accountingStandard: "HKFRS",
        companyId: "co_00001",
        currency: "HKD",
        facts: {
          assets: 1000,
          equity: 380,
          liabilities: 620
        },
        periodEnd: "2022-12-31",
        publishedAt: "2023-03-15T08:00:00Z",
        scale: 1_000_000,
        sourceRecordId: "src_hk_financial_restatement_pass_001",
        statementId: "financial_stmt_00001_2022_original",
        unit: "million"
      },
      {
        accountingStandard: "HKFRS",
        companyId: "co_00001",
        currency: "HKD",
        facts: {
          assets: 1000,
          equity: 400,
          liabilities: 600
        },
        isRestatement: true,
        periodEnd: "2022-12-31",
        priorVersionId: "financial_stmt_00001_2022_original",
        publishedAt: "2023-08-01T08:00:00Z",
        restatementReason: "partner correction to liability classification",
        scale: 1_000_000,
        sourceRecordId: "src_hk_financial_restatement_pass_001",
        statementId: "financial_stmt_00001_2022_restatement_1",
        unit: "million"
      }
    ],
    tolerance: 0.001
  },
  {
    asOfAfter: "2021-04-02T00:00:00Z",
    asOfBefore: "2021-03-01T00:00:00Z",
    caseId: "source_revision_keeps_original",
    expectedAfterStatementId: "financial_stmt_00002_2020_restatement_1",
    expectedBeforeStatementId: "financial_stmt_00002_2020_original",
    expectedDeltas: [
      {
        metricId: "assets",
        valueDelta: 50
      },
      {
        metricId: "equity",
        valueDelta: 50
      }
    ],
    statements: [
      {
        accountingStandard: "HKFRS",
        companyId: "co_00002",
        currency: "HKD",
        facts: {
          assets: 500,
          equity: 200,
          liabilities: 300
        },
        periodEnd: "2020-12-31",
        publishedAt: "2021-02-28T08:00:00Z",
        scale: 1_000_000,
        sourceRecordId: "src_financial_restatement_00002_original",
        statementId: "financial_stmt_00002_2020_original",
        unit: "million"
      },
      {
        accountingStandard: "HKFRS",
        companyId: "co_00002",
        currency: "HKD",
        facts: {
          assets: 550,
          equity: 250,
          liabilities: 300
        },
        isRestatement: true,
        periodEnd: "2020-12-31",
        priorVersionId: "financial_stmt_00002_2020_original",
        publishedAt: "2021-04-01T08:00:00Z",
        restatementReason: "source revision",
        scale: 1_000_000,
        sourceRecordId: "src_financial_restatement_00002_restatement",
        statementId: "financial_stmt_00002_2020_restatement_1",
        unit: "million"
      }
    ],
    tolerance: 0.001
  }
];

function createRestatementEvent(
  statement: FinancialStatementVersionInput,
  statementById: Map<string, FinancialStatementVersionInput>,
  restatementVersionById: Map<string, number>
): FinancialRestatementEvent {
  if (statement.priorVersionId === undefined) {
    throw new FinancialRestatementError(
      "RESTATEMENT_CHAIN_INVALID",
      "restatement statements require priorVersionId",
      {
        statementId: statement.statementId
      }
    );
  }

  const original = statementById.get(statement.priorVersionId);

  if (original === undefined || original.statementId === statement.statementId) {
    throw new FinancialRestatementError(
      "RESTATEMENT_CHAIN_INVALID",
      "restatement priorVersionId must reference an earlier statement",
      {
        priorVersionId: statement.priorVersionId,
        statementId: statement.statementId
      }
    );
  }

  if (Date.parse(original.publishedAt) >= Date.parse(statement.publishedAt)) {
    throw new FinancialRestatementError(
      "RESTATEMENT_CHAIN_INVALID",
      "restatement must be published after the prior statement",
      {
        priorPublishedAt: original.publishedAt,
        restatedPublishedAt: statement.publishedAt,
        statementId: statement.statementId
      }
    );
  }

  return {
    companyId: statement.companyId,
    dataVersionAfter: `financial-restatement-v${restatementVersionById.get(statement.statementId) ?? 0}`,
    dataVersionBefore: `financial-restatement-v${restatementVersionById.get(original.statementId) ?? 0}`,
    deltas: createFactDeltas(original, statement),
    originalStatementId: original.statementId,
    reason: statement.restatementReason ?? "unknown",
    restatedAt: statement.publishedAt,
    restatedStatementId: statement.statementId
  };
}

function createFactDeltas(
  original: FinancialStatementVersionInput,
  restated: FinancialStatementVersionInput
): FinancialRestatementDelta[] {
  const metricIds = [...new Set([...Object.keys(original.facts), ...Object.keys(restated.facts)])]
    .sort();

  return metricIds
    .map((metricId) => {
      const originalValue = original.facts[metricId] ?? 0;
      const restatedValue = restated.facts[metricId] ?? 0;

      return {
        metricId,
        originalValue,
        restatedValue,
        unit: restated.unit,
        valueDelta: roundValue(restatedValue - originalValue)
      };
    })
    .filter((delta) => delta.valueDelta !== 0);
}

function validateStatement(statement: FinancialStatementVersionInput): void {
  if (Number.isNaN(Date.parse(statement.publishedAt))) {
    throw new FinancialRestatementError(
      "PUBLISHED_AT_INVALID",
      "publishedAt must be an ISO timestamp",
      {
        publishedAt: statement.publishedAt,
        statementId: statement.statementId
      }
    );
  }

  if (!identityBalances(statement.facts)) {
    throw new FinancialRestatementError(
      "ACCOUNTING_IDENTITY_INVALID",
      "balance sheet identity requires assets = liabilities + equity",
      {
        facts: statement.facts,
        statementId: statement.statementId
      }
    );
  }
}

function validateDimensions(statements: FinancialStatementVersionInput[]): void {
  const first = statements[0];

  if (first === undefined) {
    return;
  }

  const mismatched = statements.find(
    (statement) =>
      statement.companyId !== first.companyId ||
      statement.periodEnd !== first.periodEnd ||
      statement.currency !== first.currency ||
      statement.unit !== first.unit ||
      statement.scale !== first.scale ||
      statement.accountingStandard !== first.accountingStandard
  );

  if (mismatched !== undefined) {
    throw new FinancialRestatementError(
      "STATEMENT_DIMENSION_MISMATCH",
      "restatement timelines require stable company, period, currency, unit, scale, and accounting standard",
      {
        statementId: mismatched.statementId
      }
    );
  }
}

function createFinancialFactsResult(params: {
  asOf: string;
  cursor?: string;
  facts: FinancialFactsDataset | undefined;
  from: string;
  instrumentId: string;
  limit: number;
  rejectedMetrics: string[];
  rejectedStatementTypes: string[];
  requestedMetrics: FinancialFactMetric[];
  requestedStatementTypes: FinancialFactStatementType[];
  status: FinancialFactsStatus;
  to: string;
}): GetFinancialFactsResult {
  return {
    asOf: params.asOf,
    cursor: params.cursor,
    dataVersion: GET_FINANCIAL_FACTS_DATA_VERSION,
    facts: params.facts,
    from: params.from,
    instrumentId: params.instrumentId,
    limit: params.limit,
    liveDataAccess: false,
    methodologyVersion: GET_FINANCIAL_FACTS_VERSION,
    provenance: createFinancialFactsProvenance(),
    rejectedMetrics: params.rejectedMetrics,
    rejectedStatementTypes: params.rejectedStatementTypes,
    requestedMetrics: params.requestedMetrics,
    requestedStatementTypes: params.requestedStatementTypes,
    status: params.status,
    to: params.to,
    toolName: "get_financial_facts",
    usage: {
      cached: false,
      credits: params.facts === undefined ? 0 : params.facts.facts.length * 2,
      rows: params.facts?.facts.length ?? 0
    }
  };
}

function createFinancialFactsDataset(params: {
  asOf: string;
  facts: readonly FinancialFactRow[];
  from: string;
  limit: number;
  offset: number;
  record: SyntheticFinancialFactsRecord;
  to: string;
}): FinancialFactsDataset {
  const pageFacts = [...params.facts]
    .sort((left, right) => {
      const period = right.periodEnd.localeCompare(left.periodEnd);

      if (period !== 0) {
        return period;
      }

      return left.metricId.localeCompare(right.metricId);
    })
    .slice(params.offset, params.offset + params.limit);
  const nextOffset = params.offset + pageFacts.length;
  const nextCursor =
    nextOffset < params.facts.length ? `offset:${nextOffset}` : undefined;

  return {
    accountingStandard: params.record.accountingStandard,
    asOf: params.asOf,
    companyId: params.record.companyId,
    currency: params.record.currency,
    facts: pageFacts.map((fact) => ({ ...fact })),
    from: params.from,
    instrumentId: params.record.instrumentId,
    nextCursor,
    qualityState: params.record.qualityState,
    rowCount: pageFacts.length,
    symbol: params.record.symbol,
    to: params.to,
    totalRows: params.facts.length,
    unit: params.record.unit
  };
}

function normalizeFinancialFactMetrics(metrics: string[] | undefined): {
  rejectedMetrics: string[];
  requestedMetrics: FinancialFactMetric[];
} {
  if (metrics === undefined || metrics.length === 0) {
    return {
      rejectedMetrics: [],
      requestedMetrics: [...DEFAULT_FINANCIAL_FACT_METRICS]
    };
  }

  const requestedMetrics: FinancialFactMetric[] = [];
  const rejectedMetrics: string[] = [];

  for (const metric of metrics) {
    if (isFinancialFactMetric(metric)) {
      requestedMetrics.push(metric);
    } else {
      rejectedMetrics.push(metric);
    }
  }

  return {
    rejectedMetrics,
    requestedMetrics
  };
}

function normalizeFinancialStatementTypes(statementTypes: string[] | undefined): {
  rejectedStatementTypes: string[];
  requestedStatementTypes: FinancialFactStatementType[];
} {
  if (statementTypes === undefined || statementTypes.length === 0) {
    return {
      rejectedStatementTypes: [],
      requestedStatementTypes: [...DEFAULT_FINANCIAL_FACT_STATEMENT_TYPES]
    };
  }

  const requestedStatementTypes: FinancialFactStatementType[] = [];
  const rejectedStatementTypes: string[] = [];

  for (const statementType of statementTypes) {
    if (isFinancialFactStatementType(statementType)) {
      requestedStatementTypes.push(statementType);
    } else {
      rejectedStatementTypes.push(statementType);
    }
  }

  return {
    rejectedStatementTypes,
    requestedStatementTypes
  };
}

function isFinancialFactMetric(value: string): value is FinancialFactMetric {
  return (DEFAULT_FINANCIAL_FACT_METRICS as readonly string[]).includes(value);
}

function isFinancialFactStatementType(value: string): value is FinancialFactStatementType {
  return (DEFAULT_FINANCIAL_FACT_STATEMENT_TYPES as readonly string[]).includes(value);
}

function parseFinancialFactCursor(cursor: string | undefined): number {
  if (cursor === undefined || cursor.length === 0) {
    return 0;
  }

  const match = /^offset:(\d+)$/u.exec(cursor);
  if (match === null) {
    throw new FinancialFactsInputError(
      "INVALID_CURSOR",
      "cursor must be empty or match offset:<number>"
    );
  }

  return Number(match[1]);
}

function getFinancialFactCoverage(record: SyntheticFinancialFactsRecord): {
  from: string;
  to: string;
} {
  const periodEnds = record.facts.map((fact) => fact.periodEnd).sort();

  return {
    from: periodEnds[0] ?? "",
    to: periodEnds.at(-1) ?? ""
  };
}

function createFactRow(
  instrumentId: string,
  companyId: string,
  symbol: string,
  statementType: FinancialFactStatementType,
  metricId: FinancialFactMetric,
  value: number,
  periodEnd: string,
  publishedAt: string,
  restatementVersion: number
): FinancialFactRow {
  return {
    accountingStandard: "HKFRS",
    companyId,
    currency: "HKD",
    instrumentId,
    metricId,
    periodEnd,
    periodType: "FY",
    publishedAt,
    qualityState: "PASS",
    restatementVersion,
    scale: 1_000_000,
    sourceRecordId: `src_financial_fact_${symbol.toLowerCase().replace(".", "_")}_${metricId}_${periodEnd}`,
    statementId: `financial_stmt_${instrumentId}_${statementType}_${periodEnd}_v${restatementVersion}`,
    statementType,
    unit: "million",
    value,
    versionStatus: restatementVersion > 0 ? "latest" : "prior"
  };
}

function normalizeInstrumentId(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/u.test(value);
}

function createFinancialFactsProvenance() {
  return [
    {
      data_version: GET_FINANCIAL_FACTS_DATA_VERSION,
      methodology_version: GET_FINANCIAL_FACTS_VERSION,
      source: "synthetic-financial-facts",
      source_record_id: "get-financial-facts-fixture-v0"
    }
  ];
}

function identityBalances(facts: Record<string, number>): boolean {
  const { assets, liabilities, equity } = facts;

  if (
    assets === undefined ||
    liabilities === undefined ||
    equity === undefined ||
    !Number.isFinite(assets) ||
    !Number.isFinite(liabilities) ||
    !Number.isFinite(equity)
  ) {
    return false;
  }

  return withinTolerance(assets, liabilities + equity, 0.001);
}

function withinTolerance(actual: number, expected: number, tolerance: number): boolean {
  return Math.abs(actual - expected) <= tolerance;
}

function roundValue(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
