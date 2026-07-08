package main

import (
	"context"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/pblumer/hestia/go/adapters"
	"github.com/pblumer/hestia/go/auth"
	"github.com/pblumer/hestia/go/components"
	"github.com/pblumer/hestia/go/core"
)

type server struct {
	atlas     adapters.AtlasSource
	clio      *adapters.MockClio
	authGuard *core.Auth
	staticDir string
}

func newServer(a adapters.AtlasSource, c *adapters.MockClio) *server {
	mode := auth.ModeLocal
	if os.Getenv("HESTIA_MODE") == "server" {
		mode = auth.ModeServer
	}
	staticDir := os.Getenv("OPERATE_STATIC")
	if staticDir == "" {
		staticDir = "static"
	}
	return &server{atlas: a, clio: c, authGuard: &core.Auth{Mode: mode}, staticDir: staticDir}
}

func (s *server) handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/instanzen", http.StatusFound)
	})
	mux.HandleFunc("GET /instanzen", s.instances)
	mux.HandleFunc("GET /instanzen/{id}", s.instanceDetail)
	mux.HandleFunc("GET /incidents", s.incidents)
	mux.Handle("GET /events", core.SSEHandler(clioBridge{s.clio}))
	mux.Handle("GET /events/poll", core.PollHandler(clioBridge{s.clio}))
	mux.Handle("GET /assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir(s.staticDir))))
	return s.authGuard.Middleware(mux)
}

func (s *server) instances(w http.ResponseWriter, r *http.Request) {
	page := atoiDefault(r.URL.Query().Get("page"), 1)
	items, total, err := s.atlas.Instances(r.Context(), page, 20)
	if err != nil {
		http.Error(w, "atlas nicht erreichbar", http.StatusBadGateway)
		return
	}
	core.Render(w, r, InstancesPage(instanceRows(items), components.Page{Number: page, Size: 20, Total: total}))
}

func (s *server) instanceDetail(w http.ResponseWriter, r *http.Request) {
	inst, err := s.atlas.Instance(r.Context(), r.PathValue("id"))
	if err != nil {
		http.NotFound(w, r)
		return
	}
	events := []components.TimelineEvent{
		{Time: "—", Title: "Status: " + inst.State, Detail: "Aktuelles Element: " + inst.CurrentElementID},
	}
	core.Render(w, r, InstanceDetailPage(inst, events))
}

func (s *server) incidents(w http.ResponseWriter, r *http.Request) {
	inc, err := s.atlas.Incidents(r.Context())
	if err != nil {
		http.Error(w, "atlas nicht erreichbar", http.StatusBadGateway)
		return
	}
	rows := incidentRows(inc)
	core.Render(w, r, IncidentsPage(rows, components.Page{Number: 1, Size: 20, Total: len(rows)}))
}

// simulateTokens bewegt einen Token periodisch durch den Prozess (Mock-clio) —
// treibt die Token-Animation im eingebetteten Viewer.
func (s *server) simulateTokens(ctx context.Context) {
	elements := []string{"StartEvent_1", "Task_1", "EndEvent_1"}
	ticker := time.NewTicker(1500 * time.Millisecond)
	defer ticker.Stop()
	i := 0
	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.clio.Publish(adapters.Event{
				InstanceID: "inst-1",
				ElementID:  elements[i%len(elements)],
				Kind:       "token.enter",
			})
			i++
		}
	}
}

// clioBridge adaptiert die clio-Event-Quelle auf die core-Streaming-Abstraktion,
// sodass SSE- und Polling-Transport aus go/core sie unverändert nutzen.
type clioBridge struct{ c adapters.ClioEvents }

func (b clioBridge) Subscribe(ctx context.Context) <-chan core.Event {
	in := b.c.Subscribe(ctx)
	out := make(chan core.Event, 16)
	go func() {
		defer close(out)
		for e := range in {
			out <- toCoreEvent(e)
		}
	}()
	return out
}

func (b clioBridge) History(cursor int) ([]core.Event, int) {
	evs, next := b.c.History(cursor)
	out := make([]core.Event, len(evs))
	for i, e := range evs {
		out[i] = toCoreEvent(e)
	}
	return out, next
}

func toCoreEvent(e adapters.Event) core.Event {
	return core.Event{Name: e.Kind, Data: e.ElementID}
}

func atoiDefault(s string, def int) int {
	if n, err := strconv.Atoi(s); err == nil && n > 0 {
		return n
	}
	return def
}
