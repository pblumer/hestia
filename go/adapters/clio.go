package adapters

import "context"

// Event ist ein Instanz-/Token-Update aus clio (Event-Stream-Quelle).
type Event struct {
	InstanceID string
	ElementID  string
	Kind       string // "token.enter", "token.leave", "incident", …
}

// ClioEvents ist die Schnittstelle zu den clio-Event-Streams. Subscribe liefert
// einen Live-Kanal, History die Events ab einem Cursor (Polling-Fallback) —
// dieselbe Form wie core.Streamer, aber mit dem domänennahen Event-Typ.
// Fester Integrationspunkt für clio (nicht generisch).
type ClioEvents interface {
	Subscribe(ctx context.Context) <-chan Event
	History(cursor int) (events []Event, next int)
}
