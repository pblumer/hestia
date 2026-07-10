// Package adapters hält die projektspezifischen Datenbindungen (clio, temis,
// atlas …), die go/components bewusst NICHT kennen darf (INV-H3). Hier — und
// nur hier — ist es erlaubt, projektspezifische Pakete zu importieren.
// Ausbau ab Schritt 7/8 (Operate konsumiert atlas + clio, siehe
// docs/hestia-concept.md).
package adapters

// Adapter beschreibt eine projektspezifische Datenquelle, die
// go/components-Komponenten mit Daten versorgt, ohne dass die Komponenten die
// Quelle kennen.
type Adapter interface {
	// Name identifiziert die Bindung (z. B. "atlas", "clio").
	Name() string
}
