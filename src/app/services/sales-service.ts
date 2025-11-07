// src/app/services/sales.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

export interface Sale {
  id?: number;
  userId?: number;
  productId: number;
  productName?: string;
  quantity: number;
  unitPrice: number;
  totalAmount?: number;
  profit?: number;
  saleDate: string;
  notes?: string;
  createdAt?: string;
}

export interface CreateSaleRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  notes?: string;
  saleDate?: string;
}

export interface SalesSummary {
  totalSales: number;
  totalProfit: number;
  salesCount: number;
  averageTicket: number;
  topProducts: {
    productId: number;
    productName: string;
    quantity: number;
    total: number;
  }[];
}

export interface SalesFilters {
  startDate?: string;
  endDate?: string;
  productId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SalesService {
  private apiUrl = environment.apiUrl + '/api/sales';
  private http = inject(HttpClient);

  /**
   * Obtener todas las ventas con filtros opcionales
   */
  getSales(filters?: SalesFilters): Observable<Sale[]> {
    let params = new HttpParams();

    if (filters?.startDate) {
      params = params.set('startDate', filters.startDate);
    }
    if (filters?.endDate) {
      params = params.set('endDate', filters.endDate);
    }
    if (filters?.productId) {
      params = params.set('productId', filters.productId.toString());
    }

    return this.http.get<Sale[]>(this.apiUrl, { params });
  }

  /**
   * Obtener una venta por ID
   */
  getSaleById(id: number): Observable<Sale> {
    return this.http.get<Sale>(`${this.apiUrl}/${id}`);
  }

  /**
   * Registrar una nueva venta
   */
  createSale(sale: CreateSaleRequest): Observable<Sale> {
    // Si no se proporciona fecha, usar la actual
    const saleData = {
      ...sale,
      saleDate: sale.saleDate || new Date().toISOString()
    };

    return this.http.post<Sale>(this.apiUrl, saleData);
  }

  /**
   * Calcular el total de una venta
   */
  calculateTotal(quantity: number, unitPrice: number): number {
    return quantity * unitPrice;
  }

  /**
   * Formatear fecha para el backend (yyyy-MM-dd HH:mm:ss)
   */
  formatSaleDate(date: Date): string {
    return date.toISOString();
  }

  /**
   * Agrupar ventas por fecha
   */
  groupByDate(sales: Sale[]): Map<string, Sale[]> {
    const grouped = new Map<string, Sale[]>();

    sales.forEach(sale => {
      const date = sale.saleDate.split('T')[0]; // Obtener solo la fecha

      if (!grouped.has(date)) {
        grouped.set(date, []);
      }

      grouped.get(date)?.push(sale);
    });

    return grouped;
  }

  /**
   * Calcular resumen de ventas
   */
  calculateSummary(sales: Sale[]): SalesSummary {
    const totalSales = sales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
    const totalProfit = sales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
    const salesCount = sales.length;
    const averageTicket = salesCount > 0 ? totalSales / salesCount : 0;

    // Calcular productos más vendidos
    const productMap = new Map<number, { name: string; quantity: number; total: number }>();

    sales.forEach(sale => {
      const existing = productMap.get(sale.productId);

      if (existing) {
        existing.quantity += sale.quantity;
        existing.total += sale.totalAmount || 0;
      } else {
        productMap.set(sale.productId, {
          name: sale.productName || '',
          quantity: sale.quantity,
          total: sale.totalAmount || 0
        });
      }
    });

    const topProducts = Array.from(productMap.entries())
      .map(([productId, data]) => ({
        productId,
        productName: data.name,
        quantity: data.quantity,
        total: data.total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    return {
      totalSales,
      totalProfit,
      salesCount,
      averageTicket,
      topProducts
    };
  }
}
