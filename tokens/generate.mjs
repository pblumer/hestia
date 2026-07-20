#!/usr/bin/env node
// Generator der Design-Tokens: tokens.json (SSOT) -> tokens.css + tokens.ts.
//
// INV-H2: tokens.css und tokens.ts sind GENERIERT und dürfen nie handgepflegt
// werden. Der CI-Drift-Check (`git diff --exit-code`) erzwingt das: wer die
// generierten Dateien von Hand ändert, bricht die Pipeline.
//
// Deterministisch (kein Timestamp), damit der Drift-Check stabil ist.
//
// Token-Modell (zwei orthogonale Achsen):
//   - Theme (Marke):  z. B. hestia | swiss  -> [data-theme="…"]
//   - Mode (Hell/Dunkel): light | dark       -> [data-mode="…"] / prefers-color-scheme
//   Ein Leaf-Wert ist:
//     - ein String                      -> skalar (überall gleich)
//     - { light, dark }                 -> mode-abhängig, themenneutral
//     - { <theme>: <String|{light,dark}> } -> theme-abhängig (je Theme skalar
//                                             oder wiederum mode-abhängig)
// Flacher CSS-Variablenname: `--<gruppe>-<name>` (z. B. --color-accent, --space-2).

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const MODES = ["light", "dark"];

/** Ist der Wert eine mode-abhängige Form { light, dark } (und kein Theme-Map)? */
function isModeMap(value) {
  const keys = Object.keys(value);
  return keys.length > 0 && keys.every((k) => MODES.includes(k)) && "light" in value;
}

/**
 * Löst einen Leaf-Wert für (theme, mode) auf.
 * @param {string} key   Token-Schlüssel (für Fehlermeldungen)
 * @param {*} value      Rohwert aus tokens.json
 * @param {string} theme aktives Theme
 * @param {string} mode  'light' | 'dark'
 * @param {string} def   Default-Theme (Fallback)
 */
function resolve(key, value, theme, mode, def) {
  if (value === null || typeof value !== "object") return String(value);
  if (isModeMap(value)) return String(value[mode]);

  // Theme-Map: pro Theme skalar oder mode-abhängig.
  const sub = theme in value ? value[theme] : value[def];
  if (sub === undefined) {
    throw new Error(`Token ${key}: kein Wert für Theme '${theme}' und kein Default '${def}'`);
  }
  if (sub === null || typeof sub !== "object") return String(sub);
  if (isModeMap(sub)) return String(sub[mode]);
  throw new Error(`Token ${key}: unerwartete Struktur für Theme '${theme}'`);
}

/** Flache Liste aller Token-Schlüssel in Definitionsreihenfolge. */
function tokenKeys(model) {
  const keys = [];
  for (const [group, entries] of Object.entries(model)) {
    if (group === "meta") continue;
    for (const name of Object.keys(entries)) keys.push({ group, name, key: `${group}-${name}` });
  }
  return keys;
}

/**
 * Baut die aufgelöste Wertematrix: matrix[theme][mode][key] = Wert.
 * @returns {{themes:string[], def:string, keys:{key:string}[], matrix:Record<string,Record<string,Record<string,string>>>}}
 */
export function resolveModel(model) {
  const themes = model.meta?.themes ?? ["default"];
  const def = model.meta?.default ?? themes[0];
  const keys = tokenKeys(model);
  const matrix = {};
  for (const theme of themes) {
    matrix[theme] = {};
    for (const mode of MODES) {
      const row = {};
      for (const { group, name, key } of keys) {
        row[key] = resolve(key, model[group][name], theme, mode, def);
      }
      matrix[theme][mode] = row;
    }
  }
  return { themes, def, keys, matrix };
}

const banner = (ext) =>
  `${ext === "css" ? "/*" : "//"} GENERIERT aus tokens/tokens.json — NICHT bearbeiten (INV-H2). ${ext === "css" ? "*/" : ""}`.trimEnd();

/** Schlüssel, deren Dunkelwert vom Hellwert eines Themes abweicht. */
function differing(matrix, theme, keys) {
  return keys.filter(({ key }) => matrix[theme].dark[key] !== matrix[theme].light[key]);
}

/** Selektor, der das Default-Theme trifft (kein anderes [data-theme]). */
function defaultThemeGuard(themes, def) {
  return themes
    .filter((t) => t !== def)
    .map((t) => `:not([data-theme="${t}"])`)
    .join("");
}

// ---- tokens.css -----------------------------------------------------------
export function toCSS(model) {
  const { themes, def, keys, matrix } = resolveModel(model);
  const guard = defaultThemeGuard(themes, def);
  const L = [];
  L.push(banner("css"));

  // Basis: Default-Theme, Hell.
  L.push(":root {");
  for (const { key } of keys) L.push(`  --${key}: ${matrix[def].light[key]};`);
  L.push("}");
  L.push("");

  // Default-Theme, Dunkel: automatisch per Systemeinstellung (außer explizit
  // hell erzwungen) und explizit über [data-mode="dark"].
  const defDark = differing(matrix, def, keys);
  L.push("/* Default-Theme — Dunkel automatisch per Systemeinstellung. */");
  L.push("@media (prefers-color-scheme: dark) {");
  L.push(`  :root${guard}:not([data-mode="light"]) {`);
  for (const { key } of defDark) L.push(`    --${key}: ${matrix[def].dark[key]};`);
  L.push("  }");
  L.push("}");
  L.push("");
  L.push('/* Default-Theme — Dunkel explizit erzwungen. */');
  L.push(`:root${guard}[data-mode="dark"] {`);
  for (const { key } of defDark) L.push(`  --${key}: ${matrix[def].dark[key]};`);
  L.push("}");
  L.push("");

  // Weitere Themes: jeweils vollständiger Hell-Satz + Dunkel-Abweichungen.
  for (const theme of themes) {
    if (theme === def) continue;
    const sel = `:root[data-theme="${theme}"]`;
    L.push(`/* Theme '${theme}' — Hell (vollständiger Satz). */`);
    L.push(`${sel} {`);
    for (const { key } of keys) L.push(`  --${key}: ${matrix[theme].light[key]};`);
    L.push("}");
    L.push("");
    const dark = differing(matrix, theme, keys);
    L.push(`/* Theme '${theme}' — Dunkel automatisch per Systemeinstellung. */`);
    L.push("@media (prefers-color-scheme: dark) {");
    L.push(`  ${sel}:not([data-mode="light"]) {`);
    for (const { key } of dark) L.push(`    --${key}: ${matrix[theme].dark[key]};`);
    L.push("  }");
    L.push("}");
    L.push("");
    L.push(`/* Theme '${theme}' — Dunkel explizit erzwungen. */`);
    L.push(`${sel}[data-mode="dark"] {`);
    for (const { key } of dark) L.push(`  --${key}: ${matrix[theme].dark[key]};`);
    L.push("}");
    L.push("");
  }
  return L.join("\n");
}

// ---- tokens.ts ------------------------------------------------------------
export function toTS(model) {
  const { themes, def, keys, matrix } = resolveModel(model);
  const obj = (row) =>
    "{\n" + keys.map(({ key }) => `  ${JSON.stringify(key)}: ${JSON.stringify(row[key])},`).join("\n") + "\n} as const";

  const L = [];
  L.push(banner("ts"));
  L.push("//");
  L.push("// Konsum in Klasse B (Modeler/Viewer): Renderer beziehen Farben und Metriken");
  L.push("// ausschließlich hierüber bzw. über die CSS-Variablen (INV-H2). Themes werden");
  L.push("// primär über die CSS-Variablen (var(--…)) angewandt; die Rohwerte hier dienen");
  L.push("// Renderern, die einen konkreten Wert brauchen.");
  L.push("");
  L.push(`export const themeNames = ${JSON.stringify(themes)} as const;`);
  L.push(`export type ThemeName = (typeof themeNames)[number];`);
  L.push(`export const defaultTheme: ThemeName = ${JSON.stringify(def)};`);
  L.push('export type Mode = "light" | "dark";');
  L.push("");

  // themes[<name>][<mode>] = Rohwerte.
  L.push("export const themes = {");
  for (const theme of themes) {
    L.push(`  ${JSON.stringify(theme)}: {`);
    for (const mode of MODES) {
      L.push(`    ${mode}: ${obj(matrix[theme][mode]).replace(/\n/g, "\n    ")},`);
    }
    L.push("  },");
  }
  L.push("} as const;");
  L.push("");

  // Rückwärtskompatible Aliase (Default-Theme). Bestehende Klasse-B-Nutzer
  // (modeler-kit) beziehen weiter light/dark/tokens.
  L.push(`export const light = themes[${JSON.stringify(def)}].light;`);
  L.push(`export const dark = themes[${JSON.stringify(def)}].dark;`);
  L.push("");
  L.push("export type TokenKey = keyof typeof light;");
  L.push("export type Theme = typeof light;");
  L.push("");
  L.push("/** CSS-Variablenreferenz zu einem Token, z. B. cssVar('color-accent') === 'var(--color-accent)'. */");
  L.push("export const cssVar = (key: TokenKey): string => `var(--${key})`;");
  L.push("");
  L.push("/** Rohwerte eines Themes in einem Mode; Fallback auf das Default-Theme. */");
  L.push("export const themeTokens = (theme: ThemeName = defaultTheme, mode: Mode = \"light\") =>");
  L.push("  (themes[theme] ?? themes[defaultTheme])[mode];");
  L.push("");
  L.push("/** Default-Theme (hell). Rohwerte; für Theming bevorzugt cssVar() nutzen. */");
  L.push("export const tokens = light;");
  L.push("");
  return L.join("\n");
}

// ---- CLI ------------------------------------------------------------------
function main() {
  const model = JSON.parse(readFileSync(join(HERE, "tokens.json"), "utf8"));
  const css = toCSS(model);
  const ts = toTS(model);
  writeFileSync(join(HERE, "tokens.css"), css + "\n");
  writeFileSync(join(HERE, "tokens.ts"), ts);
  const { themes, keys } = resolveModel(model);
  console.log(`tokens: ${keys.length} Tokens × ${themes.length} Themes [${themes.join(", ")}] -> tokens.css, tokens.ts`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
