package auth_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/pblumer/hestia/go/auth"
)

func newService(now func() time.Time, ttl time.Duration) *auth.Service {
	store := auth.NewMemoryStore()
	return auth.NewService(store, store, auth.NewBcryptHasher(),
		auth.WithClock(now), auth.WithSessionTTL(ttl))
}

func TestRegisterHashesPassword(t *testing.T) {
	svc := newService(time.Now, time.Hour)
	u, err := svc.Register(context.Background(), "alice", "geheim123")
	if err != nil {
		t.Fatal(err)
	}
	if u.PasswordHash == "" || u.PasswordHash == "geheim123" {
		t.Fatal("Passwort muss gehasht sein (INV-U2)")
	}
}

func TestRegisterDuplicate(t *testing.T) {
	svc := newService(time.Now, time.Hour)
	ctx := context.Background()
	if _, err := svc.Register(ctx, "alice", "pw"); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.Register(ctx, "alice", "pw2"); !errors.Is(err, auth.ErrUserExists) {
		t.Fatalf("erwarte ErrUserExists, bekam %v", err)
	}
}

func TestAuthenticateAndResolve(t *testing.T) {
	svc := newService(time.Now, time.Hour)
	ctx := context.Background()
	if _, err := svc.Register(ctx, "alice", "geheim123"); err != nil {
		t.Fatal(err)
	}
	sess, err := svc.Authenticate(ctx, "alice", "geheim123")
	if err != nil {
		t.Fatalf("Authenticate: %v", err)
	}
	if sess.Token == "" {
		t.Fatal("Session-Token fehlt")
	}
	p, err := svc.ResolveSession(ctx, sess.Token)
	if err != nil {
		t.Fatalf("ResolveSession: %v", err)
	}
	if p.Anonymous || p.Username != "alice" {
		t.Fatalf("falscher Principal: %+v", p)
	}
}

func TestAuthenticateWrongPassword(t *testing.T) {
	svc := newService(time.Now, time.Hour)
	ctx := context.Background()
	_, _ = svc.Register(ctx, "alice", "geheim123")
	if _, err := svc.Authenticate(ctx, "alice", "falsch"); !errors.Is(err, auth.ErrInvalidCredentials) {
		t.Fatalf("erwarte ErrInvalidCredentials, bekam %v", err)
	}
}

// Unbekannter Benutzer und falsches Passwort liefern denselben Fehler
// (keine Benutzer-Enumeration).
func TestAuthenticateUnknownUserNoEnumeration(t *testing.T) {
	svc := newService(time.Now, time.Hour)
	if _, err := svc.Authenticate(context.Background(), "niemand", "x"); !errors.Is(err, auth.ErrInvalidCredentials) {
		t.Fatalf("erwarte ErrInvalidCredentials, bekam %v", err)
	}
}

func TestSessionExpiry(t *testing.T) {
	clock := time.Unix(1000, 0)
	svc := newService(func() time.Time { return clock }, time.Minute)
	ctx := context.Background()
	_, _ = svc.Register(ctx, "alice", "geheim123")
	sess, _ := svc.Authenticate(ctx, "alice", "geheim123")
	clock = clock.Add(2 * time.Minute) // Session abgelaufen
	if _, err := svc.ResolveSession(ctx, sess.Token); !errors.Is(err, auth.ErrSessionExpired) {
		t.Fatalf("erwarte ErrSessionExpired, bekam %v", err)
	}
}

func TestLogoutRevokesSession(t *testing.T) {
	svc := newService(time.Now, time.Hour)
	ctx := context.Background()
	_, _ = svc.Register(ctx, "alice", "geheim123")
	sess, _ := svc.Authenticate(ctx, "alice", "geheim123")
	if err := svc.Logout(ctx, sess.Token); err != nil {
		t.Fatal(err)
	}
	if _, err := svc.ResolveSession(ctx, sess.Token); err == nil {
		t.Fatal("nach Logout darf die Session nicht mehr auflösen")
	}
}

// Der Server bedient mehrere Benutzer gleichzeitig mit getrennten Sessions.
func TestMultipleUsersConcurrentSessions(t *testing.T) {
	svc := newService(time.Now, time.Hour)
	ctx := context.Background()
	_, _ = svc.Register(ctx, "alice", "pw-alice")
	_, _ = svc.Register(ctx, "bob", "pw-bob")
	sa, _ := svc.Authenticate(ctx, "alice", "pw-alice")
	sb, _ := svc.Authenticate(ctx, "bob", "pw-bob")
	pa, _ := svc.ResolveSession(ctx, sa.Token)
	pb, _ := svc.ResolveSession(ctx, sb.Token)
	if pa.Username != "alice" || pb.Username != "bob" {
		t.Fatalf("Sessions vermischt: %s / %s", pa.Username, pb.Username)
	}
}
