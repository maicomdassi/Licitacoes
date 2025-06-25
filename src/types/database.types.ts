export interface Licitacao {
  id: number;
  id_licitacao: string;
  titulo: string;
  municipio_ibge?: string;
  uf: string;
  orgao: string;
  abertura_datetime: string;
  objeto: string;
  link: string;
  link_externo?: string;
  municipio: string;
  abertura: string;
  abertura_com_hora: string;
  id_tipo: string;
  tipo: string;
  data_insercao: string;
  created_at: string;
  updated_at: string;
  interece: 'P' | 'S' | 'N'; // P = Participando, S = Sim, N = Não
  valor_max?: number;
  data_leilao?: string; // Data do leilão quando o interesse for "S"
}

export interface ControleConsulta {
  id: number;
  ultima_data_consulta: string;
  created_at?: string;
  updated_at?: string;
}

export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at?: string;
}

export interface Configuracao {
  id: number;
  chave: string;
  valor: string;
  descricao?: string;
  created_at: string;
  updated_at?: string;
}

export type UserRole = 'admin' | 'user'; 