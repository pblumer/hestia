// Command examples zeigt je ein minimales Beispiel: DMN-Modeler, BPMN-Modeler
// (Klasse B, eingebettet) und einen Klasse-A-Inspektor (server-gerenderte
// Komponenten).
package main

import (
	"log"
	"net/http"
	"os"

	"github.com/pblumer/hestia/go/core"
)

func main() {
	staticDir := envOr("EXAMPLES_STATIC", "static")
	addr := ":" + envOr("PORT", "8081")

	mux := http.NewServeMux()
	mux.Handle("GET /{$}", core.Handler(IndexPage()))
	mux.Handle("GET /dmn", core.Handler(DmnPage()))
	mux.Handle("GET /bpmn", core.Handler(BpmnPage()))
	mux.Handle("GET /inspector", core.Handler(InspectorPage()))
	mux.Handle("GET /assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir(staticDir))))

	log.Printf("examples hört auf %s", addr)
	log.Fatal(http.ListenAndServe(addr, mux))
}

func envOr(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
