import { useResponseDepth, type ResponseDepth } from "../../lib/context/ResponseDepthContext";

/**
 * Novice / Pro segmented toggle (PRD AGT-12). Switching only changes the depth
 * of explanation — the data and evidence behind it are identical in both modes.
 */
const OPTIONS: { value: ResponseDepth; label: string }[] = [
  { value: "novice", label: "入门" },
  { value: "pro", label: "专业" },
];

export function NoviceProToggle() {
  const { depth, setDepth } = useResponseDepth();
  return (
    <div
      role="radiogroup"
      aria-label="回答深度"
      style={{
        display: "inline-flex",
        padding: 2,
        gap: 2,
        borderRadius: "var(--radius-pill)",
        background: "var(--surface-muted)",
        border: "1px solid var(--border-subtle)",
      }}
    >
      {OPTIONS.map((opt) => {
        const active = depth === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setDepth(opt.value)}
            style={{
              border: "none",
              cursor: "pointer",
              padding: "3px 12px",
              borderRadius: "var(--radius-pill)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-xs)",
              fontWeight: 600,
              background: active ? "var(--honey-500)" : "transparent",
              color: active ? "var(--text-on-honey)" : "var(--text-muted)",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
