import { describe, it, expect } from "vitest";
import {
  importSpecifiers,
  goImports,
  isForbiddenModelerImport,
  isProjectSpecificGoImport,
  isGoAuthImport,
  isBaseRendererImport,
  isDmnModelDescriptor,
  isAtlasDescriptor,
  isWebToGoImport,
  isGoToWebImport,
} from "./check-invariants.mjs";

describe("INV-M1: kein direkter bpmn-js/dmn-js-Import", () => {
  it("erkennt verbotene Modeler-Imports", () => {
    expect(isForbiddenModelerImport("bpmn-js")).toBe(true);
    expect(isForbiddenModelerImport("bpmn-js/lib/Modeler")).toBe(true);
    expect(isForbiddenModelerImport("dmn-js")).toBe(true);
    expect(isForbiddenModelerImport("dmn-js/lib/Viewer")).toBe(true);
  });
  it("lässt erlaubte Fundament-Imports durch", () => {
    expect(isForbiddenModelerImport("diagram-js")).toBe(false);
    expect(isForbiddenModelerImport("@bpmn-io/properties-panel")).toBe(false);
    expect(isForbiddenModelerImport("@hestia/modeler-kit")).toBe(false);
    expect(isForbiddenModelerImport("bpmn-moddle")).toBe(false);
  });
});

describe("Specifier-Extraktion", () => {
  it("findet import/export/require", () => {
    const specs = importSpecifiers(
      `import x from "diagram-js";\nexport { y } from './y';\nconst z = require("bpmn-js");\nimport "@hestia/tokens";`,
    );
    expect(specs).toEqual(expect.arrayContaining(["diagram-js", "./y", "bpmn-js", "@hestia/tokens"]));
  });
  it("parst Go-Import-Blöcke und Einzelimports", () => {
    expect(goImports(`import (\n\t"fmt"\n\t"github.com/pblumer/atlas/x"\n)`)).toContain(
      "github.com/pblumer/atlas/x",
    );
    expect(goImports(`import "github.com/pblumer/hestia/go/core"`)).toContain(
      "github.com/pblumer/hestia/go/core",
    );
  });
});

describe("INV-H3: go/components projektneutral", () => {
  it("erkennt projektspezifische Imports", () => {
    expect(isProjectSpecificGoImport("github.com/pblumer/temis/engine")).toBe(true);
    expect(isProjectSpecificGoImport("github.com/pblumer/atlas")).toBe(true);
  });
  it("lässt neutrale Imports durch", () => {
    expect(isProjectSpecificGoImport("github.com/pblumer/hestia/go/core")).toBe(false);
    expect(isProjectSpecificGoImport("fmt")).toBe(false);
  });
});

describe("INV-M3: DMN-Descriptor nur in contracts/", () => {
  it("erkennt einen DMN-MODEL-Descriptor", () => {
    const desc = '{ "prefix": "dmn", "uri": "https://www.omg.org/spec/DMN/20240513/MODEL/" }';
    expect(isDmnModelDescriptor(desc)).toBe(true);
  });
  it("ignoriert andere JSON-Dateien", () => {
    expect(isDmnModelDescriptor('{ "name": "irgendwas" }')).toBe(false);
    expect(isDmnModelDescriptor('{ "prefix": "dmndi" }')).toBe(false);
  });
});

describe("INV-O1: Viewer ohne eigenen Renderer", () => {
  it("erkennt BaseRenderer-Import", () => {
    expect(isBaseRendererImport("diagram-js/lib/draw/BaseRenderer")).toBe(true);
  });
  it("lässt andere Imports durch", () => {
    expect(isBaseRendererImport("diagram-js/lib/features/overlays")).toBe(false);
  });
});

describe("INV-M5: atlas-Extension-Descriptor nur in contracts/", () => {
  it("erkennt den atlas-Descriptor", () => {
    expect(isAtlasDescriptor('{ "prefix": "atlas", "uri": "http://hestia/atlas/bpmn" }')).toBe(true);
  });
  it("ignoriert andere JSON-Dateien", () => {
    expect(isAtlasDescriptor('{ "prefix": "bpmn" }')).toBe(false);
  });
});

describe("INV-U3: go/components importiert go/auth nicht", () => {
  it("erkennt Auth-Imports", () => {
    expect(isGoAuthImport("github.com/pblumer/hestia/go/auth")).toBe(true);
    expect(isGoAuthImport("github.com/pblumer/hestia/go/auth/authtest")).toBe(true);
  });
  it("lässt andere Module durch", () => {
    expect(isGoAuthImport("github.com/pblumer/hestia/go/core")).toBe(false);
  });
});

describe("INV-H1: Klassentrennung go <-> web (außer tokens)", () => {
  it("erlaubt @hestia/tokens als einzige geteilte Quelle", () => {
    expect(isWebToGoImport("@hestia/tokens")).toBe(false);
    expect(isWebToGoImport("@hestia/tokens/tokens.css")).toBe(false);
  });
  it("erkennt web->go und go->web", () => {
    expect(isWebToGoImport("../../go/core")).toBe(true);
    expect(isGoToWebImport("github.com/pblumer/hestia/web/modeler-kit")).toBe(true);
    expect(isGoToWebImport("github.com/pblumer/hestia/go/core")).toBe(false);
  });
});
