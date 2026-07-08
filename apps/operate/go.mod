module github.com/pblumer/hestia/apps/operate

go 1.24

require (
	github.com/a-h/templ v0.3.977
	github.com/pblumer/hestia/go/adapters v0.0.0-00010101000000-000000000000
	github.com/pblumer/hestia/go/auth v0.0.0-00010101000000-000000000000
	github.com/pblumer/hestia/go/components v0.0.0-00010101000000-000000000000
	github.com/pblumer/hestia/go/core v0.0.0-00010101000000-000000000000
)

require golang.org/x/crypto v0.31.0 // indirect

// Lokale Workspace-Module (go/go.work).
replace github.com/pblumer/hestia/go/adapters => ../../go/adapters

replace github.com/pblumer/hestia/go/components => ../../go/components

replace github.com/pblumer/hestia/go/core => ../../go/core

replace github.com/pblumer/hestia/go/auth => ../../go/auth
