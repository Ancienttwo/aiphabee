import { describe, expect, it } from "vitest";
import { toSessionState } from "./SessionContext";

describe("SessionContext", () => {
  it("is anonymous by default and never invents a product identity", () => {
    expect(toSessionState(undefined, false)).toEqual({
      isAuthenticated: false,
      isPending: false,
    });
  });

  it("preserves pending state without claiming authentication", () => {
    expect(toSessionState(null, true)).toEqual({
      isAuthenticated: false,
      isPending: true,
    });
  });

  it("maps only Better Auth user fields and does not synthesize a plan", () => {
    expect(
      toSessionState(
        {
          email: "researcher@example.com",
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Researcher",
        },
        false,
      ),
    ).toEqual({
      email: "researcher@example.com",
      isAuthenticated: true,
      isPending: false,
      name: "Researcher",
      userId: "123e4567-e89b-12d3-a456-426614174000",
    });
  });
});
