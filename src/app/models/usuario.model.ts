export interface MinisterioUsuario {
  nome: string;
  lider: boolean;
  ministra: boolean;
  funcoes: string[];
}

export interface IndisponibilidadeUsuario {
  data: string;
  turno?: 'manha' | 'noite' | 'todos' | string;
  motivo?: string;
}

export interface Usuario {
  uid: string;
  id?: string;
  nome: string;
  email: string;
  foto?: string;
  admin?: boolean;
  lider?: boolean;
  ministerios?: MinisterioUsuario[];
  indisponibilidades?: IndisponibilidadeUsuario[];
  criadoEm?: string | Date;
}
