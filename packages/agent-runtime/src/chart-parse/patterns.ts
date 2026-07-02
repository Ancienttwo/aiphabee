/**
 * Closed vocabulary of classic chart patterns the vision parser may report.
 *
 * Seeded from the 16-pattern list in QuantAgent `pattern_agent.py`
 * (Y-Research-SBU/QuantAgent, MIT). The upstream list is long-biased and
 * bundles "Rounded Top / Rounded Bottom" into one row, so this vocabulary
 * splits that row and adds the symmetric bearish counterparts
 * (`head_and_shoulders_top`, `double_top`) for 18 entries total.
 */
export const CHART_PATTERN_VALUES = [
  "head_and_shoulders_top",
  "inverse_head_and_shoulders",
  "double_top",
  "double_bottom",
  "rounded_top",
  "rounded_bottom",
  "hidden_base",
  "falling_wedge",
  "rising_wedge",
  "ascending_triangle",
  "descending_triangle",
  "bullish_flag",
  "bearish_flag",
  "rectangle",
  "island_reversal",
  "v_shaped_reversal",
  "expanding_triangle",
  "symmetrical_triangle"
] as const;

export type ChartPatternName = (typeof CHART_PATTERN_VALUES)[number];

export const CHART_PATTERN_DESCRIPTIONS: Readonly<Record<ChartPatternName, string>> =
  Object.freeze({
    head_and_shoulders_top:
      "Three peaks with the middle one being the highest, symmetrical structure, typically indicates an upcoming downward trend.",
    inverse_head_and_shoulders:
      "Three lows with the middle one being the lowest, symmetrical structure, typically indicates an upcoming upward trend.",
    double_top:
      "Two similar high points with a pullback in between, forming an 'M' shape.",
    double_bottom:
      "Two similar low points with a rebound in between, forming a 'W' shape.",
    rounded_top:
      "Gradual price rise followed by a gradual decline, forming an inverted 'U' shape.",
    rounded_bottom:
      "Gradual price decline followed by a gradual rise, forming a 'U' shape.",
    hidden_base:
      "Horizontal consolidation followed by a sudden upward breakout.",
    falling_wedge: "Price narrows downward, usually breaks out upward.",
    rising_wedge: "Price rises slowly but converges, often breaks down.",
    ascending_triangle:
      "Rising support line with a flat resistance on top, breakout often occurs upward.",
    descending_triangle:
      "Falling resistance line with flat support at the bottom, typically breaks down.",
    bullish_flag:
      "After a sharp rise, price consolidates downward briefly before continuing upward.",
    bearish_flag:
      "After a sharp drop, price consolidates upward briefly before continuing downward.",
    rectangle: "Price fluctuates between horizontal support and resistance.",
    island_reversal:
      "Two price gaps in opposite directions forming an isolated price island.",
    v_shaped_reversal:
      "Sharp decline followed by sharp recovery, or vice versa.",
    expanding_triangle:
      "Highs and lows increasingly wider, indicating volatile swings.",
    symmetrical_triangle:
      "Highs and lows converge toward the apex, usually followed by a breakout."
  });
