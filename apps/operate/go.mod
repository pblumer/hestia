module github.com/pblumer/hestia/apps/operate

go 1.24

require (
	github.com/a-h/templ v0.3.977
	github.com/pblumer/hestia/go/adapters v0.0.0-00010101000000-000000000000
	github.com/pblumer/hestia/go/auth v0.0.0-00010101000000-000000000000
	github.com/pblumer/hestia/go/authstore v0.0.0-00010101000000-000000000000
	github.com/pblumer/hestia/go/components v0.0.0-00010101000000-000000000000
	github.com/pblumer/hestia/go/core v0.0.0-00010101000000-000000000000
)

require (
	github.com/dustin/go-humanize v1.0.1 // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/ncruces/go-strftime v0.1.9 // indirect
	github.com/remyoudompheng/bigfft v0.0.0-20230129092748-24d4a6f8daec // indirect
	golang.org/x/crypto v0.31.0 // indirect
	golang.org/x/sys v0.34.0 // indirect
	modernc.org/libc v1.55.3 // indirect
	modernc.org/mathutil v1.6.0 // indirect
	modernc.org/memory v1.8.0 // indirect
	modernc.org/sqlite v1.34.5 // indirect
)

// Lokale Workspace-Module (go/go.work).
replace github.com/pblumer/hestia/go/adapters => ../../go/adapters

replace github.com/pblumer/hestia/go/components => ../../go/components

replace github.com/pblumer/hestia/go/core => ../../go/core

replace github.com/pblumer/hestia/go/auth => ../../go/auth

replace github.com/pblumer/hestia/go/authstore => ../../go/authstore
