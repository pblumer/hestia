package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/pblumer/hestia/go/adapters"
)

func do(h http.Handler, path string) *httptest.ResponseRecorder {
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, httptest.NewRequest(http.MethodGet, path, nil))
	return rr
}

func TestInstancesPage(t *testing.T) {
	rr := do(newServer(adapters.NewMockAtlas(), adapters.NewMockClio()).handler(), "/instanzen")
	if rr.Code != http.StatusOK {
		t.Fatalf("Status %d", rr.Code)
	}
	body := rr.Body.String()
	if !strings.Contains(body, "Instanzen") || !strings.Contains(body, "inst-1") {
		t.Fatalf("Instanzliste unvollständig:\n%s", body)
	}
}

// A+B: die Detailseite bettet den Viewer ein, lädt das Frontend und verweist auf
// den SSE-Event-Endpunkt.
func TestInstanceDetailEmbedsViewer(t *testing.T) {
	rr := do(newServer(adapters.NewMockAtlas(), adapters.NewMockClio()).handler(), "/instanzen/inst-3")
	if rr.Code != http.StatusOK {
		t.Fatalf("Status %d", rr.Code)
	}
	body := rr.Body.String()
	for _, want := range []string{`id="diagram"`, "/assets/operate.js", `data-events="/events"`, "inst-3"} {
		if !strings.Contains(body, want) {
			t.Fatalf("Detailseite ohne %q", want)
		}
	}
}

func TestInstanceDetailNotFound(t *testing.T) {
	rr := do(newServer(adapters.NewMockAtlas(), adapters.NewMockClio()).handler(), "/instanzen/nope")
	if rr.Code != http.StatusNotFound {
		t.Fatalf("erwarte 404, bekam %d", rr.Code)
	}
}

func TestIncidentsPage(t *testing.T) {
	rr := do(newServer(adapters.NewMockAtlas(), adapters.NewMockClio()).handler(), "/incidents")
	if !strings.Contains(rr.Body.String(), "inc-1") {
		t.Fatalf("Incident fehlt:\n%s", rr.Body.String())
	}
}

func TestEventsPollBridge(t *testing.T) {
	s := newServer(adapters.NewMockAtlas(), adapters.NewMockClio())
	s.clio.Publish(adapters.Event{InstanceID: "inst-1", ElementID: "Task_1", Kind: "token.enter"})
	rr := do(s.handler(), "/events/poll?cursor=0")
	if ct := rr.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("Content-Type %q", ct)
	}
	if !strings.Contains(rr.Body.String(), "Task_1") {
		t.Fatalf("Poll ohne Event:\n%s", rr.Body.String())
	}
}
