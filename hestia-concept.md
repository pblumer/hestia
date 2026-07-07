# hestia — Gemeinsames UI-Framework für das pblumer-Ökosystem

> Herdfeuer. Das gemeinsame Zuhause aller Oberflächen von clio, temis, clio-workbench und atlas.

## Problem

Vier Projekte (`clio`, `clio-workbench`, `temis`, `atlas`) brauchen Oberflächen.
Diese zerfallen in **zwei fundamental verschiedene UI-Klassen**, die nicht mit
*einem* Framework-Ansatz bedient werden können:

- **Klasse A — Admin/Design-Tools:** ansichts- und formularlastig, wenig
  Client-State. Event-Inspektoren, Listen, Dashboards, Deployment-Verwaltung,
  Incident-Ansichten. → server-side, `templ` + HTMX.
- **Klasse B — IDE-artige Modeler:** diagrammbasiert, zustandslastig auf dem
  Client, Camunda-8-Anspruch. BPMN- und DMN-Modeler, Live-Token-Animation. →
  Client-Runtime auf `diagram-js`, Node-Build.

Der Fehler wäre, **eine** Framework-Entscheidung für beide zu treffen. hestia
trennt die Klassen sauber und koppelt sie nur über **Design-Tokens**.

## Kernentscheidungen (Kurzfassung)

1. **Monorepo** `hestia`: Go (Klasse A) + TS (Klasse B) + Operate in einem Repo,
   ein Design-Token-System, koordinierte Releases.
2. **Klasse A** auf `templ` (typsichere, compile-time-geprüfte Go-Templates) +
   HTMX. Bewährtes clio-workbench-Muster, wiederverwendbar gemacht.
3. **Klasse B — beide Modeler auf gleicher Ebene:** `diagram-js` +
   eigene `moddle`-Descriptors, darüber eine **gemeinsame `modeler-kit`-Schicht**,
   die einheitliches Look-and-Feel *als Code* erzwingt. Kein direkter Import von
   `bpmn-js`/`dmn-js`.
4. **DMN 1.5 als eigener Moddle-Descriptor** ist die *eine Wahrheit* für Modeler
   und temis-Engine. Kein 1.3↔1.5-Mapping-Layer.
5. **Operate** ist überwiegend Klasse A, erbt aber den `diagram-js`-Viewer aus
   `modeler-kit` (read-only + Overlay-Layer) für Token-Animation und Heatmaps.
   Ein Diagramm-Renderer für Editieren *und* Anzeigen.
6. **BPMN-2.0.2-Konformität ist mechanisch geprüft:** der Basis-Moddle wird aus
   den normativen OMG-Schemas abgeleitet, serialisiertes XML validiert im CI gegen
   `Semantic.xsd`/`BPMN20.xsd`/`BPMNDI.xsd`/`DC.xsd`/`DI.xsd`, Diagram Interchange
   ist verpflichtend. atlas-Semantik liegt isoliert in `extensionElements`, sodass
   das Basis-XML ohne Extensions voll konform bleibt.

## Modul-Layout (Monorepo)

```
hestia/
├── docs/
│   ├── hestia-concept.md          # dieses Dokument
│   ├── invariants.md              # die verbindlichen Invarianten
│   └── adr/
│       ├── ADR-0001-rendering-strategy.md
│       ├── ADR-0002-design-tokens.md
│       ├── ADR-0003-modeler-kit-foundation.md
│       ├── ADR-0004-dmn-15-moddle.md
│       ├── ADR-0005-operate-diagram-reuse.md
│       ├── ADR-0006-bpmn-extension-moddle.md
│       ├── ADR-0007-bpmn-202-conformance.md
│       └── ADR-0008-ech-0158-convention-profile.md
│
├── tokens/                        # SSOT für Design-Tokens (Klasse A + B teilen dies)
│   ├── tokens.json                # neutrale Token-Definition
│   ├── tokens.css                 # generiert: CSS-Variablen für templ/HTMX
│   └── tokens.ts                  # generiert: TS-Export für die Modeler
│
├── go/                            # Klasse A — server-side
│   ├── core/                      # Rendering-Layer: templ+HTMX, Layout, SSE-Abstraktion
│   ├── components/                # typisierte templ-Komponenten (Tabellen, Formulare, Modals, Timeline)
│   └── adapters/                  # optionale projektspez. Bindings (clio-Event-Viewer …)
│
├── web/                           # Klasse B — TS/Node, vite-Build
│   ├── modeler-kit/               # FUNDAMENT auf diagram-js: Palette, Context-Pad,
│   │                              #   Selektion, Undo, Properties-Panel-Integration,
│   │                              #   Keybindings, Theming. Erzwingt einheitliches Verhalten.
│   ├── modeler-bpmn/              # BPMN-2.0-Moddle + Renderer/Rules + atlas-Extension-Moddle
│   ├── modeler-dmn/               # DMN-1.5-Moddle + Renderer/Rules
│   └── viewer/                    # read-only diagram-js-Viewer + Overlay-Layer (für Operate)
│
└── apps/
    ├── operate/                   # Cockpit: Klasse A (Listen/Incidents aus atlas+clio) + viewer (Token-Animation)
    └── examples/                  # Referenz-Integrationen pro Projekt
```

**Kopplungsregel:** `go/` und `web/` teilen ausschließlich `tokens/`. Kein
gemeinsames JS-Framework wird erzwungen; Konsistenz kommt über Tokens und über
`modeler-kit`, nicht über eine Rahmenbibliothek.

## Warum `diagram-js` statt `dmn-js`/`bpmn-js`

`dmn-js` spricht DMN 1.3; temis ist DMN 1.5. Statt eines fragilen
Übersetzungs-Layers gehen wir eine Ebene tiefer auf den Unterbau, den `dmn-js`
selbst nutzt: `diagram-js` (neutrale Diagramm-Engine) + `moddle` (Meta-Modell).
Damit definieren wir DMN 1.5 als eigenes Moddle-Schema und erhalten
1.5-konforme XML-Serialisierung direkt.

Der gleiche Unterbau trägt BPMN. Beide Modeler auf `diagram-js` zu stellen ist
der *einzige* Weg zu einem einheitlichen Look-and-Feel — sonst fühlt sich ein
`bpmn-js`-basierter BPMN-Modeler anders an als ein `diagram-js`-basierter
DMN-Modeler (Context-Pad, Snapping, Palette, Undo-Granularität).
BPMN-Behaviors ziehen wir gezielt aus dem MIT-lizenzierten `bpmn-js`-Quellcode
und heben sie in `modeler-kit`.

## Scope-Grenzen

- **Enthalten:** Modeler (BPMN + DMN), Operate (Listen, Incidents, Deployments,
  Token-Animation, Heatmaps), Klasse-A-Komponentenbibliothek, Design-Tokens.
- **Nicht enthalten:** freier Code-Editor mit LSP (Monaco). Falls je nötig,
  ist das eine separate JS-Insel — nicht Teil der Modeler-Schicht.

## Offene Punkte / Reihenfolge

1. `atlas` ist der neue Name der Workflow-/Ausführungs-Engine (vormals
   `chrampfer`). Es ist der Ausführungspartner der BPMN-Modelle und die Quelle
   der Instanz-/Token-Daten für Operate. Der BPMN-Extension-Moddle ist die SSOT
   zwischen `modeler-bpmn` und atlas (analog DMN-1.5-Moddle ↔ temis).
2. Live-Update-Bedarf in Operate (SSE-Tail vs. Polling) entscheidet, wie früh
   `go/core` eine Streaming-Abstraktion braucht. ADR-0001 hält beides offen.
3. Reihenfolge der Umsetzung: `tokens` → `modeler-kit` → `modeler-dmn`
   (schwierigster Fall wg. 1.5) → `modeler-bpmn` → `viewer`/`operate` →
   `go/core`+`components`.
