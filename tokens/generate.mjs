#!/usr/bin/env node
// Generator der Design-Tokens: tokens.json (SSOT) -> tokens.css + tokens.ts.
//
// INV-H2: tokens.css und tokens.ts sind GENERIERT und dürfen nie handgepflegt
// werden. Der CI-Drift-Check (`git diff --exit-code`) erzwingt das: wer die
// generierten Dateien von Hand ändert, bricht die Pipeline.
//
// Deterministisch (kein Timestamp), damit der Drift-Check stabil ist.
//
// Token-Modell:
//   - "color"-Gruppe: jeder Eintrag ist { light, dark } (themenabhängig).
//   - alle anderen Gruppen: skalare Werte (light == dark).
// Flacher CSS-Variablenname: `--<gruppe>-<name>` (z. B. --color-accent, --space-2).

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const source = JSON.parse(readFileSync(join(HERE, "tokens.json"), "utf8"));

/** @returns {{key:string, light:string, dark:string}[]} */
function flatten(model) {
  const rows = [];
  for (const [group, entries] of Object.entries(model)) {
    if (group === "meta") continue;
    for (const [name, value] of Object.entries(entries)) {
      const key = `${group}-${name}`;
      if (value && typeof value === "object") {
        if (!("light" in value) || !("dark" in value)) {
          throw new Error(`Token ${key}: themenabhängiger Wert braucht { light, dark }`);
        }
        rows.push({ key, light: String(value.light), dark: String(value.dark) });
      } else {
        rows.push({ key, light: String(value), dark: String(value) });
      }
    }
  }
  return rows;
}

const rows = flatten(source);
const differ = rows.filter((r) => r.light !== r.dark);

const banner = (ext) =>
  `${ext === "css" ? "/*" : "//"} GENERIERT aus tokens/tokens.json — NICHT bearbeiten (INV-H2). ${ext === "css" ? "*/" : ""}`.trimEnd();

// ---- tokens.css -----------------------------------------------------------
const cssLines = [];
cssLines.push(banner("css"));
cssLines.push(":root {");
for (const r of rows) cssLines.push(`  --${r.key}: ${r.light};`);
cssLines.push("}");
cssLines.push("");
cssLines.push("/* Dark-Mode: automatisch per Systemeinstellung, außer explizit hell erzwungen. */");
cssLines.push('@media (prefers-color-scheme: dark) {');
cssLines.push('  :root:not([data-theme="light"]) {');
for (const r of differ) cssLines.push(`    --${r.key}: ${r.dark};`);
cssLines.push("  }");
cssLines.push("}");
cssLines.push("");
cssLines.push('/* Dark-Mode: explizit erzwungen via [data-theme="dark"]. */');
cssLines.push('[data-theme="dark"] {');
for (const r of differ) cssLines.push(`  --${r.key}: ${r.dark};`);
cssLines.push("}");
cssLines.push("");
writeFileSync(join(HERE, "tokens.css"), cssLines.join("\n"));

// ---- tokens.ts ------------------------------------------------------------
const tsObj = (pick) =>
  "{\n" + rows.map((r) => `  ${JSON.stringify(r.key)}: ${JSON.stringify(pick(r))},`).join("\n") + "\n} as const";

const tsLines = [];
tsLines.push(banner("ts"));
tsLines.push("//");
tsLines.push("// Konsum in Klasse B (Modeler/Viewer): Renderer beziehen Farben und Metriken");
tsLines.push("// ausschließlich hierüber bzw. über die CSS-Variablen (INV-H2).");
tsLines.push("");
tsLines.push(`export const light = ${tsObj((r) => r.light)};`);
tsLines.push("");
tsLines.push(`export const dark = ${tsObj((r) => r.dark)};`);
tsLines.push("");
tsLines.push("export type TokenKey = keyof typeof light;");
tsLines.push("export type Theme = typeof light;");
tsLines.push("");
tsLines.push("/** CSS-Variablenreferenz zu einem Token, z. B. cssVar('color-accent') === 'var(--color-accent)'. */");
tsLines.push("export const cssVar = (key: TokenKey): string => `var(--${key})`;");
tsLines.push("");
tsLines.push("/** Default-Theme (hell). Rohwerte; für Theming bevorzugt cssVar() nutzen. */");
tsLines.push("export const tokens = light;");
tsLines.push("");
writeFileSync(join(HERE, "tokens.ts"), tsLines.join("\n"));

console.log(`tokens: ${rows.length} Tokens -> tokens.css, tokens.ts (${differ.length} themenabhängig)`);
