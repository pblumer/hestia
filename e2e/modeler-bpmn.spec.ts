import { test, expect } from "@playwright/test";

// Deckt US-BPMN-01 ab: BPMN-Prozess laden, rendern und verlustfrei speichern.
// Die XSD-Konformität des gespeicherten XML ist zusätzlich als Unit-Test
// abgesichert (xsd.test.ts / INV-B1).

const url = "/e2e/fixtures/modeler-bpmn/";

declare global {
  interface Window {
    __bpmn: { ready: boolean; error?: string; save: () => string };
  }
}

test("US-BPMN-01: BPMN laden, rendern und verlustfrei speichern (mit DI)", async ({ page }) => {
  await page.goto(url);

  await expect.poll(() => page.evaluate(() => window.__bpmn.ready)).toBe(true);
  expect(await page.evaluate(() => window.__bpmn.error)).toBeUndefined();

  // Aktivität und Ereignisse als Shapes gerendert.
  await expect(page.locator('[data-element-id="Task_1_shape"]')).toBeVisible();
  await expect(page.getByText("Antrag pruefen")).toBeVisible();
  await expect(page.locator('[data-element-id="StartEvent_1_shape"]')).toBeVisible();

  // Speichern -> Round-Trip enthält Prozess und vollständiges DI.
  const xml = await page.evaluate(() => window.__bpmn.save());
  expect(xml).toContain('sourceRef="StartEvent_1"');
  expect(xml).toContain("<bpmndi:BPMNShape");
  expect(xml).toContain("<di:waypoint");
});
