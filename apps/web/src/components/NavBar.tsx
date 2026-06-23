import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { Button } from "../ds";
import { LOGO_MASCOT, SHELL } from "../lib/ui";

const navLinkBase: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-sm)",
  fontWeight: 500,
  color: "var(--text-muted)",
  borderBottom: "2px solid transparent",
  padding: "4px 2px",
  textDecoration: "none",
};

export function NavBar() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname.startsWith(to);
  const linkStyle = (to: string): CSSProperties =>
    isActive(to)
      ? { ...navLinkBase, color: "var(--ink-800)", borderBottom: "2px solid var(--honey-500)" }
      : navLinkBase;

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid var(--border-subtle)",
        background: "rgba(255,255,255,0.82)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      }}
    >
      <div
        style={{
          ...SHELL,
          minHeight: "var(--nav-height)",
          paddingBottom: 10,
          paddingTop: 10,
          display: "flex",
          alignItems: "center",
          gap: 16,
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flex: "0 0 auto" }} aria-current={isActive("/") ? "page" : undefined}>
          <img src={LOGO_MASCOT} alt="AiphaBee" style={{ height: 38, width: "auto" }} />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: 700,
              color: "var(--ink-800)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            AiphaBee
          </span>
        </Link>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "10px 22px", flex: "1 1 320px", flexWrap: "wrap", maxWidth: "100%", minWidth: 0 }}>
          <Link to="/dashboard" style={linkStyle("/dashboard")} aria-current={isActive("/dashboard") ? "page" : undefined}>
            Dashboard
          </Link>
          <Link to="/ipos" style={linkStyle("/ipos")} aria-current={isActive("/ipos") ? "page" : undefined}>
            Browse IPOs
          </Link>
          <Link to="/analysis" style={linkStyle("/analysis")} aria-current={isActive("/analysis") ? "page" : undefined}>
            Analysis
          </Link>
          <Link to="/ask" style={linkStyle("/ask")} aria-current={isActive("/ask") ? "page" : undefined}>
            Ask
          </Link>
          <Link to="/research" style={linkStyle("/research")} aria-current={isActive("/research") ? "page" : undefined}>
            Research
          </Link>
          <Link to="/developer-console" style={linkStyle("/developer-console")} aria-current={isActive("/developer-console") ? "page" : undefined}>
            Console
          </Link>
          <Button size="sm" onClick={() => navigate({ to: "/dashboard" })}>
            Get Started
          </Button>
        </div>
      </div>
    </nav>
  );
}
