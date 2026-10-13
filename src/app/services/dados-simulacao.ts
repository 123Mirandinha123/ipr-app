import * as dadosSimulados from '../../simulacao-usuarios.json';

export const usuariosSimulados: any[] = (dadosSimulados as any).default ?? (dadosSimulados as any);

export const familiasSimuladas: any[] = [
  { nome: 'Família Souza', membros: ['sim-001', 'sim-002'] },
  { nome: 'Família Lima', membros: ['sim-003', 'sim-034'] },
  { nome: 'Família Prado', membros: ['sim-021', 'sim-013'] }
];
