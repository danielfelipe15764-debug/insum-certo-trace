export type Perfil = "administrador" | "almoxarifado" | "motorista" | "operador" | "gestor";

export type StatusInsumo = "pendente" | "em_transporte" | "entregue" | "aplicado";

export type EtapaTipo = "cadastro" | "saida" | "chegada" | "aplicacao";

export interface Talhao {
  id: string;
  nome: string;
  areaHa: number;
}

export interface Fazenda {
  id: string;
  nome: string;
  municipio: string;
  talhoes: Talhao[];
}

export interface Produto {
  id: string;
  nome: string;
  categoria: string;
  unidade: string;
}

export interface OrdemServico {
  id: string;
  codigo: string;
  descricao: string;
  fazendaId: string;
  talhaoId: string;
  dataProgramada: string;
  responsavel: string;
  status: "aberta" | "em_andamento" | "concluida";
}

export interface Insumo {
  id: string;
  qrCode: string;
  produtoId: string;
  lote: string;
  quantidade: number;
  quantidadeAplicada?: number;
  osId: string;
  fazendaId: string;
  talhaoId: string;
  status: StatusInsumo;
  veiculo?: string;
  motorista?: string;
}

export interface Evento {
  id: string;
  insumoId: string;
  tipo: EtapaTipo;
  dataHora: string;
  responsavel: string;
  perfil: Perfil;
  local: string;
  detalhe: string;
}

export type DivergenciaTipo =
  | "fazenda_divergente"
  | "quantidade_divergente"
  | "nao_aplicado"
  | "qr_duplicado"
  | "os_divergente";

export interface Divergencia {
  id: string;
  insumoId: string;
  tipo: DivergenciaTipo;
  descricao: string;
  severidade: "alta" | "media" | "baixa";
  dataHora: string;
  resolvida: boolean;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
}

export interface AppData {
  fazendas: Fazenda[];
  produtos: Produto[];
  ordens: OrdemServico[];
  insumos: Insumo[];
  eventos: Evento[];
  divergencias: Divergencia[];
  usuarios: Usuario[];
}
