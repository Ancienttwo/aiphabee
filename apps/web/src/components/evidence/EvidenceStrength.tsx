/**
 * Evidence-strength indicator (PRD 8.4). We show a qualitative strength only —
 * strong / moderate / weak / indeterminate — never a fabricated confidence
 * percentage. Four segments fill to convey the level at a glance.
 */
export type Strength = "strong" | "moderate" | "weak" | "indeterminate";

const STRENGTH: Record<Strength, { label: string; filled: number; color: string }> = {
  strong: { label: "证据强", filled: 4, color: "var(--green-500)" },
  moderate: { label: "证据中", filled: 3, color: "var(--honey-500)" },
  weak: { label: "证据弱", filled: 2, color: "var(--red-500)" },
  indeterminate: { label: "无法判断", filled: 0, color: "var(--neutral-400)" },
};

export function EvidenceStrength({ strength }: { strength: Strength }) {
  const s = STRENGTH[strength];
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
      title={`证据强度：${s.label}`}
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
        {s.label}
      </span>
    </span>
  );
}
