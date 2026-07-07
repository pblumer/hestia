// E2E-Demo des Kits: erzeugt einen generischen Modeler (ohne BPMN-/DMN-Wissen),
// seedet zwei Shapes und registriert generische Palette-/Context-Pad-Provider —
// nur um die Kit-Mechanik im Browser zu prüfen. Test-Hooks hängen an window.__kit.
import { createModeler } from "@hestia/modeler-kit";
import "diagram-js/assets/diagram-js.css";
import "@hestia/tokens/tokens.css";

const container = document.querySelector<HTMLElement>("#canvas");
if (!container) throw new Error("#canvas fehlt");

const modeler = createModeler({ container });

const canvas = modeler.get<any>("canvas");
const elementFactory = modeler.get<any>("elementFactory");
const modeling = modeler.get<any>("modeling");
const elementRegistry = modeler.get<any>("elementRegistry");
const palette = modeler.get<any>("palette");
const contextPad = modeler.get<any>("contextPad");

const root = elementFactory.createRoot({ id: "root" });
canvas.setRootElement(root);

const s1 = elementFactory.createShape({ id: "s1", x: 100, y: 120, width: 100, height: 80 });
const s2 = elementFactory.createShape({ id: "s2", x: 320, y: 120, width: 100, height: 80 });
canvas.addShape(s1, root);
canvas.addShape(s2, root);

// Generischer Palette-Provider (echte Entries liefern später die Modeler).
palette.registerProvider({
  getPaletteEntries() {
    return {
      "create-shape": {
        group: "create",
        className: "kit-create",
        title: "Shape",
        action: {
          click() {
            const shape = elementFactory.createShape({ width: 100, height: 80 });
            modeling.createShape(shape, { x: 540, y: 220 }, root);
          },
        },
      },
    };
  },
});

// Generischer Context-Pad-Provider (Delete).
contextPad.registerProvider({
  getContextPadEntries(element: any) {
    return {
      delete: {
        group: "edit",
        className: "kit-delete",
        title: "Entfernen",
        action: {
          click() {
            modeling.removeElements([element]);
          },
        },
      },
    };
  },
});

// Deterministische Test-Hooks für die E2E.
(window as any).__kit = {
  count: () => elementRegistry.getAll().length,
  createExtraShape: () => {
    const shape = elementFactory.createShape({ width: 80, height: 60 });
    modeling.createShape(shape, { x: 540, y: 340 }, root);
  },
  openPad: (id: string) => contextPad.open(elementRegistry.get(id)),
};
