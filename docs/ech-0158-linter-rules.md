# eCH-0158 V1.2 — Linter-Regelsatz für `modeler-bpmn`

> Quelle: eCH-0158 „BPMN-Modellierungskonventionen für die öffentliche
> Verwaltung", **Version 1.2, genehmigt 2020-06-05** (NICHT die annullierte V1.0).
> Umsetzung als opt-in-Profil gemäß ADR-0008 / INV-B4: alle Regeln sind
> **Warnungen/Hinweise**, blockieren nie das Speichern, schwächen nie die
> XSD-Gültigkeit (ADR-0007). eCH-0158 beschränkt sich bewusst auf die
> **deskriptive** Modellebene.

## Legende

- **Schweregrad:** `error` (klarer Konventionsverstoß) · `warning` (meist
  unerwünscht, kontextabhängig) · `hint` (Empfehlung / Stil).
- **Prüfart:**
  - `mechanic` — deterministisch aus Modell-/DI-Struktur prüfbar. Kandidat für
    harten Test.
  - `heuristic` — nicht sicher entscheidbar (Sprache, Layout-Ästhetik,
    Kontext). Nur als `hint`/`warning`, nie als `error`. Erfordert ggf.
    NLP/Heuristik und ist bewusst fehlertolerant.
- **Ausnahmen:** wo eCH-0158 explizite Ausnahmen nennt, sind sie als
  `exceptions` gelistet und dürfen keinen Verstoß auslösen.

Jede Regel implementiert `check(model, di) -> Violation[]`. Regeln sind einzeln
schaltbar (`config.rules["ECH-xxx"].enabled`).

---

## 1. Allgemeine Konventionen (Kapitel 2)

### ECH-GEN-001 — Modellierungsrichtung links→rechts
- **Element:** Sequenzfluss / Diagramm-Layout
- **Bedingung:** Sequenzflüsse verlaufen überwiegend von links nach rechts;
  Rückflüsse und Überkreuzungen vermeiden.
- **Prüfart:** heuristic · **Schweregrad:** hint
- **Ausnahmen:** Gateways dürfen von oben/unten verbunden werden; Kontrollschleifen
  (siehe ECH-GW-003-EX2) laufen bewusst zurück.
- **Hinweis:** aus DI-Wegpunkten grob prüfbar (Ziel-x < Quell-x = Rückfluss),
  aber ästhetische Bewertung bleibt heuristisch.

### ECH-GEN-002 — Einheitliche Elementgröße pro Typ
- **Element:** alle
- **Bedingung:** Elemente desselben Typs haben dieselbe Größe/Form (z. B. alle
  Tätigkeiten gleich groß).
- **Prüfart:** mechanic · **Schweregrad:** hint
- **Hinweis:** aus DI-Bounds prüfbar (Varianz der width/height je Typ).

### ECH-GEN-003 — Farben vermeiden
- **Element:** alle
- **Bedingung:** Grundsätzlich keine Füll-/Linienfarben; nur nach klarem,
  zurückhaltendem Farbkonzept.
- **Prüfart:** mechanic · **Schweregrad:** hint
- **Hinweis:** DI-Farbattribute (bioc:fill/stroke o. Ä.) vorhanden → Hinweis.

### ECH-GEN-004 — Keine Formatierung in Bezeichnungen
- **Element:** alle mit Label
- **Bedingung:** keine Kursiv/Fett-Formatierung; bei Archimate-Koexistenz keine
  manuellen Zeilenumbrüche/Silbentrennstriche.
- **Prüfart:** mechanic · **Schweregrad:** hint

### ECH-GEN-005 — Sprachkonsistenz / keine Sprachmischung
- **Element:** alle Labels
- **Bedingung:** durchgängig eine Sprache (Bsp. „Sitzung" statt „Meeting").
- **Prüfart:** heuristic · **Schweregrad:** hint
- **Hinweis:** Sprach-Detektion pro Label; Mischung → hint. Fehleranfällig, nur
  Hinweis.

### ECH-GEN-006 — Abkürzungen vermeiden
- **Element:** alle Labels
- **Bedingung:** Abkürzungen nach Möglichkeit vermeiden.
- **Prüfart:** heuristic · **Schweregrad:** hint

### ECH-GEN-007 — Geschäftsregel bei >2 aufeinanderfolgenden Gateways
- **Element:** Gateway-Ketten
- **Bedingung:** Folgen mehr als zwei (X)OR-Gateways aufeinander, ist es meist
  eine Geschäftsregel → als DMN/Prosa/SBVR auslagern und durch eine Aktivität
  ersetzen.
- **Prüfart:** mechanic · **Schweregrad:** warning
- **Hinweis:** direkte Nachbarschaft von ≥3 (X)OR-Gateways ohne dazwischenliegende
  Aktivität. Schöne Brücke zu temis/DMN.

---

## 2. Diagramm (Kapitel 3.2)

### ECH-DIA-001 — Namenskonvention Diagramm (Substantiv + Infinitiv)
- **Bedingung:** Diagramme heißen „Substantiv + Verb im Infinitiv".
- **Prüfart:** heuristic · **Schweregrad:** hint
- **Hinweis:** Morphologie-Heuristik (endet Verb auf -en/-n; Substantiv voran).
  Deutsch-spezifisch. Nie `error`.

### ECH-DIA-002 — Max. 9–15 Aktivitäten pro Diagramm
- **Bedingung:** ein Diagramm/aufgeklappter Pool enthält höchstens ~15
  Aktivitäten (Tätigkeiten + Unterprozesse).
- **Prüfart:** mechanic · **Schweregrad:** warning
- **Hinweis:** Zähle Aktivitäten je Prozess; >15 → warning, >9 → optional hint.
  Grenzwert konfigurierbar.

### ECH-DIA-003 — Erforderliches Attribut „Bezeichnung"
- **Bedingung:** Diagramm hat eine Bezeichnung.
- **Prüfart:** mechanic · **Schweregrad:** error

### ECH-DIA-004 — Querformat, max. DIN A3
- **Bedingung:** Diagrammfläche im Querformat, nicht größer als A3.
- **Prüfart:** mechanic · **Schweregrad:** hint
- **Hinweis:** aus Gesamt-Bounds der DI ableitbar; nur Hinweis (A3 ist Richtwert).

---

## 3. Pool (Kapitel 3.3)

### ECH-POOL-001 — Genau ein vollständiger Prozess pro aufgeklapptem Pool
- **Bedingung:** jeder aufgeklappte Pool enthält genau einen vollständigen
  Prozess (mind. ein Start- und Endereignis, zusammenhängend).
- **Prüfart:** mechanic · **Schweregrad:** error

### ECH-POOL-002 — Zugeklappter Pool ohne Inhalt
- **Bedingung:** zugeklappte Pools (Black-Box) enthalten keine Flow-Elemente.
- **Prüfart:** mechanic · **Schweregrad:** error

### ECH-POOL-003 — Zugeklappter Pool braucht ≥1 Nachrichtenfluss
- **Bedingung:** jeder zugeklappte Pool hat mindestens einen ein- oder
  ausgehenden Nachrichtenfluss.
- **Prüfart:** mechanic · **Schweregrad:** error
- **Kollaborations-Kern:** dies ist eine der zentralen Collaboration-Regeln.

### ECH-POOL-004 — Jeder Pool nur einmal pro Diagramm
- **Bedingung:** kein Teilnehmer/Pool kommt mehrfach im selben Diagramm vor.
- **Prüfart:** mechanic · **Schweregrad:** error

### ECH-POOL-005 — Pools über gesamte Diagrammbreite, übereinander
- **Bedingung:** Pools sind übereinander angeordnet und spannen die volle Breite.
- **Prüfart:** mechanic · **Schweregrad:** warning
- **Hinweis:** aus DI-Bounds prüfbar (gleiche x-Ausdehnung, gestapelt in y).

### ECH-POOL-006 — Namenskonvention Pool
- **Bedingung:** Organisationseinheiten/Rollen = Substantiv; Prozess-Pools =
  Substantiv + Infinitiv. Lane darf nicht wie ihr Pool heißen.
- **Prüfart:** heuristic · **Schweregrad:** hint

### ECH-POOL-007 — Erforderliches Attribut „Bezeichnung"
- **Prüfart:** mechanic · **Schweregrad:** error

---

## 4. Lane (Kapitel 3.4)

### ECH-LANE-001 — Max. drei Verschachtelungsebenen
- **Bedingung:** Lanes maximal 3 Ebenen tief geschachtelt.
- **Prüfart:** mechanic · **Schweregrad:** warning

### ECH-LANE-002 — Lanes über gesamte Poolbreite
- **Bedingung:** Lanes spannen die volle Poolbreite, übereinander.
- **Prüfart:** mechanic · **Schweregrad:** warning

### ECH-LANE-003 — Lane ≠ Pool-Name
- **Bedingung:** eine Lane trägt nicht denselben Namen wie ihr Pool.
- **Prüfart:** mechanic · **Schweregrad:** warning

### ECH-LANE-004 — Rollenbezeichnung im Singular
- **Bedingung:** Lanes mit Rollennamen im Singular beschriftet.
- **Prüfart:** heuristic · **Schweregrad:** hint

---

## 5. Ereignisse (Kapitel 3.5)

### ECH-EVT-001 — Prozess hat mind. ein Startereignis
- **Prüfart:** mechanic · **Schweregrad:** error

### ECH-EVT-002 — Jeder Prozesszweig endet in einem Endereignis
- **Bedingung:** jeder Pfad führt zu einem Endereignis (keine „offenen" Enden).
- **Prüfart:** mechanic · **Schweregrad:** error

### ECH-EVT-003 — Mehrere Startereignisse sofort per Gateway zusammenführen
- **Bedingung:** existieren mehrere Startereignisse, werden sie unmittelbar über
  ein passendes Gateway zusammengeführt.
- **Prüfart:** mechanic · **Schweregrad:** warning

### ECH-EVT-004 — Startereignisse innerhalb eines Pools
- **Prüfart:** mechanic · **Schweregrad:** error

### ECH-EVT-005 — Kein auslösendes Nachrichten-Zwischenereignis (deskriptiv)
- **Bedingung:** ausgehende Nachrichten werden aus Aktivitäten versandt, nicht
  über ein *auslösendes* Nachrichten-Zwischenereignis (das ist analytische Ebene).
- **Prüfart:** mechanic · **Schweregrad:** warning
- **Hinweis:** V1.2 formuliert dies bewusst offener (Koexistenz mit der
  analytischen Beilage). Daher `warning`, nicht `error`. Bei aktivierter
  Analytic-Palette (ADR-0007) diese Regel automatisch entschärfen/abschalten.

### ECH-EVT-006 — Bedingungs-/Zeitgeber-Ereignis: Bezeichnung erforderlich
- **Bedingung:** Bedingungs-Startereignis trägt die Bedingung im Namen;
  Zeitgeber-Ereignis trägt den Zeitpunkt/-regel im Namen.
- **Prüfart:** heuristic · **Schweregrad:** hint

### ECH-EVT-007 — Endereignis mit Status der Leistungserbringung beschriftet
- **Bedingung:** Endereignisse tragen einen Ergebnis-/Statusnamen (z. B.
  „Bericht erstellt").
- **Prüfart:** heuristic · **Schweregrad:** hint

---

## 6. Aktivität (Kapitel 3.6)

### ECH-ACT-001 — Namenskonvention (Substantiv + Infinitiv)
- **Bedingung:** Aktivitäten „Substantiv + Verb im Infinitiv" (z. B. „Antrag
  prüfen").
- **Prüfart:** heuristic · **Schweregrad:** warning
- **Hinweis:** die prominenteste eCH-0158-Regel; dennoch nur heuristisch
  entscheidbar → nie `error`.

### ECH-ACT-002 — Genau ein ausgehender Sequenzfluss
- **Bedingung:** auf eine Aktivität folgt genau ein Sequenzfluss (Verzweigung nur
  über Gateway, siehe ECH-SEQ-002).
- **Prüfart:** mechanic · **Schweregrad:** error

### ECH-ACT-003 — Nach Prüf-Tätigkeit folgt ein Gateway
- **Bedingung:** Tätigkeiten, die eine Prüfung beinhalten, werden von einem
  Gateway gefolgt.
- **Prüfart:** heuristic · **Schweregrad:** warning
- **Hinweis:** „ist eine Prüfung" ist semantisch (Verb wie „prüfen",
  „kontrollieren"). Erkennung heuristisch; die Gateway-Folge selbst mechanisch.

### ECH-ACT-004 — Unterprozesse zugeklappt + eigenes Diagramm
- **Bedingung:** Unterprozesse werden zugeklappt dargestellt und in eigenem
  Diagramm beschrieben.
- **Prüfart:** mechanic · **Schweregrad:** warning

### ECH-ACT-005 — Erforderliches Attribut „Bezeichnung"
- **Prüfart:** mechanic · **Schweregrad:** error

---

## 7. Gateways (Kapitel 3.7)

### ECH-GW-001 — Aktivität vor XOR/OR-Gateway obligatorisch
- **Bedingung:** einem verzweigenden XOR-/OR-Gateway geht eine Aktivität voraus
  (bestimmt die Verzweigung).
- **Prüfart:** mechanic · **Schweregrad:** error
- **Ausnahmen:**
  - **EX1:** Ereignis-Gateway.
  - **EX2:** Gateways dürfen aufeinanderfolgen (aber nicht zwei Ereignis-Gateways,
    nicht zwei AND-Gateways) — mit Vorsicht (vgl. ECH-GEN-007).

### ECH-GW-002 — Zusammenführung verzweigter Sequenzflüsse obligatorisch
- **Bedingung:** verzweigte Sequenzflüsse werden wieder zusammengeführt, auf
  derselben horizontalen Linie wie die Verzweigung.
- **Prüfart:** mechanic · **Schweregrad:** warning
- **Ausnahmen:**
  - **EX1:** ein nach XOR-/Ereignis-Gateway verzweigter Fluss trifft vor der
    Zusammenführung auf ein Endereignis.
  - **EX2:** der Fluss ist Teil einer Kontrollschleife und geht bei „nicht
    erfüllt" zurück an den Anfang der Kontrolltätigkeit.

### ECH-GW-003 — Beschriftungsregeln Gateways
- **Bedingung:** zusammenführende Gateways, Ereignis-Gateways und AND-Gateways
  werden **nicht** beschriftet; verzweigende (X)OR nur, wenn es den
  Informationsgehalt erhöht.
- **Prüfart:** mechanic · **Schweregrad:** hint

### ECH-GW-004 — Keine zwei gleichen Spezial-Gateways in Folge
- **Bedingung:** nicht zwei Ereignis-Gateways und nicht zwei AND-Gateways direkt
  hintereinander (Teil von ECH-GW-001-EX2).
- **Prüfart:** mechanic · **Schweregrad:** warning

---

## 8. Sequenzfluss (Kapitel 3.8)

### ECH-SEQ-001 — Beschriftung nur nach XOR/OR
- **Bedingung:** Sequenzflüsse grundsätzlich unbeschriftet; **Ausnahme:** Flüsse
  nach XOR-/OR-Gateway MÜSSEN mit Entscheid/Endzustand beschriftet sein.
- **Prüfart:** mechanic · **Schweregrad:** warning
- **Hinweis:** zweiseitig: unbeschrifteter Fluss-nach-(X)OR → error-nah (warning);
  beschrifteter Fluss anderswo → hint.

### ECH-SEQ-002 — Verzweigung nur über Gateway, nicht direkt aus Aktivität
- **Bedingung:** mehrere ausgehende Sequenzflüsse aus einer Aktivität sind
  unzulässig; Verzweigung über Gateway (Spiegel zu ECH-ACT-002).
- **Prüfart:** mechanic · **Schweregrad:** error

### ECH-SEQ-003 — Horizontale Verbindung, keine Rückflüsse/Überkreuzungen
- **Bedingung:** Aktivitäten/Ereignisse horizontal verbinden; Rückflüsse und
  Kreuzungen vermeiden.
- **Prüfart:** heuristic · **Schweregrad:** hint
- **Ausnahmen:** Gateways von oben/unten; Kontrollschleifen.

### ECH-SEQ-004 — Keine Überlagerung von Sequenzflüssen
- **Bedingung:** Sequenzflüsse überlagern sich nicht.
- **Prüfart:** mechanic · **Schweregrad:** warning
- **Ausnahmen:** EX1 gleichgerichtete Flüsse an Gateway mit >4 Anschlüssen; EX2
  eingehende Flüsse an Aktivität mit >2 Eingängen.

---

## 9. Nachrichtenfluss (Kapitel 3.9) — Kollaborations-Kern

### ECH-MSG-001 — Nachrichtenfluss nur zwischen verschiedenen Pools
- **Bedingung:** Nachrichtenflüsse verlaufen ausschließlich zwischen
  verschiedenen Teilnehmern/Pools, nie innerhalb eines Pools.
- **Prüfart:** mechanic · **Schweregrad:** error
- **Hinweis:** deckt sich mit der BPMN-2.0.2-Regel; hier zusätzlich
  konventionsseitig. Zentrale Collaboration-Invariante.

### ECH-MSG-002 — Nachrichten werden von Aktivitäten ausgelöst
- **Bedingung:** ausgehende Nachrichtenflüsse gehen von Aktivitäten aus (nicht
  von auslösenden Nachrichtenereignissen — siehe ECH-EVT-005).
- **Prüfart:** mechanic · **Schweregrad:** warning

### ECH-MSG-003 — Anschluss oben/unten am Element
- **Bedingung:** Nachrichtenflüsse docken an Ober-/Unterseite der Elemente an.
- **Prüfart:** mechanic · **Schweregrad:** hint

### ECH-MSG-004 — Keine Überlagerung von Nachrichtenflüssen
- **Prüfart:** mechanic · **Schweregrad:** warning

### ECH-MSG-005 — Nachrichtenflüsse nicht über Ebenen wiederholen
- **Bedingung:** auf tieferer Ebene dargestellte Nachrichtenflüsse werden auf
  übergeordneten Ebenen nicht wiederholt.
- **Prüfart:** mechanic · **Schweregrad:** hint
- **Ausnahme:** bewusste redundante Darstellung zum Verständnis (dann
  konsistent halten).

---

## 10. Kommentar & Gruppe (Kapitel 3.10 / 3.11)

### ECH-CMT-001 — Kommentar über gepunktete Assoziation
- **Bedingung:** Kommentare sind per gepunkteter Assoziation einem Element
  zugeordnet.
- **Prüfart:** mechanic · **Schweregrad:** hint

### ECH-GRP-001 — Gruppe kein Ersatz für Lanes
- **Bedingung:** Gruppen werden nicht anstelle von Lanes zur Rollentrennung
  verwendet.
- **Prüfart:** heuristic · **Schweregrad:** hint

---

## Umsetzungshinweise für Claude Code

- **Zwei-Register-Modell:** `mechanic`-Regeln in ein Test-Register, das auch im CI
  gegen Fixture-Modelle läuft; `heuristic`-Regeln nur zur Laufzeit im Editor als
  nicht-blockierende Hinweise.
- **Wechselwirkung mit Analytic (ADR-0007):** Wird die analytische Symbolpalette
  aktiviert, deaktivieren/entschärfen sich die deskriptiv-motivierten Regeln
  (v. a. ECH-EVT-005, ECH-MSG-002). Das Profil kennt einen Modus
  `descriptive|analytic`.
- **Konfigurierbarkeit:** jede Regel `enabled` + `severity`-Override; Grenzwerte
  (z. B. Aktivitäten-Max in ECH-DIA-002) als Parameter.
- **Meldungsformat:** `{ruleId, severity, elementId, message, specRef}` —
  `specRef` verweist auf das eCH-0158-Kapitel (z. B. „3.7").
- **Heuristik-Ehrlichkeit:** `heuristic`-Regeln nie als `error`; Meldungen als
  „möglicher Verstoß" formulieren, um Fehlalarme abzufedern.
- **Erweiterbarkeit:** dieselbe Engine trägt später weitere Profile (z. B.
  hausinterne Garage-Konventionen) ohne Änderung an ADR-0007.

> Vorbehalt: Dieser Regelsatz interpretiert die Konventionstexte aus eCH-0158
> V1.2 in prüfbare Prädikate. Einige mechanische Regeln beruhen auf DI-Geometrie
> und brauchen tolerante Schwellenwerte. Bei Unklarheit ist das eCH-0158-PDF
> (Kapitelangabe je Regel) maßgeblich.
