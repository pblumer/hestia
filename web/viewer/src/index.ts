// @hestia/viewer — read-only-Diagrammanzeige für Operate.
//
// INV-O1: nutzt DENSELBEN diagram-js-Renderer wie die Modeler (hereingereicht
//   über additionalModules), nur ohne Editing-Module — kein zweiter Renderer.
// INV-O2: Token-Animation, Heatmaps und Instanz-Overlays liegen im
//   Overlay-Layer und verändern das zugrunde liegende Modell nicht.
export const VIEWER = "@hestia/viewer";

export { createViewer, viewerModules } from "./viewer";
export type { Viewer, OverlayPosition } from "./viewer";
