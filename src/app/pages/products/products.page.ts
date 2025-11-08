import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonSearchbar, IonList, IonItem, IonLabel, IonBadge, IonFab, IonFabButton, IonRefresher, IonRefresherContent, IonSegment, IonSegmentButton, IonChip, IonSkeletonText, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItemSliding, IonItemOptions, IonItemOption, AlertController, ToastController, IonNote, IonMenuButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addOutline,
  searchOutline,
  filterOutline,
  cubeOutline,
  trendingUpOutline,
  warningOutline,
  createOutline,
  trashOutline,
  eyeOutline,
  arrowDownOutline,
  cashOutline,
  cartOutline, refreshOutline } from 'ionicons/icons';
import { Product, ProductService } from '../../services/product-service';

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
    IonButtons,
    IonButton,
    IonIcon,
    IonSearchbar,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonFab,
    IonFabButton,
    IonRefresher,
    IonRefresherContent,
    IonSegment,
    IonSegmentButton,
    IonChip,
    IonSkeletonText,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonNote,
    IonMenuButton
]
})
export class ProductsPage implements OnInit {
  private productService = inject(ProductService);
  private router = inject(Router);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  products: Product[] = [];
  filteredProducts: Product[] = [];
  isLoading = false;
  searchTerm = '';
  selectedFilter: 'all' | 'active' | 'lowStock' = 'all';

  constructor() {
    addIcons({cubeOutline,refreshOutline,warningOutline,cashOutline,cartOutline,trendingUpOutline,createOutline,trashOutline,addOutline,searchOutline,filterOutline,eyeOutline,arrowDownOutline});
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
        this.isLoading = false;

        if (event) {
          event.target.complete();
        }
      },
      error: (error) => {
        console.error('Error cargando productos:', error);
        this.isLoading = false;

        if (event) {
          event.target.complete();
        }

        this.showToast('Error al cargar productos', 'danger');
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

  applyFilters() {
    let filtered = [...this.products];

    // Filtrar por búsqueda
    if (this.searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(this.searchTerm) ||
        p.description?.toLowerCase().includes(this.searchTerm)
      );
    }

    // Filtrar por estado
    switch (this.selectedFilter) {
      case 'active':
        filtered = filtered.filter(p => p.active);
        break;
      case 'lowStock':
        filtered = filtered.filter(p => this.isLowStock(p));
        break;
    }

    this.filteredProducts = filtered;
  }

  isLowStock(product: Product): boolean {
    return this.productService.isLowStock(product);
  }

  getProfitMargin(product: Product): number {
    return this.productService.calculateProfitMargin(product);
  }

  getStockStatus(product: Product): 'danger' | 'warning' | 'success' {
    if (product.stock === 0) return 'danger';
    if (this.isLowStock(product)) return 'warning';
    return 'success';
  }

  async viewProduct(product: Product) {
    this.router.navigate(['/products', product.id]);
  }

  async editProduct(product: Product) {
    this.router.navigate(['/products', 'edit', product.id]);
  }

  async deleteProduct(product: Product) {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el producto "${product.name}"?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.confirmDelete(product.id!);
          }
        }
      ]
    });

    await alert.present();
  }

  private confirmDelete(id: number) {
    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.showToast('Producto eliminado correctamente', 'success');
        this.loadProducts();
      },
      error: (error) => {
        console.error('Error eliminando producto:', error);
        this.showToast('Error al eliminar producto', 'danger');
      }
    });
  }

  addProduct() {
    this.router.navigate(['/products', 'new']);
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

  get lowStockCount(): number {
    return this.products.filter(p => this.isLowStock(p) && p.active).length;
  }

  get totalProducts(): number {
    return this.products.filter(p => p.active).length;
  }
}
