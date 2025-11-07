import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [

  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'inicio',
    loadComponent: () => import('./pages/inicio/inicio.page').then( m => m.InicioPage)
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/products/products.page').then( m => m.ProductsPage)
  },// RUTAS DE PRODUCTOS
  {
    path: 'products',
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/products/products.page').then(m => m.ProductsPage)
      },
      {
        path: 'new',
        loadComponent: () => import('./pages/product-form/product-form.page').then(m => m.ProductFormPage)
      },
      /* {
        path: 'edit/:id',
        loadComponent: () => import('./pages/products/product-form/product-form.page').then(m => m.ProductFormPage)
      },*/
      {
        path: ':id',
        loadComponent: () => import('./pages/product-detail/product-detail.page').then(m => m.ProductDetailPage)
      }
    ]
  },
  {
    path: 'sale-form',
    loadComponent: () => import('./pages/sale-form/sale-form.page').then( m => m.SaleFormPage)
  }
];
