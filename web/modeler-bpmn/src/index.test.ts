import { describe, it, expect } from "vitest";
import { BPMN_MODELER } from "./index";

describe("modeler-bpmn", () => {
  it("setzt auf dem Kit auf (INV-M1)", () => {
    expect(BPMN_MODELER).toContain("@hestia/modeler-kit");
  });
});
