import { Component, inject, OnInit } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { FirestoreService } from '../services/firestore';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-familias',
  templateUrl: 'familias.page.html',
  styleUrls: ['familias.page.scss'],
  standalone: false
})
export class FamiliasPage implements OnInit {

  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private alertCtrl = inject(AlertController);

  familias: any[] = [];
  usuarios: any[] = [];

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get isLeader(): boolean {
    return this.authService.isLeader;
  }

  get podeGerenciar(): boolean {
    return this.isAdmin || this.isLeader;
  }

  async ngOnInit() {
    await this.carregarDados();
  }

  private async carregarDados() {
    this.firestoreService.getFamilias().subscribe(data => {
      this.familias = data;
    });
    this.firestoreService.getUsuarios().subscribe(data => {
      this.usuarios = data;
    });
  }

  getNomeMembro(uid: string): string {
    const u = this.usuarios.find(x => x.uid === uid);
    return u ? u.nome : uid;
  }

  getDisponiveis(familia: any): any[] {
    const membros = new Set(familia.membros || []);
    return this.usuarios.filter(u => !membros.has(u.uid));
  }

  async novaFamilia() {
    const dialog = await this.alertCtrl.create({
      header: 'Nova família',
      inputs: [
        { name: 'nome', type: 'text', placeholder: 'Nome da família' }
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Criar',
          handler: async (valores: any) => {
            const nome = (valores?.nome ?? '').toString().trim();
            if (!nome) return;
            try {
              await this.firestoreService.addFamilia(nome);
              await this.carregarDados();
            } catch (e: any) {
              alert('Erro ao criar a família: ' + (e?.message || 'erro desconhecido'));
            }
          }
        }
      ]
    });
    await dialog.present();
  }

  async renomearFamilia(familia: any, nome: any) {
    const novo = (nome ?? '').toString().trim();
    if (!novo || novo === familia.nome) return;
    await this.firestoreService.updateFamilia(familia.id, { nome: novo });
  }

  async adicionarMembro(familia: any, uid: string) {
    if (!uid) return;
    const membros = familia.membros || [];
    if (membros.includes(uid)) return;
    await this.firestoreService.updateFamilia(familia.id, { membros: [...membros, uid] });
    await this.carregarDados();
  }

  async removerMembro(familia: any, uid: string) {
    const membros = (familia.membros || []).filter((m: string) => m !== uid);
    await this.firestoreService.updateFamilia(familia.id, { membros });
  }

  async excluirFamilia(familia: any) {
    const dialog = await this.alertCtrl.create({
      header: 'Excluir família',
      message: `Excluir a família "${familia.nome}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: async () => {
            try {
              await this.firestoreService.deleteFamilia(familia.id);
              await this.carregarDados();
            } catch (e: any) {
              alert('Erro ao excluir a família: ' + (e?.message || 'erro desconhecido'));
            }
          }
        }
      ]
    });
    await dialog.present();
  }
}
