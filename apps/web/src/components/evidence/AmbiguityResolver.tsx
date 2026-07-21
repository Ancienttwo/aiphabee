import { Badge, Button, Hexvatar } from "../../ds";
import type { ResolveSecurityCandidate } from "../../lib/api";
import { formatHkSymbol } from "../../lib/format";
import { useLocale, type MessageKey } from "../../i18n/locale";

/**
 * Ambiguity resolver (PRD SEC-03). When a security query matches more than one
 * instrument the agent must NOT silently pick one — it surfaces the candidates
 * and lets the user choose.
 */
export interface AmbiguityResolverProps {
  candidates: ResolveSecurityCandidate[];
  onSelect: (candidate: ResolveSecurityCandidate) => void;
  onCancel?: () => void;
  query?: string;
}

const STATUS_TONE = {
  listed: "bullish",
  suspended: "warning",
  delisted: "bearish",
} as const;

const STATUS_LABEL: Record<ResolveSecurityCandidate["status"], MessageKey> = {
  listed: "listed", suspended: "suspended", delisted: "delisted",
};

export function AmbiguityResolver({
  candidates,
  onSelect,
  onCancel,
  query,
}: AmbiguityResolverProps) {
  const { locale, t } = useLocale();
  return (
    <div
      style={{
        border: "1px solid var(--honey-200)",
        borderRadius: "var(--radius-lg)",
        background: "var(--honey-50)",
        padding: "var(--space-4)",
      }}
    >
      <div
        style={{
          fontSize: "var(--text-2xs)",
          textTransform: "uppercase",
          letterSpacing: "var(--tracking-caps)",
          color: "var(--text-subtle)",
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        “{query ?? t("queryFallback")}” · {candidates.length} {t("candidatesSelect")}
      </div>
      <p style={{ margin: "0 0 12px", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
        {t("ambiguityNoAutoSelect")}
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {candidates.map((c) => {
          const delisted = c.status === "delisted";
          const primaryName = locale === "en" ? c.name.en || c.name.zhHant : locale === "zh-Hans" ? c.name.zhHans || c.name.zhHant : c.name.zhHant || c.name.en;
          const secondaryName = primaryName !== c.name.en ? c.name.en : null;
          const shortSymbol = formatHkSymbol(c.symbol).split(".")[0];
          return (
            <div
              key={c.instrumentId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
                padding: "10px 12px",
                borderRadius: "var(--radius-md)",
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                opacity: delisted ? 0.75 : 1,
              }}
            >
              <Hexvatar
                size={40}
                tone={delisted ? "neutral" : "honey"}
                icon={
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-2xs)",
                      fontWeight: 700,
                    }}
                  >
                    {shortSymbol}
                  </span>
                }
              />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-sm)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  minWidth: 92,
                }}
              >
                {formatHkSymbol(c.symbol)}
              </span>
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: "var(--text-sm)",
                      fontWeight: 700,
                      color: "var(--text-primary)",
                    }}
                  >
                    {primaryName}
                  </span>
                  {secondaryName ? (
                    <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-subtle)" }}>
                      {secondaryName}
                    </span>
                  ) : null}
                  <Badge tone={STATUS_TONE[c.status]} variant="soft" size="sm">
                    {t(STATUS_LABEL[c.status])}
                  </Badge>
                </span>
                <span
                  style={{
                    display: "block",
                    fontSize: "var(--text-2xs)",
                    color: "var(--text-subtle)",
                    marginTop: 3,
                  }}
                >
                  {c.exchange} · {c.market}
                  {c.validFrom ? <> · {t("validFrom")} {c.validFrom}</> : null}
                  {delisted && c.validTo ? <> · {t("validTo")} {c.validTo}</> : null}
                  {` · ${t("matchReason")} `}
                  {c.matchReason}
                </span>
              </span>
              <Button size="sm" variant="outline" onClick={() => onSelect(c)}>
                {t("select")}
              </Button>
            </div>
          );
        })}
      </div>
      {onCancel ? (
        <div style={{ marginTop: 12 }}>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
