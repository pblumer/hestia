# ADR-0010 — Multi-Theme-Tokens und Theme-Umschalter

**Status:** akzeptiert
**Bezug:** ADR-0002 (Design-Tokens), INV-H1 (Klassentrennung), INV-H2
(Token-SSOT), INV-A1 (JS-Fallback), US-TOK-01/02, US-THEME-01

## Kontext

hestia soll mehrere **Marken-Themes** zur Auswahl stellen. Konkreter Auslöser:
Ein Theme muss das **Design System der Schweizer Bundesverwaltung**
(https://swiss.github.io/designsystem) originalgetreu bereitstellen — Schweizer
Rot (`#d8232a`), Noto Sans, kleine Radien. Bisher kannte die Token-Schicht nur
**eine** Achse: Hell/Dunkel (`{ light, dark }` je Farbe, umgeschaltet über
`[data-theme="light|dark"]` und `prefers-color-scheme`).

Ein Marken-Theme ist aber orthogonal zu Hell/Dunkel: „Swiss in dunkel" und
„hestia in dunkel" sind verschiedene Dinge. Die eine Achse reicht nicht.

## Entscheidung

1. **Zwei orthogonale Achsen in der Token-SSOT** (`tokens/tokens.json`,
   weiterhin die einzige geteilte Quelle zwischen Klasse A und B, INV-H1/H2):
   - **Theme (Marke):** `hestia` (Default) | `swiss`. Attribut `[data-theme]`.
   - **Mode (Hell/Dunkel):** `auto` (folgt `prefers-color-scheme`) | `light` |
     `dark`. Attribut `[data-mode]` (bei `auto` weggelassen).

   Ein Token-Wert ist damit entweder **skalar**, **mode-abhängig**
   (`{ light, dark }`, themenneutral) oder **theme-abhängig**
   (`{ <theme>: <skalar | {light,dark}> }`). Der Generator
   (`tokens/generate.mjs`) löst die Matrix Theme × Mode auf und erzeugt
   deterministisch `tokens.css` (CSS-Kaskade) und `tokens.ts`. Beide bleiben
   **generiert, nie handgepflegt** (INV-H2, CI-Drift-Check).

2. **Kaskade statt Mischung:** `:root` trägt das Default-Theme hell; das
   Default-Theme dunkel und jedes weitere Theme (hell als vollständiger Satz,
   dunkel als Abweichung) liegen in eigenen, spezifischeren Regeln. Theme und
   Mode überlagern sich nie versehentlich (`[data-theme="swiss"][data-mode="dark"]`
   ist eine eigene Regel).

3. **Swiss-Dunkelvariante ist abgeleitet, nicht normativ.** Das offizielle Swiss
   Design System definiert nur einen hellen Modus. Damit die Mode-Achse auch für
   Swiss funktioniert, wird eine dunkle Variante aus der Swiss-Sekundärpalette
   (`secondary-*`) synthetisiert. Das ist als solches im `tokens.json`-Kommentar
   markiert; der Hellmodus bleibt originalgetreu.

4. **Umschaltung server-seitig über Cookies, JS-frei (INV-A1).** Der Umschalter
   ist ein gewöhnliches GET-Formular auf `/theme` (`go/core.ThemeHandler`); der
   Server persistiert die Wahl als Cookie und rendert neu. `go/core` legt die
   Wahl aus dem Cookie in den Request-Kontext (`ThemeMiddleware`), das `Layout`
   setzt `[data-theme]`/`[data-mode]` auf `<html>` und rendert den Umschalter.
   Ohne JavaScript voll funktionsfähig; im server-Modus pro Benutzer.

5. **Klasse B erbt über die CSS-Variablen.** Modeler und Viewer beziehen Farben
   über `var(--…)` bzw. die rückwärtskompatiblen `tokens.ts`-Exporte
   (`tokens`/`light`/`dark`/`cssVar`); zusätzlich exportiert `tokens.ts` jetzt
   `themes` (Matrix) und `themeNames`. Ein eigener Umschalter in den Modelern
   ist nicht Teil dieser Entscheidung.

6. **Schrift des Swiss-Themes wird gebündelt.** Noto Sans (SIL OFL 1.1) liegt
   unter `tokens/fonts/` und wird über `tokens/fonts.css` (@font-face)
   eingebunden — offline- und markentreu, ohne externe Font-CDN.

## Begründung

Die zwei Achsen bilden die Realität ab (Marke ⟂ Hell/Dunkel), ohne die
Token-SSOT oder INV-H1/H2 aufzuweichen — alles bleibt aus einer Quelle generiert.
Cookies statt `localStorage` halten den Umschalter JS-frei (INV-A1) und im
server-Modus benutzerbezogen. Die Bündelung der Schrift macht das Swiss-Theme
reproduzierbar ohne Netzabhängigkeit.

## Konsequenzen

- Attribut-Wechsel: die Mode-Achse liegt jetzt auf `[data-mode]` (vorher
  `[data-theme]`); die E2E zu US-TOK-01/02 wurden entsprechend nachgezogen.
- Neue User Story **US-THEME-01** (Theme-/Mode-Umschalter), E2E in
  `e2e/theme-switch.spec.ts` (+ Token-Vertrag in `e2e/tokens.spec.ts`).
- `tokens.ts` bleibt rückwärtskompatibel; `modeler-kit` bezieht weiter `tokens`.
- Weitere Themes sind additiv: ein Eintrag pro Farbe/Metrik unter dem neuen
  Theme-Schlüssel in `tokens.json`, plus ein Eintrag in `go/core.Themes()`.
