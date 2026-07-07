// ESLint (Flat Config) für Klasse B. Zweite mechanische Absicherung von INV-M1
// zusätzlich zu tools/ci/check-invariants.mjs: kein direkter bpmn-js/dmn-js-Import.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "tokens/tokens.ts", // generiert (INV-H2)
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Node-Tooling (Generator, CI-Checks, Configs): Node-Globals bereitstellen.
    files: ["**/*.mjs", "**/*.cjs", "**/*.js"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        module: "writable",
        require: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        URL: "readonly",
      },
    },
  },
  {
    // Playwright-E2E: Browser-Globals in page.evaluate-Callbacks erlauben.
    files: ["e2e/**/*.ts"],
    languageOptions: {
      globals: {
        document: "readonly",
        window: "readonly",
        getComputedStyle: "readonly",
        HTMLElement: "readonly",
      },
    },
  },
  {
    files: ["web/**/*.ts", "apps/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["bpmn-js", "bpmn-js/*", "dmn-js", "dmn-js/*"],
              message:
                "INV-M1: kein direkter bpmn-js/dmn-js-Import. Modeler bauen auf @hestia/modeler-kit (diagram-js) auf.",
            },
          ],
        },
      ],
    },
  },
);
