import { test, expect } from "@playwright/test";

// US-THEME-01: Der server-seitige, JS-freie Theme-Umschalter (Klasse A). Der
// Nutzer wählt Marke (hestia|swiss) und Ansicht (auto|hell|dunkel); der Server
// persistiert die Wahl als Cookie und rendert neu. Getrieben wird der echte
// operate-Server (local-Modus) unter 127.0.0.1:8093.
//
// Abgedeckte User Story: US-THEME-01 (siehe docs/user-stories.md).

const base = "http://127.0.0.1:8093";
const SWISS_RED = "rgb(216, 35, 42)"; // --color-accent swiss hell (#d8232a)
const SWISS_DARK_BG = "rgb(19, 27, 34)"; // --color-bg swiss dunkel (#131b22)

const htmlBg = (page: import("@playwright/test").Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
const navColor = (page: import("@playwright/test").Page) =>
  page.evaluate(() => {
    const a = document.querySelector(".hestia-nav a") as HTMLElement;
    return getComputedStyle(a).color;
  });

test("US-THEME-01: Umschalter ist ein gewöhnliches GET-Formular (JS-frei)", async ({ page }) => {
  await page.goto(`${base}/instanzen`, { waitUntil: "domcontentloaded" });
  const form = page.locator('form.hestia-themebar');
  await expect(form).toHaveAttribute("action", "/theme");
  await expect(form).toHaveAttribute("method", "get");
  await expect(form.locator('select[name="theme"]')).toBeVisible();
  await expect(form.locator('select[name="mode"]')).toBeVisible();
});

test("US-THEME-01: Wahl von Swiss (Bund) färbt die Oberfläche und bleibt erhalten", async ({
  browser,
}) => {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${base}/instanzen`, { waitUntil: "domcontentloaded" });

  // Ausgangslage: Standard-Theme (hestia), nicht das Schweizer Rot.
  expect(await navColor(page)).not.toBe(SWISS_RED);

  // Über den Umschalter auf Swiss (Bund) stellen und übernehmen.
  await page.selectOption('form.hestia-themebar select[name="theme"]', "swiss");
  await page.click('form.hestia-themebar button[type="submit"]');
  await page.waitForLoadState("domcontentloaded");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "swiss");
  expect(await navColor(page)).toBe(SWISS_RED);

  // Persistenz: ein frischer Seitenaufruf im selben Kontext bleibt Swiss (Cookie).
  const page2 = await ctx.newPage();
  await page2.goto(`${base}/incidents`, { waitUntil: "domcontentloaded" });
  await expect(page2.locator("html")).toHaveAttribute("data-theme", "swiss");
  expect(await navColor(page2)).toBe(SWISS_RED);

  await ctx.close();
});

test("US-THEME-01: Ansicht auf Dunkel ist unabhängig vom Theme wählbar", async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: "light" });
  const page = await ctx.newPage();
  await page.goto(`${base}/instanzen`, { waitUntil: "domcontentloaded" });

  // Swiss + Dunkel gleichzeitig wählen.
  await page.selectOption('form.hestia-themebar select[name="theme"]', "swiss");
  await page.selectOption('form.hestia-themebar select[name="mode"]', "dark");
  await page.click('form.hestia-themebar button[type="submit"]');
  await page.waitForLoadState("domcontentloaded");

  await expect(page.locator("html")).toHaveAttribute("data-theme", "swiss");
  await expect(page.locator("html")).toHaveAttribute("data-mode", "dark");
  expect(await htmlBg(page)).toBe(SWISS_DARK_BG);

  await ctx.close();
});
