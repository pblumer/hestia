import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// Baut die zwei Modeler-Beispiele zu static/dmn.js und static/bpmn.js
// (+ gemeinsames style.css), die der Go-Server ausliefert.
export default defineConfig({
  build: {
    outDir: "static",
    emptyOutDir: false,
    cssCodeSplit: false,
    lib: {
      entry: {
        dmn: resolve(here, "frontend/dmn.ts"),
        bpmn: resolve(here, "frontend/bpmn.ts"),
      },
      formats: ["es"],
    },
  },
});
