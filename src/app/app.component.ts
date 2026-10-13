import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { AuthService, Usuario } from './services/auth';
import { NotificacoesService } from './services/notificacoes';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private authService = inject(AuthService);
  private notificacoesService = inject(NotificacoesService);
  private router = inject(Router);
  private menuCtrl = inject(MenuController);

  usuario: Usuario | null = null;

  mostrandoSplash = true;
  splashEscondendo = false;

  ngOnInit() {
    this.authService.refreshCurrentUser();
    this.authService.currentUser$.subscribe(user => {
      this.usuario = user;
      if (user) {
        this.notificacoesService.verificarEscalasDeHoje();
      }
    });
    this.mostrarSplashAposSistema();
  }

  private async mostrarSplashAposSistema() {
    if (!Capacitor.isNativePlatform()) {
      this.mostrandoSplash = false;
      return;
    }
    try {
      await SplashScreen.hide();
    } catch {
      // ignora erros fora de plataformas nativas
    }
    setTimeout(() => {
      this.splashEscondendo = true;
      setTimeout(() => {
        this.mostrandoSplash = false;
      }, 600);
    }, 2500);
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get isLeader(): boolean {
    return this.authService.isLeader;
  }

  async abrirMembros() {
    await this.menuCtrl.close();
    this.router.navigate(['/membros']);
  }

  async abrirIndisponibilidades() {
    await this.menuCtrl.close();
    this.router.navigate(['/indisponibilidades']);
  }

  async abrirMensagens() {
    await this.menuCtrl.close();
    this.router.navigate(['/mensagens']);
  }

  async abrirFamilias() {
    await this.menuCtrl.close();
    this.router.navigate(['/familias']);
  }

  async abrirCompartilhar() {
    await this.menuCtrl.close();
    this.router.navigate(['/compartilhar']);
  }

  async abrirMinhasEscalas() {
    await this.menuCtrl.close();
    this.router.navigate(['/minhas-escalas']);
  }

  async abrirEscalasDoDia() {
    await this.menuCtrl.close();
    this.router.navigate(['/escalas-do-dia']);
  }

  async abrirPerfil() {
    await this.menuCtrl.close();
    this.router.navigate(['/perfil']);
  }

  async logout() {
    await this.authService.logout();
  }
}
