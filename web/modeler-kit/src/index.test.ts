import { describe, it, expect } from "vitest";
import { KIT_NAME, kitAccent } from "./index";

describe("modeler-kit", () => {
  it("exportiert seinen Namen", () => {
    expect(KIT_NAME).toBe("@hestia/modeler-kit");
  });

  it("bezieht Theming aus der Token-SSOT (INV-H2)", () => {
    expect(kitAccent).toMatch(/^#/);
  });
});
