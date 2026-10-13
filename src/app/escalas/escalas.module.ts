import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { EscalasPage } from './escalas.page';
import { EscalasPageRoutingModule } from './escalas-routing.module';
import { EditarEscalaModalComponent } from './editar-escala-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EscalasPageRoutingModule
  ],
  declarations: [EscalasPage, EditarEscalaModalComponent]
})
export class EscalasPageModule {}
