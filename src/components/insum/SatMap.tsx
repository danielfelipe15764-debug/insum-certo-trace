import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import type { SatMapProps } from "./map-types";

const Inner = lazy(() => import("./SatMapLeaflet"));

/** Mapa de satélite (Esri World Imagery). Carregado só no navegador. */
export function SatMap(props: SatMapProps) {
  const fallback = <div className="animate-pulse rounded-xl bg-muted" style={{ height: props.altura ?? 340 }} />;
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <Inner {...props} />
      </Suspense>
    </ClientOnly>
  );
}
