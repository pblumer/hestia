import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { resolveModel, toCSS, toTS } from "./generate.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const model = JSON.parse(readFileSync(join(here, "tokens.json"), "utf8"));

const COLOR_ROLES = [
  "bg", "surface", "surface-raised", "overlay",
  "fg", "fg-muted", "fg-subtle",
  "border", "border-strong",
  "accent", "accent-fg", "accent-muted",
  "success", "success-fg", "warning", "warning-fg",
  "danger", "danger-fg", "info", "info-fg", "focus-ring",
];

describe("Token-Modell (Multi-Theme)", () => {
  it("deklariert die Themes hestia + swiss mit Default hestia", () => {
    expect(model.meta.themes).toEqual(expect.arrayContaining(["hestia", "swiss"]));
    expect(model.meta.default).toBe("hestia");
  });

  it("löst jede Farbrolle für jedes Theme in Hell UND Dunkel auf", () => {
    const { matrix } = resolveModel(model);
    for (const theme of model.meta.themes) {
      for (const mode of ["light", "dark"]) {
        for (const role of COLOR_ROLES) {
          const v = matrix[theme][mode][`color-${role}`];
          expect(v, `${theme}/${mode}/color-${role}`).toMatch(/^(#|rgb)/);
        }
      }
    }
  });

  it("deckt Abstände, Radien, Elevation, Schrift-Rollen und Motion ab", () => {
    expect(Object.keys(model.space).length).toBeGreaterThanOrEqual(10);
    expect(Object.keys(model.radius)).toEqual(
      expect.arrayContaining(["none", "sm", "md", "lg", "xl", "full"]),
    );
    expect(Object.keys(model.elevation).length).toBeGreaterThanOrEqual(4);
    expect(Object.keys(model.text)).toEqual(
      expect.arrayContaining([
        "family-sans", "family-mono", "size-md", "weight-medium", "leading-normal",
      ]),
    );
    expect(Object.keys(model.motion).some((k) => k.startsWith("duration-"))).toBe(true);
    expect(Object.keys(model.motion).some((k) => k.startsWith("ease-"))).toBe(true);
  });
});

describe("Swiss-Theme reproduziert das Bund-Design-System", () => {
  const { matrix } = resolveModel(model);

  it("führt das Schweizer Rot (#d8232a) als Akzent im Hellmodus", () => {
    expect(matrix.swiss.light["color-accent"]).toBe("#d8232a");
    expect(matrix.swiss.light["color-focus-ring"]).toBe("#d8232a");
  });

  it("nutzt Noto Sans als Schrift und kleine Radien", () => {
    expect(matrix.swiss.light["text-family-sans"]).toContain("Noto Sans");
    expect(matrix.swiss.light["radius-md"]).toBe("3px");
  });

  it("hält hestia unverändert (Akzentblau, größere Radien)", () => {
    expect(matrix.hestia.light["color-accent"]).toBe("#2f6feb");
    expect(matrix.hestia.light["radius-md"]).toBe("8px");
  });
});

describe("CSS-Generat trennt Theme- und Mode-Achse", () => {
  const css = toCSS(model);

  it("setzt das Default-Theme (hestia hell) auf :root", () => {
    expect(css).toMatch(/:root \{[\s\S]*--color-accent: #2f6feb;/);
  });

  it("liefert einen vollständigen [data-theme=\"swiss\"]-Block mit Schweizer Rot", () => {
    expect(css).toContain('[data-theme="swiss"] {');
    const block = css.slice(css.indexOf('[data-theme="swiss"] {'));
    expect(block).toContain("--color-accent: #d8232a;");
  });

  it("schaltet Dunkel über [data-mode=\"dark\"] und prefers-color-scheme", () => {
    expect(css).toContain('[data-mode="dark"]');
    expect(css).toContain("prefers-color-scheme: dark");
  });

  it("mischt Theme und Mode nicht: swiss trägt eine eigene Dunkel-Regel", () => {
    expect(css).toContain('[data-theme="swiss"][data-mode="dark"]');
  });
});

describe("TS-Generat: Multi-Theme + Rückwärtskompatibilität", () => {
  const ts = toTS(model);

  it("exportiert die Theme-Namen und die themes-Matrix", () => {
    expect(ts).toContain('export const themeNames = ["hestia","swiss"]');
    expect(ts).toContain("export const themes = {");
  });

  it("behält die von Klasse B genutzten Aliase light/dark/tokens/cssVar", () => {
    expect(ts).toContain("export const light = themes[\"hestia\"].light;");
    expect(ts).toContain("export const dark = themes[\"hestia\"].dark;");
    expect(ts).toContain("export const tokens = light;");
    expect(ts).toContain("export const cssVar");
    expect(ts).toContain("export type TokenKey");
  });
});
