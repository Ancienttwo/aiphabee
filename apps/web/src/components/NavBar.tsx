import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { CSSProperties } from "react";
import { Icon } from "../ds";
import { NoviceProToggle } from "./evidence";
import { LOGO_MASCOT, SHELL } from "../lib/ui";

// PRD §5.2 primary navigation. 账户 is reached via the avatar on the right.
const NAV = [
  { to: "/ask", label: "研究" },
  { to: "/stock", label: "股票" },
  { to: "/screen", label: "筛选" },
  { to: "/compare", label: "比较" },
  { to: "/watchlist", label: "观察" },
  { to: "/documents", label: "文档" },
  { to: "/mcp", label: "数据接入" },
] as const;

const navLinkBase: CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-sm)",
  fontWeight: 500,
  color: "var(--text-muted)",
  borderBottom: "2px solid transparent",
  padding: "4px 2px",
  textDecoration: "none",
  whiteSpace: "nowrap",
};

const iconButton: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 34,
  height: 34,
  borderRadius: "var(--radius-pill)",
  border: "1px solid var(--border-subtle)",
  background: "var(--surface-card)",
  cursor: "pointer",
  color: "var(--text-muted)",
};

export function NavBar() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);
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
          height: "var(--nav-height)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <Link
          to="/"
          style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", flexShrink: 0 }}
        >
          <img src={LOGO_MASCOT} alt="AiphaBee" style={{ height: 36, width: "auto" }} />
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

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            overflowX: "auto",
            margin: "0 8px",
          }}
        >
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} style={linkStyle(item.to)}>
              {item.label}
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <button
            type="button"
            aria-label="搜索证券"
            title="搜索证券"
            style={iconButton}
            onClick={() => navigate({ to: "/stock" })}
          >
            <Icon name="search" size={16} />
          </button>
          <NoviceProToggle />
          <button
            type="button"
            aria-label="账户"
            title="账户"
            style={iconButton}
            onClick={() => navigate({ to: "/account" })}
          >
            <Icon name="user" size={16} />
          </button>
        </div>
      </div>
    </nav>
  );
}
