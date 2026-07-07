package auth_test

import (
	"testing"

	"github.com/pblumer/hestia/go/auth"
)

// INV-U1: Im local-Modus gibt es genau einen impliziten Benutzer, ohne Login.
func TestLocalPrincipal(t *testing.T) {
	p := auth.LocalPrincipal()
	if p.Anonymous {
		t.Fatal("lokaler Principal darf nicht anonym sein")
	}
	if p.Username != auth.LocalUsername {
		t.Fatalf("erwarte %q, bekam %q", auth.LocalUsername, p.Username)
	}
}
