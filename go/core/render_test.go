package core

import (
	"context"
	"strings"
	"testing"
)

func TestLayoutRendert(t *testing.T) {
	var b strings.Builder
	if err := Layout("Titel").Render(context.Background(), &b); err != nil {
		t.Fatalf("Render: %v", err)
	}
	out := b.String()
	if !strings.Contains(out, "<title>Titel</title>") {
		t.Fatalf("Titel fehlt:\n%s", out)
	}
	if !strings.Contains(out, "/assets/tokens.css") {
		t.Fatal("Token-CSS-Link fehlt (INV-H2)")
	}
}

// Das Layout bettet das token-basierte Basis-Stylesheet ein, damit die
// Oberfläche ihre Fläche aus den Tokens bezieht und prefers-color-scheme in den
// Apps greift (Auto-Dark, US-TOK-02). color-scheme lässt native Controls
// mitschalten.
func TestLayoutBettetBasisStilEin(t *testing.T) {
	var b strings.Builder
	if err := Layout("X").Render(context.Background(), &b); err != nil {
		t.Fatalf("Render: %v", err)
	}
	out := b.String()
	for _, want := range []string{"var(--color-bg)", "var(--color-fg)", "color-scheme"} {
		if !strings.Contains(out, want) {
			t.Fatalf("Basis-Stil ohne %q:\n%s", want, out)
		}
	}
}
