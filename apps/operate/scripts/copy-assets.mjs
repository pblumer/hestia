// Kopiert die generierten Design-Tokens (tokens.css) in das static/-Verzeichnis,
// damit der Go-Server sie unter /assets/tokens.css ausliefert (INV-H2: die
// Datei bleibt die generierte SSOT-Ausgabe, sie wird nur kopiert).
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..", "..", "..");
const staticDir = join(here, "..", "static");

mkdirSync(staticDir, { recursive: true });
copyFileSync(join(repoRoot, "tokens", "tokens.css"), join(staticDir, "tokens.css"));
console.log("operate: tokens.css -> static/");
