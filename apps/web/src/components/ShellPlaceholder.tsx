import { useEffect, useState, type ReactNode } from "react";
import { Badge, MascotState, type MascotStatePose } from "../ds";
import { MASCOT_BP, SHELL } from "../lib/ui";
import type { ResponseEnvelope, RuntimeCapabilities } from "../lib/api";
import { useLocale } from "../i18n/locale";

/**
 * Shared scaffold for the Phase-1 module shells. Renders the module's header +
 * purpose, a mascot empty-state, and — when given a `probe` — a live check
 * against the worker's `GET /<module>/runtime` capability (synthetic-backed),
 * so even placeholder pages prove the API integration is wired.
 */
type ProbeState = "checking" | "online" | "unavailable";

export interface ShellPlaceholderProps {
  title: string;
  description: string;
  pose?: MascotStatePose;
  badge?: string;
  probe?: () => Promise<ResponseEnvelope<RuntimeCapabilities>>;
  children?: ReactNode;
}

function CapabilityBadge({ state }: { state: ProbeState }) {
  const { t } = useLocale();
  const map = {
    checking: { tone: "neutral", label: t("capabilityChecking") },
    online: { tone: "bullish", label: t("capabilityOnline") },
    unavailable: { tone: "warning", label: t("capabilityUnavailable") },
  } as const;
  const m = map[state];
  return (
    <Badge tone={m.tone} variant="soft" size="sm" dot>
      {m.label}
    </Badge>
  );
}

export function ShellPlaceholder({
  title,
  description,
  pose = "forage",
  badge,
  probe,
  children,
}: ShellPlaceholderProps) {
  const { t } = useLocale();
  const [state, setState] = useState<ProbeState>("checking");

  useEffect(() => {
    if (!probe) return;
    let active = true;
    setState("checking");
    probe()
      .then((env) => active && setState(env.ok ? "online" : "unavailable"))
      .catch(() => active && setState("unavailable"));
    return () => {
      active = false;
    };
  }, [probe]);

  return (
    <main style={{ ...SHELL, paddingTop: 48, paddingBottom: 72 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-display)",
            fontSize: "var(--text-3xl)",
            fontWeight: 700,
            color: "var(--text-primary)",
            letterSpacing: "var(--tracking-tight)",
          }}
        >
          {title}
        </h1>
        <Badge tone="honey" variant="soft" size="sm">
          {badge ?? t("comingSoon")}
        </Badge>
        {probe ? <CapabilityBadge state={state} /> : null}
      </div>
      <p
        style={{
          margin: "8px 0 0",
          maxWidth: 640,
          fontSize: "var(--text-base)",
          lineHeight: "var(--leading-relaxed)",
          color: "var(--text-body)",
        }}
      >
        {description}
      </p>
      <MascotState
        pose={pose}
        basePath={MASCOT_BP}
        description={t("moduleUnderConstruction")}
        style={{ marginTop: 8 }}
      />
      {children}
    </main>
  );
}
