import { Component, Input } from '@angular/core';
import { ModalController } from '@ionic/angular';

@Component({
  selector: 'app-editar-escala-modal',
  templateUrl: 'editar-escala-modal.component.html',
  styles: [`
    .section-label { font-weight: 600; font-size: 0.95em; color: var(--ion-color-primary); margin: 16px 0 4px; }
    .add-item { --min-height: 36px; font-size: 0.9em; }
    .add-item ion-label { opacity: 0.8; }
  `],
  standalone: false
})
export class EditarEscalaModalComponent {
  @Input() escala: any;
  @Input() participantes: { nome: string; funcoes: string[] }[] = [];
  @Input() ministerio = '';
  @Input() funcoesDisponiveis: string[] = [];

  currentLideres: string[] = [];
  currentMembros: string[] = [];
  currentFuncoes: any = {};

  constructor(private modalCtrl: ModalController) {}

  ngOnInit() {
    this.currentLideres = [...(this.escala.lideres || [])];
    this.currentMembros = [...(this.escala.membros || [])];
    this.currentFuncoes = {};

    const funcoesOrigem = this.escala.funcoes || {};
    for (const [k, v] of Object.entries(funcoesOrigem)) {
      const chave = this.funcaoChave(k);
      if (!this.currentFuncoes[chave]) this.currentFuncoes[chave] = [];
      for (const nome of (v as string[]) || []) {
        if (!this.currentFuncoes[chave].includes(nome)) this.currentFuncoes[chave].push(nome);
      }
    }

    for (const f of this.funcoesDisponiveis) {
      if (!this.currentFuncoes[f]) this.currentFuncoes[f] = [];
    }

    const emFuncoes = new Set<string>();
    Object.values(this.currentFuncoes).forEach((arr: any) =>
      (arr as string[]).forEach(n => emFuncoes.add(n))
    );
    this.currentMembros = this.currentMembros.filter(n => !emFuncoes.has(n));
  }

  get isLouvor(): boolean {
    return this.normalizar(this.ministerio) === 'louvor';
  }

  getFuncoesKeys(): string[] {
    const chaves = new Set<string>(Object.keys(this.currentFuncoes));
    const resultado: string[] = [];
    for (const f of this.funcoesDisponiveis) {
      resultado.push(f);
      chaves.delete(f);
    }
    chaves.forEach(k => resultado.push(k));
    return resultado;
  }

  getDisponiveis(papel: string): any[] {
    if (this.isLouvor && papel !== 'lider' && papel !== 'membro') {
      const nestaFuncao = new Set(this.currentFuncoes[papel] || []);
      return this.participantes.filter(p =>
        !nestaFuncao.has(p.nome) &&
        (p.funcoes || []).some(f => this.funcaoCanonica(f) === this.funcaoCanonica(papel))
      );
    }
    const usados = this.getNomesUsados();
    return this.participantes.filter(p => {
      if (usados.has(p.nome)) return false;
      if (papel === 'lider' || papel === 'membro') return true;
      return (p.funcoes || []).some(f => this.funcaoCanonica(f) === this.funcaoCanonica(papel));
    });
  }

  addPessoa(nome: string, papel: string) {
    if (!nome) return;
    this.currentLideres = this.currentLideres.filter(n => n !== nome);
    this.currentMembros = this.currentMembros.filter(n => n !== nome);
    for (const key of Object.keys(this.currentFuncoes)) {
      this.currentFuncoes[key] = (this.currentFuncoes[key] || []).filter((n: string) => n !== nome);
      if (this.currentFuncoes[key].length === 0) delete this.currentFuncoes[key];
    }
    if (papel === 'lider') {
      this.currentLideres.push(nome);
    } else if (papel === 'membro') {
      this.currentMembros.push(nome);
    } else {
      if (!this.currentFuncoes[papel]) this.currentFuncoes[papel] = [];
      this.currentFuncoes[papel].push(nome);
    }
  }

  removePessoa(nome: string, papel: string) {
    if (papel === 'lider') {
      this.currentLideres = this.currentLideres.filter(n => n !== nome);
    } else if (papel === 'membro') {
      this.currentMembros = this.currentMembros.filter(n => n !== nome);
    } else {
      this.currentFuncoes[papel] = (this.currentFuncoes[papel] || []).filter((n: string) => n !== nome);
      if (this.currentFuncoes[papel].length === 0) delete this.currentFuncoes[papel];
      if (!this.isLouvor && !this.currentLideres.includes(nome) && !this.currentMembros.includes(nome)) {
        this.currentMembros.push(nome);
      }
    }
  }

  private getNomesUsados(): Set<string> {
    const nomes = new Set<string>();
    this.currentLideres.forEach(n => nomes.add(n));
    this.currentMembros.forEach(n => nomes.add(n));
    Object.values(this.currentFuncoes).forEach((arr: any) =>
      (arr as string[]).forEach(n => nomes.add(n))
    );
    return nomes;
  }

  formatarData(dataStr: string): string {
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return `${dias[data.getDay()]}, ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
  }

  private normalizar(texto: string): string {
    return (texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
  }

  private funcaoCanonica(funcao: string): string {
    const norm = this.normalizar(funcao);
    if (norm === 'vocal' || norm === 'vocalista') return 'vocal';
    if (norm === 'backvocal' || norm === 'back' || norm === 'backvocalista') return 'backvocal';
    if (norm === 'violonista') return 'vionolista';
    if (norm === 'bateria') return 'baterista';
    if (norm === 'teclado') return 'tecladista';
    if (norm === 'guitarra') return 'guitarrista';
    if (norm === 'baixo') return 'baixista';
    return norm;
  }

  private funcaoChave(funcao: string): string {
    const canon = this.funcaoCanonica(funcao);
    const padrao = this.funcoesDisponiveis.find(f => this.funcaoCanonica(f) === canon);
    return padrao || funcao;
  }

  save() {
    const funcoes: any = {};
    for (const [k, v] of Object.entries(this.currentFuncoes)) {
      if ((v as string[]).length > 0) funcoes[k] = v;
    }
    this.modalCtrl.dismiss({
      lideres: this.currentLideres,
      membros: this.currentMembros,
      funcoes
    });
  }

  cancel() {
    this.modalCtrl.dismiss(null);
  }
}
