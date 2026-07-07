// Package authtest bietet eine wiederverwendbare Konformitäts-Testsuite für
// Store-Implementierungen. Jedes Backend (In-Memory jetzt; clio/SQLite in
// Schritt 7) muss RunStoreSuite bestehen — so verhalten sich alle Stores gleich
// (siehe ADR-0009).
package authtest

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/pblumer/hestia/go/auth"
)

// RunStoreSuite prüft, dass ein Store den Store-Vertrag erfüllt.
func RunStoreSuite(t *testing.T, newStore func() auth.Store) {
	t.Helper()
	ctx := context.Background()

	t.Run("User anlegen und abrufen", func(t *testing.T) {
		s := newStore()
		u := auth.User{ID: "u1", Username: "alice", PasswordHash: "h", CreatedAt: time.Unix(1, 0)}
		if err := s.CreateUser(ctx, u); err != nil {
			t.Fatal(err)
		}
		if got, err := s.UserByUsername(ctx, "alice"); err != nil || got.ID != "u1" {
			t.Fatalf("UserByUsername: %+v %v", got, err)
		}
		if got, err := s.UserByID(ctx, "u1"); err != nil || got.Username != "alice" {
			t.Fatalf("UserByID: %+v %v", got, err)
		}
	})

	t.Run("doppelter Benutzername", func(t *testing.T) {
		s := newStore()
		_ = s.CreateUser(ctx, auth.User{ID: "u1", Username: "alice"})
		if err := s.CreateUser(ctx, auth.User{ID: "u2", Username: "alice"}); !errors.Is(err, auth.ErrUserExists) {
			t.Fatalf("erwarte ErrUserExists, bekam %v", err)
		}
	})

	t.Run("unbekannter Benutzer", func(t *testing.T) {
		s := newStore()
		if _, err := s.UserByUsername(ctx, "nix"); !errors.Is(err, auth.ErrUserNotFound) {
			t.Fatalf("erwarte ErrUserNotFound, bekam %v", err)
		}
		if _, err := s.UserByID(ctx, "nix"); !errors.Is(err, auth.ErrUserNotFound) {
			t.Fatalf("erwarte ErrUserNotFound, bekam %v", err)
		}
	})

	t.Run("Session-Lebenszyklus", func(t *testing.T) {
		s := newStore()
		sess := auth.Session{Token: "t1", UserID: "u1", CreatedAt: time.Unix(1, 0), ExpiresAt: time.Unix(100, 0)}
		if err := s.CreateSession(ctx, sess); err != nil {
			t.Fatal(err)
		}
		if got, err := s.SessionByToken(ctx, "t1"); err != nil || got.UserID != "u1" {
			t.Fatalf("SessionByToken: %+v %v", got, err)
		}
		if err := s.DeleteSession(ctx, "t1"); err != nil {
			t.Fatal(err)
		}
		if _, err := s.SessionByToken(ctx, "t1"); !errors.Is(err, auth.ErrSessionNotFound) {
			t.Fatalf("erwarte ErrSessionNotFound, bekam %v", err)
		}
	})
}
