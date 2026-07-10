package core

import (
	"context"
	"net/http"

	"github.com/pblumer/hestia/go/auth"
)

// SessionCookie ist der Name des Session-Cookies (server-Modus).
const SessionCookie = "hestia_session"

type principalKey struct{}

// Auth ist die HTTP-Bindung des go/auth-Fundaments (ADR-0009). Im local-Modus
// wird ohne Login der implizite Benutzer gesetzt (INV-U1); im server-Modus
// löst die Middleware den Principal aus dem Session-Cookie auf.
type Auth struct {
	Mode    auth.Mode
	Service *auth.Service // nur im server-Modus benötigt
}

// Middleware legt den Principal in den Request-Kontext.
func (a *Auth) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var p auth.Principal
		if a.Mode == auth.ModeLocal {
			p = auth.LocalPrincipal()
		} else {
			p = auth.Principal{Anonymous: true}
			if c, err := r.Cookie(SessionCookie); err == nil && a.Service != nil {
				if resolved, err := a.Service.ResolveSession(r.Context(), c.Value); err == nil {
					p = resolved
				}
			}
		}
		ctx := context.WithValue(r.Context(), principalKey{}, p)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// PrincipalFrom liefert den Principal aus dem Kontext (anonym als Default).
func PrincipalFrom(ctx context.Context) auth.Principal {
	if p, ok := ctx.Value(principalKey{}).(auth.Principal); ok {
		return p
	}
	return auth.Principal{Anonymous: true}
}

// RequireAuth weist anonyme Anfragen ab. Im local-Modus passiert das nie
// (impliziter Benutzer), sodass der lokale Arbeitsplatz reibungsfrei bleibt.
func (a *Auth) RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if PrincipalFrom(r.Context()).Anonymous {
			http.Error(w, "nicht angemeldet", http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// LoginHandler nimmt username/password (Formular) entgegen und setzt bei Erfolg
// das Session-Cookie. Nur im server-Modus.
func (a *Auth) LoginHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if a.Mode != auth.ModeServer || a.Service == nil {
			http.Error(w, "kein Login im local-Modus", http.StatusBadRequest)
			return
		}
		if err := r.ParseForm(); err != nil {
			http.Error(w, "ungültige Anfrage", http.StatusBadRequest)
			return
		}
		sess, err := a.Service.Authenticate(r.Context(), r.FormValue("username"), r.FormValue("password"))
		if err != nil {
			http.Error(w, "ungültige Zugangsdaten", http.StatusUnauthorized)
			return
		}
		http.SetCookie(w, &http.Cookie{
			Name:     SessionCookie,
			Value:    sess.Token,
			Path:     "/",
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
			Expires:  sess.ExpiresAt,
		})
		w.WriteHeader(http.StatusNoContent)
	})
}

// LogoutHandler widerruft die Session und löscht das Cookie.
func (a *Auth) LogoutHandler() http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if c, err := r.Cookie(SessionCookie); err == nil && a.Service != nil {
			_ = a.Service.Logout(r.Context(), c.Value)
		}
		http.SetCookie(w, &http.Cookie{Name: SessionCookie, Value: "", Path: "/", MaxAge: -1})
		w.WriteHeader(http.StatusNoContent)
	})
}
