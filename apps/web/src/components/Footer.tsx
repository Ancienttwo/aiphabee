import { Disclaimer } from "./Disclaimer";
import { LOGO_MASCOT, SHELL } from "../lib/ui";

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
          © 2026 AiphaBee · 港股 IPO 投研 · Insight 平台
        </p>
        <div style={{ maxWidth: 660, margin: "12px auto 0" }}>
          <Disclaimer />
        </div>
      </div>
    </footer>
  );
}
