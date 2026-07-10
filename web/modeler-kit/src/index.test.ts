import { describe, it, expect } from "vitest";
import { KIT_NAME, createModeler, kitModules } from "./index";

describe("modeler-kit API", () => {
  it("exportiert Namen, Fabrik und Modul-Set", () => {
    expect(KIT_NAME).toBe("@hestia/modeler-kit");
    expect(typeof createModeler).toBe("function");
    expect(kitModules.length).toBeGreaterThan(0);
  });
});
