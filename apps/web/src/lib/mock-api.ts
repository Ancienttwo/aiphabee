import {
  createErrorEnvelope,
  createSuccessEnvelope,
} from "@aiphabee/data-contracts";
import type {
  EnvelopeMeta,
  ErrorEnvelope,
  ProvenanceRef,
  SuccessEnvelope,
} from "@aiphabee/data-contracts";
import { IPOS, findIpo, type IpoRecord } from "../data/ipos";

/**
 * Mock API — serves the illustrative dataset through the real
 * `@aiphabee/data-contracts` response envelope. This keeps the UI coupled to
 * the canonical contract (provenance, usage, market_status), so swapping to
 * the live worker later is a one-module change. NOT live market data.
 */

// Fixed timestamps keep SSR and client output identical (no hydration drift).
const MOCK_AS_OF = "2026-06-20T00:00:00.000Z";

const MOCK_PROVENANCE: ProvenanceRef[] = [
  {
    source: "mock-fixture",
    source_record_id: "ui-kit-mock-v1",
    data_version: "ui-kit-mock-v1",
    methodology_version: "ui-kit-mock-v1",
  },
];

function mockMeta(requestId: string, rows: number): EnvelopeMeta {
  return {
    asOf: MOCK_AS_OF,
    requestId,
    marketStatus: "not_applicable",
    methodologyVersion: "ui-kit-mock-v1",
    provenance: MOCK_PROVENANCE,
    usage: { cached: true, credits: 0, rows },
  };
}

export function getIpos(): SuccessEnvelope<IpoRecord[]> {
  return createSuccessEnvelope(IPOS, mockMeta("mock-ipos", IPOS.length));
}

export function getIpo(
  id: string,
): SuccessEnvelope<IpoRecord> | ErrorEnvelope {
  const ipo = findIpo(id);
  if (!ipo) {
    return createErrorEnvelope(
      "NOT_FOUND",
      `No IPO matches id "${id}".`,
      mockMeta(`mock-ipo-${id}`, 0),
    );
  }
  return createSuccessEnvelope(ipo, mockMeta(`mock-ipo-${id}`, 1));
}
