import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  QrCode,
  ClipboardList,
  Package,
  Route as RouteIcon,
  Tractor,
  AlertTriangle,
  FileBarChart,
  Users,
  Settings,
  Menu,
  X,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/insum/store";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/ler-qr", label: "Ler QR Code", icon: QrCode },
  { to: "/ordens", label: "Ordens de Serviço", icon: ClipboardList },
  { to: "/insumos", label: "Insumos", icon: Package },
  { to: "/rastreabilidade", label: "Rastreabilidade", icon: RouteIcon },
  { to: "/fazendas", label: "Fazendas", icon: Tractor },
  { to: "/divergencias", label: "Divergências", icon: AlertTriangle },
  { to: "/relatorios", label: "Relatórios", icon: FileBarChart },
  { to: "/usuarios", label: "Usuários", icon: Users },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
        <Leaf className="h-5 w-5" />
      </span>
      <span className={cn("truncate text-lg font-extrabold tracking-tight", dark ? "text-sidebar-foreground" : "text-foreground")}>
        Insumo<span className="text-sidebar-primary"> Certo</span>
      </span>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { usuarioAtual, data } = useApp();
  const abertas = data.divergencias.filter((d) => !d.resolvida).length;

  const links = (
    <nav className="flex flex-col gap-1 p-3">
      {nav.map(({ to, label, icon: Icon }) => {
        const active = to === "/" ? path === "/" : path.startsWith(to);
        return (
          <Link
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate">{label}</span>
            {to === "/divergencias" && abertas > 0 && (
              <span className="ml-auto rounded-full bg-destructive px-2 py-0.5 text-[11px] font-bold text-destructive-foreground">
                {abertas}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <Logo dark />
        </div>
        <div className="flex-1 overflow-y-auto">{links}</div>
        <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/70">
          <p className="font-semibold text-sidebar-foreground">{usuarioAtual.nome}</p>
          <p className="capitalize">{usuarioAtual.perfil}</p>
        </div>
      </aside>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[82%] max-w-[300px] flex-col bg-sidebar">
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <Logo dark />
              <button aria-label="Fechar menu" onClick={() => setOpen(false)} className="text-sidebar-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{links}</div>
          </aside>
        </div>
      )}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-card/90 px-4 backdrop-blur lg:px-8">
          <button
            aria-label="Abrir menu"
            onClick={() => setOpen(true)}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1 lg:hidden">
            <Logo />
          </div>
          <div className="hidden min-w-0 flex-1 lg:block">
            <p className="truncate text-sm font-semibold text-foreground">
              Rastreabilidade de insumos agrícolas
            </p>
            <p className="truncate text-xs text-muted-foreground">
              Do almoxarifado até a aplicação no talhão
            </p>
          </div>
          <Link
            to="/ler-qr"
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground shadow-card sm:px-4"
          >
            <QrCode className="h-5 w-5" />
            <span className="hidden sm:inline">Ler QR Code</span>
          </Link>
        </header>
        <main className="px-4 py-5 pb-16 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
