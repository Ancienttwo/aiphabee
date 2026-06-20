import {
  Badge,
  BeeNote,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ScoreMeter,
} from "../ds";
import { MASCOT_BP } from "../lib/ui";

/**
 * Market sentiment panel (recreates the UI kit's MarketSentimentCard).
 * Illustrative figures only.
 */
export function MarketSentimentPanel() {
  return (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <CardTitle>市场情绪指标 · HKEX</CardTitle>
            <CardDescription>最后更新 5 分钟前 · 30 日窗口（示例）</CardDescription>
          </div>
          <Badge tone="bullish" dot>
            谨慎乐观 → 牛市
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScoreMeter
          label="情绪指数 Sentiment Index"
          value={72}
          tone="bullish"
          labels={["极度悲观", "中性", "极度乐观"]}
        />
        <div style={{ marginTop: 20 }}>
          <BeeNote basePath={MASCOT_BP} pose="insight" title="工蜂洞察 · 已为您勤劳搜罗">
            港股 IPO 市场情绪回暖，科技与金融科技板块认购火爆。优质基石阵容、超额认购
            50× 以上的标的，是当前值得重点跟踪的研究方向。
          </BeeNote>
        </div>
      </CardContent>
    </Card>
  );
}
