import { Component, inject } from '@angular/core';
import { AuthService, Usuario } from '../services/auth';

@Component({
  selector: 'app-perfil',
  templateUrl: 'perfil.page.html',
  styleUrls: ['perfil.page.scss'],
  standalone: false
})
export class PerfilPage {

  private authService = inject(AuthService);

  get usuario(): Usuario | null {
    return this.authService.currentUser;
  }

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get isLeader(): boolean {
    return this.authService.isLeader;
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
}
