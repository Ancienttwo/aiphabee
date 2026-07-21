import { useEffect, useRef, useState, type CSSProperties } from "react";
import { SUPPORTED_LOCALES, useLocale, type Locale } from "./locale";

const localeLabels: Record<Locale, { compact: string; full: string }> = {
  "zh-Hant": { compact: "繁中", full: "繁體中文" },
  "zh-Hans": { compact: "简中", full: "简体中文" },
  en: { compact: "EN", full: "English" },
};

const triggerStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 52,
  height: 34,
  padding: "0 10px",
  borderRadius: "var(--radius-pill)",
  border: "1px solid var(--border-subtle)",
  background: "var(--surface-card)",
  color: "var(--text-primary)",
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
  fontSize: "var(--text-xs)",
  fontWeight: 600,
};

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        aria-label={`${t("language")}: ${localeLabels[locale].full}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t("language")}
        onClick={() => setOpen((value) => !value)}
        style={triggerStyle}
      >
        {localeLabels[locale].compact}
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={t("language")}
          style={{
            position: "absolute",
            top: 40,
            right: 0,
            zIndex: 80,
            minWidth: 132,
            padding: 6,
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            background: "var(--surface-card)",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {SUPPORTED_LOCALES.map((option) => (
            <button
              key={option}
              type="button"
              role="menuitemradio"
              aria-checked={option === locale}
              onClick={() => {
                setLocale(option);
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                padding: "8px 10px",
                border: 0,
                borderRadius: "var(--radius-sm)",
                background: option === locale ? "var(--honey-100)" : "transparent",
                color: "var(--text-primary)",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "var(--font-sans)",
                fontSize: "var(--text-sm)",
              }}
            >
              {localeLabels[option].full}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
