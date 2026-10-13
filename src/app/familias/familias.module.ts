import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { FamiliasPage } from './familias.page';
import { FamiliasPageRoutingModule } from './familias-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FamiliasPageRoutingModule
  ],
  declarations: [FamiliasPage]
})
export class FamiliasPageModule {}
