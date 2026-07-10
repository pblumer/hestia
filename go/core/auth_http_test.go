package core

import (
	"context"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"

	"github.com/pblumer/hestia/go/auth"
)

func serverAuth(t *testing.T) *Auth {
	t.Helper()
	store := auth.NewMemoryStore()
	svc := auth.NewService(store, store, auth.NewBcryptHasher())
	if _, err := svc.Register(context.Background(), "alice", "geheim123"); err != nil {
		t.Fatalf("Register: %v", err)
	}
	return &Auth{Mode: auth.ModeServer, Service: svc}
}

// INV-U1: local-Modus liefert ohne Login den impliziten Benutzer.
func TestLocalModePrincipal(t *testing.T) {
	a := &Auth{Mode: auth.ModeLocal}
	var seen auth.Principal
	h := a.Middleware(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
		seen = PrincipalFrom(r.Context())
	}))
	h.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodGet, "/", nil))
	if seen.Anonymous || seen.Username != auth.LocalUsername {
		t.Fatalf("erwarte lokalen Benutzer, bekam %+v", seen)
	}
}

func TestServerAnonym401(t *testing.T) {
	a := serverAuth(t)
	h := a.Middleware(a.RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
	})))
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, httptest.NewRequest(http.MethodGet, "/", nil))
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("erwarte 401, bekam %d", rr.Code)
	}
}

func TestServerLoginUndSession(t *testing.T) {
	a := serverAuth(t)

	body := strings.NewReader(url.Values{"username": {"alice"}, "password": {"geheim123"}}.Encode())
	req := httptest.NewRequest(http.MethodPost, "/login", body)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rr := httptest.NewRecorder()
	a.LoginHandler().ServeHTTP(rr, req)
	if rr.Code != http.StatusNoContent {
		t.Fatalf("Login-Status %d", rr.Code)
	}
	var sess *http.Cookie
	for _, c := range rr.Result().Cookies() {
		if c.Name == SessionCookie {
			sess = c
		}
	}
	if sess == nil || sess.Value == "" {
		t.Fatal("kein Session-Cookie gesetzt")
	}
	if !sess.HttpOnly {
		t.Fatal("Session-Cookie sollte HttpOnly sein")
	}

	var seen auth.Principal
	protected := a.Middleware(a.RequireAuth(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = PrincipalFrom(r.Context())
		w.WriteHeader(http.StatusOK)
	})))
	req2 := httptest.NewRequest(http.MethodGet, "/", nil)
	req2.AddCookie(sess)
	rr2 := httptest.NewRecorder()
	protected.ServeHTTP(rr2, req2)
	if rr2.Code != http.StatusOK {
		t.Fatalf("geschützte Anfrage Status %d", rr2.Code)
	}
	if seen.Anonymous || seen.Username != "alice" {
		t.Fatalf("erwarte alice, bekam %+v", seen)
	}
}

func TestLoginFalschesPasswort(t *testing.T) {
	a := serverAuth(t)
	body := strings.NewReader(url.Values{"username": {"alice"}, "password": {"falsch"}}.Encode())
	req := httptest.NewRequest(http.MethodPost, "/login", body)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rr := httptest.NewRecorder()
	a.LoginHandler().ServeHTTP(rr, req)
	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("erwarte 401, bekam %d", rr.Code)
	}
}

func TestLoginImLocalModusVerboten(t *testing.T) {
	a := &Auth{Mode: auth.ModeLocal}
	rr := httptest.NewRecorder()
	a.LoginHandler().ServeHTTP(rr, httptest.NewRequest(http.MethodPost, "/login", nil))
	if rr.Code != http.StatusBadRequest {
		t.Fatalf("erwarte 400, bekam %d", rr.Code)
	}
}
