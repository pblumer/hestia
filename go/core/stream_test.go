package core

import (
	"bytes"
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestMemoryStreamerSubscribePublish(t *testing.T) {
	s := NewMemoryStreamer()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	ch := s.Subscribe(ctx)
	s.Publish(Event{ID: "1", Data: "hallo"})
	if e := <-ch; e.Data != "hallo" {
		t.Fatalf("erwarte hallo, bekam %q", e.Data)
	}
}

func TestHistoryPollingCursor(t *testing.T) {
	s := NewMemoryStreamer()
	s.Publish(Event{Data: "a"})
	s.Publish(Event{Data: "b"})
	evs, next := s.History(0)
	if len(evs) != 2 || next != 2 {
		t.Fatalf("erwarte 2 Events/next 2, bekam %d/%d", len(evs), next)
	}
	if evs2, next2 := s.History(next); len(evs2) != 0 || next2 != 2 {
		t.Fatalf("erwarte 0 neue Events, bekam %d/%d", len(evs2), next2)
	}
}

func TestWriteSSEFormat(t *testing.T) {
	var b bytes.Buffer
	WriteSSE(&b, Event{ID: "7", Name: "update", Data: "x"})
	out := b.String()
	for _, want := range []string{"id: 7\n", "event: update\n", "data: x\n\n"} {
		if !strings.Contains(out, want) {
			t.Fatalf("SSE-Format: %q fehlt in %q", want, out)
		}
	}
}

func TestPollHandlerJSON(t *testing.T) {
	s := NewMemoryStreamer()
	s.Publish(Event{Data: "a"})
	req := httptest.NewRequest(http.MethodGet, "/poll?cursor=0", nil)
	rr := httptest.NewRecorder()
	PollHandler(s).ServeHTTP(rr, req)
	if ct := rr.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("Content-Type %q", ct)
	}
	if !strings.Contains(rr.Body.String(), `"cursor":1`) {
		t.Fatalf("Body ohne cursor:1: %s", rr.Body.String())
	}
}
