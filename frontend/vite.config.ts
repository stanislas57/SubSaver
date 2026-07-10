import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    rollupOptions: {
      output: {
        // React/ReactDOM/le routeur changent rarement d'un déploiement à
        // l'autre : les isoler dans leur propre chunk permet au navigateur
        // de les garder en cache long terme (Cache-Control immutable côté
        // serveur) même quand le code applicatif change.
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
        },
      },
    },
  },
});
