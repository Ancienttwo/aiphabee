/**
 * Provenance labels — the Gate-0 fact-layer / analysis-layer separation.
 * Vendor facts are tagged with `VENDOR_PROVENANCE`; AiphaBee-derived analysis
 * (scores, research signals) is tagged with `RESEARCH_SOURCE`. Keeping the two
 * visibly distinct is what lets evidence/lineage and licensed-advice framing
 * hold — a vendor fact is sourced, an AiphaBee signal is descriptive.
 */
export const VENDOR_PROVENANCE = "netquity_hk_ipo";
export const RESEARCH_SOURCE = "aiphabee_research";
