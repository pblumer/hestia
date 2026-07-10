import { test, expect } from "@playwright/test";

// Deckt US-OPS-01 ab: der A+B-Machbarkeitsnachweis. Der Go-Server (Klasse A)
// liefert die Instanzseite und bettet den web/viewer (Klasse B) ein; der Token
// wird live per SSE aus dem Server animiert.

const base = "http://127.0.0.1:8093";

declare global {
  interface Window {
    __operate: { ready: boolean; lastToken: string | null };
  }
}

test("US-OPS-01: Instanzliste + eingebetteter Viewer mit Token-Animation", async ({ page }) => {
  // Klasse A: Instanzliste vom Go-Server.
  await page.goto(`${base}/instanzen`);
  await expect(page.getByText("inst-1")).toBeVisible();

  // Klasse B: der eingebettete Viewer rendert den Prozess.
  await page.goto(`${base}/instanzen/inst-1`, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-element-id="Task_1_shape"]')).toBeVisible();
  await expect(page.getByText("Antrag pruefen")).toBeVisible();

  // A+B: der Token erscheint und wandert (SSE-Events aus dem Go-Server).
  await expect(page.locator(".hestia-token")).toBeVisible();
  const first = await page.evaluate(() => window.__operate.lastToken);
  await expect
    .poll(() => page.evaluate(() => window.__operate.lastToken), { timeout: 8000 })
    .not.toBe(first);
});
