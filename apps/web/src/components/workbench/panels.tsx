import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge, type BadgeTone, Card, Icon } from "../../ds";
import { KV } from "../KV";
import { Metric } from "../Metric";
import { formatHkCode, formatHkSymbol } from "../../lib/format";
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
  if (!state) return null;
  return (
    <Badge tone={state === "PASS" ? "bullish" : "warning"} variant="soft" size="sm" dot>
      {state === "PASS" ? "质量通过" : "质量保留"}
    </Badge>
  );
}

function EmptyPanel({ note }: { note: string }) {
  return (
    <Card padded>
      <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{note}</p>
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

const FINANCIAL_LABEL: Record<string, string> = {
  revenue: "营业收入",
  net_income: "净利润",
  assets: "总资产",
  liabilities: "总负债",
  equity: "股东权益",
  operating_cash_flow: "经营现金流",
  free_cash_flow: "自由现金流",
};

const ACTION_LABEL: Record<string, string> = {
  dividend: "派息",
  buyback: "回购",
  split: "拆股",
  consolidation: "并股",
  rights: "供股",
  placement: "配售",
};

const ANNOUNCEMENT_LABEL: Record<string, string> = {
  results: "业绩",
  dividend: "派息",
  buyback: "回购",
};

const SDI_POSITION_LABEL: Record<LiveSdiPositionType, string> = {
  long: "好仓",
  pool: "借出库存",
  short: "淡仓",
};

const SDI_FORM_LABEL: Record<string, string> = {
  "1": "表格 1",
  "2": "表格 2",
  "3A": "表格 3A",
};

const DIRECTORATE_CAPACITY_LABEL: Record<LiveDirectorateCapacity, string> = {
  D: "董事",
  S: "高级管理人员",
};

// --- panels --------------------------------------------------------------

export function ProfilePanel({ section }: { section: SecurityProfileSection }) {
  const p = section.profile;
  if (!p) return <EmptyPanel note="该证券暂无公司档案（未解析或合成数据未覆盖）。" />;
  return (
    <Card padded>
      <SectionTitle>公司档案</SectionTitle>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--text-primary)" }}>
          {p.company.name.zhHant || p.company.name.en}
        </span>
        <Badge tone={p.listingStatus === "listed" ? "bullish" : "warning"} variant="soft" size="sm">
          {p.listingStatus === "listed" ? "上市" : p.listingStatus === "suspended" ? "停牌" : "退市"}
        </Badge>
      </div>
      <KV label="代码" value={formatHkSymbol(p.symbol)} mono />
      <KV label="交易所 / 市场" value={`${p.exchange} · ${p.market}`} />
      <KV label="货币" value={p.currency} mono />
      <KV label="行业" value={`${p.industry.sector} / ${p.industry.industry}`} />
      <KV label="上市日期" value={p.lifecycle.listedAt} mono />
      <KV label="英文名" value={p.company.name.en} />
    </Card>
  );
}

const QUOTE_SNAPSHOT_STATE_TONE: Partial<Record<AiphaBeeErrorCode, BadgeTone>> = {
  AUTH_REQUIRED: "info",
  DATA_NOT_LICENSED: "neutral",
  DATA_QUALITY_HOLD: "warning",
  NOT_FOUND: "neutral",
};

const QUOTE_SNAPSHOT_STATE_LABEL: Partial<Record<AiphaBeeErrorCode, string>> = {
  AUTH_REQUIRED: "需要登录",
  DATA_NOT_LICENSED: "未获授权",
  DATA_QUALITY_HOLD: "质量保留",
  NOT_FOUND: "未找到",
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
  const { data: quoteEnv, isLoading } = useQuery({
    queryKey: ["quote-snapshot-live", instrumentId],
    queryFn: () => resolveQuoteSnapshot(instrumentId),
  });

  if (isLoading) {
    return (
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>正在加载行情快照…</p>
    );
  }

  if (!quoteEnv || !quoteEnv.ok) {
    const code = quoteEnv?.error.code;
    const tone: BadgeTone = (code && QUOTE_SNAPSHOT_STATE_TONE[code]) ?? "bearish";
    const label = (code && QUOTE_SNAPSHOT_STATE_LABEL[code]) ?? "暂不可用";
    const detail = quoteEnv ? presentError(quoteEnv).detail : "行情快照服务暂不可用。";
    return (
      <Card padded>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <SectionTitle>行情快照</SectionTitle>
          <Badge tone={tone} variant="soft" size="sm" dot>
            {label}
          </Badge>
        </div>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{detail}</p>
      </Card>
    );
  }

  const { coverage, quote } = quoteEnv.data;
  if (coverage?.status === "unavailable") {
    return <EmptyPanel note={coverage.reason ?? "该证券暂无可用的收盘行情。"} />;
  }
  if (!quote) return <EmptyPanel note="该证券暂无行情快照。" />;

  return (
    <Card padded>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <SectionTitle>行情快照</SectionTitle>
        <Badge tone="info" variant="soft" size="sm">收盘价 · {quote.tradeDate}</Badge>
      </div>
      <div className="ab-grid-3" style={{ gap: 14 }}>
        <Metric label={`收盘价 (${quote.currency})`} value={fmt(quote.close)} />
        <Metric label="开盘" value={fmt(quote.open)} />
        <Metric label="最高" value={fmt(quote.high)} />
        <Metric label="最低" value={fmt(quote.low)} />
        <Metric label="成交量" value={fmt(quote.volume, 0)} />
        <Metric label="成交额" value={fmt(quote.turnover, 0)} />
        {quote.sharesOutstanding !== undefined ? (
          <Metric label="已发行股数" value={fmt(quote.sharesOutstanding, 0)} />
        ) : null}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
        收盘价 · 非实时行情
      </p>
    </Card>
  );
}

const FINANCIAL_FACTS_STATE_TONE: Partial<Record<AiphaBeeErrorCode, BadgeTone>> = {
  AUTH_REQUIRED: "info",
  DATA_NOT_LICENSED: "neutral",
  DATA_QUALITY_HOLD: "warning",
  NOT_FOUND: "neutral",
};

const FINANCIAL_FACTS_STATE_LABEL: Partial<Record<AiphaBeeErrorCode, string>> = {
  AUTH_REQUIRED: "需要登录",
  DATA_NOT_LICENSED: "未获授权",
  DATA_QUALITY_HOLD: "质量保留",
  NOT_FOUND: "未找到",
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
  const { data: factsEnv, isLoading } = useQuery({
    queryKey: ["financial-facts-live", instrumentId],
    queryFn: () => resolveFinancialFacts(instrumentId),
  });

  if (isLoading) {
    return (
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>正在加载财务事实…</p>
    );
  }

  if (!factsEnv || !factsEnv.ok) {
    const code = factsEnv?.error.code;
    const tone: BadgeTone = (code && FINANCIAL_FACTS_STATE_TONE[code]) ?? "bearish";
    const label = (code && FINANCIAL_FACTS_STATE_LABEL[code]) ?? "暂不可用";
    const detail = factsEnv ? presentError(factsEnv).detail : "财务事实服务暂不可用。";
    return (
      <Card padded>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <SectionTitle>财务事实</SectionTitle>
          <Badge tone={tone} variant="soft" size="sm" dot>
            {label}
          </Badge>
        </div>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{detail}</p>
      </Card>
    );
  }

  const { coverage, facts } = factsEnv.data;
  if (coverage?.status === "unavailable") {
    return <EmptyPanel note={coverage.reason ?? "该证券的财务报表口径暂未覆盖。"} />;
  }
  if (!facts || facts.length === 0) return <EmptyPanel note="该证券暂无财务事实。" />;

  return (
    <Card padded>
      <SectionTitle>财务事实</SectionTitle>
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
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>
                {FINANCIAL_LABEL[row.metricId] ?? row.metricId}
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
                {row.periodEnd} · {row.periodType}
              </span>
            </span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>
                {fmt(row.value, 0)}
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>
                {row.currency}
              </span>
              <QualityBadge state={row.qualityState} />
            </span>
          </div>
        ))}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
        实时数据 · 非银行/保险口径财报
      </p>
    </Card>
  );
}

const DERIVED_METRICS_STATE_TONE: Partial<Record<AiphaBeeErrorCode, BadgeTone>> = {
  AUTH_REQUIRED: "info",
  DATA_NOT_LICENSED: "neutral",
  DATA_QUALITY_HOLD: "warning",
  NOT_FOUND: "neutral",
};

const DERIVED_METRICS_STATE_LABEL: Partial<Record<AiphaBeeErrorCode, string>> = {
  AUTH_REQUIRED: "需要登录",
  DATA_NOT_LICENSED: "未获授权",
  DATA_QUALITY_HOLD: "质量保留",
  NOT_FOUND: "未找到",
};

// Per-metric blocked_reason -> honest Chinese copy. Deliberately never says
// "未获授权": once the envelope itself is ok, the whole derived-metrics
// feature IS authorized (resolveDerivedMetrics already conjuncts the
// financial_facts + quote_snapshot Web gates before returning any data) --
// a blocked metric here is a data-availability gap for this instrument, not
// a licensing gap.
const DERIVED_METRIC_BLOCKED_REASON_LABEL: Record<string, string> = {
  financial_facts_not_found: "该证券暂无财务数据",
  missing_input: "缺少计算所需的财务输入",
  negative_denominator: "分母为负，结果不具参考意义",
  quality_hold: "输入数据质量保留中",
  quote_unavailable: "该证券暂无可用行情，无法计算市值型指标",
  shares_outstanding_unavailable: "该证券暂未披露流通股本，无法计算市值型指标",
  zero_denominator: "分母为零，无法计算",
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
  const { data: derivedEnv, isLoading } = useQuery({
    queryKey: ["derived-metrics-live", instrumentId],
    queryFn: () => resolveDerivedMetrics(instrumentId),
  });

  if (isLoading) {
    return (
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>正在加载派生指标…</p>
    );
  }

  if (!derivedEnv || !derivedEnv.ok) {
    const code = derivedEnv?.error.code;
    const tone: BadgeTone = (code && DERIVED_METRICS_STATE_TONE[code]) ?? "bearish";
    const label = (code && DERIVED_METRICS_STATE_LABEL[code]) ?? "暂不可用";
    const detail = derivedEnv ? presentError(derivedEnv).detail : "派生指标服务暂不可用。";
    return (
      <Card padded>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <SectionTitle>派生指标</SectionTitle>
          <Badge tone={tone} variant="soft" size="sm" dot>
            {label}
          </Badge>
        </div>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{detail}</p>
      </Card>
    );
  }

  const section = derivedEnv.data;
  const labels = new Map(section.definitions.map((d) => [d.metric_id, d.label]));
  const asOfParts = [
    section.financial_period_end ? `财务期末 · ${section.financial_period_end}` : null,
    section.quote_as_of ? `行情 · ${section.quote_as_of.slice(0, 10)}` : null,
  ].filter((part): part is string => part !== null);

  return (
    <Card padded>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <SectionTitle>派生指标</SectionTitle>
        {asOfParts.length > 0 ? (
          <Badge tone="info" variant="soft" size="sm">{asOfParts.join(" · ")}</Badge>
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
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>
                {labels.get(m.metric_id) ?? m.metric_id}
              </span>
              {m.anomaly_flags.includes("currency_mismatch") ? (
                <Badge tone="warning" variant="soft" size="sm">货币口径不一致</Badge>
              ) : null}
            </div>
            {m.status === "computed" && m.value !== undefined ? (
              <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text-primary)" }}>
                {m.unit === "ratio" ? `${fmt(m.value * 100, 1)}%` : `${fmt(m.value)}×`}
              </div>
            ) : (
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-subtle)" }}>
                {DERIVED_METRIC_BLOCKED_REASON_LABEL[m.blocked_reason ?? ""] ?? m.blocked_reason ?? "暂不可计算"}
              </div>
            )}
          </div>
        ))}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
        综合财务事实与收盘行情计算 · 非实时估值
      </p>
    </Card>
  );
}

export function AnnouncementsPanel({ section }: { section: AnnouncementSection }) {
  if (section.announcements.length === 0) return <EmptyPanel note="该证券暂无公告。" />;
  return (
    <Card padded>
      <SectionTitle>公告（{section.total_count}）</SectionTitle>
      <div style={{ display: "grid", gap: 12 }}>
        {section.announcements.map((a) => (
          <div
            key={a.announcement_id}
            style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
              <Badge tone="navy" variant="soft" size="sm">{ANNOUNCEMENT_LABEL[a.category] ?? a.category}</Badge>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>{a.title}</span>
            </div>
            <p style={{ margin: "0 0 8px", fontSize: "var(--text-sm)", color: "var(--text-body)", lineHeight: 1.55 }}>{a.summary}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
              <span style={{ fontFamily: "var(--font-mono)" }}>{a.published_at}</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Icon name="file-text" size={12} /> 原文 P.{a.evidence_locator.page} · {a.evidence_locator.anchor}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

const CORPORATE_ACTIONS_STATE_TONE: Partial<Record<AiphaBeeErrorCode, BadgeTone>> = {
  AUTH_REQUIRED: "info",
  DATA_NOT_LICENSED: "neutral",
  DATA_QUALITY_HOLD: "warning",
  NOT_FOUND: "neutral",
};

const CORPORATE_ACTIONS_STATE_LABEL: Partial<Record<AiphaBeeErrorCode, string>> = {
  AUTH_REQUIRED: "需要登录",
  DATA_NOT_LICENSED: "未获授权",
  DATA_QUALITY_HOLD: "质量保留",
  NOT_FOUND: "未找到",
};

/** Client-side display label only, composed from already-promoted numeric
 * fields (never a substitute for the vendor's own text): buyback rows carry
 * no vendor summary (no free-text field exists on nq_sharebuyback.daily_data),
 * so this describes the same terms already rendered as the trailing amount. */
function describeCorporateAction(action: LiveCorporateActionRow): string {
  if (action.summary) return action.summary;
  if (action.actionType === "buyback" && action.terms?.shares !== undefined) {
    return `场内回购 ${fmt(action.terms.shares, 0)} 股`;
  }
  return ACTION_LABEL[action.actionType] ?? action.actionType;
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
export function CorporateActionsPanel({ instrumentId }: { instrumentId: string }) {
  const { data: actionsEnv, isLoading } = useQuery({
    queryKey: ["corporate-actions-live", instrumentId],
    queryFn: () => resolveCorporateActions(instrumentId),
  });

  if (isLoading) {
    return (
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>正在加载公司行动…</p>
    );
  }

  if (!actionsEnv || !actionsEnv.ok) {
    const code = actionsEnv?.error.code;
    const tone: BadgeTone = (code && CORPORATE_ACTIONS_STATE_TONE[code]) ?? "bearish";
    const label = (code && CORPORATE_ACTIONS_STATE_LABEL[code]) ?? "暂不可用";
    const detail = actionsEnv ? presentError(actionsEnv).detail : "公司行动服务暂不可用。";
    return (
      <Card padded>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <SectionTitle>公司行动</SectionTitle>
          <Badge tone={tone} variant="soft" size="sm" dot>
            {label}
          </Badge>
        </div>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{detail}</p>
      </Card>
    );
  }

  const { coverage, actions } = actionsEnv.data;
  if (coverage?.status === "unavailable") {
    return <EmptyPanel note={coverage.reason ?? "该证券暂无公司行动。"} />;
  }
  if (!actions || actions.length === 0) return <EmptyPanel note="该证券暂无公司行动。" />;

  return (
    <Card padded>
      <SectionTitle>公司行动（{actions.length}）</SectionTitle>
      <div style={{ display: "grid", gap: 10 }}>
        {actions.map((a) => (
          <div
            key={a.actionId}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)" }}
          >
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Badge tone="ai" variant="soft" size="sm">{ACTION_LABEL[a.actionType] ?? a.actionType}</Badge>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>{describeCorporateAction(a)}</span>
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
                公告 {a.announcementDate} · 生效 {a.effectiveDate}{a.paymentDate ? ` · 派付 ${a.paymentDate}` : ""}
              </span>
            </span>
            {a.terms?.cashAmount !== undefined ? (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                {fmt(a.terms.cashAmount)} {a.terms.currency}
              </span>
            ) : a.terms?.buybackValue !== undefined ? (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                {fmt(a.terms.buybackValue, 0)} {a.terms.currency}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
        实时数据 · 派息/回购/拆股/并股
      </p>
    </Card>
  );
}

const SDI_DISCLOSURE_STATE_TONE: Partial<Record<AiphaBeeErrorCode, BadgeTone>> = {
  AUTH_REQUIRED: "info",
  DATA_NOT_LICENSED: "neutral",
  DATA_QUALITY_HOLD: "warning",
  NOT_FOUND: "neutral",
};

const SDI_DISCLOSURE_STATE_LABEL: Partial<Record<AiphaBeeErrorCode, string>> = {
  AUTH_REQUIRED: "需要登录",
  DATA_NOT_LICENSED: "未获授权",
  DATA_QUALITY_HOLD: "质量保留",
  NOT_FOUND: "未找到",
};

/** Pure numeric before/after comparison (never an eventCode decode -- no
 * decode table exists for it): up/flat/down is derived only from the two
 * already-promoted balance percentages, the same discipline
 * sdi.jsx's NqSdiDelta component uses. */
function sdiBalanceTone(before: number | undefined, after: number | undefined): string {
  if (before === undefined || after === undefined || after === before) return "var(--text-primary)";
  return after > before ? "var(--green-600)" : "var(--red-600)";
}

function SdiPositionRow({ position }: { position: LiveSdiDisclosureRow["positions"][number] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <Badge tone="navy" variant="soft" size="sm">{SDI_POSITION_LABEL[position.positionType]}</Badge>
      {position.previousBalancePercent !== undefined || position.presentBalancePercent !== undefined ? (
        <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6, fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)" }}>
          <span style={{ color: "var(--text-subtle)" }}>{fmt(position.previousBalancePercent)}%</span>
          <Icon name="arrow-right" size={11} />
          <span style={{ fontWeight: 700, color: sdiBalanceTone(position.previousBalancePercent, position.presentBalancePercent) }}>
            {fmt(position.presentBalancePercent)}%
          </span>
        </span>
      ) : null}
      {position.shares !== undefined ? (
        <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
          变动 <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{fmt(position.shares, 0)}</span> 股
          {position.currency ? ` (${position.currency})` : ""}
        </span>
      ) : null}
      {position.eventCode ? (
        <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>代码 {position.eventCode}</span>
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
  const { data: sdiEnv, isLoading } = useQuery({
    queryKey: ["sdi-disclosure-live", instrumentId],
    queryFn: () => resolveSdiDisclosure(instrumentId),
  });

  if (isLoading) {
    return (
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>正在加载权益披露…</p>
    );
  }

  if (!sdiEnv || !sdiEnv.ok) {
    const code = sdiEnv?.error.code;
    const tone: BadgeTone = (code && SDI_DISCLOSURE_STATE_TONE[code]) ?? "bearish";
    const label = (code && SDI_DISCLOSURE_STATE_LABEL[code]) ?? "暂不可用";
    const detail = sdiEnv ? presentError(sdiEnv).detail : "权益披露服务暂不可用。";
    return (
      <Card padded>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <SectionTitle>权益披露</SectionTitle>
          <Badge tone={tone} variant="soft" size="sm" dot>
            {label}
          </Badge>
        </div>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{detail}</p>
      </Card>
    );
  }

  const { coverage, disclosures } = sdiEnv.data;
  if (coverage?.status === "unavailable") {
    return <EmptyPanel note={coverage.reason ?? "该证券暂无权益披露记录。"} />;
  }
  if (!disclosures || disclosures.length === 0) return <EmptyPanel note="该证券暂无权益披露记录。" />;

  return (
    <Card padded>
      <SectionTitle>权益披露（{disclosures.length}）</SectionTitle>
      <div style={{ display: "grid", gap: 10 }}>
        {disclosures.map((d) => (
          <div
            key={d.disclosureId}
            style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--text-subtle)" }}>
                {d.reportDate}
              </span>
              <Badge tone="ai" variant="soft" size="sm">{SDI_FORM_LABEL[d.formType] ?? d.formType}</Badge>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)" }}>
                {d.holderName.zhHant || d.holderName.en}
              </span>
              <span style={{ marginLeft: "auto", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
                股份类别 {d.shareClass}
              </span>
            </div>
            <div style={{ display: "grid", gap: 6 }}>
              {d.positions.map((position, index) => (
                <SdiPositionRow key={`${d.disclosureId}-${position.positionType}-${index}`} position={position} />
              ))}
            </div>
            <p style={{ margin: "8px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
              编号 <span style={{ fontFamily: "var(--font-mono)" }}>{d.referenceNo}</span>
              {d.amendsReferenceNo ? ` · 修订自 ${d.amendsReferenceNo}` : ""}
              {d.supersededByReferenceNo ? ` · 已被 ${d.supersededByReferenceNo} 取代` : ""}
            </p>
          </div>
        ))}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
        实时数据 · 大股东及董事权益披露（SFO 第 XV 部）
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

const DIRECTORATE_STATE_LABEL: Partial<Record<AiphaBeeErrorCode, string>> = {
  AUTH_REQUIRED: "需要登录",
  DATA_NOT_LICENSED: "未获授权",
  DATA_QUALITY_HOLD: "质量保留",
  NOT_FOUND: "未找到",
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
function DirectorateProfileCard({ director }: { director: LiveDirectorateProfileRow }) {
  const displayTitle = director.title.zhHant || director.title.zhHans || director.title.en;
  const biographyText = director.biography?.zhHant || director.biography?.en || director.biography?.zhHans;
  return (
    <div
      style={{ padding: "12px 14px", borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
        <Badge tone={director.capacity === "D" ? "ai" : "navy"} variant="soft" size="sm">
          {DIRECTORATE_CAPACITY_LABEL[director.capacity]}
        </Badge>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)" }}>
          {director.name.zhHant || director.name.en}
        </span>
        <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>{director.name.en}</span>
        {director.age !== undefined ? (
          <span style={{ marginLeft: "auto", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>{director.age} 岁</span>
        ) : null}
      </div>
      <p style={{ margin: "0 0 6px", fontSize: "var(--text-sm)", color: "var(--text-body)" }}>{displayTitle}</p>
      {biographyText ? (
        <p style={{ margin: "0 0 6px", fontSize: "var(--text-xs)", color: "var(--text-muted)", lineHeight: 1.6 }}>
          {biographyText}
        </p>
      ) : null}
      {director.remuneration ? (
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
          <span>薪酬</span>
          {director.remuneration.currentAmount !== undefined ? (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>
              {fmt(director.remuneration.currentAmount, 0)} {director.remuneration.currency}
            </span>
          ) : null}
          {director.remuneration.previousAmount !== undefined ? (
            <span>
              上年度 {fmt(director.remuneration.previousAmount, 0)} {director.remuneration.currency}
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
  const { data: directorateEnv, isLoading } = useQuery({
    queryKey: ["directorate-live", instrumentId],
    queryFn: () => resolveDirectorate(instrumentId),
  });

  if (isLoading) {
    return (
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>正在加载董事高管…</p>
    );
  }

  if (!directorateEnv || !directorateEnv.ok) {
    const code = directorateEnv?.error.code;
    const tone: BadgeTone = (code && DIRECTORATE_STATE_TONE[code]) ?? "bearish";
    const label = (code && DIRECTORATE_STATE_LABEL[code]) ?? "暂不可用";
    const detail = directorateEnv ? presentError(directorateEnv).detail : "董事高管服务暂不可用。";
    return (
      <Card padded>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <SectionTitle>董事高管</SectionTitle>
          <Badge tone={tone} variant="soft" size="sm" dot>
            {label}
          </Badge>
        </div>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{detail}</p>
      </Card>
    );
  }

  const { coverage, directors } = directorateEnv.data;
  if (coverage?.status === "unavailable") {
    return <EmptyPanel note={coverage.reason ?? "该证券暂无董事高管记录。"} />;
  }
  if (!directors || directors.length === 0) return <EmptyPanel note="该证券暂无董事高管记录。" />;

  const directorCount = directors.filter((d) => d.capacity === "D").length;
  const seniorManagementCount = directors.length - directorCount;

  return (
    <Card padded>
      <SectionTitle>董事高管（{directors.length}）</SectionTitle>
      <p style={{ margin: "0 0 10px", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
        董事 {directorCount} · 高级管理人员 {seniorManagementCount}
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        {directors.map((director) => (
          <DirectorateProfileCard key={director.profileId} director={director} />
        ))}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
        实时数据 · 董事及高级管理人员履历（年报披露）
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

const OWNERSHIP_STATE_LABEL: Partial<Record<AiphaBeeErrorCode, string>> = {
  AUTH_REQUIRED: "需要登录",
  DATA_NOT_LICENSED: "未获授权",
  DATA_QUALITY_HOLD: "质量保留",
  NOT_FOUND: "未找到",
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
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}
    >
      <Badge tone={holder.crossHolding ? "ai" : "neutral"} variant="soft" size="sm">{holder.holderType}</Badge>
      <span style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)", minWidth: 0, flex: 1 }}>
        {holder.name.zhHant || holder.name.en}
      </span>
      {holder.crossHolding ? (
        <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)", fontFamily: "var(--font-mono)" }}>
          交叉持股 → {holder.crossHolding.instrumentId}
        </span>
      ) : null}
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)" }}>
        {fmt(holder.heldPercent, 2)}%
      </span>
      <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
        {fmt(holder.heldShares, 0)} 股 · {holder.asOf}
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
  const { data: ownershipEnv, isLoading } = useQuery({
    queryKey: ["ownership-live", instrumentId],
    queryFn: () => resolveOwnership(instrumentId),
  });

  if (isLoading) {
    return (
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>正在加载股权结构…</p>
    );
  }

  if (!ownershipEnv || !ownershipEnv.ok) {
    const code = ownershipEnv?.error.code;
    const tone: BadgeTone = (code && OWNERSHIP_STATE_TONE[code]) ?? "bearish";
    const label = (code && OWNERSHIP_STATE_LABEL[code]) ?? "暂不可用";
    const detail = ownershipEnv ? presentError(ownershipEnv).detail : "股权结构服务暂不可用。";
    return (
      <Card padded>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <SectionTitle>股权结构</SectionTitle>
          <Badge tone={tone} variant="soft" size="sm" dot>
            {label}
          </Badge>
        </div>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{detail}</p>
      </Card>
    );
  }

  const { coverage, shareCapital, freeFloat, holders } = ownershipEnv.data;
  if (coverage?.status === "unavailable") {
    return <EmptyPanel note={coverage.reason ?? "该证券暂无股权结构记录。"} />;
  }
  if (!shareCapital && !freeFloat && (!holders || holders.length === 0)) {
    return <EmptyPanel note="该证券暂无股权结构记录。" />;
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {shareCapital || freeFloat ? (
        <Card padded>
          <SectionTitle>股本与流通</SectionTitle>
          <div className="ab-grid-3" style={{ gap: 14 }}>
            {shareCapital ? (
              <Metric label="已发行股份" value={fmt(shareCapital.issuedShares, 0)} sub={shareCapital.hkShareClass} />
            ) : null}
            {freeFloat ? (
              <Metric label="自由流通比例" value={`${fmt(freeFloat.freeFloatPercent, 2)}%`} sub={`流通 ${fmt(freeFloat.freeFloatShares, 0)} 股`} tone="up" />
            ) : null}
            {shareCapital?.hkShares !== undefined ? (
              <Metric label="香港股份类别股数" value={fmt(shareCapital.hkShares, 0)} />
            ) : null}
            {shareCapital?.nonHkShares !== undefined ? (
              <Metric label="非香港股份类别股数" value={fmt(shareCapital.nonHkShares, 0)} sub={shareCapital.nonHkShareClass} />
            ) : null}
            {shareCapital?.sharesInCcass !== undefined ? (
              <Metric label="中央结算持股" value={fmt(shareCapital.sharesInCcass, 0)} />
            ) : null}
            {shareCapital?.sharesOutsideCcass !== undefined ? (
              <Metric label="中央结算外持股" value={fmt(shareCapital.sharesOutsideCcass, 0)} />
            ) : null}
            {shareCapital?.preferenceShares !== undefined ? (
              <Metric label="优先股" value={fmt(shareCapital.preferenceShares, 0)} />
            ) : null}
            {shareCapital?.weightedVotingRightsRatio !== undefined ? (
              <Metric label="不同投票权比率" value={fmt(shareCapital.weightedVotingRightsRatio, 2)} />
            ) : null}
          </div>
          <p style={{ margin: "10px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
            实时数据{shareCapital ? ` · 股本截至 ${shareCapital.asOf}` : ""}{freeFloat ? ` · 自由流通截至 ${freeFloat.asOf}` : ""}
          </p>
        </Card>
      ) : null}

      {holders && holders.length > 0 ? (
        <Card padded>
          <SectionTitle>持有人及交叉持股（{holders.length}）</SectionTitle>
          <div style={{ display: "grid" }}>
            {holders.map((holder) => (
              <OwnershipHolderRow key={holder.holderId} holder={holder} />
            ))}
          </div>
          <p style={{ margin: "10px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
            实时数据 · 主要股东及董事权益披露 · 上市公司交叉持股以箭头标注
          </p>
        </Card>
      ) : null}
    </div>
  );
}

const RELATED_WARRANTS_STATE_TONE: Partial<Record<AiphaBeeErrorCode, BadgeTone>> = {
  AUTH_REQUIRED: "info",
  DATA_NOT_LICENSED: "neutral",
  DATA_QUALITY_HOLD: "warning",
  NOT_FOUND: "neutral",
};

const RELATED_WARRANTS_STATE_LABEL: Partial<Record<AiphaBeeErrorCode, string>> = {
  AUTH_REQUIRED: "需要登录",
  DATA_NOT_LICENSED: "未获授权",
  DATA_QUALITY_HOLD: "质量保留",
  NOT_FOUND: "未找到",
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
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", padding: "10px 0", borderBottom: "1px solid var(--border-subtle)" }}
    >
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)" }}>
        {formatHkCode(warrant.instrumentId.replace("hkex_security_", ""))}
      </span>
      <span style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)", minWidth: 0, flex: 1 }}>
        {warrant.name.zhHant || warrant.name.en}
      </span>
      <Badge tone="neutral" variant="soft" size="sm">{warrant.category}</Badge>
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
export function RelatedWarrantsPanel({ instrumentId }: { instrumentId: string }) {
  const { data: relatedWarrantsEnv, isLoading } = useQuery({
    queryKey: ["related-warrants-live", instrumentId],
    queryFn: () => resolveRelatedWarrants(instrumentId),
  });

  if (isLoading) {
    return (
      <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>正在加载相关轮证…</p>
    );
  }

  if (!relatedWarrantsEnv || !relatedWarrantsEnv.ok) {
    const code = relatedWarrantsEnv?.error.code;
    const tone: BadgeTone = (code && RELATED_WARRANTS_STATE_TONE[code]) ?? "bearish";
    const label = (code && RELATED_WARRANTS_STATE_LABEL[code]) ?? "暂不可用";
    const detail = relatedWarrantsEnv ? presentError(relatedWarrantsEnv).detail : "相关轮证服务暂不可用。";
    return (
      <Card padded>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <SectionTitle>相关轮证</SectionTitle>
          <Badge tone={tone} variant="soft" size="sm" dot>
            {label}
          </Badge>
        </div>
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{detail}</p>
      </Card>
    );
  }

  const { coverage, warrants } = relatedWarrantsEnv.data;
  if (coverage?.status === "unavailable") {
    return <EmptyPanel note={coverage.reason ?? "该证券暂无相关轮证。"} />;
  }
  if (!warrants || warrants.length === 0) return <EmptyPanel note="该证券暂无相关轮证。" />;

  return (
    <Card padded>
      <SectionTitle>相关轮证（{warrants.length}）</SectionTitle>
      <div style={{ display: "grid" }}>
        {warrants.map((warrant) => (
          <RelatedWarrantRow key={warrant.sourceRecordId} warrant={warrant} />
        ))}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
        实时数据 · 与正股关联的衍生权证 / 牛熊证代号（nq_basicdata.relatedcode）· 类型为原始供应商分类，暂未提供行使价/到期日等条款字段
      </p>
    </Card>
  );
}

export function PricePanel({ section }: { section: PriceHistorySection }) {
  const rows = (section.history?.rows ?? []).slice(-12).reverse();
  if (rows.length === 0) return <EmptyPanel note="该证券暂无价格历史。" />;
  return (
    <Card padded>
      <SectionTitle>价格历史（近 {rows.length} 期 · {section.history?.adjustment}）</SectionTitle>
      <div style={{ display: "grid", gap: 2 }}>
        {rows.map((r) => {
          const ret = r.fields.return;
          const tone = (ret ?? 0) > 0 ? "var(--green-600)" : (ret ?? 0) < 0 ? "var(--red-600)" : "var(--text-primary)";
          return (
            <div
              key={r.date}
              style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: "1px solid var(--border-subtle)" }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{r.date}</span>
              <span style={{ display: "flex", gap: 16, alignItems: "baseline" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>{fmt(r.fields.close)}</span>
                {ret !== undefined ? (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: tone, minWidth: 64, textAlign: "right" }}>
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
