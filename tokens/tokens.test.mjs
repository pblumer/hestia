import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const model = JSON.parse(readFileSync(join(here, "tokens.json"), "utf8"));

describe("Token-Vollständigkeit (Schritt 2)", () => {
  it("hat alle Farbrollen, je mit Hell UND Dunkel (Dark-Mode-Vollständigkeit)", () => {
    const required = [
      "bg", "surface", "surface-raised", "overlay",
      "fg", "fg-muted", "fg-subtle",
      "border", "border-strong",
      "accent", "accent-fg", "accent-muted",
      "success", "success-fg", "warning", "warning-fg",
      "danger", "danger-fg", "info", "info-fg", "focus-ring",
    ];
    for (const role of required) {
      expect(model.color[role], `Farbrolle '${role}' fehlt`).toBeDefined();
      expect(model.color[role], `Farbrolle '${role}' ohne light`).toHaveProperty("light");
      expect(model.color[role], `Farbrolle '${role}' ohne dark`).toHaveProperty("dark");
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

  it("themenabhängige Werte tragen immer beide Varianten", () => {
    for (const [group, entries] of Object.entries(model)) {
      if (group === "meta") continue;
      for (const [name, value] of Object.entries(entries)) {
        if (value && typeof value === "object") {
          expect(value, `${group}.${name}`).toHaveProperty("light");
          expect(value, `${group}.${name}`).toHaveProperty("dark");
        }
      }
    }
  });
});
