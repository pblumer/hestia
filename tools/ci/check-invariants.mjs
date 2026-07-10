#!/usr/bin/env node
// Mechanische Invarianten-Checks für CI und `make lint` (siehe docs/invariants.md).
// Dependency-frei, damit der Check ohne Installation läuft.
//
// Geprüft:
//   INV-H1  go/ und web/+apps/ teilen ausschließlich tokens/ (@hestia/tokens).
//   INV-H3  go/components importiert keine projektspezifischen Pakete
//           (clio, temis, chrampfer, atlas).
//   INV-M1  web/-Pakete importieren bpmn-js/dmn-js nicht direkt (Quelle + Deps).
//
// Die reinen Funktionen sind exportiert und werden von check-invariants.test.mjs
// getestet.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { fileURLToPath } from "node:url";

const JS_EXTS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"];
const PROJECT_PKGS = ["clio", "temis", "chrampfer", "atlas"];

/** Rekursiv Dateien mit passenden Endungen sammeln (node_modules/dist/.git aus). */
export function walk(dir, exts, acc = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return acc; // Verzeichnis existiert (noch) nicht
  }
  for (const e of entries) {
    if (e === "node_modules" || e === ".git" || e === "dist") continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, exts, acc);
    else if (exts.includes(extname(e))) acc.push(p);
  }
  return acc;
}

/** Modul-Specifier aus JS/TS-Quelltext (import … from, bare import, require). */
export function importSpecifiers(src) {
  const specs = [];
  const re =
    /(?:import|export)[\s\S]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = re.exec(src))) specs.push(m[1] || m[2] || m[3]);
  return specs;
}

/** Import-Pfade aus Go-Quelltext (Block- und Einzel-Imports). */
export function goImports(src) {
  const specs = [];
  let m;
  const block = /import\s*\(([\s\S]*?)\)/g;
  while ((m = block.exec(src))) {
    for (const line of m[1].split("\n")) {
      const q = line.match(/"([^"]+)"/);
      if (q) specs.push(q[1]);
    }
  }
  const single = /import\s+(?:[\w.]+\s+)?"([^"]+)"/g;
  while ((m = single.exec(src))) specs.push(m[1]);
  return specs;
}

/** INV-M1: direkter bpmn-js/dmn-js-Import? */
export function isForbiddenModelerImport(spec) {
  return /^(bpmn-js|dmn-js)(\/|$)/.test(spec);
}

/** INV-H3: importiert ein projektspezifisches Paket (Pfadsegment)? */
export function isProjectSpecificGoImport(spec) {
  return spec.split("/").some((seg) => PROJECT_PKGS.includes(seg));
}

/** INV-U3: importiert das Auth-Modul? go/components darf das nicht. */
export function isGoAuthImport(spec) {
  return spec.includes("/go/auth");
}

/** INV-O1: eigener diagram-js-Renderer (BaseRenderer)? Der Viewer darf keinen
 *  zweiten Renderer definieren — er nutzt den der Modeler. */
export function isBaseRendererImport(spec) {
  return spec.includes("draw/BaseRenderer");
}

const DMN_MODEL_NS = "https://www.omg.org/spec/DMN/20240513/MODEL/";
/** INV-M3: eine DMN-Moddle-Descriptor-Datei (nur in contracts/ erlaubt)? */
export function isDmnModelDescriptor(jsonText) {
  return jsonText.includes(DMN_MODEL_NS) && /"prefix"\s*:\s*"dmn"/.test(jsonText);
}

const ATLAS_NS = "http://hestia/atlas/bpmn";
/** INV-M5: der atlas-Extension-Descriptor (nur in contracts/ erlaubt)? */
export function isAtlasDescriptor(jsonText) {
  return jsonText.includes(ATLAS_NS) && /"prefix"\s*:\s*"atlas"/.test(jsonText);
}

/** INV-H1: verweist ein web/apps-Specifier in die go/-Welt (außer Tokens)? */
export function isWebToGoImport(spec) {
  if (spec === "@hestia/tokens" || spec.startsWith("@hestia/tokens/")) return false;
  return spec.startsWith(".") && /(^|\/)go(\/|$)/.test(spec);
}

/** INV-H1: verweist ein go-Import in die web/-Welt? */
export function isGoToWebImport(spec) {
  return spec.includes("hestia/web") || /(^|\/)web(\/|$)/.test(spec.replace(/^\./, ""));
}

export function runChecks(root = process.cwd()) {
  const v = [];
  const add = (inv, file, detail) => v.push({ inv, file: relative(root, file), detail });

  // INV-M1: Quell-Imports in web/ + apps/
  for (const base of ["web", "apps"]) {
    for (const f of walk(join(root, base), JS_EXTS)) {
      for (const spec of importSpecifiers(readFileSync(f, "utf8"))) {
        if (isForbiddenModelerImport(spec)) add("INV-M1", f, `Direktimport '${spec}'`);
        if (isWebToGoImport(spec)) add("INV-H1", f, `web importiert go '${spec}'`);
      }
    }
  }

  // INV-O1: der Viewer definiert keinen eigenen Renderer (kein BaseRenderer).
  for (const f of walk(join(root, "web", "viewer"), JS_EXTS)) {
    for (const spec of importSpecifiers(readFileSync(f, "utf8"))) {
      if (isBaseRendererImport(spec)) add("INV-O1", f, `Viewer mit eigenem Renderer '${spec}'`);
    }
  }

  // INV-M1: package.json-Deps in web/ + apps/
  for (const base of ["web", "apps"]) {
    for (const f of walk(join(root, base), [".json"])) {
      if (!f.endsWith("package.json")) continue;
      const pkg = JSON.parse(readFileSync(f, "utf8"));
      for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
        for (const dep of Object.keys(pkg[field] || {})) {
          if (dep === "bpmn-js" || dep === "dmn-js") add("INV-M1", f, `Dependency '${dep}'`);
        }
      }
    }
  }

  // INV-M3: der DMN-Descriptor existiert nur in contracts/ (keine Divergenz)
  for (const base of ["web", "apps", "go"]) {
    for (const f of walk(join(root, base), [".json"])) {
      const jsonText = readFileSync(f, "utf8");
      if (isDmnModelDescriptor(jsonText)) {
        add("INV-M3", f, "DMN-Descriptor außerhalb contracts/ (Divergenzgefahr)");
      }
      if (isAtlasDescriptor(jsonText)) {
        add("INV-M5", f, "atlas-Extension-Descriptor außerhalb contracts/ (Divergenzgefahr)");
      }
    }
  }

  // INV-H1: go/ importiert kein web/
  for (const f of walk(join(root, "go"), [".go"])) {
    for (const spec of goImports(readFileSync(f, "utf8"))) {
      if (isGoToWebImport(spec)) add("INV-H1", f, `go importiert web '${spec}'`);
    }
  }

  // INV-H3/U3: go/components ohne projektspezifische und ohne Auth-Imports
  for (const f of walk(join(root, "go", "components"), [".go"])) {
    for (const spec of goImports(readFileSync(f, "utf8"))) {
      if (isProjectSpecificGoImport(spec))
        add("INV-H3", f, `components importiert projektspezifisch '${spec}'`);
      if (isGoAuthImport(spec)) add("INV-U3", f, `components importiert go/auth '${spec}'`);
    }
  }

  return v;
}

// CLI
const invokedDirect =
  process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirect) {
  const violations = runChecks();
  if (violations.length) {
    console.error(`✗ ${violations.length} Invarianten-Verstoß(e):`);
    for (const x of violations) console.error(`  [${x.inv}] ${x.file}: ${x.detail}`);
    process.exit(1);
  }
  console.log("✓ Invarianten OK (INV-H1, INV-H3, INV-M1)");
}
