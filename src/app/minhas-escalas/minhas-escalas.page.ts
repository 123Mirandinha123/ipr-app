import { Component, inject, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth';
import { FirestoreService } from '../services/firestore';

export interface MinhaEscala {
  data: string;
  ministerio: string;
  funcao: string;
  nome: string;
  turno?: string;
  grupoTurno: 'manha' | 'quinta' | 'noite';
}

@Component({
  selector: 'app-minhas-escalas',
  templateUrl: 'minhas-escalas.page.html',
  styleUrls: ['minhas-escalas.page.scss'],
  standalone: false
})
export class MinhasEscalasPage implements OnInit {

  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);

  todasEscalas: MinhaEscala[] = [];
  filtroMinisterio: string = 'todos';
  ministeriosUsuario: { chave: string; nome: string }[] = [];
  carregando = true;

  async ngOnInit() {
    await this.carregarMinhasEscalas();
  }

  async ionViewWillEnter() {
    await this.carregarMinhasEscalas();
  }

  async carregarMinhasEscalas() {
    const user = this.authService.currentUser;
    if (!user) {
      this.carregando = false;
      return;
    }

    const nome = user.nome?.trim();
    const nomeLower = nome?.toLowerCase();
    if (!nomeLower) {
      this.carregando = false;
      return;
    }

    // Carregar ministérios do usuário para as pílulas de filtro
    const ministeriosDoUser = (user.ministerios || []).map(m => ({
      chave: m.nome.toLowerCase().replace(/\s+/g, ''),
      nome: this.formatarMinisterio(m.nome)
    }));
    this.ministeriosUsuario = ministeriosDoUser;

    this.carregando = true;
    const todas = await firstValueFrom(this.firestoreService.getEscalas());
    this.carregando = false;
    if (!todas) return;

    const resultado: MinhaEscala[] = [];
    const nomeFormatado = user.nome?.trim() || '';

    for (const e of todas) {
      const data = e['data'];
      const ministerio = e['ministerio'];
      const turnoOriginal = (e['turno'] || '').toLowerCase();
      if (!data || !ministerio) continue;

      // Classificar o grupo do turno: 'manha', 'quinta' ou 'noite'
      const grupoTurno = this.determinarGrupoTurno(data, turnoOriginal);

      const funcoes: Record<string, string[]> = e['funcoes'] || {};
      let encontrou = false;

      for (const [funcao, nomes] of Object.entries(funcoes)) {
        if ((nomes || []).map((n: string) => n.trim().toLowerCase()).includes(nomeLower)) {
          resultado.push({ data, ministerio, funcao, nome: nomeFormatado, turno: turnoOriginal, grupoTurno });
          encontrou = true;
          break;
        }
      }
      if (encontrou) continue;

      const lideres: string[] = (e['lideres'] || []).map((n: string) => n.trim().toLowerCase());
      if (lideres.includes(nomeLower)) {
        resultado.push({ data, ministerio, funcao: 'Líder', nome: nomeFormatado, turno: turnoOriginal, grupoTurno });
        continue;
      }

      const membros: string[] = (e['membros'] || []).map((n: string) => n.trim().toLowerCase());
      if (membros.includes(nomeLower)) {
        resultado.push({ data, ministerio, funcao: 'Membro', nome: nomeFormatado, turno: turnoOriginal, grupoTurno });
        continue;
      }
    }

    resultado.sort((a, b) => a.data.localeCompare(b.data));
    this.todasEscalas = resultado;
  }

  determinarGrupoTurno(dataStr: string, turno: string): 'manha' | 'quinta' | 'noite' {
    if (turno === 'quinta') return 'quinta';
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    const d = new Date(ano, mes - 1, dia);
    if (d.getDay() === 4) { // Quinta-feira
      return 'quinta';
    }
    if (turno === 'noite') {
      return 'noite';
    }
    return 'manha';
  }

  setFiltro(chave: string) {
    this.filtroMinisterio = chave;
  }

  get escalasFiltradas(): MinhaEscala[] {
    if (this.filtroMinisterio === 'todos') {
      return this.todasEscalas;
    }
    return this.todasEscalas.filter(e => {
      const chaveMin = e.ministerio.toLowerCase().replace(/\s+/g, '');
      return chaveMin === this.filtroMinisterio;
    });
  }

  get escalasManha(): MinhaEscala[] {
    return this.escalasFiltradas.filter(e => e.grupoTurno === 'manha');
  }

  get escalasQuinta(): MinhaEscala[] {
    return this.escalasFiltradas.filter(e => e.grupoTurno === 'quinta');
  }

  get escalasNoite(): MinhaEscala[] {
    return this.escalasFiltradas.filter(e => e.grupoTurno === 'noite');
  }

  formatarData(dataStr: string): string {
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return `${dias[data.getDay()]}, ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
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
    const chave = nome?.toLowerCase().replace(/\s+/g, '');
    return cores[chave] || '#3b82f6';
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
}
