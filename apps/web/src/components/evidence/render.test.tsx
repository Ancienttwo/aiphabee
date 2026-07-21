import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AnswerLayerTag } from "./AnswerLayerTag";
import { EvidenceStrength } from "./EvidenceStrength";
import { EvidenceCard } from "./EvidenceCard";
import { AmbiguityResolver } from "./AmbiguityResolver";
import { ToolProgressStream } from "./ToolProgressStream";
import { CostConfirmGate } from "./CostConfirmGate";
import { UntrustedDocumentView, sanitizeUntrusted } from "./UntrustedDocumentView";
import { NoviceProToggle } from "./NoviceProToggle";
import { ResponseDepthProvider } from "../../lib/context/ResponseDepthContext";
import { LocaleProvider } from "../../i18n/locale";
import type {
  AgentProgressStreamEvent,
  ResolveSecurityCandidate,
} from "../../lib/api";

const CANDIDATE: ResolveSecurityCandidate = {
  currency: "HKD",
  exchange: "HKEX",
  instrumentId: "INST-700",
  listingId: "L-700",
  market: "HK",
  matchReason: "symbol",
  name: { en: "Tencent", zhHans: "腾讯", zhHant: "騰訊" },
  status: "listed",
  symbol: "00700.HK",
  validFrom: "2004-06-16",
};

const EVENT: AgentProgressStreamEvent = {
  event: "tool.call.started",
  event_index: 1,
  payload: {
    execution: "planned_no_call",
    public_label: "正在查行情",
    request_id: "r",
    run_id: "run",
    status: "started",
    tool_name: "get_quote_snapshot",
  },
};

function render(node: React.ReactNode): string {
  return renderToStaticMarkup(<LocaleProvider>{node}</LocaleProvider>);
}

describe("evidence primitives render (SSR)", () => {
  it("AnswerLayerTag shows the layer label", () => {
    expect(render(<AnswerLayerTag layer="fact" />)).toContain("事實");
  });

  it("EvidenceStrength shows a qualitative label and never a percentage", () => {
    const html = render(<EvidenceStrength strength="strong" />);
    expect(html).toContain("證據強");
    expect(html).not.toContain("%");
  });

  it("EvidenceCard renders its trigger label while collapsed", () => {
    const html = render(
      <EvidenceCard asOf="2026-06-23T00:00:00.000Z" />,
    );
    expect(html).toContain("查看證據來源");
  });

  it("AmbiguityResolver lists candidates and offers a choice (no auto-select)", () => {
    const html = render(
      <AmbiguityResolver query="腾讯" candidates={[CANDIDATE]} onSelect={() => {}} />,
    );
    // Wire payload carries the 5-digit "00700.HK" symbol (see CANDIDATE
    // above); the UI renders the market's minimum-4-digit main-board
    // display convention, "0700.HK" (formatHkSymbol).
    expect(html).toContain("0700.HK");
    expect(html).not.toContain("00700.HK");
    expect(html).toContain("選擇");
  });

  it("ToolProgressStream exposes public labels only, not internal tool names", () => {
    const html = render(<ToolProgressStream events={[EVENT]} />);
    expect(html).toContain("正在查行情");
    expect(html).not.toContain("get_quote_snapshot");
  });

  it("CostConfirmGate shows the estimated credits when open", () => {
    const html = render(
      <CostConfirmGate open estimatedCredits={120} onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect(html).toContain("120 credits");
  });

  it("CostConfirmGate renders nothing when closed", () => {
    const html = render(
      <CostConfirmGate open={false} estimatedCredits={1} onConfirm={() => {}} onCancel={() => {}} />,
    );
    expect(html).toBe("");
  });

  it("UntrustedDocumentView strips scripts (DOC-03)", () => {
    const html = render(
      <UntrustedDocumentView content={"安全<script>alert(1)</script>文本"} />,
    );
    expect(html).toContain("不可信內容");
    expect(html).not.toContain("alert(1)");
  });

  it("sanitizeUntrusted removes script tags", () => {
    expect(sanitizeUntrusted("<script>x</script>hi")).toBe("hi");
  });

  it("NoviceProToggle renders both modes inside its provider", () => {
    const html = renderToStaticMarkup(
      <LocaleProvider>
        <ResponseDepthProvider>
          <NoviceProToggle />
        </ResponseDepthProvider>
      </LocaleProvider>,
    );
    expect(html).toContain("入門");
    expect(html).toContain("專業");
  });
});
