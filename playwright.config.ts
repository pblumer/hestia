import process from "node:process";
import { existsSync } from "node:fs";
import { defineConfig } from "@playwright/test";

// In dieser Umgebung ist Chromium vorinstalliert (kein Download). In CI wird es
// per `playwright install chromium` bereitgestellt; dann greift der Default-Pfad.
const PREINSTALLED = "/opt/pw-browsers/chromium";
const launchOptions = existsSync(PREINSTALLED) ? { executablePath: PREINSTALLED } : {};

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? "line" : "list",
  // vite-Dev-Server für die Modeler-/Viewer-E2E + der Go-Operate-Server (A+B).
  webServer: [
    {
      command: "pnpm exec vite",
      url: "http://127.0.0.1:5178/e2e/fixtures/modeler-kit/",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // Frontend bauen, Go-Server bauen und (per exec, sauber killbar) starten.
      command:
        "pnpm --filter @hestia/operate run build && go build -C apps/operate -o /tmp/operate-e2e . && OPERATE_STATIC=apps/operate/static PORT=8093 exec /tmp/operate-e2e",
      url: "http://127.0.0.1:8093/instanzen",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      command:
        "pnpm --filter @hestia/examples run build && go build -C apps/examples -o /tmp/examples-e2e . && EXAMPLES_STATIC=apps/examples/static PORT=8092 exec /tmp/examples-e2e",
      url: "http://127.0.0.1:8092/",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
  use: {
    baseURL: "http://127.0.0.1:5178",
    browserName: "chromium",
    viewport: { width: 1280, height: 800 },
    launchOptions,
  },
  projects: [{ name: "chromium" }],
});
