import { Badge, Card, CardContent, CardHeader, CardTitle } from "../../ds";
import { useLocale } from "../../i18n/locale";

export interface EphemeralOhlcvDisplayBar {
  close: number;
  high: number;
  low: number;
  open: number;
  timestamp: string;
  volume: number | null;
}

export interface EphemeralOhlcvSignalCardProps {
  bars?: readonly EphemeralOhlcvDisplayBar[];
  delayNotice: string;
  retrievedAt: string;
  signal: {
    momentum: string;
    trend: string;
    volatility: string;
    volume: string;
  };
}

export function EphemeralOhlcvSignalCard({
  bars = [],
  delayNotice,
  retrievedAt,
  signal,
}: EphemeralOhlcvSignalCardProps) {
  const { t } = useLocale();
  return (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <CardTitle>{t("ephemeralOhlcvTitle")}</CardTitle>
          <Badge tone="navy" variant="soft" size="sm">
            public_observation
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <section
          aria-label={t("ephemeralConsentLabel")}
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: 12,
            marginBottom: 14,
            background: "var(--neutral-50)",
          }}
        >
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-body)", lineHeight: 1.6 }}>
            {t("ephemeralConsentBody")}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>
            {t("ephemeralRetrievedAt")}: {retrievedAt} · {delayNotice}
          </p>
        </section>

        <section aria-label={t("ephemeralSignalSummaryLabel")} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
          <SignalMetric label={t("ephemeralTrend")} value={signal.trend} />
          <SignalMetric label={t("ephemeralMomentum")} value={signal.momentum} />
          <SignalMetric label={t("ephemeralVolatility")} value={signal.volatility} />
          <SignalMetric label={t("ephemeralVolume")} value={signal.volume} />
        </section>

        {bars.length > 0 ? (
          <section aria-label={t("ephemeralOhlcvTableLabel")} style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-muted)" }}>
                OHLCV · public_observation · {t("ephemeralRetrievedAt")} {retrievedAt}
              </span>
              <Badge tone="warning" variant="soft" size="sm">
                {t("ephemeralBounded")}
              </Badge>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse", fontSize: "var(--text-2xs)" }}>
                <thead>
                  <tr style={{ color: "var(--text-subtle)", textAlign: "right" }}>
                    <th style={{ textAlign: "left", padding: "6px 4px" }}>{t("ephemeralTimestamp")}</th>
                    <th style={{ padding: "6px 4px" }}>{t("ephemeralOpen")}</th>
                    <th style={{ padding: "6px 4px" }}>{t("ephemeralHigh")}</th>
                    <th style={{ padding: "6px 4px" }}>{t("ephemeralLow")}</th>
                    <th style={{ padding: "6px 4px" }}>{t("ephemeralClose")}</th>
                    <th style={{ padding: "6px 4px" }}>{t("ephemeralVolume")}</th>
                  </tr>
                </thead>
                <tbody>
                  {bars.map((bar) => (
                    <tr key={bar.timestamp} style={{ borderTop: "1px solid var(--border-subtle)", textAlign: "right" }}>
                      <td style={{ textAlign: "left", padding: "6px 4px", fontFamily: "var(--font-mono)" }}>{bar.timestamp}</td>
                      <td style={{ padding: "6px 4px" }}>{bar.open}</td>
                      <td style={{ padding: "6px 4px" }}>{bar.high}</td>
                      <td style={{ padding: "6px 4px" }}>{bar.low}</td>
                      <td style={{ padding: "6px 4px" }}>{bar.close}</td>
                      <td style={{ padding: "6px 4px" }}>{bar.volume ?? t("ephemeralNotAvailable")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SignalMetric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        padding: 10,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-primary)", wordBreak: "break-word" }}>
        {value}
      </div>
    </div>
  );
}
