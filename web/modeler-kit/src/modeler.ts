// Öffentliche Fabrik des Kits: erzeugt einen diagram-js-Modeler mit dem
// kuratierten Modul-Set. Konsumenten (modeler-bpmn/-dmn, viewer) reichen ihre
// zusätzlichen Module (Moddle, Renderer, Rules, Palette-/Context-Pad-Provider)
// über additionalModules ein.
//
// Hinweis: Das CSS (diagram-js.css, tokens.css) bindet der Konsument/die Seite
// ein — die Bibliothek bleibt style-agnostisch.
import DiagramDefault from "diagram-js";
import { kitModules } from "./modules";

export interface ModelerOptions {
  /** Ziel-DOM-Element für den Canvas. */
  container: HTMLElement;
  /** Zusätzliche diagram-js-Module (Moddle, Renderer, Rules, Provider). */
  additionalModules?: unknown[];
}

// Minimale, stabile Sicht auf die diagram-js-Instanz (unabhängig von deren
// internen d.ts-Details).
export interface Modeler {
  get<T = unknown>(name: string, strict?: boolean): T;
  invoke<T = unknown>(fn: (...args: unknown[]) => T): T;
  destroy(): void;
  clear(): void;
}

interface DiagramOptions {
  canvas?: { container: HTMLElement };
  modules?: unknown[];
  [key: string]: unknown;
}
type DiagramCtor = new (options: DiagramOptions) => Modeler;

const Diagram = DiagramDefault as unknown as DiagramCtor;

/** Erzeugt einen Kit-Modeler. Wirft, wenn kein Container übergeben wird.
 *  Die Tastaturbindung ist in diagram-js implizit — kein manuelles bind nötig. */
export function createModeler(options: ModelerOptions): Modeler {
  if (!options || !options.container) {
    throw new Error("createModeler: 'container' ist erforderlich");
  }
  return new Diagram({
    canvas: { container: options.container },
    modules: [...kitModules, ...(options.additionalModules ?? [])],
  });
}
