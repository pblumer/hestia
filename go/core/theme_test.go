package core

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestThemeFromDefaultsToAuto(t *testing.T) {
	if got := ThemeFrom(context.Background()); got != "" {
		t.Fatalf("erwarte \"\" (auto), bekam %q", got)
	}
}

func TestThemeMiddlewareLiestCookie(t *testing.T) {
	var seen, ret string
	h := ThemeMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = ThemeFrom(r.Context())
		ret = ReturnPathFrom(r.Context())
	}))
	req := httptest.NewRequest(http.MethodGet, "/instanzen?page=2", nil)
	req.AddCookie(&http.Cookie{Name: ThemeCookie, Value: "dark"})
	h.ServeHTTP(httptest.NewRecorder(), req)
	if seen != "dark" {
		t.Fatalf("Theme aus Cookie: erwarte dark, bekam %q", seen)
	}
	if ret != "/instanzen?page=2" {
		t.Fatalf("Rückkehrpfad: erwarte /instanzen?page=2, bekam %q", ret)
	}
}

func TestThemeMiddlewareIgnoriertUnsinn(t *testing.T) {
	var seen = "x"
	h := ThemeMiddleware(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		seen = ThemeFrom(r.Context())
	}))
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.AddCookie(&http.Cookie{Name: ThemeCookie, Value: "neon"})
	h.ServeHTTP(httptest.NewRecorder(), req)
	if seen != "" {
		t.Fatalf("ungültiges Theme muss auto (\"\") ergeben, bekam %q", seen)
	}
}

func TestThemeHandlerSetztCookieUndLeitetZurueck(t *testing.T) {
	mux := http.NewServeMux()
	mux.Handle("GET /theme/{value}", ThemeHandler())

	// dark setzen, zurück zur Ausgangsseite.
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, httptest.NewRequest(http.MethodGet, "/theme/dark?r=%2Finstanzen", nil))
	if rr.Code != http.StatusSeeOther {
		t.Fatalf("erwarte 303, bekam %d", rr.Code)
	}
	if loc := rr.Header().Get("Location"); loc != "/instanzen" {
		t.Fatalf("Redirect: erwarte /instanzen, bekam %q", loc)
	}
	var set *http.Cookie
	for _, c := range rr.Result().Cookies() {
		if c.Name == ThemeCookie {
			set = c
		}
	}
	if set == nil || set.Value != "dark" {
		t.Fatalf("Theme-Cookie nicht auf dark gesetzt: %+v", set)
	}
}

func TestThemeHandlerAutoLoeschtCookie(t *testing.T) {
	mux := http.NewServeMux()
	mux.Handle("GET /theme/{value}", ThemeHandler())
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, httptest.NewRequest(http.MethodGet, "/theme/auto", nil))
	var set *http.Cookie
	for _, c := range rr.Result().Cookies() {
		if c.Name == ThemeCookie {
			set = c
		}
	}
	if set == nil || set.MaxAge >= 0 {
		t.Fatalf("auto muss das Cookie löschen (MaxAge<0), bekam %+v", set)
	}
}

// Offene Weiterleitung verhindern: r muss ein lokaler Pfad sein.
func TestThemeHandlerLehntFremdeRedirectsAb(t *testing.T) {
	mux := http.NewServeMux()
	mux.Handle("GET /theme/{value}", ThemeHandler())
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, httptest.NewRequest(http.MethodGet, "/theme/light?r=https://evil.example/x", nil))
	if loc := rr.Header().Get("Location"); loc != "/" {
		t.Fatalf("fremder Redirect muss auf / fallen, bekam %q", loc)
	}
}

func TestLayoutSetztDataThemeUndZeigtUmschalter(t *testing.T) {
	ctx := context.WithValue(context.Background(), themeKey{}, "dark")
	var b strings.Builder
	if err := Layout("X").Render(ctx, &b); err != nil {
		t.Fatalf("Render: %v", err)
	}
	out := b.String()
	if !strings.Contains(out, `data-theme="dark"`) {
		t.Fatalf("data-theme nicht gesetzt:\n%s", out)
	}
	if !strings.Contains(out, "/theme/light") || !strings.Contains(out, "/theme/dark") || !strings.Contains(out, "/theme/auto") {
		t.Fatalf("Umschalter-Links fehlen:\n%s", out)
	}
}
