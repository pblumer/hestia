/* eslint-disable @typescript-eslint/no-explicit-any */
// BPMN-Modeler: Kit-Modeler + BPMN-Renderer; importiert einen Prozess anhand
// seines Diagram Interchange auf den Canvas und speichert verlustfrei zurück
// (INV-M4). Basis-XML bleibt OMG-konform (INV-B1).
import { createModeler, type Modeler } from "@hestia/modeler-kit";
import { readBpmnXml, writeBpmnXml, type BpmnModdleElement } from "./moddle";
import { atlasPackages } from "./atlas";
import { bpmnRendererModule } from "./renderer";

export interface BpmnModeler {
  modeler: Modeler;
  importXML(xml: string): Promise<void>;
  saveXML(): string;
  getDefinitions(): BpmnModdleElement | undefined;
}

export function createBpmnModeler(options: { container: HTMLElement }): BpmnModeler {
  const modeler = createModeler({
    container: options.container,
    additionalModules: [bpmnRendererModule],
  });
  let definitions: BpmnModdleElement | undefined;

  async function importXML(xml: string): Promise<void> {
    // atlas-Extensions werden mitgelesen und bleiben beim Speichern erhalten.
    definitions = await readBpmnXml(xml, { extraPackages: atlasPackages });
    importBpmnDiagram(modeler, definitions);
  }

  function saveXML(): string {
    if (!definitions) throw new Error("createBpmnModeler: kein Modell geladen");
    return writeBpmnXml(definitions);
  }

  return { modeler, importXML, saveXML, getDefinitions: () => definitions };
}

// Baut die diagram-js-Elemente aus dem BPMNDI auf. Nimmt eine beliebige
// diagram-js-Instanz (Modeler ODER read-only Viewer) — so nutzen beide DENSELBEN
// Renderer und Import (INV-O1).
export function importBpmnDiagram(target: Pick<Modeler, "get">, definitions: any): void {
  const canvas = target.get<any>("canvas");
  const elementFactory = target.get<any>("elementFactory");

  const root = elementFactory.createRoot({ id: "bpmn-root" });
  canvas.setRootElement(root);

  const plane = definitions.diagrams?.[0]?.plane;
  const planeElements = plane?.planeElement ?? [];
  const shapeByElementId: Record<string, any> = {};

  for (const di of planeElements) {
    if (di.$type !== "bpmndi:BPMNShape") continue;
    const bo = di.bpmnElement;
    const b = di.bounds;
    const shape = elementFactory.createShape({
      id: `${bo.id}_shape`,
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height,
      businessObject: bo,
    });
    canvas.addShape(shape, root);
    shapeByElementId[bo.id] = shape;
  }

  for (const di of planeElements) {
    if (di.$type !== "bpmndi:BPMNEdge") continue;
    const bo = di.bpmnElement; // SequenceFlow
    const waypoints = (di.waypoint ?? []).map((p: any) => ({ x: p.x, y: p.y }));
    const connection = elementFactory.createConnection({
      id: `${bo.id}_edge`,
      waypoints,
      source: shapeByElementId[bo.sourceRef?.id],
      target: shapeByElementId[bo.targetRef?.id],
      businessObject: bo,
    });
    canvas.addConnection(connection, root);
  }
}
