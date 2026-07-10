// E2E-Demo des BPMN-Modelers: lädt den Beispielprozess, rendert ihn und stellt
// einen Save-Hook bereit (Round-Trip). Test-Hooks an window.__bpmn.
import { createBpmnModeler, processSample } from "@hestia/modeler-bpmn";
import "diagram-js/assets/diagram-js.css";
import "@hestia/tokens/tokens.css";

const container = document.querySelector<HTMLElement>("#canvas");
if (!container) throw new Error("#canvas fehlt");

const bpmn = createBpmnModeler({ container });

(window as any).__bpmn = {
  ready: false,
  save: () => bpmn.saveXML(),
};

bpmn
  .importXML(processSample)
  .then(() => {
    (window as any).__bpmn.ready = true;
  })
  .catch((err: unknown) => {
    (window as any).__bpmn.error = String(err);
  });
