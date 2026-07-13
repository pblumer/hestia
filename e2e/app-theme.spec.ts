import { test, expect } from "@playwright/test";

// Ergänzt US-TOK-01 (explizite Wahl via data-theme) und US-TOK-02 (automatisch
// via prefers-color-scheme) auf App-Ebene: der Go-Server (operate) bezieht seine
// Fläche aus den Tokens, sodass das Basis-Stylesheet das Theme durchreicht.

const base = "http://127.0.0.1:8093";
const server = "http://127.0.0.1:8094"; // operate im server-Modus
const LIGHT_BG = "rgb(255, 255, 255)"; // --color-bg hell (#ffffff)
const DARK_BG = "rgb(14, 17, 22)"; // --color-bg dunkel (#0e1116)

const htmlBg = (page: import("@playwright/test").Page) =>
  page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);

test("US-TOK-02: operate folgt prefers-color-scheme automatisch", async ({ browser }) => {
  const dark = await browser.newContext({ colorScheme: "dark" });
  const dp = await dark.newPage();
  await dp.goto(`${base}/instanzen`, { waitUntil: "domcontentloaded" });
  expect(await htmlBg(dp)).toBe(DARK_BG);
  await dark.close();

  const light = await browser.newContext({ colorScheme: "light" });
  const lp = await light.newPage();
  await lp.goto(`${base}/instanzen`, { waitUntil: "domcontentloaded" });
  expect(await htmlBg(lp)).toBe(LIGHT_BG);
  await light.close();
});

test("US-TOK-01: data-theme überschreibt die Systemeinstellung explizit", async ({ browser }) => {
  // Systempräferenz hell, aber explizit dunkel gewählt -> dunkel gewinnt.
  const ctx = await browser.newContext({ colorScheme: "light" });
  const page = await ctx.newPage();
  await page.goto(`${base}/instanzen`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  expect(await htmlBg(page)).toBe(DARK_BG);

  // Und zurück auf explizit hell trotz dunkler Systempräferenz.
  const ctx2 = await browser.newContext({ colorScheme: "dark" });
  const p2 = await ctx2.newPage();
  await p2.goto(`${base}/instanzen`, { waitUntil: "domcontentloaded" });
  await p2.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  expect(await htmlBg(p2)).toBe(LIGHT_BG);
  await ctx.close();
  await ctx2.close();
});

// Regressionswache: die anonyme Login-Seite (server-Modus) muss ihre Tokens
// laden dürfen — sonst bleibt var(--color-bg) undefiniert und die Seite ist
// dunkel-auf-dunkel. Ein dunkler, aus den Tokens bezogener Hintergrund beweist,
// dass /assets/tokens.css nicht hinter dem Login-Guard liegt.
test("US-TOK-02: Login-Seite (server-Modus) lädt Tokens und ist theme-fähig", async ({
  browser,
}) => {
  const ctx = await browser.newContext({ colorScheme: "dark" });
  const page = await ctx.newPage();
  await page.goto(`${server}/login`, { waitUntil: "domcontentloaded" });
  await expect(page.locator('form[action="/login"]')).toBeVisible();
  expect(await htmlBg(page)).toBe(DARK_BG);
  await ctx.close();
});

// US-TOK-01 im UI: der JS-freie Umschalter setzt das Theme per Cookie, es hält
// über Seitenwechsel und überschreibt die Systempräferenz. Gegen examples
// (8092), da ohne Login. Systempräferenz absichtlich hell.
test("US-TOK-01: JS-freier Theme-Umschalter setzt und hält die Wahl", async ({ browser }) => {
  const ctx = await browser.newContext({ colorScheme: "light" });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:8092/inspector", { waitUntil: "domcontentloaded" });

  // Explizit dunkel wählen -> dunkel, trotz hellem System.
  await page.getByRole("link", { name: "Dunkel" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await htmlBg(page)).toBe(DARK_BG);

  // Wahl hält über einen Seitenwechsel (Cookie, kein JS).
  await page.goto("http://127.0.0.1:8092/", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

  // Zurück auf Auto -> kein explizites Theme mehr, folgt wieder dem System (hell).
  await page.getByRole("link", { name: "Auto" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "");
  expect(await htmlBg(page)).toBe(LIGHT_BG);
  await ctx.close();
});
