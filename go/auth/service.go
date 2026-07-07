package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"time"
)

// DefaultSessionTTL ist die Standard-Lebensdauer einer Session.
const DefaultSessionTTL = 24 * time.Hour

// Service kapselt die Auth-Logik (Registrierung, Anmeldung, Session-Auflösung)
// über den Stores und dem PasswordHasher. Transport-agnostisch.
type Service struct {
	users    UserStore
	sessions SessionStore
	hasher   PasswordHasher
	now      func() time.Time
	ttl      time.Duration
	newID    func() (string, error)
	newToken func() (string, error)
}

// Option konfiguriert einen Service (v. a. für Tests).
type Option func(*Service)

// WithClock injiziert eine Uhr (Testbarkeit von Ablaufzeiten).
func WithClock(now func() time.Time) Option {
	return func(s *Service) {
		if now != nil {
			s.now = now
		}
	}
}

// WithSessionTTL setzt die Session-Lebensdauer.
func WithSessionTTL(d time.Duration) Option {
	return func(s *Service) {
		if d > 0 {
			s.ttl = d
		}
	}
}

// WithIDGenerator / WithTokenGenerator erlauben deterministische Tests.
func WithIDGenerator(f func() (string, error)) Option {
	return func(s *Service) {
		if f != nil {
			s.newID = f
		}
	}
}

func WithTokenGenerator(f func() (string, error)) Option {
	return func(s *Service) {
		if f != nil {
			s.newToken = f
		}
	}
}

// NewService verdrahtet die Auth-Logik mit Stores und Hasher.
func NewService(users UserStore, sessions SessionStore, hasher PasswordHasher, opts ...Option) *Service {
	s := &Service{
		users:    users,
		sessions: sessions,
		hasher:   hasher,
		now:      time.Now,
		ttl:      DefaultSessionTTL,
		newID:    func() (string, error) { return randomString(16) },
		newToken: func() (string, error) { return randomString(32) },
	}
	for _, o := range opts {
		o(s)
	}
	return s
}

func randomString(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// Register legt einen Benutzer mit gehashtem Passwort an (INV-U2).
func (s *Service) Register(ctx context.Context, username, password string, roles ...Role) (User, error) {
	hash, err := s.hasher.Hash(password)
	if err != nil {
		return User{}, err
	}
	id, err := s.newID()
	if err != nil {
		return User{}, err
	}
	u := User{ID: id, Username: username, PasswordHash: hash, Roles: roles, CreatedAt: s.now()}
	if err := s.users.CreateUser(ctx, u); err != nil {
		return User{}, err
	}
	return u, nil
}

// Authenticate prüft Zugangsdaten und erzeugt bei Erfolg eine Session.
// Unbekannter Benutzer und falsches Passwort liefern denselben Fehler
// (ErrInvalidCredentials), um Benutzer-Enumeration zu verhindern.
func (s *Service) Authenticate(ctx context.Context, username, password string) (Session, error) {
	u, err := s.users.UserByUsername(ctx, username)
	if err != nil {
		if errors.Is(err, ErrUserNotFound) {
			return Session{}, ErrInvalidCredentials
		}
		return Session{}, err
	}
	if err := s.hasher.Compare(u.PasswordHash, password); err != nil {
		return Session{}, ErrInvalidCredentials
	}
	token, err := s.newToken()
	if err != nil {
		return Session{}, err
	}
	now := s.now()
	sess := Session{Token: token, UserID: u.ID, CreatedAt: now, ExpiresAt: now.Add(s.ttl)}
	if err := s.sessions.CreateSession(ctx, sess); err != nil {
		return Session{}, err
	}
	return sess, nil
}

// ResolveSession bestimmt den Principal zu einem Session-Token. Abgelaufene
// Sessions werden verworfen und als anonym mit ErrSessionExpired gemeldet.
func (s *Service) ResolveSession(ctx context.Context, token string) (Principal, error) {
	sess, err := s.sessions.SessionByToken(ctx, token)
	if err != nil {
		return Principal{Anonymous: true}, err
	}
	if !s.now().Before(sess.ExpiresAt) {
		_ = s.sessions.DeleteSession(ctx, token)
		return Principal{Anonymous: true}, ErrSessionExpired
	}
	u, err := s.users.UserByID(ctx, sess.UserID)
	if err != nil {
		return Principal{Anonymous: true}, err
	}
	return Principal{UserID: u.ID, Username: u.Username, Roles: u.Roles, Anonymous: false}, nil
}

// Logout widerruft eine Session.
func (s *Service) Logout(ctx context.Context, token string) error {
	return s.sessions.DeleteSession(ctx, token)
}
