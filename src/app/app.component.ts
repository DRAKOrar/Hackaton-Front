import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp, IonRouterOutlet, IonItem, IonLabel, IonIcon, IonMenuToggle,
  IonContent, IonList, IonToolbar, IonHeader, IonTitle, IonMenu, IonButtons, IonButton
} from '@ionic/angular/standalone';
import { MenuController, AlertController, ToastController } from '@ionic/angular';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Subscription } from 'rxjs';

// Registrar iconos
import { addIcons } from 'ionicons';
import {
  closeOutline, cashOutline, homeOutline, cubeOutline,
  addCircleOutline, cartOutline, logInOutline, personAddOutline,
  logOutOutline, personOutline, chevronForwardOutline
} from 'ionicons/icons';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Servicios
import { AuthService, User } from './services/auth-service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [
    IonButton, IonButtons, IonTitle, IonHeader, IonToolbar, IonList, IonContent,
    IonIcon, IonLabel, IonItem, IonApp, IonRouterOutlet, IonMenuToggle, IonMenu,
    RouterLink, RouterLinkActive, CommonModule, FormsModule, ReactiveFormsModule
  ],
})
export class AppComponent implements OnInit, OnDestroy {
  private authSubscription: Subscription = new Subscription();

  constructor(
    private menuController: MenuController,
    private router: Router,
    private authService: AuthService,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      closeOutline, cashOutline, homeOutline, cubeOutline,
      addCircleOutline, cartOutline, logInOutline, personAddOutline,
      logOutOutline, personOutline, chevronForwardOutline
    });
  }

  // Propiedad para el usuario actual
  currentUser: User | null = null;

  async ngOnInit() {
    // Configurar StatusBar para Android
    if (Capacitor.getPlatform() === 'android') {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: '#132440' });
        await StatusBar.setStyle({ style: Style.Light });
      } catch { }
    }

    // Suscribirse a los cambios del usuario
    this.authSubscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        console.log('Usuario actualizado:', user);
      })
    );

    // Verificar expiración del token al iniciar
    this.authService.checkTokenExpiration();
  }

  ngOnDestroy() {
    // Limpiar suscripciones
    this.authSubscription.unsubscribe();
  }

  cerrarMenu() {
    const menu = document.querySelector('ion-menu');
    menu?.close();
  }

  getInitial(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  getUserDisplayName(): string {
    if (!this.currentUser) return 'Invitado';

    if (this.currentUser.firstName && this.currentUser.lastName) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }

    return this.currentUser.username || 'Usuario';
  }

  // Método para cerrar sesión
  async onLogout() {
    // Mostrar confirmación
    const alert = await this.alertController.create({
      header: 'Cerrar sesión',
      message: '¿Estás seguro de que deseas cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary'
        },
        {
          text: 'Cerrar sesión',
          role: 'confirm',
          cssClass: 'danger',
          handler: () => {
            this.performLogout();
          }
        }
      ]
    });

    await alert.present();
  }

  private async performLogout() {
    try {
      // Ejecutar logout del servicio
      this.authService.logout();

      // Cerrar menú
      this.cerrarMenu();

      // Mostrar mensaje de éxito
      await this.showToast('Sesión cerrada correctamente', 'success');

    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      await this.showToast('Error al cerrar sesión', 'danger');
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }

  // Método para navegar y cerrar menú
  navigateTo(route: string) {
    this.router.navigate([route]);
    this.cerrarMenu();
  }
}
