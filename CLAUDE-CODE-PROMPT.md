# Claude-Code-Prompt — hestia bootstrappen

> Kopiere den folgenden Block als ersten Prompt in Claude Code, ausgeführt im
> leeren `hestia`-Monorepo. Die vier Docs (`hestia-concept.md`, `invariants.md`,
> die fünf ADRs) liegen bereits unter `docs/` — lege sie dort ab, bevor du
> startest.

---

Du arbeitest im leeren Monorepo `hestia`, dem gemeinsamen UI-Framework für das
pblumer-Ökosystem (clio, temis, clio-workbench, atlas). Lies zuerst
`docs/hestia-concept.md`, `docs/invariants.md` und alle ADRs unter `docs/adr/`.
Diese Dokumente sind bindend — halte dich strikt an die Modulgrenzen und
Invarianten. Wo etwas unklar ist, frage nach, statt zu raten.

## Grundprinzipien (aus den ADRs)

- Zwei UI-Klassen, getrennt: Klasse A = Go + `templ` + HTMX; Klasse B =
  TypeScript auf `diagram-js` + vite. Einzige Kopplung: Design-Tokens.
- Beide Modeler (BPMN, DMN) stehen auf `diagram-js` + eigenem `moddle`, NIE
  direkt auf `bpmn-js`/`dmn-js`. Einheitliches Verhalten lebt ausschließlich in
  `web/modeler-kit`.
- DMN 1.5 ist ein eigener Moddle-Descriptor und die SSOT für Modeler UND
  temis-Engine. Kein 1.3↔1.5-Mapping.
- Operate nutzt denselben diagram-js-Renderer read-only (`web/viewer`), kein
  zweiter Renderer.
- BPMN-Konformität ist prüfbar, nicht behauptet: serialisiertes Basis-XML
  validiert gegen die normativen OMG-Schemas (BPMN 2.0.2), inkl. vollständigem
  Diagram Interchange. atlas-Semantik liegt ausschließlich in `extensionElements`,
  sodass das Basis-XML ohne Extensions schema-valide bleibt.

## Reihenfolge (nicht abweichen ohne Rückfrage)

Baue in dieser Reihenfolge, jeweils mit Tests/Lints, die die relevanten
Invarianten mechanisch prüfen, bevor du zum nächsten Schritt gehst:

1. **Monorepo-Skelett + Toolchain.** Go-Workspace unter `go/`, npm/pnpm-Workspace
   unter `web/`, `apps/`. Ein Task-Runner (Makefile oder `just`) mit Targets:
   `tokens`, `build-go`, `build-web`, `lint`, `test`, `dev`. CI-Konfiguration,
   die INV-H1 (keine Cross-Imports go↔web) und INV-M1 (kein direkter
   bpmn-js/dmn-js-Import) als Check erzwingt.

2. **`tokens/`.** `tokens.json` als SSOT + Generator, der `tokens.css` (CSS-Vars)
   und `tokens.ts` erzeugt. Generierte Dateien sind nie handgepflegt (INV-H2).
   Minimales, aber vollständiges Token-Set: Farbrollen, Abstände, Radien,
   Elevation, Schrift-Rollen, Motion, plus Dark-Mode-Variante.

3. **`web/modeler-kit`.** Fundament auf `diagram-js`: Palette-Mechanik,
   Context-Pad, Selektion/Undo, Integration von `@bpmn-io/properties-panel`,
   Keybindings, Theming aus `tokens.ts`. Renderer beziehen Farben/Metriken NUR
   aus Tokens. Öffentliche, dokumentierte API, auf der die Modeler und der Viewer
   aufsetzen. Kein BPMN-/DMN-Wissen hier.

4. **`web/modeler-dmn`.** DMN-1.5-Moddle-Descriptor (der schwierigste Fall
   zuerst), Renderer für 1.5-Konstrukte, Rules — aufgesetzt auf `modeler-kit`.
   Round-Trip-Test (Laden→Rendern→Speichern) semantisch verlustfrei (INV-M4).
   Den Moddle-Descriptor so strukturieren, dass er als geteiltes Artefakt für
   temis exportierbar ist (INV-M3); den konkreten Verteilweg vorschlagen, aber
   nicht ohne Rückfrage publizieren.

5. **`web/modeler-bpmn`.** Basis-BPMN-2.0.2-Moddle + Renderer/Rules, aufgesetzt
   auf `modeler-kit`. Der Basis-Moddle wird aus den **normativen OMG-Schemas**
   abgeleitet (BPMN 2.0.2), nicht frei geschätzt. Lege die offiziellen Schemas
   versioniert im Repo ab (`Semantic.xsd`/`BPMN20.xsd`, `BPMNDI.xsd`, `DC.xsd`,
   `DI.xsd`) und nutze sie im CI zur XSD-Validierung des serialisierten XML
   (INV-B1). **Diagram Interchange ist verpflichtend** — schreibe vollständiges
   BPMNDI/DC/DI (Shapes, Kanten mit Wegpunkten, Labels, Bounds), sodass Fremd-
   werkzeuge Layout verlustfrei öffnen (INV-B2). Deklariere die angezielte
   Konformitätsklasse explizit (initial: BPMN Process Modeling Conformance).
   Dazu ein getrennter **atlas-Extension-Moddle** für die Ausführungssemantik der
   atlas-Engine (vormals chrampfer), ausschließlich über den
   `extensionElements`-Mechanismus der Spec — Basis-XML bleibt ohne die Extensions
   voll schema-valide (INV-B3). Der Extension-Moddle ist die SSOT zwischen
   `modeler-bpmn` und atlas (INV-M5), analog zum DMN-1.5-Moddle ↔ temis. Benötigte
   Behaviors gezielt aus dem MIT-lizenzierten bpmn-js-Quellcode extrahieren und in
   `modeler-kit` heben — nicht bpmn-js als Ganzes einbinden. Round-Trip-Test:
   Laden → Rendern → Speichern erzeugt schema-valides XML inkl. DI (INV-M4). Als
   Fixtures eignen sich eigene Modelle plus ausgewählte nicht-normative
   OMG-Beispiel-Dateien. **Konventions-Linter (opt-in):** implementiere ein
   umschaltbares eCH-0158-Profil (Version 1.2, NICHT die annullierte V1.0) als
   Linter mit einzeln schaltbaren, dokumentierten Checks, die Verstöße als
   Warnungen/Hinweise melden — niemals als Speicher-Blockade und niemals die
   XSD-Gültigkeit schwächend (INV-B4). Baue die Linter-Engine generisch, sodass
   weitere Profile (z. B. hausinterne Konventionen) darauf aufsetzen können.

6. **`web/viewer`.** Read-only-diagram-js auf `modeler-kit`-Renderern, Palette und
   Modeling-Kommandos deaktiviert, plus Overlay-Layer-API für Token/Heatmaps
   (INV-O1, INV-O2).

7. **`go/core` + `go/components`.** Rendering-Layer (templ+HTMX, Layout,
   Streaming-Abstraktion mit SSE/Polling hinter einem Interface) und eine erste
   typisierte Komponentengruppe: Tabelle mit Server-Pagination, Formular mit
   Validierung, Modal, Event-Timeline. `components` importiert KEINE
   projektspezifischen Pakete (INV-H3). Jede interaktive Komponente hat einen
   JS-freien Fallback (INV-A1).

8. **`apps/operate` (Skelett).** Klasse-A-Instanzliste + Incident-Ansicht,
   modelliert als Konsument von atlas- (Ausführung/Instanzen) und clio-
   (Event-Streams) Daten — zunächst aus einem Mock-Stream, aber mit einer
   Schnittstelle, die dem realen atlas/clio-Datenfluss entspricht. Bettet den
   `web/viewer` für eine Diagramm-Anzeige mit simulierter Token-Animation ein.
   Machbarkeitsnachweis der A+B-Integration.

9. **`apps/examples`.** Je ein minimales Beispiel: DMN-Modeler-Seite,
   BPMN-Modeler-Seite, eine Klasse-A-Inspektor-Seite.

## Arbeitsweise

- Committe pro Schritt, mit ADR-/Invarianten-Referenz in der Commit-Message.
- Wenn ein Schritt eine Invariante nur mit Disziplin (nicht mechanisch) einhalten
  könnte, schlage einen Lint/Test vor, der sie erzwingt.
- Halte an, sobald ein Schritt fertig und grün ist, und fasse zusammen, was
  gebaut wurde und welche Invarianten wie geprüft werden — bevor du weitermachst.
- atlas ist die Workflow-/Ausführungs-Engine (vormals chrampfer) und ein
  benannter, fester Bezug: Ausführungspartner der BPMN-Modelle und Datenquelle für
  Operate. Der atlas-Extension-Moddle (Schritt 5) und der Operate-Datenfluss
  (Schritt 8) sind auf atlas zugeschnitten, nicht generisch. Wo die konkrete
  atlas-API noch unbekannt ist, definiere ein klares Interface und markiere es als
  Integrationspunkt — aber verdrahte es nicht als beliebige Fremdquelle.

Beginne mit Schritt 1 und zeige mir das geplante Verzeichnis-Layout und die
Toolchain-Entscheidungen (Go-Version, pnpm vs. npm, Task-Runner, Lint-Setup) zur
Bestätigung, bevor du Code schreibst.
