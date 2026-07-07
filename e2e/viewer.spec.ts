import { test, expect } from "@playwright/test";

// Deckt US-VIEW-01 ab: read-only-Diagramm mit Overlays, ohne das Modell zu
// verändern. Gerendert mit demselben Kit-Renderer wie die Modeler (INV-O1);
// Overlays im eigenen Layer (INV-O2).

const url = "/e2e/fixtures/viewer/";

declare global {
  interface Window {
    __viewer: { ready: boolean; modelUnchanged: boolean };
  }
}

test("US-VIEW-01: read-only-Diagramm mit Overlays, Modell unverändert", async ({ page }) => {
  await page.goto(url);
  await expect.poll(() => page.evaluate(() => window.__viewer.ready)).toBe(true);

  // Gleiche Darstellung wie im Modeler (derselbe Renderer).
  await expect(page.locator('[data-element-id="Task_1_shape"]')).toBeVisible();
  await expect(page.getByText("Antrag pruefen")).toBeVisible();

  // Read-only: keine Palette, kein Context-Pad.
  await expect(page.locator(".djs-palette")).toHaveCount(0);

  // Overlays sichtbar im eigenen Layer (INV-O2).
  await expect(page.locator(".hestia-token")).toBeVisible();
  await expect(page.locator(".hestia-heat")).toBeVisible();

  // Die Overlays haben das Modell nicht verändert.
  expect(await page.evaluate(() => window.__viewer.modelUnchanged)).toBe(true);
});
