import { describe, it, expect } from "vitest";
import { readBpmnXml, writeBpmnXml, bpmnDescriptors, CONFORMANCE_CLASS } from "./index";

describe("modeler-bpmn API", () => {
  it("exportiert die öffentliche BPMN-API", () => {
    expect(typeof readBpmnXml).toBe("function");
    expect(typeof writeBpmnXml).toBe("function");
    expect(bpmnDescriptors.bpmn.prefix).toBe("bpmn");
  });

  it("deklariert die angezielte Konformitätsklasse (ADR-0007)", () => {
    expect(CONFORMANCE_CLASS).toBe("BPMN Process Modeling Conformance");
  });
});
