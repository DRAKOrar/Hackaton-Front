// src/app/services/product.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, switchMap } from 'rxjs';
import { environment } from 'src/environment/environment';

export interface Product {
  id?: number;
  userId?: number;
  name: string;
  description?: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: string;
  image?: string;
  publication?: string | null;
  createdAt?: string;
  updatedAt?: string;
  active?: boolean;
  profitPerUnit?: number;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  unit: string;
  image?: string;
  publication?: string | null;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  costPrice?: number;
  salePrice?: number;
  stock?: number;
  minStock?: number;
  unit?: string;
  active?: boolean;
  image?: string;
  publication?: string | null;
}

export interface GeneratePublicacionRequest {
  productDetails: string;
  goal: string;
}

export interface GeneratePublicacionResponse {
  goal: string;
  productDetails: string;
  promotionText: string;
  promptUsed: string;
  [k: string]: unknown;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private baseUrl = environment.apiUrl.replace(/\/api\/.*$/, '');
  private apiUrl = `${this.baseUrl}/api/products`;
  private http = inject(HttpClient);

  constructor() {
    console.log('🔧 ProductService inicializado con baseUrl:', this.baseUrl);
    console.log('🔧 apiUrl:', this.apiUrl);
  }

  getProducts(activeOnly: boolean = true): Observable<Product[]> {
    const params = new HttpParams().set('activeOnly', activeOnly.toString());
    return this.http.get<Product[]>(this.apiUrl, { params });
  }

  getProductById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/${id}`);
  }

  createProduct(product: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(this.apiUrl, product);
  }

  updateProduct(id: number, product: UpdateProductRequest): Observable<Product> {
    return this.http.put<Product>(`${this.apiUrl}/${id}`, product);
  }

  updateStatus(id: number, active: boolean): Observable<void> {
    const params = new HttpParams().set('active', String(active));
    return this.http.patch<void>(`${this.apiUrl}/${id}/status`, null, { params });
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  generatePublicacion(productDetails: string, goal: string): Observable<GeneratePublicacionResponse> {
    const promotionsUrl = `${this.baseUrl}/api/promotions/generate`;
    console.log('🤖 Generando publicación en:', promotionsUrl);
    return this.http.post<GeneratePublicacionResponse>(
      promotionsUrl,
      { productDetails, goal }
    );
  }

  /**
   * VERSIÓN PUT: Actualizar publicación haciendo PUT completo
   * Primero obtiene el producto, luego hace PUT con todos los campos
   */
  updatePublicacion(productId: number, publication: string): Observable<Product> {
    console.log('📤 Iniciando actualización de publicación para producto:', productId);

    return this.getProductById(productId).pipe(
      switchMap(product => {
        console.log('📦 Producto obtenido:', product);

        // Preparar el objeto completo con todos los campos requeridos
        const fullProduct: UpdateProductRequest = {
          name: product.name,
          description: product.description || '',
          costPrice: product.costPrice,
          salePrice: product.salePrice,
          stock: product.stock,
          minStock: product.minStock,
          unit: product.unit,
          active: product.active ?? true,
          image: product.image || '',
          publication: publication.trim()
        };

        const url = `${this.apiUrl}/${productId}`;
        console.log('💾 Actualizando producto completo (PUT) en:', url);
        console.log('📋 Datos completos a enviar:', fullProduct);

        return this.http.put<Product>(url, fullProduct);
      })
    );
  }

  isLowStock(product: Product): boolean {
    return product.stock <= product.minStock;
  }

  calculateProfitMargin(product: Product): number {
    if (product.costPrice === 0) return 0;
    return ((product.salePrice - product.costPrice) / product.costPrice) * 100;
  }
}
