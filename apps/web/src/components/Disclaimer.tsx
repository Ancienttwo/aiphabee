import type { CSSProperties } from "react";
import { useLocale } from "../i18n/locale";

/**
 * Gate-0 compliance disclaimer: illustrative mock data + non-advice notice.
 * Shown persistently in the footer and beside the research-insight block.
 */

const base: CSSProperties = {
  margin: 0,
  fontSize: "var(--text-2xs)",
  lineHeight: "var(--leading-normal)",
  color: "var(--text-subtle)",
};

export function Disclaimer({ style }: { style?: CSSProperties }) {
  const { t } = useLocale();
  return (
    <p style={{ ...base, ...style }}>{t("disclaimer")}</p>
  );
}
