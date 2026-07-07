import { describe, it, expect } from "vitest";
import { atlasDescriptors, atlasManifest, ATLAS_NAMESPACE } from "./index";

describe("atlas-contract (INV-M5: SSOT modeler-bpmn <-> atlas)", () => {
  it("Manifest und Descriptor teilen denselben Namespace", () => {
    expect(atlasDescriptors.atlas.uri).toBe(atlasManifest.namespace);
    expect(ATLAS_NAMESPACE).toBe("http://hestia/atlas/bpmn");
  });

  it("listet modeler-bpmn und atlas als Konsumenten", () => {
    expect(atlasManifest.consumers).toContain("@hestia/modeler-bpmn");
    expect(atlasManifest.consumers).toContain("atlas");
  });
});
