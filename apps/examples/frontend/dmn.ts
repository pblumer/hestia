// Beispiel: DMN-Modeler (Klasse B), eingebettet in die Klasse-A-Seite.
import { createDmnModeler, rabattDmn } from "@hestia/modeler-dmn";
import "diagram-js/assets/diagram-js.css";

const el = document.querySelector<HTMLElement>("#diagram");
if (el) {
  const modeler = createDmnModeler({ container: el });
  void modeler.importXML(rabattDmn).then(() => {
    (window as unknown as { __ready?: boolean }).__ready = true;
  });
}
