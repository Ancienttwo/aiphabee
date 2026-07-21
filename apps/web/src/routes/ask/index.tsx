import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, Icon } from "../../ds";
import { SHELL } from "../../lib/ui";
import { useLocale, type MessageKey } from "../../i18n/locale";

export const Route = createFileRoute("/ask/")({
  component: AskIndex,
});

const TEMPLATES = [
  {
    title: "askTemplateMove", prompt: "askTemplateMovePrompt", desc: "askTemplateMoveDesc",
  },
  {
    title: "askTemplateFundamentals", prompt: "askTemplateFundamentalsPrompt", desc: "askTemplateFundamentalsDesc",
  },
  {
    title: "askTemplatePeers", prompt: "askTemplatePeersPrompt", desc: "askTemplatePeersDesc",
  },
  {
    title: "askTemplateAnnouncements", prompt: "askTemplateAnnouncementsPrompt", desc: "askTemplateAnnouncementsDesc",
  },
] as const satisfies ReadonlyArray<{ title: MessageKey; prompt: MessageKey; desc: MessageKey }>;

function AskIndex() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const start = (text: string) => {
    const q = text.trim();
    if (!q) return;
    navigate({
      to: "/ask/$runId",
      params: { runId: crypto.randomUUID() },
      search: { q },
    });
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
        {t("askTitle")}
      </h1>
      <p style={{ margin: "8px 0 24px", fontSize: "var(--text-base)", color: "var(--text-muted)" }}>
        {t("askDescription")}
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          start(prompt);
        }}
        style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 28 }}
      >
        <input
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t("askPlaceholder")}
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
        <Button type="submit" size="lg" iconRight={<Icon name="arrow-right" size={18} />}>
          {t("startResearch")}
        </Button>
      </form>

      <h2
        style={{
          margin: "0 0 12px",
          fontFamily: "var(--font-display)",
          fontSize: "var(--text-lg)",
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {t("researchTemplates")}
      </h2>
      <div className="ab-grid-2" style={{ gap: 16 }}>
        {TEMPLATES.map((template) => (
          <Card
            key={template.title}
            interactive
            padded
            onClick={() => start(t(template.prompt))}
            style={{ cursor: "pointer" }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <Icon name="sparkles" size={16} color="var(--honey-600)" />
              <h3
                style={{
                  margin: 0,
                  fontFamily: "var(--font-display)",
                  fontSize: "var(--text-base)",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                }}
              >
                {t(template.title)}
              </h3>
            </div>
            <p style={{ margin: "0 0 10px", fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
              {t(template.desc)}
            </p>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-xs)",
                color: "var(--text-body)",
                background: "var(--surface-sunken)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 10px",
              }}
            >
              “{t(template.prompt)}”
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
