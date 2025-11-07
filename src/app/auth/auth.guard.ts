// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // Verificar si el token no está expirado
    if (!authService.isTokenExpired()) {
      return true;
    } else {
      // Token expirado, hacer logout
      authService.logout();
      return false;
    }
  }

  // No está autenticado, redirigir al login
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url }
  });
  return false;
};
