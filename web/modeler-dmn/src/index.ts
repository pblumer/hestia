// @hestia/modeler-dmn — DMN 1.5 auf dem gemeinsamen Kit.
//
// Der Moddle-Descriptor ist die SSOT zwischen Modeler und temis-Engine (INV-M3);
// es gibt kein 1.3↔1.5-Mapping. Round-Trip Laden→Speichern ist verlustfrei
// (INV-M4). Renderer/Rules auf modeler-kit folgen in Schritt 4b.
export {
  createDmnModdle,
  readDmnXml,
  writeDmnXml,
  dmnDescriptors,
  DMN_NAMESPACE,
} from "./moddle";
export type { DmnModdleElement } from "./moddle";
export { createDmnModeler } from "./dmn-modeler";
export type { DmnModeler } from "./dmn-modeler";
export { dmnRendererModule, DmnRenderer } from "./renderer";
export { rabattDmn } from "./fixtures";
