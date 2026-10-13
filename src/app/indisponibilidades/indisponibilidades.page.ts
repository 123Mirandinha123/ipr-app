import { Component, inject, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { AuthService } from '../services/auth';
import { FirestoreService } from '../services/firestore';
import { IndisponibilidadeModalComponent } from '../escalas/indisponibilidade-modal.component';

interface MinisterioInfo {
  chave: string;
  nome: string;
  qtd: number;
}

@Component({
  selector: 'app-indisponibilidades',
  templateUrl: 'indisponibilidades.page.html',
  styleUrls: ['indisponibilidades.page.scss'],
  standalone: false
})
export class IndisponibilidadesPage implements OnInit {

  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private modalCtrl = inject(ModalController);

  ministerios: MinisterioInfo[] = [];

  private mapaNomes: Record<string, string> = {
    louvor: 'Louvor', midia: 'Mídia', renoshow: 'RenoShow',
    maternal: 'Maternal', '4a6': '4 à 6', '7a10': '7 à 10',
    juniores: 'Juniores', adolescentes: 'Adolescentes',
    sonoplastia: 'Sonoplastia', diaconos: 'Diáconos'
  };

  ngOnInit() {
    this.authService.refreshCurrentUser();
    this.authService.currentUser$.subscribe(user => {
      if (!user) return;
      const chaves = (user.ministerios || []).map(m => this.normalizar(m.nome)).filter(Boolean);

      this.ministerios = chaves.map(chave => {
        const qtd = (user.indisponibilidades || [])
          .filter(i => this.normalizar(i.ministerio) === chave).length;
        return { chave, nome: this.mapaNomes[chave] || chave, qtd };
      });
    });
  }

  async abrirPorMinisterio(ministerio: string) {
    const user = this.authService.currentUser;
    if (!user) return;

    const minIndisps = (user.indisponibilidades || [])
      .filter(i => this.normalizar(i.ministerio) === ministerio)
      .map(i => ({ data: i.data, turno: i.turno, motivo: i.motivo }));

    const modal = await this.modalCtrl.create({
      component: IndisponibilidadeModalComponent,
      componentProps: { existing: minIndisps }
    });

    modal.onDidDismiss().then(async (result) => {
      if (!result.data) return;
      const items: { data: string; turno?: string }[] = result.data.items;
      const motivo: string = result.data.motivo;

      for (const ind of minIndisps) {
        const stillSelected = items.some(item =>
          item.data === ind.data && (item.turno || '') === (ind.turno || '')
        );
        if (!stillSelected) {
          await this.firestoreService.removeUserIndisponibilidade(
            user.uid, ministerio, ind.data, ind.turno
          );
        }
      }

      for (const item of items) {
        await this.firestoreService.addUserIndisponibilidade(
          user.uid, ministerio, item.data, item.turno, motivo
        );
      }

      await this.authService.refreshCurrentUser();
    });

    return await modal.present();
  }

  private normalizar(texto: string): string {
    return (texto || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '');
  }
}
