package components

import "testing"

func TestNamesLeerBisSchritt7(t *testing.T) {
	if len(Names()) != 0 {
		t.Fatalf("erwarte noch keine Komponenten, bekam %v", Names())
	}
}
