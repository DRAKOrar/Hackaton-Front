// src/app/services/product.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environment/environment';

export interface Product {
  id?: number;
  userId?: number;
  name: string;
  description?: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: string;
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
  profitPerUnit?: number;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  purchasePrice?: number;
  salePrice?: number;
  stock?: number;
  minStock?: number;
  unit?: string;
  active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiUrl + '/api/products';
  private http = inject(HttpClient);

  /**
   * Obtener todos los productos
   * @param activeOnly - Si es true, solo retorna productos activos
   */
  getProducts(activeOnly: boolean = true): Observable<Product[]> {
    const params = new HttpParams().set('activeOnly', activeOnly.toString());
    return this.http.get<Product[]>(this.apiUrl, { params });
  }

  /**
   * Obtener un producto por ID
   */
  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crear un nuevo producto
   */
  createProduct(product: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  /**
   * Actualizar un producto existente
   */
  updateProduct(id: number, product: UpdateProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  /**
   * Eliminar (desactivar) un producto
   */
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Verificar si un producto tiene stock bajo
   */
  isLowStock(product: Product): boolean {
    return product.stock <= product.minStock;
  }

  /**
   * Calcular el margen de ganancia porcentual
   */
  calculateProfitMargin(product: Product): number {
    if (product.purchasePrice === 0) return 0;
    return ((product.salePrice - product.purchasePrice) / product.purchasePrice) * 100;
  }
}
