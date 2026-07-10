# ADR-0009 — Mehrbenutzer-Betrieb und Authentifizierung

**Status:** akzeptiert
**Bezug:** ADR-0001 (Rendering-Strategie), INV-H3 (Komponenten-Neutralität)

## Kontext

hestia soll von Anfang an zwei Nutzungsformen bedienen, ohne dass die eine die
andere verkompliziert:

- **Lokaler Entwicklungsarbeitsplatz:** eine Person, kein Login, keine Reibung.
- **Laufender Server:** mehrere Benutzer gleichzeitig, mit Anmeldung.

Das ist eine Klasse-A-Angelegenheit (Go-Server). Sie darf die Modeler (Klasse B)
und die neutrale Komponentenbibliothek (`go/components`, INV-H3) nicht berühren.

## Entscheidung

1. **Zwei Betriebsmodi über Konfiguration** (`HESTIA_MODE`):
   - `local` — genau **ein impliziter Benutzer** (`local`), **keine
     Authentifizierung**. Reibungsloser Entwicklungsarbeitsplatz.
   - `server` — **mehrere Benutzer**, jede Anfrage ohne gültige Session ist
     anonym bzw. wird abgewiesen.

2. **Eigenes Modul `go/auth`**, transport-agnostisch (kein `net/http`). Es
   enthält die Domäne und die Logik; die HTTP-Bindung (Session-Cookie,
   Middleware) lebt in `go/core` (Schritt 7).

3. **Auth-Mechanismus (server-Modus): built-in Accounts + Sessions.** hestia
   verwaltet eigene Benutzer (Benutzername/Passwort) und Server-seitige
   Sessions. Passwörter werden **ausschließlich als bcrypt-Hash** gespeichert,
   nie im Klartext (INV-U2). Das `Authenticator`-Konzept bleibt pluggable:
   Reverse-Proxy/Trusted-Header und OIDC sind spätere Implementierungen
   desselben Interfaces, ohne Änderung an `go/core`.

4. **Rechte: vorerst nur Identität + Sessions.** Ein Benutzer trägt ein
   optionales Rollen-Feld, aber es gibt **noch keine erzwungene Policy** (kein
   RBAC-Gate). Das Interface bleibt offen für späteres RBAC.

5. **Persistenz ist modusabhängig:**
   - `local` — **kein Store**. Der implizite Benutzer braucht keine
     Persistenz; `go/auth` liefert im local-Modus direkt einen festen Principal.
   - `server` (Collab, mehrere Benutzer) — ein Store ist erforderlich.
     `UserStore`/`SessionStore` sind Interfaces mit **zwei erstklassigen
     Backends**:
     - **clio (empfohlen im Ökosystem):** event-sourced. Registrierung,
       Passwortänderung und Session-Lebenszyklus sind Events; der aktuelle
       Zustand kommt aus einer Reduce-Spec/Projektion. Dogfoodt clio — dieselbe
       Quelle, die Operate ohnehin konsumiert. hestia-server hält dafür eine
       clio-Service-Credential (clio ist selbst auth-geschützt).
     - **SQLite (standalone/offline):** eine Datei, zero-config, ohne
       Ökosystem-Abhängigkeit.
   - Ein **In-Memory-Store** ist die Referenzimplementierung für Dev und Tests;
     clio- und SQLite-Store müssen sich gegen dieselbe Interface-Testsuite
     identisch verhalten.

   Wahl über Konfiguration (`HESTIA_STORE=clio|sqlite`). Die transport- und
   backend-agnostische Domäne (`go/auth`) und die HTTP-Bindung (`go/core`)
   entstehen zuerst. Die persistenten Stores leben in einem **eigenen Modul
   `go/authstore`** — nicht in `go/core`: nur wer wirklich persistiert, zieht
   damit die SQLite-Abhängigkeit (`modernc.org/sqlite`, pure-Go, kein cgo)
   herein; `go/core` und die Klasse-A-Bibliotheken bleiben schlank. Der
   SQLite-Store (`authstore.SQLiteStore`) ist umgesetzt und besteht
   `authtest.RunStoreSuite`; der clio-Store tritt als zweites Backend daneben.

   *Hinweis (event-sourced clio):* Append-only bedeutet, alte Passwort-Hashes
   bleiben in der Event-Historie (nur Hashes, akzeptabel); Session-Widerruf ist
   ein Tombstone-Event, das die Projektion berücksichtigt.

## Begründung

Built-in Accounts machen einen hestia-Server ohne externe Infrastruktur
lauffähig — passend zu „lokal wie kleiner Server". Der Modus-Schalter hält den
lokalen Arbeitsplatz reibungsfrei. Die Transport-Trennung (`go/auth` ohne HTTP)
hält die Logik testbar und die Bindung austauschbar.

## Konsequenzen

- Neue Invarianten INV-U1..U3 (siehe `docs/invariants.md`).
- `go/auth` wird test-first mit In-Memory-Store, bcrypt und Session-Logik
  aufgebaut; die HTTP-Middleware liegt in `go/core`. Der SQLite-Store liegt im
  eigenen Modul `go/authstore` (hält `go/core` frei von SQLite); der clio-Store
  folgt dort als zweites Backend.
- Eine wiederverwendbare **Interface-Testsuite** (`StoreSuite`) sichert, dass
  jedes Store-Backend (In-Memory jetzt, clio/SQLite später) identisch arbeitet.
- User Stories US-AUTH-01 (lokaler Zero-Login, kein Store) und US-AUTH-02
  (Server-Login, mehrere Benutzer) — E2E-Abdeckung, sobald der Server
  (Schritt 7) steht.
- `go/components` darf `go/auth` nicht importieren (INV-U3, verschärft INV-H3).
