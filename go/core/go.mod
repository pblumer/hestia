module github.com/pblumer/hestia/go/core

go 1.24

require (
	github.com/a-h/templ v0.3.977
	github.com/pblumer/hestia/go/auth v0.0.0-00010101000000-000000000000
)

require golang.org/x/crypto v0.31.0 // indirect

// go/auth ist ein lokales Workspace-Modul (go/go.work).
replace github.com/pblumer/hestia/go/auth => ../auth
