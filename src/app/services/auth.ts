import { Injectable, NgZone, inject } from '@angular/core';
import { Auth, signInWithEmailAndPassword, signOut, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, getDocs, collection, query, where } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { usuariosSimulados } from './dados-simulacao';

export interface Usuario {
  id: string;
  uid: string;
  email: string;
  nome: string;
  admin?: boolean;
    ministerios: {
      nome: string;
      lider: boolean;
      funcoes: string[];
    }[];
  indisponibilidades: { ministerio: string; data: string; turno?: string; motivo?: string }[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  private currentUserSubject = new BehaviorSubject<Usuario | null>(null);
  currentUser$: Observable<Usuario | null> = this.currentUserSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(true);
  loading$ = this.loadingSubject.asObservable();

  constructor() {
    if (environment.useLocalData) {
      this.loadingSubject.next(false);
      return;
    }
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        await this.loadUsuario(user);
      } else {
        this.currentUserSubject.next(null);
        this.loadingSubject.next(false);
      }
    });
  }

  get currentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return this.currentUserSubject.value !== null;
  }

  get isLeader(): boolean {
    const user = this.currentUser;
    if (!user) return false;
    return user.ministerios?.some(m => m.lider) ?? false;
  }

  get isAdmin(): boolean {
    return this.currentUser?.admin ?? false;
  }

  async login(email: string, password: string): Promise<void> {
    if (environment.useLocalData) {
      const u = usuariosSimulados.find(x => x.admin) || usuariosSimulados[0];
      const usuario: Usuario = {
        id: u.uid,
        uid: u.uid,
        email: u.email,
        nome: u.nome,
        admin: u.admin ?? false,
        ministerios: u.ministerios,
        indisponibilidades: u.indisponibilidades ?? []
      };
      this.currentUserSubject.next(usuario);
      this.loadingSubject.next(false);
      return;
    }
    const credential = await signInWithEmailAndPassword(this.auth, email, password);
    await this.loadUsuario(credential.user);
  }

  async logout(): Promise<void> {
    if (environment.useLocalData) {
      this.currentUserSubject.next(null);
      this.loadingSubject.next(false);
      this.router.navigate(['/login']);
      return;
    }
    await signOut(this.auth);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  async refreshCurrentUser(): Promise<void> {
    if (environment.useLocalData) {
      if (!this.currentUser) {
        this.loadingSubject.next(false);
      }
      return;
    }
    try {
      const user = this.auth.currentUser;
      if (!user) return;
      const ref = collection(this.firestore, 'usuarios');
      const q = query(ref, where('uid', '==', user.uid));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const data = docSnap.data();
        const usuario: Usuario = {
          id: docSnap.id,
          uid: user.uid,
          email: data['email'] ?? user.email ?? '',
          nome: data['nome'] ?? '',
          admin: data['admin'] ?? false,
          ministerios: (data['ministerios'] ?? []).map((m: any) => {
            const limpo: any = {};
            for (const key of Object.keys(m)) {
              limpo[key.trim()] = m[key];
            }
            return limpo;
          }),
          indisponibilidades: data['indisponibilidades'] ?? []
        };
        this.ngZone.run(() => {
          this.currentUserSubject.next(usuario);
          this.loadingSubject.next(false);
        });
      }
    } catch (e) {
      console.error('refreshCurrentUser error', e);
    }
  }

  private async loadUsuario(user: User): Promise<void> {
    const usuariosRef = doc(this.firestore, `usuarios/${user.uid}`);
    const snap = await getDoc(usuariosRef);

    if (snap.exists()) {
      const data = snap.data();
      const usuario: Usuario = {
        id: snap.id,
        uid: user.uid,
        email: data['email'] ?? user.email ?? '',
        nome: data['nome'] ?? '',
        admin: data['admin'] ?? false,
        ministerios: (data['ministerios'] ?? []).map((m: any) => {
          const limpo: any = {};
          for (const key of Object.keys(m)) {
            limpo[key.trim()] = m[key];
          }
          return limpo;
        }),
        indisponibilidades: data['indisponibilidades'] ?? []
      };
      this.ngZone.run(() => {
        this.currentUserSubject.next(usuario);
        this.loadingSubject.next(false);
      });
    } else {
      this.ngZone.run(() => {
        this.currentUserSubject.next(null);
        this.loadingSubject.next(false);
      });
    }
  }
}
