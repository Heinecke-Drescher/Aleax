import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  root: "client",
  plugins: [react()],
  server: {
    // Players connect to each other in the p2p mode, so there is no server to reach.
    proxy:
      mode === "p2p"
        ? undefined
        : { "/sync": { target: "ws://localhost:3000", ws: true } },
  },
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
    license: { fileName: "licenses.txt" },
  },
  test: {
    dir: import.meta.dirname,
  },
}));
