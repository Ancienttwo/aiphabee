import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState, type CSSProperties } from "react";
import { Icon } from "../ds";
import { NoviceProToggle } from "./evidence";
import { LOGO_MASCOT, SHELL } from "../lib/ui";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";
import { useLocale, type MessageKey } from "../i18n/locale";

// PRD §5.2 primary navigation. The account page is reached via the avatar.
const NAV = [
  { to: "/ask", label: "research" },
  { to: "/stock", label: "stock" },
  { to: "/screen", label: "screen" },
  { to: "/compare", label: "compare" },
  { to: "/watchlist", label: "watchlist" },
  { to: "/documents", label: "documents" },
  { to: "/mcp", label: "mcp" },
] as const satisfies ReadonlyArray<{ to: string; label: MessageKey }>;

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

/** Light/dark toggle. data-theme is set pre-paint by the init script in
 *  __root.tsx; this syncs the displayed icon after hydration and persists. */
function ThemeToggle() {
  const { t } = useLocale();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const cur = document.documentElement.getAttribute("data-theme");
    if (cur === "dark" || cur === "light") setTheme(cur);
  }, []);
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("aiphabee-theme", next);
    } catch {
      /* private mode / storage disabled — ignore */
    }
  };
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? t("themeLight") : t("themeDark")}
      title={t("theme")}
      style={iconButton}
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} size={16} />
    </button>
  );
}

export function NavBar() {
  const { t } = useLocale();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const isActive = (to: string) => pathname === to || pathname.startsWith(`${to}/`);
  const linkStyle = (to: string): CSSProperties =>
    isActive(to)
      ? { ...navLinkBase, color: "var(--text-primary)", borderBottom: "2px solid var(--honey-500)" }
      : navLinkBase;

  // Close the mobile menu whenever the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        borderBottom: "1px solid var(--border-subtle)",
        background: "var(--surface-nav)",
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
          aria-current={isActive("/") ? "page" : undefined}
        >
          <img src={LOGO_MASCOT} alt="AiphaBee" style={{ height: 36, width: "auto" }} />
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "var(--text-xl)",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "var(--tracking-tight)",
            }}
          >
            AiphaBee
          </span>
        </Link>

        <div className="nav-links-desktop" style={{ alignItems: "center", gap: 20, margin: "0 8px" }}>
          {NAV.map((item) => (
            <Link key={item.to} to={item.to} style={linkStyle(item.to)} aria-current={isActive(item.to) ? "page" : undefined}>
              {t(item.label)}
            </Link>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div className="nav-actions-desktop" style={{ alignItems: "center", gap: 10 }}>
            <button
              type="button"
              aria-label={t("searchSecurity")}
              title={t("searchSecurity")}
              style={iconButton}
              onClick={() => navigate({ to: "/stock" })}
            >
              <Icon name="search" size={16} />
            </button>
            <NoviceProToggle />
            <button
              type="button"
              aria-label={t("account")}
              title={t("account")}
              style={iconButton}
              onClick={() => navigate({ to: "/account" })}
            >
              <Icon name="user" size={16} />
            </button>
          </div>
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            type="button"
            className="nav-hamburger"
            aria-label={t("mainMenu")}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((o) => !o)}
            style={iconButton}
          >
            <Icon name={open ? "x" : "menu"} size={18} />
          </button>
        </div>
      </div>

      {open ? (
        <div id="mobile-menu" className="nav-mobile-menu" style={{ background: "var(--surface-card)", borderTop: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-md)" }}>
          <div style={{ ...SHELL, paddingTop: 8, paddingBottom: 14, display: "flex", flexDirection: "column" }}>
            {NAV.map((item) => (
              <Link key={item.to} to={item.to} className="nav-mobile-link" aria-current={isActive(item.to) ? "page" : undefined}>
                {t(item.label)}
              </Link>
            ))}
            <Link to="/stock" className="nav-mobile-link" aria-current={isActive("/stock") ? "page" : undefined}>
              {t("stockSearch")}
            </Link>
            <Link to="/account" className="nav-mobile-link" aria-current={isActive("/account") ? "page" : undefined}>
              {t("account")}
            </Link>
            <div style={{ paddingTop: 12 }}>
              <NoviceProToggle />
            </div>
          </div>
        </div>
      ) : null}
    </nav>
  );
}
