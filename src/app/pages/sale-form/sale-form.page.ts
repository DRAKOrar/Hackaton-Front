import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonBackButton, IonMenuButton,
  IonIcon, IonList, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption, IonNote,
  IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonChip, IonDatetime, IonModal,
  ToastController, AlertController, IonBadge, IonSearchbar, IonSegment, IonSegmentButton
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  cartOutline, closeOutline, cubeOutline, cashOutline, calculatorOutline, calendarOutline,
  chevronForwardOutline, warningOutline, checkmarkCircleOutline, saveOutline, peopleOutline
} from 'ionicons/icons';

import { FormsModule } from '@angular/forms';
import { Product, ProductService } from '../../services/product-service';
import { CustomersService, Customer } from '../..//services/customer-services';
import { TransactionsService } from '../../services/transaction-services';

type StockBadge = 'danger' | 'warning' | 'success';

@Component({
  selector: 'app-sale-form',
  templateUrl: './sale-form.page.html',
  styleUrls: ['./sale-form.page.scss'],
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonBackButton, IonMenuButton,
    IonIcon, IonList, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption, IonNote,
    IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonChip, IonDatetime, IonModal,
    IonBadge, IonSearchbar, IonSegment, IonSegmentButton
  ]
})
export class SaleFormPage implements OnInit {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  private productsSrv = inject(ProductService);
  private customersSrv = inject(CustomersService);
  private txSrv = inject(TransactionsService);

  saleForm: FormGroup;

  // Productos
  products: Product[] = [];
  filteredProducts: Product[] = [];
  selectedProduct?: Product;
  isLoadingProducts = false;
  productSearch = '';

  // Clientes
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  customerSearch = '';
  customerMode: 'existing' | 'new' = 'existing';

  // Estado general
  isSaving = false;
  showDatePicker = false;
  maxDateIso: string = new Date().toISOString();

  // Valores calculados
  totalAmount = 0;
  estimatedProfit = 0;
  profitMargin = 0;
  remainingStock = 0;
  willBeLowStock = false;
  stockStatus: StockBadge = 'success';

  constructor() {
    addIcons({
      cartOutline, closeOutline, cubeOutline, cashOutline, calculatorOutline, calendarOutline,
      chevronForwardOutline, warningOutline, checkmarkCircleOutline, saveOutline, peopleOutline
    });

    this.saleForm = this.createForm();
    this.setupFormListeners();
  }

  ngOnInit() {
    this.loadProducts();
    this.loadCustomers();
  }

  // ------------------ FORM ------------------

  private createForm(): FormGroup {
    return this.fb.group({
      productId: [null, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      saleDate: [new Date().toISOString(), [Validators.required]],
      notes: [''],

      // cliente existente
      customerId: [null],

      // cliente nuevo
      customerName: [''],
      customerPhone: [''],
      customerEmail: ['']
    });
  }

  private setupFormListeners() {
    this.saleForm.get('productId')?.valueChanges.subscribe((id) => this.onProductChange(id));
    this.saleForm.get('quantity')?.valueChanges.subscribe(() => { this.validateStock(); this.calculateValues(); });
    this.saleForm.get('unitPrice')?.valueChanges.subscribe(() => this.calculateValues());
  }

  // Cambia validadores según modo cliente
  onCustomerModeChange() {
    const idCtrl = this.saleForm.get('customerId');
    const nameCtrl = this.saleForm.get('customerName');

    if (this.customerMode === 'existing') {
      idCtrl?.addValidators([Validators.required]);
      nameCtrl?.clearValidators();
      nameCtrl?.updateValueAndValidity();
      idCtrl?.updateValueAndValidity();
    } else {
      nameCtrl?.addValidators([Validators.required, Validators.minLength(3)]);
      idCtrl?.clearValidators();
      idCtrl?.updateValueAndValidity();
      nameCtrl?.updateValueAndValidity();
    }
  }

  // ------------------ LOAD DATA ------------------

  private loadProducts() {
    this.isLoadingProducts = true;
    this.productsSrv.getProducts(true).subscribe({
      next: (list) => {
        this.products = list.filter(p => p.stock > 0);
        this.filteredProducts = [...this.products];
        this.isLoadingProducts = false;
      },
      error: () => {
        this.showToast('Error al cargar productos', 'danger');
        this.isLoadingProducts = false;
      }
    });
  }

  private loadCustomers() {
    this.customersSrv.getCustomers().subscribe({
      next: (list) => {
        this.customers = list;
        this.filteredCustomers = [...list];
      },
      error: () => {
        // no bloquea el formulario si falla
      }
    });
  }

  // ------------------ UI events ------------------

  onSearchProducts(ev: any) {
    const q = (ev.target.value || '').toLowerCase();
    this.productSearch = q;
    this.filteredProducts = q
      ? this.products.filter(p => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      : [...this.products];
  }

  onSearchCustomers(ev: any) {
    const q = (ev.target.value || '').toLowerCase();
    this.customerSearch = q;
    this.filteredCustomers = q
      ? this.customers.filter(c => (c.name || '').toLowerCase().includes(q) || (c.contactNumber || '').includes(q))
      : [...this.customers];
  }

  onProductSelection() {
    const id = this.saleForm.get('productId')?.value;
    this.onProductChange(id);
  }

  private onProductChange(productId: number) {
    this.selectedProduct = this.products.find(p => p.id === productId);

    if (this.selectedProduct) {
      this.saleForm.patchValue({ unitPrice: this.selectedProduct.salePrice }, { emitEvent: false });
      this.validateStock();
      this.calculateValues();
    } else {
      this.totalAmount = 0;
      this.estimatedProfit = 0;
      this.profitMargin = 0;
      this.remainingStock = 0;
      this.willBeLowStock = false;
      this.stockStatus = 'success';
    }
  }

  onQuantityChange() { this.validateStock(); this.calculateValues(); }
  onPriceChange() { this.calculateValues(); }

  onDateChange(event: any) {
    this.saleForm.patchValue({ saleDate: event.detail.value });
    this.showDatePicker = false;
  }

  // ------------------ CALCULOS ------------------

  private validateStock() {
    const qty = this.saleForm.get('quantity')?.value || 0;
    if (this.selectedProduct && qty > this.selectedProduct.stock) {
      this.saleForm.get('quantity')?.setErrors({ stockInsufficient: true, availableStock: this.selectedProduct.stock });
    }
  }

  private calculateValues() {
    this.calculateTotal();
    this.calculateProfit();
    this.calculateStockStatus();
  }

  private calculateTotal() {
    const q = this.saleForm.get('quantity')?.value || 0;
    const price = this.saleForm.get('unitPrice')?.value || 0;
    this.totalAmount = q * price;
  }

  private calculateProfit() {
    if (!this.selectedProduct) { this.estimatedProfit = 0; this.profitMargin = 0; return; }
    const q = this.saleForm.get('quantity')?.value || 0;
    const price = this.saleForm.get('unitPrice')?.value || 0;
    const cost = this.selectedProduct.costPrice * q;

    this.estimatedProfit = (price * q) - cost;
    this.profitMargin = cost > 0 ? (this.estimatedProfit / cost) * 100 : (price > 0 ? 100 : 0);
  }

  private calculateStockStatus() {
    if (!this.selectedProduct) { this.remainingStock = 0; this.willBeLowStock = false; this.stockStatus = 'success'; return; }
    const q = this.saleForm.get('quantity')?.value || 0;
    this.remainingStock = this.selectedProduct.stock - q;
    this.willBeLowStock = this.remainingStock <= this.selectedProduct.minStock && this.remainingStock > 0;
    this.stockStatus = this.remainingStock <= 0 ? 'danger' : (this.willBeLowStock ? 'warning' : 'success');
  }

  // ------------------ SUBMIT ------------------

  async onSubmit() {
    if (this.saleForm.invalid) {
      this.markFormGroupTouched(this.saleForm);
      this.showToast('Completa los campos requeridos', 'warning');
      return;
    }

    if (this.selectedProduct && this.saleForm.get('quantity')?.value > this.selectedProduct.stock) {
      this.showToast('Stock insuficiente para esta venta', 'danger');
      return;
    }

    if (this.willBeLowStock) {
      const alert = await this.alertController.create({
        header: 'Stock bajo',
        message: `El stock quedará en ${this.remainingStock} ${this.selectedProduct?.unit} (mínimo: ${this.selectedProduct?.minStock}).`,
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Continuar', handler: () => this.saveSale() }
        ]
      });
      await alert.present();
      return;
    }

    this.saveSale();
  }

  private saveSale() {
    if (!this.selectedProduct) return;

    this.isSaving = true;
    const q = Number(this.saleForm.get('quantity')?.value || 0);
    const unitPrice = Number(this.saleForm.get('unitPrice')?.value || 0);

    // Cuerpo base para INCOME
    const base = {
      type: 'INCOME' as const,
      description: this.saleForm.get('notes')?.value || 'Venta de productos',
      amount: Number((q * unitPrice).toFixed(2)),
      productId: this.selectedProduct.id!,
      quantity: q,
      transactionDate: this.saleForm.get('saleDate')?.value
    };

    // Llama al endpoint según modo cliente
    const req$ = this.customerMode === 'existing'
      ? this.txSrv.createIncomeWithCustomerId({
          ...base,
          customerId: this.saleForm.get('customerId')?.value
        })
      : this.txSrv.createIncomeWithNewCustomer({
          ...base,
          customer: {
            name: this.saleForm.get('customerName')?.value,
            contactNumber: this.saleForm.get('customerPhone')?.value || undefined,
            email: this.saleForm.get('customerEmail')?.value || undefined
          }
        });

    req$.subscribe({
      next: () => {
        this.showToast('¡Venta registrada correctamente!', 'success');
        this.router.navigate(['/products']); // o a un historial si lo creas
      },
      error: (err) => {
        let msg = 'Error al registrar la venta';
        if (err?.status === 400 && String(err?.error?.message || '').includes('stock')) {
          msg = 'Stock insuficiente para esta venta';
        }
        this.showToast(msg, 'danger');
        this.isSaving = false;
      }
    });
  }

  // ------------------ UTILS ------------------

  formatDate(isoDate: string): string {
    const d = new Date(isoDate);
    return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  async onCancel() {
    if (this.saleForm.dirty) {
      const alert = await this.alertController.create({
        header: 'Descartar venta',
        message: '¿Deseas descartar los cambios?',
        buttons: [
          { text: 'Seguir editando', role: 'cancel' },
          { text: 'Descartar', role: 'destructive', handler: () => this.router.navigate(['/products']) }
        ]
      });
      await alert.present();
    } else {
      this.router.navigate(['/products']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => formGroup.get(key)?.markAsTouched());
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning') {
    const t = await this.toastController.create({ message, duration: 2200, color, position: 'top' });
    await t.present();
  }

  isFieldInvalid(field: string): boolean {
    const c = this.saleForm.get(field);
    return !!(c && c.invalid && c.touched);
  }

  getErrorMessage(field: string): string {
    const c = this.saleForm.get(field);
    if (!c || !c.errors || !c.touched) return '';
    if (c.errors['required']) return 'Este campo es requerido';
    if (c.errors['min']) return `El valor mínimo es ${c.errors['min'].min}`;
    if (c.errors['stockInsufficient']) return `Stock disponible: ${c.errors['availableStock']}`;
    if (c.errors['minlength']) return `Mínimo ${c.errors['minlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }
}
