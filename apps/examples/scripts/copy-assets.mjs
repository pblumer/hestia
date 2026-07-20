// Kopiert die generierten Design-Tokens und die gebündelten Schriften in
// static/ (siehe operate) — INV-H2. Das swiss-Theme braucht fonts.css/fonts/
// für Noto Sans.
import { copyFileSync, mkdirSync, cpSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");
const tokensDir = join(repoRoot, "tokens");
const staticDir = join(here, "..", "static");

mkdirSync(staticDir, { recursive: true });
copyFileSync(join(tokensDir, "tokens.css"), join(staticDir, "tokens.css"));
copyFileSync(join(tokensDir, "fonts.css"), join(staticDir, "fonts.css"));
cpSync(join(tokensDir, "fonts"), join(staticDir, "fonts"), { recursive: true });
console.log("examples: tokens.css, fonts.css, fonts/ -> static/");
