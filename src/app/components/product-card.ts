import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartAddRequest, Product } from '../core/models';
import { ShopApi } from '../core/shop-api.service';

@Component({
  selector: 'shop-product-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <article class="product-card" [class.inventory-card]="inventory">
      <div class="product-media">
        @if (mediaSource && video) {
          <video [src]="mediaSource" controls muted playsinline preload="metadata"></video>
        } @else if (mediaSource) {
          <img [src]="mediaSource" [alt]="product.name" loading="lazy">
        } @else {
          <div class="media-placeholder"><span>✳</span><small>COLLECTION CLOTHES</small></div>
        }
        <span class="media-tag">{{ product.typeName || 'COLLECTION' }}</span>
      </div>
      <div class="product-details">
        <div><h3>{{ product.name }}</h3><span>{{ product.sizeName || 'Taille unique' }} · {{ product.quantity }} en stock</span></div>
        <strong>{{ currency(product.price) }}</strong>
      </div>
      <div class="product-actions">
        @if (editable) {
          <button class="button button-soft button-small" (click)="edit.emit(product)">Modifier</button>
          <button class="icon-button danger-icon" title="Supprimer" (click)="remove.emit(product)">⌫</button>
        }
        @if (inventory && !editable) { <span class="owner-label">{{ product.username || 'Clothes' }}</span> }
        @if (canOrder) {
          <label class="quantity-picker">
            <span>Qté</span>
            <input type="number" name="quantity-{{ product.id }}" [(ngModel)]="quantity" min="1" [max]="product.quantity" [disabled]="product.quantity < 1" [attr.aria-label]="'Quantité pour ' + product.name">
          </label>
          <button [class]="inventory ? 'button button-dark button-small' : 'button button-soft button-small'" (click)="addToCart()" [disabled]="product.quantity < 1">{{ product.quantity < 1 ? 'Rupture de stock' : 'Ajouter au panier' }}</button>
        }
      </div>
    </article>
  `
})
export class ProductCardComponent {
  private readonly api = inject(ShopApi);

  @Input({ required: true }) product!: Product;
  @Input() userId: number | null = null;
  @Input() inventory = false;
  @Input() editable = false;
  @Input() canOrder = true;
  quantity = 1;
  @Output() order = new EventEmitter<CartAddRequest>();
  @Output() edit = new EventEmitter<Product>();
  @Output() remove = new EventEmitter<Product>();

  addToCart(): void {
    const quantity = Number(this.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > this.product.quantity) return;
    this.order.emit({ product: this.product, quantity });
    this.quantity = 1;
  }

  get mediaSource(): string | null {
    return this.api.mediaUrl(this.product.imageUrl);
  }

  get video(): boolean {
    return !!this.product.imageUrl && /\.(mp4|webm|mov)(\?.*)?$/i.test(this.product.imageUrl);
  }

  currency(value: number): string {
    return new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      maximumFractionDigits: 0
    }).format(value);
  }
}
