// Command operate ist das Cockpit (Klasse A) des pblumer-Ökosystems: Instanz-
// und Incident-Ansichten aus atlas/clio, mit eingebettetem read-only-Viewer und
// simulierter Token-Animation (A+B-Machbarkeitsnachweis).
package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"github.com/pblumer/hestia/go/adapters"
)

func main() {
	addr := ":" + envOr("PORT", "8080")
	srv := newServer(adapters.NewMockAtlas(), adapters.NewMockClio())

	ctx := context.Background()
	go srv.simulateTokens(ctx)

	log.Printf("operate hört auf %s (Modus %s)", addr, srv.authGuard.Mode)
	log.Fatal(http.ListenAndServe(addr, srv.handler()))
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
