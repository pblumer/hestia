/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { readDmnXml, writeDmnXml, dmnDescriptors, DMN_NAMESPACE } from "./moddle";
import { rabattDmn } from "./fixtures";

describe("DMN-1.5-Descriptor (INV-M3: SSOT mit temis)", () => {
  it("ist als geteiltes Artefakt exportierbar, mit dem 1.5-Namespace", () => {
    expect(dmnDescriptors.dmn.uri).toBe("https://www.omg.org/spec/DMN/20240513/MODEL/");
    expect(DMN_NAMESPACE).toBe(dmnDescriptors.dmn.uri);
    // Kein 1.3↔1.5-Mapping: genau EINE MODEL-Definition.
    expect(dmnDescriptors.dmn.name).toBe("DMN");
  });
});

describe("DMN-Round-Trip (INV-M4: verlustfrei)", () => {
  it("erhält Modellinhalt und Diagram Interchange beim Laden", async () => {
    const defs: any = await readDmnXml(rabattDmn);
    expect(defs.name).toBe("Rabattermittlung");
    expect(defs.drgElement).toHaveLength(2);

    const decision = defs.drgElement.find((e: any) => e.$type === "dmn:Decision");
    expect(decision.name).toBe("Rabatt ermitteln");
    expect(decision.informationRequirement[0].requiredInput.href).toBe("#input_umsatz");

    const table = decision.decisionLogic;
    expect(table.$type).toBe("dmn:DecisionTable");
    expect(table.hitPolicy).toBe("UNIQUE");
    expect(table.input).toHaveLength(1);
    expect(table.output).toHaveLength(1);
    expect(table.rule).toHaveLength(2);
    expect(table.rule[1].outputEntry[0].text).toBe("0.1");

    const diagram = defs.dmnDI.diagrams[0];
    expect(diagram.diagramElements).toHaveLength(3);
    const shape = diagram.diagramElements.find((e: any) => e.$type === "dmndi:DMNShape");
    expect(shape.bounds.width).toBe(180);
  });

  it("serialisiert stabil — Schreiben ist idempotent, Semantik bleibt erhalten", async () => {
    const once = writeDmnXml(await readDmnXml(rabattDmn));
    const reparsed: any = await readDmnXml(once);
    const twice = writeDmnXml(reparsed);
    // Stabile Serialisierung (Fixpunkt): kein Drift beim erneuten Round-Trip.
    expect(twice).toBe(once);

    // Semantisch erhalten (hitPolicy UNIQUE ist DMN-Default und darf beim
    // Serialisieren normalisiert weggelassen werden — beim Lesen wieder gesetzt).
    const table = reparsed.drgElement.find((e: any) => e.$type === "dmn:Decision").decisionLogic;
    expect(table.hitPolicy).toBe("UNIQUE");
    expect(table.rule).toHaveLength(2);
    expect(table.output[0].typeRef).toBe("number");

    // Serialisierte Struktur enthält Tags, Referenzen und Wegpunkte.
    expect(once).toContain("<dmn:decisionTable");
    expect(once).toContain('dmnElementRef="decision_rabatt"');
    expect(once).toContain("<di:waypoint");
  });
});
