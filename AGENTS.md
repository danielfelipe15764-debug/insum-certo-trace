<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Data stays simulated (seed.ts + store.tsx, localStorage); bump STORAGE_KEY when the data shape changes so old saved data is discarded.
- Maps use Leaflet with keyless Esri World Imagery tiles, loaded only in the browser via SatMap (lazy + ClientOnly); never import leaflet from route modules.
- GitHub Pages CI build (.github/workflows/deploy-pages.yml) is env-gated: GITHUB_PAGES=1 + VITE_BASE=/<repo>/ switches vite.config.ts to TanStack SPA mode (nitro disabled). Never set GITHUB_PAGES in Lovable builds — the sandbox wrapper pins cloudflare-module.
- Overage (estouro) is computed only by calcularEstouro/faixaEstouro in src/lib/insum/estouro.ts so every screen agrees.
- Farm PDF maps are drawn on a canvas from tiles (neutral background fallback) instead of screenshotting the DOM, so download never fails on CORS.
