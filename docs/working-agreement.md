# hestia — Arbeitsweise (verbindlich)

Diese Regeln gelten für alle Beiträge zu hestia. Sie ergänzen `invariants.md`
(die *was*-Regeln) um das *wie* der Entwicklung.

## Prinzip 1 — Test-Driven Development (TDD)

Wir entwickeln **testgetrieben, red → green → refactor**:

1. **Rot:** Zuerst einen Test schreiben, der das gewünschte Verhalten beschreibt
   und (noch) fehlschlägt. Bei nutzersichtbarem Verhalten ist das ein
   **E2E-Test** zur passenden User Story; bei interner Logik ein **Unit-Test**.
2. **Grün:** Die minimale Implementierung schreiben, die den Test erfüllt.
3. **Refactor:** Aufräumen, ohne das Verhalten zu ändern — Tests bleiben grün.

Kein Produktivcode ohne vorher geschriebenen, fehlschlagenden Test. Neue
öffentliche APIs, Bugfixes und Verhaltensänderungen beginnen mit einem Test.

## Prinzip 2 — Drei Testebenen

| Ebene | Werkzeug | Wofür |
|-------|----------|-------|
| **Unit** | `vitest` (web/tooling), `go test` (Go) | Logik, Serialisierung, Ränder |
| **E2E** | Playwright (`e2e/`) | nutzersichtbares Verhalten je **User Story** |
| **Invarianten** | `tools/ci/*.mjs` | die Invarianten als ausführbare Spezifikation |

Die mechanischen Checks (`check-invariants`, `check-user-stories`,
`check-test-presence`) sind selbst getestet — die Regeln dürfen nicht still
verrotten.

## Prinzip 3 — User Stories steuern E2E

`docs/user-stories.md` ist die SSOT der User Stories. Jede Story mit Status
`aktiv` **muss** von mindestens einem E2E-Test abgedeckt sein
(`check-user-stories`). Wird ein Schritt fertig, wechseln seine Stories auf
`aktiv` — ab dann erzwingt CI die E2E-Abdeckung.

## Prinzip 4 — Kein Quellmodul ohne Tests

Jedes Go-Modul und jedes `web/`-Paket mit Produktivcode hat mindestens eine
Testdatei (`check-test-presence`). `apps/` sind davon ausgenommen und werden
über User-Story-E2E abgedeckt.

## Ablauf pro Feature/Schritt

1. Betroffene User Story anlegen/aktualisieren (falls nutzersichtbar).
2. **Test(s) zuerst** schreiben — E2E und/oder Unit — und rot laufen sehen.
3. Implementieren bis grün.
4. Refaktorieren; `make ci` muss grün sein
   (Lint, Invarianten, Stories, Unit, E2E, Build).
5. Commit mit Referenz auf ADR/Invariante/Story. Pro Schritt anhalten und
   zusammenfassen, was gebaut und wie es geprüft wurde.

## Definition of Done

- [ ] Test(s) existierten vor dem Code und sind jetzt grün.
- [ ] Nutzersichtbares Verhalten ist per E2E zur User Story abgedeckt.
- [ ] Betroffene Invarianten sind mechanisch geprüft.
- [ ] `make ci` grün.
