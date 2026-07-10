package auth

import "golang.org/x/crypto/bcrypt"

// PasswordHasher kapselt das Hashen und Prüfen von Passwörtern (INV-U2).
type PasswordHasher interface {
	Hash(password string) (string, error)
	Compare(hash, password string) error
}

// BcryptHasher ist die Standard-Implementierung auf bcrypt.
type BcryptHasher struct {
	Cost int
}

// NewBcryptHasher liefert einen Hasher mit bcrypt-Standardkosten.
func NewBcryptHasher() BcryptHasher {
	return BcryptHasher{Cost: bcrypt.DefaultCost}
}

// Hash erzeugt den bcrypt-Hash eines Passworts.
func (h BcryptHasher) Hash(password string) (string, error) {
	cost := h.Cost
	if cost == 0 {
		cost = bcrypt.DefaultCost
	}
	b, err := bcrypt.GenerateFromPassword([]byte(password), cost)
	return string(b), err
}

// Compare prüft ein Passwort gegen einen Hash; Rückgabe != nil bei Nichtübereinstimmung.
func (h BcryptHasher) Compare(hash, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}
