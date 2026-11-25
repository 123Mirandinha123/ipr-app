import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';

export interface DayIndisponibilidade {
  data: string; // YYYY-MM-DD
  diaNumero: number;
  diaSemana: 'quinta' | 'domingo';
  dataFormatada: string;
  manha?: boolean;
  noite?: boolean;
  motivo?: string;
}

@Component({
  selector: 'app-indisponibilidade-modal',
  templateUrl: 'indisponibilidade-modal.component.html',
  styles: [`
    ion-content {
      --background: #0b0f19;
      --color: #ffffff;
    }

    .modal-container {
      padding: 16px 12px 28px;
    }

    /* ========================= */
    /* Header do Modal           */
    /* ========================= */
    .modal-header-bar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .header-icon-box {
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: rgba(15, 23, 42, 0.9);
      border: 1.5px solid #0284c7;
      box-shadow: 0 0 16px rgba(2, 132, 199, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #38bdf8;
      flex-shrink: 0;
    }

    .header-textos {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .header-titulo {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: -0.2px;
    }

    .header-subtitulo {
      margin: 0;
      font-size: 0.85rem;
      color: #94a3b8;
      line-height: 1.3;
    }

    .btn-close-modal {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 4px;
      transition: color 0.15s ease;
    }

    .btn-close-modal:active {
      color: #ffffff;
    }

    /* ========================= */
    /* Navegação do Mês          */
    /* ========================= */
    .month-nav-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 10px;
      margin-bottom: 12px;
    }

    .month-nav-btn {
      background: transparent;
      border: none;
      color: #38bdf8;
      font-size: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px 8px;
    }

    .month-nav-btn:disabled {
      color: #334155;
      cursor: not-allowed;
    }

    .month-nav-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #ffffff;
    }

    /* ========================= */
    /* Grid do Calendário        */
    /* ========================= */
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      row-gap: 8px;
      column-gap: 4px;
      text-align: center;
      margin-bottom: 14px;
    }

    .weekday-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #94a3b8;
      padding: 4px 0;
    }

    .day-cell {
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      font-weight: 500;
      color: #64748b;
      border-radius: 50%;
      user-select: none;
      position: relative;
    }

    .day-cell.empty {
      visibility: hidden;
    }

    .day-cell.selectable {
      cursor: pointer;
      color: #e2e8f0;
      font-weight: 600;
    }

    .day-cell.selectable:active {
      background: rgba(255, 255, 255, 0.08);
    }

    .day-cell.com-registro {
      border: 2px solid #0284c7;
      color: #ffffff;
      box-shadow: 0 0 10px rgba(2, 132, 199, 0.4);
    }

    .day-cell.selected {
      background: #ef4444 !important;
      border-color: #ef4444 !important;
      color: #ffffff !important;
      font-weight: 700;
      box-shadow: 0 0 14px rgba(239, 68, 68, 0.6);
    }

    /* ========================= */
    /* Legenda                   */
    /* ========================= */
    .legend-row {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 4px 12px;
      margin-bottom: 22px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.82rem;
      color: #94a3b8;
    }

    .legend-dot-red {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: #ef4444;
    }

    .legend-circle-blue {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      border: 2px solid #0284c7;
    }

    /* ========================= */
    /* Seção "Quando estará..."  */
    /* ========================= */
    .section-title {
      font-size: 1rem;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 14px 4px;
    }

    .cards-container {
      display: flex;
      flex-direction: column;
      gap: 14px;
      margin-bottom: 24px;
    }

    .day-indisp-card {
      background: rgba(17, 24, 39, 0.88);
      border: 1px solid rgba(59, 130, 246, 0.25);
      border-radius: 20px;
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
    }

    .card-top-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .card-title-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .badge-letter {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      background: #1e293b;
      border: 1px solid #334155;
      color: #e2e8f0;
      font-weight: 700;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .card-date-text {
      font-size: 1rem;
      font-weight: 700;
      color: #ffffff;
    }

    .btn-remover-day {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      border-radius: 14px;
      color: #f87171;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      font-size: 0.88rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-remover-day:hover {
      background: rgba(239, 68, 68, 0.25);
      color: #ef4444;
      border-color: #ef4444;
    }

    .btn-remover-day:active {
      transform: scale(0.96);
    }

    .btn-remover-day ion-icon {
      font-size: 18px;
    }

    /* Pílulas de Turno (Domingo) */
    .turnos-row {
      display: flex;
      gap: 10px;
    }

    .turno-pill-btn {
      flex: 1;
      height: 42px;
      border-radius: 21px;
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #94a3b8;
      font-size: 0.92rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.18s ease;
    }

    .turno-pill-btn.active {
      background: #0284c7;
      border-color: #38bdf8;
      color: #ffffff;
      box-shadow: 0 0 14px rgba(2, 132, 199, 0.5);
    }

    .turno-check-badge {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #ffffff;
      color: #0284c7;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
    }

    /* Campo Motivo Opcional */
    .motivo-box {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .motivo-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.82rem;
      color: #94a3b8;
    }

    .motivo-input-wrapper {
      background: rgba(15, 23, 42, 0.9);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 10px 14px;
    }

    .motivo-input-field {
      width: 100%;
      background: transparent;
      border: none;
      outline: none;
      color: #ffffff;
      font-size: 0.9rem;
    }

    .motivo-input-field::placeholder {
      color: #475569;
    }

    /* ========================= */
    /* Botão Confirmar           */
    /* ========================= */
    .btn-confirmar-indisp {
      width: 100%;
      height: 52px;
      border-radius: 26px;
      background: linear-gradient(135deg, #0284c7, #2563eb);
      border: 1px solid rgba(56, 189, 248, 0.4);
      color: #ffffff;
      font-size: 1.05rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(37, 99, 235, 0.45);
      transition: transform 0.16s ease;
    }

    .btn-confirmar-indisp:active {
      transform: scale(0.98);
    }

    /* ========================= */
    /* Adaptação Modo Claro      */
    /* ========================= */
    @media (prefers-color-scheme: light) {
      ion-content {
        --background: #f8fafc;
        --color: #0f172a;
      }

      .header-icon-box {
        background: #e0f2fe;
        border-color: #38bdf8;
      }

      .header-titulo {
        color: #0f172a;
      }

      .month-nav-title {
        color: #0f172a;
      }

      .day-cell.selectable {
        color: #0f172a;
      }

      .section-title {
        color: #0f172a;
      }

      .day-indisp-card {
        background: #ffffff;
        border-color: rgba(59, 130, 246, 0.2);
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
      }

      .card-date-text {
        color: #0f172a;
      }

      .turno-pill-btn {
        background: #f1f5f9;
        border-color: #cbd5e1;
        color: #475569;
      }

      .turno-pill-btn.active {
        background: #0284c7;
        color: #ffffff;
      }

      .motivo-input-wrapper {
        background: #f1f5f9;
        border-color: #cbd5e1;
      }

      .motivo-input-field {
        color: #0f172a;
      }
    }
  `],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class IndisponibilidadeModalComponent implements OnInit {
  @Input() existing: { data: string; turno?: string; motivo?: string }[] = [];

  currentYear: number;
  currentMonth: number;
  weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  // Dados dos dias selecionados no modal
  dayItems: DayIndisponibilidade[] = [];

  // Datas que já vieram registradas previamente
  datasComRegistroSet = new Set<string>();

  constructor(private modalCtrl: ModalController) {
    const now = new Date();
    this.currentYear = now.getFullYear();
    this.currentMonth = now.getMonth();
  }

  ngOnInit() {
    // Mapear registros prévios
    this.datasComRegistroSet.clear();
    const mapPorData = new Map<string, DayIndisponibilidade>();

    for (const ex of this.existing) {
      this.datasComRegistroSet.add(ex.data);
      const [ano, mes, dia] = ex.data.split('-').map(Number);
      const date = new Date(ano, mes - 1, dia);
      const dow = date.getDay();
      const diaSemana: 'quinta' | 'domingo' = dow === 4 ? 'quinta' : 'domingo';

      if (!mapPorData.has(ex.data)) {
        mapPorData.set(ex.data, {
          data: ex.data,
          diaNumero: dia,
          diaSemana,
          dataFormatada: this.formatarLabelData(ex.data, dow, dia, mes),
          manha: false,
          noite: false,
          motivo: ex.motivo || ''
        });
      }

      const item = mapPorData.get(ex.data)!;
      if (ex.motivo && !item.motivo) item.motivo = ex.motivo;
      if (diaSemana === 'domingo') {
        if (ex.turno === 'manha') item.manha = true;
        else if (ex.turno === 'noite') item.noite = true;
        else {
          item.manha = true;
          item.noite = true;
        }
      }
    }

    this.dayItems = Array.from(mapPorData.values()).sort((a, b) => a.data.localeCompare(b.data));
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
    return dow === 0 || dow === 4; // Domingos ou Quintas
  }

  hasSelecao(day: number): boolean {
    const key = this.key(day);
    return this.dayItems.some(item => item.data === key);
  }

  temRegistroPrevio(day: number): boolean {
    const key = this.key(day);
    return this.datasComRegistroSet.has(key);
  }

  toggleDay(day: number) {
    if (!this.isSelectable(day)) return;
    const key = this.key(day);
    const idx = this.dayItems.findIndex(i => i.data === key);

    if (idx >= 0) {
      // Já está selecionado -> desmarca
      this.dayItems.splice(idx, 1);
    } else {
      // Adiciona novo dia
      const date = new Date(this.currentYear, this.currentMonth, day);
      const dow = date.getDay();
      const diaSemana: 'quinta' | 'domingo' = dow === 4 ? 'quinta' : 'domingo';
      const novoItem: DayIndisponibilidade = {
        data: key,
        diaNumero: day,
        diaSemana,
        dataFormatada: this.formatarLabelData(key, dow, day, this.currentMonth + 1),
        manha: diaSemana === 'domingo', // Default manhã ativo para domingo
        noite: false,
        motivo: ''
      };
      this.dayItems.push(novoItem);
      this.dayItems.sort((a, b) => a.data.localeCompare(b.data));
    }
  }

  removerDay(item: DayIndisponibilidade) {
    const idx = this.dayItems.findIndex(i => i.data === item.data);
    if (idx >= 0) {
      this.dayItems.splice(idx, 1);
    }
  }

  toggleTurno(item: DayIndisponibilidade, turno: 'manha' | 'noite') {
    if (turno === 'manha') {
      item.manha = !item.manha;
    } else {
      item.noite = !item.noite;
    }
    // Se desmarcar os dois no domingo, garante que pelo menos um continue ou remove se desejado
    if (!item.manha && !item.noite) {
      if (turno === 'manha') item.noite = true;
      else item.manha = true;
    }
  }

  private formatarLabelData(dataStr: string, dow: number, dia: number, mes: number): string {
    const diaNome = dow === 4 ? 'Quinta-feira' : 'Domingo';
    const dd = String(dia).padStart(2, '0');
    const mm = String(mes).padStart(2, '0');
    return `${diaNome}, ${dd}/${mm}`;
  }

  private key(day: number): string {
    return `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  get canPrevMonth(): boolean {
    const now = new Date();
    return this.currentYear > now.getFullYear() ||
      (this.currentYear === now.getFullYear() && this.currentMonth > now.getMonth());
  }

  prevMonth() {
    if (!this.canPrevMonth) return;
    if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear--; }
    else this.currentMonth--;
  }

  nextMonth() {
    if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear++; }
    else this.currentMonth++;
  }

  confirm() {
    const itemsParaRetorno: { data: string; turno?: string; motivo?: string }[] = [];

    for (const item of this.dayItems) {
      const motivo = (item.motivo || '').trim();
      if (item.diaSemana === 'quinta') {
        // Quinta não possui seletores de turno
        itemsParaRetorno.push({
          data: item.data,
          motivo
        });
      } else {
        // Domingo: verifica se selecionou manhã, noite ou ambos
        if (item.manha && item.noite) {
          itemsParaRetorno.push({ data: item.data, turno: 'manha', motivo });
          itemsParaRetorno.push({ data: item.data, turno: 'noite', motivo });
        } else if (item.manha) {
          itemsParaRetorno.push({ data: item.data, turno: 'manha', motivo });
        } else if (item.noite) {
          itemsParaRetorno.push({ data: item.data, turno: 'noite', motivo });
        }
      }
    }

    this.modalCtrl.dismiss({ items: itemsParaRetorno });
  }

  cancel() {
    this.modalCtrl.dismiss(null);
  }
}
