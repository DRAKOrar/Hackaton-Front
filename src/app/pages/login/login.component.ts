import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, LoginRequest } from 'src/app/services/auth-service';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonSpinner,
  IonNote,
  IonAlert,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle, IonIcon } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { environment } from 'src/environments/environment';
import { shieldCheckmarkOutline, personOutline, alertCircleOutline, lockClosedOutline, eyeOffOutline, eyeOutline, logInOutline, codeSlashOutline, personAddOutline, checkmarkCircle } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
    imports: [IonIcon,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    IonSpinner,
    IonNote,
    IonAlert,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    CommonModule,
    ReactiveFormsModule,
    CommonModule, RouterLink
  ]
})
export class LoginComponent  implements OnInit {
private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loginForm: FormGroup;
  isLoading = false;
  showErrorAlert = false;
  errorMessage = '';
  showPassword = false;

  // ← Hacer environment disponible en el template
  environment = environment;

  private authSubscription?: Subscription;

  constructor() {
    this.loginForm = this.createForm();
    addIcons({shieldCheckmarkOutline,personOutline,checkmarkCircle,alertCircleOutline,lockClosedOutline,logInOutline,codeSlashOutline,personAddOutline,eyeOffOutline,eyeOutline});
  }

  ngOnInit(): void {
    // Si ya está autenticado, redirigir al home
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/inicio']);
    }
  }

  ngOnDestroy(): void {
    this.authSubscription?.unsubscribe();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading = true;

      const credentials: LoginRequest = this.loginForm.value;

      this.authSubscription = this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Login exitoso', response);
          this.router.navigate(['/inicio']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error en login', error);

          // Manejar diferentes tipos de errores
          if (error.status === 401) {
            this.errorMessage = 'Credenciales incorrectas. Por favor, verifica tu usuario y contraseña.';
          } else if (error.status === 0) {
            this.errorMessage = 'Error de conexión. Verifica que el servidor esté en ejecución.';
          } else {
            this.errorMessage = error.error?.message || 'Error desconocido al intentar iniciar sesión.';
          }

          this.showErrorAlert = true;
        }
      });
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
    }
  }

   togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onAlertDismiss(): void {
    this.showErrorAlert = false;
  }

  // Método para llenar credenciales de prueba (solo desarrollo)
  fillTestCredentials(): void {
    this.loginForm.patchValue({
      username: 'testuser',
      password: 'password123'
    });
  }
}
