/* eslint-disable @typescript-eslint/no-explicit-any */
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, it, expect } from "vitest";
import { writeBpmnXml } from "./moddle";
import { readBpmnWithAtlas, stripExtensionElements, ATLAS_NAMESPACE } from "./atlas";
import { processWithAtlas } from "./fixtures";

const xsd = join(dirname(fileURLToPath(import.meta.url)), "..", "spec", "xsd", "BPMN20.xsd");

function validates(xml: string): { ok: boolean; output: string } {
  try {
    execFileSync("xmllint", ["--noout", "--schema", xsd, "-"], {
      input: xml,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { ok: true, output: "" };
  } catch (err: any) {
    return { ok: false, output: String(err.stderr ?? err.message) };
  }
}

describe("atlas-Extension (INV-B3, INV-M5)", () => {
  it("liest atlas-Semantik als getypte Elemente im atlas-Namespace", async () => {
    const defs: any = await readBpmnWithAtlas(processWithAtlas);
    const task = defs.rootElements[0].flowElements.find((e: any) => e.$type === "bpmn:Task");
    const values = task.extensionElements.values;
    const taskDef = values.find((e: any) => e.$type === "atlas:TaskDefinition");
    expect(taskDef.type).toBe("antrag-worker");
    expect(taskDef.retries).toBe("5");
    expect(ATLAS_NAMESPACE).toBe("http://hestia/atlas/bpmn");
  });

  it("Basis-XML MIT atlas-Extensions validiert gegen die OMG-Schemas (##other lax)", async () => {
    const xml = writeBpmnXml(await readBpmnWithAtlas(processWithAtlas));
    expect(xml).toContain("atlas:taskDefinition");
    const res = validates(xml);
    expect(res.ok, res.output).toBe(true);
  });

  it("nach Entfernen ALLER Extensions bleibt das Basis-XML OMG-konform (INV-B3)", async () => {
    const defs = await readBpmnWithAtlas(processWithAtlas);
    stripExtensionElements(defs);
    const xml = writeBpmnXml(defs);
    expect(xml).not.toContain("atlas:");
    expect(xml).not.toContain("extensionElements");
    const res = validates(xml);
    expect(res.ok, res.output).toBe(true);
  });
});
