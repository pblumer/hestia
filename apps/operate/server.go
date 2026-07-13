package main

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/pblumer/hestia/go/adapters"
	"github.com/pblumer/hestia/go/auth"
	"github.com/pblumer/hestia/go/authstore"
	"github.com/pblumer/hestia/go/components"
	"github.com/pblumer/hestia/go/core"
)

type server struct {
	atlas     adapters.AtlasSource
	clio      *adapters.MockClio
	authGuard *core.Auth
	staticDir string
}

// newServer liest die Betriebsart aus der Umgebung. Im server-Modus wird der
// SQLite-Store geöffnet, der Auth-Service verdrahtet und ein Admin geseedet.
func newServer(a adapters.AtlasSource, c *adapters.MockClio) *server {
	guard := &core.Auth{Mode: auth.ModeLocal}
	if os.Getenv("HESTIA_MODE") == "server" {
		guard = buildServerAuth()
	}
	return newServerWith(a, c, guard)
}

// newServerWith verdrahtet den Server mit einem fertigen Auth-Guard. Für Tests,
// die den server-Modus ohne Datei/Umgebung über einen In-Memory-Store prüfen.
func newServerWith(a adapters.AtlasSource, c *adapters.MockClio, guard *core.Auth) *server {
	staticDir := os.Getenv("OPERATE_STATIC")
	if staticDir == "" {
		staticDir = "static"
	}
	return &server{atlas: a, clio: c, authGuard: guard, staticDir: staticDir}
}

// buildServerAuth öffnet den persistenten Store (SQLite via go/authstore),
// verdrahtet den Auth-Service und stellt sicher, dass genau ein Admin existiert.
// Ohne mind. einen Benutzer wäre ein frischer Server nicht anmeldbar.
func buildServerAuth() *core.Auth {
	dbPath := envOr("HESTIA_DB", "hestia.db")
	store, err := authstore.OpenSQLite(dbPath)
	if err != nil {
		log.Fatalf("SQLite-Auth-Store (%s): %v", dbPath, err)
	}
	svc := auth.NewService(store, store, auth.NewBcryptHasher())
	seedAdmin(svc)
	return &core.Auth{Mode: auth.ModeServer, Service: svc}
}

// seedAdmin legt den Admin an, falls er fehlt. Das Passwort kommt aus
// HESTIA_ADMIN_PASSWORD; fehlt es, wird ein zufälliges erzeugt und geloggt —
// ein Server startet nie mit einem still voreingestellten Passwort.
func seedAdmin(svc *auth.Service) {
	user := envOr("HESTIA_ADMIN_USER", "admin")
	ctx := context.Background()
	if _, err := svc.Register(ctx, user, adminPassword()); err != nil {
		if errors.Is(err, auth.ErrUserExists) {
			return // schon vorhanden (persistenter Store) — nichts zu tun
		}
		log.Fatalf("Admin-Seed: %v", err)
	}
	log.Printf("Admin-Benutzer %q angelegt", user)
}

func adminPassword() string {
	if p := os.Getenv("HESTIA_ADMIN_PASSWORD"); p != "" {
		return p
	}
	p, err := randomPassword()
	if err != nil {
		log.Fatalf("Zufallspasswort: %v", err)
	}
	log.Printf("HESTIA_ADMIN_PASSWORD nicht gesetzt — generiertes Admin-Passwort: %s", p)
	return p
}

func randomPassword() (string, error) {
	b := make([]byte, 12)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

func (s *server) handler() http.Handler {
	// Geschützte App-Seiten. Im local-Modus ist der Principal nie anonym
	// (impliziter Benutzer), sodass requireLogin dort ein No-op ist — der lokale
	// Arbeitsplatz bleibt reibungsfrei (INV-U1, US-AUTH-01).
	app := http.NewServeMux()
	app.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/instanzen", http.StatusFound)
	})
	app.HandleFunc("GET /instanzen", s.instances)
	app.HandleFunc("GET /instanzen/{id}", s.instanceDetail)
	app.HandleFunc("GET /incidents", s.incidents)
	app.Handle("GET /events", core.SSEHandler(clioBridge{s.clio}))
	app.Handle("GET /events/poll", core.PollHandler(clioBridge{s.clio}))

	mux := http.NewServeMux()
	// Öffentliche Endpunkte: Auth (nur server-Modus fachlich relevant) und die
	// statischen Assets. Die Assets MÜSSEN ungeschützt sein, sonst kann die
	// anonyme Login-Seite ihre Design-Tokens (tokens.css) nicht laden.
	mux.Handle("GET /assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir(s.staticDir))))
	mux.Handle("GET /theme/{value}", core.ThemeHandler())
	mux.HandleFunc("GET /login", s.loginPage)
	mux.HandleFunc("POST /login", s.login)
	mux.HandleFunc("POST /logout", s.logout)
	mux.Handle("/", s.requireLogin(app))

	// ThemeMiddleware liest die Theme-Wahl fürs Layout; authGuard löst den
	// Principal auf. Beide umschließen alle Seiten.
	return s.authGuard.Middleware(core.ThemeMiddleware(mux))
}

// requireLogin schützt die App-Seiten. Anonyme Anfragen werden zum Login
// umgeleitet; im local-Modus greift das nie (impliziter Benutzer).
func (s *server) requireLogin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if core.PrincipalFrom(r.Context()).Anonymous {
			http.Redirect(w, r, "/login", http.StatusFound)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// loginPage rendert das Anmeldeformular (Klasse A, JS-frei). Im local-Modus gibt
// es nichts anzumelden — dann direkt zur App.
func (s *server) loginPage(w http.ResponseWriter, r *http.Request) {
	if s.authGuard.Mode != auth.ModeServer {
		http.Redirect(w, r, "/instanzen", http.StatusFound)
		return
	}
	core.Render(w, r, LoginPage(r.URL.Query().Get("fehler") != ""))
}

// login prüft die Zugangsdaten, setzt das Session-Cookie und leitet zur App.
// Anders als core.Auth.LoginHandler (204, API-Stil) liefert operate eine
// browsertaugliche Weiterleitung.
func (s *server) login(w http.ResponseWriter, r *http.Request) {
	if s.authGuard.Mode != auth.ModeServer || s.authGuard.Service == nil {
		http.Error(w, "kein Login im local-Modus", http.StatusBadRequest)
		return
	}
	if err := r.ParseForm(); err != nil {
		http.Error(w, "ungültige Anfrage", http.StatusBadRequest)
		return
	}
	sess, err := s.authGuard.Service.Authenticate(r.Context(), r.FormValue("username"), r.FormValue("password"))
	if err != nil {
		w.WriteHeader(http.StatusUnauthorized)
		core.Render(w, r, LoginPage(true))
		return
	}
	http.SetCookie(w, &http.Cookie{
		Name:     core.SessionCookie,
		Value:    sess.Token,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Expires:  sess.ExpiresAt,
	})
	http.Redirect(w, r, "/instanzen", http.StatusSeeOther)
}

// logout widerruft die Session, löscht das Cookie und führt zurück zum Login.
func (s *server) logout(w http.ResponseWriter, r *http.Request) {
	if c, err := r.Cookie(core.SessionCookie); err == nil && s.authGuard.Service != nil {
		_ = s.authGuard.Service.Logout(r.Context(), c.Value)
	}
	http.SetCookie(w, &http.Cookie{Name: core.SessionCookie, Value: "", Path: "/", MaxAge: -1})
	http.Redirect(w, r, "/login", http.StatusSeeOther)
}

func (s *server) instances(w http.ResponseWriter, r *http.Request) {
	page := atoiDefault(r.URL.Query().Get("page"), 1)
	items, total, err := s.atlas.Instances(r.Context(), page, 20)
	if err != nil {
		http.Error(w, "atlas nicht erreichbar", http.StatusBadGateway)
		return
	}
	core.Render(w, r, InstancesPage(instanceRows(items), components.Page{Number: page, Size: 20, Total: total}))
}

func (s *server) instanceDetail(w http.ResponseWriter, r *http.Request) {
	inst, err := s.atlas.Instance(r.Context(), r.PathValue("id"))
	if err != nil {
		http.NotFound(w, r)
		return
	}
	events := []components.TimelineEvent{
		{Time: "—", Title: "Status: " + inst.State, Detail: "Aktuelles Element: " + inst.CurrentElementID},
	}
	core.Render(w, r, InstanceDetailPage(inst, events))
}

func (s *server) incidents(w http.ResponseWriter, r *http.Request) {
	inc, err := s.atlas.Incidents(r.Context())
	if err != nil {
		http.Error(w, "atlas nicht erreichbar", http.StatusBadGateway)
		return
	}
	rows := incidentRows(inc)
	core.Render(w, r, IncidentsPage(rows, components.Page{Number: 1, Size: 20, Total: len(rows)}))
}

// simulateTokens bewegt einen Token periodisch durch den Prozess (Mock-clio) —
// treibt die Token-Animation im eingebetteten Viewer.
func (s *server) simulateTokens(ctx context.Context) {
	elements := []string{"StartEvent_1", "Task_1", "EndEvent_1"}
	ticker := time.NewTicker(1500 * time.Millisecond)
	defer ticker.Stop()
	i := 0
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.clio.Publish(adapters.Event{
				InstanceID: "inst-1",
				ElementID:  elements[i%len(elements)],
				Kind:       "token.enter",
			})
			i++
		}
	}
}

// clioBridge adaptiert die clio-Event-Quelle auf die core-Streaming-Abstraktion,
// sodass SSE- und Polling-Transport aus go/core sie unverändert nutzen.
type clioBridge struct{ c adapters.ClioEvents }

func (b clioBridge) Subscribe(ctx context.Context) <-chan core.Event {
	in := b.c.Subscribe(ctx)
	out := make(chan core.Event, 16)
	go func() {
		defer close(out)
		for e := range in {
			out <- toCoreEvent(e)
		}
	}()
	return out
}

func (b clioBridge) History(cursor int) ([]core.Event, int) {
	evs, next := b.c.History(cursor)
	out := make([]core.Event, len(evs))
	for i, e := range evs {
		out[i] = toCoreEvent(e)
	}
	return out, next
}

func toCoreEvent(e adapters.Event) core.Event {
	return core.Event{Name: e.Kind, Data: e.ElementID}
}

func atoiDefault(s string, def int) int {
	if n, err := strconv.Atoi(s); err == nil && n > 0 {
		return n
	}
	return def
}
