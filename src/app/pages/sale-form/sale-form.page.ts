// src/app/pages/sales/sale-form/sale-form.page.ts
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
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
  IonDatetime,
  IonModal,
  ToastController,
  AlertController,
  IonBadge,
  IonSearchbar
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline,
  calculatorOutline,
  closeOutline,
  cartOutline,
  calendarOutline,
  cashOutline,
  cubeOutline,
  trendingUpOutline,
  checkmarkCircleOutline,
  searchOutline
} from 'ionicons/icons';
import { Product, ProductService } from '../../services/product-service';
import { CreateSaleRequest, SalesService } from '../../services/sales-service';

@Component({
  selector: 'app-sale-form',
  templateUrl: './sale-form.page.html',
  styleUrls: ['./sale-form.page.scss'],
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
    IonDatetime,
    IonModal,
    IonBadge,
    IonSearchbar,
    FormsModule, CommonModule, ReactiveFormsModule
  ]
})
export class SaleFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private salesService = inject(SalesService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  saleForm: FormGroup;
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProduct?: Product;
  isLoadingProducts = false;
  isSaving = false;
  showDatePicker = false;
  searchTerm = '';
  maxDateIso: string = new Date().toISOString();

  constructor() {
    addIcons({
      saveOutline,
      calculatorOutline,
      closeOutline,
      cartOutline,
      calendarOutline,
      cashOutline,
      cubeOutline,
      trendingUpOutline,
      checkmarkCircleOutline,
      searchOutline
    });

    this.saleForm = this.createForm();
    this.setupFormListeners();
  }

  ngOnInit() {
    this.loadProducts();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      productId: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      saleDate: [new Date().toISOString(), [Validators.required]],
      notes: ['']
    });
  }

  private setupFormListeners() {
    // Cuando cambia el producto seleccionado
    this.saleForm.get('productId')?.valueChanges.subscribe(productId => {
      this.onProductChange(productId);
    });

    // Cuando cambia la cantidad, validar stock
    this.saleForm.get('quantity')?.valueChanges.subscribe(() => {
      this.validateStock();
    });
  }

  private loadProducts() {
    this.isLoadingProducts = true;
    this.productService.getProducts(true).subscribe({
      next: (products) => {
        // Solo productos activos con stock
        this.products = products.filter(p => p.stock > 0);
        this.filteredProducts = [...this.products];
        this.isLoadingProducts = false;
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.showToast('Error al cargar productos', 'danger');
        this.isLoadingProducts = false;
      }
    });
  }

  onProductChange(productId: number) {
    this.selectedProduct = this.products.find(p => p.id === productId);

    if (this.selectedProduct) {
      // Actualizar precio unitario con el precio de venta del producto
      this.saleForm.patchValue({
        unitPrice: this.selectedProduct.salePrice
      }, { emitEvent: false });

      // Validar stock
      this.validateStock();
    }
  }

  validateStock() {
    const quantity = this.saleForm.get('quantity')?.value || 0;

    if (this.selectedProduct && quantity > this.selectedProduct.stock) {
      this.saleForm.get('quantity')?.setErrors({
        stockInsufficient: true,
        availableStock: this.selectedProduct.stock
      });
    }
  }

  onSearchProducts(event: any) {
    this.searchTerm = event.target.value?.toLowerCase() || '';

    if (this.searchTerm) {
      this.filteredProducts = this.products.filter(p =>
        p.name.toLowerCase().includes(this.searchTerm) ||
        p.description?.toLowerCase().includes(this.searchTerm)
      );
    } else {
      this.filteredProducts = [...this.products];
    }
  }

  get totalAmount(): number {
    const quantity = this.saleForm.get('quantity')?.value || 0;
    const unitPrice = this.saleForm.get('unitPrice')?.value || 0;
    return this.salesService.calculateTotal(quantity, unitPrice);
  }

  get estimatedProfit(): number {
    if (!this.selectedProduct) return 0;

    const quantity = this.saleForm.get('quantity')?.value || 0;
    const unitPrice = this.saleForm.get('unitPrice')?.value || 0;
    const profitPerUnit = unitPrice - this.selectedProduct.purchasePrice;

    return profitPerUnit * quantity;
  }

  get profitMargin(): number {
    if (!this.selectedProduct) return 0;

    const unitPrice = this.saleForm.get('unitPrice')?.value || 0;
    const purchasePrice = this.selectedProduct.purchasePrice;

    if (purchasePrice === 0) return 0;
    return ((unitPrice - purchasePrice) / purchasePrice) * 100;
  }

  get remainingStock(): number {
    if (!this.selectedProduct) return 0;
    const quantity = this.saleForm.get('quantity')?.value || 0;
    return this.selectedProduct.stock - quantity;
  }

  get willBeLowStock(): boolean {
    if (!this.selectedProduct) return false;
    return this.remainingStock <= this.selectedProduct.minStock && this.remainingStock > 0;
  }

  get stockStatus(): 'danger' | 'warning' | 'success' {
    if (this.remainingStock === 0) return 'danger';
    if (this.willBeLowStock) return 'warning';
    return 'success';
  }

  formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  onDateChange(event: any) {
    this.saleForm.patchValue({
      saleDate: event.detail.value
    });
    this.showDatePicker = false;
  }

  async onSubmit() {
    if (this.saleForm.invalid) {
      this.markFormGroupTouched(this.saleForm);
      this.showToast('Por favor completa todos los campos correctamente', 'warning');
      return;
    }

    // Validar stock una vez más
    if (this.selectedProduct &&
        this.saleForm.get('quantity')?.value > this.selectedProduct.stock) {
      this.showToast('Stock insuficiente para esta venta', 'danger');
      return;
    }

    // Confirmar si quedará con stock bajo
    if (this.willBeLowStock) {
      const alert = await this.alertController.create({
        header: 'Advertencia de Stock Bajo',
        message: `Después de esta venta, el stock quedará en ${this.remainingStock} ${this.selectedProduct?.unit}. El mínimo es ${this.selectedProduct?.minStock}.`,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel'
          },
          {
            text: 'Continuar',
            handler: () => {
              this.saveSale();
            }
          }
        ]
      });
      await alert.present();
      return;
    }

    this.saveSale();
  }

  private saveSale() {
    this.isSaving = true;
    const saleData: CreateSaleRequest = this.saleForm.value;

    this.salesService.createSale(saleData).subscribe({
      next: (sale) => {
        this.showToast('¡Venta registrada correctamente!', 'success');
        this.router.navigate(['/sales']);
      },
      error: (error) => {
        console.error('Error registrando venta:', error);

        let errorMsg = 'Error al registrar la venta';
        if (error.status === 400 && error.error?.message?.includes('stock')) {
          errorMsg = 'Stock insuficiente para esta venta';
        }

        this.showToast(errorMsg, 'danger');
        this.isSaving = false;
      }
    });
  }

  async onCancel() {
    if (this.saleForm.dirty) {
      const alert = await this.alertController.create({
        header: 'Descartar venta',
        message: '¿Estás seguro de que deseas descartar esta venta?',
        buttons: [
          {
            text: 'Continuar editando',
            role: 'cancel'
          },
          {
            text: 'Descartar',
            role: 'destructive',
            handler: () => {
              this.router.navigate(['/sales']);
            }
          }
        ]
      });
      await alert.present();
    } else {
      this.router.navigate(['/sales']);
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

  isFieldInvalid(fieldName: string): boolean {
    const field = this.saleForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getErrorMessage(fieldName: string): string {
    const field = this.saleForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    if (field.errors['required']) return 'Este campo es requerido';
    if (field.errors['min']) return `El valor mínimo es ${field.errors['min'].min}`;
    if (field.errors['stockInsufficient']) {
      return `Stock disponible: ${field.errors['availableStock']}`;
    }

    return 'Campo inválido';
  }
}
