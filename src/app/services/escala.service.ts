import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FirestoreService } from './firestore';

@Injectable({
  providedIn: 'root'
})
export class EscalaService {

  private firestoreService = inject(FirestoreService);

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

  normalizar(texto: string): string {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
  }

  funcaoCanonica2(funcao: string): string {
    const norm = this.normalizar(funcao);
    if (norm === 'vocal' || norm === 'vocalista') return 'vocal';
    if (norm === 'backvocal' || norm === 'back' || norm === 'backvocalista' || norm === 'backvocal') return 'backvocal';
    if (norm === 'violonista' || norm === 'violao' || norm === 'viola') return 'vionolista';
    if (norm === 'bateria' || norm === 'percussao') return 'baterista';
    if (norm === 'teclado') return 'tecladista';
    if (norm === 'guitarra') return 'guitarrista';
    if (norm === 'baixo' || norm === 'contrabaixo') return 'baixista';
    return norm;
  }

  getDatasDoMes(): { data: string; turno?: string }[] {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();
    const ultimoDia = new Date(ano, mes + 1, 0).getDate();
    const itens: { data: string; turno?: string }[] = [];

    for (let dia = hoje.getDate(); dia <= ultimoDia; dia++) {
      const data = new Date(ano, mes, dia);
      const diaSemana = data.getDay();
      if (diaSemana === 0) {
        const dataStr = data.toISOString().split('T')[0];
        itens.push({ data: dataStr, turno: 'manha' });
        itens.push({ data: dataStr, turno: 'noite' });
      } else if (diaSemana === 4) {
        itens.push({ data: data.toISOString().split('T')[0] });
      }
    }

    return itens;
  }

  formatarNomeMinisterioDe(ministerio: string): string {
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
    return mapa[ministerio] || ministerio;
  }

  async gerarEscalasMinisterio(ministerio: string, usuarios: any[], todasEscalas: any[]): Promise<{ criadas: number; mensagem: string; funcoesVazias: string[] }> {
    if (!usuarios.length) {
      return { criadas: 0, mensagem: 'Sem usuarios cadastrados', funcoesVazias: [] };
    }

    const datas = this.getDatasDoMes();
    if (!datas.length) {
      return { criadas: 0, mensagem: 'Nenhuma data disponivel no restante do mes', funcoesVazias: [] };
    }

    const escalasDoMinisterio = todasEscalas.filter(e => e['ministerio'] === ministerio);
    const datasExistentes = new Set(
      escalasDoMinisterio.map(e => `${e['data']}_${e['turno'] || ''}`)
    );
    const datasNovas = datas.filter(d => !datasExistentes.has(`${d.data}_${d.turno || ''}`));

    if (!datasNovas.length) {
      return { criadas: 0, mensagem: 'Todas as escalas deste ministerio no mes ja foram criadas', funcoesVazias: [] };
    }

    const shuffle = (arr: any[]) => arr.sort(() => 0.5 - Math.random());

    const participantes: { uid: string; nome: string; funcoes: string[] }[] = [];

    usuarios.forEach(usuario => {
      const ministerios = usuario.ministerios || [];
      const min = ministerios.find((m: any) => this.normalizar(m.nome) === ministerio);
      if (!min) return;
      participantes.push({
        uid: usuario.uid || usuario.id,
        nome: usuario.nome,
        funcoes: (min.funcoes || []).map((f: any) => (typeof f === 'string' ? f : f.nome || f.name || '').trim()).filter((f: string) => f)
      });
    });

    if (!participantes.length) {
      return { criadas: 0, mensagem: `Nenhum membro encontrado para ${ministerio} (${usuarios.length} usuário(s) carregado(s), nenhum com este ministério)`, funcoesVazias: [] };
    }

    const funcoesEsperadas = this.funcoesDisponiveis[ministerio] || [];
    const funcoesCadastradas = new Set<string>();
    participantes.forEach(p =>
      (p.funcoes || []).forEach(f => funcoesCadastradas.add(this.funcaoCanonica2(f)))
    );
    const funcoesVazias = funcoesEsperadas.filter(f => {
      const c = this.funcaoCanonica2(f);
      return !!c && !funcoesCadastradas.has(c);
    });

    const ordemFuncoes: Record<string, number> = {
      vocal: 0,
      backvocal: 1,
      guitarrista: 2,
      tecladista: 3,
      baixista: 4,
      baterista: 5,
      vionolista: 6
    };

    const qtdPorMinisterio: Record<string, number> = {
      maternal: 2,
      '4a6': 2,
      '7a10': 1,
      juniores: 1,
      adolescentes: 1,
      sonoplastia: 1,
      diaconos: 4
    };

    const indisponibilidadeMap = new Map<string, Set<string>>();
    usuarios.forEach((u: any) => {
      const datas = (u.indisponibilidades || [])
        .filter((i: any) => this.normalizar(i.ministerio) === ministerio)
        .map((i: any) => `${i.data}_${i.turno || ''}`);
      indisponibilidadeMap.set(u.uid, new Set(datas));
    });

    const familias = await firstValueFrom(this.firestoreService.getFamilias());
    const familiaPorUid = new Map<string, string>();
    familias.forEach((f: any) => (f.membros || []).forEach((uid: string) => familiaPorUid.set(uid, f.id || f.uid)));

    const jaEscalados = new Set<string>();
    const escaladosPorData = new Map<string, Set<string>>();
    const escaladosPorTurno = new Map<string, Set<string>>();
    const uidsPorNome = new Map<string, string[]>();
    usuarios.forEach(u => {
      if (!uidsPorNome.has(u.nome)) uidsPorNome.set(u.nome, []);
      uidsPorNome.get(u.nome)!.push(u.uid);
    });
    todasEscalas.forEach(e => {
      const data = e['data'];
      if (!data) return;
      const nomes = new Set<string>();
      [...(e['lideres'] || []), ...(e['membros'] || [])].forEach((n: string) => nomes.add(n));
      Object.values(e['funcoes'] || {}).forEach((arr: any) => (arr as string[]).forEach((n: string) => nomes.add(n)));
      const set = escaladosPorData.get(data) || new Set<string>();
      const chaveTurno = `${data}_${e['turno'] || ''}`;
      const setTurno = escaladosPorTurno.get(chaveTurno) || new Set<string>();
      nomes.forEach(n => {
        (uidsPorNome.get(n) || []).forEach(uid => {
          set.add(uid);
          setTurno.add(uid);
          jaEscalados.add(uid);
        });
      });
      escaladosPorData.set(data, set);
      escaladosPorTurno.set(chaveTurno, setTurno);
    });

    let dataAtual = '';
    let turnoAtual = '';
    let bloqueadosNoDia = new Set<string>();
    const familiasNoDia = new Map<string, Set<string>>();
    const chaveTurnoDe = (data: string, turno?: string) => `${data}_${turno || ''}`;
    const familiaDe = (p: any) => familiaPorUid.get(p.uid) || '';
    const prioridadeFamilia = (p: any) => (familiasNoDia.get(chaveTurnoDe(dataAtual, turnoAtual)) || new Set<string>()).has(familiaDe(p));
    const ordenarPorFamilia = (arr: any[]) =>
      arr.sort((a, b) => Number(prioridadeFamilia(b)) - Number(prioridadeFamilia(a)));
    const marcarFamilia = (p: any, data: string, turno?: string) => {
      const fid = familiaPorUid.get(p.uid);
      if (!fid) return;
      const chave = chaveTurnoDe(data, turno);
      if (!familiasNoDia.has(chave)) familiasNoDia.set(chave, new Set<string>());
      familiasNoDia.get(chave)!.add(fid);
    };
    const familiaEmOutroTurnoNoDia = (p: any, data: string, turno?: string): boolean => {
      const fid = familiaPorUid.get(p.uid);
      if (!fid) return false;
      for (const [chave, fams] of familiasNoDia) {
        if (!fams.has(fid)) continue;
        const sep = chave.indexOf('_');
        if (chave.slice(0, sep) === data && chave.slice(sep + 1) !== (turno || '')) return true;
      }
      return false;
    };
    const escolher = (pool: any[], quantidade: number): any[] => {
      const naoBloqueadosDia = pool.filter((p: any) => !bloqueadosNoDia.has(p.uid));
      const okFamilia = naoBloqueadosDia.filter((p: any) => !familiaEmOutroTurnoNoDia(p, dataAtual, turnoAtual));
      const bloqueadosFamilia = naoBloqueadosDia.filter((p: any) => familiaEmOutroTurnoNoDia(p, dataAtual, turnoAtual));
      const escolhidos: any[] = [];
      const adicionar = (lista: any[]) => {
        const restante = quantidade - escolhidos.length;
        if (restante <= 0) return;
        const nunca = lista.filter((p: any) => !jaEscalados.has(p.uid));
        const outros = lista.filter((p: any) => jaEscalados.has(p.uid));
        escolhidos.push(...ordenarPorFamilia(shuffle(nunca)).slice(0, restante));
        const restante2 = quantidade - escolhidos.length;
        if (restante2 > 0) escolhidos.push(...ordenarPorFamilia(shuffle(outros)).slice(0, restante2));
      };
      adicionar(okFamilia);
      adicionar(bloqueadosFamilia);
      escolhidos.forEach((p: any) => {
        jaEscalados.add(p.uid);
        bloqueadosNoDia.add(p.uid);
        marcarFamilia(p, dataAtual, turnoAtual);
      });
      return escolhidos;
    };

    let criadas = 0;
    for (const { data, turno } of datasNovas) {
      if (data !== dataAtual) {
        dataAtual = data;
        bloqueadosNoDia = new Set<string>();
        const doDia = escaladosPorData.get(data);
        if (doDia) {
          doDia.forEach(uid => { bloqueadosNoDia.add(uid); jaEscalados.add(uid); });
        }
      }
      const chaveTurno = chaveTurnoDe(data, turno);
      if (chaveTurno !== turnoAtual) {
        turnoAtual = turno || '';
        const doTurno = escaladosPorTurno.get(chaveTurno);
        if (doTurno) {
          doTurno.forEach(uid => {
            const fid = familiaPorUid.get(uid);
            if (fid) marcarFamilia({ uid }, data, turno);
          });
        }
      }
      const participantesDisponiveis = participantes.filter(p => {
        const datasIndis = indisponibilidadeMap.get(p.uid);
        return !datasIndis?.has(`${data}_${turno || ''}`);
      });
      if (!participantesDisponiveis.length) continue;
      let funcoesFinais: any = {};
      let lideres: string[] = [];
      let membros: string[] = [];
      const temProfessorAuxiliar = (this.funcoesDisponiveis[ministerio] || [])
        .some((f: string) => {
          const c = this.funcaoCanonica2(f);
          return c === 'professor' || c === 'auxiliar';
        });

      if (ministerio === 'midia' || ministerio === 'renoshow') {
        const escolhido = escolher(participantesDisponiveis, 1)[0];
        if (!escolhido) continue;

        if (escolhido.funcoes.length > 0) {
          const porFuncao: any = {};
          escolhido.funcoes.forEach((funcao: string) => {
            if (!porFuncao[funcao]) porFuncao[funcao] = [];
            porFuncao[funcao].push(escolhido.nome);
          });
          const funcoesOrdenadas = Object.keys(porFuncao).sort((a, b) => {
            const na = this.normalizar(a);
            const nb = this.normalizar(b);
            return (ordemFuncoes[na] ?? 99) - (ordemFuncoes[nb] ?? 99);
          });
          funcoesOrdenadas.forEach(funcao => {
            funcoesFinais[funcao] = shuffle([...porFuncao[funcao]]).slice(0, 1);
          });
        }

        const min = (usuarios.find(u => u.uid === escolhido.uid)?.ministerios || [])
          .find((m: any) => this.normalizar(m.nome) === ministerio);
        if (min?.lider) {
          lideres = [escolhido.nome];
        } else {
          membros = [escolhido.nome];
        }
      } else if (ministerio === 'louvor' || temProfessorAuxiliar) {
        const porFuncao: any = {};
        participantesDisponiveis.forEach(p => {
          p.funcoes.forEach(funcao => {
            const chave = this.funcaoCanonica2(funcao);
            if (!porFuncao[chave]) porFuncao[chave] = [];
            porFuncao[chave].push(p);
          });
        });

        const categorias = (this.funcoesDisponiveis[ministerio] || [])
          .filter((f: string) => f.trim().length > 0);
        const funcoesOrdenadas = (categorias.length > 0 ? categorias : Object.keys(porFuncao))
          .slice()
          .sort((a, b) => {
            const na = this.funcaoCanonica2(a);
            const nb = this.funcaoCanonica2(b);
            return (ordemFuncoes[na] ?? 99) - (ordemFuncoes[nb] ?? 99);
          });

        const qtdPorFuncao = (funcao: string): number => {
          return this.funcaoCanonica2(funcao) === 'backvocal' ? 2 : 1;
        };

        const membrosEscolhidos: any[] = [];
        funcoesOrdenadas.forEach(funcao => {
          const canon = this.funcaoCanonica2(funcao);
          const pool = porFuncao[canon] || [];
          const escolhidos = escolher(pool, qtdPorFuncao(funcao));
          if (escolhidos.length > 0) {
            funcoesFinais[funcao] = escolhidos.map((p: any) => p.nome);
            membrosEscolhidos.push(...escolhidos);
          }
        });

        const desenhadosUids = new Set<string>(membrosEscolhidos.map((p: any) => p.uid));

        if (ministerio === 'louvor') {
          participantesDisponiveis
            .filter(p => p.funcoes.length === 0 && !desenhadosUids.has(p.uid) && !familiaEmOutroTurnoNoDia(p, data, turno))
            .forEach((p: any) => {
              jaEscalados.add(p.uid);
              bloqueadosNoDia.add(p.uid);
              desenhadosUids.add(p.uid);
              membrosEscolhidos.push(p);
            });
        }

        lideres = membrosEscolhidos.filter(p => {
          const min = (usuarios.find(u => u.uid === p.uid)?.ministerios || [])
            .find((m: any) => this.normalizar(m.nome) === ministerio);
          return min?.lider;
        }).map(p => p.nome);

        membros = membrosEscolhidos
          .filter(p => !lideres.includes(p.nome))
          .map(p => p.nome);
      } else {
        const qtd = qtdPorMinisterio[ministerio] || 1;
        const escolhidos = escolher(participantesDisponiveis, qtd);
        lideres = escolhidos.filter(p => {
          const min = (usuarios.find(u => u.uid === p.uid)?.ministerios || [])
            .find((m: any) => this.normalizar(m.nome) === ministerio);
          return min?.lider;
        }).map(p => p.nome);
        membros = escolhidos.filter(p => !lideres.includes(p.nome)).map(p => p.nome);
      }

      const escalaData: any = {
        data,
        ministerio,
        lideres,
        membros,
        funcoes: funcoesFinais
      };
      if (turno) escalaData.turno = turno;
      await this.firestoreService.addEscala(escalaData);
      criadas++;
    }

    let mensagem = `${criadas} escala(s) de ${ministerio} criada(s)!`;
    if (criadas === 0 && participantes.length > 0) {
      mensagem = `Nenhuma escala de ${ministerio} criada: ${participantes.length} membro(s) cadastrado(s), mas todos já estavam escalados em outro ministério (ou indisponíveis) em todas as datas restantes. A regra impede a mesma pessoa 2x no mesmo dia.`;
    }
    if (funcoesVazias.length > 0) {
      mensagem += `\n\nFunções sem ninguém cadastrado: ${funcoesVazias.join(', ')}`;
    }
    return { criadas, mensagem, funcoesVazias };
  }

  async criarTodasEscalas(): Promise<{ total: number; detalhes: string[] }> {
    const ministerios = Object.keys(this.funcoesDisponiveis);
    const usuarios = await firstValueFrom(this.firestoreService.getUsuarios());
    let total = 0;
    const detalhes: string[] = [];
    for (const ministerio of ministerios) {
      const todasEscalas = await firstValueFrom(this.firestoreService.getEscalas());
      const resultado = await this.gerarEscalasMinisterio(ministerio, usuarios, todasEscalas);
      total += resultado.criadas;
      if (resultado.criadas > 0) {
        let linha = `${this.formatarNomeMinisterioDe(ministerio)}: ${resultado.criadas} escala(s) criada(s)`;
        if (resultado.funcoesVazias.length > 0) {
          linha += ` — faltam: ${resultado.funcoesVazias.join(', ')}`;
        }
        detalhes.push(linha);
      } else {
        detalhes.push(`${this.formatarNomeMinisterioDe(ministerio)}: ${resultado.mensagem}`);
      }
    }
    return { total, detalhes };
  }
}
