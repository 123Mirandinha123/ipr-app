import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { IndisponibilidadesPage } from './indisponibilidades.page';
import { IndisponibilidadesPageRoutingModule } from './indisponibilidades-routing.module';
import { BottomNavComponent } from '../components/bottom-nav.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    IndisponibilidadesPageRoutingModule,
    BottomNavComponent
  ],
  declarations: [IndisponibilidadesPage]
})
export class IndisponibilidadesPageModule {}
