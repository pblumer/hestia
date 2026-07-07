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
  // vite-Dev-Server für die Modeler-/Viewer-E2E.
  webServer: {
    command: "pnpm exec vite",
    url: "http://127.0.0.1:5178/e2e/fixtures/modeler-kit/",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: "http://127.0.0.1:5178",
    browserName: "chromium",
    viewport: { width: 1280, height: 800 },
    launchOptions,
  },
  projects: [{ name: "chromium" }],
});
