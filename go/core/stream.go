package core

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"sync"
)

// Event ist eine serverseitige Aktualisierung (z. B. Instanz-/Incident-Update
// aus atlas/clio).
type Event struct {
	ID   string `json:"id,omitempty"`
	Name string `json:"name,omitempty"`
	Data string `json:"data"`
}

// Streamer ist die Streaming-Abstraktion (ADR-0001): SSE und Polling liegen als
// zwei Transporte HINTER diesem Interface, sodass Komponenten die Quelle nicht
// kennen. Subscribe liefert einen Live-Kanal; History liefert Events ab einem
// Cursor für den Polling-Fallback.
type Streamer interface {
	Subscribe(ctx context.Context) <-chan Event
	History(cursor int) (events []Event, next int)
}

// MemoryStreamer ist ein einfacher In-Process-Broadcast mit Verlauf
// (Dev/Tests/Mock; der reale atlas/clio-Stream implementiert dasselbe Interface).
type MemoryStreamer struct {
	mu      sync.Mutex
	subs    map[chan Event]struct{}
	history []Event
}

func NewMemoryStreamer() *MemoryStreamer {
	return &MemoryStreamer{subs: make(map[chan Event]struct{})}
}

func (m *MemoryStreamer) Subscribe(ctx context.Context) <-chan Event {
	ch := make(chan Event, 16)
	m.mu.Lock()
	m.subs[ch] = struct{}{}
	m.mu.Unlock()
	go func() {
		<-ctx.Done()
		m.mu.Lock()
		if _, ok := m.subs[ch]; ok {
			delete(m.subs, ch)
			close(ch)
		}
		m.mu.Unlock()
	}()
	return ch
}

// Publish verteilt ein Event an alle Abonnenten und legt es in den Verlauf.
func (m *MemoryStreamer) Publish(e Event) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.history = append(m.history, e)
	for ch := range m.subs {
		select {
		case ch <- e:
		default: // langsamer Abonnent: Event fällt für ihn aus, Verlauf bleibt
		}
	}
}

func (m *MemoryStreamer) History(cursor int) ([]Event, int) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if cursor < 0 || cursor > len(m.history) {
		cursor = len(m.history)
	}
	return append([]Event(nil), m.history[cursor:]...), len(m.history)
}

// WriteSSE schreibt ein Event im text/event-stream-Format.
func WriteSSE(w io.Writer, e Event) {
	if e.ID != "" {
		_, _ = fmt.Fprintf(w, "id: %s\n", e.ID)
	}
	if e.Name != "" {
		_, _ = fmt.Fprintf(w, "event: %s\n", e.Name)
	}
	_, _ = fmt.Fprintf(w, "data: %s\n\n", e.Data)
}

// SSEHandler streamt Events als Server-Sent-Events.
func SSEHandler(s Streamer) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "streaming nicht unterstützt", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "text/event-stream")
		w.Header().Set("Cache-Control", "no-cache")
		w.Header().Set("Connection", "keep-alive")
		ch := s.Subscribe(r.Context())
		flusher.Flush()
		for {
			select {
			case <-r.Context().Done():
				return
			case e, ok := <-ch:
				if !ok {
					return
				}
				WriteSSE(w, e)
				flusher.Flush()
			}
		}
	})
}

// PollHandler liefert die Events ab ?cursor= als JSON — der JS-freie/robuste
// Fallback zum SSE-Transport (INV-A1-freundlich).
func PollHandler(s Streamer) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cursor, _ := strconv.Atoi(r.URL.Query().Get("cursor"))
		events, next := s.History(cursor)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(struct {
			Cursor int     `json:"cursor"`
			Events []Event `json:"events"`
		}{Cursor: next, Events: events})
	})
}
