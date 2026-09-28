import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, Warehouse, Truck, Sprout, BarChart3 } from "lucide-react";
import { useApp } from "@/lib/insum/store";
import type { Perfil } from "@/lib/insum/types";

export const Route = createFileRoute("/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários e perfis · Insumo Certo" },
      {
        name: "description",
        content: "Controle de usuários com perfis de administrador, almoxarifado, motorista, operador de campo e gestor.",
      },
      { property: "og:title", content: "Usuários e perfis · Insumo Certo" },
      { property: "og:description", content: "Permissões por perfil em cada etapa da rastreabilidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Usuarios,
});

const perfis: { id: Perfil; nome: string; icone: typeof ShieldCheck; permissoes: string }[] = [
  { id: "administrador", nome: "Administrador", icone: ShieldCheck, permissoes: "Acesso total, cadastros, usuários e configurações" },
  { id: "almoxarifado", nome: "Almoxarifado", icone: Warehouse, permissoes: "Gera QR Code e registra saída de insumos" },
  { id: "motorista", nome: "Motorista", icone: Truck, permissoes: "Registra transporte e chegada na fazenda" },
  { id: "operador", nome: "Operador de campo", icone: Sprout, permissoes: "Confirma aplicação no talhão" },
  { id: "gestor", nome: "Gestor", icone: BarChart3, permissoes: "Consulta painéis, divergências e relatórios" },
];

function Usuarios() {
  const { data, usuarioAtual, setUsuarioAtual } = useApp();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Usuários</h1>
        <p className="mt-1 text-sm text-muted-foreground">Perfis de acesso e responsáveis por cada etapa.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {perfis.map(({ id, nome, icone: Icone, permissoes }) => (
          <div key={id} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Icone className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-bold text-foreground">{nome}</p>
            <p className="mt-1 text-xs text-muted-foreground">{permissoes}</p>
            <p className="mt-2 text-xs font-semibold text-primary">
              {data.usuarios.filter((u) => u.perfil === id).length} usuário(s)
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
        <h2 className="text-sm font-bold text-foreground">Equipe cadastrada</h2>
        <ul className="mt-3 divide-y divide-border">
          {data.usuarios.map((u) => (
            <li key={u.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{u.nome}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {u.email} · <span className="capitalize">{u.perfil}</span>
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    u.ativo ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {u.ativo ? "Ativo" : "Inativo"}
                </span>
                <button
                  onClick={() => setUsuarioAtual({ nome: u.nome, perfil: u.perfil })}
                  className={`rounded-xl px-3 py-2 text-xs font-semibold ${
                    usuarioAtual.nome === u.nome ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {usuarioAtual.nome === u.nome ? "Em uso" : "Usar perfil"}
                </button>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          O perfil em uso é gravado como responsável em cada leitura de QR Code.
        </p>
      </div>
    </div>
  );
}
