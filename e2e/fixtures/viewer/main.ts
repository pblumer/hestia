// E2E-Demo des read-only-Viewers: rendert einen BPMN-Prozess mit DEMSELBEN
// Renderer wie der Modeler (INV-O1) und legt Token-/Heatmap-Overlays darüber
// (INV-O2). Test-Hooks an window.__viewer.
import { createViewer } from "@hestia/viewer";
import {
  bpmnRendererModule,
  importBpmnDiagram,
  readBpmnXml,
  processSample,
} from "@hestia/modeler-bpmn";
import "diagram-js/assets/diagram-js.css";
import "@hestia/tokens/tokens.css";

const container = document.querySelector<HTMLElement>("#canvas");
if (!container) throw new Error("#canvas fehlt");

const viewer = createViewer({ container, additionalModules: [bpmnRendererModule] });

(window as any).__viewer = { ready: false, modelUnchanged: false };

(async () => {
  const definitions = await readBpmnXml(processSample);
  importBpmnDiagram(viewer, definitions);

  const registry = viewer.get<any>("elementRegistry");
  const before = registry.getAll().length;

  viewer.showToken("Task_1_shape");
  viewer.applyHeatmap({ Task_1_shape: 0.6 });

  const after = registry.getAll().length;
  (window as any).__viewer.modelUnchanged = before === after;
  (window as any).__viewer.ready = true;
})();
