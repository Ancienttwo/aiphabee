// Evidence-first UI primitives — the product's core differentiator (PRD §8).
// Every number is traceable; epistemic status and cost are always explicit.

export { AnswerLayerTag, type AnswerLayer } from "./AnswerLayerTag";
export { EvidenceStrength, type Strength } from "./EvidenceStrength";
export { EvidenceCard, type EvidenceCardProps } from "./EvidenceCard";
export {
  AmbiguityResolver,
  type AmbiguityResolverProps,
} from "./AmbiguityResolver";
export { ToolProgressStream } from "./ToolProgressStream";
export { CostConfirmGate, type CostConfirmGateProps } from "./CostConfirmGate";
export {
  UntrustedDocumentView,
  sanitizeUntrusted,
  type UntrustedDocumentViewProps,
} from "./UntrustedDocumentView";
export { NoviceProToggle } from "./NoviceProToggle";
