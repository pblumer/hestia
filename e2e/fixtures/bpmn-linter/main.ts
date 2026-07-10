// E2E-Demo des eCH-0158-Linters: lädt einen Prozess, aktiviert das Profil
// (opt-in) und zeigt Konventionshinweise an — Speichern bleibt möglich (INV-B4).
import { createBpmnModeler, processSample, lint } from "@hestia/modeler-bpmn";
import "diagram-js/assets/diagram-js.css";
import "@hestia/tokens/tokens.css";

const container = document.querySelector<HTMLElement>("#canvas");
const panel = document.querySelector<HTMLElement>("#violations");
if (!container || !panel) throw new Error("Demo-DOM fehlt");

const bpmn = createBpmnModeler({ container });

(window as any).__lint = {
  ready: false,
  save: () => bpmn.saveXML(),
  count: () => (window as any).__lint.violations.length,
  violations: [] as unknown[],
};

bpmn.importXML(processSample).then(() => {
  // eCH-0158-Profil aktiv (deskriptiv).
  const violations = lint(bpmn.getDefinitions(), { mode: "descriptive" });
  (window as any).__lint.violations = violations;
  for (const v of violations) {
    const item = document.createElement("div");
    item.className = "violation";
    item.setAttribute("data-rule", v.ruleId);
    item.setAttribute("data-severity", v.severity);
    item.textContent = `${v.ruleId} [${v.severity}] ${v.message}`;
    panel.appendChild(item);
  }
  (window as any).__lint.ready = true;
});
