# hestia — Invarianten

Verbindliche, prüfbare Regeln. Jede ist so formuliert, dass ihre Verletzung
mechanisch (Lint, Test, Import-Check) erkennbar sein soll.

## Schicht- und Kopplungs-Invarianten

- **INV-H1 (Klassentrennung):** Kein Modul in `go/` importiert aus `web/` und
  umgekehrt. Die einzige geteilte Quelle zwischen Klasse A und B ist `tokens/`.

- **INV-H2 (Token-SSOT):** Alle Farben, Abstände, Radien, Schrift-Rollen stammen
  aus `tokens/tokens.json`. `tokens.css` und `tokens.ts` sind generiert, nie
  handgepflegt. Kein Hard-coded-Farbwert in `go/` oder `web/`.

- **INV-H3 (Komponenten-Neutralität):** Kein Paket in `go/components` importiert
  clio-, temis-, chrampfer- oder atlas-spezifische Pakete. Projektbindungen leben
  ausschließlich in `go/adapters`.

## Modeler-Invarianten

- **INV-M1 (Kit-Fundament):** Jeder Modeler baut auf `web/modeler-kit`.
  Kein Modeler importiert `bpmn-js` oder `dmn-js` direkt.

- **INV-M2 (Verhaltens-Zentralisierung):** Interaktions-, Palette-, Context-Pad-,
  Undo- und Theming-Verhalten sind ausschließlich in `modeler-kit` definiert.
  `modeler-bpmn`/`modeler-dmn` liefern nur Moddle, Renderer und Rules — kein
  eigenes Interaktions-Look-and-Feel.

- **INV-M3 (DMN-1.5-SSOT):** Modeler und temis-Engine teilen denselben
  DMN-1.5-Moddle-Descriptor. Es existiert keine divergierende Schema-Definition
  und kein 1.3↔1.5-Übersetzungs-Layer.

- **INV-M5 (BPMN-Extension-SSOT):** Der BPMN-Extension-Moddle-Descriptor (atlas-
  Ausführungssemantik) ist die einzige Definition dieser Elemente und wird von
  `modeler-bpmn` und der atlas-Engine geteilt. Keine divergierende Definition der
  atlas-Extension-Elemente.

- **INV-B1 (XSD-Konformität):** Von `modeler-bpmn` serialisiertes Basis-XML
  validiert im CI gegen die normativen OMG-Schemas (`Semantic.xsd`/`BPMN20.xsd`,
  `BPMNDI.xsd`, `DC.xsd`, `DI.xsd`, BPMN 2.0.2). Validierung ist ein Test, keine
  manuelle Prüfung.

- **INV-B2 (DI-Vollständigkeit):** Jedes gespeicherte Diagramm enthält
  vollständiges Diagram Interchange (BPMNDI/DC/DI): Shapes, Kanten mit Wegpunkten,
  Labels und Bounds. Ein Fremd-BPMN-2.0.2-Werkzeug kann Modell und Layout
  verlustfrei öffnen.

- **INV-B3 (Extension-Isolation):** Entfernt man alle atlas-Extension-Elemente aus
  einem gespeicherten Modell, validiert das verbleibende XML weiterhin gegen die
  normativen BPMN-2.0.2-Schemas. Kein atlas-Konstrukt ersetzt oder verändert
  Standard-BPMN-Elemente; atlas-Semantik liegt ausschließlich in
  `extensionElements`.

- **INV-B4 (Konventionsprofile sind weich):** Konventionsprofile wie eCH-0158
  (V1.2) werden ausschließlich als opt-in-Linter-Warnungen umgesetzt. Ein
  Profil-Verstoß blockiert niemals das Speichern und schwächt niemals die harte
  XSD-Gültigkeit (INV-B1). Rangfolge: XSD-Gültigkeit > Konventionsprofil.

- **INV-M4 (Serialisierungs-Treue):** Round-Trip `Laden → Rendern → Speichern`
  eines gültigen Modells ist semantisch verlustfrei (XML kann sich normalisieren,
  aber kein Element/Attribut geht verloren). Als Test abgesichert.

## Operate-Invarianten

- **INV-O1 (Ein Renderer):** Operate rendert Diagramme über denselben
  `diagram-js`-Viewer wie die Modeler (read-only-Modus). Kein zweiter, separater
  Diagramm-Renderer.

- **INV-O2 (Overlay-Isolation):** Token-Animation, Heatmaps und Instanz-Overlays
  liegen in einem eigenen Overlay-Layer und verändern das zugrunde liegende
  Modell nicht.

## Barrierefreiheit / Robustheit

- **INV-A1 (JS-Fallback, Klasse A):** Jede interaktive Klasse-A-Komponente
  liefert einen sinnvollen Zustand ohne JavaScript (progressive enhancement via
  HTMX). Modeler (Klasse B) sind hiervon ausgenommen.

## Mehrbenutzer / Auth (ADR-0009)

- **INV-U1 (Modus-Trennung):** Im `local`-Modus existiert genau ein impliziter
  Benutzer, es findet keine Authentifizierung und keine Persistenz statt. Im
  `server`-Modus ist jede Anfrage ohne gültige Session anonym. Als Test in
  `go/auth` abgesichert.

- **INV-U2 (Passwort-Hashing):** Passwörter werden nie im Klartext gespeichert
  oder protokolliert, ausschließlich als bcrypt-Hash. Die `User`-Struktur hat
  kein Klartext-Passwortfeld. Als Test abgesichert.

- **INV-U3 (Auth-Isolation):** `go/components` importiert `go/auth` nicht; der
  Benutzer-/Principal-Kontext fließt ausschließlich über `go/core` und
  `go/adapters`. Verschärft INV-H3; mechanisch geprüft durch
  `tools/ci/check-invariants.mjs`.
