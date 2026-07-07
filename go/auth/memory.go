package auth

import (
	"context"
	"sync"
)

// MemoryStore ist die nicht-persistente Referenzimplementierung für Dev und
// Tests. clio- und SQLite-Store (Schritt 7) müssen sich identisch verhalten
// (authtest.RunStoreSuite).
type MemoryStore struct {
	mu        sync.RWMutex
	usersByID map[string]User
	idByName  map[string]string
	sessions  map[string]Session
}

// NewMemoryStore erzeugt einen leeren In-Memory-Store.
func NewMemoryStore() *MemoryStore {
	return &MemoryStore{
		usersByID: make(map[string]User),
		idByName:  make(map[string]string),
		sessions:  make(map[string]Session),
	}
}

func (m *MemoryStore) CreateUser(_ context.Context, u User) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	if _, ok := m.idByName[u.Username]; ok {
		return ErrUserExists
	}
	m.usersByID[u.ID] = u
	m.idByName[u.Username] = u.ID
	return nil
}

func (m *MemoryStore) UserByUsername(_ context.Context, username string) (User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	id, ok := m.idByName[username]
	if !ok {
		return User{}, ErrUserNotFound
	}
	return m.usersByID[id], nil
}

func (m *MemoryStore) UserByID(_ context.Context, id string) (User, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	u, ok := m.usersByID[id]
	if !ok {
		return User{}, ErrUserNotFound
	}
	return u, nil
}

func (m *MemoryStore) CreateSession(_ context.Context, s Session) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.sessions[s.Token] = s
	return nil
}

func (m *MemoryStore) SessionByToken(_ context.Context, token string) (Session, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	s, ok := m.sessions[token]
	if !ok {
		return Session{}, ErrSessionNotFound
	}
	return s, nil
}

func (m *MemoryStore) DeleteSession(_ context.Context, token string) error {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.sessions, token)
	return nil
}
