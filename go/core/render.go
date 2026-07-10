package core

import (
	"net/http"

	"github.com/a-h/templ"
)

// Render schreibt eine templ-Komponente als HTML in den ResponseWriter.
func Render(w http.ResponseWriter, r *http.Request, comp templ.Component) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_ = comp.Render(r.Context(), w)
}

// Handler macht aus einer Komponente einen http.Handler.
func Handler(comp templ.Component) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		Render(w, r, comp)
	})
}
