import { test, expect } from "@playwright/test";

// Deckt US-AUTH-01 (lokaler Zero-Login) und US-AUTH-02 (Server-Login mit
// Session) ab. Zwei operate-Instanzen: 8093 im local-Modus (kein Login), 8094
// im server-Modus (SQLite-Store, geseedeter Admin).

const local = "http://127.0.0.1:8093";
const server = "http://127.0.0.1:8094";

test("US-AUTH-01: lokaler Arbeitsplatz ohne Login sofort nutzbar", async ({ page }) => {
  // Kein Login-Formular, direkt die App — der implizite Benutzer (INV-U1).
  await page.goto(`${local}/instanzen`);
  await expect(page.getByRole("heading", { name: "Instanzen" })).toBeVisible();
  await expect(page.getByText("inst-1")).toBeVisible();
});

test("US-AUTH-02: Server verlangt Login, vergibt Session und weist Falschanmeldung ab", async ({
  page,
}) => {
  // Anonym wird auf das Anmeldeformular umgeleitet.
  await page.goto(`${server}/instanzen`);
  await expect(page).toHaveURL(`${server}/login`);
  await expect(page.locator('form[action="/login"]')).toBeVisible();

  // Falsche Zugangsdaten: Hinweis, keine Session.
  await page.fill('input[name="username"]', "admin");
  await page.fill('input[name="password"]', "falsch");
  await page.click('form[action="/login"] button[type="submit"]');
  await expect(page.getByRole("alert")).toBeVisible();

  // Korrekte Zugangsdaten: Weiterleitung in die geschützte App.
  await page.fill('input[name="username"]', "admin");
  await page.fill('input[name="password"]', "geheim");
  await page.click('form[action="/login"] button[type="submit"]');
  await expect(page).toHaveURL(`${server}/instanzen`);
  await expect(page.getByRole("heading", { name: "Instanzen" })).toBeVisible();

  // Abmelden widerruft die Session — die App ist wieder gesperrt.
  await page.request.post(`${server}/logout`);
  await page.goto(`${server}/instanzen`);
  await expect(page).toHaveURL(`${server}/login`);
});
