import { RESEARCH_SOURCE, VENDOR_PROVENANCE } from "./constants";

export interface ProvenanceProps {
  /** `vendor` = sourced factual data; `research` = AiphaBee-derived analysis. */
  source?: "vendor" | "research";
  /** Methodology version, shown for the analysis layer. */
  methodology?: string;
}

/**
 * Tags a value as a vendor fact (`provenance · netquity_hk_ipo`) or AiphaBee
 * analysis (`aiphabee_research · <methodology>`). The visible distinction is
 * the Gate-0 fact/analysis separation.
 */
export function Provenance({ source = "vendor", methodology }: ProvenanceProps) {
  const vendor = source === "vendor";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-2xs)",
        color: vendor ? "var(--text-subtle)" : "var(--violet-600)",
        whiteSpace: "nowrap",
      }}
    >
      {vendor
        ? `provenance · ${VENDOR_PROVENANCE}`
        : `${RESEARCH_SOURCE} · ${methodology ?? "m-ipo"}`}
    </span>
  );
}
