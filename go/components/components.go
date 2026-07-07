// Package components enthält typisierte, projektneutrale Klasse-A-Komponenten
// (Tabelle mit Server-Pagination, Formular mit Validierung, Modal,
// Event-Timeline). Ausbau in Schritt 7 (siehe docs/hestia-concept.md).
//
// INV-H3 (Komponenten-Neutralität): Dieses Paket importiert KEINE
// clio-, temis-, chrampfer- oder atlas-spezifischen Pakete. Projektbindungen
// leben ausschließlich in go/adapters. Der Check tools/ci/check-invariants.mjs
// erzwingt dies mechanisch.
package components

// Names liefert die registrierten Komponenten. Noch leer — die konkreten
// Komponenten kommen in Schritt 7.
func Names() []string {
	return []string{}
}
