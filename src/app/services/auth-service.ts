// src/app/services/auth.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';
import { environment } from 'src/environment/environment';
import { Router } from '@angular/router';

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  identityDocument: string;
  dateOfBirth: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  expiresIn?: number;
}

export interface User {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl + '/api/auth';
  private http = inject(HttpClient);
  private router = inject(Router);

  private authToken = new BehaviorSubject<string | null>(this.getTokenFromStorage());
  private currentUser = new BehaviorSubject<User | null>(this.getUserFromStorage());

  public authToken$ = this.authToken.asObservable();
  public currentUser$ = this.currentUser.asObservable();

  register(userData: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData);
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.handleAuthentication(response);
        }),
        catchError(error => {
          this.clearAuthData();
          return throwError(() => error);
        })
      );
  }

  private handleAuthentication(response: AuthResponse): void {
    // Guardar token en localStorage
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('authData', JSON.stringify({
      username: response.username,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName
    }));

    // Actualizar BehaviorSubjects
    this.authToken.next(response.token);
    this.currentUser.next({
      username: response.username,
      email: response.email,
      firstName: response.firstName || '',
      lastName: response.lastName || ''
    });
  }

  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  private clearAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authData');
    this.authToken.next(null);
    this.currentUser.next(null);
  }

  private getTokenFromStorage(): string | null {
    return localStorage.getItem('authToken');
  }

  private getUserFromStorage(): User | null {
    const userData = localStorage.getItem('authData');
    return userData ? JSON.parse(userData) : null;
  }

  getToken(): string | null {
    return this.authToken.value;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    // Aquí podrías agregar validación de expiración del token
    return !!token;
  }

  // Verificar si el token está expirado (ejemplo básico)
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convertir a milisegundozzzzzzs
      return Date.now() > exp;
    } catch {
      return true;
    }
  }

  // Auto-logout si el token está expirado
  checkTokenExpiration(): void {
    if (this.isTokenExpired()) {
      this.logout();
    }
  }
}
