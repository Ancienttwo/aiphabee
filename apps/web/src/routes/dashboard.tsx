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
import { IPOS, SENTIMENT_TONE } from "../data/ipos.fixtures";
import { useLocale, type MessageKey } from "../i18n/locale";
import type { IpoSector, IpoSentiment } from "../lib/api/ipo-types";
import { formatMultiple } from "../lib/format";
import { SHELL } from "../lib/ui";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

const SECTOR_MESSAGE: Record<IpoSector, MessageKey> = {
  consumer: "sectorConsumer",
  energy: "sectorEnergy",
  fintech: "sectorFintech",
  health: "sectorHealth",
  industrial: "sectorIndustrial",
  property: "sectorProperty",
  tech: "sectorTech",
};

const SENTIMENT_MESSAGE: Record<IpoSentiment, MessageKey> = {
  bearish: "sentimentBearish",
  bullish: "sentimentBullish",
  cautious: "sentimentCautious",
  neutral: "sentimentNeutral",
};

function Dashboard() {
  const navigate = useNavigate();
  const { t } = useLocale();
  const upcoming = IPOS.filter((ipo) => ipo.stage === "subscribing");

  return (
    <main>
      <div style={{ borderBottom: "1px solid var(--border-subtle)", background: "var(--surface-card)" }}>
        <div style={{ ...SHELL, padding: "32px var(--content-gutter)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Icon name="rocket" size={30} color="var(--honey-500)" />
            <div>
              <h1
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-3xl)",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                {t("dashboardTitle")}
              </h1>
              <p style={{ margin: "4px 0 0", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                {t("dashboardWelcome")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...SHELL, padding: "32px var(--content-gutter) 80px" }}>
        <div className="ab-grid-4" style={{ gap: 18 }}>
          <StatCard label={t("dashboardActiveIpos")} value="12" tone="honey" icon={<Icon name="calendar" size={20} />} />
          <StatCard
            label={t("dashboardListingsThisWeek")}
            value="5"
            tone="green"
            delta={t("dashboardVsLastWeek")}
            deltaDirection="up"
            icon={<Icon name="trending-up" size={20} />}
          />
          <StatCard label={t("dashboardAverageOversubscription")} value="42.8×" tone="violet" icon={<Icon name="layers" size={20} />} />
          <StatCard label={t("dashboardWatchlist")} value="7" tone="blue" icon={<Icon name="star" size={20} />} />
        </div>

        <div
          className="ab-split"
          style={{
            gap: 24,
            marginTop: 24,
            alignItems: "start",
          }}
        >
          <Card>
            <CardHeader>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <CardTitle>{t("dashboardUpcomingThisWeek")}</CardTitle>
                <button
                  onClick={() => navigate({ to: "/ipos" })}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-body)",
                    fontWeight: 600,
                    fontSize: "var(--text-xs)",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {t("dashboardViewAll")}
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
                      {ipo.listingDate} · {t(SECTOR_MESSAGE[ipo.sector])}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Badge tone={SENTIMENT_TONE[ipo.sentiment]} size="sm" dot>
                      {t(SENTIMENT_MESSAGE[ipo.sentiment])}
                    </Badge>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--text-primary)" }}>
                      {ipo.live.subPublic != null ? formatMultiple(ipo.live.subPublic) : "—"}
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
