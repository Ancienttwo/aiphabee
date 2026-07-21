import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Icon,
  MascotState,
} from "../../ds";
import {
  AnswerLayerTag,
  CostConfirmGate,
  EvidenceCard,
  EvidenceStrength,
  ToolProgressStream,
} from "../../components/evidence";
import { Disclaimer } from "../../components/Disclaimer";
import { EvidenceContractCard, ResearchPlanCard } from "../../components/research/PlanView";
import { planAgentRun } from "../../lib/api";
import { useAgentStream } from "../../lib/useAgentStream";
import { MASCOT_BP, SHELL } from "../../lib/ui";
import { useLocale } from "../../i18n/locale";

export const Route = createFileRoute("/ask/$runId")({
  validateSearch: (search: Record<string, unknown>): { q: string } => ({
    q: typeof search.q === "string" ? search.q : "",
  }),
  component: AskRun,
});

function AskRun() {
  const { locale, t } = useLocale();
  const navigate = useNavigate();
  const { runId } = Route.useParams();
  const { q } = Route.useSearch();
  const { events, status, runId: backendRunId } = useAgentStream(
    q || undefined,
    locale,
    runId,
  );
  const { data: planEnv } = useQuery({
    queryKey: ["agent-plan", q, locale],
    queryFn: () => planAgentRun(q, locale),
    enabled: Boolean(q),
  });
  const plan = planEnv?.ok ? planEnv.data : undefined;
  // Evidence must reference the *backend* run id (x-aiphabee-run-id), not the
  // locally generated route param, so the card points at a real run record.
  const evidenceRunId = backendRunId ?? "pending";
  // Client-only timestamp: avoids any SSR/hydration time skew for the synthetic
  // evidence preview (the value only surfaces when the card is expanded).
  const [asOf, setAsOf] = useState("");
  useEffect(() => {
    setAsOf(new Date().toISOString());
  }, []);
  const [costOpen, setCostOpen] = useState(false);
  const [deepQueued, setDeepQueued] = useState(false);

  if (!q) {
    return (
      <main style={{ ...SHELL, paddingTop: 48, paddingBottom: 80 }}>
        <MascotState
          basePath={MASCOT_BP}
          pose="empty"
          title={t("noResearchQuestion")}
          description={t("returnAndAsk")}
        >
          <Button variant="outline" onClick={() => navigate({ to: "/ask" })}>
            {t("askNow")}
          </Button>
        </MascotState>
      </main>
    );
  }

  return (
    <main style={{ ...SHELL, paddingTop: 24, paddingBottom: 72 }}>
      <button
        type="button"
        onClick={() => navigate({ to: "/ask" })}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "var(--text-muted)",
          fontSize: "var(--text-sm)",
          fontFamily: "var(--font-sans)",
          marginBottom: 14,
        }}
      >
        <Icon name="arrow-left" size={16} /> {t("backToResearch")}
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-2xl)",
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          {q}
        </h1>
        <Badge tone={status === "error" ? "bearish" : "ai"} variant="soft" dot>
          {status === "streaming"
            ? t("researching")
            : status === "done"
              ? t("completed")
              : status === "error"
                ? t("capabilityUnavailable")
                : t("preparing")}
        </Badge>
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-2xs)",
          color: "var(--text-subtle)",
          marginBottom: 22,
        }}
      >
        {t("session")} {runId}
        {backendRunId ? ` · ${t("backendRun")} ${backendRunId}` : status === "streaming" ? ` · ${t("connecting")}` : ""}
      </div>

      <div className="ab-split" style={{ gap: 24, alignItems: "start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {plan ? <ResearchPlanCard plan={plan} /> : null}
          <Card>
            <CardHeader>
              <CardTitle>{t("researchProgress")}</CardTitle>
            </CardHeader>
            <CardContent>
              {status === "error" ? (
                <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--red-600)" }}>
                  {t("agentConnectionFailed")}
                </p>
              ) : (
                <ToolProgressStream events={events} streaming={status === "streaming"} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("layeredAnswer")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                style={{
                  margin: "0 0 14px",
                  fontSize: "var(--text-sm)",
                  color: "var(--text-muted)",
                }}
              >
                {t("syntheticPreview")}
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                <AnswerLine layer="fact">{t("previewFact")}</AnswerLine>
                <AnswerLine layer="calculation">{t("previewCalculation")}</AnswerLine>
                <AnswerLine layer="inference">{t("previewInference")}</AnswerLine>
                <AnswerLine layer="unknown">{t("previewUnknown")}</AnswerLine>
              </div>
              <div style={{ marginTop: 14 }}>
                <EvidenceCard
                  asOf={asOf}
                  dataVersion={`ask-run-${evidenceRunId}`}
                  methodologyVersion="synthetic-preview-v0"
                  provenance={[
                    {
                      source: "agent-progress-stream",
                      source_record_id: evidenceRunId,
                      data_version: "synthetic-preview-v0",
                      methodology_version: "synthetic-preview-v0",
                    },
                  ]}
                  usage={{ cached: false, credits: 0, rows: events.length }}
                  warnings={[t("syntheticWarning")]}
                />
              </div>
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
                <Button
                  variant="ai"
                  icon={<Icon name="sparkles" size={16} />}
                  onClick={() => setCostOpen(true)}
                >
                  {t("deepResearch")}
                </Button>
                {deepQueued ? (
                  <span style={{ fontSize: "var(--text-sm)", color: "var(--green-600)" }}>
                    {t("deepResearchQueued")}
                  </span>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {plan ? (
            <EvidenceContractCard plan={plan} />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{t("evidenceStrength")}</CardTitle>
              </CardHeader>
              <CardContent>
                <EvidenceStrength strength="indeterminate" />
                <p style={{ margin: "12px 0 0", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
                  {t("syntheticStrengthUnavailable")}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Disclaimer style={{ marginTop: 24 }} />

      <CostConfirmGate
        open={costOpen}
        estimatedCredits={120}
        dataRange={t("lastFiveYears")}
        outputDescription={t("deepReportOutput")}
        onConfirm={() => {
          setCostOpen(false);
          setDeepQueued(true);
        }}
        onCancel={() => setCostOpen(false)}
      />
    </main>
  );
}

function AnswerLine({
  layer,
  children,
}: {
  layer: "fact" | "calculation" | "inference" | "unknown";
  children: ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
      <AnswerLayerTag layer={layer} />
      <span style={{ fontSize: "var(--text-sm)", lineHeight: 1.6, color: "var(--text-body)" }}>
        {children}
      </span>
    </div>
  );
}
