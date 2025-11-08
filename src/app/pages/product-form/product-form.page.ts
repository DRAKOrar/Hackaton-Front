import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonBackButton, IonIcon, IonList, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption, IonNote, IonSpinner, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonChip, ToastController, AlertController, IonGrid, IonRow, IonCol, IonImg, IonMenuButton, ModalController, IonItemOption, IonItemOptions, IonBadge, IonSegmentButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  saveOutline,
  calculatorOutline,
  trendingUpOutline,
  closeOutline,
  checkmarkOutline,
  cameraOutline,
  imageOutline,
  trashOutline,
  cubeOutline,
  businessOutline,
  warningOutline,
  newspaperOutline, refreshOutline, cashOutline, cartOutline, createOutline, addOutline, checkmarkCircleOutline } from 'ionicons/icons';
import { Product, ProductService } from '../../services/product-service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { PublicacionModalComponent } from '../../components/publicacion-modal/publicacion-modal.component';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.page.html',
  styleUrls: ['./product-form.page.scss'],
  standalone: true,
  imports: [IonSegmentButton, IonBadge, IonItemOptions, IonItemOption,
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
    IonCol,
    IonImg,
    IonMenuButton
]
})
export class ProductFormPage implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);
  private modalController = inject(ModalController);

  productForm: FormGroup;
  isLoading = false;
  isSaving = false;
  isEditMode = false;
  productId?: number;
  product?: Product;

  profitPerUnit: number = 0;
  profitMargin: number = 0;
  isProfitPositive: boolean = true;
  showProfitIndicators: boolean = false;
  showLowStockWarning: boolean = false;
  imagePreview: string | null = null;

  units = [
    'unidad',
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
    addIcons({closeOutline,imageOutline,trashOutline,cameraOutline,cubeOutline,calculatorOutline,trendingUpOutline,businessOutline,warningOutline,newspaperOutline,checkmarkCircleOutline,saveOutline,refreshOutline,cashOutline,cartOutline,createOutline,addOutline,checkmarkOutline});

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
      costPrice: [0, [Validators.required, Validators.min(0)]],
      salePrice: [0, [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      minStock: [0, [Validators.required, Validators.min(0)]],
      unit: ['unidad', [Validators.required]],
      active: [true],
      image: [''],
      publication: [null] // Nuevo campo, siempre null al crear
    });
  }

  private setupFormListeners() {
    this.productForm.get('costPrice')?.valueChanges.subscribe(() => {
      this.calculateSuggestedPrice();
      this.calculateProfitIndicators();
    });

    this.productForm.get('salePrice')?.valueChanges.subscribe(() => {
      this.calculateProfitIndicators();
    });

    this.productForm.get('stock')?.valueChanges.subscribe(() => {
      this.checkStockWarning();
    });

    this.productForm.get('minStock')?.valueChanges.subscribe(() => {
      this.checkStockWarning();
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
        this.calculateProfitIndicators();
        this.checkStockWarning();
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
      costPrice: product.costPrice,
      salePrice: product.salePrice,
      stock: product.stock,
      minStock: product.minStock,
      unit: product.unit || 'unidad',
      active: product.active ?? true,
      image: product.image || '',
      publication: product.publication || null
    });

    if (product.image) {
      this.imagePreview = this.base64ToDataUrl(product.image);
    }
  }

  private calculateSuggestedPrice() {
    const costPrice = this.productForm.get('costPrice')?.value || 0;
    const suggestedPrice = costPrice * 1.4;

    const currentSalePrice = this.productForm.get('salePrice')?.value || 0;
    if (currentSalePrice === 0 && suggestedPrice > 0) {
      this.productForm.patchValue({ salePrice: suggestedPrice }, { emitEvent: false });
    }
  }

  onImageLoad() {
    console.log('Imagen cargada correctamente');
  }

  onImageError() {
    console.error('Error al cargar la imagen');
    this.showToast('Error al cargar la imagen', 'danger');
  }

  onPriceChange() {
    this.calculateProfitIndicators();
  }

  onStockChange() {
    this.checkStockWarning();
  }

  private calculateProfitIndicators() {
    const costPrice = this.productForm.get('costPrice')?.value || 0;
    const salePrice = this.productForm.get('salePrice')?.value || 0;

    this.profitPerUnit = salePrice - costPrice;
    this.profitMargin = costPrice > 0 ? (this.profitPerUnit / costPrice) * 100 : 0;
    this.isProfitPositive = this.profitPerUnit > 0;
    this.showProfitIndicators = costPrice > 0 || salePrice > 0;
  }

  private checkStockWarning() {
    const stock = this.productForm.get('stock')?.value || 0;
    const minStock = this.productForm.get('minStock')?.value || 0;

    this.showLowStockWarning = stock > 0 && minStock > 0 && stock <= minStock * 1.5;
  }

  async takePhoto() {
    try {
      const photo = await Camera.getPhoto({
        quality: 80,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
        width: 1024
      });

      if (photo.base64String) {
        this.productForm.patchValue({ image: photo.base64String });
        const mime = photo.format ? `image/${photo.format}` : 'image/jpeg';
        this.imagePreview = `data:${mime};base64,${photo.base64String}`;
      }
    } catch (e) {
      console.log('Usuario canceló la cámara o hubo un error:', e);
    }
  }

  triggerFile(input: HTMLInputElement) {
    input.click();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    try {
      const dataUrl = await this.readFileAsDataUrl(file);
      this.imagePreview = dataUrl;
      const pureBase64 = this.dataUrlToBase64(dataUrl);
      this.productForm.patchValue({ image: pureBase64 });
    } catch (error) {
      console.error('Error al leer el archivo:', error);
      this.showToast('Error al cargar la imagen', 'danger');
    }
  }

  clearImage() {
    this.imagePreview = null;
    this.productForm.patchValue({ image: '' });
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  private dataUrlToBase64(dataUrl: string): string {
    const commaIndex = dataUrl.indexOf(',');
    return commaIndex >= 0 ? dataUrl.substring(commaIndex + 1) : dataUrl;
  }

  private base64ToDataUrl(base64: string, mime = 'image/jpeg'): string {
    return `data:${mime};base64,${base64}`;
  }

  // Nuevo método para abrir el modal de publicación
  // Nuevo método para abrir el modal de publicación
async openPublicacionModal() {
  const modal = await this.modalController.create({
    component: PublicacionModalComponent,
    componentProps: {
      productId: this.productId,
      currentPublicacion: this.productForm.get('publicacion')?.value,
      productData: {
        // ✅ Enviar TODOS los campos del formulario
        name: this.productForm.get('name')?.value,
        description: this.productForm.get('description')?.value,
        costPrice: this.productForm.get('costPrice')?.value,
        salePrice: this.productForm.get('salePrice')?.value,
        stock: this.productForm.get('stock')?.value,
        minStock: this.productForm.get('minStock')?.value,
        unit: this.productForm.get('unit')?.value,
        active: this.productForm.get('active')?.value,
        image: this.productForm.get('image')?.value
      }
    }
  });

  await modal.present();

  const { data } = await modal.onWillDismiss();
  if (data?.updated) {
    // Recargar el producto para obtener el campo actualizado
    this.loadProduct();
  }
}

  async onSubmit() {
    if (this.productForm.invalid) {
      this.markFormGroupTouched(this.productForm);
      this.showToast('Por favor completa todos los campos requeridos', 'warning');
      return;
    }

    if (this.profitPerUnit < 0) {
      const alert = await this.alertController.create({
        header: 'Precio de venta bajo',
        message: 'El precio de venta es menor al precio de compra. ¿Deseas continuar?',
        buttons: [
          { text: 'Cancelar', role: 'cancel' },
          { text: 'Continuar', handler: () => this.saveProduct() }
        ]
      });
      await alert.present();
      return;
    }

    this.saveProduct();
  }

  private saveProduct() {
    this.isSaving = true;
    const formData = { ...this.productForm.value };

    // Si es creación, asegurar que publicacion sea null
    if (!this.isEditMode) {
      formData.publicacion = null;
    }

    if (this.isEditMode && this.productId) {
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
          { text: 'Continuar editando', role: 'cancel' },
          { text: 'Descartar', role: 'destructive', handler: () => this.router.navigate(['/products']) }
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
