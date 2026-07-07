import { describe, it, expect } from "vitest";
import { lint, lintMechanic, ECH_0158_RULES } from "./index";
import { readBpmnXml } from "../moddle";
import {
  lintCompliant,
  lintNonCompliant,
  lintWithIntermediate,
} from "../fixtures";

const ids = (vs: { ruleId: string }[]) => new Set(vs.map((x) => x.ruleId));

describe("eCH-0158-Regelkatalog (ADR-0008)", () => {
  it("führt den vollständigen Regelsatz und einige implementierte Checks", () => {
    expect(ECH_0158_RULES.length).toBeGreaterThanOrEqual(40);
    const implemented = ECH_0158_RULES.filter((r) => r.implemented);
    expect(implemented.length).toBeGreaterThanOrEqual(10);
    // IDs sind eindeutig.
    expect(new Set(ECH_0158_RULES.map((r) => r.id)).size).toBe(ECH_0158_RULES.length);
  });
});

describe("eCH-0158-Linter (mechanic-Register, CI)", () => {
  it("konformes Modell erzeugt keine mechanischen Befunde", async () => {
    const defs = await readBpmnXml(lintCompliant);
    expect(lintMechanic(defs)).toEqual([]);
  });

  it("nicht-konformes Modell meldet die erwarteten Verstöße", async () => {
    const defs = await readBpmnXml(lintNonCompliant);
    const found = ids(lintMechanic(defs));
    expect(found).toContain("ECH-DIA-003"); // Prozess ohne Bezeichnung
    expect(found).toContain("ECH-ACT-005"); // Aktivität ohne Namen
    expect(found).toContain("ECH-ACT-002"); // kein ausgehender Fluss
    expect(found).toContain("ECH-EVT-002"); // offenes Ende / kein Endereignis
  });
});

describe("descriptive|analytic-Modus", () => {
  it("EVT-005 greift deskriptiv, wird in analytic entschärft", async () => {
    const defs = await readBpmnXml(lintWithIntermediate);
    expect(ids(lint(defs, { mode: "descriptive" }))).toContain("ECH-EVT-005");
    expect(ids(lint(defs, { mode: "analytic" }))).not.toContain("ECH-EVT-005");
  });
});

describe("INV-B4: weich, nie blockierend, Heuristik nie error", () => {
  it("heuristische Regeln bleiben auch mit error-Override höchstens warning", async () => {
    const defs = await readBpmnXml(lintNonCompliant);
    // ACT-001 ist heuristisch; per Config auf error zu zwingen darf nicht greifen.
    const found = lint(defs, { rules: { "ECH-ACT-001": { severity: "error" } } });
    const act001 = found.filter((v) => v.ruleId === "ECH-ACT-001");
    expect(act001.every((v) => v.severity !== "error")).toBe(true);
  });

  it("mechanic-Register enthält keine heuristischen Regeln", async () => {
    const defs = await readBpmnXml(lintNonCompliant);
    const mech = lintMechanic(defs);
    const heuristicIds = new Set(ECH_0158_RULES.filter((r) => r.kind === "heuristic").map((r) => r.id));
    expect(mech.every((vio) => !heuristicIds.has(vio.ruleId))).toBe(true);
  });

  it("eine deaktivierte Regel meldet nichts", async () => {
    const defs = await readBpmnXml(lintNonCompliant);
    const found = ids(lint(defs, { rules: { "ECH-DIA-003": { enabled: false } } }));
    expect(found).not.toContain("ECH-DIA-003");
  });
});
