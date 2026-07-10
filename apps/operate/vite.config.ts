import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// Baut das Operate-Frontend zu static/operate.js (vom Go-Server serviert).
export default defineConfig({
  build: {
    outDir: "static",
    emptyOutDir: false,
    lib: {
      entry: resolve(here, "frontend/main.ts"),
      formats: ["es"],
      fileName: () => "operate.js",
    },
  },
});
