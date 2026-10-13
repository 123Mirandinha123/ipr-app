import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { EscalasDoDiaPage } from './escalas-do-dia.page';
import { EscalasDoDiaPageRoutingModule } from './escalas-do-dia-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EscalasDoDiaPageRoutingModule
  ],
  declarations: [EscalasDoDiaPage]
})
export class EscalasDoDiaPageModule {}
