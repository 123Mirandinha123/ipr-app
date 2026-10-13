import { Component, inject, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FirestoreService } from '../services/firestore';
import { EscalaService } from '../services/escala.service';

@Component({
  selector: 'app-escalas-do-dia',
  templateUrl: 'escalas-do-dia.page.html',
  styleUrls: ['escalas-do-dia.page.scss'],
  standalone: false
})
export class EscalasDoDiaPage implements OnInit {

  private firestoreService = inject(FirestoreService);
  private escalaService = inject(EscalaService);

  escalas: any[] = [];
  dataHoje = '';

  async ngOnInit() {
    this.dataHoje = new Date().toISOString().split('T')[0];
    const todas = await firstValueFrom(this.firestoreService.getEscalas());
    if (!todas) return;
    this.escalas = todas
      .filter(e => e['data'] === this.dataHoje)
      .sort((a, b) => {
        const ta = a['turno'] === 'manha' ? 0 : a['turno'] === 'noite' ? 1 : 0;
        const tb = b['turno'] === 'manha' ? 0 : b['turno'] === 'noite' ? 1 : 0;
        if (ta !== tb) return ta - tb;
        return (a['ministerio'] || '').localeCompare(b['ministerio'] || '');
      });
  }

  formatarData(dataStr: string): string {
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return `${dias[data.getDay()]}, ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
  }

  formatarTurno(turno?: string): string {
    if (turno === 'manha') return 'Manhã';
    if (turno === 'noite') return 'Noite';
    return '';
  }

  corMinisterio(nome: string): string {
    const cores: Record<string, string> = {
      louvor: '#e74c3c',
      midia: '#3498db',
      renoshow: '#f39c12',
      maternal: '#e91e63',
      '4a6': '#9b59b6',
      '7a10': '#1abc9c',
      juniores: '#2ecc71',
      adolescentes: '#ff9800',
      sonoplastia: '#607d8b',
      diaconos: '#795548'
    };
    const chave = (nome || '').toLowerCase().replace(/\s+/g, '');
    return cores[chave] || '#999';
  }

  formatarMinisterio(nome: string): string {
    const mapa: Record<string, string> = {
      maternal: 'Maternal', '4a6': '4 à 6', '7a10': '7 à 10',
      juniores: 'Juniores', adolescentes: 'Adolescentes',
      sonoplastia: 'Sonoplastia', diaconos: 'Diáconos',
      louvor: 'Louvor', midia: 'Mídia', renoshow: 'RenoShow'
    };
    return mapa[nome] || nome;
  }

  getFuncoes(escala: any): string[] {
    if (!escala || !escala.funcoes) return [];
    return Object.keys(escala.funcoes);
  }

  getNomesNaFuncao(escala: any, funcao: string): string[] {
    return (escala.funcoes || {})[funcao] || [];
  }

  getFuncoesVagas(escala: any): string[] {
    if (!escala || !escala.ministerio) return [];
    const esperadas = this.escalaService.funcoesDisponiveis[escala.ministerio] || [];
    const funcoes = escala.funcoes || {};
    const presentes = new Set<string>();
    Object.keys(funcoes).forEach(k => {
      const nomes = funcoes[k];
      if (Array.isArray(nomes) && nomes.length > 0) {
        presentes.add(this.escalaService.funcaoCanonica2(k));
      }
    });
    return esperadas.filter(f => {
      const c = this.escalaService.funcaoCanonica2(f);
      return !!c && !presentes.has(c);
    });
  }

  getParticipantes(escala: any): string[] {
    return [...(escala.lideres || []), ...(escala.membros || [])];
  }

  getSemFuncao(escala: any): string[] {
    const comFuncao = new Set<string>();
    Object.values(escala.funcoes || {}).forEach((arr: any) => (arr as string[]).forEach(n => comFuncao.add(n)));
    return this.getParticipantes(escala).filter(n => !comFuncao.has(n));
  }
}
