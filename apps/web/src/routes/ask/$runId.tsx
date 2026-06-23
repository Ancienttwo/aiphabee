import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
  MascotState,
} from "../../ds";
import {
  AnswerLayerTag,
  CostConfirmGate,
  EvidenceCard,
  EvidenceStrength,
  ToolProgressStream,
} from "../../components/evidence";
import { Disclaimer } from "../../components/Disclaimer";
import { EvidenceContractCard, ResearchPlanCard } from "../../components/research/PlanView";
import { planAgentRun } from "../../lib/api";
import { useAgentStream } from "../../lib/useAgentStream";
import { MASCOT_BP, SHELL } from "../../lib/ui";

export const Route = createFileRoute("/ask/$runId")({
  validateSearch: (search: Record<string, unknown>): { q: string } => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: AskRun,
});

function AskRun() {
  const navigate = useNavigate();
  const { runId } = Route.useParams();
  const { q } = Route.useSearch();
  const { events, status } = useAgentStream(q || undefined);
  const { data: planEnv } = useQuery({
    queryKey: ["agent-plan", q],
    queryFn: () => planAgentRun(q),
    enabled: Boolean(q),
  });
  const plan = planEnv?.ok ? planEnv.data : undefined;
  // Client-only timestamp: avoids any SSR/hydration time skew for the synthetic
  // evidence preview (the value only surfaces when the card is expanded).
  const [asOf, setAsOf] = useState("");
  useEffect(() => {
    setAsOf(new Date().toISOString());
  }, []);
  const [costOpen, setCostOpen] = useState(false);
  const [deepQueued, setDeepQueued] = useState(false);

  if (!q) {
    return (
      <main style={{ ...SHELL, paddingTop: 48, paddingBottom: 80 }}>
        <MascotState
          basePath={MASCOT_BP}
          pose="empty"
          title="还没有研究问题"
          description="回到研究对话，输入一个问题开始。"
        >
          <Button variant="outline" onClick={() => navigate({ to: "/ask" })}>
            去提问
          </Button>
        </MascotState>
      </main>
    );
  }

  return (
    <main style={{ ...SHELL, paddingTop: 24, paddingBottom: 72 }}>
      <button
        type="button"
        onClick={() => navigate({ to: "/ask" })}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          fontSize: "var(--text-sm)",
          fontFamily: "var(--font-sans)",
          marginBottom: 14,
        }}
      >
        <Icon name="arrow-left" size={16} /> 返回研究对话
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-2xl)",
            fontWeight: 700,
            color: "var(--ink-800)",
          }}
        >
          {q}
        </h1>
        <Badge tone={status === "error" ? "bearish" : "ai"} variant="soft" dot>
          {status === "streaming"
            ? "研究中"
            : status === "done"
              ? "已完成"
              : status === "error"
                ? "后端未连接"
                : "准备中"}
        </Badge>
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-2xs)",
          color: "var(--text-subtle)",
          marginBottom: 22,
        }}
      >
        run {runId}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {plan ? <ResearchPlanCard plan={plan} /> : null}
          <Card>
            <CardHeader>
              <CardTitle>研究进度</CardTitle>
            </CardHeader>
            <CardContent>
              {status === "error" ? (
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--red-600)" }}>
                  无法连接后端 Agent。请在仓库根运行 <code>npm run dev:worker</code> 后重试。
                </p>
              ) : (
                <ToolProgressStream events={events} streaming={status === "streaming"} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>分层作答</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                style={{
                  margin: "0 0 14px",
                  fontSize: "var(--text-sm)",
                  color: "var(--text-muted)",
                }}
              >
                合成预览：以下展示「分层标签 + 证据卡片」的呈现方式。模型作答尚未接入（Gate 0
                前为合成数据）。
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                <AnswerLine layer="fact">近三个交易日的收盘价序列来自行情工具。</AnswerLine>
                <AnswerLine layer="calculation">区间累计涨跌幅为确定性计算结果。</AnswerLine>
                <AnswerLine layer="inference">与同业对照后的归因属于推断，非因果断言。</AnswerLine>
                <AnswerLine layer="unknown">具体资金流向在当前数据范围内无法判断。</AnswerLine>
              </div>
              <div style={{ marginTop: 14 }}>
                <EvidenceCard
                  asOf={asOf}
                  dataVersion={`ask-run-${runId.slice(0, 8)}`}
                  methodologyVersion="synthetic-preview-v0"
                  provenance={[
                    {
                      source: "agent-progress-stream",
                      source_record_id: runId,
                      data_version: "synthetic-preview-v0",
                      methodology_version: "synthetic-preview-v0",
                    },
                  ]}
                  usage={{ cached: false, credits: 0, rows: events.length }}
                  warnings={["合成数据，非真实港股行情。"]}
                />
              </div>
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <Button
                  variant="ai"
                  icon={<Icon name="sparkles" size={16} />}
                  onClick={() => setCostOpen(true)}
                >
                  深度研究
                </Button>
                {deepQueued ? (
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--green-600)" }}>
                    已确认成本，深度研究将在 Workflow 接入后执行。
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {plan ? (
            <EvidenceContractCard plan={plan} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>证据强度</CardTitle>
              </CardHeader>
              <CardContent>
                <EvidenceStrength strength="indeterminate" />
                <p style={{ margin: "12px 0 0", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                  合成模式下不评估证据强度。接入 live 数据后，将按来源与一致性给出 强 / 中 / 弱
                  judgement，而非伪造的可信度百分比。
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Disclaimer style={{ marginTop: 24 }} />

      <CostConfirmGate
        open={costOpen}
        estimatedCredits={120}
        dataRange="近 5 年"
        outputDescription="多步深度报告 + 完整证据索引"
        onConfirm={() => {
          setCostOpen(false);
          setDeepQueued(true);
        }}
        onCancel={() => setCostOpen(false)}
      />
    </main>
  );
}

function AnswerLine({
  layer,
  children,
}: {
  layer: "fact" | "calculation" | "inference" | "unknown";
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <AnswerLayerTag layer={layer} />
      <span style={{ fontSize: "var(--text-sm)", lineHeight: 1.6, color: "var(--text-body)" }}>
        {children}
      </span>
    </div>
  );
}
