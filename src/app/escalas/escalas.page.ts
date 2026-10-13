import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';
import { FirestoreService } from '../services/firestore';
import { EscalaService } from '../services/escala.service';
import { AuthService, Usuario } from '../services/auth';
import { EditarEscalaModalComponent } from './editar-escala-modal.component';

@Component({
  selector: 'app-escalas',
  templateUrl: './escalas.page.html',
  styleUrls: ['./escalas.page.scss'],
  standalone: false
})
export class EscalasPage implements OnInit {

  private firestoreService = inject(FirestoreService);
  private escalaService = inject(EscalaService);
  private route = inject(ActivatedRoute);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  authService = inject(AuthService);

  escalas: any[] = [];
  todasEscalas: any[] = [];
  usuarios: any[] = [];
  usuario: Usuario | null = null;
  ministerio = '';

  ngOnInit() {
    this.ministerio = this.route.snapshot.paramMap.get('ministerio') || '';
    this.authService.refreshCurrentUser();
    this.authService.currentUser$.subscribe(user => {
      this.usuario = user;
    });
    this.carregarEscalas();
    this.carregarUsuarios();
  }

  carregarEscalas() {
    this.firestoreService.getEscalas().subscribe(data => {
      this.aplicarEscalas(data);
    });
  }

  private aplicarEscalas(data: any[]) {
    this.todasEscalas = data;
    this.escalas = data
      .filter(e => e['ministerio'] === this.ministerio)
      .sort((a, b) => {
        const cmp = a['data'].localeCompare(b['data']);
        if (cmp !== 0) return cmp;
        const ta = a['turno'] === 'manha' ? 0 : a['turno'] === 'noite' ? 1 : 0;
        const tb = b['turno'] === 'manha' ? 0 : b['turno'] === 'noite' ? 1 : 0;
        return ta - tb;
      });
  }

  carregarUsuarios() {
    this.firestoreService.getUsuarios().subscribe(data => {
      this.usuarios = data;
    });
  }

  formatarTurno(turno?: string): string {
    if (turno === 'manha') return 'Manhã';
    if (turno === 'noite') return 'Noite';
    return '';
  }

  isLiderDe(ministerioNome: string): boolean {
    if (!this.usuario) return false;
    return this.usuario.ministerios?.some(
      m => m.nome && this.normalizar(m.nome) === this.normalizar(ministerioNome) && m.lider
    ) ?? false;
  }

  normalizar(texto: string): string {
    return this.escalaService.normalizar(texto);
  }

  getNomeUsuario(): string {
    return this.usuario?.nome ?? '';
  }

  get isAdmin(): boolean {
    return this.usuario?.admin ?? false;
  }

  participaDoMinisterio(ministerioNome: string): boolean {
    if (!this.usuario) return false;
    return this.usuario.ministerios?.some(
      m => m.nome && this.normalizar(m.nome) === this.normalizar(ministerioNome)
    ) ?? false;
  }

  temPresencaNaEscala(escala: any): boolean {
    if (this.isAdmin) return true;
    if (!this.participaDoMinisterio(escala.ministerio)) return false;
    return true;
  }

  formatarData(dataStr: string): string {
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const nomeDia = dias[data.getDay()];
    return `${nomeDia}, ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
  }

  async criarEscala() {
    const resultado = await this.escalaService.gerarEscalasMinisterio(this.ministerio, this.usuarios, this.todasEscalas);
    if (resultado.mensagem) alert(resultado.mensagem);
    this.carregarEscalas();
  }

  async editarEscala(escala: any) {
    const participantes = this.getParticipantesDoMinisterio(this.ministerio);
    const modal = await this.modalCtrl.create({
      component: EditarEscalaModalComponent,
      componentProps: {
        escala,
        participantes,
        ministerio: this.ministerio,
        funcoesDisponiveis: this.escalaService.funcoesDisponiveis[this.ministerio] || []
      }
    });
    modal.onDidDismiss().then(async (result) => {
      if (!result.data) return;
      const updateData: any = {
        lideres: result.data.lideres,
        membros: result.data.membros,
        funcoes: result.data.funcoes
      };
      if (escala.turno) updateData.turno = escala.turno;
      await this.firestoreService.updateEscala(escala.id, updateData);
      this.carregarEscalas();
    });
    return await modal.present();
  }

  getParticipantesDoMinisterio(ministerio: string): any[] {
    const participantes: any[] = [];
    this.usuarios.forEach(usuario => {
      const ministerios = usuario.ministerios || [];
      const min = ministerios.find((m: any) => this.normalizar(m.nome) === ministerio);
      if (!min) return;
      participantes.push({
        uid: usuario.uid,
        nome: usuario.nome,
        funcoes: (min.funcoes || []).map((f: any) => (typeof f === 'string' ? f : f.nome || f.name || '').trim()).filter((f: string) => f)
      });
    });
    return participantes;
  }

  async excluirEscala(id: string) {
    const dialog = await this.alertCtrl.create({
      header: 'Excluir escala',
      message: 'Deseja excluir essa escala?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: async () => {
            await this.firestoreService.deleteEscala(id);
            this.carregarEscalas();
          }
        }
      ]
    });
    await dialog.present();
  }

  getFuncoes(escala: any): string[] {
    if (!escala || !escala.funcoes) return [];
    const chaves = Object.keys(escala.funcoes).map(k => k.trim());
    const ordem: Record<string, number> = {
      vocal: 0, vocalista: 0,
      backvocal: 1, 'back vocal': 1
    };
    return chaves.sort((a, b) => {
      const na = a.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const nb = b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      return (ordem[na] ?? 99) - (ordem[nb] ?? 99);
    });
  }

  getNomesNaFuncao(escala: any, funcao: string): string[] {
    const funcoes = escala.funcoes || {};
    const funcaoNorm = funcao.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    let nomes: string[] = [];
    for (const key of Object.keys(funcoes)) {
      const keyNorm = key.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (keyNorm === funcaoNorm) {
        nomes = funcoes[key];
        break;
      }
    }
    return nomes;
  }

  formatarNomeMinisterioDe(ministerio: string): string {
    return this.escalaService.formatarNomeMinisterioDe(ministerio);
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

  formatarNomeMinisterio(): string {
    return this.formatarNomeMinisterioDe(this.ministerio);
  }

  getParticipantes(escala: any): string[] {
    return [...(escala.lideres || []), ...(escala.membros || [])];
  }

  getSemFuncao(escala: any): string[] {
    const comFuncao = new Set<string>();
    Object.values(escala.funcoes || {}).forEach((arr: any) => (arr as string[]).forEach(n => comFuncao.add(n)));
    return this.getParticipantes(escala).filter(n => !comFuncao.has(n));
  }

  async logout() {
    await this.authService.logout();
  }
}
