/* eslint-disable @typescript-eslint/no-explicit-any */
// eCH-0158 V1.2 — Regelkatalog (docs/ech-0158-linter-rules.md). Der vollständige
// Regelsatz als Daten; die mechanisch entscheidbaren Regeln tragen ein check().
// Nicht-implementierte (v. a. layout-/sprachheuristische) Regeln sind als
// Katalogeintrag mit implemented:false geführt, damit die Abdeckung transparent
// bleibt und weitere Checks andocken können.
import type { Rule, RuleContext, Violation } from "./types";
import {
  processes,
  nodesOf,
  flowsOf,
  outgoing,
  isActivity,
  isXorOrGateway,
} from "./model";

const v = (
  ruleId: string,
  severity: Violation["severity"],
  specRef: string,
  message: string,
  elementId?: string,
): Violation => ({ ruleId, severity, specRef, message, elementId });

// --- implementierte Checks --------------------------------------------------

function checkDiagramName(ctx: RuleContext): Violation[] {
  return processes(ctx.definitions)
    .filter((p) => !p.name)
    .map((p) => v("ECH-DIA-003", "error", "3.2", "Diagramm/Prozess ohne Bezeichnung", p.id));
}

function checkActivityCount(ctx: RuleContext): Violation[] {
  const max = Number(ctx.params.max ?? 15);
  const out: Violation[] = [];
  for (const p of processes(ctx.definitions)) {
    const count = nodesOf(p).filter(isActivity).length;
    if (count > max) {
      out.push(v("ECH-DIA-002", "warning", "3.2", `Mehr als ${max} Aktivitäten (${count})`, p.id));
    }
  }
  return out;
}

function checkStartEvent(ctx: RuleContext): Violation[] {
  return processes(ctx.definitions)
    .filter((p) => !nodesOf(p).some((n) => n.$type === "bpmn:StartEvent"))
    .map((p) => v("ECH-EVT-001", "error", "3.5", "Prozess ohne Startereignis", p.id));
}

function checkNoOpenEnds(ctx: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const p of processes(ctx.definitions)) {
    const nodes = nodesOf(p);
    const flows = flowsOf(p);
    if (!nodes.some((n) => n.$type === "bpmn:EndEvent")) {
      out.push(v("ECH-EVT-002", "error", "3.5", "Prozess ohne Endereignis", p.id));
    }
    for (const n of nodes) {
      if (n.$type === "bpmn:EndEvent") continue;
      if (outgoing(flows, n.id).length === 0) {
        out.push(v("ECH-EVT-002", "error", "3.5", "Offenes Ende (kein ausgehender Sequenzfluss)", n.id));
      }
    }
  }
  return out;
}

function checkStartInProcess(ctx: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const p of processes(ctx.definitions)) {
    for (const n of nodesOf(p)) {
      if (n.$type === "bpmn:StartEvent" && n.$parent?.$type !== "bpmn:Process" && n.$parent?.$type !== "bpmn:SubProcess") {
        out.push(v("ECH-EVT-004", "error", "3.5", "Startereignis außerhalb eines Pools/Prozesses", n.id));
      }
    }
  }
  return out;
}

function checkTriggeringMessageIntermediate(ctx: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const p of processes(ctx.definitions)) {
    for (const n of nodesOf(p)) {
      if (
        n.$type === "bpmn:IntermediateThrowEvent" &&
        (n.eventDefinitions ?? []).some((d: any) => d.$type === "bpmn:MessageEventDefinition")
      ) {
        out.push(v("ECH-EVT-005", "warning", "3.5", "Auslösendes Nachrichten-Zwischenereignis (deskriptiv unerwünscht)", n.id));
      }
    }
  }
  return out;
}

function checkActivityName(ctx: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const p of processes(ctx.definitions)) {
    for (const n of nodesOf(p)) {
      if (isActivity(n) && !n.name) {
        out.push(v("ECH-ACT-005", "error", "3.6", "Aktivität ohne Bezeichnung", n.id));
      }
    }
  }
  return out;
}

function checkActivitySingleOutgoing(ctx: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const p of processes(ctx.definitions)) {
    const flows = flowsOf(p);
    for (const n of nodesOf(p)) {
      if (!isActivity(n)) continue;
      const count = outgoing(flows, n.id).length;
      if (count !== 1) {
        out.push(v("ECH-ACT-002", "error", "3.6", `Aktivität mit ${count} ausgehenden Sequenzflüssen (genau 1 erwartet)`, n.id));
      }
    }
  }
  return out;
}

function checkNoBranchFromActivity(ctx: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const p of processes(ctx.definitions)) {
    const flows = flowsOf(p);
    for (const n of nodesOf(p)) {
      if (isActivity(n) && outgoing(flows, n.id).length > 1) {
        out.push(v("ECH-SEQ-002", "error", "3.8", "Verzweigung direkt aus Aktivität (nur über Gateway zulässig)", n.id));
      }
    }
  }
  return out;
}

function checkActivityBeforeXorOr(ctx: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const p of processes(ctx.definitions)) {
    const flows = flowsOf(p);
    const byId = new Map(nodesOf(p).map((n) => [n.id, n]));
    for (const n of nodesOf(p)) {
      if (!isXorOrGateway(n)) continue;
      if (outgoing(flows, n.id).length < 2) continue; // nur verzweigende Gateways
      const preds = flows.filter((f: any) => f.targetRef?.id === n.id).map((f: any) => byId.get(f.sourceRef?.id));
      if (preds.length > 0 && !preds.every((s: any) => s && isActivity(s))) {
        out.push(v("ECH-GW-001", "error", "3.7", "Vor verzweigendem XOR/OR-Gateway fehlt eine Aktivität", n.id));
      }
    }
  }
  return out;
}

function checkNoTwoEqualSpecialGateways(ctx: RuleContext): Violation[] {
  const out: Violation[] = [];
  const special = new Set(["bpmn:ParallelGateway", "bpmn:EventBasedGateway"]);
  for (const p of processes(ctx.definitions)) {
    const flows = flowsOf(p);
    const byId = new Map(nodesOf(p).map((n) => [n.id, n]));
    for (const n of nodesOf(p)) {
      if (!special.has(n.$type)) continue;
      for (const f of outgoing(flows, n.id)) {
        const succ = byId.get(f.targetRef?.id);
        if (succ && succ.$type === n.$type) {
          out.push(v("ECH-GW-004", "warning", "3.7", "Zwei gleiche Spezial-Gateways direkt hintereinander", n.id));
        }
      }
    }
  }
  return out;
}

function checkConsecutiveGateways(ctx: RuleContext): Violation[] {
  const out: Violation[] = [];
  for (const p of processes(ctx.definitions)) {
    const flows = flowsOf(p);
    const byId = new Map(nodesOf(p).map((n) => [n.id, n]));
    for (const start of nodesOf(p)) {
      if (!isXorOrGateway(start)) continue;
      // Kette aus aufeinanderfolgenden (X)OR-Gateways ab start zählen.
      let chain = 1;
      let cur = start;
      const visited = new Set<string>([start.id]);
      while (true) {
        const outs = outgoing(flows, cur.id);
        if (outs.length !== 1) break;
        const next = byId.get(outs[0].targetRef?.id);
        if (!next || !isXorOrGateway(next) || visited.has(next.id)) break;
        visited.add(next.id);
        chain += 1;
        cur = next;
      }
      if (chain >= 3) {
        out.push(v("ECH-GEN-007", "warning", "2", "Mehr als zwei (X)OR-Gateways in Folge — als Geschäftsregel/DMN auslagern", start.id));
        break; // pro Prozess einmal melden
      }
    }
  }
  return out;
}

function checkActivityInfinitiveNaming(ctx: RuleContext): Violation[] {
  // Heuristik (nie error): "Substantiv + Verb im Infinitiv" -> letztes Wort
  // endet auf -en/-eln/-ern und es gibt mindestens zwei Wörter.
  const out: Violation[] = [];
  for (const p of processes(ctx.definitions)) {
    for (const n of nodesOf(p)) {
      if (!isActivity(n) || !n.name) continue;
      const words = String(n.name).trim().split(/\s+/);
      const last = words[words.length - 1]?.toLowerCase() ?? "";
      const looksInfinitive = /(en|eln|ern|n)$/.test(last);
      if (words.length < 2 || !looksInfinitive) {
        out.push(v("ECH-ACT-001", "warning", "3.6", `Möglicher Verstoß gegen "Substantiv + Infinitiv": "${n.name}"`, n.id));
      }
    }
  }
  return out;
}

// --- Katalog ----------------------------------------------------------------

const R = (
  id: string,
  element: string,
  kind: Rule["kind"],
  severity: Rule["severity"],
  specRef: string,
  description: string,
  extra: Partial<Rule> = {},
): Rule => ({ id, element, kind, severity, specRef, description, implemented: false, ...extra });

export const ECH_0158_RULES: Rule[] = [
  // 1. Allgemein
  R("ECH-GEN-001", "Sequenzfluss/Layout", "heuristic", "hint", "2", "Modellierung links→rechts"),
  R("ECH-GEN-002", "alle", "mechanic", "hint", "2", "Einheitliche Elementgröße pro Typ"),
  R("ECH-GEN-003", "alle", "mechanic", "hint", "2", "Farben vermeiden"),
  R("ECH-GEN-004", "Label", "mechanic", "hint", "2", "Keine Formatierung in Bezeichnungen"),
  R("ECH-GEN-005", "Label", "heuristic", "hint", "2", "Sprachkonsistenz"),
  R("ECH-GEN-006", "Label", "heuristic", "hint", "2", "Abkürzungen vermeiden"),
  R("ECH-GEN-007", "Gateway-Kette", "mechanic", "warning", "2", "Geschäftsregel bei >2 Gateways in Folge", { implemented: true, check: checkConsecutiveGateways }),
  // 2. Diagramm
  R("ECH-DIA-001", "Diagramm", "heuristic", "hint", "3.2", "Namenskonvention (Substantiv + Infinitiv)"),
  R("ECH-DIA-002", "Diagramm", "mechanic", "warning", "3.2", "Max. 9–15 Aktivitäten", { implemented: true, params: { max: 15 }, check: checkActivityCount }),
  R("ECH-DIA-003", "Diagramm", "mechanic", "error", "3.2", "Erforderliche Bezeichnung", { implemented: true, check: checkDiagramName }),
  R("ECH-DIA-004", "Diagramm", "mechanic", "hint", "3.2", "Querformat, max. DIN A3"),
  // 3. Pool
  R("ECH-POOL-001", "Pool", "mechanic", "error", "3.3", "Genau ein Prozess pro aufgeklapptem Pool"),
  R("ECH-POOL-002", "Pool", "mechanic", "error", "3.3", "Zugeklappter Pool ohne Inhalt"),
  R("ECH-POOL-003", "Pool", "mechanic", "error", "3.3", "Zugeklappter Pool braucht ≥1 Nachrichtenfluss"),
  R("ECH-POOL-004", "Pool", "mechanic", "error", "3.3", "Jeder Pool nur einmal pro Diagramm"),
  R("ECH-POOL-005", "Pool", "mechanic", "warning", "3.3", "Pools über gesamte Breite, gestapelt"),
  R("ECH-POOL-006", "Pool", "heuristic", "hint", "3.3", "Namenskonvention Pool"),
  R("ECH-POOL-007", "Pool", "mechanic", "error", "3.3", "Erforderliche Bezeichnung"),
  // 4. Lane
  R("ECH-LANE-001", "Lane", "mechanic", "warning", "3.4", "Max. drei Verschachtelungsebenen"),
  R("ECH-LANE-002", "Lane", "mechanic", "warning", "3.4", "Lanes über gesamte Poolbreite"),
  R("ECH-LANE-003", "Lane", "mechanic", "warning", "3.4", "Lane ≠ Pool-Name"),
  R("ECH-LANE-004", "Lane", "heuristic", "hint", "3.4", "Rollenbezeichnung im Singular"),
  // 5. Ereignisse
  R("ECH-EVT-001", "Ereignis", "mechanic", "error", "3.5", "Prozess hat ≥1 Startereignis", { implemented: true, check: checkStartEvent }),
  R("ECH-EVT-002", "Ereignis", "mechanic", "error", "3.5", "Jeder Zweig endet in einem Endereignis", { implemented: true, check: checkNoOpenEnds }),
  R("ECH-EVT-003", "Ereignis", "mechanic", "warning", "3.5", "Mehrere Startereignisse sofort zusammenführen"),
  R("ECH-EVT-004", "Ereignis", "mechanic", "error", "3.5", "Startereignisse innerhalb eines Pools", { implemented: true, check: checkStartInProcess }),
  R("ECH-EVT-005", "Ereignis", "mechanic", "warning", "3.5", "Kein auslösendes Nachrichten-Zwischenereignis (deskriptiv)", { implemented: true, relaxInAnalytic: true, check: checkTriggeringMessageIntermediate }),
  R("ECH-EVT-006", "Ereignis", "heuristic", "hint", "3.5", "Bedingungs-/Zeitgeber-Ereignis: Bezeichnung"),
  R("ECH-EVT-007", "Ereignis", "heuristic", "hint", "3.5", "Endereignis mit Status beschriftet"),
  // 6. Aktivität
  R("ECH-ACT-001", "Aktivität", "heuristic", "warning", "3.6", "Namenskonvention (Substantiv + Infinitiv)", { implemented: true, check: checkActivityInfinitiveNaming }),
  R("ECH-ACT-002", "Aktivität", "mechanic", "error", "3.6", "Genau ein ausgehender Sequenzfluss", { implemented: true, check: checkActivitySingleOutgoing }),
  R("ECH-ACT-003", "Aktivität", "heuristic", "warning", "3.6", "Nach Prüf-Tätigkeit folgt ein Gateway"),
  R("ECH-ACT-004", "Aktivität", "mechanic", "warning", "3.6", "Unterprozesse zugeklappt + eigenes Diagramm"),
  R("ECH-ACT-005", "Aktivität", "mechanic", "error", "3.6", "Erforderliche Bezeichnung", { implemented: true, check: checkActivityName }),
  // 7. Gateways
  R("ECH-GW-001", "Gateway", "mechanic", "error", "3.7", "Aktivität vor XOR/OR-Gateway obligatorisch", { implemented: true, check: checkActivityBeforeXorOr }),
  R("ECH-GW-002", "Gateway", "mechanic", "warning", "3.7", "Zusammenführung verzweigter Flüsse obligatorisch"),
  R("ECH-GW-003", "Gateway", "mechanic", "hint", "3.7", "Beschriftungsregeln Gateways"),
  R("ECH-GW-004", "Gateway", "mechanic", "warning", "3.7", "Keine zwei gleichen Spezial-Gateways in Folge", { implemented: true, check: checkNoTwoEqualSpecialGateways }),
  // 8. Sequenzfluss
  R("ECH-SEQ-001", "Sequenzfluss", "mechanic", "warning", "3.8", "Beschriftung nur nach XOR/OR"),
  R("ECH-SEQ-002", "Sequenzfluss", "mechanic", "error", "3.8", "Verzweigung nur über Gateway", { implemented: true, check: checkNoBranchFromActivity }),
  R("ECH-SEQ-003", "Sequenzfluss", "heuristic", "hint", "3.8", "Horizontal, keine Rückflüsse/Kreuzungen"),
  R("ECH-SEQ-004", "Sequenzfluss", "mechanic", "warning", "3.8", "Keine Überlagerung von Sequenzflüssen"),
  // 9. Nachrichtenfluss
  R("ECH-MSG-001", "Nachrichtenfluss", "mechanic", "error", "3.9", "Nur zwischen verschiedenen Pools"),
  R("ECH-MSG-002", "Nachrichtenfluss", "mechanic", "warning", "3.9", "Nachrichten von Aktivitäten ausgelöst", { relaxInAnalytic: true }),
  R("ECH-MSG-003", "Nachrichtenfluss", "mechanic", "hint", "3.9", "Anschluss oben/unten"),
  R("ECH-MSG-004", "Nachrichtenfluss", "mechanic", "warning", "3.9", "Keine Überlagerung"),
  R("ECH-MSG-005", "Nachrichtenfluss", "mechanic", "hint", "3.9", "Nicht über Ebenen wiederholen"),
  // 10. Kommentar & Gruppe
  R("ECH-CMT-001", "Kommentar", "mechanic", "hint", "3.10", "Kommentar über gepunktete Assoziation"),
  R("ECH-GRP-001", "Gruppe", "heuristic", "hint", "3.11", "Gruppe kein Ersatz für Lanes"),
];
