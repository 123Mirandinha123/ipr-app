import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ToastController, LoadingController, AlertController } from '@ionic/angular';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { Usuario } from '../../services/auth';
import { BiometriaService } from '../../services/biometria.service';

@Component({
  selector: 'app-seguranca-modal',
  templateUrl: './seguranca-modal.component.html',
  styleUrls: ['./seguranca-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class SegurancaModalComponent implements OnInit {
  private modalCtrl = inject(ModalController);
  private toastCtrl = inject(ToastController);
  private loadingCtrl = inject(LoadingController);
  private alertCtrl = inject(AlertController);
  private biometriaService = inject(BiometriaService);
  private auth = inject(Auth);

  @Input() usuario: Usuario | null = null;
  @Input() isAdmin: boolean = false;
  @Input() isLeader: boolean = false;

  biometriaDisponivel = false;
  biometriaAtiva = false;
  tipoBiometria = 'Digital / Face ID';

  async ngOnInit() {
    const status = await this.biometriaService.isDisponivel();
    this.biometriaDisponivel = status.disponivel;
    this.tipoBiometria = status.biometriaTipo;
    this.biometriaAtiva = this.biometriaService.isBiometriaHabilitada();
  }

  async toggleBiometria(event: any) {
    const ativar = !!event.detail.checked;
    if (ativar) {
      const alert = await this.alertCtrl.create({
        header: `Ativar ${this.tipoBiometria}`,
        subHeader: 'Confirmação',
        message: 'Para ativar o acesso biométrico, confirme sua senha atual:',
        inputs: [
          {
            name: 'senha',
            type: 'password',
            placeholder: 'Sua senha atual'
          }
        ],
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => {
              this.biometriaAtiva = false;
            }
          },
          {
            text: 'Confirmar',
            handler: async (data) => {
              const pass = (data.senha || '').trim();
              if (!pass) {
                this.biometriaAtiva = false;
                return false;
              }
              const ok = await this.biometriaService.habilitarBiometria(this.usuario?.email || '', pass);
              this.biometriaAtiva = ok;
              const toast = await this.toastCtrl.create({
                message: ok ? 'Biometria ativada com sucesso!' : 'Não foi possível validar a biometria.',
                duration: 3000,
                color: ok ? 'success' : 'danger'
              });
              await toast.present();
              return true;
            }
          }
        ]
      });
      await alert.present();
    } else {
      await this.biometriaService.desabilitarBiometria();
      this.biometriaAtiva = false;
      const toast = await this.toastCtrl.create({
        message: 'Biometria desativada neste aparelho.',
        duration: 2500,
        color: 'warning'
      });
      await toast.present();
    }
  }

  fechar() {
    this.modalCtrl.dismiss();
  }

  async confirmarRedefinirSenha() {
    if (!this.usuario?.email) return;

    const alert = await this.alertCtrl.create({
      header: 'Trocar Senha',
      subHeader: 'Confirmação',
      message: `Tem certeza que deseja trocar sua senha? Enviaremos um link de redefinição para ${this.usuario.email}.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Sim, enviar link',
          handler: () => {
            this.redefinirSenha();
          }
        }
      ]
    });

    await alert.present();
  }

  private async redefinirSenha() {
    if (!this.usuario?.email) return;

    const loading = await this.loadingCtrl.create({
      message: 'Enviando e-mail de redefinição...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      await sendPasswordResetEmail(this.auth, this.usuario.email);
      await loading.dismiss();

      const toast = await this.toastCtrl.create({
        message: `E-mail de redefinição enviado para ${this.usuario.email}! Verifique sua caixa de entrada e spam.`,
        duration: 4000,
        color: 'success'
      });
      await toast.present();
    } catch (e: any) {
      await loading.dismiss();
      console.error('Erro ao enviar reset de senha:', e);
      const toast = await this.toastCtrl.create({
        message: 'Não foi possível enviar o e-mail: ' + (e?.message || 'erro desconhecido'),
        duration: 3500,
        color: 'danger'
      });
      await toast.present();
    }
  }
}
