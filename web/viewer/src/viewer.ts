/* eslint-disable @typescript-eslint/no-explicit-any */
// Read-only-Viewer: dieselbe diagram-js-Basis wie die Modeler, aber OHNE
// Editing-Module (kein Palette/Context-Pad/Move/Modeling/Keybindings) — genau
// EIN Renderer (INV-O1). Der konkrete Renderer (bpmn/dmn) wird als Modul
// hereingereicht. Overlays (Token/Heatmap) liegen in einem eigenen Layer und
// verändern das Modell nicht (INV-O2).
import DiagramDefault from "diagram-js";
import OverlaysModule from "diagram-js/lib/features/overlays";
import SelectionModule from "diagram-js/lib/features/selection";
import ZoomScrollModule from "diagram-js/lib/navigation/zoomscroll";
import MoveCanvasModule from "diagram-js/lib/navigation/movecanvas";
import { themeModule, type Theme } from "@hestia/modeler-kit";

// Read-only-Modulset: Anzeige + Navigation + Overlays + Theming. KEIN Editing.
export const viewerModules: unknown[] = [
  themeModule,
  OverlaysModule,
  SelectionModule,
  ZoomScrollModule,
  MoveCanvasModule,
];

export interface OverlayPosition {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}

export interface Viewer {
  get<T = unknown>(name: string): T;
  /** Freies Overlay an ein Element hängen (INV-O2: eigener Layer). */
  addOverlay(elementId: string, html: string, position?: OverlayPosition): string;
  /** Token-Marker (simulierte Instanz-Animation für Operate). */
  showToken(elementId: string): string;
  /** Heatmap: Intensität 0..1 je Element als getönte Auflage (Farbe aus Tokens). */
  applyHeatmap(intensities: Record<string, number>): void;
  clearOverlays(): void;
  destroy(): void;
}

interface DiagramOptions {
  canvas?: { container: HTMLElement };
  modules?: unknown[];
  [key: string]: unknown;
}
type DiagramCtor = new (options: DiagramOptions) => any;
const Diagram = DiagramDefault as unknown as DiagramCtor;

export function createViewer(options: {
  container: HTMLElement;
  additionalModules?: unknown[];
}): Viewer {
  if (!options || !options.container) {
    throw new Error("createViewer: 'container' ist erforderlich");
  }
  const diagram = new Diagram({
    canvas: { container: options.container },
    modules: [...viewerModules, ...(options.additionalModules ?? [])],
  });
  const overlays = diagram.get("overlays");
  const theme = diagram.get("theme") as Theme;

  return {
    get: (name: string) => diagram.get(name),
    addOverlay: (elementId, html, position = { bottom: 0, right: 0 }) =>
      overlays.add(elementId, { position, html }),
    showToken: (elementId) => {
      const c = theme.token("color-accent");
      return overlays.add(elementId, {
        position: { top: -6, left: -6 },
        html: `<div class="hestia-token" style="width:12px;height:12px;border-radius:50%;background:${c};box-shadow:0 0 6px ${c}"></div>`,
      });
    },
    applyHeatmap: (intensities) => {
      const danger = theme.token("color-danger");
      for (const [elementId, value] of Object.entries(intensities)) {
        const opacity = Math.max(0, Math.min(1, value));
        overlays.add(elementId, {
          position: { top: 0, left: 0 },
          html: `<div class="hestia-heat" style="width:100px;height:80px;background:${danger};opacity:${opacity};pointer-events:none"></div>`,
        });
      }
    },
    clearOverlays: () => overlays.clear(),
    destroy: () => diagram.destroy(),
  };
}
