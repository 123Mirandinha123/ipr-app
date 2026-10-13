import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { LocalNotifications } from '@capacitor/local-notifications';
import { AuthService } from './auth';
import { FirestoreService } from './firestore';

@Injectable({
  providedIn: 'root'
})
export class NotificacoesService {

  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);

  private readonly idEscalaHoje = 1;
  private readonly horarioCulto = { hora: 19, minuto: 30 };

  async verificarEscalasDeHoje() {
    try {
      const user = this.authService.currentUser;
      if (!user || !user.nome) return;

      const nomeLower = user.nome.trim().toLowerCase();
      const dataStr = this.formatarData(new Date());

      const escalas = await firstValueFrom(this.firestoreService.getEscalas());
      if (!escalas) return;

      const temEscalaHoje = escalas.some(e =>
        e['data'] === dataStr && this.estaNaEscala(e, nomeLower)
      );
      if (!temEscalaHoje) return;

      const agora = new Date();
      const culto = new Date(
        agora.getFullYear(), agora.getMonth(), agora.getDate(),
        this.horarioCulto.hora, this.horarioCulto.minuto, 0
      );
      if (agora.getTime() >= culto.getTime()) return;

      const permission = await LocalNotifications.requestPermissions();
      if (permission.display !== 'granted') return;

      await LocalNotifications.schedule({
        notifications: [{
          id: this.idEscalaHoje,
          title: 'Escala de hoje',
          body: 'Você está escalado para o culto hoje às 19h30.',
          schedule: { at: culto }
        }]
      });
    } catch (e) {
      console.error('Notificacao de escala erro:', e);
    }
  }

  private estaNaEscala(escala: any, nomeLower: string): boolean {
    const funcoes: Record<string, string[]> = escala['funcoes'] || {};
    for (const nomes of Object.values(funcoes)) {
      if ((nomes || []).map((n: string) => n.trim().toLowerCase()).includes(nomeLower)) return true;
    }

    const lideres: string[] = (escala['lideres'] || []).map((n: string) => n.trim().toLowerCase());
    if (lideres.includes(nomeLower)) return true;

    const membros: string[] = (escala['membros'] || []).map((n: string) => n.trim().toLowerCase());
    return membros.includes(nomeLower);
  }

  private formatarData(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
