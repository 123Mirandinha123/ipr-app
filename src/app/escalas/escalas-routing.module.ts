import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EscalasPage } from './escalas.page';

const routes: Routes = [
  {
    path: '',
    component: EscalasPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EscalasPageRoutingModule {}
