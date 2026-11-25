import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, MenuController, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { AuthService } from '../services/auth';
import { NotificacoesService } from '../services/notificacoes';
import { BiometriaService } from '../services/biometria.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrl: './login.page.scss',
  standalone: false
})
export class LoginPage implements OnInit, ViewWillEnter, ViewWillLeave {

  private authService = inject(AuthService);
  private router = inject(Router);
  private menuCtrl = inject(MenuController);
  private notificacoesService = inject(NotificacoesService);
  private biometriaService = inject(BiometriaService);
  private alertCtrl = inject(AlertController);

  email = '';
  senha = '';
  erro = '';
  carregando = false;
  mostrarSenha = false;

  private readonly STORAGE_ULTIMO_EMAIL = 'app_ultimo_email_login';

  biometriaAtiva = false;
  tipoBiometriaTexto = 'Digital / Face ID';

  async ionViewWillEnter() {
    this.menuCtrl.enable(false);
    this.menuCtrl.close();
    this.senha = ''; // Garante que o campo de senha nunca fique preenchido
    this.carregarUltimoEmail();
    await this.verificarBiometria();
    // Se a biometria já estiver ativa e disponível, podemos iniciar o prompt automaticamente
    if (this.biometriaAtiva) {
      setTimeout(() => {
        this.loginComBiometria();
      }, 400);
    }
  }

  ionViewWillLeave() {
    this.menuCtrl.enable(true);
    this.senha = ''; // Limpa a senha ao sair da tela
  }

  async ngOnInit() {
    this.menuCtrl.enable(false);
    this.senha = '';
    this.carregarUltimoEmail();
    await this.verificarBiometria();
  }

  private carregarUltimoEmail() {
    const salvo = localStorage.getItem(this.STORAGE_ULTIMO_EMAIL);
    if (salvo && !this.email) {
      this.email = salvo;
    }
  }

  private async verificarBiometria() {
    const status = await this.biometriaService.isDisponivel();
    if (status.disponivel && this.biometriaService.isBiometriaHabilitada()) {
      this.biometriaAtiva = true;
      this.tipoBiometriaTexto = status.biometriaTipo;
    } else {
      this.biometriaAtiva = false;
    }
  }

  async loginComBiometria() {
    this.carregando = true;
    this.erro = '';

    try {
      const creds = await this.biometriaService.autenticarComBiometria();
      if (!creds) {
        this.carregando = false;
        return;
      }

      await this.authService.login(creds.email, creds.senha);
      this.notificacoesService.solicitarPermissaoInicial();
      this.router.navigate(['/home']);
    } catch (e: any) {
      console.error('Erro no login biométrico:', e);
      this.erro = 'Falha ao autenticar por biometria. Use e-mail e senha.';
    } finally {
      this.carregando = false;
    }
  }

  async login() {
    if (!this.email || !this.senha) {
      this.erro = 'Preencha email e senha';
      return;
    }

    this.carregando = true;
    this.erro = '';

    const senhaDigitada = this.senha;
    const emailDigitado = this.email;

    try {
      await this.authService.login(emailDigitado, senhaDigitada);
      localStorage.setItem(this.STORAGE_ULTIMO_EMAIL, emailDigitado);
      this.senha = ''; // Limpa da UI
      this.notificacoesService.solicitarPermissaoInicial();

      // Checa se o aparelho suporta biometria e ainda não está habilitada
      const statusBio = await this.biometriaService.isDisponivel();
      if (statusBio.disponivel && !this.biometriaService.isBiometriaHabilitada()) {
        await this.perguntarAtivarBiometria(emailDigitado, senhaDigitada, statusBio.biometriaTipo);
      }

      this.router.navigate(['/home']);
    } catch (e: any) {
      console.error('ERRO LOGIN:', e);
      if (e.code === 'auth/wrong-password') {
        this.erro = 'Senha incorreta';
      } else {
        this.erro = 'Login ou senha incorretos';
      }
    } finally {
      this.carregando = false;
    }
  }

  private perguntarAtivarBiometria(email: string, pass: string, tipo: string): Promise<void> {
    return new Promise(async (resolve) => {
      const alert = await this.alertCtrl.create({
        header: `Ativar ${tipo}`,
        subHeader: 'Acesso Rápido e Seguro',
        message: `Deseja habilitar o login por ${tipo} para entrar rapidamente no app da próxima vez?`,
        backdropDismiss: false,
        buttons: [
          {
            text: 'Agora não',
            role: 'cancel',
            handler: () => resolve()
          },
          {
            text: 'Sim, ativar',
            handler: async () => {
              await this.biometriaService.habilitarBiometria(email, pass);
              resolve();
            }
          }
        ]
      });
      await alert.present();
    });
  }
}