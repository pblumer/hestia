import { describe, it, expect } from "vitest";
import { VIEWER } from "./index";

describe("viewer", () => {
  it("nutzt den Kit-Renderer (INV-O1)", () => {
    expect(VIEWER).toContain("@hestia/modeler-kit");
  });
});
