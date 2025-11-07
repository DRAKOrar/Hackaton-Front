// src/app/pages/products/product-form/product-form.page.ts
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonBackButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonNote,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  ToastController,
  AlertController,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline,
  calculatorOutline,
  trendingUpOutline,
  closeOutline,
  checkmarkOutline
} from 'ionicons/icons';
import { Product, ProductService } from '../../services/product-service';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.page.html',
  styleUrls: ['./product-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonBackButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonNote,
    IonSpinner,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonChip,
    IonGrid,
    IonRow,
    IonCol
  ]
})
export class ProductFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  productForm: FormGroup;
  isLoading = false;
  isSaving = false;
  isEditMode = false;
  productId?: number;
  product?: Product;

  // Unidades predefinidas
  units = [
    'unidades',
    'kilogramos',
    'gramos',
    'litros',
    'metros',
    'cajas',
    'paquetes',
    'docenas',
    'pares'
  ];

  constructor() {
    addIcons({
      saveOutline,
      calculatorOutline,
      trendingUpOutline,
      closeOutline,
      checkmarkOutline
    });

    this.productForm = this.createForm();
    this.setupFormListeners();
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id && id !== 'new') {
      this.isEditMode = true;
      this.productId = parseInt(id, 10);
      this.loadProduct();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      purchasePrice: [0, [Validators.required, Validators.min(0)]],
      salePrice: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      minStock: [0, [Validators.required, Validators.min(0)]],
      unit: ['unidades', [Validators.required]],
      active: [true]
    });
  }

  private setupFormListeners() {
    // Actualizar precio de venta automáticamente si cambia el precio de compra
    this.productForm.get('purchasePrice')?.valueChanges.subscribe(() => {
      this.calculateSuggestedPrice();
    });
  }

  private loadProduct() {
    if (!this.productId) return;

    this.isLoading = true;
    this.productService.getProductById(this.productId).subscribe({
      next: (product) => {
        this.product = product;
        this.populateForm(product);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error cargando producto:', error);
        this.showToast('Error al cargar el producto', 'danger');
        this.isLoading = false;
        this.router.navigate(['/products']);
      }
    });
  }

  private populateForm(product: Product) {
    this.productForm.patchValue({
      name: product.name,
      description: product.description || '',
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      stock: product.stock,
      minStock: product.minStock,
      unit: product.unit,
      active: product.active ?? true
    });
  }

  calculateSuggestedPrice() {
    const purchasePrice = this.productForm.get('purchasePrice')?.value || 0;
    // Sugerir un margen del 40%
    const suggestedPrice = purchasePrice * 1.4;

    // No sobrescribir si ya hay un precio de venta mayor que 0
    const currentSalePrice = this.productForm.get('salePrice')?.value || 0;
    if (currentSalePrice === 0 && suggestedPrice > 0) {
      this.productForm.patchValue({ salePrice: suggestedPrice }, { emitEvent: false });
    }
  }

  get profitPerUnit(): number {
    const purchase = this.productForm.get('purchasePrice')?.value || 0;
    const sale = this.productForm.get('salePrice')?.value || 0;
    return sale - purchase;
  }

  get profitMargin(): number {
    const purchase = this.productForm.get('purchasePrice')?.value || 0;
    const sale = this.productForm.get('salePrice')?.value || 0;

    if (purchase === 0) return 0;
    return ((sale - purchase) / purchase) * 100;
  }

  get isProfitPositive(): boolean {
    return this.profitPerUnit > 0;
  }

  async onSubmit() {
    if (this.productForm.invalid) {
      this.markFormGroupTouched(this.productForm);
      this.showToast('Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    // Validar que el precio de venta sea mayor al de compra
    if (this.profitPerUnit < 0) {
      const alert = await this.alertController.create({
        header: 'Precio de venta bajo',
        message: 'El precio de venta es menor al precio de compra. ¿Deseas continuar?',
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Continuar',
            handler: () => {
              this.saveProduct();
            }
          }
        ]
      });
      await alert.present();
      return;
    }

    this.saveProduct();
  }

  private saveProduct() {
    this.isSaving = true;
    const formData = this.productForm.value;

    if (this.isEditMode && this.productId) {
      // Actualizar producto existente
      this.productService.updateProduct(this.productId, formData).subscribe({
        next: () => {
          this.showToast('Producto actualizado correctamente', 'success');
          this.router.navigate(['/products']);
        },
        error: (error) => {
          console.error('Error actualizando producto:', error);
          this.showToast('Error al actualizar el producto', 'danger');
          this.isSaving = false;
        }
      });
    } else {
      // Crear nuevo producto
      this.productService.createProduct(formData).subscribe({
        next: () => {
          this.showToast('Producto creado correctamente', 'success');
          this.router.navigate(['/products']);
        },
        error: (error) => {
          console.error('Error creando producto:', error);
          this.showToast('Error al crear el producto', 'danger');
          this.isSaving = false;
        }
      });
    }
  }

  async onCancel() {
    if (this.productForm.dirty) {
      const alert = await this.alertController.create({
        header: 'Descartar cambios',
        message: '¿Estás seguro de que deseas descartar los cambios?',
        buttons: [
          {
            text: 'Continuar editando',
            role: 'cancel'
          },
          {
            text: 'Descartar',
            role: 'destructive',
            handler: () => {
              this.router.navigate(['/products']);
            }
          }
        ]
      });
      await alert.present();
    } else {
      this.router.navigate(['/products']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
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

  // Helpers para validación en template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.productForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.productForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
    if (field.errors['maxlength']) return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
    if (field.errors['min']) return `El valor mínimo es ${field.errors['min'].min}`;

    return 'Campo inválido';
  }
}
