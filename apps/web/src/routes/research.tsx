import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Icon } from "../ds";
import {
  getResearchLibrarySnapshot,
  normalizeResearchLibraryInput,
  type ResearchLibraryInput,
} from "../lib/mock-api";
import { SHELL } from "../lib/ui";

export const Route = createFileRoute("/research")({
  component: ResearchLibrary,
});

const CATEGORY_OPTIONS: Array<Required<ResearchLibraryInput>["category"]> = [
  "all",
  "results",
  "dividend",
  "buyback",
];
const LANGUAGE_OPTIONS: Array<Required<ResearchLibraryInput>["language"]> = ["all", "en", "zh-Hant"];

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

function MonoValue({ children }: { children: ReactNode }) {
  return (
    <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
      {children}
    </span>
  );
}

function ResearchLibrary() {
  const navigate = useNavigate();
  const [input, setInput] = useState<Required<ResearchLibraryInput>>(
    normalizeResearchLibraryInput({ keyword: "results", category: "all", language: "all" }),
  );
  const snapshot = useMemo(() => getResearchLibrarySnapshot(input).data, [input]);
  const updateInput = (patch: ResearchLibraryInput) => {
    setInput((current) => normalizeResearchLibraryInput({ ...current, ...patch }));
  };

  return (
    <main className="research-library-ui" style={{ ...SHELL, padding: "36px 24px 80px" }}>
      <style>
        {`
          .research-library-ui,
          .research-library-ui * {
            box-sizing: border-box;
          }

          .research-library-ui p,
          .research-library-ui span,
          .research-library-ui strong,
          .research-library-ui td {
            overflow-wrap: anywhere;
          }

          .research-layout {
            display: grid;
            grid-template-columns: minmax(0, 320px) minmax(0, 1fr);
            gap: 20px;
            align-items: start;
            min-width: 0;
          }

          .research-content-stack,
          .research-two-column,
          .research-replay-grid {
            min-width: 0;
          }

          .research-two-column {
            display: grid;
            grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
            gap: 20px;
            align-items: start;
          }

          .research-replay-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
            gap: 14px;
          }

          @media (max-width: 760px) {
            .research-library-ui {
              max-width: 100vw !important;
              overflow-x: hidden;
              padding-left: 0 !important;
              padding-right: 0 !important;
              width: calc(100vw - 32px) !important;
            }

            .research-layout,
            .research-two-column {
              grid-template-columns: minmax(0, 1fr);
            }

            .research-library-ui table {
              min-width: 0 !important;
            }

            .research-library-ui th,
            .research-library-ui td {
              padding-left: 12px !important;
              padding-right: 12px !important;
            }

            .research-library-ui th:nth-child(3),
            .research-library-ui th:nth-child(4),
            .research-library-ui td:nth-child(3),
            .research-library-ui td:nth-child(4) {
              display: none;
            }

            .research-library-ui th:nth-child(1),
            .research-library-ui td:nth-child(1) {
              width: 72%;
            }

            .research-library-ui th:nth-child(2),
            .research-library-ui td:nth-child(2) {
              width: 28%;
            }
          }
        `}
      </style>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon name="search" size={22} color="var(--honey-600)" />
            <span style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--honey-700)", textTransform: "uppercase" }}>
              Announcement research library
            </span>
          </div>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: "var(--text-4xl)", color: "var(--ink-800)" }}>
            Research Library
          </h1>
          <p style={{ maxWidth: 760, margin: "8px 0 0", color: "var(--text-body)", lineHeight: 1.6 }}>
            检索公告、查看 bounded excerpts、比较跨期数字，并保存 immutable research run snapshot（示例数据）。
          </p>
        </div>
        <Button variant="outline" icon={<Icon name="arrow-left" size={16} />} onClick={() => navigate({ to: "/dashboard" })}>
          Dashboard
        </Button>
      </div>

      <div className="research-layout">
        <Card>
          <CardHeader>
            <CardTitle>Library filters</CardTitle>
            <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
              Synthetic announcement search with evidence locators.
            </p>
          </CardHeader>
          <CardContent>
            <div style={{ display: "grid", gap: 14 }}>
              <FieldLabel label="Keyword">
                <input
                  value={input.keyword}
                  onChange={(event) => updateInput({ keyword: event.currentTarget.value })}
                  style={inputStyle()}
                />
              </FieldLabel>
              <FieldLabel label="Category">
                <select value={input.category} onChange={(event) => updateInput({ category: event.currentTarget.value as Required<ResearchLibraryInput>["category"] })} style={inputStyle()}>
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category} value={category}>
                      {category === "all" ? "All categories" : category}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <FieldLabel label="Language">
                <select value={input.language} onChange={(event) => updateInput({ language: event.currentTarget.value as Required<ResearchLibraryInput>["language"] })} style={inputStyle()}>
                  {LANGUAGE_OPTIONS.map((language) => (
                    <option key={language} value={language}>
                      {language === "all" ? "All languages" : language}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <div style={{ padding: 12, borderRadius: "var(--radius-md)", background: "var(--surface-muted)", color: "var(--text-muted)", fontSize: "var(--text-xs)", lineHeight: 1.55 }}>
                No live DB/R2 writes · original document fetch disabled · raw document instructions ignored.
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="research-content-stack" style={{ display: "grid", gap: 20 }}>
          <Card>
            <CardHeader>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
                <div>
                  <CardTitle>Announcement search</CardTitle>
                  <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                    {snapshot.search.row_count} rows · {snapshot.search.search_engine} · {snapshot.search.filters.from} to {snapshot.search.filters.to}
                  </p>
                </div>
                <Badge tone="info" size="sm">{snapshot.search.status}</Badge>
              </div>
            </CardHeader>
            <CardContent style={{ padding: 0 }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
                  <thead>
                    <tr>
                      {["Document", "Published", "Category", "Locator"].map((heading) => (
                        <th key={heading} style={{ textAlign: "left", padding: "0 16px 10px 24px", color: "var(--text-muted)", fontSize: "var(--text-xs)" }}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.search.results.map((result) => (
                      <tr key={result.announcement_id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                        <td style={{ padding: "14px 16px 14px 24px" }}>
                          <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)" }}>{result.title}</div>
                          <MonoValue>{result.symbol} · {result.document_id}</MonoValue>
                        </td>
                        <td style={{ padding: "14px 16px" }}><MonoValue>{result.published_at.slice(0, 10)}</MonoValue></td>
                        <td style={{ padding: "14px 16px" }}><Badge tone="neutral" size="sm">{result.category}</Badge></td>
                        <td style={{ padding: "14px 16px" }}>
                          <MonoValue>p{result.evidence_locator.page} · {result.evidence_locator.anchor}</MonoValue>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="research-two-column">
            <Card>
              <CardHeader>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
                  <div>
                    <CardTitle>Bounded excerpts</CardTitle>
                    <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                      Full document return disabled; excerpt scope is capped and sanitized.
                    </p>
                  </div>
                  <Badge tone="bullish" size="sm">{snapshot.detail.sanitization_summary.removed_item_count} removed</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div style={{ display: "grid", gap: 12 }}>
                  {snapshot.detail.excerpts.map((excerpt) => (
                    <div key={excerpt.section_id} style={{ padding: 14, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                        <strong style={{ color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>{excerpt.section_title}</strong>
                        <MonoValue>p{excerpt.evidence_locator.page} ¶{excerpt.evidence_locator.paragraph}</MonoValue>
                      </div>
                      <p style={{ margin: 0, color: "var(--text-body)", fontSize: "var(--text-sm)", lineHeight: 1.65 }}>
                        {excerpt.excerpt}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cross-period numeric diff</CardTitle>
                <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                  Schema-bound values from annual result excerpts.
                </p>
              </CardHeader>
              <CardContent>
                <div style={{ display: "grid", gap: 12 }}>
                  {snapshot.diff.diffs.map((diff) => (
                    <div key={diff.field_id} style={{ padding: 14, borderRadius: "var(--radius-md)", background: "var(--surface-muted)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                        <strong style={{ color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>{diff.label}</strong>
                        <Badge tone={diff.direction === "increase" ? "bullish" : "neutral"} size="sm">{diff.direction}</Badge>
                      </div>
                      <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: "var(--text-lg)", fontWeight: 800, color: "var(--ink-800)" }}>
                        {diff.base_value.toFixed(1)} → {diff.comparison_value.toFixed(1)} {diff.unit}
                      </div>
                      <MonoValue>{(diff.percent_change * 100).toFixed(1)}% · {diff.base_period} / {diff.comparison_period}</MonoValue>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 14 }}>
                <div>
                  <CardTitle>Saved run and replay diff</CardTitle>
                  <p style={{ margin: "4px 0 0", color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>
                    Immutable old report, no-write persistence plan, replay execution planned only.
                  </p>
                </div>
                <Icon name="shield" size={22} color="var(--green-600)" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="research-replay-grid">
                <div style={{ padding: 14, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--text-muted)", marginBottom: 6 }}>Snapshot</div>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)", overflowWrap: "anywhere" }}>{snapshot.savedRun.snapshot_id}</div>
                  <MonoValue>{snapshot.savedRun.persistence_plan.write_status}</MonoValue>
                </div>
                <div style={{ padding: 14, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--text-muted)", marginBottom: 6 }}>Replay categories</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {snapshot.replay.diff_summary.categories.map((category) => (
                      <Badge key={category} tone="info" size="sm">{category}</Badge>
                    ))}
                  </div>
                  <MonoValue>{snapshot.replay.replay_execution.execution_status}</MonoValue>
                </div>
                <div style={{ padding: 14, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--text-muted)", marginBottom: 6 }}>Old report policy</div>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)" }}>
                    Silent rewrite blocked
                  </div>
                  <MonoValue>preserves {snapshot.replay.old_report.preserved_snapshot_id.slice(0, 28)}…</MonoValue>
                </div>
                <div style={{ padding: 14, border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "var(--text-xs)", fontWeight: 800, color: "var(--text-muted)", marginBottom: 6 }}>Share guard</div>
                  <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)" }}>
                    Private share entrypoints guarded
                  </div>
                  <MonoValue>public export disabled in mock surface</MonoValue>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
