// src/app/services/transactions.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from 'src/environment/environment';

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface CreateIncomeWithCustomerId {
  type: 'INCOME';
  description: string;
  amount: number;
  productId: number;
  quantity: number;
  customerId: number;
  transactionDate: string; // 'YYYY-MM-DDTHH:mm:ss'
}

export interface CreateIncomeWithNewCustomer {
  type: 'INCOME';
  description: string;
  amount: number;
  productId: number;
  quantity: number;
  customer: {
    name: string;
    contactNumber?: string;
    email?: string;
  };
  transactionDate: string; // 'YYYY-MM-DDTHH:mm:ss'
}

export interface CreateExpense {
  type: 'EXPENSE';
  description: string;
  amount: number;
  transactionDate: string; // 'YYYY-MM-DDTHH:mm:ss'
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  transactionDate: string; // 'YYYY-MM-DDTHH:mm:ss'
}

export interface Transaction {
  id: number;
  type: 'INCOME' | 'EXPENSE';
  description?: string;
  amount: number;
  transactionDate: string;
  // si viene de venta:
  productId?: number;
  quantity?: number;
  customerId?: number;
}

export type TxQuery = {
  type?: 'INCOME' | 'EXPENSE';
  startDate?: string; // 'YYYY-MM-DDTHH:mm:ss'
  endDate?: string;   // 'YYYY-MM-DDTHH:mm:ss'
};

export interface TxSummary {
  // adapta estos nombres si tu backend devuelve otros
  totalAmount: number;
  count: number;
}

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private http = inject(HttpClient);

  // Base de transacciones
  private txUrl = `${environment.apiUrl}/api/transactions`;
  // Endpoints de summary (con userId & customStartDate/customEndDate)
  private incomeSummaryUrl  = `${this.txUrl}/income-summary`;
  private expenseSummaryUrl = `${this.txUrl}/expense-summary`;

  /** ------- CREACIÓN ------- */

  // Crear VENTA con cliente existente
  createIncomeWithCustomerId(body: CreateIncomeWithCustomerId): Observable<Transaction> {
    return this.http.post<Transaction>(this.txUrl, body);
  }

  // Crear VENTA con cliente nuevo “al vuelo”
  createIncomeWithNewCustomer(body: CreateIncomeWithNewCustomer): Observable<Transaction> {
    return this.http.post<Transaction>(this.txUrl, body);
  }

  // Crear EGRESO
  // transactions.service.ts
createExpense(body: CreateExpense | CreateExpenseRequest) {
  const finalBody: CreateExpense = {
    type: 'EXPENSE',
    description: body.description,
    amount: Number((body as any).amount),
    transactionDate: body.transactionDate
  };
  return this.http.post<Transaction>(this.txUrl, finalBody);
}


  /** ------- LISTADO ------- */

  // Listar transacciones con filtros opcionales
  getTransactions(params?: TxQuery): Observable<Transaction[]> {
    let p = new HttpParams();
    if (params?.type)      p = p.set('type', params.type);
    if (params?.startDate) p = p.set('startDate', params.startDate);
    if (params?.endDate)   p = p.set('endDate', params.endDate);

    return this.http.get<Transaction[]>(this.txUrl, { params: p });
  }

  /** ------- SUMMARIES por usuario y rango ------- */
  // NOTA: estos usan exactamente los nombres que pide tu backend:
  //  /api/transactions/income-summary?userId=14&customStartDate=YYYY-MM-DD&customEndDate=YYYY-MM-DD

  getIncomeSummary(userId: number, start: Date | string, end: Date | string): Observable<TxSummary> {
    const params = new HttpParams()
      .set('userId', String(userId))
      .set('customStartDate', this.dateOnly(start))
      .set('customEndDate',   this.dateOnly(end));

    return this.http.get<TxSummary>(this.incomeSummaryUrl, { params });
  }

  getExpenseSummary(userId: number, start: Date | string, end: Date | string): Observable<TxSummary> {
    const params = new HttpParams()
      .set('userId', String(userId))
      .set('customStartDate', this.dateOnly(start))
      .set('customEndDate',   this.dateOnly(end));

    return this.http.get<TxSummary>(this.expenseSummaryUrl, { params });
  }

  // Utilidad: obtener income + expense + neto en una sola llamada compuesta
  getTotals(userId: number, start: Date | string, end: Date | string): Observable<{ income: number; expense: number; net: number; }> {
    return forkJoin({
      inc: this.getIncomeSummary(userId, start, end),
      exp: this.getExpenseSummary(userId, start, end)
    }).pipe(
      map(({ inc, exp }) => {
        const income  = (inc?.totalAmount ?? 0);
        const expense = (exp?.totalAmount ?? 0);
        return { income, expense, net: income - expense };
      })
    );
  }

  /** ------- HELPERS DE FECHA ------- */

  // 'YYYY-MM-DDTHH:mm:ss' (para endpoints de listado)
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

  // 'YYYY-MM-DD' (para customStartDate/customEndDate en summaries)
  private dateOnly(value: Date | string): string {
    const d = (typeof value === 'string') ? new Date(value) : value;
    const pad = (x: number) => `${x}`.padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    return `${y}-${m}-${day}`;
  }
}
