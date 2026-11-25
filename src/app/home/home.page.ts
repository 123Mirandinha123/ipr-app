import { Component, inject, OnInit } from '@angular/core';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { AuthService, Usuario } from '../services/auth';
import { EscalaService } from '../services/escala.service';
import { FirestoreService } from '../services/firestore';
import { NotificacoesService } from '../services/notificacoes';
import { ResultadoEscalasModalComponent } from '../componentes/resultado-escalas-modal/resultado-escalas-modal.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrl: './home.page.scss',
  standalone: false
})
export class HomePage implements OnInit {

  authService = inject(AuthService);
  private escalaService = inject(EscalaService);
  private firestoreService = inject(FirestoreService);
  private alertCtrl = inject(AlertController);
  private loadingCtrl = inject(LoadingController);
  private modalCtrl = inject(ModalController);
  private notificacoesService = inject(NotificacoesService);

  usuario: Usuario | null = null;
  usuarios: any[] = [];
  escalas: any[] = [];

  readonly definicoesDeptos = [
    { chave: 'louvor', nome: 'Louvor', icone: 'mic-outline', gradiente: 'linear-gradient(135deg, #8b5cf6, #6366f1)', sombra: '0 4px 12px rgba(139, 92, 246, 0.35)' },
    { chave: 'sonoplastia', nome: 'Sonoplastia', icone: 'options-outline', gradiente: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', sombra: '0 4px 12px rgba(59, 130, 246, 0.35)' },
    { chave: 'renoshow', nome: 'RenoShow', icone: 'videocam-outline', gradiente: 'linear-gradient(135deg, #a855f7, #7c3aed)', sombra: '0 4px 12px rgba(168, 85, 247, 0.35)' },
    { chave: 'midia', nome: 'Mídia', icone: 'phone-portrait-outline', gradiente: 'linear-gradient(135deg, #06b6d4, #0284c7)', sombra: '0 4px 12px rgba(6, 182, 212, 0.35)' },
    { chave: 'maternal', nome: 'Maternal', icone: 'heart-outline', gradiente: 'linear-gradient(135deg, #f59e0b, #d97706)', sombra: '0 4px 12px rgba(245, 158, 11, 0.35)' },
    { chave: '4a6', nome: '4 à 6', icone: 'color-palette-outline', gradiente: 'linear-gradient(135deg, #fb923c, #ea580c)', sombra: '0 4px 12px rgba(251, 146, 60, 0.35)' },
    { chave: '7a10', nome: '7 à 10', icone: 'book-outline', gradiente: 'linear-gradient(135deg, #84cc16, #65a30d)', sombra: '0 4px 12px rgba(132, 204, 22, 0.35)' },
    { chave: 'juniores', nome: 'Juniores', icone: 'people-outline', gradiente: 'linear-gradient(135deg, #10b981, #059669)', sombra: '0 4px 12px rgba(16, 185, 129, 0.35)' },
    { chave: 'adolescentes', nome: 'Adolescentes', icone: 'flash-outline', gradiente: 'linear-gradient(135deg, #6366f1, #4338ca)', sombra: '0 4px 12px rgba(99, 102, 241, 0.35)' },
    { chave: 'diaconos', nome: 'Diáconos', icone: 'hand-left-outline', gradiente: 'linear-gradient(135deg, #eab308, #ca8a04)', sombra: '0 4px 12px rgba(234, 179, 8, 0.35)' }
  ];

  ngOnInit() {
    this.authService.refreshCurrentUser();
    this.authService.currentUser$.subscribe(user => {
      this.usuario = user;
    });
    this.firestoreService.getUsuarios().subscribe(data => {
      this.usuarios = data;
    });
    this.firestoreService.getEscalas().subscribe(data => {
      this.escalas = data;
    });
  }

  blurActiveElement() {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  get departamentosVisiveis() {
    return this.definicoesDeptos.filter(d => this.participaDoMinisterio(d.chave) || this.authService.isAdmin).map(d => {
      const qtdMembros = this.contagemMembros(d.chave);
      const qtdEscalas = this.escalas.filter(e => this.normalizar(e.ministerio) === this.normalizar(d.chave)).length;
      return {
        ...d,
        qtdMembros,
        qtdEscalas
      };
    });
  }

  contagemMembros(ministerio: string): number {
    return this.usuarios.filter(u =>
      (u.ministerios || []).some((m: any) => m.nome && this.normalizar(m.nome) === this.normalizar(ministerio))
    ).length;
  }

  async criarTodasEscalas() {
    const loading = await this.loadingCtrl.create({
      message: 'Gerando todas as escalas do mês...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      const resultado = await this.escalaService.criarTodasEscalas();
      await loading.dismiss();

      if (resultado.total === 0) {
        const modal = await this.modalCtrl.create({
          component: ResultadoEscalasModalComponent,
          componentProps: {
            titulo: 'Escalas do Mês',
            subtitulo: 'Tudo Atualizado',
            total: 0,
            mensagemSimples: 'Todas as escalas do mês já haviam sido criadas para todos os ministérios.'
          },
          cssClass: 'modal-resultado-escalas'
        });
        await modal.present();
        return;
      }

      this.notificacoesService.notificarEscalasCriadas();

      const modal = await this.modalCtrl.create({
        component: ResultadoEscalasModalComponent,
        componentProps: {
          titulo: 'Escalas Geradas',
          subtitulo: 'Mês Atualizado com Sucesso',
          total: resultado.total,
          detalhes: resultado.detalhes
        },
        cssClass: 'modal-resultado-escalas'
      });
      await modal.present();
    } catch (e) {
      await loading.dismiss();
      console.error('Erro ao gerar escalas:', e);
      const modal = await this.modalCtrl.create({
        component: ResultadoEscalasModalComponent,
        componentProps: {
          titulo: 'Atenção',
          subtitulo: 'Erro na Criação',
          total: 0,
          mensagemSimples: 'Ocorreu um erro ao gerar as escalas do mês.'
        },
        cssClass: 'modal-resultado-escalas'
      });
      await modal.present();
    }
  }

  async excluirTodasEscalas() {
    const dialog = await this.alertCtrl.create({
      header: 'Excluir todas as escalas',
      message: 'Deseja excluir TODAS as escalas de todos os ministérios? Essa ação não pode ser desfeita.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir tudo',
          role: 'destructive',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Excluindo todas as escalas...',
              spinner: 'crescent'
            });
            await loading.present();
            try {
              await this.firestoreService.deleteAllEscalas();
            } finally {
              await loading.dismiss();
            }
          }
        }
      ]
    });
    await dialog.present();
  }

  participaDoMinisterio(ministerioNome: string): boolean {
    if (!this.usuario) return false;
    return this.usuario.ministerios?.some(
      m => m.nome && this.normalizar(m.nome) === this.normalizar(ministerioNome)
    ) ?? false;
  }

  private normalizar(texto: string): string {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
  }

  getNomeUsuario(): string {
    return this.usuario?.nome ?? '';
  }


}
