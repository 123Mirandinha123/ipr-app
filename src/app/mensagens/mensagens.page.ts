import { Component, inject, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth';
import { FirestoreService } from '../services/firestore';

@Component({
  selector: 'app-mensagens',
  templateUrl: 'mensagens.page.html',
  styleUrls: ['mensagens.page.scss'],
  standalone: false
})
export class MensagensPage implements OnInit {

  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);

  mensagens: { nome: string; ministerio: string; data: string; turno?: string; motivo: string }[] = [];

  async ngOnInit() {
    const user = this.authService.currentUser;
    if (!user) return;

    const ministeriosLider = (user.ministerios || [])
      .filter(m => m.lider)
      .map(m => this.normalizar(m.nome));

    const usuarios = await firstValueFrom(this.firestoreService.getUsuarios());
    if (!usuarios) return;

    const todas: any[] = [];
    for (const u of usuarios) {
      const indisps = (u as any)['indisponibilidades'] || [];
      for (const ind of indisps) {
        const minNome = this.normalizar(ind.ministerio);
        if (user.admin || ministeriosLider.includes(minNome)) {
          todas.push({
            nome: (u as any)['nome'] || 'Sem nome',
            ministerio: ind.ministerio,
            data: ind.data,
            turno: ind.turno,
            motivo: ind.motivo || ''
          });
        }
      }
    }

    todas.sort((a, b) => a.data.localeCompare(b.data));
    this.mensagens = todas;
  }

  private normalizar(texto: string): string {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
  }

  formatarData(dataStr: string): string {
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const nomeDia = dias[data.getDay()];
    return `${nomeDia}, ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
  }
}
