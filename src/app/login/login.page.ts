import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
    styleUrl: './login.page.scss',

  standalone: false
})
export class LoginPage implements OnInit {

  private authService = inject(AuthService);
  private router = inject(Router);

  email = '';
  senha = '';
  erro = '';
  carregando = false;
  mostrarSenha = false;

  ngOnInit() {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/home']);
    }
  }

  async login() {
    if (!this.email || !this.senha) {
      this.erro = 'Preencha email e senha';
      return;
    }

    this.carregando = true;
    this.erro = '';

    try {
      await this.authService.login(this.email, this.senha);
      this.router.navigate(['/home']);
    } catch (e: any) {
      console.error('ERRO LOGIN:', e);
      if (e.code === 'auth/wrong-password') {
        this.erro = 'Senha incorreta';
      } else {
        this.erro = 'Login ou senha incorretos';
      }
    } finally {
      this.carregando = false;
    }
  }

}