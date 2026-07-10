import { describe, it, expect } from "vitest";
import { Theme } from "./theme";
import { tokens } from "@hestia/tokens";

describe("Theme", () => {
  it("liefert Tokenwerte aus der SSOT (INV-H2)", () => {
    const theme = new Theme();
    expect(theme.token("color-accent")).toBe(tokens["color-accent"]);
    expect(theme.token("space-4")).toBe(tokens["space-4"]);
  });
});
