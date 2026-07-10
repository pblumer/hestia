package auth

import (
	"context"
	"time"
)

// Session ist eine serverseitige Sitzung eines angemeldeten Benutzers.
type Session struct {
	Token     string
	UserID    string
	CreatedAt time.Time
	ExpiresAt time.Time
}

// UserStore persistiert Benutzer.
type UserStore interface {
	CreateUser(ctx context.Context, u User) error
	UserByUsername(ctx context.Context, username string) (User, error)
	UserByID(ctx context.Context, id string) (User, error)
}

// SessionStore persistiert Sessions.
type SessionStore interface {
	CreateSession(ctx context.Context, s Session) error
	SessionByToken(ctx context.Context, token string) (Session, error)
	DeleteSession(ctx context.Context, token string) error
}

// Store bündelt beide Aspekte. Ein Backend (In-Memory als Referenz; SQLite in
// go/authstore; clio später) implementiert beides und muss
// authtest.RunStoreSuite bestehen.
type Store interface {
	UserStore
	SessionStore
}
