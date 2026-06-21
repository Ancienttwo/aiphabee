import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { ScoreMeter } from "./ScoreMeter";

/**
 * SSR render smoke tests — the ported design-system components render to
 * markup with the expected brand tokens (no DOM/browser env required).
 */

describe("design-system render", () => {
  it("Button renders a <button> with its label and honey-primary token", () => {
    const html = renderToStaticMarkup(<Button>Start Analysis</Button>);
    expect(html.startsWith("<button")).toBe(true);
    expect(html).toContain("Start Analysis");
    expect(html).toContain("var(--honey-500)");
  });

  it("Badge applies the soft bullish tone", () => {
    const html = renderToStaticMarkup(
      <Badge tone="bullish" dot>
        牛市 Bullish
      </Badge>,
    );
    expect(html).toContain("牛市 Bullish");
    expect(html).toContain("var(--green-50)");
  });

  it("ScoreMeter clamps the fill width to 0–100%", () => {
    const html = renderToStaticMarkup(<ScoreMeter value={72} tone="bullish" />);
    expect(html).toContain("72");
    expect(html).toContain("width:72%");
  });
});
