import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { FirestoreService } from '../services/firestore';
import { AuthService, Usuario } from '../services/auth';
import { firebaseConfig } from '../../environments/firebase-config';
import { environment } from '../../environments/environment';

interface MinisterioInfo {
  chave: string;
  nome: string;
  qtd: number;
}

@Component({
  selector: 'app-membros',
  templateUrl: 'membros.page.html',
  styleUrls: ['membros.page.scss'],
  standalone: false
})
export class MembrosPage implements OnInit {

  private firestoreService = inject(FirestoreService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private alertCtrl = inject(AlertController);

  usuarios: any[] = [];
  ministeriosDoLider: string[] = [];
  ministerioFilter = '';
  showModal = false;
  editando = false;
  editId = '';

  novoNome = '';
  novoEmail = '';
  novaSenha = '';

  view: 'list' | 'members' = 'list';
  ministerios: MinisterioInfo[] = [];

  private mapaNomes: Record<string, string> = {
    louvor: 'Louvor', midia: 'Mídia', renoshow: 'RenoShow',
    maternal: 'Maternal', '4a6': '4 a 6', '7a10': '7 a 10',
    juniores: 'Juniores', adolescentes: 'Adolescentes',
    sonoplastia: 'Sonoplastia', diaconos: 'Diáconos'
  };

  private todosMinisterios = Object.keys(this.mapaNomes);

  ministeriosDisponiveis = ['louvor', 'midia', 'renoshow', 'maternal', '4a6', '7a10', 'juniores', 'adolescentes', 'sonoplastia', 'diaconos'];
  funcoesDisponiveis: Record<string, string[]> = {
    louvor: ['vocal', 'back vocal', 'guitarrista', 'baixista', 'baterista', 'tecladista', 'vionolista'],
    midia: ['mídia'],
    renoshow: ['renoshow'],
    maternal: ['professor', 'auxiliar'],
    '4a6': ['professor', 'auxiliar'],
    '7a10': ['professor'],
    juniores: ['professor'],
    adolescentes: ['professor'],
    sonoplastia: ['sonoplasta'],
    diaconos: ['diacono']
  };

  ministeriosForm: {
    nome: string;
    lider: boolean;
    funcoes: string[];
  }[] = [];

  ngOnInit() {
    this.ministerioFilter = this.route.snapshot.queryParamMap.get('ministerio') || '';
    this.view = this.ministerioFilter ? 'members' : 'list';
    this.authService.refreshCurrentUser();
    this.authService.currentUser$.subscribe(user => {
      if (!user) return;
      this.ministeriosDoLider = (user.ministerios || [])
        .filter((m: any) => m.lider)
        .map((m: any) => this.normalizarMinisterio(m.nome));
      if (user.admin) {
        this.ministeriosDisponiveis = this.todosMinisterios;
      } else {
        this.ministeriosDisponiveis = this.ministeriosDoLider;
      }
      this.carregarUsuarios();
    });
  }

  carregarUsuarios() {
    this.firestoreService.getUsuarios().subscribe(data => {
      const chaves = this.authService.isAdmin
        ? this.todosMinisterios
        : this.ministeriosDoLider;

      this.ministerios = chaves.map(chave => {
        const qtd = data.filter(u =>
          (u['ministerios'] || []).some((m: any) =>
            this.normalizarMinisterio(m['nome']) === chave
          )
        ).length;
        return { chave, nome: this.mapaNomes[chave] || chave, qtd };
      });

      let filtered = data;
      if (this.ministerioFilter) {
        filtered = data.filter(u =>
          (u['ministerios'] || []).some((m: any) =>
            this.normalizarMinisterio(m['nome']) === this.ministerioFilter
          )
        );
      } else if (!this.authService.isAdmin) {
        filtered = data.filter(u =>
          (u['ministerios'] || []).some((m: any) => {
            const nomeNorm = this.normalizarMinisterio(m['nome']);
            return this.ministeriosDoLider.includes(nomeNorm);
          })
        );
      }
      this.usuarios = filtered;
    });
  }

  abrirPorMinisterio(chave: string) {
    this.ministerioFilter = chave;
    this.view = 'members';
    this.carregarUsuarios();
  }

  voltar() {
    this.ministerioFilter = '';
    this.view = 'list';
    this.carregarUsuarios();
  }

  abrirModal() {
    this.showModal = true;
    this.editando = false;
    this.editId = '';
    this.novoNome = '';
    this.novoEmail = '';
    this.novaSenha = '';
    if (this.ministerioFilter) {
      this.ministeriosForm = [{ nome: this.ministerioFilter, lider: false, funcoes: [] }];
    } else {
      this.ministeriosForm = [];
    }
  }

  get modoMinisterioTravado(): boolean {
    return !this.editando && !!this.ministerioFilter;
  }

  get ministerioAtualNome(): string {
    return this.mapaNomes[this.ministerioFilter] || this.ministerioFilter;
  }

  abrirEditar(usuario: any) {
    this.showModal = true;
    this.editando = true;
    this.editId = usuario.id;
    this.novoNome = usuario.nome;
    this.novoEmail = usuario.email;
    this.novaSenha = '';
    this.ministeriosForm = (usuario.ministerios || []).map((m: any) => ({
      nome: m.nome,
      lider: m.lider ?? false,
      funcoes: (m.funcoes || []).map((f: any) => typeof f === 'string' ? f : f.nome || f.name || '')
    }));
  }

  fecharModal() {
    this.showModal = false;
  }

  adicionarMinisterio() {
    const restante = this.ministeriosDisponiveis.filter(
      n => !this.ministeriosForm.find(m => m.nome === n)
    );
    if (restante.length > 0) {
      this.ministeriosForm.push({
        nome: restante[0],
        lider: false,
        funcoes: []
      });
    }
  }

  removerMinisterio(index: number) {
    this.ministeriosForm.splice(index, 1);
  }

  toggleFuncao(ministerio: any, funcao: string) {
    const idx = ministerio.funcoes.indexOf(funcao);
    if (idx >= 0) {
      ministerio.funcoes.splice(idx, 1);
    } else {
      ministerio.funcoes.push(funcao);
    }
  }

  hasFuncao(ministerio: any, funcao: string): boolean {
    return ministerio.funcoes.includes(funcao);
  }

  async salvar() {
    if (!this.novoNome || !this.novoEmail) {
      alert('Preencha nome e email');
      return;
    }

    if (!this.editando && !this.novaSenha) {
      alert('Preencha a senha');
      return;
    }

    const ministeriosNormalizados = this.ministeriosForm.map(m => {
      const limpo: any = {};
      for (const key of Object.keys(m)) {
        limpo[key.trim()] = m[key as keyof typeof m];
      }
      limpo['nome'] = this.normalizarMinisterio(limpo['nome']);
      return limpo;
    });

    const dados: any = {
      nome: this.novoNome,
      email: this.novoEmail,
      ministerios: ministeriosNormalizados,
      lider: ministeriosNormalizados.some(m => m.lider === true)
    };

    if (this.editando) {
      if (this.novaSenha) {
        dados.senha = this.novaSenha;
      }
      await this.firestoreService.updateUsuario(this.editId, dados);
      await this.authService.refreshCurrentUser();
    } else {
      const uid = await this.criarAuthUser(this.novoEmail, this.novaSenha);
      if (!uid) return;
      dados.uid = uid;
      await this.firestoreService.addUsuario(dados);
    }

    this.fecharModal();
  }

  private async criarAuthUser(email: string, password: string): Promise<string | null> {
    if (environment.useLocalData) {
      return `local-${Date.now()}`;
    }
    try {
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true })
        }
      );
      const data = await response.json();
      if (data.error) {
        alert('Erro ao criar usuário: ' + (data.error.message || 'Erro desconhecido'));
        return null;
      }
      return data.localId;
    } catch {
      alert('Erro ao conectar com o servidor');
      return null;
    }
  }

  async removerDoMinisterio(usuario: any) {
    const chave = this.ministerioFilter;
    if (!chave) return;
    const nomeMin = this.mapaNomes[chave] || chave;
    const dialog = await this.alertCtrl.create({
      header: 'Remover do ministério',
      message: `Remover ${usuario.nome} do ministério ${nomeMin}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Remover',
          role: 'destructive',
          handler: async () => {
            const ministerios = (usuario.ministerios || []).filter(
              (m: any) => this.normalizarMinisterio(m.nome) !== chave
            );
            await this.firestoreService.updateUsuario(usuario.id, { ministerios });
            this.carregarUsuarios();
          }
        }
      ]
    });
    await dialog.present();
  }

  async excluir(usuario: any) {
    const dialog = await this.alertCtrl.create({
      header: 'Excluir usuário',
      message: `Excluir ${usuario.nome}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: async () => {
            await this.firestoreService.deleteUsuario(usuario.id);
          }
        }
      ]
    });
    await dialog.present();
  }

  get titulo(): string {
    if (this.ministerioFilter) return `Membros - ${this.mapaNomes[this.ministerioFilter] || this.ministerioFilter}`;
    return 'Gerenciar Membros';
  }

  getMinisterios(usuario: any): string {
    return (usuario['ministerios'] || [])
      .filter((m: any) => {
        if (this.authService.isAdmin) return true;
        const nomeNorm = this.normalizarMinisterio(m['nome']);
        return this.ministeriosDoLider.includes(nomeNorm);
      })
      .map((m: any) => {
        const partes = [m['nome']];
        if (m['lider']) partes.push('(líder)');
        return partes.join(' ');
      })
      .join(', ');
  }

  private normalizarMinisterio(nome: string): string {
    return (nome || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
  }
}
