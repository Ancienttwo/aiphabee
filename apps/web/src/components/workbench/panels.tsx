import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, type BadgeTone, Card, Icon } from "../../ds";
import { KV } from "../KV";
import { Metric } from "../Metric";
import { formatHkCode, formatHkSymbol } from "../../lib/format";
import {
  localizedWorkbenchText,
  useWorkbenchLocale,
  type WorkbenchMessageKey,
} from "./i18n";
import {
  presentError,
  resolveCorporateActions,
  resolveDerivedMetrics,
  resolveDirectorate,
  resolveFinancialFacts,
  resolveOwnership,
  resolveQuoteSnapshot,
  resolveRelatedWarrants,
  resolveSdiDisclosure,
} from "../../lib/api";
import type {
  AiphaBeeErrorCode,
  AnnouncementSection,
  LiveCorporateActionRow,
  LiveDirectorateCapacity,
  LiveDirectorateProfileRow,
  LiveOwnershipHolder,
  LiveRelatedWarrant,
  LiveSdiDisclosureRow,
  LiveSdiPositionType,
  PriceHistorySection,
  QualityState,
  SecurityProfileSection,
} from "../../lib/api";

// --- helpers -------------------------------------------------------------

/** Deterministic thousands-separator format (no locale -> no SSR drift). */
function fmt(n: number | undefined, decimals = 2): string {
  if (n === undefined || !Number.isFinite(n)) return "—";
  const fixed = n.toFixed(decimals);
  const [int, dec] = fixed.split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return dec ? `${grouped}.${dec}` : grouped;
}

export function QualityBadge({ state }: { state?: QualityState }) {
  const { t } = useWorkbenchLocale();
  if (!state) return null;
  return (
    <Badge
      tone={state === "PASS" ? "bullish" : "warning"}
      variant="soft"
      size="sm"
      dot
    >
      {state === "PASS" ? t("qualityPass") : t("dataQualityHold")}
    </Badge>
  );
}

function EmptyPanel({ note }: { note: string }) {
  return (
    <Card padded>
      <p
        style={{
          margin: 0,
          fontSize: "var(--text-sm)",
          color: "var(--text-muted)",
        }}
      >
        {note}
      </p>
    </Card>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      style={{
        margin: "0 0 14px",
        fontFamily: "var(--font-display)",
        fontSize: "var(--text-xl)",
        fontWeight: 600,
        color: "var(--text-primary)",
      }}
    >
      {children}
    </h2>
  );
}

// --- label maps ----------------------------------------------------------

const FINANCIAL_LABEL: Record<string, WorkbenchMessageKey> = {
  revenue: "financialRevenue",
  net_income: "financialNetIncome",
  assets: "financialAssets",
  liabilities: "financialLiabilities",
  equity: "financialEquity",
  operating_cash_flow: "financialOperatingCashFlow",
  free_cash_flow: "financialFreeCashFlow",
};

const ACTION_LABEL: Record<string, WorkbenchMessageKey> = {
  dividend: "actionDividend",
  buyback: "actionBuyback",
  split: "actionSplit",
  consolidation: "actionConsolidation",
  rights: "actionRights",
  placement: "actionPlacement",
};

const ANNOUNCEMENT_LABEL: Record<string, WorkbenchMessageKey> = {
  results: "announcementResults",
  dividend: "announcementDividend",
  buyback: "announcementBuyback",
};

const SDI_POSITION_LABEL: Record<LiveSdiPositionType, WorkbenchMessageKey> = {
  long: "sdiLong",
  pool: "sdiLoanPool",
  short: "sdiShort",
};

const SDI_FORM_LABEL: Record<string, WorkbenchMessageKey> = {
  "1": "form1",
  "2": "form2",
  "3A": "form3A",
};

const DIRECTORATE_CAPACITY_LABEL: Record<
  LiveDirectorateCapacity,
  WorkbenchMessageKey
> = {
  D: "director",
  S: "seniorManagement",
};

const STATE_LABEL: Partial<Record<AiphaBeeErrorCode, WorkbenchMessageKey>> = {
  AUTH_REQUIRED: "authRequired",
  DATA_NOT_LICENSED: "dataNotLicensed",
  DATA_QUALITY_HOLD: "dataQualityHold",
  NOT_FOUND: "notFound",
};

// --- panels --------------------------------------------------------------

export function ProfilePanel({ section }: { section: SecurityProfileSection }) {
  const { locale, t } = useWorkbenchLocale();
  const p = section.profile;
  if (!p) return <EmptyPanel note={t("emptyProfile")} />;
  return (
    <Card padded>
      <SectionTitle>{t("companyProfile")}</SectionTitle>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 8,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-2xl)",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {localizedWorkbenchText(locale, p.company.name)}
        </span>
        <Badge
          tone={p.listingStatus === "listed" ? "bullish" : "warning"}
          variant="soft"
          size="sm"
        >
          {p.listingStatus === "listed"
            ? t("listed")
            : p.listingStatus === "suspended"
              ? t("suspended")
              : t("delisted")}
        </Badge>
      </div>
      <KV label={t("code")} value={formatHkSymbol(p.symbol)} mono />
      <KV label={t("exchangeMarket")} value={`${p.exchange} · ${p.market}`} />
      <KV label={t("currency")} value={p.currency} mono />
      <KV
        label={t("industry")}
        value={`${p.industry.sector} / ${p.industry.industry}`}
      />
      <KV label={t("listingDate")} value={p.lifecycle.listedAt} mono />
      <KV label={t("englishName")} value={p.company.name.en} />
    </Card>
  );
}

const QUOTE_SNAPSHOT_STATE_TONE: Partial<Record<AiphaBeeErrorCode, BadgeTone>> =
  {
    AUTH_REQUIRED: "info",
    DATA_NOT_LICENSED: "neutral",
    DATA_QUALITY_HOLD: "warning",
    NOT_FOUND: "neutral",
  };

/**
 * Quote-snapshot panel: an independent live query against the
 * entitlement-gated resolveQuoteSnapshot RPC (FinancialsPanel decoupling
 * pattern) -- not driven by the synthetic workbench snapshot's quote_snapshot
 * section, so a denied/held/absent live result never falls back to
 * synthesized figures. This is end-of-day (EOD) closing data, never
 * real-time or intraday: every price is labeled by its trade date, never
 * presented as a live/current price. Individual price/volume fields are
 * independently optional (the promoted vendor row itself may be null for a
 * given field, e.g. a suspended instrument); an instrument with no promoted
 * EOD row at all renders its explicit coverage.reason instead of an empty
 * quote.
 */
export function QuotePanel({ instrumentId }: { instrumentId: string }) {
  const { t } = useWorkbenchLocale();
  const { data: quoteEnv, isLoading } = useQuery({
    queryKey: ["quote-snapshot-live", instrumentId],
    queryFn: () => resolveQuoteSnapshot(instrumentId),
  });

  if (isLoading) {
    return (
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
        {t("loadingQuote")}
      </p>
    );
  }

  if (!quoteEnv || !quoteEnv.ok) {
    const code = quoteEnv?.error.code;
    const tone: BadgeTone =
      (code && QUOTE_SNAPSHOT_STATE_TONE[code]) ?? "bearish";
    const label =
      code && STATE_LABEL[code] ? t(STATE_LABEL[code]) : t("cachedUnavailable");
    const detail = quoteEnv
      ? presentError(quoteEnv).detail
      : t("serviceQuoteUnavailable");
    return (
      <Card padded>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <SectionTitle>{t("quoteSnapshot")}</SectionTitle>
          <Badge tone={tone} variant="soft" size="sm" dot>
            {label}
          </Badge>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
          }}
        >
          {detail}
        </p>
      </Card>
    );
  }

  const { coverage, quote } = quoteEnv.data;
  if (coverage?.status === "unavailable") {
    return <EmptyPanel note={coverage.reason ?? t("emptyQuoteCoverage")} />;
  }
  if (!quote) return <EmptyPanel note={t("emptyQuote")} />;

  return (
    <Card padded>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <SectionTitle>{t("quoteSnapshot")}</SectionTitle>
        <Badge tone="info" variant="soft" size="sm">
          {t("closePrice")} · {quote.tradeDate}
        </Badge>
      </div>
      <div className="ab-grid-3" style={{ gap: 14 }}>
        <Metric
          label={`${t("closePrice")} (${quote.currency})`}
          value={fmt(quote.close)}
        />
        <Metric label={t("open")} value={fmt(quote.open)} />
        <Metric label={t("high")} value={fmt(quote.high)} />
        <Metric label={t("low")} value={fmt(quote.low)} />
        <Metric label={t("volume")} value={fmt(quote.volume, 0)} />
        <Metric label={t("turnover")} value={fmt(quote.turnover, 0)} />
        {quote.sharesOutstanding !== undefined ? (
          <Metric
            label={t("issuedSharesCount")}
            value={fmt(quote.sharesOutstanding, 0)}
          />
        ) : null}
      </div>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: "var(--text-2xs)",
          color: "var(--text-subtle)",
        }}
      >
        {t("methodologyQuote")}
      </p>
    </Card>
  );
}

const FINANCIAL_FACTS_STATE_TONE: Partial<
  Record<AiphaBeeErrorCode, BadgeTone>
> = {
  AUTH_REQUIRED: "info",
  DATA_NOT_LICENSED: "neutral",
  DATA_QUALITY_HOLD: "warning",
  NOT_FOUND: "neutral",
};

/**
 * Financial facts panel: an independent live query against the
 * entitlement-gated resolveFinancialFacts RPC (CompanyHeader decoupling
 * pattern in ../../routes/stock/$instrumentId.tsx) -- not driven by the
 * synthetic workbench snapshot's financial_facts section, so a
 * denied/held/absent live result never falls back to synthesized figures.
 * Only revenue/net_income/assets/liabilities/equity/operating_cash_flow are
 * ever populated live (non-bank/nb statement schema only); an instrument
 * that reports under the bank/insurance schema renders its explicit
 * coverage.reason instead of an empty facts list.
 */
export function FinancialsPanel({ instrumentId }: { instrumentId: string }) {
  const { t } = useWorkbenchLocale();
  const { data: factsEnv, isLoading } = useQuery({
    queryKey: ["financial-facts-live", instrumentId],
    queryFn: () => resolveFinancialFacts(instrumentId),
  });

  if (isLoading) {
    return (
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
        {t("loadingFinancials")}
      </p>
    );
  }

  if (!factsEnv || !factsEnv.ok) {
    const code = factsEnv?.error.code;
    const tone: BadgeTone =
      (code && FINANCIAL_FACTS_STATE_TONE[code]) ?? "bearish";
    const label =
      code && STATE_LABEL[code] ? t(STATE_LABEL[code]) : t("cachedUnavailable");
    const detail = factsEnv
      ? presentError(factsEnv).detail
      : t("serviceFinancialsUnavailable");
    return (
      <Card padded>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <SectionTitle>{t("financialFacts")}</SectionTitle>
          <Badge tone={tone} variant="soft" size="sm" dot>
            {label}
          </Badge>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
          }}
        >
          {detail}
        </p>
      </Card>
    );
  }

  const { coverage, facts } = factsEnv.data;
  if (coverage?.status === "unavailable") {
    return <EmptyPanel note={coverage.reason ?? t("emptyFinancialCoverage")} />;
  }
  if (!facts || facts.length === 0)
    return <EmptyPanel note={t("emptyFinancials")} />;

  return (
    <Card padded>
      <SectionTitle>{t("financialFacts")}</SectionTitle>
      <div style={{ display: "grid", gap: 2 }}>
        {facts.map((row) => (
          <div
            key={`${row.metricId}-${row.periodEnd}-${row.statementId}`}
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
              padding: "8px 0",
              borderBottom: "1px solid var(--border-subtle)",
            }}
          >
            <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {FINANCIAL_LABEL[row.metricId]
                  ? t(FINANCIAL_LABEL[row.metricId])
                  : row.metricId}
              </span>
              <span
                style={{
                  fontSize: "var(--text-2xs)",
                  color: "var(--text-subtle)",
                }}
              >
                {row.periodEnd} · {row.periodType}
              </span>
            </span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {fmt(row.value, 0)}
              </span>
              <span
                style={{
                  fontSize: "var(--text-2xs)",
                  color: "var(--text-muted)",
                }}
              >
                {row.currency}
              </span>
              <QualityBadge state={row.qualityState} />
            </span>
          </div>
        ))}
      </div>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: "var(--text-2xs)",
          color: "var(--text-subtle)",
        }}
      >
        {t("methodologyFinancials")}
      </p>
    </Card>
  );
}

const DERIVED_METRICS_STATE_TONE: Partial<
  Record<AiphaBeeErrorCode, BadgeTone>
> = {
  AUTH_REQUIRED: "info",
  DATA_NOT_LICENSED: "neutral",
  DATA_QUALITY_HOLD: "warning",
  NOT_FOUND: "neutral",
};

// Per-metric blocked_reason -> honest Chinese copy. Deliberately never says
// "未获授权": once the envelope itself is ok, the whole derived-metrics
// feature IS authorized (resolveDerivedMetrics already conjuncts the
// financial_facts + quote_snapshot Web gates before returning any data) --
// a blocked metric here is a data-availability gap for this instrument, not
// a licensing gap.
const DERIVED_METRIC_BLOCKED_REASON_LABEL: Record<string, WorkbenchMessageKey> =
  {
    financial_facts_not_found: "derivedFinancialFactsNotFound",
    missing_input: "derivedMissingInput",
    negative_denominator: "derivedNegativeDenominator",
    quality_hold: "derivedQualityHold",
    quote_unavailable: "derivedQuoteUnavailable",
    shares_outstanding_unavailable: "derivedSharesUnavailable",
    zero_denominator: "derivedZeroDenominator",
  };

/**
 * Derived-metrics panel: an independent live query against the
 * entitlement-gated resolveDerivedMetrics RPC (FinancialsPanel/QuotePanel
 * decoupling pattern) -- not driven by the synthetic workbench snapshot's
 * derived_metrics section, so a denied/held/absent live result never falls
 * back to synthesized figures. resolveDerivedMetrics conjuncts the
 * financial_facts and quote_snapshot Web entitlement gates (both required,
 * no separate "derived metrics" dataset); the badge above the grid reflects
 * that envelope-level authorization state. Once the envelope is authorized,
 * each tile renders its own status: a computed value, or the specific
 * blocked_reason's honest Chinese copy via DERIVED_METRIC_BLOCKED_REASON_LABEL
 * -- never "未获授权" for a per-metric data gap.
 */
export function DerivedPanel({ instrumentId }: { instrumentId: string }) {
  const { t } = useWorkbenchLocale();
  const { data: derivedEnv, isLoading } = useQuery({
    queryKey: ["derived-metrics-live", instrumentId],
    queryFn: () => resolveDerivedMetrics(instrumentId),
  });

  if (isLoading) {
    return (
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
        {t("loadingDerived")}
      </p>
    );
  }

  if (!derivedEnv || !derivedEnv.ok) {
    const code = derivedEnv?.error.code;
    const tone: BadgeTone =
      (code && DERIVED_METRICS_STATE_TONE[code]) ?? "bearish";
    const label =
      code && STATE_LABEL[code] ? t(STATE_LABEL[code]) : t("cachedUnavailable");
    const detail = derivedEnv
      ? presentError(derivedEnv).detail
      : t("serviceDerivedUnavailable");
    return (
      <Card padded>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <SectionTitle>{t("derivedMetrics")}</SectionTitle>
          <Badge tone={tone} variant="soft" size="sm" dot>
            {label}
          </Badge>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
          }}
        >
          {detail}
        </p>
      </Card>
    );
  }

  const section = derivedEnv.data;
  const labels = new Map(
    section.definitions.map((d) => [d.metric_id, d.label]),
  );
  const asOfParts = [
    section.financial_period_end
      ? `${t("derivedFinancialPeriod")} · ${section.financial_period_end}`
      : null,
    section.quote_as_of
      ? `${t("derivedQuoteAsOf")} · ${section.quote_as_of.slice(0, 10)}`
      : null,
  ].filter((part): part is string => part !== null);

  return (
    <Card padded>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <SectionTitle>{t("derivedMetrics")}</SectionTitle>
        {asOfParts.length > 0 ? (
          <Badge tone="info" variant="soft" size="sm">
            {asOfParts.join(" · ")}
          </Badge>
        ) : null}
      </div>
      <div className="ab-grid-2" style={{ gap: 12 }}>
        {section.metrics.map((m) => (
          <div
            key={m.metric_id}
            style={{
              padding: "var(--space-4)",
              borderRadius: "var(--radius-md)",
              background: "var(--surface-sunken)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginBottom: 4,
              }}
            >
              <span
                style={{
                  fontSize: "var(--text-2xs)",
                  color: "var(--text-muted)",
                }}
              >
                {labels.get(m.metric_id) ?? m.metric_id}
              </span>
              {m.anomaly_flags.includes("currency_mismatch") ? (
                <Badge tone="warning" variant="soft" size="sm">
                  {t("currencyMismatch")}
                </Badge>
              ) : null}
            </div>
            {m.status === "computed" && m.value !== undefined ? (
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-xl)",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {m.unit === "ratio"
                  ? `${fmt(m.value * 100, 1)}%`
                  : `${fmt(m.value)}×`}
              </div>
            ) : (
              <div
                style={{
                  fontSize: "var(--text-xs)",
                  color: "var(--text-subtle)",
                }}
              >
                {DERIVED_METRIC_BLOCKED_REASON_LABEL[m.blocked_reason ?? ""]
                  ? t(
                      DERIVED_METRIC_BLOCKED_REASON_LABEL[
                        m.blocked_reason ?? ""
                      ],
                    )
                  : (m.blocked_reason ?? t("unavailableCalculation"))}
              </div>
            )}
          </div>
        ))}
      </div>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: "var(--text-2xs)",
          color: "var(--text-subtle)",
        }}
      >
        {t("methodologyDerived")}
      </p>
    </Card>
  );
}

export function AnnouncementsPanel({
  section,
}: {
  section: AnnouncementSection;
}) {
  const { t } = useWorkbenchLocale();
  if (section.announcements.length === 0)
    return <EmptyPanel note={t("emptyAnnouncements")} />;
  return (
    <Card padded>
      <SectionTitle>
        {t("announcements")}{t("countOpen")}{section.total_count}{t("countClose")}
      </SectionTitle>
      <div style={{ display: "grid", gap: 12 }}>
        {section.announcements.map((a) => (
          <div
            key={a.announcement_id}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--surface-sunken)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 4,
                flexWrap: "wrap",
              }}
            >
              <Badge tone="navy" variant="soft" size="sm">
                {ANNOUNCEMENT_LABEL[a.category]
                  ? t(ANNOUNCEMENT_LABEL[a.category])
                  : a.category}
              </Badge>
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {a.title}
              </span>
            </div>
            <p
              style={{
                margin: "0 0 8px",
                fontSize: "var(--text-sm)",
                color: "var(--text-body)",
                lineHeight: 1.55,
              }}
            >
              {a.summary}
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: "var(--text-2xs)",
                color: "var(--text-subtle)",
              }}
            >
              <span style={{ fontFamily: "var(--font-mono)" }}>
                {a.published_at}
              </span>
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <Icon name="file-text" size={12} /> {t("originalDocument")} P.
                {a.evidence_locator.page} · {a.evidence_locator.anchor}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

const CORPORATE_ACTIONS_STATE_TONE: Partial<
  Record<AiphaBeeErrorCode, BadgeTone>
> = {
  AUTH_REQUIRED: "info",
  DATA_NOT_LICENSED: "neutral",
  DATA_QUALITY_HOLD: "warning",
  NOT_FOUND: "neutral",
};

/** Client-side display label only, composed from already-promoted numeric
 * fields (never a substitute for the vendor's own text): buyback rows carry
 * no vendor summary (no free-text field exists on nq_sharebuyback.daily_data),
 * so this describes the same terms already rendered as the trailing amount. */
function describeCorporateAction(
  action: LiveCorporateActionRow,
  t: (key: WorkbenchMessageKey) => string,
): string {
  if (action.summary) return action.summary;
  if (action.actionType === "buyback" && action.terms?.shares !== undefined) {
    return `${t("onMarketBuyback")} ${fmt(action.terms.shares, 0)} ${t("sharesUnit")}`;
  }
  return ACTION_LABEL[action.actionType]
    ? t(ACTION_LABEL[action.actionType])
    : action.actionType;
}

/**
 * Corporate-actions panel: an independent live query against the
 * entitlement-gated resolveCorporateActions RPC (FinancialsPanel/QuotePanel
 * decoupling pattern) -- not driven by the synthetic workbench snapshot's
 * corporate_actions section, so a denied/held/absent live result never falls
 * back to synthesized figures. Only dividend/buyback/split/consolidation are
 * ever populated live; an instrument with no promoted action at all renders
 * its explicit coverage.reason instead of an empty list.
 */
export function CorporateActionsPanel({
  instrumentId,
}: {
  instrumentId: string;
}) {
  const { t } = useWorkbenchLocale();
  const { data: actionsEnv, isLoading } = useQuery({
    queryKey: ["corporate-actions-live", instrumentId],
    queryFn: () => resolveCorporateActions(instrumentId),
  });

  if (isLoading) {
    return (
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
        {t("loadingActions")}
      </p>
    );
  }

  if (!actionsEnv || !actionsEnv.ok) {
    const code = actionsEnv?.error.code;
    const tone: BadgeTone =
      (code && CORPORATE_ACTIONS_STATE_TONE[code]) ?? "bearish";
    const label =
      code && STATE_LABEL[code] ? t(STATE_LABEL[code]) : t("cachedUnavailable");
    const detail = actionsEnv
      ? presentError(actionsEnv).detail
      : t("serviceActionsUnavailable");
    return (
      <Card padded>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <SectionTitle>{t("corporateActions")}</SectionTitle>
          <Badge tone={tone} variant="soft" size="sm" dot>
            {label}
          </Badge>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
          }}
        >
          {detail}
        </p>
      </Card>
    );
  }

  const { coverage, actions } = actionsEnv.data;
  if (coverage?.status === "unavailable") {
    return <EmptyPanel note={coverage.reason ?? t("emptyActions")} />;
  }
  if (!actions || actions.length === 0)
    return <EmptyPanel note={t("emptyActions")} />;

  return (
    <Card padded>
      <SectionTitle>
        {t("corporateActions")}{t("countOpen")}{actions.length}{t("countClose")}
      </SectionTitle>
      <div style={{ display: "grid", gap: 10 }}>
        {actions.map((a) => (
          <div
            key={a.actionId}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              background: "var(--surface-sunken)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Badge tone="ai" variant="soft" size="sm">
                  {ACTION_LABEL[a.actionType]
                    ? t(ACTION_LABEL[a.actionType])
                    : a.actionType}
                </Badge>
                <span
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--text-primary)",
                  }}
                >
                  {describeCorporateAction(a, t)}
                </span>
              </span>
              <span
                style={{
                  fontSize: "var(--text-2xs)",
                  color: "var(--text-subtle)",
                }}
              >
                {t("actionAnnouncement")} {a.announcementDate} ·{" "}
                {t("actionEffective")} {a.effectiveDate}
                {a.paymentDate
                  ? ` · ${t("actionPayment")} ${a.paymentDate}`
                  : ""}
              </span>
            </span>
            {a.terms?.cashAmount !== undefined ? (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                }}
              >
                {fmt(a.terms.cashAmount)} {a.terms.currency}
              </span>
            ) : a.terms?.buybackValue !== undefined ? (
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  whiteSpace: "nowrap",
                }}
              >
                {fmt(a.terms.buybackValue, 0)} {a.terms.currency}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: "var(--text-2xs)",
          color: "var(--text-subtle)",
        }}
      >
        {t("methodologyCorporateActions")}
      </p>
    </Card>
  );
}

const SDI_DISCLOSURE_STATE_TONE: Partial<Record<AiphaBeeErrorCode, BadgeTone>> =
  {
    AUTH_REQUIRED: "info",
    DATA_NOT_LICENSED: "neutral",
    DATA_QUALITY_HOLD: "warning",
    NOT_FOUND: "neutral",
  };

/** Pure numeric before/after comparison (never an eventCode decode -- no
 * decode table exists for it): up/flat/down is derived only from the two
 * already-promoted balance percentages, the same discipline
 * sdi.jsx's NqSdiDelta component uses. */
function sdiBalanceTone(
  before: number | undefined,
  after: number | undefined,
): string {
  if (before === undefined || after === undefined || after === before)
    return "var(--text-primary)";
  return after > before ? "var(--green-600)" : "var(--red-600)";
}

function SdiPositionRow({
  position,
}: {
  position: LiveSdiDisclosureRow["positions"][number];
}) {
  const { t } = useWorkbenchLocale();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
      }}
    >
      <Badge tone="navy" variant="soft" size="sm">
        {t(SDI_POSITION_LABEL[position.positionType])}
      </Badge>
      {position.previousBalancePercent !== undefined ||
      position.presentBalancePercent !== undefined ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 6,
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-sm)",
          }}
        >
          <span style={{ color: "var(--text-subtle)" }}>
            {fmt(position.previousBalancePercent)}%
          </span>
          <Icon name="arrow-right" size={11} />
          <span
            style={{
              fontWeight: 700,
              color: sdiBalanceTone(
                position.previousBalancePercent,
                position.presentBalancePercent,
              ),
            }}
          >
            {fmt(position.presentBalancePercent)}%
          </span>
        </span>
      ) : null}
      {position.shares !== undefined ? (
        <span
          style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}
        >
          {t("sdiChange")}{" "}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--text-muted)",
            }}
          >
            {fmt(position.shares, 0)}
          </span>{" "}
          {t("sharesUnit")}
          {position.currency ? ` (${position.currency})` : ""}
        </span>
      ) : null}
      {position.eventCode ? (
        <span
          style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}
        >
          {t("code")} {position.eventCode}
        </span>
      ) : null}
    </div>
  );
}

/**
 * SDI (disclosure of interests) panel: an independent live query against the
 * entitlement-gated resolveSdiDisclosure RPC (FinancialsPanel/QuotePanel/
 * CorporateActionsPanel decoupling pattern). Unlike those three, SDI has no
 * synthetic counterpart anywhere in packages/workbench -- this is a
 * genuinely new tab, not a synthetic->live cutover. Only fields the
 * promotion actually carries are rendered: no nature-of-change
 * (increase/decrease/passive) label and no threshold-crossing flag, because
 * neither is derivable from the vendor data (see
 * deploy/ingest/netquity-sdi-disclosure-staging.contract.json). Up/down
 * coloring on a position's balance percentage is a pure numeric comparison
 * of the two already-promoted percentages, not a decode of the vendor's own
 * (undocumented) eventCode.
 */
export function SdiDisclosurePanel({ instrumentId }: { instrumentId: string }) {
  const { locale, t } = useWorkbenchLocale();
  const { data: sdiEnv, isLoading } = useQuery({
    queryKey: ["sdi-disclosure-live", instrumentId],
    queryFn: () => resolveSdiDisclosure(instrumentId),
  });

  if (isLoading) {
    return (
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
        {t("loadingSdi")}
      </p>
    );
  }

  if (!sdiEnv || !sdiEnv.ok) {
    const code = sdiEnv?.error.code;
    const tone: BadgeTone =
      (code && SDI_DISCLOSURE_STATE_TONE[code]) ?? "bearish";
    const label =
      code && STATE_LABEL[code] ? t(STATE_LABEL[code]) : t("cachedUnavailable");
    const detail = sdiEnv
      ? presentError(sdiEnv).detail
      : t("serviceSdiUnavailable");
    return (
      <Card padded>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <SectionTitle>{t("sdiDisclosures")}</SectionTitle>
          <Badge tone={tone} variant="soft" size="sm" dot>
            {label}
          </Badge>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
          }}
        >
          {detail}
        </p>
      </Card>
    );
  }

  const { coverage, disclosures } = sdiEnv.data;
  if (coverage?.status === "unavailable") {
    return <EmptyPanel note={coverage.reason ?? t("emptySdi")} />;
  }
  if (!disclosures || disclosures.length === 0)
    return <EmptyPanel note={t("emptySdi")} />;

  return (
    <Card padded>
      <SectionTitle>
        {t("sdiDisclosures")}{t("countOpen")}{disclosures.length}{t("countClose")}
      </SectionTitle>
      <div style={{ display: "grid", gap: 10 }}>
        {disclosures.map((d) => (
          <div
            key={d.disclosureId}
            style={{
              padding: "12px 14px",
              borderRadius: "var(--radius-md)",
              background: "var(--surface-sunken)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 6,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  fontWeight: 600,
                  color: "var(--text-subtle)",
                }}
              >
                {d.reportDate}
              </span>
              <Badge tone="ai" variant="soft" size="sm">
                {SDI_FORM_LABEL[d.formType]
                  ? t(SDI_FORM_LABEL[d.formType])
                  : d.formType}
              </Badge>
              <span
                style={{
                  fontSize: "var(--text-sm)",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {localizedWorkbenchText(locale, d.holderName)}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "var(--text-2xs)",
                  color: "var(--text-subtle)",
                }}
              >
                {t("sdiShareClass")} {d.shareClass}
              </span>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {d.positions.map((position, index) => (
                <SdiPositionRow
                  key={`${d.disclosureId}-${position.positionType}-${index}`}
                  position={position}
                />
              ))}
            </div>
            <p
              style={{
                margin: "8px 0 0",
                fontSize: "var(--text-2xs)",
                color: "var(--text-subtle)",
              }}
            >
              {t("sdiReference")}{" "}
              <span style={{ fontFamily: "var(--font-mono)" }}>
                {d.referenceNo}
              </span>
              {d.amendsReferenceNo
                ? ` · ${t("sdiAmendedFrom")} ${d.amendsReferenceNo}`
                : ""}
              {d.supersededByReferenceNo
                ? ` · ${t("sdiSupersededBy")} ${d.supersededByReferenceNo} ${t("sdiSupersededSuffix")}`
                : ""}
            </p>
          </div>
        ))}
      </div>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: "var(--text-2xs)",
          color: "var(--text-subtle)",
        }}
      >
        {t("methodologySdi")}
      </p>
    </Card>
  );
}

const DIRECTORATE_STATE_TONE: Partial<Record<AiphaBeeErrorCode, BadgeTone>> = {
  AUTH_REQUIRED: "info",
  DATA_NOT_LICENSED: "neutral",
  DATA_QUALITY_HOLD: "warning",
  NOT_FOUND: "neutral",
};

/** One promoted nq_biography.biography row. Only fields the promotion
 * actually carries are rendered: age/biography/remuneration are each
 * independently optional (never backfilled), and no committee tags or
 * cross-directorship badges are shown -- neither exists as a promoted
 * field this cut (see
 * deploy/ingest/netquity-directorate-staging.contract.json's
 * excluded_from_this_cut). capacity is rendered via a raw-code label map
 * (director / senior management), not a finer executive/independent
 * classification: that distinction only exists as free-text prose inside
 * title and is not derived client-side either. */
function DirectorateProfileCard({
  director,
}: {
  director: LiveDirectorateProfileRow;
}) {
  const { locale, t } = useWorkbenchLocale();
  const displayTitle = localizedWorkbenchText(locale, director.title);
  const biographyText = director.biography
    ? localizedWorkbenchText(locale, director.biography)
    : undefined;
  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: "var(--radius-md)",
        background: "var(--surface-sunken)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          marginBottom: 4,
        }}
      >
        <Badge
          tone={director.capacity === "D" ? "ai" : "navy"}
          variant="soft"
          size="sm"
        >
          {t(DIRECTORATE_CAPACITY_LABEL[director.capacity])}
        </Badge>
        <span
          style={{
            fontSize: "var(--text-sm)",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {localizedWorkbenchText(locale, director.name)}
        </span>
        <span
          style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}
        >
          {director.name.en}
        </span>
        {director.age !== undefined ? (
          <span
            style={{
              marginLeft: "auto",
              fontSize: "var(--text-2xs)",
              color: "var(--text-subtle)",
            }}
          >
            {director.age} {t("ageUnit")}
          </span>
        ) : null}
      </div>
      <p
        style={{
          margin: "0 0 6px",
          fontSize: "var(--text-sm)",
          color: "var(--text-body)",
        }}
      >
        {displayTitle}
      </p>
      {biographyText ? (
        <p
          style={{
            margin: "0 0 6px",
            fontSize: "var(--text-xs)",
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}
        >
          {biographyText}
        </p>
      ) : null}
      {director.remuneration ? (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            flexWrap: "wrap",
            fontSize: "var(--text-2xs)",
            color: "var(--text-subtle)",
          }}
        >
          <span>{t("remuneration")}</span>
          {director.remuneration.currentAmount !== undefined ? (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              {fmt(director.remuneration.currentAmount, 0)}{" "}
              {director.remuneration.currency}
            </span>
          ) : null}
          {director.remuneration.previousAmount !== undefined ? (
            <span>
              {t("previousYear")} {fmt(director.remuneration.previousAmount, 0)}{" "}
              {director.remuneration.currency}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Directorate (director / senior-management biography) panel: an
 * independent live query against the entitlement-gated resolveDirectorate
 * RPC (FinancialsPanel/QuotePanel/CorporateActionsPanel/SdiDisclosurePanel
 * decoupling pattern). Like SdiDisclosurePanel, directorate has no
 * synthetic counterpart anywhere in packages/workbench -- this is a
 * genuinely new tab, not a synthetic->live cutover. Only fields the
 * promotion actually carries are rendered.
 */
export function DirectorsPanel({ instrumentId }: { instrumentId: string }) {
  const { t } = useWorkbenchLocale();
  const { data: directorateEnv, isLoading } = useQuery({
    queryKey: ["directorate-live", instrumentId],
    queryFn: () => resolveDirectorate(instrumentId),
  });

  if (isLoading) {
    return (
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
        {t("loadingDirectorate")}
      </p>
    );
  }

  if (!directorateEnv || !directorateEnv.ok) {
    const code = directorateEnv?.error.code;
    const tone: BadgeTone = (code && DIRECTORATE_STATE_TONE[code]) ?? "bearish";
    const label =
      code && STATE_LABEL[code] ? t(STATE_LABEL[code]) : t("cachedUnavailable");
    const detail = directorateEnv
      ? presentError(directorateEnv).detail
      : t("serviceDirectorateUnavailable");
    return (
      <Card padded>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <SectionTitle>{t("directorate")}</SectionTitle>
          <Badge tone={tone} variant="soft" size="sm" dot>
            {label}
          </Badge>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
          }}
        >
          {detail}
        </p>
      </Card>
    );
  }

  const { coverage, directors } = directorateEnv.data;
  if (coverage?.status === "unavailable") {
    return <EmptyPanel note={coverage.reason ?? t("emptyDirectorate")} />;
  }
  if (!directors || directors.length === 0)
    return <EmptyPanel note={t("emptyDirectorate")} />;

  const directorCount = directors.filter((d) => d.capacity === "D").length;
  const seniorManagementCount = directors.length - directorCount;

  return (
    <Card padded>
      <SectionTitle>
        {t("directorate")}{t("countOpen")}{directors.length}{t("countClose")}
      </SectionTitle>
      <p
        style={{
          margin: "0 0 10px",
          fontSize: "var(--text-2xs)",
          color: "var(--text-subtle)",
        }}
      >
        {t("director")} {directorCount} · {t("seniorManagement")}{" "}
        {seniorManagementCount}
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        {directors.map((director) => (
          <DirectorateProfileCard
            key={director.profileId}
            director={director}
          />
        ))}
      </div>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: "var(--text-2xs)",
          color: "var(--text-subtle)",
        }}
      >
        {t("methodologyDirectorate")}
      </p>
    </Card>
  );
}

const OWNERSHIP_STATE_TONE: Partial<Record<AiphaBeeErrorCode, BadgeTone>> = {
  AUTH_REQUIRED: "info",
  DATA_NOT_LICENSED: "neutral",
  DATA_QUALITY_HOLD: "warning",
  NOT_FOUND: "neutral",
};

/**
 * One promoted nq_listcompheld.data row. holderType is rendered as its raw
 * vendor code (no decode table exists in the mirrored nq_codetable schema --
 * see deploy/ingest/netquity-ownership-staging.contract.json -- so unlike
 * DIRECTORATE_CAPACITY_LABEL/SDI_FORM_LABEL, which each had their own
 * verified basis for a presentational label, no interpreted label is
 * invented here). crossHolding, when present, is the real cross-holding
 * edge this cut's design baseline calls for -- rendered as a link-style
 * annotation (list rendering, not the design baseline's hex-graph
 * visualization, which this cut does not build).
 */
function OwnershipHolderRow({ holder }: { holder: LiveOwnershipHolder }) {
  const { locale, t } = useWorkbenchLocale();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        padding: "10px 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <Badge
        tone={holder.crossHolding ? "ai" : "neutral"}
        variant="soft"
        size="sm"
      >
        {holder.holderType}
      </Badge>
      <span
        style={{
          fontSize: "var(--text-sm)",
          fontWeight: 700,
          color: "var(--text-primary)",
          minWidth: 0,
          flex: 1,
        }}
      >
        {localizedWorkbenchText(locale, holder.name)}
      </span>
      {holder.crossHolding ? (
        <span
          style={{
            fontSize: "var(--text-2xs)",
            color: "var(--text-subtle)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {t("crossHolding")} → {holder.crossHolding.instrumentId}
        </span>
      ) : null}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-sm)",
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        {fmt(holder.heldPercent, 2)}%
      </span>
      <span
        style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}
      >
        {fmt(holder.heldShares, 0)} {t("sharesUnit")} · {holder.asOf}
      </span>
    </div>
  );
}

/**
 * Ownership (share capital / free float / substantial-shareholder and
 * cross-holding structure) panel: an independent live query against the
 * entitlement-gated resolveOwnership RPC (FinancialsPanel/QuotePanel/
 * CorporateActionsPanel/SdiDisclosurePanel/DirectorsPanel decoupling
 * pattern). Like SdiDisclosurePanel/DirectorsPanel, ownership has no
 * synthetic counterpart anywhere in packages/workbench -- this is a
 * genuinely new tab. shareCapital/freeFloat/holders are each independently
 * optional; only fields the promotion actually carries are rendered (no
 * treasury-share or par-value card -- neither is a promoted field this cut,
 * see contract.json).
 */
export function OwnershipPanel({ instrumentId }: { instrumentId: string }) {
  const { t } = useWorkbenchLocale();
  const { data: ownershipEnv, isLoading } = useQuery({
    queryKey: ["ownership-live", instrumentId],
    queryFn: () => resolveOwnership(instrumentId),
  });

  if (isLoading) {
    return (
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
        {t("loadingOwnership")}
      </p>
    );
  }

  if (!ownershipEnv || !ownershipEnv.ok) {
    const code = ownershipEnv?.error.code;
    const tone: BadgeTone = (code && OWNERSHIP_STATE_TONE[code]) ?? "bearish";
    const label =
      code && STATE_LABEL[code] ? t(STATE_LABEL[code]) : t("cachedUnavailable");
    const detail = ownershipEnv
      ? presentError(ownershipEnv).detail
      : t("serviceOwnershipUnavailable");
    return (
      <Card padded>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <SectionTitle>{t("ownership")}</SectionTitle>
          <Badge tone={tone} variant="soft" size="sm" dot>
            {label}
          </Badge>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
          }}
        >
          {detail}
        </p>
      </Card>
    );
  }

  const { coverage, shareCapital, freeFloat, holders } = ownershipEnv.data;
  if (coverage?.status === "unavailable") {
    return <EmptyPanel note={coverage.reason ?? t("emptyOwnership")} />;
  }
  if (!shareCapital && !freeFloat && (!holders || holders.length === 0)) {
    return <EmptyPanel note={t("emptyOwnership")} />;
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {shareCapital || freeFloat ? (
        <Card padded>
          <SectionTitle>{t("shareCapitalAndFloat")}</SectionTitle>
          <div className="ab-grid-3" style={{ gap: 14 }}>
            {shareCapital ? (
              <Metric
                label={t("issuedShares")}
                value={fmt(shareCapital.issuedShares, 0)}
                sub={shareCapital.hkShareClass}
              />
            ) : null}
            {freeFloat ? (
              <Metric
                label={t("freeFloat")}
                value={`${fmt(freeFloat.freeFloatPercent, 2)}%`}
                sub={`${t("freeFloatShares")} ${fmt(freeFloat.freeFloatShares, 0)} ${t("sharesUnit")}`}
                tone="up"
              />
            ) : null}
            {shareCapital?.hkShares !== undefined ? (
              <Metric
                label={t("hkShareCount")}
                value={fmt(shareCapital.hkShares, 0)}
              />
            ) : null}
            {shareCapital?.nonHkShares !== undefined ? (
              <Metric
                label={t("nonHkShareCount")}
                value={fmt(shareCapital.nonHkShares, 0)}
                sub={shareCapital.nonHkShareClass}
              />
            ) : null}
            {shareCapital?.sharesInCcass !== undefined ? (
              <Metric
                label={t("sharesInCcass")}
                value={fmt(shareCapital.sharesInCcass, 0)}
              />
            ) : null}
            {shareCapital?.sharesOutsideCcass !== undefined ? (
              <Metric
                label={t("sharesOutsideCcass")}
                value={fmt(shareCapital.sharesOutsideCcass, 0)}
              />
            ) : null}
            {shareCapital?.preferenceShares !== undefined ? (
              <Metric
                label={t("preferenceShares")}
                value={fmt(shareCapital.preferenceShares, 0)}
              />
            ) : null}
            {shareCapital?.weightedVotingRightsRatio !== undefined ? (
              <Metric
                label={t("weightedVotingRightsRatio")}
                value={fmt(shareCapital.weightedVotingRightsRatio, 2)}
              />
            ) : null}
          </div>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: "var(--text-2xs)",
              color: "var(--text-subtle)",
            }}
          >
            {t("liveData")}
            {shareCapital
              ? ` · ${t("shareCapitalAsOf")} ${shareCapital.asOf}`
              : ""}
            {freeFloat ? ` · ${t("freeFloatAsOf")} ${freeFloat.asOf}` : ""}
          </p>
        </Card>
      ) : null}

      {holders && holders.length > 0 ? (
        <Card padded>
          <SectionTitle>
            {t("holdersAndCrossHoldings")}{t("countOpen")}{holders.length}{t("countClose")}
          </SectionTitle>
          <div style={{ display: "grid" }}>
            {holders.map((holder) => (
              <OwnershipHolderRow key={holder.holderId} holder={holder} />
            ))}
          </div>
          <p
            style={{
              margin: "10px 0 0",
              fontSize: "var(--text-2xs)",
              color: "var(--text-subtle)",
            }}
          >
            {t("methodologyOwnership")}
          </p>
        </Card>
      ) : null}
    </div>
  );
}

const RELATED_WARRANTS_STATE_TONE: Partial<
  Record<AiphaBeeErrorCode, BadgeTone>
> = {
  AUTH_REQUIRED: "info",
  DATA_NOT_LICENSED: "neutral",
  DATA_QUALITY_HOLD: "warning",
  NOT_FOUND: "neutral",
};

/**
 * One promoted nq_basicdata.relatedcode link, resolved against
 * nq_basicdata.stock for its own name. category is rendered as its raw
 * relatedcode column key (no decode table exists in the mirrored
 * nq_codetable schema -- see
 * deploy/ingest/netquity-related-warrants-staging.contract.json -- so unlike
 * a call/put/bull-bear label, no interpreted meaning is invented here; same
 * "promote raw, do not decode" discipline OwnershipHolderRow applies to
 * holder.holderType). No price, change%, expiry, strike, call-level,
 * premium, or gearing column is rendered -- none of those vendor fields
 * exist in the current mirror for warrant instruments (see the contract's
 * excluded_from_this_cut).
 */
function RelatedWarrantRow({ warrant }: { warrant: LiveRelatedWarrant }) {
  const { locale } = useWorkbenchLocale();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        padding: "10px 0",
        borderBottom: "1px solid var(--border-subtle)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-sm)",
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        {formatHkCode(warrant.instrumentId.replace("hkex_security_", ""))}
      </span>
      <span
        style={{
          fontSize: "var(--text-sm)",
          color: "var(--text-primary)",
          minWidth: 0,
          flex: 1,
        }}
      >
        {localizedWorkbenchText(locale, warrant.name)}
      </span>
      <Badge tone="neutral" variant="soft" size="sm">
        {warrant.category}
      </Badge>
    </div>
  );
}

/**
 * Related-warrants (per-underlying-instrument list of associated derivative
 * warrant / CBBC codes) panel: an independent live query against the
 * entitlement-gated resolveRelatedWarrants RPC (FinancialsPanel/QuotePanel/
 * CorporateActionsPanel/SdiDisclosurePanel/DirectorsPanel/OwnershipPanel
 * decoupling pattern). Like SdiDisclosurePanel/DirectorsPanel/OwnershipPanel,
 * related_warrants has no synthetic counterpart anywhere in
 * packages/workbench -- this is a genuinely new tab. Design baseline is
 * docs/AiphaBee Design System/apps/netquity-workbench/quote.jsx's
 * NqWarrantsView; only the code/name/category columns this cut's promoted
 * fields actually carry are rendered (list rendering, not the design
 * baseline's demo price/expiry/strike/call-level/premium/gearing columns).
 */
export function RelatedWarrantsPanel({
  instrumentId,
}: {
  instrumentId: string;
}) {
  const { t } = useWorkbenchLocale();
  const { data: relatedWarrantsEnv, isLoading } = useQuery({
    queryKey: ["related-warrants-live", instrumentId],
    queryFn: () => resolveRelatedWarrants(instrumentId),
  });

  if (isLoading) {
    return (
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
        {t("loadingWarrants")}
      </p>
    );
  }

  if (!relatedWarrantsEnv || !relatedWarrantsEnv.ok) {
    const code = relatedWarrantsEnv?.error.code;
    const tone: BadgeTone =
      (code && RELATED_WARRANTS_STATE_TONE[code]) ?? "bearish";
    const label =
      code && STATE_LABEL[code] ? t(STATE_LABEL[code]) : t("cachedUnavailable");
    const detail = relatedWarrantsEnv
      ? presentError(relatedWarrantsEnv).detail
      : t("serviceWarrantsUnavailable");
    return (
      <Card padded>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 8,
          }}
        >
          <SectionTitle>{t("relatedWarrants")}</SectionTitle>
          <Badge tone={tone} variant="soft" size="sm" dot>
            {label}
          </Badge>
        </div>
        <p
          style={{
            margin: 0,
            fontSize: "var(--text-sm)",
            color: "var(--text-muted)",
          }}
        >
          {detail}
        </p>
      </Card>
    );
  }

  const { coverage, warrants } = relatedWarrantsEnv.data;
  if (coverage?.status === "unavailable") {
    return <EmptyPanel note={coverage.reason ?? t("emptyWarrants")} />;
  }
  if (!warrants || warrants.length === 0)
    return <EmptyPanel note={t("emptyWarrants")} />;

  return (
    <Card padded>
      <SectionTitle>
        {t("relatedWarrants")}{t("countOpen")}{warrants.length}{t("countClose")}
      </SectionTitle>
      <div style={{ display: "grid" }}>
        {warrants.map((warrant) => (
          <RelatedWarrantRow key={warrant.sourceRecordId} warrant={warrant} />
        ))}
      </div>
      <p
        style={{
          margin: "10px 0 0",
          fontSize: "var(--text-2xs)",
          color: "var(--text-subtle)",
        }}
      >
        {t("warrantsMethodology")}
      </p>
    </Card>
  );
}

export function PricePanel({ section }: { section: PriceHistorySection }) {
  const { t } = useWorkbenchLocale();
  const rows = (section.history?.rows ?? []).slice(-12).reverse();
  if (rows.length === 0) return <EmptyPanel note={t("emptyPriceHistory")} />;
  return (
    <Card padded>
      <SectionTitle>
        {t("priceHistory")}{t("countOpen")}{rows.length} · {section.history?.adjustment}{t("countClose")}
      </SectionTitle>
      <div style={{ display: "grid", gap: 2 }}>
        {rows.map((r) => {
          const ret = r.fields.return;
          const tone =
            (ret ?? 0) > 0
              ? "var(--green-600)"
              : (ret ?? 0) < 0
                ? "var(--red-600)"
                : "var(--text-primary)";
          return (
            <div
              key={r.date}
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 12,
                padding: "6px 0",
                borderBottom: "1px solid var(--border-subtle)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  color: "var(--text-muted)",
                }}
              >
                {r.date}
              </span>
              <span
                style={{ display: "flex", gap: 16, alignItems: "baseline" }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "var(--text-sm)",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {fmt(r.fields.close)}
                </span>
                {ret !== undefined ? (
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-xs)",
                      color: tone,
                      minWidth: 64,
                      textAlign: "right",
                    }}
                  >
                    {fmt(ret * 100, 2)}%
                  </span>
                ) : null}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
