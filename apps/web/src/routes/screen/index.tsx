import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Icon } from "../../ds";
import { CostConfirmGate } from "../../components/evidence";
import { presentError, screenSecurities, type ScreenResult } from "../../lib/api";
import { fmtNum } from "../../lib/num";
import { SHELL } from "../../lib/ui";
import { formatHkSymbol } from "../../lib/format";
import { useLocale, type MessageKey } from "../../i18n/locale";

export const Route = createFileRoute("/screen/")({
  component: Screen,
});

const FIELD_LABEL: Record<string, MessageKey> = {
  revenue: "fieldRevenue",
  net_income: "fieldNetIncome",
  assets: "fieldAssets",
  equity: "fieldEquity",
  last_price: "fieldLastPrice",
};
const OP_SYMBOL: Record<string, string> = { gte: "≥", lte: "≤", eq: "=" };

const EXAMPLES = [
  "screenerPlaceholder",
  "revenue >= 100000000",
  "profitable",
] as const;

function Screen() {
  const { t } = useLocale();
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
        {t("screenerTitle")}
      </h1>
      <p style={{ margin: "8px 0 20px", fontSize: "var(--text-base)", color: "var(--text-muted)" }}>
        {t("screenerDescription")}
      </p>

      <form onSubmit={(e) => { e.preventDefault(); run(query); }} style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("screenerPlaceholder")}
          aria-label={t("screeningCriteria")}
          style={{ flex: 1, height: 48, padding: "0 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-default)", background: "var(--surface-card)", fontFamily: "var(--font-sans)", fontSize: "var(--text-base)", color: "var(--text-primary)" }}
        />
        <Button type="submit" size="lg" icon={<Icon name="sliders" size={18} />}>{t("generateScreen")}</Button>
      </form>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        {EXAMPLES.map((example) => {
          const value = example === "screenerPlaceholder" ? t(example) : example;
          return (
            <button key={example} type="button" onClick={() => { setQuery(value); run(value); }} style={{ padding: "5px 11px", borderRadius: "var(--radius-pill)", border: "1px solid var(--border-subtle)", background: "var(--surface-card)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>
              {value}
            </button>
          );
        })}
      </div>

      {loading ? <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{t("parsingScreen")}</p> : null}
      {error ? <Card padded><p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--red-600)" }}>{error}</p></Card> : null}

      {result ? (
        <div style={{ display: "grid", gap: 20 }}>
          <Card>
            <CardHeader>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <CardTitle>{t("parsedConditions")}</CardTitle>
                <Badge tone={result.status === "planned_with_preview" ? "bullish" : "warning"} variant="soft" size="sm" dot>
                  {result.status === "planned_with_preview" ? t("previewGenerated") : result.status === "unsupported_query" ? t("unableToParse") : result.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {result.parsed_conditions.length > 0 ? (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {result.parsed_conditions.map((c, i) => (
                    <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)", fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                      {FIELD_LABEL[c.field] ? t(FIELD_LABEL[c.field]) : c.field} {OP_SYMBOL[c.operator] ?? c.operator} {fmtNum(c.value, 0)}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{t("noParsedConditions")}</p>
              )}
              <p style={{ margin: "10px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>{t("missingValueRule")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("previewHits")}（{result.execution_preview.hit_count} / {result.execution_preview.universe_size}）</CardTitle></CardHeader>
            <CardContent>
              {result.execution_preview.hits.length > 0 ? (
                <div style={{ display: "grid", gap: 8 }}>
                  {result.execution_preview.hits.map((h) => (
                    <div key={h.rank} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", borderRadius: "var(--radius-md)", background: "var(--surface-sunken)", border: "1px solid var(--border-subtle)" }}>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", color: "var(--text-subtle)", width: 24 }}>#{h.rank}</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)", minWidth: 92 }}>{h.symbol ? formatHkSymbol(h.symbol) : h.instrument_id}</span>
                      <span style={{ flex: 1, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{h.score} {t("matchedItems")} · {h.why.join(" · ")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>{t("noScreenHits")}</p>
              )}
              {result.execution_preview.rejected_count > 0 ? (
                <p style={{ margin: "12px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
                  {result.execution_preview.rejected_count} {t("unmatchedItems")} {result.execution_preview.rejected_rows.slice(0, 3).map((r) => `${r.symbol ? formatHkSymbol(r.symbol) : r.input} (${r.reasons[0]})`).join(", ")}
                </p>
              ) : null}
              {result.requires_confirmation_before_live_execution ? (
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
                  <Button variant="primary" onClick={() => setCostOpen(true)}>{t("confirmExecuteScreen")}</Button>
                  {queued ? <span style={{ fontSize: "var(--text-sm)", color: "var(--green-600)" }}>{t("liveScreenQueued")}</span> : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}

      <CostConfirmGate
        open={costOpen}
        estimatedCredits={Math.max(5, result?.usage.credits ?? 5)}
        dataRange={t("screenDataRange")}
        outputDescription={t("screenOutput")}
        onConfirm={() => { setCostOpen(false); setQueued(true); }}
        onCancel={() => setCostOpen(false)}
      />
    </main>
  );
}
