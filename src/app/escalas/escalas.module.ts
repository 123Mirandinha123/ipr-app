import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { EscalasPage } from './escalas.page';
import { EscalasPageRoutingModule } from './escalas-routing.module';
import { EditarEscalaModalComponent } from './editar-escala-modal.component';
import { BottomNavComponent } from '../components/bottom-nav.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EscalasPageRoutingModule,
    BottomNavComponent
  ],
  declarations: [EscalasPage, EditarEscalaModalComponent]
})
export class EscalasPageModule {}
