# hestia — User-Story-Registry

Diese Registry ist die **SSOT der User Stories** und die Grundlage der
E2E-Abdeckung. Jede Story mit Status `aktiv` MUSS von mindestens einem
Playwright-E2E-Test unter `e2e/` abgedeckt sein (Referenz per Story-ID im Spec).
Das erzwingt `tools/ci/check-user-stories.mjs` mechanisch — „E2E deckt alle User
Stories ab" ist damit ein Check, keine Behauptung.

## Status-Vokabular

- `aktiv` — umgesetzt; **E2E-Abdeckung erzwungen**.
- `geplant` — für einen späteren Schritt vorgesehen; noch keine E2E nötig.
- `entfällt` — bewusst nicht umgesetzt (mit Begründung in der Story).

> Hinweis: Dieser Backlog ist aus `docs/hestia-concept.md` abgeleitet und als
> Startpunkt gedacht. Bitte ergänzen/schärfen — die Stories steuern, was E2E
> abdecken muss. Sobald ein Schritt fertig ist, wechseln seine Stories auf
> `aktiv` und brauchen dann E2E.

## Stories

| ID | Story | Klasse / Modul | Schritt | Status | E2E |
|----|-------|----------------|---------|--------|-----|
| US-TOK-01 | Als Nutzer sehe ich eine konsistente Oberfläche aus einer Token-Quelle und kann den Hell-/Dunkel-Modus explizit wählen. | Tokens (A+B) | 2 | aktiv | `e2e/tokens.spec.ts` |
| US-TOK-02 | Als Nutzer erhalte ich automatisch den zur Systemeinstellung passenden Hell-/Dunkel-Modus. | Tokens (A+B) | 2 | aktiv | `e2e/tokens.spec.ts` |
| US-KIT-01 | Als Modellierer bediene ich beide Modeler mit identischer Palette, Context-Pad, Selektion und Undo (einheitliches Look-and-Feel). | modeler-kit (B) | 3 | aktiv | `e2e/modeler-kit.spec.ts` |
| US-DMN-01 | Als Fachautor erstelle, lade und speichere ich DMN-1.5-Entscheidungen verlustfrei (Round-Trip). | modeler-dmn (B) | 4 | aktiv | `e2e/modeler-dmn.spec.ts` |
| US-DMN-02 | Als temis-Nutzer verwende ich denselben DMN-1.5-Descriptor in Modeler und Engine (eine Wahrheit). | modeler-dmn ↔ temis | 4 | geplant | — |
| US-BPMN-01 | Als Modellierer speichere ich BPMN, das ein Fremdwerkzeug schemavalide und mit vollständigem Layout öffnet. | modeler-bpmn (B) | 5 | aktiv | `e2e/modeler-bpmn.spec.ts` (+ `xsd.test.ts`) |
| US-BPMN-02 | Als atlas-Autor hinterlege ich Ausführungssemantik in extensionElements, ohne die Standardkonformität zu brechen. | modeler-bpmn ↔ atlas | 5 | geplant | — |
| US-BPMN-03 | Als Verwaltungs-Modellierer aktiviere ich das eCH-0158-Profil und sehe Konventionshinweise — niemals als Speicher-Blockade. | modeler-bpmn (B) | 5 | aktiv | `e2e/modeler-bpmn-lint.spec.ts` (+ `lint/lint.test.ts`) |
| US-VIEW-01 | Als Operate-Nutzer sehe ich ein read-only-Diagramm mit Overlays, ohne das Modell zu verändern. | viewer (B) | 6 | aktiv | `e2e/viewer.spec.ts` |
| US-COMP-01 | Als Admin bediene ich Tabelle, Formular, Modal und Timeline auch ohne JavaScript (sinnvoller Fallback). | go/components (A) | 7 | geplant | — |
| US-OPS-01 | Als Operator sehe ich laufende Instanzen und Incidents (aus atlas/clio) samt Token-Animation im Diagramm. | apps/operate (A+B) | 8 | aktiv | `e2e/operate.spec.ts` |
| US-EX-01 | Als Entwickler öffne ich je eine Beispielseite für DMN-Modeler, BPMN-Modeler und einen Klasse-A-Inspektor. | apps/examples | 9 | aktiv | `e2e/examples.spec.ts` |
| US-AUTH-01 | Als lokaler Entwickler starte ich hestia ohne Login und arbeite sofort als impliziter Benutzer (kein Store nötig). | go/auth + go/core | 7 | aktiv | `e2e/auth.spec.ts` |
| US-AUTH-02 | Als Nutzer eines hestia-Servers melde ich mich an, erhalte eine Session und kann mich abmelden; der Server bedient mehrere Benutzer gleichzeitig. | go/auth + authstore + go/core | 7 | aktiv | `e2e/auth.spec.ts` |
