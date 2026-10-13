import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CompartilharPage } from './compartilhar.page';
import { CompartilharPageRoutingModule } from './compartilhar-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CompartilharPageRoutingModule
  ],
  declarations: [CompartilharPage]
})
export class CompartilharPageModule {}
