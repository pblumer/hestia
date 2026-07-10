# @hestia/dmn-contract — DMN-1.5-Schema (SSOT)

Dieses Verzeichnis ist die **einzige** Definition des DMN-1.5-Moddle-Descriptors
im Ökosystem (INV-M3). Es gibt **kein** 1.3↔1.5-Mapping und keine zweite
Schema-Quelle.

## Inhalt

| Datei | Inhalt | Namespace |
|-------|--------|-----------|
| `dmn.json` | MODEL (Definitions, Decision, DecisionTable, …) | `…/DMN/20240513/MODEL/` |
| `dmndi.json` | Diagram Interchange (DMNDI) | `…/DMN/20240513/DMNDI/` |
| `dc.json` | Geometrie (Bounds, Point) | `…/DMN/20180521/DC/` |
| `di.json` | DI-Basis | `…/DMN/20180521/DI/` |
| `manifest.json` | Version, Namespaces, Konsumenten | — |

## Konsumenten

- **`@hestia/modeler-dmn`** (JS/TS) importiert die Descriptoren über den
  Paket-Export (`import { dmnDescriptors } from "@hestia/dmn-contract"`).
- **temis** (Go-Engine) **vendored** die JSON-Dateien dieses Verzeichnisses als
  kanonische Schema-Quelle. Vorgeschlagener Verteilweg (siehe unten).

## Verteilweg an temis (Vorschlag)

Da temis in Go geschrieben ist und kein moddle nutzt, ist der geteilte Artefakt
die **rohe JSON-Definition**, nicht der TS-Export. Empfohlen:

1. **Vendoring über Git** — temis bezieht die Dateien aus
   `contracts/dmn/*.json` dieses Repos (Git-Subtree/Submodule oder ein
   CI-Sync-Schritt), gepinnt auf die `manifest.json`-`version`.
2. Alternativ ein **veröffentlichtes Versionsartefakt** (z. B. ein Release-Asset
   `dmn-contract-<version>.tar.gz`), das temis im Build zieht.

Die `manifest.json`-`version` (SemVer, aktuell `1.5.0`) ist die Kopplungsgröße:
eine Schemaänderung ist ein bewusster, versionierter Schritt für beide Seiten.

> Publiziert wird erst nach ausdrücklicher Freigabe.
