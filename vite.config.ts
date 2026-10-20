// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// GitHub Pages deploy (CI only): run with GITHUB_PAGES=1 and VITE_BASE=/<repo>/.
// The default build (Lovable/Cloudflare) is unchanged when the flag is absent.
const githubPages = process.env.GITHUB_PAGES === "1";
const base = githubPages ? process.env.VITE_BASE || "/" : "/";

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

// The router runs with `base` set, so prerender requests must include the base
// prefix or the router bounces them back to the base root ("max redirects").
const prerenderPages = STATIC_PAGES.map((p) => ({
  path: base === "/" ? p : `${base}${p === "/" ? "" : p.slice(1)}`,
}));

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    ...(githubPages
      ? {
          pages: prerenderPages,
          prerender: { enabled: true, autoStaticPathsDiscovery: false },
        }
      : {}),
  },
  ...(githubPages
    ? {
        vite: { base },
        nitro: { preset: "github-pages" },
      }
    : {}),
});
