import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { PerfilPage } from './perfil.page';
import { PerfilPageRoutingModule } from './perfil-routing.module';
import { BottomNavComponent } from '../components/bottom-nav.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PerfilPageRoutingModule,
    BottomNavComponent
  ],
  declarations: [PerfilPage]
})
export class PerfilPageModule {}
