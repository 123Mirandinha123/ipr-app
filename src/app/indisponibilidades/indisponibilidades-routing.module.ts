import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { IndisponibilidadesPage } from './indisponibilidades.page';

const routes: Routes = [
  {
    path: '',
    component: IndisponibilidadesPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class IndisponibilidadesPageRoutingModule {}
