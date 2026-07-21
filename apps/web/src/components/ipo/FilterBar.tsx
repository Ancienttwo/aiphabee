import type { ReactNode } from "react";
import { Icon } from "../../ds";
import type { IpoSector } from "../../lib/api/ipo-types";
import { IPO_SECTOR_MESSAGE, useIpoLocale } from "./i18n";

export type SectorFilter = IpoSector | "all";

export interface FilterBarProps {
  sector: SectorFilter;
  setSector: (s: SectorFilter) => void;
  sort: string;
  setSort: (s: string) => void;
  q: string;
  setQ: (s: string) => void;
}

function selectEl(
  value: string,
  onChange: (v: string) => void,
  opts: [string, string][],
): ReactNode {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          cursor: "pointer",
          padding: "8px 30px 8px 12px",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-default)",
          background: "var(--surface-card)",
          font: "inherit",
          fontSize: "var(--text-sm)",
          fontWeight: 600,
          color: "var(--text-body)",
        }}
      >
        {opts.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <Icon
        name="chevron-down"
        size={14}
        style={{ position: "absolute", right: 10, pointerEvents: "none", color: "var(--text-subtle)" }}
      />
    </div>
  );
}

/** Search + sector + sort controls for the IPO pipeline. */
export function FilterBar({ sector, setSector, sort, setSort, q, setQ }: FilterBarProps) {
  const { t } = useIpoLocale();
  const sectors: [string, string][] = [
    ["all", t("allSectors")],
    ...Object.entries(IPO_SECTOR_MESSAGE).map(([key, message]) => [key, t(message)] as [string, string]),
  ];
  const sorts: [string, string][] = [
    ["sub", t("sortSubscription")],
    ["score", t("sortScore")],
    ["listing", t("sortListing")],
  ];
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
      <div
        style={{
          position: "relative",
          flex: "1 1 240px",
          minWidth: 200,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Icon name="search" size={16} style={{ position: "absolute", left: 12, color: "var(--text-subtle)" }} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label={t("searchLabel")}
          placeholder={t("searchPlaceholder")}
          style={{
            width: "100%",
            padding: "9px 12px 9px 34px",
            borderRadius: "var(--radius-md)",
            border: "1px solid var(--border-default)",
            background: "var(--surface-card)",
            font: "inherit",
            fontSize: "var(--text-sm)",
            color: "var(--text-body)",
          }}
        />
      </div>
      {selectEl(sector, (v) => setSector(v as SectorFilter), sectors)}
      {selectEl(sort, setSort, sorts)}
    </div>
  );
}
