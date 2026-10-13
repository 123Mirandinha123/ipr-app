import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController, ActionSheetController } from '@ionic/angular';

interface SelectedItem {
  data: string;
  turno?: string;
}

@Component({
  selector: 'app-indisponibilidade-modal',
  templateUrl: 'indisponibilidade-modal.component.html',
  styles: [`
    .calendar-nav { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; }
    .month-title { font-size: 1.1em; font-weight: 600; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; text-align: center; }
    .calendar-weekday { font-weight: 600; padding: 8px 0; color: var(--ion-color-medium); font-size: 0.85em; }
    .calendar-day { padding: 10px 0; border-radius: 50%; cursor: default; font-size: 0.9em; width: 100%; aspect-ratio: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
    .calendar-day.selectable { cursor: pointer; color: var(--ion-color-primary); }
    .calendar-day.selectable:hover { background: var(--ion-color-light); }
    .calendar-day.selected { background: var(--ion-color-danger); color: white; font-weight: 700; }
    .calendar-day.selected:hover { background: var(--ion-color-danger-shade); }
    .calendar-day.disabled { color: var(--ion-color-light-shade); }
    .turno-indicators { display: flex; gap: 2px; margin-top: 2px; }
    .turno-dot { width: 8px; height: 8px; border-radius: 50%; border: 1px solid currentColor; }
    .turno-dot.active { background: currentColor; }
    .selected-items { margin-top: 12px; }
    .selected-item { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; font-size: 0.9em; border-bottom: 1px solid var(--ion-color-light-shade); }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class IndisponibilidadeModalComponent implements OnInit {
  @Input() existing: { data: string; turno?: string; motivo?: string }[] = [];

  currentYear: number;
  currentMonth: number;
  selectedItems: SelectedItem[] = [];
  weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  motivo = '';

  constructor(
    private modalCtrl: ModalController,
    private actionSheetCtrl: ActionSheetController
  ) {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();
  }

  ngOnInit() {
    this.selectedItems = this.existing.map(e => ({
      data: e.data,
      turno: e.turno
    }));
    const first = this.existing.find(e => e.motivo);
    if (first) this.motivo = first.motivo!;
  }

  get daysInMonth(): number[] {
    const count = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    return Array.from({ length: count }, (_, i) => i + 1);
  }

  get firstDayOfWeek(): number {
    return new Date(this.currentYear, this.currentMonth, 1).getDay();
  }

  get emptyCells(): number[] {
    return Array(this.firstDayOfWeek).fill(0);
  }

  monthName(): string {
    const names = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    return names[this.currentMonth];
  }

  isSelectable(day: number): boolean {
    const date = new Date(this.currentYear, this.currentMonth, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return false;
    const dow = date.getDay();
    return dow === 0 || dow === 4;
  }

  isDomingo(day: number): boolean {
    return new Date(this.currentYear, this.currentMonth, day).getDay() === 0;
  }

  hasSelecao(day: number): boolean {
    const data = this.key(day);
    return this.selectedItems.some(i => i.data === data);
  }

  hasTurno(day: number, turno: string): boolean {
    const data = this.key(day);
    return this.selectedItems.some(i => i.data === data && i.turno === turno);
  }

  async toggleDay(day: number) {
    if (!this.isSelectable(day)) return;
    const data = this.key(day);

    if (this.isDomingo(day)) {
      await this.abrirActionSheet(data, day);
    } else {
      this.toggleItem(data);
    }
  }

  toggleItem(data: string, turno?: string) {
    const idx = this.selectedItems.findIndex(i =>
      i.data === data && (i.turno || '') === (turno || '')
    );
    if (idx >= 0) {
      this.selectedItems.splice(idx, 1);
    } else {
      const item: SelectedItem = { data };
      if (turno) item.turno = turno;
      this.selectedItems.push(item);
    }
  }

  private async abrirActionSheet(data: string, day: number) {
    const dia = String(day).padStart(2, '0');
    const mes = String(this.currentMonth + 1).padStart(2, '0');
    const label = `Domingo, ${dia}/${mes}`;

    const hasManha = this.hasTurno(day, 'manha');
    const hasNoite = this.hasTurno(day, 'noite');

    const buttons: any[] = [];

    buttons.push({
      text: hasManha ? 'Remover Manhã' : 'Manhã',
      handler: () => { this.toggleItem(data, 'manha'); }
    });

    buttons.push({
      text: hasNoite ? 'Remover Noite' : 'Noite',
      handler: () => { this.toggleItem(data, 'noite'); }
    });

    if (!(hasManha && hasNoite)) {
      buttons.push({
        text: 'Ambos',
        handler: () => {
          this.toggleItem(data, 'manha');
          this.toggleItem(data, 'noite');
        }
      });
    }

    if (hasManha || hasNoite) {
      buttons.push({
        text: 'Remover ambos',
        role: 'destructive',
        handler: () => {
          this.selectedItems = this.selectedItems.filter(i => i.data !== data);
        }
      });
    }

    buttons.push({ text: 'Cancelar', role: 'cancel' });

    const actionSheet = await this.actionSheetCtrl.create({
      header: label,
      buttons
    });
    await actionSheet.present();
  }

  get selectedCount(): number {
    return this.selectedItems.length;
  }

  formatSelectedItem(item: SelectedItem): string {
    const [ano, mes, dia] = item.data.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);
    const dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    let label = `${dias[data.getDay()]}, ${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}`;
    if (item.turno === 'manha') label += ' (Manhã)';
    else if (item.turno === 'noite') label += ' (Noite)';
    return label;
  }

  private key(day: number): string {
    return `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  prevMonth() {
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
    else this.currentMonth--;
  }

  nextMonth() {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
    else this.currentMonth++;
  }

  confirm() {
    this.modalCtrl.dismiss({
      items: this.selectedItems,
      motivo: this.motivo.trim()
    });
  }

  cancel() {
    this.modalCtrl.dismiss(null);
  }
}
