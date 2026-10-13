import { Component, inject, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { AuthService, Usuario } from '../services/auth';
import { EscalaService } from '../services/escala.service';
import { FirestoreService } from '../services/firestore';

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

  usuario: Usuario | null = null;
  usuarios: any[] = [];

  ngOnInit() {
    this.authService.refreshCurrentUser();
    this.authService.currentUser$.subscribe(user => {
      this.usuario = user;
    });
    this.firestoreService.getUsuarios().subscribe(data => {
      this.usuarios = data;
    });
  }

  contagemMembros(ministerio: string): number {
    return this.usuarios.filter(u =>
      (u.ministerios || []).some((m: any) => m.nome && this.normalizar(m.nome) === this.normalizar(ministerio))
    ).length;
  }

  async criarTodasEscalas() {
    const resultado = await this.escalaService.criarTodasEscalas();
    if (resultado.total === 0) {
      alert('Todas as escalas do mes ja foram criadas para todos os ministerios.');
      return;
    }
    alert(`Todas as escalas do mes geradas!\n\nTotal: ${resultado.total} escala(s) criada(s)\n\n` + resultado.detalhes.map(d => '• ' + d).join('\n'));
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
            await this.firestoreService.deleteAllEscalas();
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
