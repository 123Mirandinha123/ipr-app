import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { MensagensPage } from './mensagens.page';
import { MensagensPageRoutingModule } from './mensagens-routing.module';
import { BottomNavComponent } from '../components/bottom-nav.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MensagensPageRoutingModule,
    BottomNavComponent
  ],
  declarations: [MensagensPage]
})
export class MensagensPageModule {}
