import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, "../"),   // outputs directly into extension/
    emptyOutDir: false,                  // don't delete manifest.json etc.
    rollupOptions: {
      input:  resolve(__dirname, "src/main.jsx"),
      output: {
        entryFileNames: "sidebar.js",    // extension expects "sidebar.js"
        assetFileNames: (info) => {
          if (info.name?.endsWith(".css")) return "sidebar.css";
          return info.name ?? "asset";
        },
        // No code splitting — extension needs single files
        manualChunks: undefined,
      },
    },
  },
});
