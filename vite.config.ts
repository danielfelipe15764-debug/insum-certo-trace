// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// GitHub Pages deploy (CI only): run with GITHUB_PAGES=1 and VITE_BASE=/<repo>/.
// The default build (Lovable/Cloudflare) is unchanged when the flag is absent.
const githubPages = process.env["GITHUB_PAGES"] === "1";
const base = githubPages ? process.env["VITE_BASE"] || "/" : "/";

// GitHub Pages cannot run a server, so the CI build uses TanStack Start's SPA
// mode: one static index.html shell, the client router takes over after load.
export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    ...(githubPages
      ? {
          spa: {
            enabled: true,
            maskPath: base,
            prerender: {
              enabled: true,
              outputPath: "index.html",
              crawlLinks: true,
            },
          },
        }
      : {}),
  },
  ...(githubPages
    ? {
        vite: { base },
        // GitHub Pages serves only static files: skip the server bundle entirely.
        nitro: false,
      }
    : {}),
});
