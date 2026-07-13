package core

import (
	"context"
	"net/http"
	"net/url"
	"strings"
)

// ThemeCookie hält die explizite Theme-Wahl (US-TOK-01). Fehlt es, entscheidet
// prefers-color-scheme (Auto, US-TOK-02).
const ThemeCookie = "hestia_theme"

type themeKey struct{}
type returnKey struct{}

// ThemeFrom liefert das explizit gewählte Theme ("light"/"dark") oder ""
// (Auto). Der Wert wird als data-theme am <html> gesetzt; "" verhält sich wie
// Auto (die Token-CSS greift dann über die prefers-color-scheme-Regel).
func ThemeFrom(ctx context.Context) string {
	if v, ok := ctx.Value(themeKey{}).(string); ok {
		return v
	}
	return ""
}

// ReturnPathFrom liefert den lokalen Pfad, zu dem der Theme-Umschalter
// zurückführt (der aktuell angezeigte). Default "/".
func ReturnPathFrom(ctx context.Context) string {
	if v, ok := ctx.Value(returnKey{}).(string); ok && v != "" {
		return v
	}
	return "/"
}

// ThemeMiddleware legt gewähltes Theme (aus dem Cookie) und aktuellen Pfad in
// den Kontext, damit Layout und Umschalter sie lesen können.
func ThemeMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		theme := ""
		if c, err := r.Cookie(ThemeCookie); err == nil && (c.Value == "light" || c.Value == "dark") {
			theme = c.Value
		}
		ctx := context.WithValue(r.Context(), themeKey{}, theme)
		ctx = context.WithValue(ctx, returnKey{}, safeLocalPath(r.URL.RequestURI()))
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// ThemeHandler setzt das Theme-Cookie anhand des Pfadsegments {value} und leitet
// zurück (Query r). "auto" löscht das Cookie. JS-frei bedienbar.
func ThemeHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch r.PathValue("value") {
		case "light", "dark":
			http.SetCookie(w, &http.Cookie{
				Name:     ThemeCookie,
				Value:    r.PathValue("value"),
				Path:     "/",
				HttpOnly: true,
				SameSite: http.SameSiteLaxMode,
				MaxAge:   60 * 60 * 24 * 365,
			})
		case "auto":
			http.SetCookie(w, &http.Cookie{Name: ThemeCookie, Value: "", Path: "/", MaxAge: -1})
		default:
			http.Error(w, "unbekanntes Theme", http.StatusBadRequest)
			return
		}
		http.Redirect(w, r, safeLocalPath(r.URL.Query().Get("r")), http.StatusSeeOther)
	})
}

// safeLocalPath lässt nur lokale Pfade zu (verhindert offene Weiterleitung).
func safeLocalPath(p string) string {
	if strings.HasPrefix(p, "/") && !strings.HasPrefix(p, "//") {
		return p
	}
	return "/"
}

// themeURL baut den Umschalt-Link für einen Wert, inklusive Rückkehrpfad.
func themeURL(ctx context.Context, value string) string {
	return "/theme/" + value + "?r=" + url.QueryEscape(ReturnPathFrom(ctx))
}

// themeIsCurrent sagt, ob value die aktive Wahl ist ("auto" == kein Cookie).
func themeIsCurrent(ctx context.Context, value string) bool {
	cur := ThemeFrom(ctx)
	if value == "auto" {
		return cur == ""
	}
	return cur == value
}
