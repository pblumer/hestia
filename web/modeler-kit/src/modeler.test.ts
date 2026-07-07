import { describe, it, expect } from "vitest";
import { createModeler } from "./modeler";

describe("createModeler", () => {
  it("verlangt einen Container", () => {
    // @ts-expect-error absichtlich ohne container aufgerufen
    expect(() => createModeler({})).toThrow(/container/i);
  });
});
