package components

import (
	"context"
	"strings"
	"testing"

	"github.com/a-h/templ"
)

func render(t *testing.T, c templ.Component) string {
	t.Helper()
	var b strings.Builder
	if err := c.Render(context.Background(), &b); err != nil {
		t.Fatalf("Render: %v", err)
	}
	return b.String()
}

func TestNames(t *testing.T) {
	if got := Names(); len(got) != 4 {
		t.Fatalf("erwarte 4 Komponenten, bekam %v", got)
	}
}

func TestTablePaginationJSFreierFallback(t *testing.T) {
	cols := []Column{{Key: "name", Label: "Name"}}
	rows := []Row{{"name": "Alice"}, {"name": "Bob"}}
	page := Page{Number: 2, Size: 10, Total: 35}
	if page.Pages() != 4 {
		t.Fatalf("Pages=%d, erwarte 4", page.Pages())
	}
	out := render(t, Table(cols, rows, page, "/instanzen"))
	if !strings.Contains(out, "Alice") || !strings.Contains(out, "Bob") {
		t.Fatal("Zeilen fehlen")
	}
	// INV-A1: echte Links mit href (funktionieren ohne JavaScript).
	if !strings.Contains(out, `href="/instanzen?page=1"`) {
		t.Fatalf("Zurück-Link (page=1) fehlt:\n%s", out)
	}
	if !strings.Contains(out, `href="/instanzen?page=3"`) {
		t.Fatalf("Weiter-Link (page=3) fehlt:\n%s", out)
	}
	if !strings.Contains(out, "Seite 2 / 4") {
		t.Fatal("Seiteninfo fehlt")
	}
}

func TestFormValidierungUndFehleranzeige(t *testing.T) {
	fields := []Field{{Name: "email", Label: "E-Mail", Type: "email", Required: true}}

	// Validate: fehlend + ungültig.
	if errs := Validate(fields, FormData{}); errs["email"] == "" {
		t.Fatal("erwarte Pflichtfeld-Fehler")
	}
	if errs := Validate(fields, FormData{"email": "keine-mail"}); errs["email"] == "" {
		t.Fatal("erwarte E-Mail-Fehler")
	}
	if errs := Validate(fields, FormData{"email": "a@b.de"}); len(errs) != 0 {
		t.Fatalf("gültige Eingabe darf keine Fehler haben: %v", errs)
	}

	// JS-freier Fallback: POST-Formular, das die Fehler serverseitig zeigt.
	out := render(t, Form("/speichern", fields, FormData{}, map[string]string{"email": "E-Mail ist erforderlich"}))
	if !strings.Contains(out, `method="post"`) {
		t.Fatal("Formular ohne method=post (INV-A1)")
	}
	if !strings.Contains(out, `name="email"`) || !strings.Contains(out, "required") {
		t.Fatal("Feld/Required fehlt")
	}
	if !strings.Contains(out, "E-Mail ist erforderlich") {
		t.Fatal("Fehlermeldung fehlt")
	}
}

func TestModalAnkerBasiert(t *testing.T) {
	out := render(t, Modal("dlg", "Bestätigen"))
	if !strings.Contains(out, `id="dlg"`) || !strings.Contains(out, "Bestätigen") {
		t.Fatal("Modal-Struktur fehlt")
	}
	// INV-A1: Schließen per Anker, kein JavaScript.
	if !strings.Contains(out, `href="#"`) {
		t.Fatal("Schließen-Anker fehlt")
	}
	trigger := render(t, ModalTrigger("dlg", "Öffnen"))
	if !strings.Contains(trigger, `href="#dlg"`) {
		t.Fatalf("Trigger-Anker fehlt:\n%s", trigger)
	}
}

func TestTimeline(t *testing.T) {
	out := render(t, Timeline([]TimelineEvent{
		{Time: "10:00", Title: "Gestartet", Detail: "Instanz 1"},
		{Time: "10:05", Title: "Abgeschlossen"},
	}))
	for _, want := range []string{"10:00", "Gestartet", "Instanz 1", "Abgeschlossen"} {
		if !strings.Contains(out, want) {
			t.Fatalf("%q fehlt in Timeline", want)
		}
	}
}
