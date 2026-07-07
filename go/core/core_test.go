package core

import "testing"

func TestVersionGesetzt(t *testing.T) {
	if Version == "" {
		t.Fatal("Version darf nicht leer sein")
	}
}
