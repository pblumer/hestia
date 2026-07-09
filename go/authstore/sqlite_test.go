package authstore_test

import (
	"context"
	"path/filepath"
	"testing"
	"time"

	"github.com/pblumer/hestia/go/auth"
	"github.com/pblumer/hestia/go/auth/authtest"
	"github.com/pblumer/hestia/go/authstore"
)

// Der SQLite-Store muss sich exakt wie die Referenz (In-Memory) verhalten:
// dieselbe Konformitäts-Suite prüft ihn mechanisch (ADR-0009). Jeder Testfall
// bekommt eine frische Datei — so bleiben die Fälle isoliert.
func TestSQLiteStoreConformsToSuite(t *testing.T) {
	authtest.RunStoreSuite(t, func() auth.Store {
		s, err := authstore.OpenSQLite(filepath.Join(t.TempDir(), "auth.db"))
		if err != nil {
			t.Fatalf("OpenSQLite: %v", err)
		}
		t.Cleanup(func() { _ = s.Close() })
		return s
	})
}

// Persistenz ist der eigentliche Daseinszweck: was ein Store schreibt, muss ein
// zweiter Store auf derselben Datei wiederfinden (anders als In-Memory).
func TestSQLiteStorePersistsAcrossReopen(t *testing.T) {
	ctx := context.Background()
	path := filepath.Join(t.TempDir(), "auth.db")

	s1, err := authstore.OpenSQLite(path)
	if err != nil {
		t.Fatalf("OpenSQLite: %v", err)
	}
	u := auth.User{
		ID:           "u1",
		Username:     "alice",
		PasswordHash: "hash",
		Roles:        []auth.Role{"admin", "operator"},
		CreatedAt:    time.Unix(1700000000, 0).UTC(),
	}
	if err := s1.CreateUser(ctx, u); err != nil {
		t.Fatalf("CreateUser: %v", err)
	}
	sess := auth.Session{
		Token:     "t1",
		UserID:    "u1",
		CreatedAt: time.Unix(1700000000, 0).UTC(),
		ExpiresAt: time.Unix(1700086400, 0).UTC(),
	}
	if err := s1.CreateSession(ctx, sess); err != nil {
		t.Fatalf("CreateSession: %v", err)
	}
	if err := s1.Close(); err != nil {
		t.Fatalf("Close: %v", err)
	}

	s2, err := authstore.OpenSQLite(path)
	if err != nil {
		t.Fatalf("reopen OpenSQLite: %v", err)
	}
	defer func() { _ = s2.Close() }()

	got, err := s2.UserByID(ctx, "u1")
	if err != nil {
		t.Fatalf("UserByID after reopen: %v", err)
	}
	if got.Username != "alice" || got.PasswordHash != "hash" {
		t.Fatalf("User nicht erhalten: %+v", got)
	}
	if len(got.Roles) != 2 || got.Roles[0] != "admin" || got.Roles[1] != "operator" {
		t.Fatalf("Roles nicht erhalten: %+v", got.Roles)
	}
	if !got.CreatedAt.Equal(u.CreatedAt) {
		t.Fatalf("CreatedAt nicht erhalten: %v != %v", got.CreatedAt, u.CreatedAt)
	}

	gotSess, err := s2.SessionByToken(ctx, "t1")
	if err != nil {
		t.Fatalf("SessionByToken after reopen: %v", err)
	}
	if gotSess.UserID != "u1" || !gotSess.ExpiresAt.Equal(sess.ExpiresAt) {
		t.Fatalf("Session nicht erhalten: %+v", gotSess)
	}
}
