// Kopiert die generierten Design-Tokens in static/ (siehe operate) — INV-H2.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");
const staticDir = join(here, "..", "static");

mkdirSync(staticDir, { recursive: true });
copyFileSync(join(repoRoot, "tokens", "tokens.css"), join(staticDir, "tokens.css"));
console.log("examples: tokens.css -> static/");
