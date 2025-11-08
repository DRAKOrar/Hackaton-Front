import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonBackButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonBadge, IonSpinner, IonChip, IonGrid, IonRow, IonCol, AlertController, ToastController, IonAvatar, IonList, IonMenuButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cubeOutline,
  cashOutline,
  trendingUpOutline,
  layersOutline,
  warningOutline,
  checkmarkCircleOutline,
  createOutline,
  trashOutline,
  timeOutline,
  pricetagOutline, alertCircleOutline, arrowDownCircleOutline, arrowUpCircleOutline, pulseOutline, bagOutline, cartOutline, rocketOutline, informationCircleOutline, calendarOutline, refreshOutline, fingerPrintOutline } from 'ionicons/icons';
import { Product, ProductService } from '../../services/product-service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.page.html',
  styleUrls: ['./product-detail.page.scss'],
  standalone: true,
  imports: [IonList, IonAvatar,
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonBackButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonBadge,
    IonSpinner,
    IonChip,
    IonGrid,
    IonRow,
    IonCol, IonMenuButton]
})
export class ProductDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private alertController = inject(AlertController);
  private toastController = inject(ToastController);

  product?: Product;
  isLoading = true;
  productId?: number;

  // Propiedades calculadas
  profitMargin = 0;
  stockStatus: 'danger' | 'warning' | 'success' = 'success';
  stockStatusText = '';

  constructor() {
    addIcons({createOutline,trashOutline,cubeOutline,layersOutline,alertCircleOutline,checkmarkCircleOutline,cashOutline,arrowDownCircleOutline,arrowUpCircleOutline,trendingUpOutline,pulseOutline,bagOutline,cartOutline,rocketOutline,informationCircleOutline,calendarOutline,refreshOutline,fingerPrintOutline,warningOutline,timeOutline,pricetagOutline});
  }

  ngOnInit() {
    this.productId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.productId) {
      this.loadProduct();
    }
  }

  private loadProduct() {
    this.isLoading = true;
    this.productService.getProductById(this.productId!).subscribe({
      next: (product) => {
        this.product = product;
        this.calculateValues();
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

  private calculateValues() {
    if (!this.product) return;

    // Calcular margen de ganancia
    this.profitMargin = this.productService.calculateProfitMargin(this.product);

    // Determinar estado del stock
    if (this.product.stock === 0) {
      this.stockStatus = 'danger';
      this.stockStatusText = 'Sin stock';
    } else if (this.productService.isLowStock(this.product)) {
      this.stockStatus = 'warning';
      this.stockStatusText = 'Stock bajo';
    } else {
      this.stockStatus = 'success';
      this.stockStatusText = 'Stock disponible';
    }
  }

  onEdit() {
    this.router.navigate(['/products/edit', this.productId]);
  }

  async onDelete() {
    const alert = await this.alertController.create({
      header: 'Eliminar producto',
      message: `¿Estás seguro de que deseas eliminar "${this.product?.name}"? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.deleteProduct();
          }
        }
      ]
    });

    await alert.present();
  }

  private deleteProduct() {
    if (!this.productId) return;

    this.productService.deleteProduct(this.productId).subscribe({
      next: () => {
        this.showToast('Producto eliminado correctamente', 'success');
        this.router.navigate(['/products']);
      },
      error: (error) => {
        console.error('Error eliminando producto:', error);
        this.showToast('Error al eliminar el producto', 'danger');
      }
    });
  }

  // ...
getImageSrc(): string | null {
  if (!this.product?.image) return null;
  // Si no conoces el mime exacto, usa image/* para que el navegador lo muestre igual.
  return `data:image/*;base64,${this.product.image}`;
}

getAvatarColor(): string {
  const colors = ['primary', 'secondary', 'success', 'warning'];
  const index = (this.product?.name?.length || 0) % colors.length;
  return colors[index];
}

getMarginPercentage(): number {
  if (this.profitMargin < 0) return 0;
  return this.profitMargin > 100 ? 100 : this.profitMargin;
}

// ...
onImageLoad() {
  console.log('Imagen cargada correctamente');
}

onImageError() {
  console.error('Error al cargar la imagen');
  // Puedes mostrar un toast o manejar el error
}


  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
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
