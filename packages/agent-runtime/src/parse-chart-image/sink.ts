import type { ChartParseResultRecord, ChartParseResultSink } from "./types";

export interface InMemoryChartParseResultSink extends ChartParseResultSink {
  rows: ChartParseResultRecord[];
}

/**
 * Accumulating sink for tests and token-gated smoke assembly. Production
 * persistence (Hyperdrive-backed Postgres) is wired at the worker layer in a
 * later slice; the executor only ever depends on the sink interface.
 */
export const createInMemoryChartParseResultSink = (): InMemoryChartParseResultSink => {
  const rows: ChartParseResultRecord[] = [];

  return {
    record: async (row: ChartParseResultRecord) => {
      rows.push(row);
    },
    rows
  };
};
