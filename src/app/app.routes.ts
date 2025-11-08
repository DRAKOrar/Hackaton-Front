// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'products', pathMatch: 'full' },

  { path: 'register', loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent) },
  { path: 'login',    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent) },
  { path: 'inicio',   loadComponent: () => import('./pages/inicio/inicio.page').then(m => m.InicioPage) },

  {
    path: 'products',
    // canActivate: [authGuard], // si usas guard, descomenta
    children: [
      { path: '',          loadComponent: () => import('./pages/products/products.page').then(m => m.ProductsPage) },
      { path: 'new',       loadComponent: () => import('./pages/product-form/product-form.page').then(m => m.ProductFormPage) },
      { path: 'edit/:id',  loadComponent: () => import('./pages/product-form/product-form.page').then(m => m.ProductFormPage) },
      { path: ':id',       loadComponent: () => import('./pages/product-detail/product-detail.page').then(m => m.ProductDetailPage) },
    ]
  },

  { path: 'sale-form', loadComponent: () => import('./pages/sale-form/sale-form.page').then(m => m.SaleFormPage) },

  { path: '**', redirectTo: 'products' },
  {
    path: 'expense-form',
    loadComponent: () => import('./pages/expense-form/expense-form.page').then( m => m.ExpenseFormPage)
  }
];
