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
