// Theming des Kits aus der Token-SSOT (INV-H2). Renderer beziehen Farben und
// Metriken ausschließlich hierüber — kein Hard-coded-Wert in Klasse B.
import { tokens, type TokenKey } from "@hestia/tokens";

// Theme ist ein diagram-js-Service. Renderer erhalten ihn per DI und lesen
// Tokenwerte über token(); so bleibt die SSOT die einzige Quelle.
export class Theme {
  /** Rohwert eines Tokens (heller Default). Für CSS bevorzugt var(--<key>). */
  token(key: TokenKey): string {
    return tokens[key];
  }
}

// diagram-js-Modul, das den Theme-Service bereitstellt.
export const themeModule = {
  theme: ["type", Theme],
};

export default themeModule;
