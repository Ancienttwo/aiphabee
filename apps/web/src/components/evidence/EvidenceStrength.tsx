/**
 * Evidence-strength indicator (PRD 8.4). We show a qualitative strength only —
 * strong / moderate / weak / indeterminate — never a fabricated confidence
 * percentage. Four segments fill to convey the level at a glance.
 */
export type Strength = "strong" | "moderate" | "weak" | "indeterminate";

const STRENGTH: Record<Strength, { label: MessageKey; filled: number; color: string }> = {
  strong: { label: "evidenceStrong", filled: 4, color: "var(--green-500)" },
  moderate: { label: "evidenceModerate", filled: 3, color: "var(--honey-500)" },
  weak: { label: "evidenceWeak", filled: 2, color: "var(--red-500)" },
  indeterminate: { label: "indeterminate", filled: 0, color: "var(--neutral-400)" },
};

export function EvidenceStrength({ strength }: { strength: Strength }) {
  const { t } = useLocale();
  const s = STRENGTH[strength];
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
      title={`${t("evidenceStrength")}: ${t(s.label)}`}
    >
      <span style={{ display: "inline-flex", gap: 3 }} aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 12,
              borderRadius: 2,
              background: i < s.filled ? s.color : "var(--neutral-200)",
            }}
          />
        ))}
      </span>
      <span
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-xs)",
          fontWeight: 600,
          color: "var(--text-muted)",
        }}
      >
        {t(s.label)}
      </span>
    </span>
  );
}
import { useLocale, type MessageKey } from "../../i18n/locale";
