// E2E-Demo des DMN-Modelers: lädt die Rabatt-Fixture, rendert die DRD und stellt
// einen Save-Hook bereit (Round-Trip). Test-Hooks an window.__dmn.
import { createDmnModeler, rabattDmn } from "@hestia/modeler-dmn";
import "diagram-js/assets/diagram-js.css";
import "@hestia/tokens/tokens.css";

const container = document.querySelector<HTMLElement>("#canvas");
if (!container) throw new Error("#canvas fehlt");

const dmn = createDmnModeler({ container });

(window as any).__dmn = {
  ready: false,
  save: () => dmn.saveXML(),
};

dmn
  .importXML(rabattDmn)
  .then(() => {
    (window as any).__dmn.ready = true;
  })
  .catch((err: unknown) => {
    (window as any).__dmn.error = String(err);
  });
