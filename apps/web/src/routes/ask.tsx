import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Icon } from "../ds";
import {
  getAgentAskEvidenceSnapshot,
  type AgentAskEvidenceCard,
  type AgentAskEvidenceSnapshot,
  type AgentAskProgressUiEvent,
} from "../lib/mock-api";
import { SHELL } from "../lib/ui";

export const Route = createFileRoute("/ask")({
  component: AgentAskWorkbench,
});

type RunState = "ready" | "streaming" | "completed" | "blocked";

const RUN_STATES: Array<{ id: RunState; label: string }> = [
  { id: "ready", label: "Ready" },
  { id: "streaming", label: "Loading" },
  { id: "completed", label: "Completed" },
  { id: "blocked", label: "Blocked" },
];

function MonoValue({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <span
      style={{
        color: strong ? "var(--ink-800)" : "var(--text-muted)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-xs)",
        fontWeight: strong ? 800 : 500,
        overflowWrap: "anywhere",
      }}
    >
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        color: "var(--text-muted)",
        fontSize: "var(--text-xs)",
        fontWeight: 800,
        letterSpacing: "0.02em",
        textTransform: "uppercase",
      }}
    >
      {children}
    </div>
  );
}

function Guardrail({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="ask-guardrail">
      <span>{label}</span>
      <Badge tone={active ? "warning" : "bullish"} size="sm" dot>
        {active ? "blocked" : "off"}
      </Badge>
    </div>
  );
}

function RunStateButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      onClick={onClick}
      className="ask-state-button"
      style={{
        background: active ? "var(--honey-500)" : "var(--surface-card)",
        borderColor: active ? "var(--honey-500)" : "var(--border-default)",
        color: active ? "var(--ink-800)" : "var(--text-body)",
      }}
      type="button"
    >
      {children}
    </button>
  );
}

function PromptPanel({
  runState,
  snapshot,
  setRunState,
}: {
  runState: RunState;
  snapshot: AgentAskEvidenceSnapshot;
  setRunState: (state: RunState) => void;
}) {
  const disabled = runState === "streaming";

  return (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", gap: 14, justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <CardTitle>Ask IPO Agent</CardTitle>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", lineHeight: 1.6, margin: "4px 0 0" }}>
              Preview a no-model run with public tool status and source-bound numbers.
            </p>
          </div>
          <Badge tone={runState === "blocked" ? "warning" : "honey"} size="sm" dot>
            {runState}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <label style={{ display: "grid", gap: 8 }}>
          <SectionLabel>Question</SectionLabel>
          <textarea
            aria-label="Agent question"
            defaultValue="Summarize 00700.HK public market and filing signals with sourced numeric claims."
            rows={5}
            style={{
              background: "var(--surface-muted)",
              border: "1px solid var(--border-default)",
              borderRadius: "var(--radius-md)",
              color: "var(--text-primary)",
              fontFamily: "var(--font-sans)",
              fontSize: "var(--text-sm)",
              lineHeight: 1.6,
              minHeight: 132,
              padding: 14,
              resize: "vertical",
              width: "100%",
            }}
          />
        </label>

        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
          <SectionLabel>State controls</SectionLabel>
          <div className="ask-state-grid" role="group" aria-label="Agent run state">
            {RUN_STATES.map((state) => (
              <RunStateButton key={state.id} active={runState === state.id} onClick={() => setRunState(state.id)}>
                {state.label}
              </RunStateButton>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
          <Button
            disabled={disabled}
            onClick={() => setRunState("streaming")}
            iconRight={<Icon name="arrow-right" size={16} />}
          >
            Run guarded stream
          </Button>
          <Button variant="outline" onClick={() => setRunState("completed")}>
            Show sourced answer
          </Button>
          <Button variant="ghost" onClick={() => setRunState("blocked")}>
            Show missing-source block
          </Button>
        </div>

        <div className="ask-guardrail-grid">
          <Guardrail label="model calls" active={snapshot.guardrails.modelCalls} />
          <Guardrail label="actual tools" active={snapshot.guardrails.actualToolExecution} />
          <Guardrail label="persistent writes" active={snapshot.guardrails.persistentWrites} />
          <Guardrail label="raw generated answer" active={snapshot.guardrails.rawGeneratedAnswerReturned} />
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressTimeline({
  events,
  runState,
}: {
  events: AgentAskProgressUiEvent[];
  runState: RunState;
}) {
  const visibleEvents = runState === "ready" ? events.slice(0, 2) : runState === "streaming" ? events.slice(0, 6) : events;

  return (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <CardTitle>Public progress events</CardTitle>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", lineHeight: 1.6, margin: "4px 0 0" }}>
              Tool status is visible while private reasoning stays hidden.
            </p>
          </div>
          <Badge tone="info" size="sm">
            text/event-stream
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="ask-progress-list" aria-label="Public agent progress events">
          {visibleEvents.map((event) => (
            <li key={`${event.eventIndex}-${event.event}`} className="ask-progress-row">
              <span className="ask-progress-index">{event.eventIndex}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <MonoValue strong>{event.event}</MonoValue>
                  <Badge tone={event.status === "completed" ? "bullish" : "neutral"} size="sm">
                    {event.status}
                  </Badge>
                </div>
                <p style={{ color: "var(--text-body)", fontSize: "var(--text-sm)", lineHeight: 1.55, margin: "6px 0 0" }}>
                  {event.publicLabel}
                </p>
                {event.toolName ? (
                  <div style={{ marginTop: 4 }}>
                    <MonoValue>{event.toolName}</MonoValue>
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function EvidenceCardButton({
  active,
  card,
  onClick,
}: {
  active: boolean;
  card: AgentAskEvidenceCard;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className="ask-evidence-button"
      onClick={onClick}
      style={{
        borderColor: active ? "var(--honey-500)" : "var(--border-subtle)",
        boxShadow: active ? "0 0 0 3px rgba(245, 166, 35, 0.14)" : "none",
      }}
      type="button"
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <strong style={{ color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>{card.label}</strong>
        <Badge tone={card.evidenceStrength === "strong" ? "bullish" : "info"} size="sm">
          {card.evidenceStrength}
        </Badge>
      </div>
      <p style={{ color: "var(--text-body)", fontSize: "var(--text-sm)", lineHeight: 1.55, margin: "10px 0 0" }}>
        {card.dataPoint}
      </p>
      <div style={{ marginTop: 10 }}>
        <MonoValue>{card.sourceTool}</MonoValue>
      </div>
    </button>
  );
}

function EvidenceCardsPanel({
  selectedCard,
  selectedCardId,
  setSelectedCardId,
  snapshot,
}: {
  selectedCard: AgentAskEvidenceCard;
  selectedCardId: string;
  setSelectedCardId: (cardId: string) => void;
  snapshot: AgentAskEvidenceSnapshot;
}) {
  return (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <CardTitle>Clickable evidence cards</CardTitle>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", lineHeight: 1.6, margin: "4px 0 0" }}>
              Inspect source metadata before trusting a generated number.
            </p>
          </div>
          <Badge tone="bullish" size="sm">
            {snapshot.sourcedValidation.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="ask-evidence-grid">
          <div className="ask-evidence-list" role="list" aria-label="Evidence cards">
            {snapshot.evidenceCards.map((card) => (
              <EvidenceCardButton
                key={card.cardId}
                active={selectedCardId === card.cardId}
                card={card}
                onClick={() => setSelectedCardId(card.cardId)}
              />
            ))}
          </div>
          <div className="ask-evidence-detail">
            <SectionLabel>Selected source metadata</SectionLabel>
            <dl className="ask-metadata-list">
              <div>
                <dt>card_id</dt>
                <dd>
                  <MonoValue>{selectedCard.cardId}</MonoValue>
                </dd>
              </div>
              <div>
                <dt>source_record_id</dt>
                <dd>
                  <MonoValue>{selectedCard.sourceRecordId}</MonoValue>
                </dd>
              </div>
              <div>
                <dt>document_location</dt>
                <dd>
                  <MonoValue>{selectedCard.documentLocation}</MonoValue>
                </dd>
              </div>
              <div>
                <dt>data_version</dt>
                <dd>
                  <MonoValue>{selectedCard.dataVersion}</MonoValue>
                </dd>
              </div>
              <div>
                <dt>methodology_version</dt>
                <dd>
                  <MonoValue>{selectedCard.methodologyVersion}</MonoValue>
                </dd>
              </div>
              <div>
                <dt>as_of</dt>
                <dd>
                  <MonoValue>{selectedCard.asOf}</MonoValue>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AnswerPanel({ runState, snapshot }: { runState: RunState; snapshot: AgentAskEvidenceSnapshot }) {
  const blocked = runState === "blocked";

  return (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <CardTitle>{blocked ? "Missing-source blocking state" : "Sourced answer preview"}</CardTitle>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", lineHeight: 1.6, margin: "4px 0 0" }}>
              {blocked
                ? "Unsourced numeric claims are blocked before frontend release."
                : "Rendered answer sections follow the answer evidence contract."}
            </p>
          </div>
          <Badge tone={blocked ? "warning" : "honey"} size="sm" dot>
            {blocked ? snapshot.blockingProbe.status : snapshot.sourcedValidation.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {blocked ? (
          <div className="ask-blocked-panel" role="alert">
            <Icon name="alert-circle" size={22} color="var(--warning-600)" />
            <div>
              <strong style={{ color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>
                {snapshot.missingSourceCard.message}
              </strong>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
                {snapshot.missingSourceCard.missingFields.map((field) => (
                  <Badge key={field} tone="warning" size="sm">
                    {field}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="ask-answer-panel">
            <p style={{ color: "var(--text-primary)", fontSize: "var(--text-base)", lineHeight: 1.7, margin: 0 }}>
              {snapshot.answer.direct}
            </p>
            <div className="ask-section-grid">
              {snapshot.answer.orderedSections.slice(0, 8).map((section) => (
                <div key={section} className="ask-section-chip">
                  {section.replaceAll("_", " ")}
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ marginTop: 14 }}>
          <MonoValue>{snapshot.answer.redactionBoundary}</MonoValue>
        </div>
      </CardContent>
    </Card>
  );
}

function AgentAskWorkbench() {
  const snapshot = useMemo(() => getAgentAskEvidenceSnapshot().data, []);
  const [runState, setRunState] = useState<RunState>("completed");
  const [selectedCardId, setSelectedCardId] = useState(snapshot.evidenceCards[0]?.cardId ?? "");
  const selectedCard = snapshot.evidenceCards.find((card) => card.cardId === selectedCardId) ?? snapshot.evidenceCards[0];

  return (
    <main style={{ ...SHELL, padding: "32px 24px 80px" }}>
      <div className="ask-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Icon name="sparkles" size={24} color="var(--honey-500)" />
            <h1
              style={{
                color: "var(--ink-800)",
                fontFamily: "var(--font-display)",
                fontSize: "var(--text-4xl)",
                fontWeight: 800,
                letterSpacing: "0",
                lineHeight: 1.08,
                margin: 0,
              }}
            >
              Agent Ask Workbench
            </h1>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--text-base)", lineHeight: 1.65, margin: 0, maxWidth: 780 }}>
            Draft market questions with source-bound numbers; guarded progress shows what can be trusted before live release.
          </p>
        </div>
        <div className="ask-header-status">
          <SectionLabel>Run</SectionLabel>
          <MonoValue strong>{snapshot.progress.run_id}</MonoValue>
          <Badge tone="warning" size="sm">
            no live cutover
          </Badge>
        </div>
      </div>

      <div className="ask-layout">
        <div style={{ display: "grid", gap: 20, minWidth: 0 }}>
          <PromptPanel runState={runState} setRunState={setRunState} snapshot={snapshot} />
          <AnswerPanel runState={runState} snapshot={snapshot} />
        </div>
        <div style={{ display: "grid", gap: 20, minWidth: 0 }}>
          <ProgressTimeline events={snapshot.publicProgressEvents} runState={runState} />
          {selectedCard ? (
            <EvidenceCardsPanel
              selectedCard={selectedCard}
              selectedCardId={selectedCardId}
              setSelectedCardId={setSelectedCardId}
              snapshot={snapshot}
            />
          ) : null}
        </div>
      </div>

      <style>{`
        .ask-header {
          align-items: flex-start;
          display: flex;
          gap: 20px;
          justify-content: space-between;
          margin-bottom: 24px;
        }

        .ask-header-status {
          background: var(--surface-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          display: grid;
          gap: 8px;
          min-width: min(100%, 280px);
          padding: 16px;
        }

        .ask-layout {
          align-items: start;
          display: grid;
          gap: 22px;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
        }

        .ask-state-grid {
          display: grid;
          gap: 8px;
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }

        .ask-state-button {
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-family: var(--font-sans);
          font-size: var(--text-xs);
          font-weight: 800;
          min-height: 38px;
          padding: 8px 10px;
        }

        .ask-guardrail-grid {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          margin-top: 18px;
        }

        .ask-guardrail {
          align-items: center;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          display: flex;
          gap: 10px;
          justify-content: space-between;
          min-width: 0;
          padding: 10px 12px;
        }

        .ask-guardrail span {
          color: var(--text-body);
          font-size: var(--text-xs);
          font-weight: 800;
        }

        .ask-progress-list {
          display: grid;
          gap: 12px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .ask-progress-row {
          align-items: flex-start;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          display: grid;
          gap: 12px;
          grid-template-columns: 32px minmax(0, 1fr);
          padding: 12px;
        }

        .ask-progress-index {
          align-items: center;
          background: var(--honey-50);
          border: 1px solid var(--honey-200);
          border-radius: 999px;
          color: var(--honey-800);
          display: inline-flex;
          font-family: var(--font-mono);
          font-size: var(--text-xs);
          font-weight: 800;
          height: 28px;
          justify-content: center;
          width: 28px;
        }

        .ask-evidence-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
        }

        .ask-evidence-list {
          display: grid;
          gap: 10px;
          min-width: 0;
        }

        .ask-evidence-button {
          background: var(--surface-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-family: var(--font-sans);
          padding: 12px;
          text-align: left;
          width: 100%;
        }

        .ask-evidence-detail {
          background: var(--surface-muted);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          min-width: 0;
          padding: 14px;
        }

        .ask-metadata-list {
          display: grid;
          gap: 10px;
          margin: 12px 0 0;
        }

        .ask-metadata-list div {
          display: grid;
          gap: 4px;
        }

        .ask-metadata-list dt {
          color: var(--text-subtle);
          font-size: var(--text-2xs);
          font-weight: 800;
          margin: 0;
          text-transform: uppercase;
        }

        .ask-metadata-list dd {
          margin: 0;
          min-width: 0;
        }

        .ask-answer-panel {
          background: var(--surface-muted);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 16px;
        }

        .ask-section-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 16px;
        }

        .ask-section-chip {
          background: var(--surface-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-body);
          font-size: var(--text-xs);
          font-weight: 800;
          padding: 7px 10px;
        }

        .ask-blocked-panel {
          align-items: flex-start;
          background: var(--warning-50);
          border: 1px solid var(--warning-200);
          border-radius: var(--radius-md);
          display: grid;
          gap: 12px;
          grid-template-columns: 28px minmax(0, 1fr);
          padding: 14px;
        }

        @media (max-width: 980px) {
          .ask-header,
          .ask-layout,
          .ask-evidence-grid {
            grid-template-columns: 1fr;
          }

          .ask-header {
            display: grid;
          }
        }

        @media (max-width: 620px) {
          .ask-state-grid,
          .ask-guardrail-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </main>
  );
}
