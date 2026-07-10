# CLAUDE.md — Arbeitsanweisungen für dieses Repo

hestia ist das gemeinsame UI-Framework des pblumer-Ökosystems. Diese Datei
bindet jede Claude-Code-Session. **Zuerst lesen, dann arbeiten.**

## Bindende Dokumente (in dieser Reihenfolge lesen)

1. `docs/hestia-concept.md` — Architektur und Modulgrenzen.
2. `docs/invariants.md` — die prüfbaren Invarianten (INV-*). Bindend.
3. `docs/adr/` — die Architekturentscheidungen (ADRs).
4. `docs/working-agreement.md` — **TDD und Arbeitsweise**. Bindend.
5. `docs/user-stories.md` — SSOT der User Stories; steuert die E2E-Abdeckung.

## Nicht verhandelbar

- **TDD (red → green → refactor):** Test zuerst, dann Code. Siehe
  `docs/working-agreement.md`.
- **Invarianten sind mechanisch geprüft, nicht durch Disziplin.** Wer eine neue
  Invariante nur „einhalten" kann, schreibt einen Check dafür.
- **Zwei UI-Klassen bleiben getrennt (INV-H1):** `go/` (Klasse A, templ+HTMX)
  und `web/` (Klasse B, diagram-js) teilen ausschließlich `tokens/`.
- **Modeler bauen auf `web/modeler-kit` (diagram-js), nie direkt auf
  bpmn-js/dmn-js (INV-M1).**
- **Design-Tokens:** `tokens/tokens.json` ist SSOT; `tokens.css`/`tokens.ts`
  sind generiert und nie handgepflegt (INV-H2).

## Vor jedem Commit

```bash
make ci      # Token-Drift + Lint + Invarianten + Stories + Unit + E2E + Build
```

`make ci` muss grün sein. Pro Schritt anhalten und zusammenfassen, was gebaut
und wie es geprüft wurde.

## Nützliche Targets

`make help` listet alle. Häufig: `make test`, `make e2e`, `make tokens`,
`make check-invariants`, `make check-stories`, `make check-test-presence`.

## Git

Entwicklung auf dem zugewiesenen Feature-Branch. Commit-Messages referenzieren
ADR/Invariante/User-Story. Keine PRs ohne ausdrücklichen Auftrag.
