// src/app/pages/products/products.page.ts
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonSkeletonText,
  IonList,
  IonItemSliding,
  IonItem,
  IonIcon,
  IonChip,
  IonItemOptions,
  IonItemOption,
  IonFab,
  IonFabButton,
  IonButtons,
  IonButton,
  IonMenuButton,
  AlertController,
  ToastController,
  ModalController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cubeOutline,
  refreshOutline,
  warningOutline,
  cashOutline,
  cartOutline,
  trendingUpOutline,
  addOutline,
  createOutline,
  trashOutline,
  informationCircleOutline,
  newspaperOutline
} from 'ionicons/icons';
import { Product, ProductService } from '../../services/product-service';
import { PublicacionModalComponent } from '../../components/publicacion-modal/publicacion-modal.component';

@Component({
  selector: 'app-products',
  templateUrl: './products.page.html',
  styleUrls: ['./products.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonBadge,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonSkeletonText,
    IonList,
    IonItemSliding,
    IonItem,
    IonIcon,
    IonChip,
    IonItemOptions,
    IonItemOption,
    IonFab,
    IonFabButton,
    IonButtons,
    IonButton,
    IonMenuButton
  ]
})
export class ProductsPage implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);
  private modalController = inject(ModalController);

  products: Product[] = [];
  filteredProducts: Product[] = [];
  searchTerm = '';
  selectedFilter = 'all';
  isLoading = false;

  totalProducts = 0;
  lowStockCount = 0;

  constructor() {
    addIcons({
      cubeOutline,
      refreshOutline,
      warningOutline,
      cashOutline,
      cartOutline,
      trendingUpOutline,
      addOutline,
      createOutline,
      trashOutline,
      informationCircleOutline,
      newspaperOutline
    });
  }

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts(event?: any) {
    this.isLoading = !event;

    this.productService.getProducts(false).subscribe({
      next: (products) => {
        this.products = products;
        this.applyFilters();
        this.calculateStats();
        this.isLoading = false;
        if (event) {
          event.target.complete();
        }
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.showToast('Error al cargar productos', 'danger');
        this.isLoading = false;
        if (event) {
          event.target.complete();
        }
      }
    });
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value?.toLowerCase() || '';
    this.applyFilters();
  }

  onFilterChange(event: any) {
    this.selectedFilter = event.detail.value;
    this.applyFilters();
  }

  private applyFilters() {
    let filtered = [...this.products];

    if (this.searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(this.searchTerm) ||
        product.description?.toLowerCase().includes(this.searchTerm)
      );
    }

    switch (this.selectedFilter) {
      case 'active':
        filtered = filtered.filter(p => p.active);
        break;
      case 'lowStock':
        filtered = filtered.filter(p => this.isLowStock(p) && p.active);
        break;
    }

    this.filteredProducts = filtered;
  }

  private calculateStats() {
    this.totalProducts = this.products.filter(p => p.active).length;
    this.lowStockCount = this.products.filter(p => this.isLowStock(p) && p.active).length;
  }

  isLowStock(product: Product): boolean {
    return this.productService.isLowStock(product);
  }

  getProfitMargin(product: Product): number {
    return this.productService.calculateProfitMargin(product);
  }

  getStockStatus(product: Product): string {
    if (!product.active) return 'inactive';
    if (product.stock === 0) return 'out-of-stock';
    if (this.isLowStock(product)) return 'low-stock';
    return 'in-stock';
  }

  addProduct() {
    this.router.navigate(['/products/new']);
  }

  viewProduct(product: Product) {
    this.router.navigate(['/products', product.id]);
  }

  editProduct(product: Product) {
    this.router.navigate(['/products', product.id]);
  }

  // NUEVO: Abrir modal de publicación desde la lista
  // NUEVO: Abrir modal de publicación desde la lista
async openPublicacionModal(product: Product, event: Event) {
  event.stopPropagation(); // Prevenir que se abra el detalle del producto

  const modal = await this.modalController.create({
    component: PublicacionModalComponent,
    componentProps: {
      productId: product.id,
      currentPublicacion: product.publication,
      productData: {
        // ✅ Enviar TODOS los campos del producto
        name: product.name,
        description: product.description,
        costPrice: product.costPrice,
        salePrice: product.salePrice,
        stock: product.stock,
        minStock: product.minStock,
        unit: product.unit,
        active: product.active,
        image: product.image
        // publicacion se actualiza después
      }
    }
  });

  await modal.present();

  const { data } = await modal.onWillDismiss();
  if (data?.updated) {
    // Recargar productos para obtener la actualización
    this.loadProducts();
  }
}

  async deleteProduct(product: Product) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar "${product.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.confirmDelete(product);
          }
        }
      ]
    });

    await alert.present();
  }

  private confirmDelete(product: Product) {
    if (!product.id) return;

    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.showToast('Producto eliminado correctamente', 'success');
        this.loadProducts();
      },
      error: (error) => {
        console.error('Error eliminando producto:', error);
        this.showToast('Error al eliminar el producto', 'danger');
      }
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


}
