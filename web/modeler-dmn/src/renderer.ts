/* eslint-disable @typescript-eslint/no-explicit-any */
// DRD-Renderer für DMN-1.5-Konstrukte, aufgesetzt auf modeler-kit (diagram-js).
// Farben/Metriken kommen ausschließlich aus dem Theme-Service, also aus der
// Token-SSOT (INV-H2) — kein Hard-coded-Farbwert.
import BaseRenderer from "diagram-js/lib/draw/BaseRenderer";
import type { Theme } from "@hestia/modeler-kit";

const HIGH_PRIORITY = 1500;
const SVG_NS = "http://www.w3.org/2000/svg";

const DMN_TYPES = new Set(["dmn:Decision", "dmn:InputData", "dmn:InformationRequirement"]);

export class DmnRenderer extends BaseRenderer {
  static $inject = ["eventBus", "theme"];

  private readonly theme: Theme;

  constructor(eventBus: any, theme: Theme) {
    super(eventBus, HIGH_PRIORITY);
    this.theme = theme;
  }

  canRender(element: any): boolean {
    return DMN_TYPES.has(element?.businessObject?.$type);
  }

  drawShape(parent: SVGElement, element: any): SVGElement {
    const bo = element.businessObject;
    const isInput = bo.$type === "dmn:InputData";

    const rect = document.createElementNS(SVG_NS, "rect");
    const radius = isInput ? element.height / 2 : 6;
    setAttrs(rect, {
      x: 0,
      y: 0,
      width: element.width,
      height: element.height,
      rx: radius,
      ry: radius,
      fill: this.theme.token("color-surface-raised"),
      stroke: this.theme.token("color-border"),
      "stroke-width": 2,
    });
    parent.appendChild(rect);

    if (bo.name) {
      const text = document.createElementNS(SVG_NS, "text");
      setAttrs(text, {
        x: element.width / 2,
        y: element.height / 2,
        "text-anchor": "middle",
        "dominant-baseline": "central",
        fill: this.theme.token("color-fg"),
        "font-size": 13,
      });
      text.textContent = bo.name;
      parent.appendChild(text);
    }
    return rect;
  }

  drawConnection(parent: SVGElement, connection: any): SVGElement {
    const points = (connection.waypoints ?? [])
      .map((p: any) => `${p.x},${p.y}`)
      .join(" ");
    const line = document.createElementNS(SVG_NS, "polyline");
    setAttrs(line, {
      points,
      fill: "none",
      stroke: this.theme.token("color-fg-muted"),
      "stroke-width": 2,
      "stroke-dasharray": "5 5",
    });
    parent.appendChild(line);
    return line;
  }
}

function setAttrs(node: SVGElement, attrs: Record<string, string | number>): void {
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
}

// diagram-js-Modul des DRD-Renderers.
export const dmnRendererModule = {
  __init__: ["dmnRenderer"],
  dmnRenderer: ["type", DmnRenderer],
};
