// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const API_PROXY_TARGET = "http://127.0.0.1:8010";

export default defineConfig({
  vite: {
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
  },
});
