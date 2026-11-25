export interface ParticipanteEscala {
  uid?: string;
  nome: string;
  funcao?: string;
  lider?: boolean;
  ministra?: boolean;
}

export interface Escala {
  id?: string;
  data: string;
  turno?: 'manha' | 'noite' | string;
  ministerio: string;
  participantes?: ParticipanteEscala[];
  integrantes?: string[];
  lideres?: string[];
  membros?: string[];
  funcoes?: Record<string, string[] | any>;
  criadoEm?: string | Date;
  criadoPor?: string;
  observacoes?: string;
  [key: string]: any;
}

export interface DataCultoTurno {
  data: string;
  turno?: 'manha' | 'noite';
}
