// src/app/services/fixed-expenses.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

export type Frequency = 'MONTHLY' | 'WEEKLY' | 'YEARLY';
export interface FixedExpense {
  id: number;
  name: string;
  description?: string;
  amount: number;
  frequency: Frequency;
  active?: boolean;
}
export interface CreateFixedExpenseRequest {
  name: string;
  description?: string;
  amount: number;
  frequency: Frequency;
}

@Injectable({ providedIn: 'root' })
export class FixedExpensesService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/api/fixed-expenses';

  getFixedExpenses(activeOnly?: boolean): Observable<FixedExpense[]> {
    let params = new HttpParams();
    if (activeOnly !== undefined) params = params.set('activeOnly', String(activeOnly));
    return this.http.get<FixedExpense[]>(this.apiUrl, { params });
  }

  createFixedExpense(body: CreateFixedExpenseRequest): Observable<FixedExpense> {
    return this.http.post<FixedExpense>(this.apiUrl, body);
  }

  updateFixedExpense(id: number, body: CreateFixedExpenseRequest): Observable<FixedExpense> {
    return this.http.put<FixedExpense>(`${this.apiUrl}/${id}`, body);
  }

  updateStatus(id: number, active: boolean) {
    const params = new HttpParams().set('active', String(active));
    return this.http.patch<void>(`${this.apiUrl}/${id}/status`, null, { params });
  }
}
