import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { AlertTriangle, CheckCircle2, ArrowRight, Truck, MapPin, Sprout } from "lucide-react";
import { QrScanner } from "@/components/insum/QrScanner";
import { StatusBadge } from "@/components/insum/StatusBadge";
import { useApp, type LeituraResultado } from "@/lib/insum/store";

export const Route = createFileRoute("/ler-qr")({
  head: () => ({
    meta: [
      { title: "Ler QR Code · Insumo Certo" },
      {
        name: "description",
        content:
          "Leia o QR Code do insumo com a câmera do celular para registrar saída do almoxarifado, chegada na fazenda e aplicação no talhão.",
      },
      { property: "og:title", content: "Ler QR Code · Insumo Certo" },
      {
        property: "og:description",
        content: "Registro de saída, chegada e aplicação em poucos toques, direto do celular.",
      },
    ],
  }),
  component: LerQr,
});

type Etapa = "saida" | "chegada" | "aplicacao";

const etapas: { id: Etapa; titulo: string; sub: string; icone: typeof Truck }[] = [
  { id: "saida", titulo: "Saída do almoxarifado", sub: "Produto, lote, veículo e destino", icone: Truck },
  { id: "chegada", titulo: "Chegada na fazenda", sub: "Valida destino com a OS", icone: MapPin },
  { id: "aplicacao", titulo: "Aplicação no campo", sub: "Confirma uso e quantidade", icone: Sprout },
];

function LerQr() {
  const { data, produto, fazenda, ordem, talhaoNome, registrarSaida, registrarChegada, registrarAplicacao, insumoPorQr } =
    useApp();
  const [etapa, setEtapa] = useState<Etapa>("saida");
  const [codigo, setCodigo] = useState<string | null>(null);
  const [resultado, setResultado] = useState<LeituraResultado | null>(null);
  const [veiculo, setVeiculo] = useState("Truck MBB-1029");
  const [motorista, setMotorista] = useState("Pedro Rocha");
  const [fazendaId, setFazendaId] = useState("");
  const [talhaoId, setTalhaoId] = useState("");
  const [quantidade, setQuantidade] = useState("");

  const insumo = codigo ? insumoPorQr(codigo) : undefined;

  const onCodigo = useCallback(
    (c: string) => {
      setResultado(null);
      setCodigo(c);
      const ins = insumoPorQr(c);
      if (ins) {
        setFazendaId(ins.fazendaId);
        setTalhaoId(ins.talhaoId);
        setQuantidade(String(ins.quantidade));
      }
    },
    [insumoPorQr],
  );

  function confirmar() {
    if (!codigo) return;
    if (etapa === "saida") setResultado(registrarSaida(codigo, { veiculo, motorista, fazendaId }));
    else if (etapa === "chegada") setResultado(registrarChegada(codigo, { fazendaId }));
    else setResultado(registrarAplicacao(codigo, { quantidade: Number(quantidade || 0), fazendaId, talhaoId }));
  }

  const talhoes = fazenda(fazendaId)?.talhoes ?? [];
  const sugestoes = data.insumos
    .filter((i) =>
      etapa === "saida" ? i.status === "pendente" : etapa === "chegada" ? i.status === "em_transporte" : i.status === "entregue",
    )
    .map((i) => i.qrCode);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-foreground">Ler QR Code</h1>
        <p className="mt-1 text-sm text-muted-foreground">Escolha a etapa e aponte a câmera. Poucos toques, registro imediato.</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {etapas.map(({ id, titulo, sub, icone: Icone }) => (
          <button
            key={id}
            onClick={() => {
              setEtapa(id);
              setResultado(null);
            }}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              etapa === id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"
            }`}
          >
            <Icone className="h-5 w-5" />
            <p className="mt-2 text-sm font-bold leading-tight">{titulo}</p>
            <p className={`mt-1 text-xs ${etapa === id ? "opacity-85" : "text-muted-foreground"}`}>{sub}</p>
          </button>
        ))}
      </div>

      <QrScanner onCodigo={onCodigo} sugestoes={sugestoes} />

      {codigo && !insumo && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          QR Code <strong>{codigo}</strong> não encontrado na base de insumos.
        </div>
      )}

      {insumo && (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">{insumo.qrCode}</p>
              <p className="truncate text-lg font-bold text-foreground">{produto(insumo.produtoId)?.nome}</p>
              <p className="text-sm text-muted-foreground">
                Lote {insumo.lote} · {insumo.quantidade} {produto(insumo.produtoId)?.unidade} · {ordem(insumo.osId)?.codigo}
              </p>
              <p className="text-sm text-muted-foreground">
                Programado: {fazenda(insumo.fazendaId)?.nome} · {talhaoNome(insumo.fazendaId, insumo.talhaoId)}
              </p>
            </div>
            <StatusBadge status={insumo.status} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {etapa === "saida" && (
              <>
                <Campo label="Veículo">
                  <input value={veiculo} onChange={(e) => setVeiculo(e.target.value)} maxLength={40} className={inputCls} />
                </Campo>
                <Campo label="Motorista">
                  <select value={motorista} onChange={(e) => setMotorista(e.target.value)} className={inputCls}>
                    {data.usuarios
                      .filter((u) => u.perfil === "motorista")
                      .map((u) => (
                        <option key={u.id} value={u.nome}>
                          {u.nome}
                        </option>
                      ))}
                  </select>
                </Campo>
              </>
            )}
            <Campo label={etapa === "saida" ? "Fazenda de destino" : "Fazenda da leitura"}>
              <select
                value={fazendaId}
                onChange={(e) => {
                  setFazendaId(e.target.value);
                  setTalhaoId("");
                }}
                className={inputCls}
              >
                {data.fazendas.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </Campo>
            {etapa === "aplicacao" && (
              <>
                <Campo label="Talhão">
                  <select value={talhaoId} onChange={(e) => setTalhaoId(e.target.value)} className={inputCls}>
                    <option value="">Selecione</option>
                    {talhoes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome}
                      </option>
                    ))}
                  </select>
                </Campo>
                <Campo label={`Quantidade aplicada (${produto(insumo.produtoId)?.unidade})`}>
                  <input
                    type="number"
                    min={0}
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    className={inputCls}
                  />
                </Campo>
              </>
            )}
          </div>

          <button
            onClick={confirmar}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-5 text-lg font-bold text-primary-foreground shadow-card active:scale-[0.99]"
          >
            {etapa === "saida" ? "Confirmar saída" : etapa === "chegada" ? "Confirmar chegada" : "Confirmar aplicação"}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      )}

      {resultado && (
        <div
          className={`rounded-2xl border p-4 ${
            resultado.ok ? "border-success/30 bg-success/10" : "border-destructive/30 bg-destructive/10"
          }`}
        >
          <p className={`flex items-center gap-2 text-base font-bold ${resultado.ok ? "text-success" : "text-destructive"}`}>
            {resultado.ok ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            {resultado.titulo}
          </p>
          <p className="mt-1 text-sm text-foreground">{resultado.mensagem}</p>
          {resultado.divergencias.length > 0 && (
            <ul className="mt-3 space-y-2">
              {resultado.divergencias.map((d, i) => (
                <li key={i} className="rounded-xl bg-card px-3 py-2 text-xs text-destructive">
                  {d}
                </li>
              ))}
            </ul>
          )}
          {resultado.insumo && (
            <Link
              to="/rastreabilidade"
              search={{ qr: resultado.insumo.qrCode }}
              className="mt-3 inline-flex text-sm font-semibold text-primary"
            >
              Ver linha do tempo deste QR Code
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

const inputCls =
  "h-12 w-full rounded-xl border border-input bg-background px-3 text-base text-foreground outline-none focus:ring-2 focus:ring-ring";

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
