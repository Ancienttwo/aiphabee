import { Badge, Button } from "../../ds";
import type { ResolveSecurityCandidate } from "../../lib/api";

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

const STATUS_LABEL = {
  listed: "上市",
  suspended: "停牌",
  delisted: "退市",
} as const;

export function AmbiguityResolver({
  candidates,
  onSelect,
  onCancel,
  query,
}: AmbiguityResolverProps) {
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
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-sm)",
          fontWeight: 700,
          color: "var(--ink-800)",
          marginBottom: 4,
        }}
      >
        “{query ?? "该查询"}” 匹配到多个证券，请选择
      </div>
      <p style={{ margin: "0 0 12px", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
        为避免歧义，系统不会替你自动选择。
      </p>
      <div style={{ display: "grid", gap: 8 }}>
        {candidates.map((c) => (
          <div
            key={c.instrumentId}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 12px",
              borderRadius: "var(--radius-md)",
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-sm)",
                fontWeight: 600,
                color: "var(--ink-800)",
                minWidth: 92,
              }}
            >
              {c.symbol}
            </span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--font-sans)",
                  fontSize: "var(--text-sm)",
                  color: "var(--text-primary)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {c.name.zhHant || c.name.en}
              </span>
              <span style={{ fontSize: "var(--text-2xs)", color: "var(--text-muted)" }}>
                {c.exchange} · {c.market} · 自 {c.validFrom}
              </span>
            </span>
            <Badge tone={STATUS_TONE[c.status]} variant="soft" size="sm">
              {STATUS_LABEL[c.status]}
            </Badge>
            <Button size="sm" variant="outline" onClick={() => onSelect(c)}>
              选择
            </Button>
          </div>
        ))}
      </div>
      {onCancel ? (
        <div style={{ marginTop: 12 }}>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            取消
          </Button>
        </div>
      ) : null}
    </div>
  );
}
