export interface MembroFamilia {
  uid: string;
  nome: string;
  parentesco?: 'conjuge' | 'filho' | 'outro' | string;
}

export interface Familia {
  id?: string;
  nome?: string;
  membros: string[] | MembroFamilia[];
  observacoes?: string;
  criadoEm?: string | Date;
}
