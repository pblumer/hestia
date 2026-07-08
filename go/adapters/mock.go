package adapters

import (
	"context"
	"sync"
)

// MockAtlas liefert Beispieldaten mit derselben Schnittstelle wie die reale
// atlas-Engine (Integrationspunkt).
type MockAtlas struct {
	instances []Instance
	incidents []Incident
}

func NewMockAtlas() *MockAtlas {
	return &MockAtlas{
		instances: []Instance{
			{ID: "inst-1", ProcessID: "Process_1", State: "active", CurrentElementID: "Task_1"},
			{ID: "inst-2", ProcessID: "Process_1", State: "completed", CurrentElementID: "EndEvent_1"},
			{ID: "inst-3", ProcessID: "Process_1", State: "incident", CurrentElementID: "Task_1"},
		},
		incidents: []Incident{
			{ID: "inc-1", InstanceID: "inst-3", ElementID: "Task_1", Message: "Job fehlgeschlagen"},
		},
	}
}

func (m *MockAtlas) Instances(_ context.Context, page, size int) ([]Instance, int, error) {
	total := len(m.instances)
	if size <= 0 {
		size = 20
	}
	if page < 1 {
		page = 1
	}
	start := (page - 1) * size
	if start > total {
		start = total
	}
	end := start + size
	if end > total {
		end = total
	}
	return m.instances[start:end], total, nil
}

func (m *MockAtlas) Instance(_ context.Context, id string) (Instance, error) {
	for _, i := range m.instances {
		if i.ID == id {
			return i, nil
		}
	}
	return Instance{}, ErrNotFound
}

func (m *MockAtlas) Incidents(_ context.Context) ([]Incident, error) {
	return m.incidents, nil
}

// MockClio ist ein In-Process-Broadcast von Events mit Verlauf (simuliert clio).
type MockClio struct {
	mu      sync.Mutex
	subs    map[chan Event]struct{}
	history []Event
}

func NewMockClio() *MockClio {
	return &MockClio{subs: make(map[chan Event]struct{})}
}

func (c *MockClio) Subscribe(ctx context.Context) <-chan Event {
	ch := make(chan Event, 16)
	c.mu.Lock()
	c.subs[ch] = struct{}{}
	c.mu.Unlock()
	go func() {
		<-ctx.Done()
		c.mu.Lock()
		if _, ok := c.subs[ch]; ok {
			delete(c.subs, ch)
			close(ch)
		}
		c.mu.Unlock()
	}()
	return ch
}

// Publish verteilt ein Event und legt es in den Verlauf.
func (c *MockClio) Publish(e Event) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.history = append(c.history, e)
	for ch := range c.subs {
		select {
		case ch <- e:
		default:
		}
	}
}

func (c *MockClio) History(cursor int) ([]Event, int) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if cursor < 0 || cursor > len(c.history) {
		cursor = len(c.history)
	}
	return append([]Event(nil), c.history[cursor:]...), len(c.history)
}
