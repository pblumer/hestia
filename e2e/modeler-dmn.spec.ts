import { test, expect } from "@playwright/test";

// Deckt US-DMN-01 ab: DMN-1.5-Modell laden, im Browser rendern und verlustfrei
// speichern (Round-Trip) — auf dem gemeinsamen Kit-Renderer.

const url = "/e2e/fixtures/modeler-dmn/";

declare global {
  interface Window {
    __dmn: { ready: boolean; error?: string; save: () => string };
  }
}

test("US-DMN-01: DMN laden, rendern und verlustfrei speichern", async ({ page }) => {
  await page.goto(url);

  // Import erfolgreich (kein Fehler).
  await expect.poll(() => page.evaluate(() => window.__dmn.ready)).toBe(true);
  expect(await page.evaluate(() => window.__dmn.error)).toBeUndefined();

  // Entscheidung als DRD-Shape gerendert, mit Namen.
  await expect(page.locator('[data-element-id="decision_rabatt_shape"]')).toBeVisible();
  await expect(page.getByText("Rabatt ermitteln")).toBeVisible();
  await expect(page.locator('[data-element-id="input_umsatz_shape"]')).toBeVisible();

  // Speichern -> Round-Trip enthält Modell und DI.
  const xml = await page.evaluate(() => window.__dmn.save());
  expect(xml).toContain("<dmn:decisionTable");
  expect(xml).toContain('name="Rabatt ermitteln"');
  expect(xml).toContain('dmnElementRef="decision_rabatt"');
  expect(xml).toContain("<di:waypoint");
});
