/* eslint-disable @typescript-eslint/no-explicit-any */
// atlas-Integration: liest BPMN inkl. atlas-Extension-Moddle (getypte
// extensionElements) und bietet das Entfernen aller Extensions für INV-B3.
// Der Descriptor stammt aus der EINEN Quelle @hestia/atlas-contract (INV-M5).
import { atlasDescriptors, ATLAS_NAMESPACE } from "@hestia/atlas-contract";
import { readBpmnXml, type BpmnModdleElement } from "./moddle";

export { ATLAS_NAMESPACE };

/** Die atlas-Pakete für createBpmnModdle/readBpmnXml. */
export const atlasPackages: unknown[] = [atlasDescriptors.atlas];

/** Liest BPMN-XML mit getypten atlas-Extension-Elementen. */
export function readBpmnWithAtlas(xml: string): Promise<BpmnModdleElement> {
  return readBpmnXml(xml, { extraPackages: atlasPackages });
}

/** Entfernt rekursiv alle extensionElements aus dem Modell (INV-B3-Nachweis:
 *  danach ist das Basis-XML frei von atlas-Semantik und bleibt OMG-konform). */
export function stripExtensionElements(node: any, seen = new Set<any>()): void {
  if (!node || typeof node !== "object" || seen.has(node)) return;
  seen.add(node);
  if (Array.isArray(node)) {
    for (const item of node) stripExtensionElements(item, seen);
    return;
  }
  delete node.extensionElements;
  for (const [key, value] of Object.entries(node)) {
    if (key.startsWith("$")) continue; // $type/$parent — keine Rekursion in Zyklen
    if (value && typeof value === "object") stripExtensionElements(value, seen);
  }
}
