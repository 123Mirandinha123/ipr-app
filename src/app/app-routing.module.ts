import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { LeaderGuard } from './guards/leader.guard';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'membros',
    loadChildren: () => import('./membros/membros.module').then(m => m.MembrosPageModule),
    canActivate: [AuthGuard, LeaderGuard]
  },
  {
    path: 'perfil',
    loadChildren: () => import('./perfil/perfil.module').then(m => m.PerfilPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'minhas-escalas',
    loadChildren: () => import('./minhas-escalas/minhas-escalas.module').then(m => m.MinhasEscalasPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'escalas-do-dia',
    loadChildren: () => import('./escalas-do-dia/escalas-do-dia.module').then(m => m.EscalasDoDiaPageModule),
    canActivate: [AuthGuard, AdminGuard]
  },
  {
    path: 'indisponibilidades',
    loadChildren: () => import('./indisponibilidades/indisponibilidades.module').then(m => m.IndisponibilidadesPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'mensagens',
    loadChildren: () => import('./mensagens/mensagens.module').then(m => m.MensagensPageModule),
    canActivate: [AuthGuard, LeaderGuard]
  },
  {
    path: 'familias',
    loadChildren: () => import('./familias/familias.module').then(m => m.FamiliasPageModule),
    canActivate: [AuthGuard, LeaderGuard]
  },
  {
    path: 'compartilhar',
    loadChildren: () => import('./compartilhar/compartilhar.module').then(m => m.CompartilharPageModule),
    canActivate: [AuthGuard, LeaderGuard]
  },
  {
    path: 'escalas/:ministerio',
    loadChildren: () => import('./escalas/escalas.module').then(m => m.EscalasPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
