import { describe, it, expect } from "vitest";
import { isGoTest, isTsSource, isTsTest, runCheck } from "./check-test-presence.mjs";

describe("Test-Präsenz-Prädikate", () => {
  it("erkennt Go-Testdateien", () => {
    expect(isGoTest("core_test.go")).toBe(true);
    expect(isGoTest("core.go")).toBe(false);
  });

  it("trennt TS-Quellcode von TS-Tests", () => {
    expect(isTsSource("index.ts")).toBe(true);
    expect(isTsSource("index.test.ts")).toBe(false);
    expect(isTsTest("index.test.ts")).toBe(true);
    expect(isTsTest("index.ts")).toBe(false);
  });
});

describe("Test-Präsenz im echten Repo (dogfooding)", () => {
  it("ist verletzungsfrei — jedes Quellmodul hat Tests", () => {
    // Läuft gegen das Repo-Root; belegt, dass der Guard aktuell grün ist.
    expect(runCheck(process.cwd())).toEqual([]);
  });
});
