// Beispiel: BPMN-Modeler (Klasse B), eingebettet in die Klasse-A-Seite.
import { createBpmnModeler, processSample } from "@hestia/modeler-bpmn";
import "diagram-js/assets/diagram-js.css";

const el = document.querySelector<HTMLElement>("#diagram");
if (el) {
  const modeler = createBpmnModeler({ container: el });
  void modeler.importXML(processSample).then(() => {
    (window as unknown as { __ready?: boolean }).__ready = true;
  });
}
