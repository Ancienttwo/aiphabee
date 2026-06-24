import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Button, Card, Icon, MascotState } from "../../ds";
import { AmbiguityResolver } from "../../components/evidence";
import {
  presentError,
  resolveSecurity,
  type ResolveSecurityCandidate,
} from "../../lib/api";
import { MASCOT_BP, SHELL } from "../../lib/ui";

export const Route = createFileRoute("/stock/")({
  component: StockSearch,
});

interface SearchState {
  loading: boolean;
  candidates: ResolveSecurityCandidate[];
  error: string | null;
  submitted: string | null;
}

const INITIAL: SearchState = {
  loading: false,
  candidates: [],
  error: null,
  submitted: null,
};

function StockSearch() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<SearchState>(INITIAL);
  const seq = useRef(0);

  const open = (instrumentId: string) =>
    navigate({ to: "/stock/$instrumentId", params: { instrumentId } });

  const run = async (text: string) => {
    const q = text.trim();
    if (!q) return;
    const mySeq = ++seq.current;
    setState({ loading: true, candidates: [], error: null, submitted: q });
    const env = await resolveSecurity(q);
    if (mySeq !== seq.current) return; // a newer search superseded this one
    if (!env.ok) {
      setState({ loading: false, candidates: [], error: presentError(env).detail, submitted: q });
      return;
    }
    const data = env.data;
    const selected =
      data.selectedInstrumentId ??
      (data.candidates.length === 1 ? data.candidates[0]?.instrumentId : undefined);
    if (data.status === "resolved" && selected) {
      open(selected);
      return;
    }
    setState({ loading: false, candidates: data.candidates, error: null, submitted: q });
  };

  return (
    <main style={{ ...SHELL, paddingTop: 40, paddingBottom: 72 }}>
      <h1
        style={{
          margin: 0,
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-3xl)",
          fontWeight: 700,
          color: "var(--text-primary)",
        }}
      >
        个股工作台
      </h1>
      <p style={{ margin: "8px 0 24px", fontSize: "var(--text-base)", color: "var(--text-muted)" }}>
        输入证券名称或代码（如 <code>腾讯</code> 或 <code>00700.HK</code>）开始研究。
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(query);
        }}
        style={{ display: "flex", gap: 10, marginBottom: 24 }}
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索证券…"
          aria-label="搜索证券"
          style={{
            flex: 1,
            height: 48,
            padding: "0 18px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-default)",
            background: "var(--surface-card)",
            fontFamily: "var(--font-sans)",
            fontSize: "var(--text-base)",
            color: "var(--text-primary)",
          }}
        />
        <Button type="submit" size="lg" icon={<Icon name="search" size={18} />}>
          搜索
        </Button>
      </form>

      {state.loading ? (
        <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>正在解析证券…</p>
      ) : null}

      {state.error ? (
        <Card padded style={{ borderColor: "var(--red-200)" }}>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--red-600)" }}>
            {state.error}
          </p>
        </Card>
      ) : null}

      {!state.loading && state.candidates.length > 0 ? (
        <AmbiguityResolver
          query={state.submitted ?? undefined}
          candidates={state.candidates}
          onSelect={(c) => open(c.instrumentId)}
        />
      ) : null}

      {!state.loading && !state.error && state.candidates.length === 0 && state.submitted ? (
        <Card padded>
          <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
            “{state.submitted}” 未匹配到证券。试试更完整的名称或代码。
          </p>
        </Card>
      ) : null}

      {!state.submitted ? (
        <MascotState
          basePath={MASCOT_BP}
          pose="forage"
          description="输入证券名称或代码，工蜂会为你采集行情、财务、估值与公告。"
        />
      ) : null}
    </main>
  );
}
