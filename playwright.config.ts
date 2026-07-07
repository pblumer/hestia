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
  use: {
    browserName: "chromium",
    viewport: { width: 1280, height: 800 },
    launchOptions,
  },
  projects: [{ name: "chromium" }],
});
