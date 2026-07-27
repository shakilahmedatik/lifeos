import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  {
    test: {
      name: "backend",
      root: "./backend",
      environment: "node",
      include: ["src/**/*.test.ts"],
      exclude: ["**/node_modules/**", "**/dist/**"],
    },
  },
  {
    test: {
      name: "frontend",
      root: "./frontend",
      environment: "jsdom",
      include: ["src/**/*.test.{ts,tsx}"],
      exclude: ["**/node_modules/**", "**/dist/**"],
    },
  },
]);
