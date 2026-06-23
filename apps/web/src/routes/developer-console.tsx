import { createFileRoute, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Icon } from "../ds";
import { getDeveloperConsoleSnapshot, type DeveloperConsolePlan } from "../lib/mock-api";
import { SHELL } from "../lib/ui";

export const Route = createFileRoute("/developer-console")({
  component: DeveloperConsole,
});

type ConsoleTab = "wizard" | "credentials" | "logs" | "clients";

const TABS: Array<{ id: ConsoleTab; label: string }> = [
  { id: "wizard", label: "Connection wizard" },
  { id: "credentials", label: "API keys & OAuth scopes" },
  { id: "logs", label: "Quota and request log" },
  { id: "clients", label: "Target-client example flow" },
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

function FlagRow({ label, active }: { label: string; active: boolean }) {
  return (
    <div
      style={{
        alignItems: "center",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-md)",
        display: "flex",
        gap: 10,
        justifyContent: "space-between",
        padding: "10px 12px",
      }}
    >
      <span style={{ color: "var(--text-body)", fontSize: "var(--text-sm)", fontWeight: 700 }}>
        {label}
      </span>
      <Badge tone={active ? "bullish" : "warning"} size="sm" dot>
        {active ? "enabled" : "guarded"}
      </Badge>
    </div>
  );
}

function InfoTile({ label, value, tone = "neutral" }: { label: string; value: ReactNode; tone?: "neutral" | "info" | "honey" }) {
  return (
    <div style={{ background: "var(--surface-muted)", borderRadius: "var(--radius-md)", padding: 14, minWidth: 0 }}>
      <SectionLabel>{label}</SectionLabel>
      <div style={{ marginTop: 8 }}>
        {typeof value === "string" ? <MonoValue strong>{value}</MonoValue> : value}
      </div>
      <div style={{ marginTop: 10 }}>
        <Badge tone={tone} size="sm">
          planned_no_live
        </Badge>
      </div>
    </div>
  );
}

function WizardPanel({ plan }: { plan: DeveloperConsolePlan }) {
  return (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <CardTitle>Connection wizard</CardTitle>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", lineHeight: 1.6, margin: "4px 0 0" }}>
              Four-step Streamable HTTP setup bound to {plan.connection_guide.artifact}.
            </p>
          </div>
          <Badge tone="honey" size="sm">
            {plan.connection_guide.first_call_time_target_minutes} min target
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="console-step-grid">
          {plan.connection_guide.steps.map((step, index) => (
            <div key={step.step} className="console-step">
              <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
                <span className="console-step-number">{index + 1}</span>
                <strong style={{ color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>
                  {step.step.replaceAll("_", " ")}
                </strong>
              </div>
              <p style={{ color: "var(--text-body)", fontSize: "var(--text-sm)", lineHeight: 1.55, margin: "10px 0" }}>
                {step.description}
              </p>
              <MonoValue>{step.route}</MonoValue>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CredentialsPanel({ plan }: { plan: DeveloperConsolePlan }) {
  return (
    <div className="console-two-column">
      <Card>
        <CardHeader>
          <CardTitle>API key route plan</CardTitle>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", lineHeight: 1.6, margin: "4px 0 0" }}>
            Server-to-server only; live secret generation remains disabled.
          </p>
        </CardHeader>
        <CardContent>
          <div className="console-tile-grid">
            <InfoTile label="Create" value={plan.credentials.api_key.create_route} tone="honey" />
            <InfoTile label="Rotate" value={plan.credentials.api_key.rotate_route} />
            <InfoTile label="Revoke" value={plan.credentials.api_key.revoke_route} />
            <InfoTile label="Runtime" value={plan.credentials.api_key.runtime_route} />
          </div>
          <div className="console-guard-note">
            No raw key display · one-time display policy recorded · rawSecretDisplay=false
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>OAuth scopes</CardTitle>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", lineHeight: 1.6, margin: "4px 0 0" }}>
            Revocable PRD 9.7 scope catalog; third-party token passthrough disabled.
          </p>
        </CardHeader>
        <CardContent>
          <div className="console-scope-grid">
            {plan.scope_panel.scope_catalog.map((scope) => (
              <div key={scope.scope} className="console-scope">
                <Badge tone={scope.scope.includes("write") ? "warning" : "info"} size="sm">
                  {scope.scope}
                </Badge>
                <span style={{ color: "var(--text-body)", fontSize: "var(--text-xs)", lineHeight: 1.45 }}>
                  {scope.description}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LogsPanel({ plan }: { plan: DeveloperConsolePlan }) {
  const sample = plan.request_log_panel.sample_rows[0];
  const usage = plan.quota_panel.usage;

  return (
    <div className="console-two-column">
      <Card>
        <CardHeader>
          <CardTitle>Quota and usage fields</CardTitle>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", lineHeight: 1.6, margin: "4px 0 0" }}>
            request_id is visible; ledger reads are represented as planned evidence only.
          </p>
        </CardHeader>
        <CardContent>
          <div className="console-tile-grid">
            <InfoTile label="request_id" value={usage.request_id} tone="honey" />
            <InfoTile label="credits used" value={`${usage.credits_used}`} />
            <InfoTile label="credits pending" value={`${usage.credits_pending}`} />
            <InfoTile label="remaining credits" value={`${usage.credits_remaining}`} tone="info" />
          </div>
          <div className="console-guard-note">
            freshness target {plan.quota_panel.freshness_target_minutes} minutes · live ledger reads disabled
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Request log schema</CardTitle>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", lineHeight: 1.6, margin: "4px 0 0" }}>
            Redacted sample row shows visible reconciliation fields and excludes forbidden secret fields.
          </p>
        </CardHeader>
        <CardContent style={{ padding: 0 }}>
          <div style={{ overflowX: "auto" }}>
            <table className="console-log-table">
              <tbody>
                {Object.entries(sample).map(([field, value]) => (
                  <tr key={field}>
                    <th>{field}</th>
                    <td>
                      <MonoValue>{String(value)}</MonoValue>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ClientsPanel({ plan }: { plan: DeveloperConsolePlan }) {
  return (
    <Card>
      <CardHeader>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div>
            <CardTitle>Target-client example flow</CardTitle>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", lineHeight: 1.6, margin: "4px 0 0" }}>
              initialize, tools/list, and tools/call examples are rendered without live execution.
            </p>
          </div>
          <Badge tone="warning" size="sm">
            live E2E pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="console-example-grid">
          {plan.examples.calls.map((example) => (
            <div key={example.method} className="console-example">
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <strong style={{ color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>{example.method}</strong>
                <Badge tone={example.live_execution ? "bullish" : "neutral"} size="sm">
                  {example.live_execution ? "live" : "planned"}
                </Badge>
              </div>
              <div style={{ display: "grid", gap: 7, marginTop: 12 }}>
                <MonoValue>{example.protocol_route}</MonoValue>
                <MonoValue>{example.request_id}</MonoValue>
                {"tool_name" in example ? <MonoValue>{example.tool_name}</MonoValue> : null}
                {"required_scope" in example ? <MonoValue>{example.required_scope}</MonoValue> : null}
              </div>
            </div>
          ))}
        </div>

        <div className="console-client-list">
          {plan.connection_guide.target_clients.slice(0, 5).map((client) => (
            <div key={client.client_name} className="console-client-row">
              <div>
                <strong style={{ color: "var(--text-primary)", fontSize: "var(--text-sm)" }}>
                  {client.client_name}
                </strong>
                <div style={{ marginTop: 4 }}>
                  <MonoValue>{client.connection_guide_artifact}</MonoValue>
                </div>
              </div>
              <Badge tone={client.live_e2e_passed ? "bullish" : "warning"} size="sm">
                {client.live_e2e_passed ? "accepted" : "missing_external_e2e"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DeveloperConsole() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<ConsoleTab>("wizard");
  const snapshot = useMemo(() => getDeveloperConsoleSnapshot().data, []);
  const plan = snapshot.plan;

  return (
    <main className="developer-console-ui" style={{ ...SHELL, padding: "36px 24px 80px" }}>
      <style>
        {`
          .developer-console-ui,
          .developer-console-ui * {
            box-sizing: border-box;
          }

          .developer-console-ui p,
          .developer-console-ui span,
          .developer-console-ui strong,
          .developer-console-ui td,
          .developer-console-ui th {
            overflow-wrap: anywhere;
          }

          .console-shell-grid {
            display: grid;
            grid-template-columns: minmax(0, 300px) minmax(0, 1fr);
            gap: 20px;
            align-items: start;
          }

          .console-tab-list,
          .console-two-column,
          .console-step-grid,
          .console-tile-grid,
          .console-scope-grid,
          .console-example-grid,
          .console-client-list {
            min-width: 0;
          }

          .console-tab-list {
            display: grid;
            gap: 8px;
          }

          .console-tab {
            align-items: center;
            background: transparent;
            border: 1px solid transparent;
            border-radius: var(--radius-md);
            color: var(--text-primary);
            cursor: pointer;
            display: flex;
            font-family: var(--font-sans);
            font-size: var(--text-sm);
            font-weight: 700;
            gap: 10px;
            justify-content: space-between;
            min-height: 40px;
            padding: 0 12px;
            text-align: left;
            width: 100%;
          }

          .console-tab[data-active="true"] {
            background: var(--honey-50);
            border-color: var(--honey-300);
            color: var(--ink-800);
          }

          .console-two-column {
            display: grid;
            grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
            gap: 20px;
          }

          .console-step-grid,
          .console-example-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
            gap: 14px;
          }

          .console-tile-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
            gap: 12px;
          }

          .console-scope-grid {
            display: grid;
            gap: 10px;
            max-height: 420px;
            overflow: auto;
            padding-right: 4px;
          }

          .console-step,
          .console-example,
          .console-scope {
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-md);
            min-width: 0;
            padding: 14px;
          }

          .console-step-number {
            align-items: center;
            background: var(--honey-500);
            border-radius: 50%;
            color: var(--text-on-honey);
            display: inline-flex;
            flex: 0 0 auto;
            font-size: var(--text-xs);
            font-weight: 900;
            height: 24px;
            justify-content: center;
            width: 24px;
          }

          .console-guard-note {
            background: var(--surface-muted);
            border-radius: var(--radius-md);
            color: var(--text-muted);
            font-size: var(--text-xs);
            line-height: 1.55;
            margin-top: 14px;
            padding: 12px;
          }

          .console-log-table {
            border-collapse: collapse;
            min-width: 620px;
            width: 100%;
          }

          .console-log-table th,
          .console-log-table td {
            border-top: 1px solid var(--border-subtle);
            padding: 11px 18px;
            text-align: left;
            vertical-align: top;
          }

          .console-log-table th {
            color: var(--text-muted);
            font-size: var(--text-xs);
            width: 210px;
          }

          .console-client-list {
            display: grid;
            gap: 10px;
            margin-top: 16px;
          }

          .console-client-row {
            align-items: center;
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-md);
            display: flex;
            gap: 12px;
            justify-content: space-between;
            padding: 12px 14px;
          }

          @media (max-width: 820px) {
            .developer-console-ui {
              max-width: 100vw !important;
              overflow-x: hidden;
              padding-left: 0 !important;
              padding-right: 0 !important;
              width: calc(100vw - 32px) !important;
            }

            .console-shell-grid,
            .console-two-column {
              grid-template-columns: minmax(0, 1fr);
            }

            .console-client-row {
              align-items: flex-start;
              flex-direction: column;
            }

            .console-log-table {
              min-width: 0;
            }

            .console-log-table th,
            .console-log-table td {
              display: block;
              width: 100%;
            }

            .console-log-table td {
              border-top: 0;
              padding-top: 0;
            }
          }
        `}
      </style>

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Icon name="shield" size={22} color="var(--honey-600)" />
            <span style={{ color: "var(--honey-700)", fontSize: "var(--text-xs)", fontWeight: 800, textTransform: "uppercase" }}>
              MCP developer onboarding
            </span>
          </div>
          <h1 style={{ color: "var(--ink-800)", fontFamily: "var(--font-display)", fontSize: "var(--text-4xl)", margin: 0 }}>
            Developer Console
          </h1>
          <p style={{ color: "var(--text-body)", lineHeight: 1.6, margin: "8px 0 0", maxWidth: 780 }}>
            Connection wizard, credentials, OAuth scopes, quota, request_id usage fields, and target-client flow from the MCP runtime plan.
          </p>
        </div>
        <Button variant="outline" icon={<Icon name="arrow-left" size={16} />} onClick={() => navigate({ to: "/research" })}>
          Research
        </Button>
      </div>

      <div className="console-shell-grid">
        <Card>
          <CardHeader>
            <CardTitle>Console controls</CardTitle>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", lineHeight: 1.6, margin: "4px 0 0" }}>
              UI evidence surface only; live external validation remains gated.
            </p>
          </CardHeader>
          <CardContent>
            <div className="console-tab-list" role="tablist" aria-label="Developer Console panels">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  aria-selected={tab === item.id}
                  className="console-tab"
                  data-active={tab === item.id}
                  onClick={() => setTab(item.id)}
                  role="tab"
                  type="button"
                >
                  {item.label}
                  <Icon name="arrow-right" size={14} color="currentColor" />
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
              <FlagRow label="API key generation" active={snapshot.guardrails.liveApiKeyGeneration} />
              <FlagRow label="OAuth provider" active={snapshot.guardrails.liveOAuthProvider} />
              <FlagRow label="Console log store" active={snapshot.guardrails.liveConsoleLogStore} />
              <FlagRow label="Target-client live E2E" active={snapshot.guardrails.liveTargetClientE2E} />
              <FlagRow label="Raw secret display" active={snapshot.guardrails.rawSecretDisplay} />
            </div>
          </CardContent>
        </Card>

        <div style={{ display: "grid", gap: 20, minWidth: 0 }}>
          <Card>
            <CardHeader>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                <div>
                  <CardTitle>Runtime status</CardTitle>
                  <p style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)", lineHeight: 1.6, margin: "4px 0 0" }}>
                    {plan.route} · {plan.status}
                  </p>
                </div>
                <Badge tone="warning" size="sm">
                  {plan.release_gate.gate_status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="console-tile-grid">
                <InfoTile label="request_id" value={plan.request_id} tone="honey" />
                <InfoTile label="protocol route" value={plan.connection_guide.protocol_route} />
                <InfoTile label="target protocol" value={plan.compatibility_status.target_protocol_version} tone="info" />
                <InfoTile label="version" value={plan.version} />
              </div>
            </CardContent>
          </Card>

          {tab === "wizard" ? <WizardPanel plan={plan} /> : null}
          {tab === "credentials" ? <CredentialsPanel plan={plan} /> : null}
          {tab === "logs" ? <LogsPanel plan={plan} /> : null}
          {tab === "clients" ? <ClientsPanel plan={plan} /> : null}
        </div>
      </div>
    </main>
  );
}
