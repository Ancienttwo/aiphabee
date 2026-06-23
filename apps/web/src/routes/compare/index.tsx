import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type CSSProperties } from "react";
import { Badge, Button, Card, Icon } from "../../ds";
import { compareSecurities, presentError, type CompareResult, type CompareRow } from "../../lib/api";
import { fmtNum } from "../../lib/num";
import { SHELL } from "../../lib/ui";

export const Route = createFileRoute("/compare/")({
  component: Compare,
});

const METRICS = [
  { key: "revenue", label: "营收" },
  { key: "net_income", label: "净利润" },
  { key: "assets", label: "总资产" },
  { key: "equity", label: "股东权益" },
] as const;

function rowName(r: CompareRow): string {
  return r.symbol ?? r.input;
}

function Compare() {
  const [draft, setDraft] = useState("");
  const [securities, setSecurities] = useState<string[]>([]);
  const [result, setResult] = useState<CompareResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const seq = useRef(0);

  const add = (text: string) => {
    const v = text.trim();
    if (!v || securities.length >= 5 || securities.includes(v)) return;
    setSecurities((s) => [...s, v]);
    setDraft("");
  };
  const remove = (i: number) => setSecurities((s) => s.filter((_, j) => j !== i));

  const run = async () => {
    if (securities.length < 2) return;
    const mySeq = ++seq.current;
    setLoading(true);
    setError(null);
    const env = await compareSecurities(securities);
    if (mySeq !== seq.current) return;
    setLoading(false);
    if (!env.ok) {
      setError(presentError(env).detail);
      setResult(null);
      return;
    }
    setResult(env.data);
  };

  return (
    <main style={{ ...SHELL, paddingTop: 40, paddingBottom: 72 }}>
      <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--ink-800)" }}>
        比较器
      </h1>
      <p style={{ margin: "8px 0 20px", fontSize: "var(--text-base)", color: "var(--text-muted)" }}>
        2–5 只证券统一口径比较；货币与单位自动统一，或明确标注不可比项。
      </p>

      <form onSubmit={(e) => { e.preventDefault(); add(draft); }} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="添加证券（如 腾讯 / 00700.HK），最多 5 只"
          aria-label="添加证券"
          style={{ flex: 1, height: 44, padding: "0 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--surface-card)", fontFamily: "var(--font-sans)", fontSize: "var(--text-base)", color: "var(--text-primary)" }}
        />
        <Button type="submit" variant="outline" icon={<Icon name="arrow-right" size={16} />} disabled={securities.length >= 5}>添加</Button>
      </form>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 24 }}>
        {securities.map((s, i) => (
          <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: "var(--radius-pill)", background: "var(--honey-50)", border: "1px solid var(--honey-200)", fontSize: "var(--text-sm)", color: "var(--ink-800)" }}>
            {s}
            <button type="button" aria-label={`移除 ${s}`} onClick={() => remove(i)} style={{ display: "inline-flex", border: "none", background: "none", cursor: "pointer", color: "var(--text-muted)", padding: 0 }}>
              <Icon name="x" size={13} />
            </button>
          </span>
        ))}
        {securities.length >= 2 ? (
          <Button size="sm" onClick={run} icon={<Icon name="layers" size={15} />}>比较 {securities.length} 只</Button>
        ) : (
          <span style={{ fontSize: "var(--text-xs)", color: "var(--text-subtle)" }}>至少添加 2 只证券</span>
        )}
      </div>

      {loading ? <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>正在统一口径比较…</p> : null}
      {error ? <Card padded><p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--red-600)" }}>{error}</p></Card> : null}

      {result ? (
        <Card padded>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "var(--font-sans)" }}>
              <thead>
                <tr>
                  <th style={th()}>证券</th>
                  {METRICS.map((m) => <th key={m.key} style={th(true)}>{m.label}</th>)}
                  <th style={th(true)}>最新价</th>
                  <th style={th()}>状态</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r) => (
                  <tr key={r.input}>
                    <td style={td()}>
                      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-primary)" }}>{rowName(r)}</span>
                      {r.status === "blocked_resolution" && r.candidates?.length ? (
                        <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>歧义：{r.candidates.slice(0, 3).map((c) => c.symbol).join(" / ")}</div>
                      ) : null}
                    </td>
                    {METRICS.map((m) => (
                      <td key={m.key} style={td(true)}>{fmtNum(r.financials[m.key], 0)}</td>
                    ))}
                    <td style={td(true)}>{fmtNum(r.quote?.last_price)}</td>
                    <td style={td()}>
                      <Badge tone={r.status === "comparable" ? "bullish" : r.status === "blocked_resolution" ? "warning" : "neutral"} variant="soft" size="sm">
                        {r.status === "comparable" ? "可比" : r.status === "blocked_resolution" ? "需澄清" : "不可比"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.unified_comparison.incomparable_reasons.length > 0 ? (
            <p style={{ margin: "12px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
              不可比原因：{result.unified_comparison.incomparable_reasons.slice(0, 5).join("，")}
            </p>
          ) : null}
          <p style={{ margin: "8px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
            基准币种 {result.unified_comparison.base_currency ?? "—"} · 汇率换算 {result.unified_comparison.currency_conversion === "not_required" ? "无需" : "缺汇率"}
          </p>
        </Card>
      ) : null}
    </main>
  );
}

function th(num = false): CSSProperties {
  return {
    textAlign: num ? "right" : "left",
    padding: "8px 12px",
    fontSize: "var(--text-2xs)",
    fontWeight: 700,
    color: "var(--text-muted)",
    borderBottom: "1px solid var(--border-subtle)",
    whiteSpace: "nowrap",
  };
}
function td(num = false): CSSProperties {
  return {
    textAlign: num ? "right" : "left",
    padding: "10px 12px",
    fontSize: "var(--text-sm)",
    fontFamily: num ? "var(--font-mono)" : "var(--font-sans)",
    color: "var(--text-body)",
    borderBottom: "1px solid var(--border-subtle)",
    whiteSpace: "nowrap",
  };
}
