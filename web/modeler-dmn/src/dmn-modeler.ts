/* eslint-disable @typescript-eslint/no-explicit-any */
// DMN-Modeler: setzt den Kit-Modeler mit dem DRD-Renderer zusammen und importiert
// ein DMN-1.5-Modell anhand seines Diagram Interchange auf den diagram-js-Canvas.
// Speichern serialisiert dasselbe Moddle-Modell verlustfrei zurück (INV-M4).
import { createModeler, type Modeler } from "@hestia/modeler-kit";
import { readDmnXml, writeDmnXml, type DmnModdleElement } from "./moddle";
import { dmnRendererModule } from "./renderer";

export interface DmnModeler {
  modeler: Modeler;
  importXML(xml: string): Promise<void>;
  saveXML(): string;
  getDefinitions(): DmnModdleElement | undefined;
}

export function createDmnModeler(options: { container: HTMLElement }): DmnModeler {
  const modeler = createModeler({
    container: options.container,
    additionalModules: [dmnRendererModule],
  });
  let definitions: DmnModdleElement | undefined;

  async function importXML(xml: string): Promise<void> {
    definitions = await readDmnXml(xml);
    renderDrd(modeler, definitions);
  }

  function saveXML(): string {
    if (!definitions) throw new Error("createDmnModeler: kein Modell geladen");
    return writeDmnXml(definitions);
  }

  return { modeler, importXML, saveXML, getDefinitions: () => definitions };
}

// Baut die diagram-js-Elemente aus dem DMNDI (Shapes/Edges) mit den
// Moddle-Elementen als businessObject auf.
function renderDrd(modeler: Modeler, definitions: any): void {
  const canvas = modeler.get<any>("canvas");
  const elementFactory = modeler.get<any>("elementFactory");

  const root = elementFactory.createRoot({ id: "dmn-root" });
  canvas.setRootElement(root);

  // IR-Besitzer (Entscheidung) für Quelle/Ziel der Kanten.
  const irOwner: Record<string, string> = {};
  for (const el of definitions.drgElement ?? []) {
    if (el.$type === "dmn:Decision") {
      for (const ir of el.informationRequirement ?? []) irOwner[ir.id] = el.id;
    }
  }

  const shapeByElementId: Record<string, any> = {};
  const diagram = definitions.dmnDI?.diagrams?.[0];
  const diElements = diagram?.diagramElements ?? [];

  for (const di of diElements) {
    if (di.$type !== "dmndi:DMNShape") continue;
    const bo = di.dmnElementRef;
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

  for (const di of diElements) {
    if (di.$type !== "dmndi:DMNEdge") continue;
    const ir = di.dmnElementRef;
    const sourceRef = (ir.requiredInput?.href ?? ir.requiredDecision?.href ?? "").replace(/^#/, "");
    const waypoints = (di.waypoint ?? []).map((p: any) => ({ x: p.x, y: p.y }));
    const connection = elementFactory.createConnection({
      id: `${ir.id}_edge`,
      waypoints,
      source: shapeByElementId[sourceRef],
      target: shapeByElementId[irOwner[ir.id]],
      businessObject: ir,
    });
    canvas.addConnection(connection, root);
  }
}
