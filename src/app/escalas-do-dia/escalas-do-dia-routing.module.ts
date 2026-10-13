import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EscalasDoDiaPage } from './escalas-do-dia.page';

const routes: Routes = [
  {
    path: '',
    component: EscalasDoDiaPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EscalasDoDiaPageRoutingModule {}
