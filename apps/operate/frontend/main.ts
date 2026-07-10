// Operate-Frontend (Klasse B, eingebettet in die Klasse-A-Seite): rendert den
// Prozess read-only über den web/viewer (INV-O1) und animiert den Token anhand
// der SSE-Events aus dem Go-Server (/events) — der A+B-Machbarkeitsnachweis.
import { createViewer } from "@hestia/viewer";
import {
  bpmnRendererModule,
  importBpmnDiagram,
  readBpmnXml,
  processSample,
} from "@hestia/modeler-bpmn";
import "diagram-js/assets/diagram-js.css";

const el = document.querySelector<HTMLElement>("#diagram");
if (el) {
  const eventsUrl = el.dataset.events ?? "/events";
  const viewer = createViewer({ container: el, additionalModules: [bpmnRendererModule] });

  (window as any).__operate = { ready: false, lastToken: null };

  void (async () => {
    const definitions = await readBpmnXml(processSample);
    importBpmnDiagram(viewer, definitions);

    const source = new EventSource(eventsUrl);
    source.addEventListener("token.enter", (ev: MessageEvent) => {
      const elementId = ev.data;
      viewer.clearOverlays();
      try {
        viewer.showToken(`${elementId}_shape`);
      } catch {
        /* Element evtl. nicht im Diagramm — Token nicht anzeigen */
      }
      (window as any).__operate.lastToken = elementId;
    });

    (window as any).__operate.ready = true;
  })();
}
