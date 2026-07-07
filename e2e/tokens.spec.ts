import { test, expect } from "@playwright/test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

// E2E für die Design-Tokens (Schritt 2). Verifiziert im echten Browser, dass die
// generierte tokens.css die zugesagten Rollen liefert und der Hell/Dunkel-Wechsel
// tatsächlich greift — der nutzerseitige Vertrag der Token-SSOT.
//
// Abgedeckte User Stories (siehe docs/user-stories.md): US-TOK-01, US-TOK-02.

const here = dirname(fileURLToPath(import.meta.url));
const fixture = pathToFileURL(resolve(here, "fixtures/tokens.html")).href;

const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

test("US-TOK-01: konsistente Tokens; data-theme schaltet explizit auf Dunkel", async ({
  page,
}) => {
  await page.goto(fixture);

  // Default: heller Modus.
  expect(await page.evaluate(cssVar, "--color-bg")).toBe("#ffffff");
  expect(await page.evaluate(cssVar, "--color-fg")).toBe("#1a1d21");
  // Nicht-farbliche Rollen sind ebenfalls vorhanden (vollständiges Set).
  expect(await page.evaluate(cssVar, "--space-4")).toBe("16px");
  expect(await page.evaluate(cssVar, "--radius-md")).toBe("8px");

  // Explizit dunkel erzwingen.
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  expect(await page.evaluate(cssVar, "--color-bg")).toBe("#0e1116");
  expect(await page.evaluate(cssVar, "--color-fg")).toBe("#e6e8eb");

  // Explizit hell erzwingen überschreibt auch bei dunkler Systempräferenz.
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
  expect(await page.evaluate(cssVar, "--color-bg")).toBe("#ffffff");
});

test("US-TOK-02: prefers-color-scheme: dark schaltet automatisch auf Dunkel", async ({
  browser,
}) => {
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto(fixture);

  expect(await page.evaluate(cssVar, "--color-bg")).toBe("#0e1116");
  expect(await page.evaluate(cssVar, "--color-fg")).toBe("#e6e8eb");

  await context.close();
});
