// Package core ist der Rendering-Layer der Klasse-A-Oberflächen (templ + HTMX):
// Layout, Streaming-Abstraktion (SSE/Polling hinter einem Interface) und die
// Basis, auf der go/components aufsetzt. Der eigentliche Ausbau folgt in
// Schritt 7 (siehe docs/hestia-concept.md, ADR-0001).
//
// INV-H1: Kein Import aus web/. Die einzige geteilte Quelle zwischen Klasse A
// und Klasse B ist tokens/ (hier als generiertes tokens.css).
package core

// Version des hestia-Frameworks (Platzhalter bis zum ersten Release).
const Version = "0.0.0-dev"
