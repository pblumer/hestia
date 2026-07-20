package core

import (
	"context"
	"net/http"
	"time"
)

// Theming der Klasse-A-Oberflächen. Zwei orthogonale Achsen, beide server-seitig
// über Cookies gehalten und damit JS-frei umschaltbar (INV-A1) und im
// server-Modus pro Benutzer:
//
//   - Theme (Marke):      hestia (Default) | swiss (Design System der
//     Schweizer Bundesverwaltung) -> <html data-theme="…">
//   - Mode (Hell/Dunkel): auto (Default, folgt prefers-color-scheme) |
//     light | dark                -> <html data-mode="…"> (bei auto weggelassen)
//
// Die konkreten Werte kommen ausschließlich aus tokens/tokens.css (INV-H2);
// hier wird nur das passende Attribut gesetzt.

const (
	themeCookie = "hestia_theme"
	modeCookie  = "hestia_mode"

	// DefaultTheme ist das Marken-Theme, wenn keine Wahl vorliegt.
	DefaultTheme = "hestia"
	// DefaultMode folgt der Systemeinstellung (prefers-color-scheme).
	DefaultMode = "auto"
)

// ThemeOption ist ein Eintrag im Umschalter (Wert + Anzeigename).
type ThemeOption struct {
	Value string
	Label string
}

// Themes listet die wählbaren Marken-Themes für den Umschalter.
func Themes() []ThemeOption {
	return []ThemeOption{
		{Value: "hestia", Label: "hestia"},
		{Value: "swiss", Label: "Swiss (Bund)"},
	}
}

// Modes listet die wählbaren Ansichts-Modi für den Umschalter.
func Modes() []ThemeOption {
	return []ThemeOption{
		{Value: "auto", Label: "Automatisch"},
		{Value: "light", Label: "Hell"},
		{Value: "dark", Label: "Dunkel"},
	}
}

func validTheme(v string) bool {
	for _, o := range Themes() {
		if o.Value == v {
			return true
		}
	}
	return false
}

func validMode(v string) bool {
	for _, o := range Modes() {
		if o.Value == v {
			return true
		}
	}
	return false
}

// ThemeState ist die aufgelöste Theme-/Mode-Wahl einer Anfrage.
type ThemeState struct {
	Theme string // "hestia" | "swiss"
	Mode  string // "auto" | "light" | "dark"
}

// DefaultThemeState ist die Wahl ohne jede Vorgabe.
func DefaultThemeState() ThemeState {
	return ThemeState{Theme: DefaultTheme, Mode: DefaultMode}
}

type themeKey struct{}

// ThemeFromRequest liest die Theme-/Mode-Wahl aus den Cookies. Unbekannte Werte
// werden verworfen (Fallback auf die Defaults), damit ein manipuliertes Cookie
// nur die eigene Ansicht, nie das gerenderte Markup beeinflusst.
func ThemeFromRequest(r *http.Request) ThemeState {
	st := DefaultThemeState()
	if c, err := r.Cookie(themeCookie); err == nil && validTheme(c.Value) {
		st.Theme = c.Value
	}
	if c, err := r.Cookie(modeCookie); err == nil && validMode(c.Value) {
		st.Mode = c.Value
	}
	return st
}

// WithTheme legt eine ThemeState in den Kontext (für templ-Rendering).
func WithTheme(ctx context.Context, st ThemeState) context.Context {
	return context.WithValue(ctx, themeKey{}, st)
}

// ThemeFromContext liefert die ThemeState aus dem Kontext (Defaults, falls keine).
func ThemeFromContext(ctx context.Context) ThemeState {
	if st, ok := ctx.Value(themeKey{}).(ThemeState); ok {
		return st
	}
	return DefaultThemeState()
}

// ThemeMiddleware legt die aus den Cookies gelesene ThemeState in den
// Request-Kontext, sodass das Layout sie beim Rendern findet.
func ThemeMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := WithTheme(r.Context(), ThemeFromRequest(r))
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// ThemeHandler nimmt die Wahl aus der Query (theme, mode) entgegen, persistiert
// sie als Cookie und führt zurück zur aufrufenden Seite (Referer). JS-frei: der
// Umschalter ist ein gewöhnliches GET-Formular.
func ThemeHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if v := r.URL.Query().Get("theme"); validTheme(v) {
			setPrefCookie(w, themeCookie, v)
		}
		if v := r.URL.Query().Get("mode"); validMode(v) {
			setPrefCookie(w, modeCookie, v)
		}
		back := r.Referer()
		if back == "" {
			back = "/"
		}
		http.Redirect(w, r, back, http.StatusSeeOther)
	})
}

func setPrefCookie(w http.ResponseWriter, name, value string) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/",
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().AddDate(1, 0, 0),
	})
}
