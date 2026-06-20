import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Badge,
  BeeNote,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Icon,
  MascotState,
  RatingStars,
  ScoreMeter,
  type BeeNotePose,
  type ScoreMeterTone,
} from "../../ds";
import { Radar } from "../../components/Radar";
import { Disclaimer } from "../../components/Disclaimer";
import { getIpo } from "../../lib/mock-api";
import {
  SECTOR_LABEL,
  SENTIMENT_LABEL,
  SENTIMENT_TONE,
  SIGNAL_CONFIG,
  STATUS_CONFIG,
  type IpoRecord,
} from "../../data/ipos";
import { demandColor, formatHKD, formatListingDate, formatMultiple } from "../../lib/format";
import { MASCOT_BP, SHELL } from "../../lib/ui";

export const Route = createFileRoute("/ipos/$ipoId")({
  component: IpoDetail,
});

function KV({ label, value, tone }: { label: ReactNode; value: ReactNode; tone?: string }) {
  return (
    <div
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)", marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-lg)", fontWeight: 700, color: tone || "var(--text-primary)" }}>
        {value}
      </div>
    </div>
  );
}

function scoreTone(ipo: IpoRecord): ScoreMeterTone {
  if (ipo.sentiment === "bullish") return "bullish";
  if (ipo.sentiment === "bearish") return "bearish";
  if (ipo.sentiment === "cautious") return "cautious";
  return "neutral";
}

function insightPose(signal: IpoRecord["signal"]): BeeNotePose {
  if (signal === "negative" || signal === "strong_negative") return "risk";
  if (signal === "strong_positive") return "success";
  return "insight";
}

function IpoDetail() {
  const navigate = useNavigate();
  const { ipoId } = Route.useParams();
  const result = getIpo(ipoId);

  if (!result.ok) {
    return (
      <main style={{ ...SHELL, padding: "48px 24px 96px" }}>
        <div
          style={{
            background: "var(--surface-card)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-lg)",
          }}
        >
          <MascotState
            basePath={MASCOT_BP}
            pose="empty"
            title="未找到该标的 · IPO not found"
            description={`没有 id 为 “${ipoId}” 的 IPO。返回列表继续探索其他标的。`}
          >
            <Button variant="outline" onClick={() => navigate({ to: "/ipos" })}>
              Back to listings
            </Button>
          </MascotState>
        </div>
      </main>
    );
  }

  const ipo = result.data;
  const scfg = SIGNAL_CONFIG[ipo.signal];

  return (
    <main style={{ ...SHELL, padding: "24px 24px 80px" }}>
      <button
        onClick={() => navigate({ to: "/ipos" })}
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
          marginBottom: 18,
        }}
      >
        <Icon name="arrow-left" size={16} /> Back to listings
      </button>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 20,
          flexWrap: "wrap",
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-4xl)",
                fontWeight: 700,
                color: "var(--ink-800)",
              }}
            >
              {ipo.name}
            </h1>
            <Badge tone={STATUS_CONFIG[ipo.status].tone}>{STATUS_CONFIG[ipo.status].label}</Badge>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "var(--text-base)", color: "var(--text-muted)" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: "var(--text-body)" }}>{ipo.ticker}</span>
            <span>·</span>
            <span>{ipo.cn}</span>
            <span>·</span>
            <span>{SECTOR_LABEL[ipo.sector]}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Badge tone={SENTIMENT_TONE[ipo.sentiment]} variant="solid" dot>
            {SENTIMENT_LABEL[ipo.sentiment]}
          </Badge>
          <Button variant="ai" icon={<Icon name="sparkles" size={16} />}>
            Ask the Bee
          </Button>
        </div>
      </div>

      {/* Key stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14, marginBottom: 24 }}>
        <KV label="Offer Price" value={formatHKD(ipo.offer)} />
        <KV label="Total Raise" value={`HK$${ipo.raiseHKD}`} />
        <KV label="Market Cap" value={`HK$${ipo.mcapHKD}`} />
        <KV label="超额认购" value={formatMultiple(ipo.sub)} tone={demandColor(ipo.sub)} />
        <KV label="Listing Date" value={formatListingDate(ipo.listing)} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 24, alignItems: "start" }}>
        {/* Tier analysis */}
        <Card>
          <CardHeader>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <CardTitle>分层分析 Tier Analysis</CardTitle>
                <CardDescription>6 维智能评估 · {ipo.tierLabel}</CardDescription>
              </div>
              <Badge tone={scfg.tone} variant="solid">
                {scfg.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 16,
                background: "var(--surface-muted)",
                borderRadius: "var(--radius-md)",
                marginBottom: 18,
              }}
            >
              <div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>综合评分 Overall</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 4 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-display)",
                      fontSize: "var(--text-5xl)",
                      fontWeight: 800,
                      color: "var(--honey-500)",
                      lineHeight: 1,
                    }}
                  >
                    {ipo.score}
                  </span>
                  <span style={{ color: "var(--text-subtle)" }}>/ 100</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 4 }}>置信度 Confidence</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--text-primary)" }}>
                  {ipo.confidence}%
                </div>
              </div>
            </div>
            <Radar dims={ipo.dims} />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
              {ipo.dims.map((d, i) => (
                <div key={d.k}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "var(--text-sm)", marginBottom: 4 }}>
                    <span style={{ color: "var(--text-body)", fontWeight: 500 }}>{d.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text-primary)" }}>{d.score}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: "var(--radius-pill)", background: "var(--surface-muted)", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${d.score}%`,
                        height: "100%",
                        borderRadius: "var(--radius-pill)",
                        background: `var(--chart-${i + 1})`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <Card>
            <CardHeader>
              <CardTitle>市场情绪 Sentiment</CardTitle>
              <CardDescription>该标的 30 日情绪指数（示例）</CardDescription>
            </CardHeader>
            <CardContent>
              <ScoreMeter value={ipo.score} tone={scoreTone(ipo)} labels={["极度悲观", "中性", "极度乐观"]} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>机构评级 Institutions</CardTitle>
              <CardDescription>保荐人与承销团质量</CardDescription>
            </CardHeader>
            <CardContent style={{ padding: 0 }}>
              {ipo.institutions.map((ins, i) => (
                <div
                  key={ins.name}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 24px",
                    borderTop: i ? "1px solid var(--border-subtle)" : "none",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>{ins.name}</div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{ins.role}</div>
                  </div>
                  <RatingStars value={ins.rating} size={15} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>基石投资者 Cornerstone</CardTitle>
              <CardDescription>
                {ipo.cornerstones.length ? `${ipo.cornerstones.length} 名基石` : "暂无基石投资者"}
              </CardDescription>
            </CardHeader>
            <CardContent style={{ padding: ipo.cornerstones.length ? 0 : "0 24px 24px" }}>
              {ipo.cornerstones.length ? (
                ipo.cornerstones.map((c, i) => (
                  <div
                    key={c.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 24px",
                      borderTop: i ? "1px solid var(--border-subtle)" : "none",
                    }}
                  >
                    <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>{c.name}</span>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>
                        {c.amount}
                      </div>
                      <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>{c.pct}% of offer</div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                  该 IPO 未引入基石投资者，需求支撑较弱。
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Research insight — worker-bee block (research signal, not advice) */}
      <div style={{ marginTop: 24 }}>
        <BeeNote
          basePath={MASCOT_BP}
          pose={insightPose(ipo.signal)}
          tone="navy"
          title="AiphaBee 研究洞察 · Research Insight"
          action={
            <Badge tone={scfg.tone} variant="solid" size="sm">
              {scfg.label} · 置信度 {ipo.confidence}%
            </Badge>
          }
        >
          {ipo.aiNote}
        </BeeNote>
        <Disclaimer style={{ marginTop: 10 }} />
      </div>
    </main>
  );
}
