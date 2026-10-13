import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FamiliasPage } from './familias.page';

const routes: Routes = [
  {
    path: '',
    component: FamiliasPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FamiliasPageRoutingModule {}
