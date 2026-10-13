import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { MinhasEscalasPage } from './minhas-escalas.page';
import { MinhasEscalasPageRoutingModule } from './minhas-escalas-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MinhasEscalasPageRoutingModule
  ],
  declarations: [MinhasEscalasPage]
})
export class MinhasEscalasPageModule {}
