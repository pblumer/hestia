import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "web/**/*.test.ts",
      "apps/**/*.test.ts",
      "contracts/**/*.test.ts",
      "tokens/**/*.test.mjs",
      "tools/**/*.test.mjs",
    ],
    environment: "node",
  },
});
