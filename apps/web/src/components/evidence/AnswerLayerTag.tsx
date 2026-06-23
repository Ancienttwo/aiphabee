import type { CSSProperties } from "react";

/**
 * Answer-layer label (PRD AGT-06). Every claim in an answer is tagged as one
 * of fact / calculation / inference / unknown, in the text *and* in the UI, so
 * the user always knows the epistemic status of a statement.
 */
export type AnswerLayer = "fact" | "calculation" | "inference" | "unknown";

const LAYERS: Record<AnswerLayer, { label: string; bg: string; fg: string }> = {
  fact: { label: "事实", bg: "var(--green-50)", fg: "var(--green-600)" },
  calculation: { label: "计算", bg: "var(--violet-50)", fg: "var(--violet-600)" },
  inference: { label: "推断", bg: "var(--honey-50)", fg: "var(--honey-700)" },
  unknown: { label: "未知", bg: "var(--neutral-100)", fg: "var(--neutral-600)" },
};

export function AnswerLayerTag({ layer }: { layer: AnswerLayer }) {
  const l = LAYERS[layer];
  const style: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    padding: "1px 8px",
    borderRadius: "var(--radius-pill)",
    fontFamily: "var(--font-sans)",
    fontSize: "var(--text-2xs)",
    fontWeight: 700,
    letterSpacing: "var(--tracking-wide)",
    background: l.bg,
    color: l.fg,
  };
  return (
    <span style={style} title={`答案分层：${l.label}`}>
      {l.label}
    </span>
  );
}
