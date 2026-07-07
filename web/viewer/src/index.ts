// @hestia/viewer — read-only-Diagrammanzeige für Operate.
//
// INV-O1: nutzt DENSELBEN diagram-js-Renderer wie die Modeler (aus modeler-kit),
//   nur mit deaktivierter Palette und Modeling-Kommandos — kein zweiter Renderer.
// INV-O2: Token-Animation, Heatmaps und Instanz-Overlays liegen in einem eigenen
//   Overlay-Layer und verändern das Modell nicht. Ausbau in Schritt 6.
import { KIT_NAME } from "@hestia/modeler-kit";

export const VIEWER = `read-only-viewer auf ${KIT_NAME}`;
