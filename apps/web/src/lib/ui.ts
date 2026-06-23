import type { CSSProperties } from "react";

/** Centered max-width content shell (1280px) with 24px gutters. */
export const SHELL: CSSProperties = {
  maxWidth: "var(--container-max)",
  margin: "0 auto",
  padding: "0 24px",
  boxSizing: "border-box",
  width: "100%",
};

/** Public asset paths (copied into apps/web/public). */
export const MASCOT_BP = "/mascot";
export const LOGO_FULL = "/brand/aiphabee-logo-full.png";
export const LOGO_MASCOT = "/brand/aiphabee-mascot.png";
