import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { EscalasDoDiaPage } from './escalas-do-dia.page';
import { EscalasDoDiaPageRoutingModule } from './escalas-do-dia-routing.module';
import { BottomNavComponent } from '../components/bottom-nav.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EscalasDoDiaPageRoutingModule,
    BottomNavComponent
  ],
  declarations: [EscalasDoDiaPage]
})
export class EscalasDoDiaPageModule {}
