package main

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/pblumer/hestia/go/core"
)

func do(path string, h http.Handler) *httptest.ResponseRecorder {
	rr := httptest.NewRecorder()
	h.ServeHTTP(rr, httptest.NewRequest(http.MethodGet, path, nil))
	return rr
}

func TestIndexVerlinktBeispiele(t *testing.T) {
	rr := do("/", core.Handler(IndexPage()))
	body := rr.Body.String()
	for _, want := range []string{"/dmn", "/bpmn", "/inspector"} {
		if !strings.Contains(body, want) {
			t.Fatalf("Index ohne Link %q", want)
		}
	}
}

func TestModelerSeitenBindenBundleEin(t *testing.T) {
	if !strings.Contains(do("/dmn", core.Handler(DmnPage())).Body.String(), "/assets/dmn.js") {
		t.Fatal("DMN-Seite ohne dmn.js")
	}
	if !strings.Contains(do("/bpmn", core.Handler(BpmnPage())).Body.String(), "/assets/bpmn.js") {
		t.Fatal("BPMN-Seite ohne bpmn.js")
	}
}

func TestInspectorZeigtKomponenten(t *testing.T) {
	body := do("/inspector", core.Handler(InspectorPage())).Body.String()
	for _, want := range []string{"hestia-table", "hestia-form", "hestia-timeline", "Antrag Müller"} {
		if !strings.Contains(body, want) {
			t.Fatalf("Inspector ohne %q", want)
		}
	}
}
