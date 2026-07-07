# hestia — Task-Runner. Siehe docs/hestia-concept.md und docs/invariants.md.
SHELL := /bin/bash
.DEFAULT_GOAL := help

GO_MODULES := core components adapters

.PHONY: help setup tokens build build-go build-web lint lint-go lint-web lint-dep \
        check-invariants test test-go test-web dev ci clean

help: ## Diese Übersicht
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN{FS=":.*?## "}{printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2}'

setup: ## Toolchain installieren (templ, pnpm-Deps)
	@command -v templ >/dev/null 2>&1 || go install github.com/a-h/templ/cmd/templ@latest
	pnpm install

tokens: ## tokens.css + tokens.ts aus tokens.json generieren (INV-H2)
	node tokens/generate.mjs

build: build-go build-web ## Alles bauen

build-go: ## Go-Module bauen
	@set -e; for m in $(GO_MODULES); do (cd go/$$m && go build ./...); done

build-web: tokens ## Web-Pakete bauen (nach Token-Generierung)
	pnpm -r run build

lint: lint-go lint-web check-invariants ## Alle Lints + Invarianten-Checks

lint-go: ## gofmt + go vet (+ golangci-lint falls vorhanden)
	@test -z "$$(gofmt -l go)" || { echo "gofmt-Verstöße:"; gofmt -l go; exit 1; }
	@set -e; for m in $(GO_MODULES); do (cd go/$$m && go vet ./...); done
	@if command -v golangci-lint >/dev/null 2>&1; then \
		set -e; for m in $(GO_MODULES); do (cd go/$$m && golangci-lint run); done; \
	else echo "golangci-lint nicht installiert – übersprungen"; fi

lint-web: ## TypeScript-Typecheck + ESLint (INV-M1)
	pnpm exec tsc --noEmit -p tsconfig.json
	pnpm exec eslint .

lint-dep: ## dependency-cruiser (INV-M1/H1 auf Graph-Ebene; ab Schritt 3 scharf)
	pnpm exec depcruise web apps --config .dependency-cruiser.cjs

check-invariants: ## Mechanische Invarianten-Checks (INV-H1, INV-H3, INV-M1)
	node tools/ci/check-invariants.mjs

test: test-go test-web ## Alle Tests

test-go: ## Go-Tests
	@set -e; for m in $(GO_MODULES); do (cd go/$$m && go test ./...); done

test-web: ## Web-/Tooling-Tests (vitest)
	pnpm exec vitest run

dev: ## Dev-Modus (Platzhalter bis apps/ existieren, Schritt 8/9)
	@echo "dev: noch keine App – kommt mit apps/operate (Schritt 8) und apps/examples (Schritt 9)"

ci: ## Vollständige CI-Pipeline lokal: Token-Drift + Lint + Test + Build
	@$(MAKE) tokens
	@git diff --exit-code -- tokens/tokens.css tokens/tokens.ts \
		|| { echo "tokens/ drift – 'make tokens' ausführen und committen (INV-H2)"; exit 1; }
	@$(MAKE) lint
	@$(MAKE) test
	@$(MAKE) build

clean: ## Build-Artefakte entfernen
	rm -rf node_modules web/*/node_modules apps/*/node_modules web/*/dist apps/*/dist
