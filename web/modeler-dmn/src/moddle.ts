// DMN-1.5-Moddle: der geteilte Descriptor (SSOT mit temis, INV-M3) plus Lesen
// und Schreiben von DMN-1.5-XML. Kein 1.3↔1.5-Mapping (INV-M3).
import { Moddle } from "moddle";
import { Reader, Writer } from "moddle-xml";

import dmnDescriptor from "./descriptor/dmn.json";
import dcDescriptor from "./descriptor/dc.json";
import diDescriptor from "./descriptor/di.json";
import dmndiDescriptor from "./descriptor/dmndi.json";

// Die DMN-1.5-Descriptoren als exportierbares, geteiltes Artefakt (INV-M3):
// dieselbe Definition nutzen Modeler UND temis-Engine.
export const dmnDescriptors = {
  dmn: dmnDescriptor,
  dc: dcDescriptor,
  di: diDescriptor,
  dmndi: dmndiDescriptor,
} as const;

/** Der DMN-1.5-MODEL-Namespace, den dieser Descriptor definiert. */
export const DMN_NAMESPACE = dmnDescriptor.uri;

// moddle-Elemente sind dynamisch typisiert; wir kapseln sie schmal.
export interface DmnModdleElement {
  $type: string;
  id?: string;
  [key: string]: unknown;
}

const PACKAGES = [
  dmnDescriptor,
  dcDescriptor,
  diDescriptor,
  dmndiDescriptor,
] as unknown as ConstructorParameters<typeof Moddle>[0];

/** Erzeugt eine Moddle-Instanz mit den DMN-1.5-Descriptoren. */
export function createDmnModdle(): Moddle {
  return new Moddle(PACKAGES);
}

/** Liest DMN-1.5-XML in ein Moddle-Modell. */
export async function readDmnXml(xml: string): Promise<DmnModdleElement> {
  const reader = new Reader(createDmnModdle());
  const { rootElement } = await reader.fromXML(xml, "dmn:Definitions");
  return rootElement as DmnModdleElement;
}

/** Serialisiert ein DMN-Moddle-Modell zurück zu XML. */
export function writeDmnXml(
  definitions: DmnModdleElement,
  options?: { preamble?: boolean },
): string {
  const writer = new Writer({ preamble: options?.preamble ?? true });
  return writer.toXML(definitions);
}
