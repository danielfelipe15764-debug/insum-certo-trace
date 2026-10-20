// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// GitHub Pages deploy (CI only): run with GITHUB_PAGES=1.
// The default build (Lovable/Cloudflare) is unchanged when the flag is absent.
const githubPages = process.env.GITHUB_PAGES === "1";

// Every non-parameterized route must be listed; each is prerendered to <route>/index.html.
const STATIC_PAGES = [
  "/",
  "/ler-qr",
  "/rastreabilidade",
  "/ordens",
  "/insumos",
  "/gerar-qr",
  "/fazendas",
  "/divergencias",
  "/relatorios",
  "/usuarios",
  "/configuracoes",
];

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    ...(githubPages
      ? {
          pages: STATIC_PAGES.map((path) => ({ path })),
          prerender: { enabled: true, autoStaticPathsDiscovery: false },
        }
      : {}),
  },
  ...(githubPages
    ? {
        // Base path matches the repo subpath on github.io (e.g. /insumo-certo/).
        // VITE_BASE must match so the router and asset URLs agree.
        vite: { base: process.env.VITE_BASE || "/" },
        nitro: { preset: "github-pages" },
      }
    : {}),
});
