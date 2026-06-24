import type { ReactNode } from "react";
import { Badge, Card, Icon } from "../../ds";
import { EvidenceCard } from "../evidence";
import { KV } from "../KV";
import { Metric } from "../Metric";
import type {
  AnnouncementSection,
  CorporateActionsSection,
  DerivedMetricsSection,
  FinancialFactsSection,
  PriceHistorySection,
  QualityState,
  QuoteSection,
  SecurityProfileSection,
  WorkbenchSection,
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

/** EvidenceCard built from a camelCase upstream-tool section. */
function SectionEvidence({ section }: { section: WorkbenchSection }) {
  return (
    <div style={{ marginTop: 16 }}>
      <EvidenceCard
        asOf={section.asOf ?? ""}
        dataVersion={section.dataVersion}
        methodologyVersion={section.methodologyVersion}
        provenance={section.provenance ?? []}
        usage={section.usage}
      />
    </div>
  );
}

/** Simple version footer for the two snake_case workbench-native sections. */
function VersionFooter({ dataVersion, methodologyVersion }: { dataVersion: string; methodologyVersion: string }) {
  return (
    <div style={{ marginTop: 14, fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
      data_version {dataVersion} · methodology {methodologyVersion}
    </div>
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
      <KV label="代码" value={p.symbol} mono />
      <KV label="交易所 / 市场" value={`${p.exchange} · ${p.market}`} />
      <KV label="货币" value={p.currency} mono />
      <KV label="行业" value={`${p.industry.sector} / ${p.industry.industry}`} />
      <KV label="上市日期" value={p.lifecycle.listedAt} mono />
      <KV label="英文名" value={p.company.name.en} />
      <SectionEvidence section={section} />
    </Card>
  );
}

export function QuotePanel({ section }: { section: QuoteSection }) {
  const q = section.quote;
  if (!q) return <EmptyPanel note="该证券暂无行情快照。" />;
  const f = q.fields;
  const changeTone = (f.change ?? 0) > 0 ? "up" : (f.change ?? 0) < 0 ? "down" : "default";
  return (
    <Card padded>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <SectionTitle>行情快照</SectionTitle>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Badge tone="info" variant="soft" size="sm">{q.delay.type === "delayed" ? `延迟 ${q.delay.minutes} 分钟` : "收盘价"}</Badge>
          <QualityBadge state={q.qualityState} />
        </div>
      </div>
      <div className="ab-grid-3" style={{ gap: 14 }}>
        <Metric label={`最新价 (${q.currency})`} value={fmt(f.lastPrice)} />
        <Metric label="涨跌" value={fmt(f.change)} tone={changeTone} sub={`${fmt(f.changePercent)}%`} />
        <Metric label="昨收" value={fmt(f.previousClose)} />
        <Metric label="成交量" value={fmt(f.volume, 0)} />
        <Metric label="成交额" value={fmt(f.turnover, 0)} />
        <Metric label="市场状态" value={q.marketStatus === "closed" ? "收盘" : q.marketStatus === "post_close" ? "收盘后" : q.marketStatus} />
      </div>
      <div style={{ marginTop: 12, fontSize: "var(--text-2xs)", color: "var(--text-subtle)", fontFamily: "var(--font-mono)" }}>
        数据截至 {q.asOf}
      </div>
      <SectionEvidence section={section} />
    </Card>
  );
}

export function FinancialsPanel({ section }: { section: FinancialFactsSection }) {
  const facts = section.facts?.facts ?? [];
  if (facts.length === 0) return <EmptyPanel note="该证券暂无财务事实。" />;
  return (
    <Card padded>
      <SectionTitle>财务事实</SectionTitle>
      <div style={{ display: "grid", gap: 2 }}>
        {facts.map((row) => (
          <div
            key={`${row.metricId}-${row.periodEnd}-${row.versionStatus}`}
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
                {row.versionStatus === "prior" ? " · 历史重述" : ""}
              </span>
            </span>
            <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>
                {fmt(row.value, 0)}
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>
                {row.unit} {row.currency}
              </span>
              <QualityBadge state={row.qualityState} />
            </span>
          </div>
        ))}
      </div>
      <p style={{ margin: "10px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
        会计准则 {section.facts?.accountingStandard} · 单位 {section.facts?.unit}
      </p>
      <SectionEvidence section={section} />
    </Card>
  );
}

export function DerivedPanel({ section }: { section: DerivedMetricsSection }) {
  const labels = new Map(section.definitions.map((d) => [d.metric_id, d.label]));
  return (
    <Card padded>
      <SectionTitle>派生指标</SectionTitle>
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
            <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)", marginBottom: 4 }}>
              {labels.get(m.metric_id) ?? m.metric_id}
            </div>
            {m.status === "computed" && m.value !== undefined ? (
              <div style={{ fontFamily: "var(--font-display)", fontSize: "var(--text-xl)", fontWeight: 700, color: "var(--text-primary)" }}>
                {m.unit === "ratio" ? `${fmt(m.value * 100, 1)}%` : `${fmt(m.value)}×`}
              </div>
            ) : (
              <div style={{ fontSize: "var(--text-xs)", color: "var(--text-subtle)" }}>
                暂不可计算（{m.blocked_reason ?? "缺少输入"}）
              </div>
            )}
          </div>
        ))}
      </div>
      <VersionFooter dataVersion={section.data_version} methodologyVersion={section.methodology_version} />
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
      <VersionFooter dataVersion={section.data_version} methodologyVersion={section.methodology_version} />
    </Card>
  );
}

export function CorporateActionsPanel({ section }: { section: CorporateActionsSection }) {
  const actions = section.timeline?.actions ?? [];
  if (actions.length === 0) return <EmptyPanel note="该证券暂无公司行动。" />;
  return (
    <Card padded>
      <SectionTitle>公司行动</SectionTitle>
      <div style={{ display: "grid", gap: 10 }}>
        {actions.map((a) => (
          <div
            key={a.actionId}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)" }}
          >
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Badge tone="ai" variant="soft" size="sm">{ACTION_LABEL[a.actionType] ?? a.actionType}</Badge>
                <span style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>{a.summary}</span>
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
                除净日 {a.exDate ?? "—"} · 生效 {a.effectiveDate} · {a.status === "confirmed" ? "已确认" : "已公告"}
              </span>
            </span>
            {a.terms.cashAmount !== undefined ? (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)", whiteSpace: "nowrap" }}>
                {fmt(a.terms.cashAmount)} {a.terms.currency}
              </span>
            ) : a.terms.ratio !== undefined ? (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>
                {fmt(a.terms.ratio)}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      <SectionEvidence section={section} />
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
      <SectionEvidence section={section} />
    </Card>
  );
}
