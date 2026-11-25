import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { MembrosPage } from './membros.page';
import { MembrosPageRoutingModule } from './membros-routing.module';
import { BottomNavComponent } from '../components/bottom-nav.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MembrosPageRoutingModule,
    BottomNavComponent
  ],
  declarations: [MembrosPage]
})
export class MembrosPageModule {}
