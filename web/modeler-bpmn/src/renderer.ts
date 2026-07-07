/* eslint-disable @typescript-eslint/no-explicit-any */
// BPMN-Renderer, aufgesetzt auf modeler-kit (diagram-js). Farben/Metriken
// ausschließlich aus dem Theme-Service = Token-SSOT (INV-H2).
import BaseRenderer from "diagram-js/lib/draw/BaseRenderer";
import type { Theme } from "@hestia/modeler-kit";

const HIGH_PRIORITY = 1500;
const SVG_NS = "http://www.w3.org/2000/svg";

const EVENT_TYPES = new Set(["bpmn:StartEvent", "bpmn:EndEvent"]);
const SHAPE_TYPES = new Set(["bpmn:StartEvent", "bpmn:EndEvent", "bpmn:Task"]);
const CONNECTION_TYPES = new Set(["bpmn:SequenceFlow"]);

export class BpmnRenderer extends BaseRenderer {
  static $inject = ["eventBus", "theme"];

  private readonly theme: Theme;

  constructor(eventBus: any, theme: Theme) {
    super(eventBus, HIGH_PRIORITY);
    this.theme = theme;
  }

  canRender(element: any): boolean {
    const type = element?.businessObject?.$type;
    return SHAPE_TYPES.has(type) || CONNECTION_TYPES.has(type);
  }

  drawShape(parent: SVGElement, element: any): SVGElement {
    const bo = element.businessObject;
    const stroke = this.theme.token("color-fg");
    const fill = this.theme.token("color-surface-raised");

    let gfx: SVGElement;
    if (EVENT_TYPES.has(bo.$type)) {
      const circle = document.createElementNS(SVG_NS, "circle");
      setAttrs(circle, {
        cx: element.width / 2,
        cy: element.height / 2,
        r: Math.min(element.width, element.height) / 2 - 1,
        fill,
        stroke,
        "stroke-width": bo.$type === "bpmn:EndEvent" ? 4 : 2,
      });
      parent.appendChild(circle);
      gfx = circle;
    } else {
      const rect = document.createElementNS(SVG_NS, "rect");
      setAttrs(rect, {
        x: 0,
        y: 0,
        width: element.width,
        height: element.height,
        rx: 8,
        ry: 8,
        fill,
        stroke,
        "stroke-width": 2,
      });
      parent.appendChild(rect);
      gfx = rect;
    }

    if (bo.name) {
      const text = document.createElementNS(SVG_NS, "text");
      setAttrs(text, {
        x: element.width / 2,
        y: element.height / 2,
        "text-anchor": "middle",
        "dominant-baseline": "central",
        fill: this.theme.token("color-fg"),
        "font-size": 12,
      });
      text.textContent = bo.name;
      parent.appendChild(text);
    }
    return gfx;
  }

  drawConnection(parent: SVGElement, connection: any): SVGElement {
    const points = (connection.waypoints ?? [])
      .map((p: any) => `${p.x},${p.y}`)
      .join(" ");
    const line = document.createElementNS(SVG_NS, "polyline");
    setAttrs(line, {
      points,
      fill: "none",
      stroke: this.theme.token("color-fg"),
      "stroke-width": 2,
    });
    parent.appendChild(line);
    return line;
  }
}

function setAttrs(node: SVGElement, attrs: Record<string, string | number>): void {
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
}

export const bpmnRendererModule = {
  __init__: ["bpmnRenderer"],
  bpmnRenderer: ["type", BpmnRenderer],
};
