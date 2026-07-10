// @hestia/dmn-contract — die EINE DMN-1.5-Schema-Definition (INV-M3).
// JS-Konsumenten (modeler-dmn) importieren die Descriptoren hierüber; temis (Go)
// vendored dieselben JSON-Dateien (siehe README). Keine divergierende Definition.
import dmn from "./dmn.json";
import dc from "./dc.json";
import di from "./di.json";
import dmndi from "./dmndi.json";
import manifest from "./manifest.json";

export const dmnDescriptors = { dmn, dc, di, dmndi } as const;
export const dmnManifest = manifest;

/** Der DMN-1.5-MODEL-Namespace, den dieser Contract definiert. */
export const DMN_NAMESPACE = dmn.uri;
