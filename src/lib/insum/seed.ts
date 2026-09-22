import type { AppData, Evento, Insumo, Divergencia, StatusInsumo } from "./types";

const fazendas = [
  {
    id: "faz-1",
    nome: "Fazenda Santa Luzia",
    municipio: "Rio Verde / GO",
    talhoes: [
      { id: "t-1a", nome: "Talhão A1", areaHa: 124 },
      { id: "t-1b", nome: "Talhão A2", areaHa: 98 },
      { id: "t-1c", nome: "Talhão B1", areaHa: 210 },
    ],
  },
  {
    id: "faz-2",
    nome: "Fazenda Boa Esperança",
    municipio: "Jataí / GO",
    talhoes: [
      { id: "t-2a", nome: "Talhão N1", areaHa: 160 },
      { id: "t-2b", nome: "Talhão N2", areaHa: 143 },
    ],
  },
  {
    id: "faz-3",
    nome: "Fazenda Três Lagoas",
    municipio: "Chapadão do Sul / MS",
    talhoes: [
      { id: "t-3a", nome: "Talhão L4", areaHa: 320 },
      { id: "t-3b", nome: "Talhão L5", areaHa: 275 },
    ],
  },
  {
    id: "faz-4",
    nome: "Fazenda Vale do Sol",
    municipio: "Luís Eduardo Magalhães / BA",
    talhoes: [
      { id: "t-4a", nome: "Talhão P2", areaHa: 410 },
      { id: "t-4b", nome: "Talhão P3", areaHa: 388 },
    ],
  },
];

const produtos = [
  { id: "prd-1", nome: "Glifosato 480 SL", categoria: "Herbicida", unidade: "L" },
  { id: "prd-2", nome: "Mancozebe 800 WP", categoria: "Fungicida", unidade: "kg" },
  { id: "prd-3", nome: "Cloreto de Potássio", categoria: "Fertilizante", unidade: "t" },
  { id: "prd-4", nome: "MAP Granulado", categoria: "Fertilizante", unidade: "t" },
  { id: "prd-5", nome: "Lambda-cialotrina 250", categoria: "Inseticida", unidade: "L" },
  { id: "prd-6", nome: "Semente Soja Intacta", categoria: "Semente", unidade: "sc" },
  { id: "prd-7", nome: "Óleo Mineral Adjuvante", categoria: "Adjuvante", unidade: "L" },
  { id: "prd-8", nome: "Micronutriente Zn/B", categoria: "Fertilizante Foliar", unidade: "L" },
];

const ordens = [
  {
    id: "os-1",
    codigo: "OS-2026-0141",
    descricao: "Dessecação pré-plantio",
    fazendaId: "faz-1",
    talhaoId: "t-1a",
    dataProgramada: "2026-09-18",
    responsavel: "Carlos Menezes",
    status: "em_andamento" as const,
  },
  {
    id: "os-2",
    codigo: "OS-2026-0142",
    descricao: "Adubação de base soja",
    fazendaId: "faz-2",
    talhaoId: "t-2a",
    dataProgramada: "2026-09-19",
    responsavel: "Ana Prado",
    status: "em_andamento" as const,
  },
  {
    id: "os-3",
    codigo: "OS-2026-0143",
    descricao: "Controle de lagarta",
    fazendaId: "faz-3",
    talhaoId: "t-3a",
    dataProgramada: "2026-09-20",
    responsavel: "João Batista",
    status: "aberta" as const,
  },
  {
    id: "os-4",
    codigo: "OS-2026-0144",
    descricao: "Semeadura Talhão P2",
    fazendaId: "faz-4",
    talhaoId: "t-4a",
    dataProgramada: "2026-09-21",
    responsavel: "Rafael Lima",
    status: "aberta" as const,
  },
  {
    id: "os-5",
    codigo: "OS-2026-0139",
    descricao: "Aplicação foliar micronutrientes",
    fazendaId: "faz-1",
    talhaoId: "t-1c",
    dataProgramada: "2026-09-15",
    responsavel: "Carlos Menezes",
    status: "concluida" as const,
  },
  {
    id: "os-6",
    codigo: "OS-2026-0140",
    descricao: "Fungicida preventivo",
    fazendaId: "faz-3",
    talhaoId: "t-3b",
    dataProgramada: "2026-09-16",
    responsavel: "João Batista",
    status: "concluida" as const,
  },
];

const usuarios = [
  { id: "usr-1", nome: "Daniel Felipe", email: "daniel@insumcerto.com", perfil: "administrador" as const, ativo: true },
  { id: "usr-2", nome: "Marcos Alves", email: "marcos@insumcerto.com", perfil: "almoxarifado" as const, ativo: true },
  { id: "usr-3", nome: "Pedro Rocha", email: "pedro@insumcerto.com", perfil: "motorista" as const, ativo: true },
  { id: "usr-4", nome: "Luís Ferreira", email: "luis@insumcerto.com", perfil: "motorista" as const, ativo: true },
  { id: "usr-5", nome: "Carlos Menezes", email: "carlos@insumcerto.com", perfil: "operador" as const, ativo: true },
  { id: "usr-6", nome: "Ana Prado", email: "ana@insumcerto.com", perfil: "gestor" as const, ativo: true },
  { id: "usr-7", nome: "João Batista", email: "joao@insumcerto.com", perfil: "operador" as const, ativo: true },
  { id: "usr-8", nome: "Rafael Lima", email: "rafael@insumcerto.com", perfil: "operador" as const, ativo: false },
];

interface SeedRow {
  qr: string;
  produtoId: string;
  lote: string;
  qtd: number;
  osId: string;
  status: StatusInsumo;
  veiculo?: string;
  motorista?: string;
  aplicada?: number;
  dias: number;
}

const rows: SeedRow[] = [
  { qr: "QR-INS-000101", produtoId: "prd-1", lote: "L-2409-A", qtd: 600, osId: "os-1", status: "aplicado", veiculo: "Truck MBB-1029", motorista: "Pedro Rocha", aplicada: 600, dias: 4 },
  { qr: "QR-INS-000102", produtoId: "prd-7", lote: "L-2409-B", qtd: 120, osId: "os-1", status: "aplicado", veiculo: "Truck MBB-1029", motorista: "Pedro Rocha", aplicada: 105, dias: 4 },
  { qr: "QR-INS-000103", produtoId: "prd-3", lote: "L-2408-K", qtd: 32, osId: "os-2", status: "em_transporte", veiculo: "Bitrem VWX-7781", motorista: "Luís Ferreira", dias: 1 },
  { qr: "QR-INS-000104", produtoId: "prd-4", lote: "L-2408-M", qtd: 28, osId: "os-2", status: "em_transporte", veiculo: "Bitrem VWX-7781", motorista: "Luís Ferreira", dias: 1 },
  { qr: "QR-INS-000105", produtoId: "prd-5", lote: "L-2409-C", qtd: 80, osId: "os-3", status: "entregue", veiculo: "Camionete JKL-4402", motorista: "Pedro Rocha", dias: 2 },
  { qr: "QR-INS-000106", produtoId: "prd-2", lote: "L-2409-D", qtd: 240, osId: "os-6", status: "aplicado", veiculo: "Truck MBB-1029", motorista: "Luís Ferreira", aplicada: 240, dias: 6 },
  { qr: "QR-INS-000107", produtoId: "prd-8", lote: "L-2409-E", qtd: 150, osId: "os-5", status: "aplicado", veiculo: "Camionete JKL-4402", motorista: "Pedro Rocha", aplicada: 150, dias: 7 },
  { qr: "QR-INS-000108", produtoId: "prd-6", lote: "L-2409-F", qtd: 420, osId: "os-4", status: "pendente", dias: 0 },
  { qr: "QR-INS-000109", produtoId: "prd-3", lote: "L-2408-N", qtd: 45, osId: "os-4", status: "pendente", dias: 0 },
  { qr: "QR-INS-000110", produtoId: "prd-1", lote: "L-2409-G", qtd: 400, osId: "os-3", status: "entregue", veiculo: "Camionete JKL-4402", motorista: "Luís Ferreira", dias: 2 },
  { qr: "QR-INS-000111", produtoId: "prd-5", lote: "L-2409-H", qtd: 60, osId: "os-6", status: "aplicado", veiculo: "Truck MBB-1029", motorista: "Pedro Rocha", aplicada: 48, dias: 5 },
  { qr: "QR-INS-000112", produtoId: "prd-2", lote: "L-2409-J", qtd: 180, osId: "os-1", status: "em_transporte", veiculo: "Truck MBB-1029", motorista: "Pedro Rocha", dias: 1 },
  { qr: "QR-INS-000113", produtoId: "prd-4", lote: "L-2408-P", qtd: 36, osId: "os-5", status: "aplicado", veiculo: "Bitrem VWX-7781", motorista: "Luís Ferreira", aplicada: 36, dias: 8 },
  { qr: "QR-INS-000114", produtoId: "prd-7", lote: "L-2409-Q", qtd: 90, osId: "os-2", status: "entregue", veiculo: "Bitrem VWX-7781", motorista: "Pedro Rocha", dias: 1 },
];

function iso(diasAtras: number, hora: number, min = 0) {
  const base = new Date("2026-09-22T09:00:00-03:00");
  const d = new Date(base.getTime() - diasAtras * 86400000);
  d.setHours(hora, min, 0, 0);
  return d.toISOString();
}

export function buildSeed(): AppData {
  const insumos: Insumo[] = [];
  const eventos: Evento[] = [];
  const divergencias: Divergencia[] = [];
  let ev = 0;
  let dv = 0;

  rows.forEach((r, i) => {
    const os = ordens.find((o) => o.id === r.osId)!;
    const fazenda = fazendas.find((f) => f.id === os.fazendaId)!;
    const produto = produtos.find((p) => p.id === r.produtoId)!;
    const insumo: Insumo = {
      id: `ins-${i + 1}`,
      qrCode: r.qr,
      produtoId: r.produtoId,
      lote: r.lote,
      quantidade: r.qtd,
      osId: r.osId,
      fazendaId: os.fazendaId,
      talhaoId: os.talhaoId,
      status: r.status,
      ...(r.veiculo ? { veiculo: r.veiculo } : {}),
      ...(r.motorista ? { motorista: r.motorista } : {}),
      ...(r.aplicada !== undefined ? { quantidadeAplicada: r.aplicada } : {}),
    };
    insumos.push(insumo);

    eventos.push({
      id: `evt-${++ev}`,
      insumoId: insumo.id,
      tipo: "cadastro",
      dataHora: iso(r.dias + 1, 7, 30),
      responsavel: "Marcos Alves",
      perfil: "almoxarifado",
      local: "Almoxarifado Central",
      detalhe: `QR Code gerado para ${produto.nome} · lote ${r.lote} · ${r.qtd} ${produto.unidade}`,
    });

    if (r.status !== "pendente") {
      eventos.push({
        id: `evt-${++ev}`,
        insumoId: insumo.id,
        tipo: "saida",
        dataHora: iso(r.dias, 8, 10 + i),
        responsavel: "Marcos Alves",
        perfil: "almoxarifado",
        local: "Almoxarifado Central",
        detalhe: `Saída liberada · veículo ${r.veiculo} · motorista ${r.motorista} · destino ${fazenda.nome}`,
      });
    }

    if (r.status === "entregue" || r.status === "aplicado") {
      eventos.push({
        id: `evt-${++ev}`,
        insumoId: insumo.id,
        tipo: "chegada",
        dataHora: iso(r.dias, 11, 20 + i),
        responsavel: r.motorista ?? "Pedro Rocha",
        perfil: "motorista",
        local: fazenda.nome,
        detalhe: `Chegada confirmada em ${fazenda.nome} · destino validado com ${os.codigo}`,
      });
    }

    if (r.status === "aplicado") {
      eventos.push({
        id: `evt-${++ev}`,
        insumoId: insumo.id,
        tipo: "aplicacao",
        dataHora: iso(r.dias, 15, 5 + i),
        responsavel: os.responsavel,
        perfil: "operador",
        local: `${fazenda.nome} · ${fazenda.talhoes.find((t) => t.id === os.talhaoId)?.nome}`,
        detalhe: `Aplicados ${r.aplicada} ${produto.unidade} de ${r.qtd} ${produto.unidade} retirados`,
      });
      if (r.aplicada !== undefined && r.aplicada !== r.qtd) {
        divergencias.push({
          id: `div-${++dv}`,
          insumoId: insumo.id,
          tipo: "quantidade_divergente",
          descricao: `Retirado ${r.qtd} ${produto.unidade} e aplicado ${r.aplicada} ${produto.unidade} (${produto.nome}) na ${os.codigo}`,
          severidade: "media",
          dataHora: iso(r.dias, 15, 10 + i),
          resolvida: false,
        });
      }
    }
  });

  // Divergência simulada: produto aplicado em fazenda diferente da OS
  divergencias.push({
    id: `div-${++dv}`,
    insumoId: "ins-11",
    tipo: "fazenda_divergente",
    descricao:
      "QR-INS-000111 foi lido na Fazenda Boa Esperança, porém a OS-2026-0140 estava programada para a Fazenda Três Lagoas",
    severidade: "alta",
    dataHora: iso(5, 14, 40),
    resolvida: false,
  });
  // QR duplicado
  divergencias.push({
    id: `div-${++dv}`,
    insumoId: "ins-5",
    tipo: "qr_duplicado",
    descricao: "Leitura de chegada duplicada para QR-INS-000105 no intervalo de 3 minutos",
    severidade: "baixa",
    dataHora: iso(2, 11, 26),
    resolvida: true,
  });
  // Não aplicado
  divergencias.push({
    id: `div-${++dv}`,
    insumoId: "ins-10",
    tipo: "nao_aplicado",
    descricao: "QR-INS-000110 entregue há mais de 48h na Fazenda Três Lagoas e ainda sem registro de aplicação",
    severidade: "alta",
    dataHora: iso(0, 8, 0),
    resolvida: false,
  });

  return { fazendas, produtos, ordens, insumos, eventos, divergencias, usuarios };
}
