// src/app/services/transactions.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

export type TransactionType = 'INCOME' | 'EXPENSE';

export interface CreateIncomeWithCustomerId {
  type: 'INCOME';
  description: string;
  amount: number;
  productId: number;
  quantity: number;
  customerId: number;
  transactionDate: string; // ISO: 2025-01-15T10:30:00
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
  transactionDate: string;
}

export interface CreateExpense {
  type: 'EXPENSE';
  description: string;
  amount: number;
  transactionDate: string;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  description: string;
  amount: number;
  productId?: number;
  quantity?: number;
  customerId?: number;
  transactionDate: string;
}

@Injectable({ providedIn: 'root' })
export class TransactionsService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/api/transactions';

  // Crear VENTA con cliente existente
  createIncomeWithCustomerId(body: CreateIncomeWithCustomerId): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, body);
  }

  // Crear VENTA con cliente nuevo “al vuelo”
  createIncomeWithNewCustomer(body: CreateIncomeWithNewCustomer): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, body);
  }

  // Crear EGRESO
  createExpense(body: CreateExpense): Observable<Transaction> {
    return this.http.post<Transaction>(this.apiUrl, body);
  }

  // Listar transacciones con filtros opcionales
  getTransactions(params?: {
    type?: TransactionType;
    startDate?: string; // '2025-01-01T00:00:00'
    endDate?: string;   // '2025-01-31T23:59:59'
  }): Observable<Transaction[]> {
    let p = new HttpParams();
    if (params?.type) p = p.set('type', params.type);
    if (params?.startDate) p = p.set('startDate', params.startDate);
    if (params?.endDate) p = p.set('endDate', params.endDate);
    return this.http.get<Transaction[]>(this.apiUrl, { params: p });
  }
}
