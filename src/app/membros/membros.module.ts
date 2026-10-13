import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { MembrosPage } from './membros.page';
import { MembrosPageRoutingModule } from './membros-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MembrosPageRoutingModule
  ],
  declarations: [MembrosPage]
})
export class MembrosPageModule {}
