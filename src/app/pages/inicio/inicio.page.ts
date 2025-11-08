import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonMenuButton,
  IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel,
  IonBadge, IonRefresher, IonRefresherContent, IonSpinner, IonModal, IonDatetime,
  IonSegment, IonSegmentButton, IonSkeletonText, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import {
  cartOutline, refreshOutline, arrowDownOutline, trendingUpOutline, trendingDownOutline,
  cashOutline, calendarOutline, fileTrayOutline, arrowUpCircleOutline, arrowDownCircleOutline, filterOutline, chevronForwardOutline, listOutline, walletOutline } from 'ionicons/icons';

import { TransactionsService, Transaction } from '../../services/transaction-services';
import { debounceTime, filter, fromEvent, interval, merge, startWith, Subscription } from 'rxjs';

type TxTypeFilter = 'ALL' | 'INCOME' | 'EXPENSE';
type Period = '7d' | '30d' | 'custom';
type DatePickerTarget = 'start' | 'end' | null;
type TxExtra = {
  productId?: number;
  quantity?: number;
  customerId?: number;
  customer?: { name?: string } | null;
};
@Component({
  standalone: true,
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  imports: [
    CommonModule, FormsModule, RouterLink,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonMenuButton,
    IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonList, IonItem, IonLabel,
    IonBadge, IonRefresher, IonRefresherContent, IonSpinner, IonModal, IonDatetime,
    IonSegment, IonSegmentButton, IonSkeletonText, IonGrid, IonRow, IonCol
  ]
})
export class InicioPage implements OnInit {
   private tx = inject(TransactionsService);

  loading = false;

  // filtros
  period: Period = '7d';
  type: TxTypeFilter = 'ALL';
  range = {
    start: this.startOfNDays(7),
    end: this.endOfToday()
  };
  datePicker: DatePickerTarget = null;

  transactions: Transaction[] = [];
  totals = { income: 0, expense: 0, net: 0 };

  showTxModal = false;
  selectedTx: (Transaction & TxExtra) | null = null;

  // fecha para ion-datetime (yyyy-MM-dd)
  todayDateValue = this.dateValue(new Date());
  dateValue(d: Date) {
    const pad = (n: number) => `${n}`.padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  // ---- AUTO REFRESH ----
  private live = true;                // si la página está activa
  private liveSub?: Subscription;     // suscripción a triggers
  pollMs = 20000;                     // intervalo de sondeo (20s)
  private inFlight = false;           // evita solapes silenciosos

  constructor() {
    addIcons({cartOutline,walletOutline,filterOutline,calendarOutline,chevronForwardOutline,refreshOutline,trendingUpOutline,trendingDownOutline,cashOutline,listOutline,fileTrayOutline,arrowDownOutline,arrowUpCircleOutline,arrowDownCircleOutline});
  }

  ngOnInit(): void {
    this.fetch();            // primera carga
    this.startLiveRefresh(); // inicia el auto-refresco
  }

  ngOnDestroy(): void {
    this.stopLiveRefresh();
  }

  // Ionic lifecycle (cuando vuelves desde otra página)
  ionViewWillEnter() {
    this.live = true;
    this.fetchSilent();
  }
  ionViewDidLeave() {
    this.live = false;
  }

  // ------- DATA --------
  fetch(event?: CustomEvent, silent = false) {
    if (silent && (this.inFlight || this.loading)) return;

    if (!silent) this.loading = !event;
    if (silent) this.inFlight = true;

    const params = {
      type: this.type === 'ALL' ? undefined : this.type,
      startDate: this.naive(this.range.start, false),
      endDate: this.naive(this.range.end, true),
    };

    this.tx.getTransactions(params).subscribe({
      next: (list) => {
        this.transactions = [...list].sort(
          (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
        );
        this.computeTotals();
      },
      error: () => {},
      complete: () => {
        if (!silent) this.loading = false;
        this.inFlight = false;
        event?.detail.complete();
      }
    });
  }
  private fetchSilent() { this.fetch(undefined, true); }

  applyFilters() {
    if (this.period !== 'custom') {
      const days = this.period === '7d' ? 7 : 30;
      this.range.start = this.startOfNDays(days);
      this.range.end = this.endOfToday();
    }
    this.fetch(); // aplicar de una
  }

  onPeriodChange() {
    this.applyFilters(); // ya llama fetch()
  }

  refresh(ev: CustomEvent) {
    this.fetch(ev);
  }

  // -------- MODAL DETALLE --------
  openTx(t: Transaction) {
    this.selectedTx = t as Transaction & TxExtra;
    this.showTxModal = true;
  }
  closeTx() {
    this.showTxModal = false;
    this.selectedTx = null;
  }

  // -------- totals --------
  private computeTotals() {
    let inc = 0, exp = 0;
    for (const t of this.transactions) {
      if (t.type === 'INCOME') inc += t.amount;
      else if (t.type === 'EXPENSE') exp += t.amount;
    }
    this.totals.income = this.round2(inc);
    this.totals.expense = this.round2(exp);
    this.totals.net = this.round2(inc - exp);
  }

  // -------- date helpers --------
  openDate(target: DatePickerTarget) { this.datePicker = target; }

  setStart(value: string | string[] | null | undefined) {
    const v = Array.isArray(value) ? value[0] : value;
    if (!v) return;
    const d = new Date(`${v}T00:00:00`);
    d.setHours(0, 0, 0, 0);
    this.range.start = d;
    if (this.period === 'custom') this.fetch();
  }

  setEnd(value: string | string[] | null | undefined) {
    const v = Array.isArray(value) ? value[0] : value;
    if (!v) return;
    const d = new Date(`${v}T23:59:59`);
    d.setHours(23, 59, 59, 999);
    this.range.end = d;
    if (this.period === 'custom') this.fetch();
  }

  startOfNDays(n: number) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (n - 1));
    return d;
  }
  endOfToday() {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }

  // backend espera 'YYYY-MM-DDTHH:mm:ss' sin Z
  naive(date: Date, end = false) {
    const pad = (x: number) => x.toString().padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${y}-${m}-${d}T${hh}:${mm}:${ss}`;
  }

  // -------- UX helpers --------
  getTrend(type: 'income' | 'expense' | 'net'): number { return 0; }
  trackByTransaction(index: number, tx: any): string { return tx.id || index; }

  formatDateShort(d: Date) {
    return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: '2-digit' });
  }
  formatDateTime(iso: string) {
    const d = new Date(iso);
    return d.toLocaleString('es-CO', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }
  formatCurrency(n: number) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n || 0);
  }
  round2(n: number) { return Math.round((n + Number.EPSILON) * 100) / 100; }

  // ---- LIVE REFRESH IMPLEMENTATION ----
  private startLiveRefresh() {
    const onFocus$    = fromEvent(window, 'focus');
    const onVisible$  = fromEvent(document, 'visibilitychange').pipe(
      filter(() => document.visibilityState === 'visible')
    );
    const onOnline$   = fromEvent(window, 'online');
    const tick$       = interval(this.pollMs);

    this.liveSub = merge(onFocus$, onVisible$, onOnline$, tick$)
      .pipe(
        startWith(0),          // dispara al iniciar
        debounceTime(120),     // evita ráfagas
        filter(() => this.live)
      )
      .subscribe(() => this.fetchSilent());
  }

  private stopLiveRefresh() {
    this.liveSub?.unsubscribe();
  }
}
