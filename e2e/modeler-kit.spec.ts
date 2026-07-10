import { test, expect } from "@playwright/test";

// Deckt US-KIT-01 ab: einheitliche Kit-Mechanik (Palette, Selektion,
// Context-Pad, Undo) im echten Browser gegen die generische Demo.

const url = "/e2e/fixtures/modeler-kit/";

declare global {
  interface Window {
    __kit: {
      count: () => number;
      createExtraShape: () => void;
      openPad: (id: string) => void;
    };
  }
}

test("US-KIT-01: Palette, Selektion, Context-Pad und Undo funktionieren", async ({ page }) => {
  await page.goto(url);

  // Palette-Mechanik vorhanden.
  await expect(page.locator(".djs-palette")).toBeVisible();

  // Zwei geseedete Shapes gerendert.
  const s1 = page.locator('[data-element-id="s1"]');
  await expect(s1).toBeVisible();

  // Selektion per Klick markiert das Element.
  await s1.click();
  await expect(page.locator('[data-element-id="s1"].selected')).toBeVisible();

  // Context-Pad öffnet mit dem generischen Delete-Entry.
  await page.evaluate(() => window.__kit.openPad("s2"));
  await expect(page.locator(".djs-context-pad .kit-delete")).toBeVisible();

  // Undo via Tastatur: Form erzeugen (count + 1), dann Ctrl+Z (zurück).
  const before = await page.evaluate(() => window.__kit.count());
  await page.evaluate(() => window.__kit.createExtraShape());
  expect(await page.evaluate(() => window.__kit.count())).toBe(before + 1);
  await page.keyboard.press("Control+z");
  await expect.poll(() => page.evaluate(() => window.__kit.count())).toBe(before);
});
