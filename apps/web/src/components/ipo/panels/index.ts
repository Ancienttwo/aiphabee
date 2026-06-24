/**
 * IPO detail-workbench panel renderers + small atoms, ported from the design
 * prototype (`docs/AiphaBee Design System/apps/ipo-workbench/{detail,detail-parts}.jsx`).
 * One concern per file; composed by the `/ipos/$ipoId` workbench shell.
 */
export { Panel, type PanelProps } from "./Panel";
export { TopKpi, type TopKpiProps } from "./TopKpi";
export { RiskRow } from "./RiskRow";
export { Timeline } from "./Timeline";
export { TermsGrid } from "./TermsGrid";
export { PoolClawback } from "./PoolClawback";
export { Allotment } from "./Allotment";
export { Cornerstones } from "./Cornerstones";
export { Lockup } from "./Lockup";
export { Proceeds, CompanyTable, AppTiers } from "./Profile";
export { offerText, demandTone } from "./helpers";
