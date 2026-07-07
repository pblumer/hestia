// @hestia/modeler-bpmn — BPMN 2.0.2 auf dem gemeinsamen Kit.
//
// Basis-Moddle aus den normativen OMG-Schemas (ADR-0007). Serialisiertes
// Basis-XML validiert gegen die Schemas (INV-B1) und trägt vollständiges DI
// (INV-B2). atlas-Extension-Moddle (INV-B3/M5), Renderer/Rules und der
// eCH-0158-Linter (INV-B4) folgen in 5b–5d.
export {
  createBpmnModdle,
  readBpmnXml,
  writeBpmnXml,
  bpmnDescriptors,
  BPMN_NAMESPACE,
  CONFORMANCE_CLASS,
} from "./moddle";
export type { BpmnModdleElement } from "./moddle";
export {
  readBpmnWithAtlas,
  stripExtensionElements,
  atlasPackages,
  ATLAS_NAMESPACE,
} from "./atlas";
export { createBpmnModeler, importBpmnDiagram } from "./bpmn-modeler";
export type { BpmnModeler } from "./bpmn-modeler";
export { bpmnRendererModule, BpmnRenderer } from "./renderer";
export { lint, lintMechanic, ECH_0158_RULES } from "./lint";
export type { Rule, Violation, Severity, Mode, LinterConfig } from "./lint";
export {
  processSample,
  processWithAtlas,
  lintCompliant,
  lintNonCompliant,
  lintWithIntermediate,
} from "./fixtures";
