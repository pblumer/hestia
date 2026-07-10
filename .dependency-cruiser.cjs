// dependency-cruiser: Graph-basierte Absicherung von INV-M1 (dritte Ebene neben
// dem CI-Checker und ESLint). Voll scharf geschaltet ab Schritt 3, wenn die
// Modeler echte Imports haben; die Regel steht schon jetzt.
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "inv-m1-no-bpmn-dmn-js",
      comment:
        "INV-M1: web/-Pakete dürfen bpmn-js/dmn-js nicht direkt importieren — nur diagram-js via @hestia/modeler-kit.",
      severity: "error",
      from: { path: "^(web|apps)/" },
      to: { path: "node_modules/(bpmn-js|dmn-js)(/|$)" },
    },
    {
      name: "inv-h1-web-no-go",
      comment: "INV-H1: web/ teilt mit go/ ausschließlich tokens/.",
      severity: "error",
      from: { path: "^(web|apps)/" },
      to: { path: "^go/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
  },
};
