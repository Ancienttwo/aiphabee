import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Icon, ScoreMeter } from "../ds";
import { SECTOR_LABEL, STATUS_CONFIG, type IpoRecord, type IpoStatus, type Sector } from "../data/ipos";
import {
  compareIpos,
  getIpos,
  normalizeScreeningInput,
  screenIpos,
  type ScreeningInput,
} from "../lib/mock-api";
import { demandColor, formatMultiple, formatPercent, formatScore } from "../lib/format";
import { SHELL } from "../lib/ui";

export const Route = createFileRoute("/analysis")({
  component: AnalysisWorkbench,
});

const DEFAULT_COMPARE_IDS = ["honeycomb", "lotus", "pearl"];
const SECTOR_OPTIONS: Array<Sector | "all"> = ["all", "tech", "fintech", "health", "industrial", "energy"];
const STATUS_OPTIONS: Array<IpoStatus | "all"> = ["all", "pending", "priced", "listed", "withdrawn"];

function FieldLabel({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6, fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-muted)" }}>
      {label}
      {children}
    </label>
  );
}

function inputStyle() {
  return {
    height: 36,
    border: "1px solid var(--border-default)",
    borderRadius: "var(--radius-md)",
    padding: "0 10px",
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-sm)",
    background: "var(--surface-card)",
    color: "var(--text-primary)",
  };
}

function MetricCell({ value, tone }: { value: string; tone?: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        minHeight: 24,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-sm)",
        fontWeight: 700,
        color: tone || "var(--text-primary)",
      }}
    >
      {value}
    </span>
  );
}

function IpoPicker({
  ipos,
  selectedIds,
  onToggle,
}: {
  ipos: IpoRecord[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {ipos.map((ipo) => {
        const selected = selectedIds.includes(ipo.id);
        const disabled = !selected && selectedIds.length >= 5;
        return (
          <button
            key={ipo.id}
            onClick={() => onToggle(ipo.id)}
            disabled={disabled}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              border: `1px solid ${selected ? "var(--honey-500)" : "var(--border-subtle)"}`,
              background: selected ? "var(--honey-50)" : "var(--surface-card)",
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.55 : 1,
              textAlign: "left",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 18,
                height: 18,
                borderRadius: 6,
                border: `2px solid ${selected ? "var(--honey-600)" : "var(--border-default)"}`,
                background: selected ? "var(--honey-500)" : "transparent",
              }}
            />
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)" }}>
                {ipo.name}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                {ipo.ticker} · {SECTOR_LABEL[ipo.sector]}
              </span>
            </span>
            <Badge tone={STATUS_CONFIG[ipo.status].tone} size="sm">
              {STATUS_CONFIG[ipo.status].label}
            </Badge>
          </button>
        );
      })}
    </div>
  );
}

function ComparisonTable({ selectedIds }: { selectedIds: string[] }) {
  const env = compareIpos(selectedIds);

  if (!env.ok) {
    return (
      <div style={{ padding: "18px 24px", color: "var(--red-600)", fontSize: "var(--text-sm)" }}>
        {env.error.message}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "100%", overflowX: "auto", contain: "inline-size" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "0 16px 10px 24px", color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>
              Security
            </th>
            {env.data.metrics.map((metric) => (
              <th key={metric.key} style={{ textAlign: "left", padding: "0 16px 10px", color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>
                {metric.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {env.data.rows.map((row) => (
            <tr key={row.ipo.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
              <td style={{ padding: "14px 16px 14px 24px" }}>
                <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)" }}>{row.ipo.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{row.ipo.ticker}</div>
              </td>
              <td style={{ padding: "14px 16px" }}>
                <div style={{ width: 126 }}>
                  <ScoreMeter value={row.metrics.score} tone={row.metrics.score >= 70 ? "bullish" : row.metrics.score >= 50 ? "neutral" : "bearish"} showValue={false} />
                  <MetricCell value={formatScore(row.metrics.score)} />
                </div>
              </td>
              <td style={{ padding: "14px 16px" }}>
                <MetricCell value={formatMultiple(row.metrics.subscription)} tone={demandColor(row.metrics.subscription)} />
              </td>
              <td style={{ padding: "14px 16px" }}>
                <MetricCell value={formatPercent(row.metrics.confidence)} />
              </td>
              <td style={{ padding: "14px 16px" }}>
                <MetricCell value={`${row.metrics.rating.toFixed(1)} / 5`} />
              </td>
              <td style={{ padding: "14px 16px" }}>
                <MetricCell value={formatPercent(row.metrics.cornerstone)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, padding: 24, borderTop: "1px solid var(--border-subtle)" }}>
        {env.data.rows.map((row) => (
          <div key={row.ipo.id}>
            <div style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{row.ipo.ticker} why</div>
            <ul style={{ margin: 0, paddingLeft: 18, color: "var(--text-body)", fontSize: "var(--text-sm)", lineHeight: 1.6 }}>
              {row.why.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreeningEditor({
  input,
  onChange,
}: {
  input: Required<ScreeningInput>;
  onChange: (input: ScreeningInput) => void;
}) {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        <FieldLabel label="Min score">
          <input
            type="number"
            min={0}
            max={100}
            value={input.minScore}
            onChange={(event) => onChange({ minScore: Number(event.currentTarget.value) })}
            style={inputStyle()}
          />
        </FieldLabel>
        <FieldLabel label="Min subscription">
          <input
            type="number"
            min={0}
            step={0.1}
            value={input.minSubscription}
            onChange={(event) => onChange({ minSubscription: Number(event.currentTarget.value) })}
            style={inputStyle()}
          />
        </FieldLabel>
        <FieldLabel label="Min confidence">
          <input
            type="number"
            min={0}
            max={100}
            value={input.minConfidence}
            onChange={(event) => onChange({ minConfidence: Number(event.currentTarget.value) })}
            style={inputStyle()}
          />
        </FieldLabel>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 12, alignItems: "end" }}>
        <FieldLabel label="Sector">
          <select value={input.sector} onChange={(event) => onChange({ sector: event.currentTarget.value as Sector | "all" })} style={inputStyle()}>
            {SECTOR_OPTIONS.map((sector) => (
              <option key={sector} value={sector}>
                {sector === "all" ? "All sectors" : SECTOR_LABEL[sector]}
              </option>
            ))}
          </select>
        </FieldLabel>
        <FieldLabel label="Status">
          <select value={input.status} onChange={(event) => onChange({ status: event.currentTarget.value as IpoStatus | "all" })} style={inputStyle()}>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === "all" ? "All status" : STATUS_CONFIG[status].label}
              </option>
            ))}
          </select>
        </FieldLabel>
        <button
          onClick={() => onChange({ requireCornerstone: !input.requireCornerstone })}
          style={{
            height: 36,
            padding: "0 12px",
            borderRadius: "var(--radius-md)",
            border: `1px solid ${input.requireCornerstone ? "var(--honey-500)" : "var(--border-default)"}`,
            background: input.requireCornerstone ? "var(--honey-50)" : "var(--surface-card)",
            color: "var(--text-primary)",
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Cornerstone
        </button>
      </div>
    </div>
  );
}

function ScreeningResults({ input }: { input: Required<ScreeningInput> }) {
  const env = screenIpos(input);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {env.data.conditions.map((condition) => (
          <Badge key={condition.label} tone="info" size="sm">
            {condition.label}
          </Badge>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Icon name="list-checks" size={18} color="var(--green-600)" />
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--text-primary)" }}>
              Hits ({env.data.hits.length})
            </h3>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {env.data.hits.map((hit) => (
              <div key={hit.ipo.id} style={{ padding: 12, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <strong style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>{hit.rank}. {hit.ipo.name}</strong>
                  <MetricCell value={formatScore(hit.ipo.score)} />
                </div>
                <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--text-body)", fontSize: "var(--text-xs)", lineHeight: 1.55 }}>
                  {hit.why.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Icon name="alert-circle" size={18} color="var(--red-500)" />
            <h3 style={{ margin: 0, fontSize: "var(--text-base)", color: "var(--text-primary)" }}>
              Rejected ({env.data.rejected.length})
            </h3>
          </div>
          <div style={{ display: "grid", gap: 10 }}>
            {env.data.rejected.map((row) => (
              <div key={row.ipo.id} style={{ padding: 12, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", background: "var(--surface-muted)" }}>
                <strong style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>{row.ipo.name}</strong>
                <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: "var(--text-body)", fontSize: "var(--text-xs)", lineHeight: 1.55 }}>
                  {row.rejected_reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalysisWorkbench() {
  const navigate = useNavigate();
  const ipos = getIpos().data;
  const [selectedIds, setSelectedIds] = useState(DEFAULT_COMPARE_IDS);
  const [screeningInput, setScreeningInput] = useState<Required<ScreeningInput>>(
    normalizeScreeningInput({ minScore: 60, minSubscription: 20, minConfidence: 70, status: "pending", requireCornerstone: true }),
  );
  const selectedCountValid = selectedIds.length >= 2 && selectedIds.length <= 5;
  const screening = useMemo(() => screenIpos(screeningInput).data, [screeningInput]);

  const toggleIpo = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 5) return current;
      return [...current, id];
    });
  };

  const updateScreening = (patch: ScreeningInput) => {
    setScreeningInput((current) => normalizeScreeningInput({ ...current, ...patch }));
  };

  return (
    <main style={{ ...SHELL, padding: "36px 24px 80px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 24 }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon name="columns-3" size={22} color="var(--honey-600)" />
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--honey-700)", textTransform: "uppercase" }}>
              Comparator and screener
            </span>
          </div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-4xl)", color: "var(--ink-800)" }}>
            IPO Analysis Workbench
          </h1>
          <p style={{ maxWidth: 720, margin: "8px 0 0", color: "var(--text-body)", lineHeight: 1.6 }}>
            比较 2-5 个港股 IPO，并用可编辑结构化条件预览筛选命中、why explanations 与 rejected reasons（示例数据）。
          </p>
        </div>
        <Button variant="outline" icon={<Icon name="arrow-left" size={16} />} onClick={() => navigate({ to: "/ipos" })}>
          Browse IPOs
        </Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 20, alignItems: "start" }}>
        <Card>
          <CardHeader>
            <CardTitle>Compare set</CardTitle>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
              {selectedIds.length} selected · contract requires 2-5
            </p>
          </CardHeader>
          <CardContent>
            <IpoPicker ipos={ipos} selectedIds={selectedIds} onToggle={toggleIpo} />
          </CardContent>
        </Card>

        <div style={{ display: "grid", gap: 20 }}>
          <Card>
            <CardHeader>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                <div>
                  <CardTitle>Comparison matrix</CardTitle>
                  <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                    Score, demand, confidence, institution rating, cornerstone concentration.
                  </p>
                </div>
                <Badge tone={selectedCountValid ? "bullish" : "warning"} size="sm">
                  {selectedCountValid ? "Ready" : "Need 2-5"}
                </Badge>
              </div>
            </CardHeader>
            <ComparisonTable selectedIds={selectedIds} />
          </Card>

          <Card>
            <CardHeader>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
                <div>
                  <CardTitle>Screening condition editor</CardTitle>
                  <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                    Editable structured conditions, fail-closed missing value rule, live execution still requires confirmation.
                  </p>
                </div>
                <Icon name="sliders-horizontal" size={22} color="var(--ink-700)" />
              </div>
            </CardHeader>
            <CardContent>
              <ScreeningEditor input={screeningInput} onChange={updateScreening} />
              <div style={{ marginTop: 16, padding: "10px 12px", borderRadius: "var(--radius-md)", background: "var(--surface-muted)", color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>
                Preview only · {screening.confirmation_required_before_live_execution ? "confirmation required before live execution" : "live execution disabled"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Screening results</CardTitle>
            </CardHeader>
            <CardContent>
              <ScreeningResults input={screeningInput} />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
