import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RegisterUserRequest } from 'src/app/auth/register-request.model';
import { AuthService, RegisterRequest } from 'src/app/services/auth-service';
import { LoadingController, ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonNote,
  IonButton,
  IonDatetime, IonSpinner, IonIcon, IonCol, IonRow, IonProgressBar, IonGrid, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';
function pastDateValidator(control: AbstractControl): ValidationErrors | null {
  const v = control.value as string | null;
  if (!v) return { required: true };
  // ion-datetime puede dar ISO; nos quedamos con YYYY-MM-DD
  const ymd = v.substring(0, 10);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [y, m, d] = ymd.split('-').map(Number);
  const asDate = new Date(y, (m - 1), d);
  return asDate.getTime() < today.getTime() ? null : { notPast: true };
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [IonBackButton, IonButtons, IonCardContent, IonCardTitle, IonCardSubtitle, IonCardHeader, IonCard, IonGrid, IonProgressBar, IonRow, IonCol, IonIcon, IonSpinner, CommonModule, FormsModule, ReactiveFormsModule, IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonNote,
    IonButton,
    IonDatetime, RouterLink],
})


export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm: FormGroup;
  isLoading = false;

  constructor() {
    this.registerForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      identityDocument: ['', [Validators.required, Validators.maxLength(50)]],
      dateOfBirth: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;

      const userData: RegisterRequest = {
        ...this.registerForm.value,
        dateOfBirth: this.formatDate(this.registerForm.value.dateOfBirth)
      };

      this.authService.register(userData).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Registro exitoso', response);
          this.router.navigate(['/login']);
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error en registro', error);
          // Aquí puedes manejar errores específicos
        }
      });
    } else {
      // Marcar todos los campos como touched para mostrar errores
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  }
}
