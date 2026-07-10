package auth_test

import (
	"testing"

	"github.com/pblumer/hestia/go/auth"
)

// INV-U2: Passwörter werden nur als bcrypt-Hash abgelegt, nie als Klartext.
func TestBcryptHasher(t *testing.T) {
	h := auth.NewBcryptHasher()
	hash, err := h.Hash("geheim123")
	if err != nil {
		t.Fatalf("Hash: %v", err)
	}
	if hash == "geheim123" {
		t.Fatal("Hash darf nicht das Klartextpasswort sein")
	}
	if err := h.Compare(hash, "geheim123"); err != nil {
		t.Fatalf("Compare korrektes Passwort: %v", err)
	}
	if err := h.Compare(hash, "falsch"); err == nil {
		t.Fatal("Compare falsches Passwort muss fehlschlagen")
	}
}
