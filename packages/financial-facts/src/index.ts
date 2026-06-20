export const FINANCIAL_RESTATEMENT_ENGINE_VERSION =
  "2026-06-20.phase1.financial-restatement-engine.v0";
export const FINANCIAL_RESTATEMENT_METHODOLOGY_VERSION =
  "financial-restatement@synthetic-v0";

export type FinancialRestatementErrorCode =
  | "ACCOUNTING_IDENTITY_INVALID"
  | "PUBLISHED_AT_INVALID"
  | "RESTATEMENT_CHAIN_INVALID"
  | "STATEMENT_DIMENSION_MISMATCH";

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
