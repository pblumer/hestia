import { describe, it, expect } from "vitest";
import { DMN_MODELER } from "./index";

describe("modeler-dmn", () => {
  it("setzt auf dem Kit auf (INV-M1)", () => {
    expect(DMN_MODELER).toContain("@hestia/modeler-kit");
  });
});
