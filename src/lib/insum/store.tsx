import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { buildSeed } from "./seed";
import type { AppData, Divergencia, Evento, Insumo, Perfil } from "./types";

const STORAGE_KEY = "insumcerto:data:v1";

export interface LeituraResultado {
  ok: boolean;
  titulo: string;
  mensagem: string;
  divergencias: string[];
  insumo?: Insumo;
}

interface Ctx {
  data: AppData;
  usuarioAtual: { nome: string; perfil: Perfil };
  setUsuarioAtual: (u: { nome: string; perfil: Perfil }) => void;
  produto: (id: string) => AppData["produtos"][number] | undefined;
  fazenda: (id: string) => AppData["fazendas"][number] | undefined;
  ordem: (id: string) => AppData["ordens"][number] | undefined;
  talhaoNome: (fazendaId: string, talhaoId: string) => string;
  insumoPorQr: (qr: string) => Insumo | undefined;
  eventosDe: (insumoId: string) => Evento[];
  registrarSaida: (qr: string, p: { veiculo: string; motorista: string; fazendaId: string }) => LeituraResultado;
  registrarChegada: (qr: string, p: { fazendaId: string }) => LeituraResultado;
  registrarAplicacao: (qr: string, p: { quantidade: number; fazendaId: string; talhaoId: string }) => LeituraResultado;
  resolverDivergencia: (id: string) => void;
  resetarDados: () => void;
}

const AppCtx = createContext<Ctx | null>(null);

let seq = 1000;
const nid = (p: string) => `${p}-${Date.now().toString(36)}-${seq++}`;

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => buildSeed());
  const [usuarioAtual, setUsuarioAtual] = useState<{ nome: string; perfil: Perfil }>({
    nome: "Daniel Felipe",
    perfil: "administrador",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData(JSON.parse(raw) as AppData);
    } catch {
      /* ignora */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* ignora */
    }
  }, [data]);

  const value = useMemo<Ctx>(() => {
    const produto = (id: string) => data.produtos.find((p) => p.id === id);
    const fazenda = (id: string) => data.fazendas.find((f) => f.id === id);
    const ordem = (id: string) => data.ordens.find((o) => o.id === id);
    const insumoPorQr = (qr: string) =>
      data.insumos.find((i) => i.qrCode.trim().toUpperCase() === qr.trim().toUpperCase());

    function commit(mut: (d: AppData) => void) {
      setData((prev) => {
        const next: AppData = JSON.parse(JSON.stringify(prev));
        mut(next);
        return next;
      });
    }

    function novoEvento(
      d: AppData,
      insumoId: string,
      tipo: Evento["tipo"],
      local: string,
      detalhe: string,
      usr: { nome: string; perfil: Perfil },
    ) {
      d.eventos.push({
        id: nid("evt"),
        insumoId,
        tipo,
        dataHora: new Date().toISOString(),
        responsavel: usr.nome,
        perfil: usr.perfil,
        local,
        detalhe,
      });
    }

    function novaDivergencia(
      d: AppData,
      insumoId: string,
      tipo: Divergencia["tipo"],
      descricao: string,
      severidade: Divergencia["severidade"],
    ) {
      d.divergencias.push({
        id: nid("div"),
        insumoId,
        tipo,
        descricao,
        severidade,
        dataHora: new Date().toISOString(),
        resolvida: false,
      });
    }

    return {
      data,
      usuarioAtual,
      setUsuarioAtual,
      produto,
      fazenda,
      ordem,
      talhaoNome: (fazendaId, talhaoId) =>
        fazenda(fazendaId)?.talhoes.find((t) => t.id === talhaoId)?.nome ?? "—",
      insumoPorQr,
      eventosDe: (insumoId) =>
        data.eventos
          .filter((e) => e.insumoId === insumoId)
          .sort((a, b) => a.dataHora.localeCompare(b.dataHora)),

      registrarSaida: (qr, p) => {
        const insumo = insumoPorQr(qr);
        if (!insumo)
          return { ok: false, titulo: "QR Code não encontrado", mensagem: `Nenhum insumo cadastrado com o código ${qr}.`, divergencias: [] };
        const prod = produto(insumo.produtoId)!;
        const os = ordem(insumo.osId)!;
        const div: string[] = [];
        if (insumo.status !== "pendente")
          div.push(`Este QR Code já teve saída registrada (status atual: ${insumo.status.replace("_", " ")}). Leitura duplicada.`);
        if (p.fazendaId !== insumo.fazendaId)
          div.push(`Destino informado (${fazenda(p.fazendaId)?.nome}) diferente da fazenda programada na ${os.codigo} (${fazenda(insumo.fazendaId)?.nome}).`);

        commit((d) => {
          const i = d.insumos.find((x) => x.id === insumo.id)!;
          i.status = "em_transporte";
          i.veiculo = p.veiculo;
          i.motorista = p.motorista;
          novoEvento(
            d,
            i.id,
            "saida",
            "Almoxarifado Central",
            `Saída registrada · ${prod.nome} · lote ${i.lote} · ${i.quantidade} ${prod.unidade} · veículo ${p.veiculo} · motorista ${p.motorista} · destino ${fazenda(p.fazendaId)?.nome}`,
            usuarioAtual,
          );
          if (insumo.status !== "pendente")
            novaDivergencia(d, i.id, "qr_duplicado", `Segunda leitura de saída para ${i.qrCode}`, "baixa");
          if (p.fazendaId !== insumo.fazendaId)
            novaDivergencia(
              d,
              i.id,
              "fazenda_divergente",
              `Saída de ${i.qrCode} destinada a ${fazenda(p.fazendaId)?.nome}, mas a ${os.codigo} é da ${fazenda(insumo.fazendaId)?.nome}`,
              "alta",
            );
        });

        return {
          ok: div.length === 0,
          titulo: div.length ? "Saída registrada com divergência" : "Saída registrada",
          mensagem: `${prod.nome} · lote ${insumo.lote} · ${insumo.quantidade} ${prod.unidade} agora está EM TRANSPORTE para ${fazenda(p.fazendaId)?.nome}.`,
          divergencias: div,
          insumo,
        };
      },

      registrarChegada: (qr, p) => {
        const insumo = insumoPorQr(qr);
        if (!insumo)
          return { ok: false, titulo: "QR Code não encontrado", mensagem: `Nenhum insumo cadastrado com o código ${qr}.`, divergencias: [] };
        const prod = produto(insumo.produtoId)!;
        const os = ordem(insumo.osId)!;
        const div: string[] = [];
        if (insumo.status === "pendente") div.push("Chegada lida sem registro de saída do almoxarifado.");
        if (insumo.status === "entregue" || insumo.status === "aplicado")
          div.push("Chegada já registrada anteriormente para este QR Code.");
        if (p.fazendaId !== insumo.fazendaId)
          div.push(`Leitura na ${fazenda(p.fazendaId)?.nome}, porém a ${os.codigo} está programada para a ${fazenda(insumo.fazendaId)?.nome}.`);

        commit((d) => {
          const i = d.insumos.find((x) => x.id === insumo.id)!;
          if (i.status !== "aplicado") i.status = "entregue";
          novoEvento(
            d,
            i.id,
            "chegada",
            fazenda(p.fazendaId)?.nome ?? "—",
            div.length
              ? `Chegada registrada com divergência · ${prod.nome} · lote ${i.lote}`
              : `Chegada validada · ${prod.nome} · lote ${i.lote} · destino confere com ${os.codigo}`,
            usuarioAtual,
          );
          if (p.fazendaId !== insumo.fazendaId)
            novaDivergencia(
              d,
              i.id,
              "fazenda_divergente",
              `${i.qrCode} chegou na ${fazenda(p.fazendaId)?.nome} divergindo da ${os.codigo} (${fazenda(insumo.fazendaId)?.nome})`,
              "alta",
            );
          if (insumo.status === "entregue" || insumo.status === "aplicado")
            novaDivergencia(d, i.id, "qr_duplicado", `Leitura de chegada duplicada para ${i.qrCode}`, "baixa");
          if (insumo.status === "pendente")
            novaDivergencia(d, i.id, "os_divergente", `${i.qrCode} chegou sem saída registrada no almoxarifado`, "media");
        });

        return {
          ok: div.length === 0,
          titulo: div.length ? "Divergência na chegada" : "Chegada validada",
          mensagem: `${prod.nome} · lote ${insumo.lote} · ${os.codigo} · ${fazenda(p.fazendaId)?.nome}.`,
          divergencias: div,
          insumo,
        };
      },

      registrarAplicacao: (qr, p) => {
        const insumo = insumoPorQr(qr);
        if (!insumo)
          return { ok: false, titulo: "QR Code não encontrado", mensagem: `Nenhum insumo cadastrado com o código ${qr}.`, divergencias: [] };
        const prod = produto(insumo.produtoId)!;
        const os = ordem(insumo.osId)!;
        const div: string[] = [];
        if (insumo.status === "aplicado") div.push("Este insumo já havia sido aplicado. Leitura duplicada.");
        if (insumo.status === "pendente" || insumo.status === "em_transporte")
          div.push("Aplicação registrada sem confirmação de chegada na fazenda.");
        if (p.fazendaId !== insumo.fazendaId)
          div.push(`Aplicação na ${fazenda(p.fazendaId)?.nome} diverge da fazenda da ${os.codigo} (${fazenda(insumo.fazendaId)?.nome}).`);
        if (p.talhaoId !== insumo.talhaoId)
          div.push(`Talhão informado diverge do talhão programado (${value_talhao(insumo.fazendaId, insumo.talhaoId)}).`);
        if (p.quantidade !== insumo.quantidade)
          div.push(`Quantidade aplicada (${p.quantidade} ${prod.unidade}) diferente da retirada (${insumo.quantidade} ${prod.unidade}).`);

        function value_talhao(fid: string, tid: string) {
          return fazenda(fid)?.talhoes.find((t) => t.id === tid)?.nome ?? "—";
        }

        commit((d) => {
          const i = d.insumos.find((x) => x.id === insumo.id)!;
          i.status = "aplicado";
          i.quantidadeAplicada = p.quantidade;
          novoEvento(
            d,
            i.id,
            "aplicacao",
            `${fazenda(p.fazendaId)?.nome} · ${value_talhao(p.fazendaId, p.talhaoId)}`,
            `Aplicação confirmada · ${prod.nome} · ${p.quantidade} ${prod.unidade} · ${os.codigo}`,
            usuarioAtual,
          );
          if (p.quantidade !== insumo.quantidade)
            novaDivergencia(
              d,
              i.id,
              "quantidade_divergente",
              `${i.qrCode}: retirado ${insumo.quantidade} ${prod.unidade}, aplicado ${p.quantidade} ${prod.unidade}`,
              "media",
            );
          if (p.fazendaId !== insumo.fazendaId)
            novaDivergencia(
              d,
              i.id,
              "fazenda_divergente",
              `${i.qrCode} aplicado na ${fazenda(p.fazendaId)?.nome} em vez da ${fazenda(insumo.fazendaId)?.nome} (${os.codigo})`,
              "alta",
            );
          const ordemRef = d.ordens.find((o) => o.id === i.osId);
          if (ordemRef && d.insumos.filter((x) => x.osId === ordemRef.id).every((x) => x.status === "aplicado"))
            ordemRef.status = "concluida";
        });

        return {
          ok: div.length === 0,
          titulo: div.length ? "Aplicação com divergência" : "Aplicação confirmada",
          mensagem: `${prod.nome} · ${p.quantidade} ${prod.unidade} · ${os.codigo} · ${fazenda(p.fazendaId)?.nome}.`,
          divergencias: div,
          insumo,
        };
      },

      resolverDivergencia: (id) =>
        commit((d) => {
          const x = d.divergencias.find((v) => v.id === id);
          if (x) x.resolvida = true;
        }),

      resetarDados: () => setData(buildSeed()),
    };
  }, [data, usuarioAtual]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp precisa estar dentro de AppDataProvider");
  return ctx;
}

export const statusLabel: Record<string, string> = {
  pendente: "Pendente",
  em_transporte: "Em transporte",
  entregue: "Entregue",
  aplicado: "Aplicado",
  aberta: "Aberta",
  em_andamento: "Em andamento",
  concluida: "Concluída",
};

export const divergenciaLabel: Record<string, string> = {
  fazenda_divergente: "Fazenda divergente",
  quantidade_divergente: "Quantidade divergente",
  nao_aplicado: "Produto não aplicado",
  qr_duplicado: "QR Code duplicado",
  os_divergente: "Fluxo fora de ordem",
};

export function fmtDataHora(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
