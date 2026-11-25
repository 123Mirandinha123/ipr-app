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

  private readonly idEscalaHojeBase = 1000;
  private readonly idEscalasCriadas = 2001;
  private readonly idIndisponibilidade = 3001;
  private readonly horarioCulto = { hora: 19, minuto: 30 };
  private readonly STORAGE_PREF_NOTIF = 'app_notificacoes_habilitadas';

  /**
   * Checa se o usuário ativou ou desativou notificações no perfil
   */
  isNotificacoesAtivas(): boolean {
    const pref = localStorage.getItem(this.STORAGE_PREF_NOTIF);
    return pref !== null ? pref === 'true' : true;
  }

  setNotificacoesAtivas(ativas: boolean) {
    localStorage.setItem(this.STORAGE_PREF_NOTIF, String(ativas));
  }

  /**
   * Solicita a permissão do sistema operacional logo após o login
   */
  async solicitarPermissaoInicial(): Promise<boolean> {
    if (!this.isNotificacoesAtivas()) return false;
    return await this.requisitarPermissao();
  }

  private async requisitarPermissao(): Promise<boolean> {
    try {
      let check = await LocalNotifications.checkPermissions();
      if (check.display !== 'granted') {
        const req = await LocalNotifications.requestPermissions();
        return req.display === 'granted';
      }
      return true;
    } catch (e) {
      console.warn('Erro ao verificar/solicitar permissão de notificações:', e);
      return false;
    }
  }

  /**
   * Notificação 1: "As escalas foram criadas"
   */
  async notificarEscalasCriadas(ministerio?: string) {
    if (!this.isNotificacoesAtivas()) return;
    try {
      const temPermissao = await this.requisitarPermissao();
      if (!temPermissao) return;

      const bodyTexto = ministerio 
        ? `As escalas foram criadas (${ministerio})`
        : 'As escalas foram criadas';

      await LocalNotifications.schedule({
        notifications: [{
          id: this.idEscalasCriadas + Math.floor(Math.random() * 900),
          title: 'Escalas Atualizadas',
          body: bodyTexto,
          smallIcon: 'ic_stat_notification',
          iconColor: '#0284c7'
        }]
      });
    } catch (e) {
      console.error('Erro ao notificar escalas criadas:', e);
    }
  }

  /**
   * Notificação 2: "Voce esta hoje na escala (nome do ministerio)"
   */
  async verificarEscalasDeHoje() {
    if (!this.isNotificacoesAtivas()) return;
    try {
      const user = this.authService.currentUser;
      if (!user || !user.nome) return;

      const nomeLower = user.nome.trim().toLowerCase();
      const dataStr = this.formatarData(new Date());

      const escalas = await firstValueFrom(this.firestoreService.getEscalas());
      if (!escalas || escalas.length === 0) return;

      // Filtrar todas as escalas de hoje em que o usuário está presente
      const escalasHojeDoUsuario = escalas.filter(e =>
        e['data'] === dataStr && this.estaNaEscala(e, nomeLower)
      );

      if (escalasHojeDoUsuario.length === 0) return;

      const temPermissao = await this.requisitarPermissao();
      if (!temPermissao) return;

      let offset = 0;
      for (const esc of escalasHojeDoUsuario) {
        const nomeMin = esc['ministerio'] || 'Ministério';
        const bodyTexto = `Voce esta hoje na escala (${nomeMin})`;

        await LocalNotifications.schedule({
          notifications: [{
            id: this.idEscalaHojeBase + offset,
            title: 'Escala de Hoje',
            body: bodyTexto,
            smallIcon: 'ic_stat_notification',
            iconColor: '#0284c7'
          }]
        });
        offset++;
      }
    } catch (e) {
      console.error('Erro ao verificar escalas de hoje:', e);
    }
  }

  /**
   * Notificação 3: "mensagem de indisponibilidade recebida"
   */
  async notificarIndisponibilidadeRecebida(nomeMembro?: string, ministerio?: string) {
    if (!this.isNotificacoesAtivas()) return;
    try {
      const temPermissao = await this.requisitarPermissao();
      if (!temPermissao) return;

      let bodyTexto = 'mensagem de indisponibilidade recebida';
      if (nomeMembro && ministerio) {
        bodyTexto = `mensagem de indisponibilidade recebida: ${nomeMembro} (${ministerio})`;
      } else if (nomeMembro) {
        bodyTexto = `mensagem de indisponibilidade recebida de ${nomeMembro}`;
      }

      await LocalNotifications.schedule({
        notifications: [{
          id: this.idIndisponibilidade + Math.floor(Math.random() * 900),
          title: 'Indisponibilidade',
          body: bodyTexto,
          smallIcon: 'ic_stat_notification',
          iconColor: '#0284c7'
        }]
      });
    } catch (e) {
      console.error('Erro ao notificar indisponibilidade:', e);
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
