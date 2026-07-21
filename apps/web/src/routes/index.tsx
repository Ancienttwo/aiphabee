import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Button,
  Card,
  Hexvatar,
  Icon,
  type HexvatarTone,
  type IconName,
} from "../ds";
import { MASCOT_BP, SHELL } from "../lib/ui";
import { useLocale, type MessageKey } from "../i18n/locale";

export const Route = createFileRoute("/")({
  component: Home,
});

const QUICK_ACTIONS = [
  { to: "/ask", label: "homeActionAsk", desc: "homeActionAskDesc", icon: "message-circle", tone: "honey" },
  { to: "/stock", label: "homeActionStock", desc: "homeActionStockDesc", icon: "trending-up", tone: "green" },
  { to: "/screen", label: "homeActionScreen", desc: "homeActionScreenDesc", icon: "sliders", tone: "violet" },
  { to: "/compare", label: "homeActionCompare", desc: "homeActionCompareDesc", icon: "layers", tone: "honey" },
  { to: "/documents", label: "homeActionDocuments", desc: "homeActionDocumentsDesc", icon: "file-text", tone: "green" },
  { to: "/watchlist", label: "homeActionWatchlist", desc: "homeActionWatchlistDesc", icon: "eye", tone: "violet" },
  { to: "/library", label: "homeActionLibrary", desc: "homeActionLibraryDesc", icon: "bookmark", tone: "honey" },
  { to: "/mcp", label: "homeActionMcp", desc: "homeActionMcpDesc", icon: "database", tone: "green" },
] as const satisfies ReadonlyArray<{ to: string; label: MessageKey; desc: MessageKey; icon: IconName; tone: HexvatarTone }>;

const EXAMPLES = [
  "homeExample1",
  "homeExample2",
  "homeExample3",
  "homeExample4",
] as const satisfies readonly MessageKey[];

const VALUE_PROPS: { icon: IconName; tone: HexvatarTone; title: MessageKey; body: MessageKey }[] = [
  {
    icon: "layers",
    tone: "honey",
    title: "homeValueEvidence",
    body: "homeValueEvidenceBody",
  },
  {
    icon: "shield",
    tone: "green",
    title: "homeValueLayers",
    body: "homeValueLayersBody",
  },
  {
    icon: "database",
    tone: "violet",
    title: "homeValueDual",
    body: "homeValueDualBody",
  },
];

function Home() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const startResearch = (q: string) => {
    const text = q.trim();
    if (!text) return;
    navigate({
      to: "/ask/$runId",
      params: { runId: crypto.randomUUID() },
      search: { q: text },
    });
  };

  return (
    <main>
      {/* Hero */}
      <section style={{ ...SHELL, paddingTop: 60, paddingBottom: 40, textAlign: "center" }}>
        <img
          src={`${MASCOT_BP}/greeting.png`}
          alt="AiphaBee"
          style={{ width: 116, height: 116, objectFit: "contain", marginBottom: 8 }}
        />
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
            borderRadius: "var(--radius-pill)",
            background: "var(--honey-50)",
            border: "1px solid var(--honey-200)",
            marginBottom: 22,
          }}
        >
          <Icon name="sparkles" size={15} color="var(--honey-700)" />
          <span style={{ fontSize: "var(--text-xs)", fontWeight: 600, color: "var(--honey-800)" }}>
            {t("homeBadge")}
          </span>
        </div>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-6xl)",
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: "var(--tracking-tight)",
            color: "var(--text-primary)",
          }}
        >
          {t("homeHeadline1")}
          <br />
          <span style={{ color: "var(--honey-500)" }}>{t("homeHeadline2")}</span>
        </h1>
        <p
          style={{
            maxWidth: 620,
            margin: "20px auto 0",
            fontSize: "var(--text-lg)",
            lineHeight: 1.6,
            color: "var(--text-body)",
          }}
        >
          {t("homeIntro")}
        </p>

        {/* Research prompt */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            startResearch(prompt);
          }}
          style={{
            display: "flex",
            gap: 10,
            maxWidth: 620,
            margin: "28px auto 0",
          }}
        >
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t("homePromptPlaceholder")}
            aria-label={t("researchQuestion")}
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
          <Button
            type="submit"
            size="lg"
            iconRight={<Icon name="arrow-right" size={18} />}
          >
            {t("startResearch")}
          </Button>
        </form>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 16 }}>
          {EXAMPLES.map((key) => {
            const q = t(key);
            return (
            <button
              key={q}
              type="button"
              onClick={() => startResearch(q)}
              style={{
                padding: "6px 12px",
                borderRadius: "var(--radius-pill)",
                border: "1px solid var(--border-subtle)",
                background: "var(--surface-card)",
                cursor: "pointer",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-xs)",
                color: "var(--text-muted)",
              }}
            >
              {q}
            </button>
            );
          })}
        </div>
      </section>

      {/* Quick actions */}
      <section style={{ ...SHELL, paddingBottom: 48 }}>
        <div className="ab-grid-4" style={{ gap: 16 }}>
          {QUICK_ACTIONS.map((a) => (
            <Card
              key={a.to}
              interactive
              padded
              onClick={() => navigate({ to: a.to })}
              style={{ cursor: "pointer" }}
            >
              <Hexvatar
                icon={<Icon name={a.icon} size={20} />}
                tone={a.tone}
                variant="soft"
                size={46}
              />
              <h3
                style={{
                  margin: "14px 0 4px",
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-lg)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {t(a.label)}
              </h3>
              <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.55, color: "var(--text-muted)" }}>
                {t(a.desc)}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Evidence-first value props — divided rows (not a 3-card triplet) */}
      <section style={{ ...SHELL, paddingBottom: 80 }}>
        <Card padded>
          {VALUE_PROPS.map((v, i) => (
            <div
              key={v.title}
              style={{
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                padding: i === 0 ? "0 0 20px" : "20px 0",
                borderTop: i === 0 ? "none" : "1px solid var(--border-subtle)",
              }}
            >
              <Hexvatar icon={<Icon name={v.icon} size={22} />} tone={v.tone} variant="soft" size={52} />
              <div style={{ minWidth: 0 }}>
                <h3
                  style={{
                    margin: "0 0 6px",
                    fontFamily: "var(--font-display)",
                    fontSize: "var(--text-xl)",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                  }}
                >
                  {t(v.title)}
                </h3>
                <p style={{ margin: 0, fontSize: "var(--text-sm)", lineHeight: 1.65, color: "var(--text-body)", maxWidth: "62ch" }}>
                  {t(v.body)}
                </p>
              </div>
            </div>
          ))}
        </Card>
      </section>
    </main>
  );
}
