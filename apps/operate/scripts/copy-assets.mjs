// Kopiert die generierten Design-Tokens (tokens.css) und die gebündelten
// Schriften (fonts.css + fonts/) in das static/-Verzeichnis, damit der Go-Server
// sie unter /assets/ ausliefert (INV-H2: tokens.css bleibt die generierte
// SSOT-Ausgabe, sie wird nur kopiert). Das swiss-Theme braucht fonts.css für
// Noto Sans.
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
console.log("operate: tokens.css, fonts.css, fonts/ -> static/");
