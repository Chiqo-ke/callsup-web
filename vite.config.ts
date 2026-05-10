import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { resolve } from "path";

const API_PROXY_TARGET = "http://127.0.0.1:8010";

export default defineConfig({
  plugins: [
    tailwindcss(),
    TanStackRouterVite({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
  ],
  resolve: {
    alias: { "@": resolve(__dirname, "./src") },
  },
  server: {
    proxy: {
      "/auth": { target: API_PROXY_TARGET, changeOrigin: true },
      "/audio": { target: API_PROXY_TARGET, changeOrigin: true },
      "/escalation-queue": { target: API_PROXY_TARGET, changeOrigin: true },
      "/escalation-rules": { target: API_PROXY_TARGET, changeOrigin: true },
      "/context": { target: API_PROXY_TARGET, changeOrigin: true },
      "/health": { target: API_PROXY_TARGET, changeOrigin: true },
      "/metrics": { target: API_PROXY_TARGET, changeOrigin: true },
      "/intelligence": { target: API_PROXY_TARGET, changeOrigin: true },
      "/readiness": { target: API_PROXY_TARGET, changeOrigin: true },
    },
  },
});
