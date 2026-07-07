// @hestia/modeler-bpmn — BPMN-2.0.2-Modeler auf dem gemeinsamen Kit.
//
// INV-M1: baut auf @hestia/modeler-kit (diagram-js) auf, importiert NIE bpmn-js.
//   Benötigte Behaviors werden gezielt aus dem MIT-lizenzierten bpmn-js-Quellcode
//   extrahiert und nach modeler-kit gehoben — nicht bpmn-js als Ganzes gebunden.
// INV-B1/B2/B3: Basis-XML validiert gegen die OMG-Schemas inkl. vollständigem DI;
//   atlas-Semantik liegt isoliert in extensionElements. Ausbau in Schritt 5.
import { KIT_NAME } from "@hestia/modeler-kit";

export const BPMN_MODELER = `bpmn-2.0.2 auf ${KIT_NAME}`;
