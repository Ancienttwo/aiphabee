import { Link } from "@tanstack/react-router";
import { Disclaimer } from "./Disclaimer";
import { LOGO_MASCOT, SHELL } from "../lib/ui";

const QUICK = [
  { to: "/ask", label: "研究" },
  { to: "/stock", label: "个股工作台" },
  { to: "/documents", label: "公告文档" },
  { to: "/library", label: "研究库" },
  { to: "/mcp", label: "数据接入 MCP" },
] as const;

const quickLink = {
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  color: "var(--text-muted)",
  textDecoration: "none",
};

export function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid var(--border-subtle)",
        background: "var(--surface-card)",
      }}
    >
      <div style={{ ...SHELL, padding: "40px 24px", textAlign: "center" }}>
        <img src={LOGO_MASCOT} alt="AiphaBee" style={{ height: 44, marginBottom: 12 }} />
        <p style={{ margin: 0, fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
          © 2026 AiphaBee · 港股研究 Agent 与 MCP 数据平台
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
              {q.label}
            </Link>
          ))}
          <Link to="/ipos" style={{ ...quickLink, color: "var(--text-subtle)" }}>
            IPO Demo（已归档）
          </Link>
        </nav>
        <div style={{ maxWidth: 660, margin: "0 auto" }}>
          <Disclaimer />
        </div>
      </div>
    </footer>
  );
}
