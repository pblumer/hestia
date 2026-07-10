/* eslint-disable @typescript-eslint/no-explicit-any */
// Modell-Helfer für die Linter-Regeln: Zugriff auf Prozesse, Knoten und Flüsse
// eines gelesenen BPMN-Moddle-Modells.

export function processes(definitions: any): any[] {
  return (definitions?.rootElements ?? []).filter((e: any) => e.$type === "bpmn:Process");
}

export function nodesOf(process: any): any[] {
  return (process.flowElements ?? []).filter((e: any) => e.$type !== "bpmn:SequenceFlow");
}

export function flowsOf(process: any): any[] {
  return (process.flowElements ?? []).filter((e: any) => e.$type === "bpmn:SequenceFlow");
}

export function outgoing(flows: any[], nodeId: string): any[] {
  return flows.filter((f: any) => f.sourceRef?.id === nodeId);
}

export function incoming(flows: any[], nodeId: string): any[] {
  return flows.filter((f: any) => f.targetRef?.id === nodeId);
}

export function isActivity(node: any): boolean {
  const t: string = node.$type ?? "";
  return t === "bpmn:SubProcess" || t === "bpmn:CallActivity" || t.endsWith("Task");
}

export function isXorOrGateway(node: any): boolean {
  return node.$type === "bpmn:ExclusiveGateway" || node.$type === "bpmn:InclusiveGateway";
}

export function isGateway(node: any): boolean {
  return typeof node.$type === "string" && node.$type.endsWith("Gateway");
}
