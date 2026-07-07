# ADR-0007 — BPMN-2.0.2-Konformität gegen die normativen OMG-Schemas

**Status:** akzeptiert
**Bezug:** ADR-0006 (atlas-Extension-Moddle), OMG BPMN 2.0.2
**Quelle:** https://www.omg.org/spec/BPMN/2.0.2/About-BPMN (Normative Machine Readable Documents)

## Kontext

Der BPMN-Modeler soll spezifikationstreu sein, nicht nur BPMN-ähnlich. Die OMG
veröffentlicht für BPMN 2.0.2 normative maschinenlesbare Dokumente, gegen die
Konformität objektiv geprüft werden kann:

- `Semantic.xsd`, `BPMN20.xsd` — Prozess-/Kollaborationssemantik (das Modell)
- `BPMNDI.xsd`, `DC.xsd`, `DI.xsd` — Diagram Interchange (die visuelle Darstellung)
- zugehörige CMOF-Dateien (BPMN20, BPMNDI, DC, DI) als Meta-Modell

„Sieht aus wie BPMN" ist keine Konformität. Konformität heißt: das serialisierte
XML validiert gegen diese Schemas, und ein anderes BPMN-2.0.2-Werkzeug kann
Modell **und** Layout verlustfrei öffnen.

## Entscheidung

1. **Der Basis-BPMN-Moddle-Descriptor** (`modeler-bpmn`) wird aus den normativen
   OMG-Schemas abgeleitet, nicht frei geschätzt. Referenz sind `Semantic.xsd` /
   `BPMN20.xsd`.

2. **Serialisiertes Basis-XML validiert gegen die normativen XSDs** als
   mechanischer Test (INV-B1). Die offiziellen Schemas werden versioniert im Repo
   abgelegt (`web/modeler-bpmn/spec/` o. Ä.) und im CI zur Validierung genutzt.

3. **Diagram Interchange ist verpflichtend, nicht optional** (INV-B2). Der Modeler
   schreibt vollständiges `BPMNDI`/`DC`/`DI` (Shapes, Kanten mit Wegpunkten,
   Labels, Bounds), sodass Layout in Fremdwerkzeugen erhalten bleibt.

4. **atlas-Extensions bleiben strikt im `extensionElements`-Mechanismus** der Spec
   (ADR-0006). Das Basis-XML bleibt dadurch rein 2.0.2-konform; entfernt man die
   Extensions, validiert es weiterhin. Kein atlas-Konstrukt verändert oder ersetzt
   Standard-BPMN-Elemente.

5. **Angezielte Konformitätsklasse wird explizit deklariert.** Initial:
   *BPMN Process Modeling Conformance* (Prozessdiagramme inkl. DI), mit optionaler
   Ausweitung auf Collaboration. Choreography ist zunächst ausgeschlossen. Die
   deklarierte Klasse bestimmt, welche Elemente der Modeler unterstützen muss.

## Begründung

Die normativen XSDs machen Konformität prüfbar statt behauptbar — passt zum
invariantengetriebenen Stil. DI-Vollständigkeit ist der eigentliche
Interoperabilitätstest und die häufigste Lücke in Eigenbau-Modelern. Die Trennung
Basis/Extension (ADR-0006) ist genau der von der Spec vorgesehene Weg, um
herstellerspezifische Semantik (atlas) hinzuzufügen, ohne Standardkonformität zu
verlieren.

## Konsequenzen

- Round-Trip-Treue (INV-M4) wird für BPMN um XSD-Validierung geschärft: Laden →
  Rendern → Speichern erzeugt weiterhin schema-valides XML inkl. DI.
- Ein Konformitäts-Testset (eigene Modelle + ausgewählte OMG-Beispiel-Dateien) im
  CI. Die OMG stellt nicht-normative Beispiel-Dateien bereit, die als
  Import-Round-Trip-Fixtures dienen können.
- Der DMN-Modeler (ADR-0004) erhält das analoge Prinzip: DMN 1.5 hat ebenfalls
  ein normatives Schema; DMNDI gilt dort entsprechend. (Separat in ADR-0004-Umfeld
  zu schärfen, sobald relevant.)
