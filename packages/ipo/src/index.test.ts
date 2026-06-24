import { describe, expect, it } from "vitest";
import {
  IPO_ACCESS_POLICY,
  IPO_EXPECTED_NEWIPO_TABLES,
  compareIpos,
  createIpoWorkbenchSnapshot,
  screenIpos,
  searchIpoCalendar
} from "./index";

describe("ipo contract package", () => {
  it("captures the 18 NewIPO2.mdb physical table entries", () => {
    expect(IPO_EXPECTED_NEWIPO_TABLES).toHaveLength(18);
    expect(IPO_EXPECTED_NEWIPO_TABLES.map((table) => table.name)).toContain("Plan_Info");
    expect(IPO_EXPECTED_NEWIPO_TABLES.find((table) => table.name === "NewIPOInfo")).toMatchObject({
      name: "NewIPOInfo",
      primaryKey: "Code + ListingDate"
    });
  });

  it("separates supplier facts from AiphaBee research signal and redacts sensitive fields", () => {
    const snapshot = createIpoWorkbenchSnapshot({ ipoId: "honeycomb" });

    expect(snapshot.offering.hkexCode).toBe("2769");
    expect(snapshot.researchSignal.source).toBe("aiphabee_research");
    expect(snapshot.researchSignal.status).toBe("descriptive_signal_not_advice");
    expect(snapshot.cornerstones[0]).toMatchObject({
      amountText: null,
      redacted: true
    });
    expect(snapshot.accessPolicy).toEqual(IPO_ACCESS_POLICY);
  });

  it("screens, calendars, and compares using the same access policy", () => {
    const screen = screenIpos({ hasCornerstone: true, minOversubscription: 20 });
    const calendar = searchIpoCalendar({ eventTypes: ["listing"] });
    const comparison = compareIpos({ ipoIds: ["honeycomb", "lotus", "pearl"] });

    expect(screen.rows.map((row) => row.id)).toEqual(["honeycomb", "lotus"]);
    expect(calendar.events.every((event) => event.eventType === "listing")).toBe(true);
    expect(comparison.rows).toHaveLength(3);
    expect(comparison.accessPolicy.defaultRightsStatus).toBe("default_deny");
  });
});
