// @hestia/modeler-kit — das gemeinsame Fundament beider Modeler und des Viewers.
//
// Baut auf diagram-js auf und zentralisiert Palette, Context-Pad, Selektion/Undo,
// Properties-Panel-Integration, Keybindings und Theming (INV-M2). Renderer
// beziehen Farben/Metriken ausschließlich aus den Tokens (INV-H2).
//
// Enthält KEIN BPMN-/DMN-Wissen — das liegt in modeler-bpmn / modeler-dmn.
// Ausbau in Schritt 3 (siehe docs/hestia-concept.md, ADR-0003).
import { tokens } from "@hestia/tokens";

export const KIT_NAME = "@hestia/modeler-kit";

/** Beleg, dass Theming aus der Token-SSOT fließt (INV-H2). */
export const kitAccent: string = tokens["color-accent"];
