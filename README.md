# hestia

> Herdfeuer. Das gemeinsame UI-Framework für das pblumer-Ökosystem
> (clio, temis, clio-workbench, atlas).

hestia trennt zwei fundamental verschiedene UI-Klassen sauber und koppelt sie
nur über **Design-Tokens**:

- **Klasse A** — server-side Admin/Design-Tools: Go + `templ` + HTMX.
- **Klasse B** — IDE-artige Modeler (BPMN, DMN): TypeScript auf `diagram-js` + vite.

Verbindlich sind [`docs/hestia-concept.md`](docs/hestia-concept.md),
[`docs/invariants.md`](docs/invariants.md), die ADRs unter
[`docs/adr/`](docs/adr/) sowie die
[Arbeitsweise](docs/working-agreement.md) (**TDD**) und die
[User-Story-Registry](docs/user-stories.md).

## Arbeitsweise: TDD

Entwicklung erfolgt **testgetrieben (red → green → refactor)** — Test zuerst,
dann Code. Drei Ebenen: Unit (`vitest`/`go test`), E2E (Playwright, pro User
Story) und die Invarianten-Checks als ausführbare Spezifikation. Details in
[`docs/working-agreement.md`](docs/working-agreement.md); mechanisch geprüft
durch `check-test-presence` (kein Quellmodul ohne Tests) und `check-user-stories`
(jede aktive Story hat E2E).

## Verzeichnis-Layout

```
hestia/
├── docs/            # Konzept, Invarianten, ADRs, eCH-0158-Regelsatz
├── tokens/          # SSOT der Design-Tokens (tokens.json) + Generator → tokens.css/.ts
├── go/              # Klasse A (Go-Workspace): core, components, adapters
├── web/             # Klasse B (pnpm-Workspace): modeler-kit, modeler-dmn, modeler-bpmn, viewer
├── apps/            # operate (Schritt 8), examples (Schritt 9)
└── tools/ci/        # mechanische Invarianten-Checks
```

**Kopplungsregel (INV-H1):** `go/` und `web/` teilen ausschließlich `tokens/`.

## Toolchain

| Bereich | Werkzeug |
|---|---|
| Klasse A | Go 1.24 (`go.work`), `templ`, HTMX |
| Klasse B | Node 22, pnpm-Workspace, TypeScript, vite (ab Schritt 3) |
| Tokens | Node-Generator (zero-dep), Ausgabe eingecheckt + Drift-Check |
| Lint | `golangci-lint`, `gofmt`/`go vet`; ESLint + dependency-cruiser |
| BPMN-Konformität | `xmllint` gegen die normativen OMG-XSDs (ab Schritt 5) |
| Task-Runner | `make` |

## Loslegen

```bash
make setup      # templ + pnpm-Deps installieren
make tokens     # tokens.css/.ts generieren
make lint       # Go/Web-Lints + Invarianten-Checks
make test       # Go- und Web-Tests
make ci         # vollständige Pipeline (Token-Drift + Lint + Test + Build)
make help       # alle Targets
```

## Mechanisch geprüfte Invarianten

Jede Invariante aus `docs/invariants.md` wird — wo möglich — durch einen Check
erzwungen, nicht durch Disziplin:

| Invariante | Wie erzwungen |
|---|---|
| INV-H1 (Klassentrennung go↔web) | `tools/ci/check-invariants.mjs`, dependency-cruiser |
| INV-H2 (Token-SSOT) | Regenerierung + `git diff --exit-code` in CI |
| INV-H3 (Komponenten-Neutralität) | `tools/ci/check-invariants.mjs` (Go-Import-Scan) |
| INV-M1 (kein bpmn-js/dmn-js) | Checker + ESLint `no-restricted-imports` + dependency-cruiser |
| INV-B1/B2 (XSD + DI) | `xmllint`-Validierung im CI (ab Schritt 5) |
| INV-M4 (Round-Trip-Treue) | Round-Trip-Tests (ab Schritt 4/5) |

Weitere Invarianten greifen ab dem Schritt, der die betreffenden Module einführt.
