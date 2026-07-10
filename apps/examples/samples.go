package main

import "github.com/pblumer/hestia/go/components"

func inspectorColumns() []components.Column {
	return []components.Column{
		{Key: "id", Label: "ID"},
		{Key: "name", Label: "Name"},
		{Key: "state", Label: "Status"},
	}
}

func inspectorRows() []components.Row {
	return []components.Row{
		{"id": "1", "name": "Antrag Müller", "state": "offen"},
		{"id": "2", "name": "Antrag Meier", "state": "erledigt"},
	}
}

func inspectorFields() []components.Field {
	return []components.Field{
		{Name: "name", Label: "Name", Type: "text", Required: true},
		{Name: "email", Label: "E-Mail", Type: "email", Required: true},
	}
}

func inspectorTimeline() []components.TimelineEvent {
	return []components.TimelineEvent{
		{Time: "09:00", Title: "Angelegt", Detail: "durch System"},
		{Time: "09:15", Title: "Geprüft"},
	}
}
