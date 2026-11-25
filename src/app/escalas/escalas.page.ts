import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { FirestoreService } from '../services/firestore';
import { EscalaService } from '../services/escala.service';
import { AuthService, Usuario } from '../services/auth';
import { ShareService } from '../services/share.service';
import { NotificacoesService } from '../services/notificacoes';
import { EditarEscalaModalComponent } from './editar-escala-modal.component';
import { ResultadoEscalasModalComponent } from '../componentes/resultado-escalas-modal/resultado-escalas-modal.component';

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
  private loadingCtrl = inject(LoadingController);
  private shareService = inject(ShareService);
  private notificacoesService = inject(NotificacoesService);
  authService = inject(AuthService);

  escalas: any[] = [];
  todasEscalas: any[] = [];
  usuarios: any[] = [];
  usuario: Usuario | null = null;
  ministerio = '';
  carregando = true;

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
    this.carregando = true;
    this.firestoreService.getEscalas().subscribe(data => {
      this.aplicarEscalas(data);
      this.carregando = false;
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
    const loading = await this.loadingCtrl.create({
      message: 'Montando escalas do ministério...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const resultado = await this.escalaService.gerarEscalasMinisterio(this.ministerio, this.usuarios, this.todasEscalas);
      await loading.dismiss();

      const nomeMin = this.ministerio.charAt(0).toUpperCase() + this.ministerio.slice(1);

      if (resultado.criadas > 0) {
        this.notificacoesService.notificarEscalasCriadas(this.ministerio);

        const detalhes: string[] = [];
        if (resultado.funcoesVazias && resultado.funcoesVazias.length > 0) {
          detalhes.push(`Funções sem membros cadastrados: ${resultado.funcoesVazias.join(', ')}`);
        }

        const modal = await this.modalCtrl.create({
          component: ResultadoEscalasModalComponent,
          componentProps: {
            titulo: 'Escala Gerada',
            subtitulo: `Ministério de ${nomeMin}`,
            total: resultado.criadas,
            detalhes
          },
          cssClass: 'modal-resultado-escalas'
        });
        await modal.present();
      } else {
        const modal = await this.modalCtrl.create({
          component: ResultadoEscalasModalComponent,
          componentProps: {
            titulo: 'Aviso de Escala',
            subtitulo: `Ministério de ${nomeMin}`,
            total: 0,
            mensagemSimples: resultado.mensagem || 'Nenhuma nova escala pôde ser criada.'
          },
          cssClass: 'modal-resultado-escalas'
        });
        await modal.present();
      }

      this.carregarEscalas();
    } catch (e) {
      await loading.dismiss();
      console.error('Erro ao gerar escala:', e);
      const modal = await this.modalCtrl.create({
        component: ResultadoEscalasModalComponent,
        componentProps: {
          titulo: 'Atenção',
          subtitulo: 'Erro na Criação',
          total: 0,
          mensagemSimples: 'Ocorreu um erro ao gerar a escala deste ministério.'
        },
        cssClass: 'modal-resultado-escalas'
      });
      await modal.present();
    }
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

      const loading = await this.loadingCtrl.create({
        message: 'Atualizando escala...',
        spinner: 'crescent'
      });
      await loading.present();

      try {
        const updateData: any = {
          lideres: result.data.lideres,
          membros: result.data.membros,
          funcoes: result.data.funcoes
        };
        if (escala.turno) updateData.turno = escala.turno;
        await this.firestoreService.updateEscala(escala.id, updateData);
        this.carregarEscalas();
      } finally {
        await loading.dismiss();
      }
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
            const loading = await this.loadingCtrl.create({
              message: 'Excluindo escala...',
              spinner: 'crescent'
            });
            await loading.present();
            try {
              await this.firestoreService.deleteEscala(id);
              this.carregarEscalas();
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });
    await dialog.present();
  }

  private ordemOficialLouvor: Record<string, number> = {
    vocal: 1,
    vocalista: 1,
    backvocal: 2,
    back: 2,
    guitarrista: 3,
    guitarra: 3,
    baixista: 4,
    baixo: 4,
    baterista: 5,
    bateria: 5,
    tecladista: 6,
    teclado: 6,
    violonista: 7,
    violao: 7,
    vionolista: 7
  };

  getFuncoes(escala: any): string[] {
    if (!escala || !escala.funcoes) return [];
    const chaves = Object.keys(escala.funcoes).map(k => k.trim());
    return chaves.sort((a, b) => {
      const na = this.normalizar(a);
      const nb = this.normalizar(b);
      const pa = this.ordemOficialLouvor[na] ?? 99;
      const pb = this.ordemOficialLouvor[nb] ?? 99;
      if (pa !== pb) return pa - pb;
      return a.localeCompare(b);
    });
  }

  getNomesNaFuncao(escala: any, funcao: string): string[] {
    const funcoes = escala.funcoes || {};
    const funcaoNorm = this.normalizar(funcao);
    let nomes: string[] = [];
    for (const key of Object.keys(funcoes)) {
      const keyNorm = this.normalizar(key);
      if (keyNorm === funcaoNorm) {
        nomes = funcoes[key];
        break;
      }
    }
    return nomes;
  }

  formatarPrimeiraMaiuscula(texto: string): string {
    if (!texto) return '';
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }

  getTotalEscalados(escala: any): number {
    return this.getParticipantes(escala).length;
  }

  getTotalVagas(escala: any): number {
    const minNorm = this.normalizar(escala.ministerio || this.ministerio);
    const esperadas = this.escalaService.funcoesDisponiveis[minNorm] || [];
    if (esperadas.length > 0) {
      return Math.max(esperadas.length, this.getTotalEscalados(escala));
    }
    return this.getTotalEscalados(escala);
  }

  async compartilharEscalaIndividual(escala: any) {
    const dataObj = new Date(escala.data + 'T00:00:00');
    const mes = isNaN(dataObj.getTime()) ? new Date().getMonth() : dataObj.getMonth();
    const ano = isNaN(dataObj.getTime()) ? new Date().getFullYear() : dataObj.getFullYear();
    const texto = this.shareService.gerarTextoMinisterio(
      this.ministerio,
      [escala],
      mes,
      ano
    );
    await this.shareService.compartilhar(`Escala - ${this.formatarNomeMinisterio()}`, texto);
  }

  formatarNomeMinisterioDe(ministerio: string): string {
    return this.escalaService.formatarNomeMinisterioDe(ministerio);
  }

  getFuncoesVagas(escala: any): string[] {
    if (!escala || !escala.ministerio) return [];
    const minNorm = this.normalizar(escala.ministerio);
    const esperadas = this.escalaService.funcoesDisponiveis[minNorm] || [];
    const funcoes = escala.funcoes || {};
    const presentes = new Set<string>();
    Object.keys(funcoes).forEach(k => {
      const nomes = funcoes[k];
      if (Array.isArray(nomes) && nomes.length > 0) {
        presentes.add(this.escalaService.funcaoCanonica2(k));
      }
    });
    return esperadas
      .filter(f => {
        const c = this.escalaService.funcaoCanonica2(f);
        return !!c && !presentes.has(c);
      })
      .sort((a, b) => {
        const na = this.normalizar(a);
        const nb = this.normalizar(b);
        const pa = this.ordemOficialLouvor[na] ?? 99;
        const pb = this.ordemOficialLouvor[nb] ?? 99;
        if (pa !== pb) return pa - pb;
        return a.localeCompare(b);
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
