import { Link } from "@tanstack/react-router";
import { Disclaimer } from "./Disclaimer";
import { LOGO_MASCOT, SHELL } from "../lib/ui";
import { useLocale, type MessageKey } from "../i18n/locale";

const QUICK = [
  { to: "/ask", label: "research" },
  { to: "/stock", label: "footerStockWorkbench" },
  { to: "/documents", label: "footerAnnouncementDocuments" },
  { to: "/library", label: "footerResearchLibrary" },
  { to: "/mcp", label: "homeActionMcp" },
] as const satisfies ReadonlyArray<{ to: string; label: MessageKey }>;

const quickLink = {
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  color: "var(--text-muted)",
  textDecoration: "none",
};

export function Footer() {
  const { t } = useLocale();
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--surface-card)",
      }}
    >
      <div style={{ ...SHELL, padding: "40px var(--content-gutter)", textAlign: "center" }}>
        <img src={LOGO_MASCOT} alt="AiphaBee" style={{ height: 44, marginBottom: 12 }} />
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          © 2026 AiphaBee · {t("footerTagline")}
        </p>
        <nav
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            justifyContent: "center",
            margin: "14px 0",
          }}
        >
          {QUICK.map((q) => (
            <Link key={q.to} to={q.to} style={quickLink}>
              {t(q.label)}
            </Link>
          ))}
          <Link to="/ipos" style={{ ...quickLink, color: "var(--text-subtle)" }}>
            {t("archivedIpoDemo")}
          </Link>
        </nav>
        <div style={{ maxWidth: 660, margin: "0 auto" }}>
          <Disclaimer />
        </div>
      </div>
    </footer>
  );
}
