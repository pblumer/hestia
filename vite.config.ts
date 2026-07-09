import { defineConfig } from "vite";

// Dev-Server für die Browser-E2E (Playwright startet ihn via webServer).
// Root ist das Repo-Root; die Fixtures liegen unter e2e/fixtures/.
export default defineConfig({
  // Explizit an 127.0.0.1 binden: der Default "localhost" löst auf CI-Runnern
  // zu IPv6 (::1) auf, während Playwright den Healthcheck/baseURL über
  // 127.0.0.1 (IPv4) prüft — dann wird der Server nie „ready" und der E2E-Lauf
  // läuft in einen webServer-Timeout. Die Go-Server binden 0.0.0.0 und sind
  // deshalb nie betroffen.
  server: { host: "127.0.0.1", port: 5178, strictPort: true },
  // Alle Fixture-Seiten vorab scannen, damit vite die schweren Modeler-Deps
  // (diagram-js/bpmn-js/dmn-js) in einem Durchgang beim Start bündelt statt
  // träge on-demand — das verhindert einen Re-Optimize-Reload mitten im Test
  // und macht den (kalten) CI-Start deterministisch.
  optimizeDeps: { entries: ["e2e/fixtures/**/*.html"] },
});
