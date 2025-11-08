import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonTextarea,
  IonItem,
  IonLabel,
  IonNote,
  IonSpinner,
  IonCard,
  IonCardContent,
  ModalController,
  ToastController,
  IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline,
  sendOutline,
  cloudUploadOutline,
  informationCircleOutline,
  checkmarkCircleOutline,
  newspaperOutline,
  cubeOutline,
  bulbOutline,
  alertCircleOutline,
  createOutline,
  textOutline
} from 'ionicons/icons';
import { ProductService } from '../../services/product-service';

@Component({
  selector: 'app-publicacion-modal',
  templateUrl: './publicacion-modal.component.html',
  styleUrls: ['./publicacion-modal.component.scss'],
  standalone: true,
  imports: [
    IonChip,
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonTextarea,
    IonItem,
    IonLabel,
    IonNote,
    IonSpinner,
    IonCard,
    IonCardContent
  ]
})
export class PublicacionModalComponent implements OnInit {
  @Input() productId!: number;
  @Input() currentPublicacion: string | null = null;
  @Input() productData?: any;  // ← Asegurarse de que tenga TODOS los campos del producto

  private fb = inject(FormBuilder);
  private modalController = inject(ModalController);
  private productService = inject(ProductService);
  private toastController = inject(ToastController);

  publicacionForm: FormGroup;
  isLoading = false;
  isProcessing = false;
  isPublishing = false;
  generatedText: string | null = null;

  constructor() {
    addIcons({
      newspaperOutline,
      closeOutline,
      cubeOutline,
      informationCircleOutline,
      bulbOutline,
      alertCircleOutline,
      sendOutline,
      createOutline,
      textOutline,
      cloudUploadOutline,
      checkmarkCircleOutline
    });

    this.publicacionForm = this.fb.group({
      goal: ['', [Validators.required, Validators.minLength(10)]],
      editableText: ['']
    });
  }

  ngOnInit() {
    // Si ya existe una publicación, mostrarla inmediatamente
    if (this.currentPublicacion && this.currentPublicacion.trim()) {
      this.generatedText = this.currentPublicacion;
      this.publicacionForm.patchValue({
        editableText: this.currentPublicacion
      });
    }

    // Establecer un goal por defecto sugerido
    if (!this.publicacionForm.get('goal')?.value) {
      this.publicacionForm.patchValue({
        goal: 'Necesito un texto breve y llamativo para una publicación en redes sociales que destaque las características y beneficios del producto'
      });
    }
  }

  // Construir detalles del producto para enviar a la IA
  private buildProductDetails(): string {
    if (!this.productData) return 'Producto sin detalles';

    const details = [
      `Nombre: ${this.productData.name}`,
      this.productData.description ? `Descripción: ${this.productData.description}` : '',
      `Precio de venta: $${this.productData.salePrice}`,
      `Stock disponible: ${this.productData.stock} ${this.productData.unit}`
    ].filter(Boolean).join('\n');

    return details;
  }

  // Generar publicación usando IA
  generatePublicacion() {
    if (this.publicacionForm.get('goal')?.invalid) {
      this.showToast('Por favor ingresa al menos 10 caracteres en el objetivo', 'warning');
      return;
    }

    this.isProcessing = true;
    const goal = this.publicacionForm.get('goal')?.value;
    const productDetails = this.buildProductDetails();

    console.log('🚀 Generando publicación con:', { productDetails, goal });

    this.productService.generatePublicacion(productDetails, goal).subscribe({
      next: (response) => {
        console.log('✅ Respuesta de la IA:', response);

        // Validar que la respuesta tenga el texto generado
        if (!response || !response.promotionText) {
          console.error('❌ La respuesta no contiene promotionText:', response);
          this.showToast('Error: La IA no generó texto', 'danger');
          this.isProcessing = false;
          return;
        }

        // Asignar el texto generado y mostrarlo
        this.generatedText = response.promotionText.trim();

        console.log('📝 Texto generado:', this.generatedText);

        // Actualizar el formulario con el texto generado
        this.publicacionForm.patchValue({
          editableText: this.generatedText
        });

        this.showToast('✨ Texto generado correctamente', 'success');
        this.isProcessing = false;
      },
      error: (error) => {
        console.error('❌ Error generando publicación:', error);

        // Mensaje de error más detallado
        let errorMsg = 'Error al generar el texto';

        if (error?.error?.message) {
          errorMsg = error.error.message;
        } else if (error?.message) {
          errorMsg = error.message;
        } else if (error?.status) {
          errorMsg = `Error del servidor (${error.status})`;
        }

        this.showToast(errorMsg, 'danger');
        this.isProcessing = false;
      }
    });
  }

  // Publicar/Actualizar el campo publicacion del producto
  publishPublicacion() {
    const editableText = this.publicacionForm.get('editableText')?.value;

    if (!editableText || editableText.trim().length === 0) {
      this.showToast('No hay texto para publicar', 'warning');
      return;
    }

    this.isPublishing = true;

    console.log('📤 Publicando texto para producto:', this.productId);

    this.productService.updatePublicacion(this.productId, editableText.trim()).subscribe({
      next: (updatedProduct) => {
        console.log('✅ Producto actualizado:', updatedProduct);

        this.showToast('✅ Publicación actualizada correctamente', 'success');
        this.isPublishing = false;

        // Cerrar el modal y notificar que se actualizó
        this.modalController.dismiss({
          updated: true,
          publicacion: editableText.trim()
        });
      },
      error: (error) => {
        console.error('❌ Error publicando:', error);

        const errorMsg = error?.error?.message || 'Error al publicar';
        this.showToast(errorMsg, 'danger');

        this.isPublishing = false;
      }
    });
  }

  // Cerrar modal sin guardar
  close() {
    this.modalController.dismiss({
      updated: false
    });
  }

  // Mostrar toast de notificación
  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  // Validar si un campo es inválido
  isFieldInvalid(fieldName: string): boolean {
    const field = this.publicacionForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  // Obtener preview de los detalles del producto
  getProductDetailsPreview(): string {
    return this.buildProductDetails();
  }

  // Contar caracteres del texto editable
  getCharacterCount(): number {
    const text = this.publicacionForm.get('editableText')?.value || '';
    return text.length;
  }
}
