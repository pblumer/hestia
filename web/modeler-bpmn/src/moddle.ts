// Basis-BPMN-2.0.2-Moddle: der aus den normativen OMG-Schemas abgeleitete
// Descriptor (ADR-0007) plus Lesen/Schreiben von BPMN-XML. Die atlas-
// Ausführungssemantik ist NICHT enthalten — sie kommt als eigener Extension-
// Moddle (Schritt 5b, INV-B3/M5). So bleibt das Basis-XML rein OMG-konform.
import { Moddle } from "moddle";
import { Reader, Writer } from "moddle-xml";

import bpmnDescriptor from "./descriptor/bpmn.json";
import bpmndiDescriptor from "./descriptor/bpmndi.json";
import dcDescriptor from "./descriptor/dc.json";
import diDescriptor from "./descriptor/di.json";

// Angezielte Konformitätsklasse (ADR-0007), explizit deklariert.
export const CONFORMANCE_CLASS = "BPMN Process Modeling Conformance";

export const bpmnDescriptors = {
  bpmn: bpmnDescriptor,
  bpmndi: bpmndiDescriptor,
  dc: dcDescriptor,
  di: diDescriptor,
} as const;

/** Der BPMN-2.0-MODEL-Namespace. */
export const BPMN_NAMESPACE = bpmnDescriptor.uri;

export interface BpmnModdleElement {
  $type: string;
  id?: string;
  [key: string]: unknown;
}

const PACKAGES = [
  bpmnDescriptor,
  bpmndiDescriptor,
  dcDescriptor,
  diDescriptor,
] as unknown as ConstructorParameters<typeof Moddle>[0];

/** Erzeugt eine Moddle-Instanz mit dem Basis-BPMN-Descriptor. */
export function createBpmnModdle(): Moddle {
  return new Moddle(PACKAGES);
}

/** Liest BPMN-XML in ein Moddle-Modell. */
export async function readBpmnXml(xml: string): Promise<BpmnModdleElement> {
  const reader = new Reader(createBpmnModdle());
  const { rootElement } = await reader.fromXML(xml, "bpmn:Definitions");
  return rootElement as BpmnModdleElement;
}

/** Serialisiert ein BPMN-Moddle-Modell zurück zu XML. */
export function writeBpmnXml(
  definitions: BpmnModdleElement,
  options?: { preamble?: boolean },
): string {
  const writer = new Writer({ preamble: options?.preamble ?? true });
  return writer.toXML(definitions);
}
