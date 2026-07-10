package core

import (
	_ "embed"

	"github.com/a-h/templ"
)

// baseCSS ist das token-basierte Basis-Stylesheet der Klasse-A-Oberflächen.
// Es wird vom Layout inline eingebettet, damit jede App ohne zusätzliche
// Asset-Pipeline eine kohärente, theme-fähige Oberfläche erhält (Auto-Dark).
//
//go:embed base.css
var baseCSS string

// BaseCSS gibt das eingebettete Basis-Stylesheet zurück (z. B. für Tests).
func BaseCSS() string { return baseCSS }

// baseStyle liefert das Basis-Stylesheet als fertigen <style>-Block. Der Umweg
// über templ.Raw ist nötig, weil templ innerhalb eines <style>-Elements keinen
// Go-Ausdruck interpoliert (Roh-Text). Das CSS ist vertrauenswürdig (eingebettet
// aus base.css), daher ist Raw hier unbedenklich.
func baseStyle() templ.Component {
	return templ.Raw(`<style type="text/css">` + baseCSS + `</style>`)
}
