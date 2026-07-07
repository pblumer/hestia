import { describe, it, expect } from "vitest";
import { dmnDescriptors, dmnManifest, DMN_NAMESPACE } from "./index";

describe("dmn-contract (INV-M3: SSOT, keine Divergenz)", () => {
  it("Manifest und Descriptoren stimmen in den Namespaces überein", () => {
    expect(dmnDescriptors.dmn.uri).toBe(dmnManifest.namespaces.model);
    expect(dmnDescriptors.dmndi.uri).toBe(dmnManifest.namespaces.dmndi);
    expect(dmnDescriptors.dc.uri).toBe(dmnManifest.namespaces.dc);
    expect(dmnDescriptors.di.uri).toBe(dmnManifest.namespaces.di);
  });

  it("exportiert den 1.5-Namespace und listet temis als Konsument", () => {
    expect(DMN_NAMESPACE).toBe("https://www.omg.org/spec/DMN/20240513/MODEL/");
    expect(dmnManifest.dmnVersion).toBe("1.5");
    expect(dmnManifest.consumers).toContain("temis");
  });
});
