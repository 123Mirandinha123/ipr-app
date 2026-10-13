import { Injectable, inject } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { EscalaService } from './escala.service';

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

@Injectable({
  providedIn: 'root'
})
export class ShareService {

  private escalaService = inject(EscalaService);

  nomeMes(mes: number): string {
    return MESES[mes] || '';
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

  private ordenar(escalas: any[]): any[] {
    return [...escalas].sort((a, b) => {
      const cmp = String(a['data'] || '').localeCompare(String(b['data'] || ''));
      if (cmp !== 0) return cmp;
      const ta = a['turno'] === 'manha' ? 0 : a['turno'] === 'noite' ? 1 : 0;
      const tb = b['turno'] === 'manha' ? 0 : b['turno'] === 'noite' ? 1 : 0;
      return ta - tb;
    });
  }

  private getParticipantes(escala: any): string[] {
    return [...(escala.lideres || []), ...(escala.membros || [])];
  }

  private getFuncoesOrdenadas(escala: any): string[] {
    const funcoes = escala.funcoes || {};
    const ordem: Record<string, number> = { vocal: 0, vocalista: 0, backvocal: 1 };
    return Object.keys(funcoes).sort((a, b) => {
      const na = this.escalaService.normalizar(a);
      const nb = this.escalaService.normalizar(b);
      return (ordem[na] ?? 99) - (ordem[nb] ?? 99);
    });
  }

  private getNomesNaFuncao(escala: any, funcao: string): string[] {
    const funcoes = escala.funcoes || {};
    const alvo = this.escalaService.normalizar(funcao);
    for (const key of Object.keys(funcoes)) {
      if (this.escalaService.normalizar(key) === alvo) {
        return funcoes[key] || [];
      }
    }
    return [];
  }

  private getSemFuncao(escala: any): string[] {
    const comFuncao = new Set<string>();
    Object.values(escala.funcoes || {}).forEach((arr: any) =>
      (arr as string[]).forEach(n => comFuncao.add(n))
    );
    return this.getParticipantes(escala).filter(n => !comFuncao.has(n));
  }

  private blocoEscala(escala: any): string {
    const linhas: string[] = [];
    const turno = this.formatarTurno(escala['turno']);
    const cabecalho = turno
      ? `${this.formatarData(String(escala['data']))} - ${turno}`
      : this.formatarData(String(escala['data']));
    linhas.push(cabecalho);

    const funcoes = this.getFuncoesOrdenadas(escala);
    if (funcoes.length > 0) {
      funcoes.forEach(f => {
        const nomes = this.getNomesNaFuncao(escala, f);
        if (nomes.length > 0) {
          linhas.push(`${f}: ${nomes.join(', ')}`);
        }
      });
      const semFuncao = this.getSemFuncao(escala);
      if (semFuncao.length > 0) {
        linhas.push(semFuncao.join(', '));
      }
    } else {
      const participantes = this.getParticipantes(escala);
      if (participantes.length > 0) {
        linhas.push(participantes.join(', '));
      }
    }

    return linhas.join('\n');
  }

  gerarTextoMinisterio(ministerio: string, escalas: any[], mes: number, ano: number): string {
    const nome = this.escalaService.formatarNomeMinisterioDe(ministerio);
    const cabecalho = `*Escalas - ${nome} - ${this.nomeMes(mes)}/${ano}*`;
    const blocos = this.ordenar(escalas).map(e => this.blocoEscala(e)).join('\n\n');
    return `${cabecalho}\n\n${blocos}`;
  }

  gerarTextoTudo(grupos: { ministerio: string; escalas: any[] }[], mes: number, ano: number): string {
    const cabecalho = `*Escalas - ${this.nomeMes(mes)}/${ano}*`;
    const secoes = grupos.map(g => {
      const nome = this.escalaService.formatarNomeMinisterioDe(g.ministerio);
      const blocos = this.ordenar(g.escalas).map(e => this.blocoEscala(e)).join('\n\n');
      return `— ${nome} —\n\n${blocos}`;
    });
    return `${cabecalho}\n\n${secoes.join('\n\n')}`;
  }

  async compartilhar(titulo: string, texto: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Share.share({ title: titulo, text: texto, dialogTitle: titulo });
      return;
    }
    const nav = navigator as any;
    if (typeof nav.share === 'function') {
      try {
        await nav.share({ title: titulo, text: texto });
        return;
      } catch {
        return;
      }
    }
    window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank');
  }
}
