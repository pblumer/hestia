package core

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestThemeFromRequestDefaults(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	st := ThemeFromRequest(r)
	if st.Theme != DefaultTheme {
		t.Fatalf("Default-Theme = %q, want %q", st.Theme, DefaultTheme)
	}
	if st.Mode != "auto" {
		t.Fatalf("Default-Mode = %q, want auto", st.Mode)
	}
}

func TestThemeFromRequestReadsCookies(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.AddCookie(&http.Cookie{Name: themeCookie, Value: "swiss"})
	r.AddCookie(&http.Cookie{Name: modeCookie, Value: "dark"})
	st := ThemeFromRequest(r)
	if st.Theme != "swiss" || st.Mode != "dark" {
		t.Fatalf("aus Cookies: %+v, want swiss/dark", st)
	}
}

func TestThemeFromRequestIgnoresUnknownValues(t *testing.T) {
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.AddCookie(&http.Cookie{Name: themeCookie, Value: "../../etc"})
	r.AddCookie(&http.Cookie{Name: modeCookie, Value: "neon"})
	st := ThemeFromRequest(r)
	if st.Theme != DefaultTheme || st.Mode != "auto" {
		t.Fatalf("ungültige Cookies nicht abgewehrt: %+v", st)
	}
}

func TestThemeHandlerSetsCookiesAndRedirects(t *testing.T) {
	rr := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/theme?theme=swiss&mode=dark", nil)
	r.Header.Set("Referer", "/instanzen")
	ThemeHandler().ServeHTTP(rr, r)

	if rr.Code != http.StatusSeeOther {
		t.Fatalf("Status = %d, want 303", rr.Code)
	}
	if loc := rr.Header().Get("Location"); loc != "/instanzen" {
		t.Fatalf("Redirect = %q, want /instanzen (Referer)", loc)
	}
	got := map[string]string{}
	for _, c := range rr.Result().Cookies() {
		got[c.Name] = c.Value
	}
	if got[themeCookie] != "swiss" || got[modeCookie] != "dark" {
		t.Fatalf("Cookies = %v, want swiss/dark", got)
	}
}

func TestThemeHandlerRejectsInvalidValues(t *testing.T) {
	rr := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodGet, "/theme?theme=evil&mode=evil", nil)
	ThemeHandler().ServeHTTP(rr, r)
	for _, c := range rr.Result().Cookies() {
		if c.Name == themeCookie && c.Value == "evil" {
			t.Fatal("ungültiges Theme wurde gesetzt")
		}
	}
}

func TestLayoutTraegtThemeAttributeUndUmschalter(t *testing.T) {
	// Kontext mit explizit gewähltem swiss/dark.
	ctx := WithTheme(context.Background(), ThemeState{Theme: "swiss", Mode: "dark"})
	var b strings.Builder
	if err := Layout("X").Render(ctx, &b); err != nil {
		t.Fatalf("Render: %v", err)
	}
	out := b.String()
	if !strings.Contains(out, `data-theme="swiss"`) {
		t.Fatalf("data-theme fehlt:\n%s", out)
	}
	if !strings.Contains(out, `data-mode="dark"`) {
		t.Fatalf("data-mode fehlt:\n%s", out)
	}
	if !strings.Contains(out, `action="/theme"`) {
		t.Fatal("Theme-Umschalter (Formular) fehlt")
	}
	// Swiss-Option ist als aktiv markiert.
	if !strings.Contains(out, "Swiss") {
		t.Fatal("Swiss-Theme-Option fehlt im Umschalter")
	}
}

func TestLayoutAutoModeSetztKeinModeAttribut(t *testing.T) {
	// Default (auto) darf kein data-mode auf <html> setzen, damit
	// prefers-color-scheme greift. Geprüft wird nur das <html>-Öffnungs-Tag —
	// das eingebettete base.css enthält bewusst [data-mode="…"]-Selektoren.
	var b strings.Builder
	if err := Layout("X").Render(context.Background(), &b); err != nil {
		t.Fatalf("Render: %v", err)
	}
	out := b.String()
	start := strings.Index(out, "<html")
	tag := out[start : start+strings.Index(out[start:], ">")+1]
	if strings.Contains(tag, "data-mode") {
		t.Fatalf("auto-Mode darf kein data-mode-Attribut erzeugen: %s", tag)
	}
	if !strings.Contains(tag, `data-theme="hestia"`) {
		t.Fatalf("<html> ohne Default-Theme: %s", tag)
	}
}

func TestThemeMiddlewareLegtStateInKontext(t *testing.T) {
	var seen ThemeState
	h := ThemeMiddleware(http.HandlerFunc(func(_ http.ResponseWriter, r *http.Request) {
		seen = ThemeFromContext(r.Context())
	}))
	r := httptest.NewRequest(http.MethodGet, "/", nil)
	r.AddCookie(&http.Cookie{Name: themeCookie, Value: "swiss"})
	h.ServeHTTP(httptest.NewRecorder(), r)
	if seen.Theme != "swiss" {
		t.Fatalf("Middleware-State = %+v, want swiss", seen)
	}
}
