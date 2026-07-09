// Package auth ist das transport-agnostische Auth-Fundament der Klasse-A-Server
// (ADR-0009). Es kennt kein net/http: die HTTP-Bindung (Session-Cookie,
// Middleware) liegt in go/core, die persistenten Stores (SQLite jetzt, clio
// später) im eigenen Modul go/authstore — so bleibt go/core frei von der
// SQLite-Abhängigkeit. go/components darf dieses Paket nicht importieren
// (INV-U3).
package auth

import (
	"errors"
	"time"
)

// Mode unterscheidet den reibungsfreien lokalen Arbeitsplatz vom Mehrbenutzer-
// Server (INV-U1).
type Mode string

const (
	// ModeLocal: genau ein impliziter Benutzer, keine Auth, keine Persistenz.
	ModeLocal Mode = "local"
	// ModeServer: mehrere Benutzer, Anmeldung erforderlich.
	ModeServer Mode = "server"
)

// Fehler der Domäne.
var (
	ErrUserExists         = errors.New("auth: benutzer existiert bereits")
	ErrUserNotFound       = errors.New("auth: benutzer nicht gefunden")
	ErrSessionNotFound    = errors.New("auth: session nicht gefunden")
	ErrSessionExpired     = errors.New("auth: session abgelaufen")
	ErrInvalidCredentials = errors.New("auth: ungültige zugangsdaten")
)

// Role ist eine einfache Rollenbezeichnung. Noch ohne erzwungene Policy — das
// Feld existiert, die Durchsetzung (RBAC) ist bewusst späteren Schritten
// vorbehalten (ADR-0009).
type Role string

// User ist ein persistierter Benutzer. Das Passwort liegt ausschließlich als
// Hash vor (INV-U2) — es gibt bewusst kein Klartextfeld.
type User struct {
	ID           string
	Username     string
	PasswordHash string
	Roles        []Role
	CreatedAt    time.Time
}

// Principal ist der handelnde Benutzer, wie er aus einer Anfrage aufgelöst wird.
type Principal struct {
	UserID    string
	Username  string
	Roles     []Role
	Anonymous bool
}

// LocalUsername ist der Name des impliziten Benutzers im local-Modus.
const LocalUsername = "local"

// LocalPrincipal liefert den einzigen Benutzer des local-Modus (INV-U1): kein
// Login, keine Persistenz.
func LocalPrincipal() Principal {
	return Principal{UserID: "local", Username: LocalUsername, Anonymous: false}
}
