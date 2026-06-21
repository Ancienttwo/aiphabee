import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
  StatCard,
} from "../ds";
import { MarketSentimentPanel } from "../components/MarketSentimentPanel";
import { getIpos } from "../lib/mock-api";
import { SECTOR_LABEL, SENTIMENT_LABEL, SENTIMENT_TONE } from "../data/ipos";
import { formatMultiple } from "../lib/format";
import { SHELL } from "../lib/ui";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  const upcoming = getIpos().data.filter((ipo) => ipo.status === "pending");

  return (
    <main>
      <div style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-card)" }}>
        <div style={{ ...SHELL, padding: "32px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Icon name="rocket" size={30} color="var(--honey-500)" />
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-3xl)",
                  fontWeight: 700,
                  color: "var(--ink-800)",
                }}
              >
                IPO Agent Dashboard
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                欢迎回来！这是您的港股 IPO 市场概览（示例数据）。
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...SHELL, padding: "32px 24px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18 }}>
          <StatCard label="Active IPOs 招股中" value="12" tone="honey" icon={<Icon name="calendar" size={20} />} />
          <StatCard
            label="本周上市 This week"
            value="5"
            tone="green"
            delta="2 vs 上周"
            deltaDirection="up"
            icon={<Icon name="trending-up" size={20} />}
          />
          <StatCard label="平均超额认购" value="42.8×" tone="violet" icon={<Icon name="layers" size={20} />} />
          <StatCard label="Watchlist 关注" value="7" tone="blue" icon={<Icon name="star" size={20} />} />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr 1fr",
            gap: 24,
            marginTop: 24,
            alignItems: "start",
          }}
        >
          <Card>
            <CardHeader>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <CardTitle>本周招股 Upcoming this week</CardTitle>
                <button
                  onClick={() => navigate({ to: "/ipos" })}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--ink-700)",
                    fontWeight: 600,
                    fontSize: "var(--text-xs)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  View all →
                </button>
              </div>
            </CardHeader>
            <CardContent style={{ padding: 0 }}>
              {upcoming.map((ipo, i) => (
                <button
                  key={ipo.id}
                  onClick={() => navigate({ to: "/ipos/$ipoId", params: { ipoId: ipo.id } })}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "14px 24px",
                    background: "none",
                    cursor: "pointer",
                    textAlign: "left",
                    border: "none",
                    borderTop: i ? "1px solid var(--border-subtle)" : "none",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>
                        {ipo.name}
                      </span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                        {ipo.ticker}
                      </span>
                    </div>
                    <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
                      {ipo.listing} · {SECTOR_LABEL[ipo.sector]}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Badge tone={SENTIMENT_TONE[ipo.sentiment]} size="sm" dot>
                      {SENTIMENT_LABEL[ipo.sentiment]}
                    </Badge>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>
                      {formatMultiple(ipo.sub)}
                    </span>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <MarketSentimentPanel />
        </div>
      </div>
    </main>
  );
}
