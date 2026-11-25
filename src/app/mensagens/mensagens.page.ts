import { Component, inject, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth';
import { FirestoreService } from '../services/firestore';

export interface MensagemIndisponibilidade {
  nome: string;
  foto?: string;
  ministerio: string;
  dataOriginal: string;
  dataResumida: string;
  turno?: string;
  motivoTexto: string;
}

@Component({
  selector: 'app-mensagens',
  templateUrl: 'mensagens.page.html',
  styleUrls: ['mensagens.page.scss'],
  standalone: false
})
export class MensagensPage implements OnInit {

  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);

  mensagens: MensagemIndisponibilidade[] = [];
  carregando = true;

  async ngOnInit() {
    await this.carregarMensagens();
  }

  async ionViewWillEnter() {
    await this.carregarMensagens();
  }

  async carregarMensagens() {
    const user = this.authService.currentUser;
    if (!user) {
      this.carregando = false;
      return;
    }

    const ministeriosLider = (user.ministerios || [])
      .filter(m => m.lider)
      .map(m => this.normalizar(m.nome));

    this.carregando = true;
    const usuarios = await firstValueFrom(this.firestoreService.getUsuarios());
    this.carregando = false;
    if (!usuarios) return;
    if (!usuarios) return;

    // Data de corte: data de hoje no formato YYYY-MM-DD
    const agora = new Date();
    const hojeStr = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;

    const todas: MensagemIndisponibilidade[] = [];
    for (const u of usuarios) {
      const indisps = (u as any)['indisponibilidades'] || [];
      const nomeUsuario = (u as any)['nome'] || 'Membro';
      const fotoUsuario = (u as any)['foto'] || '';

      for (const ind of indisps) {
        // REGRA: quando chegar o dia da escala em que a pessoa não pode estar (ou após passar), a mensagem desaparece
        if (!ind.data || ind.data <= hojeStr) {
          continue;
        }

        const minNome = this.normalizar(ind.ministerio);
        if (user.admin || ministeriosLider.includes(minNome)) {
          const motivoBruto = (ind.motivo || '').trim();
          let motivoTexto = motivoBruto;
          if (motivoBruto) {
            // Se o texto já começa com "motivo", não duplica
            if (!motivoBruto.toLowerCase().startsWith('motivo')) {
              motivoTexto = `Motivo: ${motivoBruto}`;
            }
          } else {
            motivoTexto = 'Indisponível para esta data';
          }

          todas.push({
            nome: nomeUsuario,
            foto: fotoUsuario,
            ministerio: ind.ministerio,
            dataOriginal: ind.data,
            dataResumida: this.formatarDataResumida(ind.data),
            turno: ind.turno,
            motivoTexto
          });
        }
      }
    }

    // Ordenar pelas datas mais recentes
    todas.sort((a, b) => a.dataOriginal.localeCompare(b.dataOriginal));
    this.mensagens = todas;
  }

  formatarDataResumida(dataStr: string): string {
    if (!dataStr) return '';
    const [, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}`;
  }

  private normalizar(texto: string): string {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
  }
}
