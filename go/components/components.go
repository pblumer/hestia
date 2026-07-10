// Package components enthält typisierte, projektneutrale Klasse-A-Komponenten
// (Tabelle mit Server-Pagination, Formular mit Validierung, Modal,
// Event-Timeline). Jede interaktive Komponente hat einen JS-freien Fallback
// (INV-A1); HTMX ist nur progressive Verbesserung.
//
// INV-H3 (Komponenten-Neutralität): Dieses Paket importiert KEINE
// clio-, temis-, chrampfer- oder atlas-spezifischen Pakete. Mechanisch geprüft
// durch tools/ci/check-invariants.mjs.
package components

import (
	"strconv"
	"strings"
)

// Names liefert die verfügbaren Komponenten.
func Names() []string {
	return []string{"table", "form", "modal", "timeline"}
}

// --- Tabelle ---------------------------------------------------------------

type Column struct {
	Key   string
	Label string
}

// Row ist eine Zeile als Key→Zellwert (bereits gerendert/formatiert).
type Row map[string]string

// Page beschreibt den Server-Pagination-Zustand (1-basiert).
type Page struct {
	Number int
	Size   int
	Total  int
}

func (p Page) Pages() int {
	if p.Size <= 0 {
		return 1
	}
	n := (p.Total + p.Size - 1) / p.Size
	if n < 1 {
		return 1
	}
	return n
}

func (p Page) HasPrev() bool { return p.Number > 1 }
func (p Page) HasNext() bool { return p.Number < p.Pages() }

func (p Page) Prev() int {
	if p.HasPrev() {
		return p.Number - 1
	}
	return p.Number
}

func (p Page) Next() int {
	if p.HasNext() {
		return p.Number + 1
	}
	return p.Number
}

// pageURL baut einen JS-freien Pagination-Link (Fallback ohne HTMX).
func pageURL(base string, page int) string {
	sep := "?"
	if strings.Contains(base, "?") {
		sep = "&"
	}
	return base + sep + "page=" + strconv.Itoa(page)
}

func itoa(n int) string { return strconv.Itoa(n) }

// --- Formular --------------------------------------------------------------

type Field struct {
	Name     string
	Label    string
	Type     string // "text", "email", …
	Value    string
	Required bool
}

// FormData sind die eingereichten Werte (Feldname→Wert).
type FormData map[string]string

// Validate prüft die Felder gegen die Daten und liefert Feld→Fehlermeldung.
// Serverseitig — der JS-freie Fallback rendert das Formular mit diesen Fehlern neu.
func Validate(fields []Field, data FormData) map[string]string {
	errs := map[string]string{}
	for _, f := range fields {
		val := strings.TrimSpace(data[f.Name])
		if f.Required && val == "" {
			errs[f.Name] = f.Label + " ist erforderlich"
			continue
		}
		if f.Type == "email" && val != "" && !strings.Contains(val, "@") {
			errs[f.Name] = "Ungültige E-Mail-Adresse"
		}
	}
	return errs
}

// --- Timeline --------------------------------------------------------------

type TimelineEvent struct {
	Time   string
	Title  string
	Detail string
}
