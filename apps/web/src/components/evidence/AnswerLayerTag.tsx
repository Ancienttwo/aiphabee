import type { CSSProperties } from "react";
import { useLocale, type MessageKey } from "../../i18n/locale";

/**
 * Answer-layer label (PRD AGT-06). Every claim in an answer is tagged as one
 * of fact / calculation / inference / unknown, in the text *and* in the UI, so
 * the user always knows the epistemic status of a statement.
 */
export type AnswerLayer = "fact" | "calculation" | "inference" | "unknown";

const LAYERS: Record<AnswerLayer, { label: MessageKey; bg: string; fg: string }> = {
  fact: { label: "layerFact", bg: "var(--green-50)", fg: "var(--green-600)" },
  calculation: { label: "layerCalculation", bg: "var(--violet-50)", fg: "var(--violet-600)" },
  inference: { label: "layerInference", bg: "var(--honey-50)", fg: "var(--honey-700)" },
  unknown: { label: "layerUnknown", bg: "var(--neutral-100)", fg: "var(--neutral-600)" },
};

export function AnswerLayerTag({ layer }: { layer: AnswerLayer }) {
  const { t } = useLocale();
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
    <span style={style} title={`${t("answerLayer")}: ${t(l.label)}`}>
      {t(l.label)}
    </span>
  );
}
