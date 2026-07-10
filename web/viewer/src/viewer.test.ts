import { describe, it, expect } from "vitest";
import PaletteModule from "diagram-js/lib/features/palette";
import ModelingModule from "diagram-js/lib/features/modeling";
import ContextPadModule from "diagram-js/lib/features/context-pad";
import OverlaysModule from "diagram-js/lib/features/overlays";
import { createViewer, viewerModules, VIEWER } from "./index";

describe("viewer", () => {
  it("ist read-only: keine Editing-Module (INV-O1)", () => {
    expect(viewerModules).not.toContain(PaletteModule);
    expect(viewerModules).not.toContain(ModelingModule);
    expect(viewerModules).not.toContain(ContextPadModule);
  });

  it("bringt den Overlay-Layer mit (INV-O2)", () => {
    expect(viewerModules).toContain(OverlaysModule);
  });

  it("createViewer verlangt einen Container", () => {
    // @ts-expect-error absichtlich ohne container
    expect(() => createViewer({})).toThrow(/container/i);
    expect(VIEWER).toBe("@hestia/viewer");
  });
});
