// src/app/services/customers.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

export interface Customer {
  id: number;
  name: string;
  contactNumber?: string;
  email?: string;
}
export interface CreateCustomerRequest {
  name: string;
  contactNumber?: string;
  email?: string;
}

@Injectable({ providedIn: 'root' })
export class CustomersService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl + '/api/customers';

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl);
  }

  createCustomer(body: CreateCustomerRequest): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, body);
  }
}
