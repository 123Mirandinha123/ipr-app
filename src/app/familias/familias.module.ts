import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { FamiliasPage } from './familias.page';
import { FamiliasPageRoutingModule } from './familias-routing.module';
import { BottomNavComponent } from '../components/bottom-nav.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FamiliasPageRoutingModule,
    BottomNavComponent
  ],
  declarations: [FamiliasPage]
})
export class FamiliasPageModule {}
