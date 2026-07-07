// @hestia/atlas-contract — der atlas-Extension-Moddle: die EINE Definition der
// atlas-Ausführungssemantik (INV-M5). Genutzt von modeler-bpmn (zum Modellieren)
// und von der atlas-Engine (zur Ausführung). Ausschließlich via BPMN
// extensionElements — das Basis-XML bleibt ohne diese Extensions OMG-konform
// (INV-B3).
import atlas from "./atlas.json";
import manifest from "./manifest.json";

export const atlasDescriptors = { atlas } as const;
export const atlasManifest = manifest;

/** Der Namespace der atlas-Extension-Elemente. */
export const ATLAS_NAMESPACE = atlas.uri;
