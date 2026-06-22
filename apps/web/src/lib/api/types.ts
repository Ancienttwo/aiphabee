/**
 * Frontend-facing API types.
 *
 * Envelope types come from the shared `@aiphabee/data-contracts` package — the
 * real cross-tier contract. Payload shapes below mirror the worker source of
 * truth but are declared locally so the web app stays decoupled from the heavy
 * server packages:
 *   - AgentProgressStreamEvent  -> packages/agent-runtime/src/index.ts
 *   - ResolveSecurity*          -> packages/security-tools/src/index.ts
 *   - StockWorkbenchSnapshot    -> packages/workbench (createStockWorkbenchSnapshot)
 * If the worker changes these, refine here (Phase 2 adds a contract test).
 */
import type { ProvenanceRef, UsageSummary } from "@aiphabee/data-contracts";

export type {
  AiphaBeeErrorCode,
  ErrorEnvelope,
  MarketStatus,
  ProvenanceRef,
  ResponseEnvelope,
  SuccessEnvelope,
  UsageSummary,
} from "@aiphabee/data-contracts";

// --- resolve_security (packages/security-tools) --------------------------
export type ResolveSecurityStatus = "ambiguous" | "not_found" | "resolved";

export interface ResolveSecurityCandidate {
  currency: string;
  exchange: string;
  instrumentId: string;
  listingId: string;
  market: string;
  matchReason: string;
  name: { en: string; zhHans: string; zhHant: string };
  status: "delisted" | "listed" | "suspended";
  symbol: string;
  validFrom: string;
  validTo?: string;
}

export interface ResolveSecurityData {
  candidates: ResolveSecurityCandidate[];
  market?: string;
  normalizedQuery: string;
  provenance: ProvenanceRef[];
  query: string;
  selectedInstrumentId?: string;
  status: ResolveSecurityStatus;
  usage: UsageSummary;
  [key: string]: unknown;
}

// --- agent progress stream (packages/agent-runtime) ----------------------
export type AgentProgressStatus = "completed" | "planned" | "started" | "stopped";

export interface AgentProgressStreamEvent {
  event: string;
  event_index: number;
  payload: {
    execution: string;
    public_label?: string;
    request_id: string;
    run_id: string;
    status: AgentProgressStatus;
    step_id?: string;
    tool_name?: string;
  };
}

// --- stock workbench snapshot (packages/workbench) -----------------------
export interface WorkbenchSection {
  usage: UsageSummary;
  [key: string]: unknown;
}

export interface StockWorkbenchSnapshot {
  announcement_search: WorkbenchSection;
  capability?: unknown;
  corporate_actions: WorkbenchSection;
  derived_metrics: WorkbenchSection;
  financial_facts: WorkbenchSection;
  price_history: WorkbenchSection;
  quote_snapshot: WorkbenchSection;
  security_profile: WorkbenchSection;
  version: string;
  [key: string]: unknown;
}

// --- module runtime capability probe -------------------------------------
export type RuntimeCapabilities = Record<string, unknown>;
