import { test, expect } from "@playwright/test";

// Deckt US-EX-01 ab: je ein minimales Beispiel — DMN-Modeler, BPMN-Modeler
// (Klasse B, eingebettet) und der Klasse-A-Inspektor (server-gerendert).

const base = "http://127.0.0.1:8092";

test("US-EX-01: DMN-Modeler, BPMN-Modeler und Klasse-A-Inspektor", async ({ page }) => {
  await page.goto(`${base}/dmn`, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-element-id="decision_rabatt_shape"]')).toBeVisible();

  await page.goto(`${base}/bpmn`, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-element-id="Task_1_shape"]')).toBeVisible();

  await page.goto(`${base}/inspector`);
  await expect(page.locator(".hestia-table")).toBeVisible();
  await expect(page.locator(".hestia-form")).toBeVisible();
  await expect(page.locator(".hestia-timeline")).toBeVisible();
});
