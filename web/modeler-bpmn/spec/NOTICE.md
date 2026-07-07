# Herkunft der Schema- und Descriptor-Dateien

Diese Dateien sind **normative bzw. daraus abgeleitete Artefakte** und werden
versioniert im Repo abgelegt (ADR-0007, INV-B1).

## XSDs (`spec/xsd/`)

`BPMN20.xsd`, `Semantic.xsd`, `BPMNDI.xsd`, `DC.xsd`, `DI.xsd` — die **normativen
maschinenlesbaren OMG-Schemas** für BPMN 2.0(.2). Sie werden im CI zur
XSD-Validierung des serialisierten XML genutzt (INV-B1). Bezugsquelle des im Repo
abgelegten Stands: das MIT-lizenzierte Projekt
[`bpmn-moddle`](https://github.com/bpmn-io/bpmn-moddle) (`resources/bpmn/xsd/`),
das die OMG-Schemas unverändert vendored.

## Base-Moddle (`src/descriptor/`)

`bpmn.json`, `bpmndi.json`, `dc.json`, `di.json` — der **aus den OMG-Schemas
abgeleitete** Moddle-Descriptor (BPMN 2.0.2), übernommen aus `bpmn-moddle`
(MIT). Kein freies Schätzen (ADR-0007). Die atlas-Ausführungssemantik ist bewusst
NICHT enthalten — sie lebt als eigener Extension-Moddle (Schritt 5b, INV-B3/M5).

Lizenz der übernommenen Dateien: MIT (bpmn-moddle). Die OMG-Schemas unterliegen
den OMG-Nutzungsbedingungen.
