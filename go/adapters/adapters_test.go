package adapters

import "testing"

type stubAdapter struct{}

func (stubAdapter) Name() string { return "stub" }

func TestAdapterInterface(t *testing.T) {
	var a Adapter = stubAdapter{}
	if a.Name() != "stub" {
		t.Fatalf("unerwarteter Name: %q", a.Name())
	}
}
