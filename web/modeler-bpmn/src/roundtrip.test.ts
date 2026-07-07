/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { readBpmnXml, writeBpmnXml } from "./moddle";
import { processSample } from "./fixtures";

describe("BPMN-Round-Trip (INV-M4) + DI-Vollständigkeit (INV-B2)", () => {
  it("erhält Prozessinhalt und vollständiges Diagram Interchange", async () => {
    const defs: any = await readBpmnXml(processSample);

    const process = defs.rootElements.find((e: any) => e.$type === "bpmn:Process");
    expect(process.flowElements).toHaveLength(5);
    expect(process.flowElements.filter((e: any) => e.$type === "bpmn:SequenceFlow")).toHaveLength(2);

    // DI: ein Diagramm mit Plane, Shapes (mit Bounds) und Kanten (mit Wegpunkten).
    const plane = defs.diagrams[0].plane;
    const shapes = plane.planeElement.filter((e: any) => e.$type === "bpmndi:BPMNShape");
    const edges = plane.planeElement.filter((e: any) => e.$type === "bpmndi:BPMNEdge");
    expect(shapes).toHaveLength(3);
    expect(edges).toHaveLength(2);
    expect(shapes[0].bounds.width).toBe(36);
    expect(edges[0].waypoint).toHaveLength(2);
  });

  it("serialisiert stabil (idempotent) und behält das DI", async () => {
    const once = writeBpmnXml(await readBpmnXml(processSample));
    const twice = writeBpmnXml(await readBpmnXml(once));
    expect(twice).toBe(once);
    expect(once).toContain("<bpmndi:BPMNShape");
    expect(once).toContain("<di:waypoint");
    expect(once).toContain('sourceRef="StartEvent_1"');
  });
});
