import { describe, it, expect } from "vitest";
import PaletteModule from "diagram-js/lib/features/palette";
import SelectionModule from "diagram-js/lib/features/selection";
import { kitModules } from "./modules";
import { themeModule } from "./theme";
import { keybindingsModule } from "./keybindings";

describe("kitModules-Komposition", () => {
  it("enthält die zentralen diagram-js-Features (INV-M2)", () => {
    expect(kitModules).toContain(PaletteModule);
    expect(kitModules).toContain(SelectionModule);
  });

  it("enthält Kit-eigenes Theming und Keybindings", () => {
    expect(kitModules).toContain(themeModule);
    expect(kitModules).toContain(keybindingsModule);
  });
});
