// Das kuratierte diagram-js-Modul-Set des Kits. Hier — und nur hier — wird das
// einheitliche Interaktions-Look-and-Feel als Code festgelegt (INV-M2). Modeler
// und Viewer setzen darauf auf; BPMN-/DMN-Wissen kommt NICHT hierher.
import SelectionModule from "diagram-js/lib/features/selection";
import MoveModule from "diagram-js/lib/features/move";
import ModelingModule from "diagram-js/lib/features/modeling";
import PaletteModule from "diagram-js/lib/features/palette";
import ContextPadModule from "diagram-js/lib/features/context-pad";
import KeyboardModule from "diagram-js/lib/features/keyboard";
import KeyboardMoveSelectionModule from "diagram-js/lib/features/keyboard-move-selection";
import OverlaysModule from "diagram-js/lib/features/overlays";
import ZoomScrollModule from "diagram-js/lib/navigation/zoomscroll";
import MoveCanvasModule from "diagram-js/lib/navigation/movecanvas";

import themeModule from "./theme";
import keybindingsModule from "./keybindings";

// Reihenfolge unkritisch; diagram-js löst __depends__ der Features selbst auf.
export const kitModules: unknown[] = [
  SelectionModule,
  MoveModule,
  ModelingModule,
  PaletteModule,
  ContextPadModule,
  KeyboardModule,
  KeyboardMoveSelectionModule,
  OverlaysModule,
  ZoomScrollModule,
  MoveCanvasModule,
  themeModule,
  keybindingsModule,
];
