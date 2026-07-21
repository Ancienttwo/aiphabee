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
import { useLocale } from "../i18n/locale";

/**
 * Market sentiment panel (recreates the UI kit's MarketSentimentCard).
 * Illustrative figures only.
 */
export function MarketSentimentPanel() {
  const { t } = useLocale();
  return (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <CardTitle>{t("marketSentimentTitle")}</CardTitle>
            <CardDescription>{t("marketSentimentUpdated")}</CardDescription>
          </div>
          <Badge tone="bullish" dot>
            {t("marketSentimentTrend")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScoreMeter
          label={t("marketSentimentIndex")}
          value={72}
          tone="bullish"
          labels={[
            t("sentimentExtremelyBearish"),
            t("sentimentNeutral"),
            t("sentimentExtremelyBullish"),
          ]}
        />
        <div style={{ marginTop: 20 }}>
          <BeeNote basePath={MASCOT_BP} pose="insight" title={t("marketInsightTitle")}>
            {t("marketInsightBody")}
          </BeeNote>
        </div>
      </CardContent>
    </Card>
  );
}
