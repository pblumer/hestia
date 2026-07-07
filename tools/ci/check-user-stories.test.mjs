import { describe, it, expect } from "vitest";
import { parseStories, extractStoryIds } from "./check-user-stories.mjs";

const SAMPLE = `
| ID | Story | Klasse | Schritt | Status | E2E |
|----|-------|--------|---------|--------|-----|
| US-TOK-01 | ... | Tokens | 2 | aktiv | e2e/tokens.spec.ts |
| US-KIT-01 | ... | kit | 3 | geplant | — |
`;

describe("User-Story-Registry-Parser", () => {
  it("liest ID und Status unabhängig von der Spaltenreihenfolge", () => {
    const stories = parseStories(SAMPLE);
    expect(stories).toEqual([
      { id: "US-TOK-01", status: "aktiv" },
      { id: "US-KIT-01", status: "geplant" },
    ]);
  });

  it("ignoriert Kopf- und Trennzeilen", () => {
    expect(parseStories(SAMPLE)).toHaveLength(2);
  });
});

describe("Story-ID-Extraktion aus Specs", () => {
  it("findet alle referenzierten IDs", () => {
    const ids = extractStoryIds("// deckt US-TOK-01 und US-TOK-02 ab\ntest('US-BPMN-03', ...)");
    expect([...ids].sort()).toEqual(["US-BPMN-03", "US-TOK-01", "US-TOK-02"]);
  });
});
