# ADR-0008 — eCH-0158 als optionales Konventions-Linter-Profil

**Status:** akzeptiert
**Bezug:** ADR-0007 (BPMN-2.0.2-Konformität)
**Quelle:** eCH-0158 „BPMN-Modellierungskonventionen für die öffentliche
Verwaltung", **Version 1.2, genehmigt 2020-06-05** (die frühere V1.0 von 2014 ist
annulliert — NICHT referenzieren). Bezugsrahmen: eCH-0140, BPMN als
ISO 19510:2013.

## Kontext

Für Prozesse der öffentlichen Verwaltung (und, für Pat relevant, ähnlich
strukturierte Geschäftsprozesse wie in der Garage) definiert eCH-0158
Modellierungskonventionen, die die Freiheitsgrade von BPMN bewusst einschränken
und die Lesbarkeit vereinheitlichen. Beispiele solcher Regeln:

- Aktivitäten als „Substantiv + Verb im Infinitiv" benennen.
- Max. 9–15 Aktivitäten pro Diagramm.
- Von links nach rechts modellieren; Rückflüsse/Überkreuzungen vermeiden.
- Genau ein vollständiger Prozess pro aufgeklapptem Pool.
- Zugeklappte Pools haben mindestens einen ein-/ausgehenden Nachrichtenfluss.
- Vor XOR-/OR-Gateway ist eine Aktivität obligatorisch (bestimmt die Verzweigung).
- Auf prüfende Tätigkeiten folgt immer ein Gateway.
- Zusammenführung verzweigter Sequenzflüsse ist obligatorisch (mit definierten
  Ausnahmen).
- Lanes max. drei Ebenen verschachtelt; über gesamte Poolbreite.
- Farben grundsätzlich vermeiden (Barrierefreiheit, S/W-Druck).
- Ausgehende Nachrichten aus Aktivitäten, nicht aus Nachrichten-Zwischenereignissen.
- Sequenzflüsse nur nach XOR/OR beschriftet; AND-/Ereignis-Gateways unbeschriftet.

eCH-0158 ist **keine Konformitätsklasse und kein Schema**. Es ist eine
Konventions-/Stil-Ebene *über* BPMN, mit Fokus auf die deskriptive Modellebene
(V1.2 ergänzt eine Beilage „Erweiterte Symbolpalette für analytische
Modellierung").

## Entscheidung

1. **eCH-0158 wird als optionales, umschaltbares Linter-Profil** in
   `modeler-bpmn` umgesetzt, nicht als harte Regel. Es prüft Modelle gegen die
   Konventionen und meldet **Verstöße als Warnungen/Hinweise**, blockiert aber
   nicht das Speichern.

2. **Es ersetzt oder schwächt die BPMN-2.0.2-Konformität (ADR-0007) niemals.**
   Rangfolge: XSD-Gültigkeit (hart, INV-B1) > eCH-0158-Profil (weich, opt-in).
   Ein Modell, das eCH-0158 verletzt, kann trotzdem voll BPMN-valide sein.

3. **Profil-Umfang deklariert.** Das Profil bezieht sich auf eCH-0158 **V1.2**.
   Regeln werden als einzeln an-/abschaltbare Checks implementiert (nicht als
   monolithischer An/Aus-Schalter), damit Teilmengen nutzbar sind.

4. **Kein Konflikt mit Analytic (ADR-0007).** eCH-0158 ist im Kern deskriptiv,
   V1.2 bietet aber die erweiterte analytische Symbolpalette. Das Profil
   beschränkt die verfügbare Palette NICHT technisch; es warnt nur, wenn ein
   Modell die gewählte Konvention verlässt. Analytic-Palette bleibt verfügbar.

## Begründung

Nicht jeder Prozess im Ökosystem ist ein Verwaltungs-/Geschäftsprozess: ein
atlas-Ausführungsmodell mit voller Analytic-Palette würde durch die deskriptive
Beschränkung behindert. Deshalb opt-in statt global. Als weiches Profil bleibt
eCH-0158 nützlich (Lesbarkeit, Interoperabilität, Vergleichbarkeit) ohne die
technische Ausdrucksstärke zu beschneiden.

## Konsequenzen

- Der Linter braucht eine Regel-Engine mit einzeln schaltbaren, dokumentierten
  Checks und klaren Meldungen (Regel-ID, betroffenes Element, Begründung).
- Regeln, die reine Namens-/Layout-Konventionen sind (Infinitiv-Benennung,
  L-nach-R), erfordern teils Heuristiken; sie sind als „Hinweis" statt „Fehler"
  zu klassifizieren.
- Da eCH-0158 versioniert ist (aktuell V1.2), ist die referenzierte Version im
  Profil festzuhalten; ein Update ist ein bewusster, versionierter Schritt.
- Analog denkbar: weitere Profile (z. B. hausinterne Garage-Konventionen) über
  dieselbe Linter-Engine, ohne ADR-0007 zu berühren.
