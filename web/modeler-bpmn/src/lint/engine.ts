// Generische Linter-Engine (ADR-0008). Trägt eCH-0158 und potenziell weitere
// Profile. INV-B4 ist hier verankert:
//   - heuristic-Regeln werden NIE zu `error` (auch nicht per Override),
//   - der Linter liefert nur Befunde und blockiert nichts (kein Speicher-Gate),
//   - die XSD-Gültigkeit wird nicht berührt.
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { LinterConfig, Rule, Violation } from "./types";
import { ECH_0158_RULES } from "./rules";

export function lint(
  definitions: any,
  config: LinterConfig = {},
  ruleset: Rule[] = ECH_0158_RULES,
): Violation[] {
  const mode = config.mode ?? "descriptive";
  const register = config.register ?? "all";
  const out: Violation[] = [];

  for (const rule of ruleset) {
    if (!rule.implemented || !rule.check) continue;

    const ruleCfg = config.rules?.[rule.id];
    if (ruleCfg?.enabled === false) continue;

    // CI-Register: nur mechanische Regeln.
    if (register === "mechanic" && rule.kind !== "mechanic") continue;

    // Analytic-Palette entschärft deskriptiv motivierte Regeln (z. B. EVT-005).
    if (mode === "analytic" && rule.relaxInAnalytic) continue;

    const params = { ...(rule.params ?? {}), ...(config.params?.[rule.id] ?? {}) };
    let violations: Violation[];
    try {
      violations = rule.check({ definitions, mode, params }) ?? [];
    } catch {
      violations = []; // ein defekter Check darf den Linter nie werfen lassen
    }

    for (const v of violations) {
      let severity = ruleCfg?.severity ?? v.severity;
      // INV-B4: Heuristiken sind nie `error`.
      if (rule.kind === "heuristic" && severity === "error") severity = "warning";
      out.push({ ...v, severity });
    }
  }

  return out;
}

/** Nur die mechanischen Regeln (CI-Register). */
export function lintMechanic(definitions: any, config: LinterConfig = {}): Violation[] {
  return lint(definitions, { ...config, register: "mechanic" });
}
