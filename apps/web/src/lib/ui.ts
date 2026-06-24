import type { CSSProperties } from "react";

/** Centered max-width content shell (1280px); gutter narrows on mobile
 *  via the responsive --content-gutter token (see aiphabee.css). */
export const SHELL: CSSProperties = {
  maxWidth: "var(--container-max)",
  margin: "0 auto",
  padding: "0 var(--content-gutter)",
};

/** Public asset paths (copied into apps/web/public). */
export const MASCOT_BP = "/mascot";
export const LOGO_FULL = "/brand/aiphabee-logo-full.png";
export const LOGO_MASCOT = "/brand/aiphabee-mascot.png";
