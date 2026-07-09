// Package authstore liefert persistente auth.Store-Backends. SQLiteStore ist die
// reibungsarme Server-Persistenz (eine Datei, kein Dienst, pure-Go ohne cgo).
//
// Es lebt bewusst als eigenes Modul und nicht in go/core: nur wer wirklich
// persistiert, zieht damit modernc.org/sqlite herein — go/core und die
// Klasse-A-Bibliotheken bleiben schlank. Der clio-Store (event-sourced) tritt
// später als zweites Backend neben dieses (ADR-0009); beide bestehen dieselbe
// authtest.RunStoreSuite.
package authstore

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/pblumer/hestia/go/auth"
	_ "modernc.org/sqlite" // pure-Go SQLite-Treiber (kein cgo)
)

// SQLiteStore implementiert auth.Store auf einer SQLite-Datei.
type SQLiteStore struct {
	db *sql.DB
}

// Sicherstellen, dass der Vertrag zur Compile-Zeit erfüllt ist.
var _ auth.Store = (*SQLiteStore)(nil)

// OpenSQLite öffnet (oder erstellt) die Datenbank unter path und legt das Schema
// an. path ":memory:" ergibt eine flüchtige DB (nur für Tests sinnvoll).
func OpenSQLite(path string) (*SQLiteStore, error) {
	// busy_timeout verhindert sofortiges SQLITE_BUSY unter nebenläufigem Zugriff;
	// foreign_keys hält Sessions an ihren Benutzer gebunden.
	dsn := path + "?_pragma=busy_timeout(5000)&_pragma=foreign_keys(1)"
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	// SQLite verträgt genau einen Schreiber; ein einzelner Verbindungs-Slot
	// serialisiert Schreibzugriffe und vermeidet SQLITE_BUSY (INV-U1 bleibt
	// gewahrt: lokal ohne Store, Server mit genau einem).
	db.SetMaxOpenConns(1)
	s := &SQLiteStore{db: db}
	if err := s.migrate(context.Background()); err != nil {
		_ = db.Close()
		return nil, err
	}
	return s, nil
}

// Close schließt die zugrunde liegende Datenbank.
func (s *SQLiteStore) Close() error { return s.db.Close() }

func (s *SQLiteStore) migrate(ctx context.Context) error {
	const schema = `
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    roles         TEXT NOT NULL DEFAULT '',
    created_at    INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
);`
	_, err := s.db.ExecContext(ctx, schema)
	return err
}

func (s *SQLiteStore) CreateUser(ctx context.Context, u auth.User) error {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO users (id, username, password_hash, roles, created_at) VALUES (?, ?, ?, ?, ?)`,
		u.ID, u.Username, u.PasswordHash, encodeRoles(u.Roles), u.CreatedAt.UnixNano(),
	)
	if err != nil {
		if isUniqueViolation(err) {
			return auth.ErrUserExists
		}
		return err
	}
	return nil
}

func (s *SQLiteStore) UserByUsername(ctx context.Context, username string) (auth.User, error) {
	return s.scanUser(s.db.QueryRowContext(ctx,
		`SELECT id, username, password_hash, roles, created_at FROM users WHERE username = ?`, username))
}

func (s *SQLiteStore) UserByID(ctx context.Context, id string) (auth.User, error) {
	return s.scanUser(s.db.QueryRowContext(ctx,
		`SELECT id, username, password_hash, roles, created_at FROM users WHERE id = ?`, id))
}

func (s *SQLiteStore) scanUser(row *sql.Row) (auth.User, error) {
	var (
		u       auth.User
		roles   string
		created int64
	)
	if err := row.Scan(&u.ID, &u.Username, &u.PasswordHash, &roles, &created); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return auth.User{}, auth.ErrUserNotFound
		}
		return auth.User{}, err
	}
	u.Roles = decodeRoles(roles)
	u.CreatedAt = time.Unix(0, created).UTC()
	return u, nil
}

func (s *SQLiteStore) CreateSession(ctx context.Context, sess auth.Session) error {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)`,
		sess.Token, sess.UserID, sess.CreatedAt.UnixNano(), sess.ExpiresAt.UnixNano(),
	)
	return err
}

func (s *SQLiteStore) SessionByToken(ctx context.Context, token string) (auth.Session, error) {
	var (
		sess             auth.Session
		created, expires int64
	)
	err := s.db.QueryRowContext(ctx,
		`SELECT token, user_id, created_at, expires_at FROM sessions WHERE token = ?`, token,
	).Scan(&sess.Token, &sess.UserID, &created, &expires)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return auth.Session{}, auth.ErrSessionNotFound
		}
		return auth.Session{}, err
	}
	sess.CreatedAt = time.Unix(0, created).UTC()
	sess.ExpiresAt = time.Unix(0, expires).UTC()
	return sess, nil
}

func (s *SQLiteStore) DeleteSession(ctx context.Context, token string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM sessions WHERE token = ?`, token)
	return err
}

// Rollen werden als tab-getrennte Liste abgelegt. Der Tab kann in einer Rolle
// nicht vorkommen (Rollen sind einfache Bezeichner), also ist die Kodierung
// verlustfrei und umkehrbar.
const roleSep = "\t"

func encodeRoles(roles []auth.Role) string {
	if len(roles) == 0 {
		return ""
	}
	parts := make([]string, len(roles))
	for i, r := range roles {
		parts[i] = string(r)
	}
	return strings.Join(parts, roleSep)
}

func decodeRoles(s string) []auth.Role {
	if s == "" {
		return nil
	}
	parts := strings.Split(s, roleSep)
	roles := make([]auth.Role, len(parts))
	for i, p := range parts {
		roles[i] = auth.Role(p)
	}
	return roles
}

// isUniqueViolation erkennt den UNIQUE-Constraint-Bruch treiberunabhängig über
// die Fehlermeldung — modernc.org/sqlite meldet "UNIQUE constraint failed".
func isUniqueViolation(err error) bool {
	return strings.Contains(err.Error(), "UNIQUE constraint failed")
}
