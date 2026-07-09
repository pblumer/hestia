import { defineConfig } from "vite";

// Dev-Server für die Browser-E2E (Playwright startet ihn via webServer).
// Root ist das Repo-Root; die Fixtures liegen unter e2e/fixtures/.
export default defineConfig({
  server: { port: 5178, strictPort: true },
  // Alle Fixture-Seiten vorab scannen, damit vite die schweren Modeler-Deps
  // (diagram-js/bpmn-js/dmn-js) in einem Durchgang beim Start bündelt statt
  // träge on-demand — das verhindert einen Re-Optimize-Reload mitten im Test
  // und macht den (kalten) CI-Start deterministisch.
  optimizeDeps: { entries: ["e2e/fixtures/**/*.html"] },
});
