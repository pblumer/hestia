package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/pblumer/hestia/go/adapters"
	"github.com/pblumer/hestia/go/auth"
	"github.com/pblumer/hestia/go/core"
)

func do(h http.Handler, path string) *httptest.ResponseRecorder {
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, httptest.NewRequest(http.MethodGet, path, nil))
	return rr
}

// serverModeServer baut einen operate-Server im server-Modus über einem
// In-Memory-Store (schnell, ohne Datei) mit genau einem seedeten Benutzer.
func serverModeServer(t *testing.T) *server {
	t.Helper()
	store := auth.NewMemoryStore()
	svc := auth.NewService(store, store, auth.NewBcryptHasher())
	if _, err := svc.Register(context.Background(), "admin", "geheim"); err != nil {
		t.Fatalf("seed: %v", err)
	}
	guard := &core.Auth{Mode: auth.ModeServer, Service: svc}
	return newServerWith(adapters.NewMockAtlas(), adapters.NewMockClio(), guard)
}

func TestServerModeAnonymousRedirectsToLogin(t *testing.T) {
	rr := do(serverModeServer(t).handler(), "/instanzen")
	if rr.Code != http.StatusFound {
		t.Fatalf("erwarte 302 (Redirect), bekam %d", rr.Code)
	}
	if loc := rr.Header().Get("Location"); loc != "/login" {
		t.Fatalf("erwarte Redirect nach /login, bekam %q", loc)
	}
}

func TestServerModeLoginPageRendered(t *testing.T) {
	rr := do(serverModeServer(t).handler(), "/login")
	if rr.Code != http.StatusOK {
		t.Fatalf("Status %d", rr.Code)
	}
	body := rr.Body.String()
	for _, want := range []string{`method="post"`, `action="/login"`, `name="username"`, `name="password"`} {
		if !strings.Contains(body, want) {
			t.Fatalf("Login-Seite ohne %q:\n%s", want, body)
		}
	}
}

func postForm(h http.Handler, path string, form url.Values, cookie *http.Cookie) *httptest.ResponseRecorder {
	req := httptest.NewRequest(http.MethodPost, path, strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	if cookie != nil {
		req.AddCookie(cookie)
	}
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, req)
	return rr
}

func TestServerModeLoginSuccessSetsCookieAndRedirects(t *testing.T) {
	h := serverModeServer(t).handler()
	rr := postForm(h, "/login", url.Values{"username": {"admin"}, "password": {"geheim"}}, nil)
	if rr.Code != http.StatusSeeOther {
		t.Fatalf("erwarte 303, bekam %d (%s)", rr.Code, rr.Body.String())
	}
	if loc := rr.Header().Get("Location"); loc != "/instanzen" {
		t.Fatalf("erwarte Redirect /instanzen, bekam %q", loc)
	}
	var sess *http.Cookie
	for _, c := range rr.Result().Cookies() {
		if c.Name == core.SessionCookie {
			sess = c
		}
	}
	if sess == nil || sess.Value == "" {
		t.Fatalf("kein Session-Cookie gesetzt")
	}
	// Mit dem Cookie ist die geschützte Seite erreichbar.
	rr2 := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/instanzen", nil)
	req.AddCookie(sess)
	h.ServeHTTP(rr2, req)
	if rr2.Code != http.StatusOK {
		t.Fatalf("angemeldet: erwarte 200, bekam %d", rr2.Code)
	}
}

// Statische Assets (tokens.css, JS) müssen im server-Modus öffentlich sein —
// sonst kann die anonyme Login-Seite ihre eigenen Design-Tokens nicht laden
// (führte zu dunkel-auf-dunkel). Kein Redirect zum Login für /assets/.
func TestServerModeAssetsPublic(t *testing.T) {
	rr := do(serverModeServer(t).handler(), "/assets/tokens.css")
	if rr.Code == http.StatusFound && rr.Header().Get("Location") == "/login" {
		t.Fatalf("Assets sind hinter dem Login-Guard (Redirect nach /login)")
	}
}

func TestServerModeLoginInvalidRejected(t *testing.T) {
	rr := postForm(serverModeServer(t).handler(), "/login",
		url.Values{"username": {"admin"}, "password": {"falsch"}}, nil)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("erwarte 401 bei falschem Passwort, bekam %d", rr.Code)
	}
}

// Regression: im local-Modus bleibt alles ohne Login erreichbar (US-AUTH-01).
func TestLocalModeNoLoginRequired(t *testing.T) {
	rr := do(newServer(adapters.NewMockAtlas(), adapters.NewMockClio()).handler(), "/instanzen")
	if rr.Code != http.StatusOK {
		t.Fatalf("local: erwarte 200 ohne Login, bekam %d", rr.Code)
	}
}

func TestInstancesPage(t *testing.T) {
	rr := do(newServer(adapters.NewMockAtlas(), adapters.NewMockClio()).handler(), "/instanzen")
	if rr.Code != http.StatusOK {
		t.Fatalf("Status %d", rr.Code)
	}
	body := rr.Body.String()
	if !strings.Contains(body, "Instanzen") || !strings.Contains(body, "inst-1") {
		t.Fatalf("Instanzliste unvollständig:\n%s", body)
	}
}

// A+B: die Detailseite bettet den Viewer ein, lädt das Frontend und verweist auf
// den SSE-Event-Endpunkt.
func TestInstanceDetailEmbedsViewer(t *testing.T) {
	rr := do(newServer(adapters.NewMockAtlas(), adapters.NewMockClio()).handler(), "/instanzen/inst-3")
	if rr.Code != http.StatusOK {
		t.Fatalf("Status %d", rr.Code)
	}
	body := rr.Body.String()
	for _, want := range []string{`id="diagram"`, "/assets/operate.js", `data-events="/events"`, "inst-3"} {
		if !strings.Contains(body, want) {
			t.Fatalf("Detailseite ohne %q", want)
		}
	}
}

func TestInstanceDetailNotFound(t *testing.T) {
	rr := do(newServer(adapters.NewMockAtlas(), adapters.NewMockClio()).handler(), "/instanzen/nope")
	if rr.Code != http.StatusNotFound {
		t.Fatalf("erwarte 404, bekam %d", rr.Code)
	}
}

func TestIncidentsPage(t *testing.T) {
	rr := do(newServer(adapters.NewMockAtlas(), adapters.NewMockClio()).handler(), "/incidents")
	if !strings.Contains(rr.Body.String(), "inc-1") {
		t.Fatalf("Incident fehlt:\n%s", rr.Body.String())
	}
}

func TestEventsPollBridge(t *testing.T) {
	s := newServer(adapters.NewMockAtlas(), adapters.NewMockClio())
	s.clio.Publish(adapters.Event{InstanceID: "inst-1", ElementID: "Task_1", Kind: "token.enter"})
	rr := do(s.handler(), "/events/poll?cursor=0")
	if ct := rr.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("Content-Type %q", ct)
	}
	if !strings.Contains(rr.Body.String(), "Task_1") {
		t.Fatalf("Poll ohne Event:\n%s", rr.Body.String())
	}
}
