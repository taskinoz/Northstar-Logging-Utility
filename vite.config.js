import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "./src/setupTests.js",
    pool: "threads",
    maxWorkers: 1,
  },
  build: {
    outDir: "build", // CRA's default build output
  },
});
