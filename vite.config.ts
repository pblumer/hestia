import { defineConfig } from "vite";

// Dev-Server für die Browser-E2E (Playwright startet ihn via webServer).
// Root ist das Repo-Root; die Fixtures liegen unter e2e/fixtures/.
export default defineConfig({
  server: { port: 5178, strictPort: true },
});
