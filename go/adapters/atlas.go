package adapters

import (
	"context"
	"errors"
)

// ErrNotFound wird von Quellen geliefert, wenn ein Objekt fehlt.
var ErrNotFound = errors.New("adapters: nicht gefunden")

// Instance ist eine Prozessinstanz der atlas-Engine (Ausführungspartner der
// BPMN-Modelle).
type Instance struct {
	ID               string
	ProcessID        string
	State            string // "active", "completed", "incident"
	CurrentElementID string
}

// Incident ist eine Störung einer Instanz.
type Incident struct {
	ID         string
	InstanceID string
	ElementID  string
	Message    string
}

// AtlasSource ist die Schnittstelle zur atlas-Engine (Instanzen/Incidents).
// Fester, benannter Integrationspunkt (nicht generisch): die reale atlas-API
// ersetzt später die Mock-Implementierung, ohne die Operate-App zu ändern.
type AtlasSource interface {
	Instances(ctx context.Context, page, size int) (items []Instance, total int, err error)
	Instance(ctx context.Context, id string) (Instance, error)
	Incidents(ctx context.Context) ([]Incident, error)
}
