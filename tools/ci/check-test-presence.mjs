#!/usr/bin/env node
// TDD-Guard (docs/working-agreement.md, Prinzip 4): kein Quellmodul ohne Tests.
//   - Jedes Go-Modul (go.mod) hat mindestens eine *_test.go-Datei.
//   - Jedes web/-Paket mit TS-Produktivcode hat mindestens eine Testdatei.
//   - apps/ sind ausgenommen (werden über User-Story-E2E abgedeckt).
// Dependency-frei; reine Prädikate für Tests exportiert.
import { readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { walk } from "./check-invariants.mjs";

export const isGoTest = (f) => f.endsWith("_test.go");
export const isTsSource = (f) => /\.tsx?$/.test(f) && !isTsTest(f);
export const isTsTest = (f) => /\.test\.(ts|tsx|mts|mjs|js)$/.test(f);

/** Verzeichnisse, die eine go.mod enthalten (= Go-Module). */
function goModuleDirs(root) {
  return walk(join(root, "go"), [".mod"])
    .filter((f) => f.endsWith("go.mod"))
    .map(dirname);
}

/** Verzeichnisse mit package.json direkt unter web/. */
function webPackageDirs(root) {
  const base = join(root, "web");
  let entries;
  try {
    entries = readdirSync(base);
  } catch {
    return [];
  }
  return entries
    .map((e) => join(base, e))
    .filter((p) => {
      try {
        return statSync(p).isDirectory() && statSync(join(p, "package.json")).isFile();
      } catch {
        return false;
      }
    });
}

export function runCheck(root = process.cwd()) {
  const violations = [];

  for (const dir of goModuleDirs(root)) {
    const files = walk(dir, [".go"]);
    if (!files.some((f) => isGoTest(f))) {
      violations.push({ module: relative(root, dir), reason: "kein *_test.go" });
    }
  }

  for (const dir of webPackageDirs(root)) {
    const files = walk(dir, [".ts", ".tsx", ".mts", ".mjs", ".js"]);
    const hasSource = files.some((f) => isTsSource(f));
    const hasTest = files.some((f) => isTsTest(f));
    if (hasSource && !hasTest) {
      violations.push({ module: relative(root, dir), reason: "TS-Quellcode ohne *.test.*" });
    }
  }

  return violations;
}

const invokedDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirect) {
  const violations = runCheck();
  if (violations.length) {
    console.error(`✗ ${violations.length} Modul(e) ohne Tests (TDD, Prinzip 4):`);
    for (const v of violations) console.error(`  ${v.module}: ${v.reason}`);
    process.exit(1);
  }
  console.log("✓ Test-Präsenz OK: jedes Quellmodul hat Tests.");
}
