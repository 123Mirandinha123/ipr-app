import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, collectionData, addDoc,
  doc, deleteDoc, updateDoc, setDoc, query, getDocs, getDoc
} from '@angular/fire/firestore';
import { Observable, of, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { usuariosSimulados, familiasSimuladas } from './dados-simulacao';

const STORAGE_ESCALAS = 'sim_local_escalas';
const STORAGE_USUARIOS = 'sim_local_usuarios';
const STORAGE_FAMILIAS = 'sim_local_familias';

@Injectable({
  providedIn: 'root'
})
export class FirestoreService {

  private firestore = inject(Firestore);

  private get localMode(): boolean {
    return environment.useLocalData;
  }

  private lerLocais<T>(chave: string): T[] {
    try {
      const raw = localStorage.getItem(chave);
      return raw ? JSON.parse(raw) as T[] : [];
    } catch {
      return [];
    }
  }

  private salvarLocais(chave: string, dados: any[]) {
    try {
      localStorage.setItem(chave, JSON.stringify(dados));
    } catch (e) {
      console.error('Falha ao salvar dados locais', e);
    }
  }

  private usuariosLocais(): any[] {
    const locais = this.lerLocais<any>(STORAGE_USUARIOS);
    if (locais.length) return locais;
    return usuariosSimulados.map(u => ({ id: u.uid, ...u }));
  }

  private familiasLocais(): any[] {
    const locais = this.lerLocais<any>(STORAGE_FAMILIAS);
    if (locais.length) return locais;
    return familiasSimuladas.map((f, i) => ({ id: `local-familia-${i}`, ...f }));
  }

  getEscalas(): Observable<any[]> {
    if (this.localMode) {
      return of(this.lerLocais(STORAGE_ESCALAS));
    }
    const ref = collection(this.firestore, 'escalas');
    return collectionData(ref, { idField: 'id' });
  }

  getUsuarios(): Observable<any[]> {
    const obs = this.localMode
      ? of(this.usuariosLocais())
      : collectionData(collection(this.firestore, 'usuarios'), { idField: 'id' });
    return obs.pipe(map(lista => (lista || []).map(u => ({ ...u, uid: u['uid'] || u['id'] }))));
  }

  getFamilias(): Observable<any[]> {
    if (this.localMode) {
      return of(this.familiasLocais());
    }
    const ref = collection(this.firestore, 'familias');
    return collectionData(ref, { idField: 'id' });
  }

  async addEscala(escala: any) {
    if (this.localMode) {
      const lista = this.lerLocais<any>(STORAGE_ESCALAS);
      lista.push({ id: `local-${Date.now()}-${lista.length}`, ...escala });
      this.salvarLocais(STORAGE_ESCALAS, lista);
      return;
    }
    const ref = collection(this.firestore, 'escalas');
    return await addDoc(ref, escala);
  }

  async deleteEscala(id: string) {
    if (this.localMode) {
      this.salvarLocais(STORAGE_ESCALAS, this.lerLocais<any>(STORAGE_ESCALAS).filter(e => e.id !== id));
      return;
    }
    const ref = doc(this.firestore, `escalas/${id}`);
    return await deleteDoc(ref);
  }

  async deleteAllEscalas() {
    if (this.localMode) {
      this.salvarLocais(STORAGE_ESCALAS, []);
      return;
    }
    const ref = collection(this.firestore, 'escalas');
    const snapshot = await getDocs(ref);
    await Promise.all(snapshot.docs.map(d => deleteDoc(doc(this.firestore, `escalas/${d.id}`))));
  }

  async updateEscala(id: string, data: any) {
    if (this.localMode) {
      const lista = this.lerLocais<any>(STORAGE_ESCALAS).map(e => e.id === id ? { ...e, ...data } : e);
      this.salvarLocais(STORAGE_ESCALAS, lista);
      return;
    }
    const ref = doc(this.firestore, `escalas/${id}`);
    return await updateDoc(ref, data);
  }

  async addUsuario(usuario: any) {
    if (this.localMode) {
      const lista = this.usuariosLocais();
      const idx = lista.findIndex(u => u.uid === usuario.uid);
      if (idx >= 0) lista[idx] = { ...lista[idx], ...usuario };
      else lista.push({ id: usuario.uid, ...usuario });
      this.salvarLocais(STORAGE_USUARIOS, lista);
      return;
    }
    const ref = doc(this.firestore, `usuarios/${usuario.uid}`);
    return await setDoc(ref, usuario);
  }

  async addFamilia(nome: string) {
    if (this.localMode) {
      const lista = this.familiasLocais();
      lista.push({ id: `local-${Date.now()}-${lista.length}`, nome, membros: [] });
      this.salvarLocais(STORAGE_FAMILIAS, lista);
      return;
    }
    return await addDoc(collection(this.firestore, 'familias'), { nome, membros: [] });
  }

  async updateFamilia(id: string, dados: any) {
    if (this.localMode) {
      const lista = this.familiasLocais().map(f => f.id === id ? { ...f, ...dados } : f);
      this.salvarLocais(STORAGE_FAMILIAS, lista);
      return;
    }
    const ref = doc(this.firestore, `familias/${id}`);
    return await updateDoc(ref, dados);
  }

  async deleteFamilia(id: string) {
    if (this.localMode) {
      this.salvarLocais(STORAGE_FAMILIAS, this.familiasLocais().filter(f => f.id !== id));
      return;
    }
    const ref = doc(this.firestore, `familias/${id}`);
    return await deleteDoc(ref);
  }

  async updateUsuario(id: string, data: any) {
    if (this.localMode) {
      const lista = this.usuariosLocais().map(u => (u.id === id || u.uid === id) ? { ...u, ...data } : u);
      this.salvarLocais(STORAGE_USUARIOS, lista);
      return;
    }
    const ref = doc(this.firestore, `usuarios/${id}`);
    return await updateDoc(ref, data);
  }

  async deleteUsuario(id: string) {
    if (this.localMode) {
      this.salvarLocais(STORAGE_USUARIOS, this.usuariosLocais().filter(u => u.id !== id && u.uid !== id));
      return;
    }
    const ref = doc(this.firestore, `usuarios/${id}`);
    return await deleteDoc(ref);
  }

  async addUserIndisponibilidade(uid: string, ministerio: string, data: string, turno: string | undefined, motivo: string) {
    if (this.localMode) {
      const lista = this.usuariosLocais().map(u => {
        if (u.uid !== uid) return u;
        const key = (i: any) => `${i.ministerio}|${i.data}|${i.turno || ''}`;
        const indisps = (u.indisponibilidades || []).filter(
          (i: any) => key(i) !== `${ministerio}|${data}|${turno || ''}`
        );
        const entry: any = { ministerio, data };
        if (motivo) entry.motivo = motivo;
        if (turno) entry.turno = turno;
        indisps.push(entry);
        return { ...u, indisponibilidades: indisps };
      });
      this.salvarLocais(STORAGE_USUARIOS, lista);
      return;
    }
    const ref = doc(this.firestore, `usuarios/${uid}`);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const key = (i: any) => `${i.ministerio}|${i.data}|${i.turno || ''}`;
    const indisps = (snap.data()['indisponibilidades'] || []).filter(
      (i: any) => key(i) !== `${ministerio}|${data}|${turno || ''}`
    );
    const entry: any = { ministerio, data };
    if (motivo) entry.motivo = motivo;
    if (turno) entry.turno = turno;
    indisps.push(entry);
    await updateDoc(ref, { indisponibilidades: indisps });
  }

  async removeUserIndisponibilidade(uid: string, ministerio: string, data: string, turno?: string) {
    if (this.localMode) {
      const lista = this.usuariosLocais().map(u => {
        if (u.uid !== uid) return u;
        const indisps = (u.indisponibilidades || []).filter(
          (i: any) => !(i.ministerio === ministerio && i.data === data && (i.turno || '') === (turno || ''))
        );
        return { ...u, indisponibilidades: indisps };
      });
      this.salvarLocais(STORAGE_USUARIOS, lista);
      return;
    }
    const ref = doc(this.firestore, `usuarios/${uid}`);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;
    const indisps = (snap.data()['indisponibilidades'] || []).filter(
      (i: any) => !(i.ministerio === ministerio && i.data === data && (i.turno || '') === (turno || ''))
    );
    await updateDoc(ref, { indisponibilidades: indisps });
  }

  resetarDadosLocais() {
    if (!this.localMode) return;
    localStorage.removeItem(STORAGE_ESCALAS);
    localStorage.removeItem(STORAGE_USUARIOS);
    localStorage.removeItem(STORAGE_FAMILIAS);
  }

  private normalizar(texto: string): string {
    return (texto || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '');
  }
}
