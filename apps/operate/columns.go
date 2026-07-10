package main

import (
	"github.com/pblumer/hestia/go/adapters"
	"github.com/pblumer/hestia/go/components"
)

func instanceColumns() []components.Column {
	return []components.Column{
		{Key: "id", Label: "Instanz"},
		{Key: "process", Label: "Prozess"},
		{Key: "state", Label: "Status"},
		{Key: "current", Label: "Aktuelles Element"},
	}
}

func instanceRows(items []adapters.Instance) []components.Row {
	rows := make([]components.Row, 0, len(items))
	for _, i := range items {
		rows = append(rows, components.Row{
			"id":      i.ID,
			"process": i.ProcessID,
			"state":   i.State,
			"current": i.CurrentElementID,
		})
	}
	return rows
}

func incidentColumns() []components.Column {
	return []components.Column{
		{Key: "id", Label: "Incident"},
		{Key: "instance", Label: "Instanz"},
		{Key: "element", Label: "Element"},
		{Key: "message", Label: "Meldung"},
	}
}

func incidentRows(items []adapters.Incident) []components.Row {
	rows := make([]components.Row, 0, len(items))
	for _, i := range items {
		rows = append(rows, components.Row{
			"id":       i.ID,
			"instance": i.InstanceID,
			"element":  i.ElementID,
			"message":  i.Message,
		})
	}
	return rows
}
