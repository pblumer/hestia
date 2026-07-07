// @hestia/modeler-kit — das gemeinsame Fundament beider Modeler und des Viewers.
//
// Baut auf diagram-js auf und zentralisiert Palette, Context-Pad, Selektion/Undo,
// Keybindings und Theming (INV-M2). Renderer beziehen Farben/Metriken
// ausschließlich aus den Tokens (INV-H2). Enthält KEIN BPMN-/DMN-Wissen.
export const KIT_NAME = "@hestia/modeler-kit";

export { createModeler } from "./modeler";
export type { Modeler, ModelerOptions } from "./modeler";
export { kitModules } from "./modules";
export { Theme, themeModule } from "./theme";
export {
  Keybindings,
  keybindingsModule,
  isCmd,
  isKey,
  isUndo,
  isRedo,
  isRemove,
} from "./keybindings";
