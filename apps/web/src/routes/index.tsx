import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Card, Hexvatar, Icon, type HexvatarTone, type IconName } from "../ds";
import { Button } from "../ds";
import { MarketSentimentPanel } from "../components/MarketSentimentPanel";
import { MASCOT_BP, SHELL } from "../lib/ui";

export const Route = createFileRoute("/")({
  component: Home,
});

function FeatureCard({
  icon,
  tone,
  title,
  body,
}: {
  icon: IconName;
  tone: HexvatarTone;
  title: string;
  body: ReactNode;
}) {
  return (
    <Card padded>
      <Hexvatar icon={<Icon name={icon} size={22} />} tone={tone} variant="soft" size={52} />
      <h3
        style={{
          margin: "16px 0 6px",
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-xl)",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {title}
      </h3>
      <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.65, color: "var(--text-body)" }}>
        {body}
      </p>
    </Card>
  );
}

function Home() {
  const navigate = useNavigate();

  return (
    <main>
      {/* Hero */}
      <section style={{ ...SHELL, paddingTop: 64, paddingBottom: 56, textAlign: "center" }}>
        <img
          src={`${MASCOT_BP}/greeting.png`}
          alt="AiphaBee"
          style={{ width: 132, height: 132, objectFit: "contain", marginBottom: 8 }}
        />
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: "var(--radius-pill)",
            background: "var(--honey-50)",
            border: "1px solid var(--honey-200)",
            marginBottom: 24,
          }}
        >
          <Icon name="sparkles" size={15} color="var(--honey-700)" />
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--honey-800)" }}>
            港股 IPO 投研 Agent · Powered by Claude
          </span>
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-6xl)",
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: "var(--tracking-tight)",
            color: "var(--ink-800)",
          }}
        >
          Find the alpha.
          <br />
          <span style={{ color: "var(--honey-500)" }}>Let the bee do the digging.</span>
        </h1>
        <p
          style={{
            maxWidth: 640,
            margin: "24px auto 0",
            fontSize: "var(--text-lg)",
            lineHeight: 1.6,
            color: "var(--text-body)",
          }}
        >
          数据驱动的港股 IPO 投研平台：多模型估值、AI 招股书解读、基石投资者评分与全维度风险打分。
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 36 }}>
          <Button
            size="lg"
            onClick={() => navigate({ to: "/dashboard" })}
            iconRight={<Icon name="arrow-right" size={18} />}
          >
            Start Analysis
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate({ to: "/ipos" })}>
            Browse IPOs
          </Button>
        </div>
      </section>

      {/* Market overview */}
      <section style={{ ...SHELL, paddingBottom: 56 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Icon name="sparkles" size={22} color="var(--violet-500)" />
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-3xl)",
                fontWeight: 700,
                color: "var(--ink-800)",
              }}
            >
              实时市场概览
            </h2>
          </div>
          <p style={{ margin: 0, color: "var(--text-muted)" }}>
            AI 驱动的市场情绪分析，帮助您把握 IPO 投研时机（示例数据）
          </p>
        </div>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <MarketSentimentPanel />
        </div>
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button
            onClick={() => navigate({ to: "/ipos" })}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              color: "var(--ink-700)",
              fontWeight: 600,
              fontSize: "var(--text-sm)",
              fontFamily: "var(--font-sans)",
            }}
          >
            查看所有 IPO 分析 <Icon name="trending-up" size={16} />
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={{ ...SHELL, paddingBottom: 80 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
          <FeatureCard
            icon="trending-up"
            tone="honey"
            title="Multi-Model Valuation"
            body="DCF、可比公司与先例交易三法合一，结合 6 维分层模型给出公允价值区间。"
          />
          <FeatureCard
            icon="shield"
            tone="green"
            title="Risk Scoring Engine"
            body="15+ 财务健康与市场环境指标，量化筹码、保荐、承销与基石质量。"
          />
          <FeatureCard
            icon="sparkles"
            tone="violet"
            title="AI Prospectus Analysis"
            body="Claude 解读冗长招股书，秒级提炼关键风险、亮点与认购情绪。"
          />
        </div>
      </section>
    </main>
  );
}
