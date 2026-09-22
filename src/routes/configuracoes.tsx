import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { RotateCcw, Bell, QrCode, ShieldCheck } from "lucide-react";
import { useApp } from "@/lib/insum/store";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações · INSUM CERTO" },
      {
        name: "description",
        content: "Regras de validação de destino, alertas de divergência, padrão de QR Code e restauração dos dados de demonstração.",
      },
      { property: "og:title", content: "Configurações · INSUM CERTO" },
      { property: "og:description", content: "Ajuste regras de validação, alertas e padrão de QR Code." },
    ],
  }),
  component: Configuracoes,
});

function Configuracoes() {
  const { resetarDados, data } = useApp();
  const [regras, setRegras] = useState({
    validarDestino: true,
    bloquearDuplicado: true,
    alertaNaoAplicado: true,
    exigirTalhao: true,
  });

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Regras de validação automática e dados de demonstração.</p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <ShieldCheck className="h-4 w-4" /> Regras de validação
        </h2>
        <ul className="mt-3 divide-y divide-border">
          {[
            { k: "validarDestino" as const, t: "Validar destino contra a OS na chegada", d: "Gera alerta de divergência se a fazenda lida for diferente da programada" },
            { k: "bloquearDuplicado" as const, t: "Sinalizar QR Code duplicado", d: "Registra divergência quando a mesma etapa é lida duas vezes" },
            { k: "alertaNaoAplicado" as const, t: "Alertar insumo entregue e não aplicado", d: "Abre divergência após 48h sem registro de aplicação" },
            { k: "exigirTalhao" as const, t: "Exigir talhão na aplicação", d: "Cruza produto + OS + fazenda + talhão antes de finalizar" },
          ].map((r) => (
            <li key={r.k} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{r.t}</p>
                <p className="text-xs text-muted-foreground">{r.d}</p>
              </div>
              <button
                onClick={() => setRegras((v) => ({ ...v, [r.k]: !v[r.k] }))}
                aria-label={r.t}
                className={`h-7 w-12 shrink-0 rounded-full transition-colors ${regras[r.k] ? "bg-primary" : "bg-muted"}`}
              >
                <span
                  className={`block h-6 w-6 rounded-full bg-card transition-transform ${regras[r.k] ? "translate-x-[22px]" : "translate-x-[2px]"}`}
                />
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <QrCode className="h-4 w-4" /> Padrão de QR Code
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Máscara atual: <strong className="text-foreground">QR-INS-000000</strong> · código único e permanente por produto/lote.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {data.insumos.length} QR Codes emitidos · {data.eventos.length} leituras registradas no histórico.
        </p>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <h2 className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Bell className="h-4 w-4" /> Dados de demonstração
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Restaure a base simulada para apresentar o fluxo completo desde o início.
        </p>
        <button
          onClick={() => {
            resetarDados();
            toast.success("Dados de demonstração restaurados");
          }}
          className="mt-3 inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground"
        >
          <RotateCcw className="h-4 w-4" /> Restaurar dados simulados
        </button>
      </section>
    </div>
  );
}
