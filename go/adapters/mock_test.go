package adapters

import (
	"context"
	"testing"
)

func TestMockAtlasPaging(t *testing.T) {
	a := NewMockAtlas()
	items, total, err := a.Instances(context.Background(), 1, 2)
	if err != nil {
		t.Fatal(err)
	}
	if total != 3 || len(items) != 2 {
		t.Fatalf("erwarte total 3 / 2 Items, bekam %d/%d", total, len(items))
	}
	if page2, _, _ := a.Instances(context.Background(), 2, 2); len(page2) != 1 {
		t.Fatalf("Seite 2 erwarte 1 Item, bekam %d", len(page2))
	}
}

func TestMockAtlasInstanceLookup(t *testing.T) {
	a := NewMockAtlas()
	if _, err := a.Instance(context.Background(), "inst-2"); err != nil {
		t.Fatalf("inst-2 sollte existieren: %v", err)
	}
	if _, err := a.Instance(context.Background(), "nope"); err == nil {
		t.Fatal("erwarte ErrNotFound")
	}
}

func TestMockAtlasIncidents(t *testing.T) {
	inc, err := NewMockAtlas().Incidents(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(inc) != 1 || inc[0].InstanceID != "inst-3" {
		t.Fatalf("unerwartete Incidents: %+v", inc)
	}
}

func TestMockClioSubscribeUndHistory(t *testing.T) {
	c := NewMockClio()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	ch := c.Subscribe(ctx)
	c.Publish(Event{InstanceID: "i1", ElementID: "Task_1", Kind: "token.enter"})
	if e := <-ch; e.ElementID != "Task_1" {
		t.Fatalf("Event %+v", e)
	}
	if evs, next := c.History(0); len(evs) != 1 || next != 1 {
		t.Fatalf("History %d/%d", len(evs), next)
	}
}
