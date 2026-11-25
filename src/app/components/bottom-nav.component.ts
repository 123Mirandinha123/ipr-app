import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, MenuController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth';

@Component({
  selector: 'app-bottom-nav',
  template: `
    <div class="bottom-nav-bar">
      <!-- Escalas -->
      <div
        class="nav-item"
        [class.active]="activeTab === 'escalas'"
        (click)="navegar('/home')"
      >
        <div class="active-indicator" *ngIf="activeTab === 'escalas'"></div>
        <ion-icon name="calendar-outline" class="nav-icon"></ion-icon>
        <span class="nav-label">Escalas</span>
      </div>

      <!-- Minhas Escalas (visível para todos os membros) -->
      <div
        class="nav-item"
        [class.active]="activeTab === 'minhas-escalas'"
        (click)="navegar('/minhas-escalas')"
      >
        <div class="active-indicator" *ngIf="activeTab === 'minhas-escalas'"></div>
        <ion-icon name="time-outline" class="nav-icon"></ion-icon>
        <span class="nav-label">Minhas Escalas</span>
      </div>

      <!-- Mensagens (apenas para líder e admin) -->
      <div
        *ngIf="isAdmin || isLeader"
        class="nav-item"
        [class.active]="activeTab === 'mensagens'"
        (click)="navegar('/mensagens')"
      >
        <div class="active-indicator" *ngIf="activeTab === 'mensagens'"></div>
        <ion-icon name="mail-outline" class="nav-icon"></ion-icon>
        <span class="nav-label">Mensagens</span>
      </div>

      <!-- Perfil -->
      <div
        class="nav-item"
        [class.active]="activeTab === 'perfil'"
        (click)="navegar('/perfil')"
      >
        <div class="active-indicator" *ngIf="activeTab === 'perfil'"></div>
        <ion-icon name="person-outline" class="nav-icon"></ion-icon>
        <span class="nav-label">Perfil</span>
      </div>

      <!-- Todos (abre o Menu lateral) -->
      <div
        class="nav-item"
        [class.active]="activeTab === 'todos'"
        (click)="abrirMenuTodos()"
      >
        <div class="active-indicator" *ngIf="activeTab === 'todos'"></div>
        <ion-icon name="grid-outline" class="nav-icon"></ion-icon>
        <span class="nav-label">Todos</span>
      </div>
    </div>
  `,
  styles: [`
    .bottom-nav-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 60px;
      background: #111217;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      display: flex;
      justify-content: space-around;
      align-items: center;
      z-index: 999;
      padding-bottom: env(safe-area-inset-bottom, 0px);
    }
    .nav-item {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      cursor: pointer;
      color: #6b7280;
      transition: color 0.2s ease, transform 0.15s ease;
      flex: 1;
      height: 100%;
    }
    .nav-item:active {
      transform: scale(0.94);
    }
    .active-indicator {
      position: absolute;
      top: 0;
      width: 34px;
      height: 3px;
      background: #3b82f6;
      border-radius: 0 0 4px 4px;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.7);
    }
    .nav-icon {
      font-size: 21px;
    }
    .nav-label {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: -0.2px;
    }
    .nav-item.active {
      color: #3b82f6;
    }
    .nav-item.active .nav-icon {
      filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.5));
    }
  `],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class BottomNavComponent {
  @Input() activeTab: 'escalas' | 'minhas-escalas' | 'mensagens' | 'perfil' | 'todos' = 'escalas';

  private router = inject(Router);
  private menuCtrl = inject(MenuController);
  private authService = inject(AuthService);

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  get isLeader(): boolean {
    return this.authService.isLeader;
  }

  navegar(rota: string) {
    this.router.navigate([rota]);
  }

  async abrirMenuTodos() {
    await this.menuCtrl.open();
  }
}
