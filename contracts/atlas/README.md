# @hestia/atlas-contract — atlas-Extension-Moddle (SSOT)

Die **einzige** Definition der atlas-Ausführungssemantik (INV-M5). atlas ist die
Workflow-/Ausführungs-Engine (vormals chrampfer) und der Ausführungspartner der
BPMN-Modelle.

## Prinzip

- Die atlas-Semantik liegt **ausschließlich** in BPMN `extensionElements`
  (Namespace `http://hestia/atlas/bpmn`). Entfernt man alle atlas-Elemente,
  validiert das verbleibende XML weiterhin gegen die normativen OMG-Schemas
  (INV-B3). Kein atlas-Konstrukt ersetzt oder verändert Standard-BPMN.
- Dieselbe Definition nutzen **`@hestia/modeler-bpmn`** (Modellieren) und die
  **atlas-Engine** (Ausführung). Keine divergierende Definition (INV-M5).

## Inhalt (initial, Integrationspunkt)

| Element | Zweck |
|---------|-------|
| `atlas:taskDefinition` | Worker-Typ + Retries einer Aktivität |
| `atlas:ioMapping` / `atlas:input`/`output` | Variablen-Mapping ein/aus |
| `atlas:properties` / `atlas:property` | freie Ausführungs-Properties |

Der konkrete atlas-API-Umfang ist noch offen und wächst **versioniert**
(`manifest.json`-`version`). Erweiterungen sind ein bewusster, gemeinsamer Schritt
von modeler-bpmn und atlas.

## Verteilweg an atlas (Vorschlag)

Wie beim DMN-Contract: die `atlas.json` ist das kanonische Artefakt; atlas (Go)
vendored sie, gepinnt auf die `manifest.json`-`version`. Publiziert wird erst nach
ausdrücklicher Freigabe.
