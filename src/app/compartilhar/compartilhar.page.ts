import { Component, inject, OnInit } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth';
import { FirestoreService } from '../services/firestore';
import { EscalaService } from '../services/escala.service';
import { ShareService } from '../services/share.service';

interface GrupoMinisterio {
  ministerio: string;
  nome: string;
  escalas: any[];
}

@Component({
  selector: 'app-compartilhar',
  templateUrl: 'compartilhar.page.html',
  styleUrls: ['compartilhar.page.scss'],
  standalone: false
})
export class CompartilharPage implements OnInit {

  private authService = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private escalaService = inject(EscalaService);
  private shareService = inject(ShareService);

  private mes = new Date().getMonth();
  private ano = new Date().getFullYear();

  grupos: GrupoMinisterio[] = [];
  carregando = true;

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get tituloMes(): string {
    return `${this.shareService.nomeMes(this.mes)}/${this.ano}`;
  }

  async ngOnInit() {
    const user = this.authService.currentUser;
    const todas = await firstValueFrom(this.firestoreService.getEscalas());

    const chaveMes = `${this.ano}-${String(this.mes + 1).padStart(2, '0')}`;
    const doMes = (todas || []).filter(e => String(e['data'] || '').startsWith(chaveMes));

    let permitidos: string[] | null = null;
    if (!this.authService.isAdmin) {
      permitidos = (user?.ministerios || [])
        .filter((m: any) => m.lider)
        .map((m: any) => this.escalaService.normalizar(m.nome));
    }

    const mapa = new Map<string, any[]>();
    doMes.forEach(e => {
      const ministerio = this.escalaService.normalizar(e['ministerio'] || '');
      if (!ministerio) return;
      if (permitidos && !permitidos.includes(ministerio)) return;
      if (!mapa.has(ministerio)) mapa.set(ministerio, []);
      mapa.get(ministerio)!.push(e);
    });

    const ordemChaves = Object.keys(this.escalaService.funcoesDisponiveis);
    this.grupos = Array.from(mapa.entries())
      .sort((a, b) => {
        const ia = ordemChaves.indexOf(a[0]);
        const ib = ordemChaves.indexOf(b[0]);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      })
      .map(([ministerio, escalas]) => ({
        ministerio,
        nome: this.escalaService.formatarNomeMinisterioDe(ministerio),
        escalas
      }));

    this.carregando = false;
  }

  async compartilharMinisterio(grupo: GrupoMinisterio) {
    const texto = this.shareService.gerarTextoMinisterio(grupo.ministerio, grupo.escalas, this.mes, this.ano);
    await this.shareService.compartilhar(`Escalas - ${grupo.nome}`, texto);
  }

  async compartilharTudo() {
    const texto = this.shareService.gerarTextoTudo(
      this.grupos.map(g => ({ ministerio: g.ministerio, escalas: g.escalas })),
      this.mes,
      this.ano
    );
    await this.shareService.compartilhar('Escalas do mês', texto);
  }
}
