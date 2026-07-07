#!/usr/bin/env node
// E2E-Abdeckungs-Check: jede User Story mit Status `aktiv` (docs/user-stories.md)
// muss von mindestens einem Playwright-Spec unter e2e/ referenziert werden
// (Story-ID im Spec-Text). Umgekehrt darf kein Spec eine unbekannte Story-ID
// referenzieren. Dependency-frei; reine Funktionen sind für Tests exportiert.
import { readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { walk } from "./check-invariants.mjs";

const ACTIVE = new Set(["aktiv"]);
const KNOWN_STATUS = new Set(["aktiv", "geplant", "entfällt"]);
const STORY_ID = /US-[A-Z]+-\d+/g;

/** Parse die Markdown-Tabelle -> [{ id, status }]. Spaltenreihenfolge egal. */
export function parseStories(md) {
  const stories = [];
  for (const line of md.split("\n")) {
    const idMatch = line.match(/^\s*\|\s*(US-[A-Z]+-\d+)\s*\|/);
    if (!idMatch) continue;
    const cells = line.split("|").map((c) => c.trim());
    const status = cells.find((c) => KNOWN_STATUS.has(c)) || "unbekannt";
    stories.push({ id: idMatch[1], status });
  }
  return stories;
}

/** Alle in einem Text referenzierten Story-IDs. */
export function extractStoryIds(text) {
  return new Set(text.match(STORY_ID) || []);
}

export function runCheck(root = process.cwd()) {
  const violations = [];
  const registryPath = join(root, "docs", "user-stories.md");
  const stories = parseStories(readFileSync(registryPath, "utf8"));
  const registryIds = new Set(stories.map((s) => s.id));

  // Referenzen aus allen E2E-Specs sammeln.
  const refs = new Set();
  for (const f of walk(join(root, "e2e"), [".ts"])) {
    if (!f.endsWith(".spec.ts")) continue;
    for (const id of extractStoryIds(readFileSync(f, "utf8"))) refs.add(id);
  }

  for (const s of stories) {
    if (ACTIVE.has(s.status) && !refs.has(s.id)) {
      violations.push({ kind: "aktive Story ohne E2E", detail: s.id });
    }
    if (s.status === "unbekannt") {
      violations.push({ kind: "unbekannter Status", detail: s.id });
    }
  }
  for (const r of refs) {
    if (!registryIds.has(r)) {
      violations.push({ kind: "E2E referenziert unbekannte Story", detail: r });
    }
  }

  return { violations, stories, refs: [...refs], registryPath: relative(root, registryPath) };
}

const invokedDirect = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (invokedDirect) {
  const { violations, stories, refs } = runCheck();
  const active = stories.filter((s) => ACTIVE.has(s.status));
  if (violations.length) {
    console.error(`✗ ${violations.length} User-Story-Abdeckungsproblem(e):`);
    for (const v of violations) console.error(`  [${v.kind}] ${v.detail}`);
    process.exit(1);
  }
  console.log(
    `✓ User-Story-Abdeckung OK: ${active.length} aktive Story(s) durch E2E gedeckt ` +
      `(${refs.length} referenziert, ${stories.length} in Registry).`,
  );
}
