import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-sobre-modal',
  templateUrl: './sobre-modal.component.html',
  styleUrls: ['./sobre-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class SobreModalComponent {
  private modalCtrl = inject(ModalController);

  readonly versao = '1.0.0';
  readonly ano = new Date().getFullYear();

  fechar() {
    this.modalCtrl.dismiss();
  }
}
