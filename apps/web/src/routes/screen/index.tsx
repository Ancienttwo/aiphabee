import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Icon } from "../../ds";
import { CostConfirmGate } from "../../components/evidence";
import { presentError, screenSecurities, type ScreenResult } from "../../lib/api";
import { fmtNum } from "../../lib/num";
import { SHELL } from "../../lib/ui";

export const Route = createFileRoute("/screen/")({
  component: Screen,
});

const FIELD_LABEL: Record<string, string> = {
  revenue: "营业收入",
  net_income: "净利润",
  assets: "总资产",
  equity: "股东权益",
  last_price: "最新价",
};
const OP_SYMBOL: Record<string, string> = { gte: "≥", lte: "≤", eq: "=" };

const EXAMPLES = [
  "营收高于 1000 亿且净利润为正",
  "revenue >= 100000000",
  "profitable",
] as const;

function Screen() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ScreenResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [costOpen, setCostOpen] = useState(false);
  const [queued, setQueued] = useState(false);
  const seq = useRef(0);

  const run = async (text: string) => {
    const q = text.trim();
    if (!q) return;
    const mySeq = ++seq.current;
    setLoading(true);
    setError(null);
    setQueued(false);
    const env = await screenSecurities(q);
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
      <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-3xl)", fontWeight: 700, color: "var(--text-primary)" }}>
        筛选器
      </h1>
      <p style={{ margin: "8px 0 20px", fontSize: "var(--text-base)", color: "var(--text-muted)" }}>
        用自然语言描述条件，转成可编辑的结构化筛选；执行前预览命中与理由，且不能用未来数据筛历史时点。
      </p>

      <form onSubmit={(e) => { e.preventDefault(); run(query); }} style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="例如：营收高于 1000 亿且净利润为正"
          aria-label="筛选条件"
          style={{ flex: 1, height: 48, padding: "0 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--surface-card)", fontFamily: "var(--font-sans)", fontSize: "var(--text-base)", color: "var(--text-primary)" }}
        />
        <Button type="submit" size="lg" icon={<Icon name="sliders" size={18} />}>生成筛选</Button>
      </form>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" onClick={() => { setQuery(ex); run(ex); }} style={{ padding: "5px 11px", borderRadius: "var(--radius-pill)", border: "1px solid var(--border-subtle)", background: "var(--surface-card)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>
            {ex}
          </button>
        ))}
      </div>

      {loading ? <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>正在解析筛选条件…</p> : null}
      {error ? <Card padded><p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--red-600)" }}>{error}</p></Card> : null}

      {result ? (
        <div style={{ display: "grid", gap: 20 }}>
          <Card>
            <CardHeader>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <CardTitle>解析后的条件（可编辑）</CardTitle>
                <Badge tone={result.status === "planned_with_preview" ? "bullish" : "warning"} variant="soft" size="sm" dot>
                  {result.status === "planned_with_preview" ? "已生成预览" : result.status === "unsupported_query" ? "无法解析" : result.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {result.parsed_conditions.length > 0 ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {result.parsed_conditions.map((c, i) => (
                    <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                      {FIELD_LABEL[c.field] ?? c.field} {OP_SYMBOL[c.operator] ?? c.operator} {fmtNum(c.value, 0)}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>未能从该描述解析出条件，请换种说法（如 “revenue &gt;= 100000000”）。</p>
              )}
              <p style={{ margin: "10px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>缺失值规则：排除 · 时间口径：截至 as_of 的最新可得值</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>预览命中（{result.execution_preview.hit_count} / {result.execution_preview.universe_size}）</CardTitle></CardHeader>
            <CardContent>
              {result.execution_preview.hits.length > 0 ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {result.execution_preview.hits.map((h) => (
                    <div key={h.rank} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--text-subtle)", width: 24 }}>#{h.rank}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)", minWidth: 92 }}>{h.symbol ?? h.instrument_id}</span>
                      <span style={{ flex: 1, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>命中 {h.score} 项 · {h.why.join("、")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>当前条件下没有命中。</p>
              )}
              {result.execution_preview.rejected_count > 0 ? (
                <p style={{ margin: "12px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
                  未命中 {result.execution_preview.rejected_count} 项，例如：{result.execution_preview.rejected_rows.slice(0, 3).map((r) => `${r.symbol ?? r.input}（${r.reasons[0]}）`).join("，")}
                </p>
              ) : null}
              {result.requires_confirmation_before_live_execution ? (
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
                  <Button variant="primary" onClick={() => setCostOpen(true)}>确认并执行筛选</Button>
                  {queued ? <span style={{ fontSize: "var(--text-sm)", color: "var(--green-600)" }}>已确认，live 执行将在数据接入后可用。</span> : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <CostConfirmGate
        open={costOpen}
        estimatedCredits={Math.max(5, result?.usage.credits ?? 5)}
        dataRange="截至 as_of 的最新财务"
        outputDescription="按条件执行全市场筛选"
        onConfirm={() => { setCostOpen(false); setQueued(true); }}
        onCancel={() => setCostOpen(false)}
      />
    </main>
  );
}
