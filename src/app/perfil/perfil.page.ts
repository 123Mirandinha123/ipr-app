import { Component, inject, OnInit } from '@angular/core';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { Auth, updateProfile, updateEmail } from '@angular/fire/auth';
import { AuthService, Usuario } from '../services/auth';
import { FirestoreService } from '../services/firestore';
import { NotificacoesService } from '../services/notificacoes';
import { firstValueFrom } from 'rxjs';
import { SobreModalComponent } from './modais/sobre-modal.component';
import { SegurancaModalComponent } from './modais/seguranca-modal.component';

@Component({
  selector: 'app-perfil',
  templateUrl: 'perfil.page.html',
  styleUrls: ['perfil.page.scss'],
  standalone: false
})
export class PerfilPage implements OnInit {

  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private loadingCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private modalCtrl = inject(ModalController);
  private alertCtrl = inject(AlertController);
  private notificacoesService = inject(NotificacoesService);
  private auth = inject(Auth);

  grupoFamiliarNome: string = 'Nenhum';
  notificacoesAtivas: boolean = true;

  get usuario(): Usuario | null {
    return this.authService.currentUser;
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get isLeader(): boolean {
    return this.authService.isLeader;
  }

  async ngOnInit() {
    this.notificacoesAtivas = this.notificacoesService.isNotificacoesAtivas();
    await this.carregarGrupoFamiliar();
  }

  async aoMudarNotificacoes(event: any) {
    const ativas = !!event.detail.checked;
    this.notificacoesAtivas = ativas;
    this.notificacoesService.setNotificacoesAtivas(ativas);

    if (ativas) {
      await this.notificacoesService.solicitarPermissaoInicial();
      this.mostrarToast('Notificações ativadas!', 'success');
    } else {
      this.mostrarToast('Notificações desativadas.', 'warning');
    }
  }

  async carregarGrupoFamiliar() {
    if (!this.usuario) return;
    try {
      const familias = await firstValueFrom(this.firestoreService.getFamilias());
      if (familias) {
        const uid = this.usuario.uid;
        const minhaFamilia = familias.find(f => {
          const membros = f.membros || [];
          return membros.some((m: any) => {
            if (typeof m === 'string') return m === uid;
            return m?.uid === uid;
          });
        });
        if (minhaFamilia && minhaFamilia.nome) {
          this.grupoFamiliarNome = minhaFamilia.nome;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar família do usuário', e);
    }
  }

  formatarMinisterio(nome: string): string {
    const mapa: Record<string, string> = {
      maternal: 'Maternal',
      '4a6': '4 à 6',
      '7a10': '7 à 10',
      juniores: 'Juniores',
      adolescentes: 'Adolescentes',
      sonoplastia: 'Sonoplastia',
      diaconos: 'Diáconos',
      louvor: 'Louvor',
      midia: 'Mídia',
      renoshow: 'RenoShow'
    };
    return mapa[nome] || nome;
  }

  async logout() {
    await this.authService.logout();
  }

  async abrirSobre() {
    const modal = await this.modalCtrl.create({
      component: SobreModalComponent,
      cssClass: 'modal-resultado-escalas'
    });
    await modal.present();
  }

  async abrirSeguranca() {
    const modal = await this.modalCtrl.create({
      component: SegurancaModalComponent,
      componentProps: {
        usuario: this.usuario,
        isAdmin: this.isAdmin,
        isLeader: this.isLeader
      },
      cssClass: 'modal-resultado-escalas'
    });
    await modal.present();
  }

  async editarNome() {
    if (!this.usuario) return;

    const alert = await this.alertCtrl.create({
      header: 'Alterar Nome',
      subHeader: 'Digite seu novo nome completo',
      inputs: [
        {
          name: 'novoNome',
          type: 'text',
          placeholder: 'Nome completo',
          value: this.usuario.nome
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salvar',
          handler: (data) => {
            const nome = (data.novoNome || '').trim();
            if (!nome) {
              this.mostrarToast('O nome não pode ficar em branco.', 'warning');
              return false;
            }
            if (nome === this.usuario?.nome) return true;
            this.salvarNovoNome(nome);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  private async salvarNovoNome(nome: string) {
    if (!this.usuario) return;

    const loading = await this.loadingCtrl.create({
      message: 'Atualizando nome...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      if (this.auth.currentUser) {
        await updateProfile(this.auth.currentUser, { displayName: nome });
      }
      await this.firestoreService.updateUsuario(this.usuario.uid, { nome });
      await this.authService.refreshCurrentUser();
      await loading.dismiss();
      this.mostrarToast('Nome atualizado com sucesso!', 'success');
    } catch (e: any) {
      await loading.dismiss();
      console.error('Erro ao atualizar nome:', e);
      this.mostrarToast('Erro ao atualizar o nome: ' + (e?.message || 'erro desconhecido'), 'danger');
    }
  }

  async editarEmail() {
    if (!this.usuario) return;

    const alert = await this.alertCtrl.create({
      header: 'Alterar E-mail',
      subHeader: 'Digite seu novo endereço de e-mail',
      inputs: [
        {
          name: 'novoEmail',
          type: 'email',
          placeholder: 'seu@email.com',
          value: this.usuario.email
        }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Continuar',
          handler: (data) => {
            const email = (data.novoEmail || '').trim().toLowerCase();
            if (!email || !email.includes('@')) {
              this.mostrarToast('Por favor, digite um e-mail válido.', 'warning');
              return false;
            }
            if (email === this.usuario?.email) return true;
            this.confirmarTrocaEmail(email);
            return true;
          }
        }
      ]
    });

    await alert.present();
  }

  private async confirmarTrocaEmail(novoEmail: string) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar E-mail',
      subHeader: 'Atenção',
      message: `Tem certeza que deseja trocar o email para ${novoEmail}?\n\nVocê deverá utilizar este novo e-mail para fazer login no aplicativo.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Sim, trocar e-mail',
          handler: () => {
            this.salvarNovoEmail(novoEmail);
          }
        }
      ]
    });

    await alert.present();
  }

  private async salvarNovoEmail(novoEmail: string) {
    if (!this.usuario) return;

    const loading = await this.loadingCtrl.create({
      message: 'Atualizando e-mail...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      if (this.auth.currentUser) {
        await updateEmail(this.auth.currentUser, novoEmail);
      }
      await this.firestoreService.updateUsuario(this.usuario.uid, { email: novoEmail });
      await this.authService.refreshCurrentUser();
      await loading.dismiss();
      this.mostrarToast('E-mail atualizado com sucesso!', 'success');
    } catch (e: any) {
      await loading.dismiss();
      console.error('Erro ao atualizar e-mail:', e);
      if (e?.code === 'auth/requires-recent-login') {
        this.mostrarToast('Por segurança, faça login novamente antes de alterar seu e-mail.', 'warning');
      } else {
        this.mostrarToast('Erro ao atualizar o e-mail: ' + (e?.message || 'erro desconhecido'), 'danger');
      }
    }
  }

  private async mostrarToast(mensagem: string, cor: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message: mensagem,
      duration: 3500,
      color: cor
    });
    await toast.present();
  }

  async onFileSelected(event: any) {
    const file = event.target.files?.[0];
    if (!file || !this.usuario) return;

    const loading = await this.loadingCtrl.create({
      message: 'Salvando foto...'
    });
    await loading.present();

    try {
      const base64Foto = await this.comprimirImagem(file, 256, 256);
      await this.firestoreService.updateUsuario(this.usuario.uid, { foto: base64Foto });
      await this.authService.refreshCurrentUser();

      const toast = await this.toastCtrl.create({
        message: 'Foto de perfil atualizada com sucesso!',
        duration: 2500,
        color: 'success'
      });
      await toast.present();
    } catch (e: any) {
      console.error('Erro ao atualizar foto', e);
      const toast = await this.toastCtrl.create({
        message: 'Erro ao salvar a foto: ' + (e?.message || 'Erro desconhecido'),
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      await loading.dismiss();
      event.target.value = '';
    }
  }

  private comprimirImagem(file: File, maxWidth: number, maxHeight: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event: any) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Crop quadrado centralizado
          const minDim = Math.min(width, height);
          const startX = (width - minDim) / 2;
          const startY = (height - minDim) / 2;

          canvas.width = maxWidth;
          canvas.height = maxHeight;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(img.src);
            return;
          }

          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, maxWidth, maxHeight);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        };
        img.onerror = error => reject(error);
      };
      reader.onerror = error => reject(error);
    });
  }
}
