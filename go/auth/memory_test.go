package auth_test

import (
	"testing"

	"github.com/pblumer/hestia/go/auth"
	"github.com/pblumer/hestia/go/auth/authtest"
)

// Der In-Memory-Store ist die Referenzimplementierung; er muss die Store-Suite
// bestehen — dieselbe Suite prüft später clio und SQLite (ADR-0009).
func TestMemoryStoreConformsToSuite(t *testing.T) {
	authtest.RunStoreSuite(t, func() auth.Store { return auth.NewMemoryStore() })
}
