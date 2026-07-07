// @hestia/modeler-dmn — DMN-1.5-Modeler auf dem gemeinsamen Kit.
//
// INV-M1: baut auf @hestia/modeler-kit (diagram-js) auf, importiert NIE dmn-js.
// INV-M3: der DMN-1.5-Moddle-Descriptor ist die SSOT zwischen Modeler und
// temis-Engine — kein 1.3↔1.5-Mapping. Ausbau in Schritt 4.
import { KIT_NAME } from "@hestia/modeler-kit";

export const DMN_MODELER = `dmn-1.5 auf ${KIT_NAME}`;
