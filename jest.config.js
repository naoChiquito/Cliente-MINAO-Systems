/** @type {import('jest').Config} */
module.exports = {
  projects: [
    // ======================
    // RENDERER (DOM/JSDOM)
    // ======================
    {
      displayName: "renderer",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/tests/renderer/**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup/renderer.setup.js"],
      clearMocks: true,
      restoreMocks: true,
      resetMocks: true,
      testPathIgnorePatterns: ["/node_modules/", "/dist/", "/build/"]
    },

    // ======================
    // ELECTRON (Node)
    // ======================
    {
      displayName: "electron",
      testEnvironment: "node",
      testMatch: ["<rootDir>/tests/electron/**/*.test.js"],
      setupFilesAfterEnv: ["<rootDir>/tests/setup/electron.setup.js"],
      clearMocks: true,
      restoreMocks: true,
      resetMocks: true,
      testPathIgnorePatterns: ["/node_modules/", "/dist/", "/build/"]
    }
  ],

  collectCoverageFrom: [
    "**/*.js",
    "!**/node_modules/**",
    "!**/tests/**",
    "!**/dist/**",
    "!**/build/**"
  ],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "lcov"]
};
