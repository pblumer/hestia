import { test, expect } from "@playwright/test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

// E2E für die Design-Tokens. Verifiziert im echten Browser, dass die generierte
// tokens.css die zugesagten Rollen liefert, der Hell/Dunkel-Wechsel greift
// (Mode-Achse über [data-mode]) und das Marken-Theme umschaltbar ist
// (Theme-Achse über [data-theme]) — der nutzerseitige Vertrag der Token-SSOT.
//
// Abgedeckte User Stories (siehe docs/user-stories.md): US-TOK-01, US-TOK-02,
// US-THEME-01 (Theme-Achse auf Token-Ebene; der server-seitige Umschalter ist
// zusätzlich in theme-switch.spec.ts abgedeckt).

const here = dirname(fileURLToPath(import.meta.url));
const fixture = pathToFileURL(resolve(here, "fixtures/tokens.html")).href;

const cssVar = (name: string) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim();

test("US-TOK-01: konsistente Tokens; data-mode schaltet explizit auf Dunkel", async ({
  page,
}) => {
  await page.goto(fixture);

  // Default: helles Standard-Theme (hestia).
  expect(await page.evaluate(cssVar, "--color-bg")).toBe("#ffffff");
  expect(await page.evaluate(cssVar, "--color-fg")).toBe("#1a1d21");
  // Nicht-farbliche Rollen sind ebenfalls vorhanden (vollständiges Set).
  expect(await page.evaluate(cssVar, "--space-4")).toBe("16px");
  expect(await page.evaluate(cssVar, "--radius-md")).toBe("8px");

  // Explizit dunkel erzwingen (Mode-Achse).
  await page.evaluate(() => document.documentElement.setAttribute("data-mode", "dark"));
  expect(await page.evaluate(cssVar, "--color-bg")).toBe("#0e1116");
  expect(await page.evaluate(cssVar, "--color-fg")).toBe("#e6e8eb");

  // Explizit hell erzwingen überschreibt auch bei dunkler Systempräferenz.
  await page.evaluate(() => document.documentElement.setAttribute("data-mode", "light"));
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

test("US-THEME-01: data-theme=swiss zieht das Bund-Design-System (Rot, Noto, kleine Radien)", async ({
  page,
}) => {
  await page.goto(fixture);

  // Standard-Theme hat blauen Akzent und größere Radien.
  expect(await page.evaluate(cssVar, "--color-accent")).toBe("#2f6feb");

  // Swiss-Theme: Schweizer Rot, Noto Sans, kleiner Radius.
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "swiss"));
  expect(await page.evaluate(cssVar, "--color-accent")).toBe("#d8232a");
  expect(await page.evaluate(cssVar, "--color-focus-ring")).toBe("#d8232a");
  expect(await page.evaluate(cssVar, "--radius-md")).toBe("3px");
  expect(await page.evaluate(cssVar, "--text-family-sans")).toContain("Noto Sans");
});

test("US-THEME-01 + US-TOK-02: Theme und Mode sind orthogonal (swiss + dunkel)", async ({
  browser,
}) => {
  // Swiss-Theme UND dunkle Systempräferenz -> synthetische Swiss-Dunkelvariante.
  const context = await browser.newContext({ colorScheme: "dark" });
  const page = await context.newPage();
  await page.goto(fixture);
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "swiss"));

  // Swiss-Dunkel: aufgehellter Akzent, dunkler Grund (secondary-900).
  expect(await page.evaluate(cssVar, "--color-accent")).toBe("#fc656b");
  expect(await page.evaluate(cssVar, "--color-bg")).toBe("#131b22");

  // Explizit hell erzwingen kippt nur den Mode, nicht das Theme.
  await page.evaluate(() => document.documentElement.setAttribute("data-mode", "light"));
  expect(await page.evaluate(cssVar, "--color-accent")).toBe("#d8232a");
  expect(await page.evaluate(cssVar, "--color-bg")).toBe("#ffffff");

  await context.close();
});
