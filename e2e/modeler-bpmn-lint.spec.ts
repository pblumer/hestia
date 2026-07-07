import { test, expect } from "@playwright/test";

// Deckt US-BPMN-03 ab: das eCH-0158-Profil (opt-in) zeigt Konventionshinweise,
// blockiert aber niemals das Speichern (INV-B4).

const url = "/e2e/fixtures/bpmn-linter/";

declare global {
  interface Window {
    __lint: { ready: boolean; save: () => string; count: () => number };
  }
}

test("US-BPMN-03: eCH-0158-Hinweise sichtbar, Speichern nie blockiert", async ({ page }) => {
  await page.goto(url);
  await expect.poll(() => page.evaluate(() => window.__lint.ready)).toBe(true);

  // Der Prozess (ohne Bezeichnung) erzeugt einen sichtbaren Konventionshinweis.
  await expect(page.locator('.violation[data-rule="ECH-DIA-003"]')).toBeVisible();
  expect(await page.evaluate(() => window.__lint.count())).toBeGreaterThan(0);

  // Trotz Verstoß bleibt Speichern möglich (keine Blockade, INV-B4).
  const xml = await page.evaluate(() => window.__lint.save());
  expect(xml).toContain("<bpmn:definitions");
  expect(xml).toContain("<bpmndi:BPMNShape");
});
