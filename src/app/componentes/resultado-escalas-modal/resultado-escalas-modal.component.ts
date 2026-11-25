import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-resultado-escalas-modal',
  templateUrl: './resultado-escalas-modal.component.html',
  styleUrls: ['./resultado-escalas-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class ResultadoEscalasModalComponent {
  private modalCtrl = inject(ModalController);

  @Input() titulo: string = 'Escalas Criadas';
  @Input() subtitulo: string = '';
  @Input() total: number = 0;
  @Input() detalhes: string[] = [];
  @Input() mensagemSimples: string = '';

  fechar() {
    this.modalCtrl.dismiss();
  }

  isAviso(texto: string): boolean {
    const t = (texto || '').toLowerCase();
    return t.includes('faltam') || t.includes('nenhum') || t.includes('já estavam') || t.includes('indisponíveis');
  }
}
