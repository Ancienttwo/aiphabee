import { Badge, Card, CardContent, CardHeader, CardTitle } from "../../ds";

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
  return (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <CardTitle>临时公开行情分析</CardTitle>
          <Badge tone="navy" variant="soft" size="sm">
            public_observation
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <section
          aria-label="consent"
          style={{
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: 12,
            marginBottom: 14,
            background: "var(--neutral-50)",
          }}
        >
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-body)", lineHeight: 1.6 }}>
            本次分析使用临时公开数据，最长 24 小时内仅用于本会话跟进；结果属于非授权行情验证，仅作
            public_observation_signal。
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>
            获取时间：{retrievedAt} · {delayNotice}
          </p>
        </section>

        <section aria-label="signal-summary" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8 }}>
          <SignalMetric label="趋势" value={signal.trend} />
          <SignalMetric label="动量" value={signal.momentum} />
          <SignalMetric label="波动" value={signal.volatility} />
          <SignalMetric label="成交量" value={signal.volume} />
        </section>

        {bars.length > 0 ? (
          <section aria-label="ohlcv-table" style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: "var(--text-xs)", fontWeight: 700, color: "var(--text-muted)" }}>
                OHLCV · public_observation · 获取时间 {retrievedAt}
              </span>
              <Badge tone="warning" variant="soft" size="sm">
                bounded
              </Badge>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", minWidth: 560, borderCollapse: "collapse", fontSize: "var(--text-2xs)" }}>
                <thead>
                  <tr style={{ color: "var(--text-subtle)", textAlign: "right" }}>
                    <th style={{ textAlign: "left", padding: "6px 4px" }}>timestamp</th>
                    <th style={{ padding: "6px 4px" }}>open</th>
                    <th style={{ padding: "6px 4px" }}>high</th>
                    <th style={{ padding: "6px 4px" }}>low</th>
                    <th style={{ padding: "6px 4px" }}>close</th>
                    <th style={{ padding: "6px 4px" }}>volume</th>
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
                      <td style={{ padding: "6px 4px" }}>{bar.volume ?? "n/a"}</td>
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
