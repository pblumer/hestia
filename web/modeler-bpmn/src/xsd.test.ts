/* eslint-disable @typescript-eslint/no-explicit-any */
// INV-B1: Konformität ist prüfbar, nicht behauptet. Das serialisierte Basis-XML
// validiert gegen die normativen OMG-Schemas (xmllint gegen spec/xsd/BPMN20.xsd).
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, it, expect } from "vitest";
import { readBpmnXml, writeBpmnXml } from "./moddle";
import { processSample } from "./fixtures";

const xsd = join(dirname(fileURLToPath(import.meta.url)), "..", "spec", "xsd", "BPMN20.xsd");

function xmllintValidate(xml: string): { ok: boolean; output: string } {
  try {
    execFileSync("xmllint", ["--noout", "--schema", xsd, "-"], {
      input: xml,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { ok: true, output: "" };
  } catch (err: any) {
    // ENOENT (xmllint fehlt) oder Validierungsfehler -> beides ist ein Fail.
    return { ok: false, output: String(err.stderr ?? err.message) };
  }
}

describe("BPMN-2.0.2-XSD-Konformität (INV-B1)", () => {
  it("die Fixture validiert gegen die normativen OMG-Schemas", () => {
    const res = xmllintValidate(processSample);
    expect(res.ok, res.output).toBe(true);
  });

  it("das serialisierte (round-getrippte) Basis-XML validiert weiterhin (INV-B1 + INV-M4)", async () => {
    const roundtripped = writeBpmnXml(await readBpmnXml(processSample));
    const res = xmllintValidate(roundtripped);
    expect(res.ok, res.output).toBe(true);
  });
});
