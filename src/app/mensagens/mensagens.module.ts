import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { MensagensPage } from './mensagens.page';
import { MensagensPageRoutingModule } from './mensagens-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MensagensPageRoutingModule
  ],
  declarations: [MensagensPage]
})
export class MensagensPageModule {}
