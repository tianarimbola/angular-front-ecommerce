import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartAddRequest, CartLine, CatalogItem, Product } from '../core/models';
import { ProductCardComponent } from './product-card';

@Component({
  selector: 'shop-storefront-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  template: `
    <section class="store-hero">
      <div class="store-hero-copy">
        <span class="eyebrow">ATELIER & BOUTIQUE · NOUVELLE COLLECTION</span>
        <h1>Le style commence<br>par une belle pièce.</h1>
        <p>Découvrez des vêtements sélectionnés avec soin et trouvez les pièces qui vous ressemblent.</p>
        <a class="button button-light" href="#collection">Explorer la collection <span>↓</span></a>
      </div>
      <div class="store-hero-art" aria-hidden="true"><span>COLLECTION<br>2026</span></div>
    </section>

    <section id="collection" class="store-collection">
      <div class="section-heading">
        <div><span class="eyebrow">SÉLECTION CLOTHES</span><h2>La collection</h2></div>
        <span class="result-count">{{ filteredProducts.length }} article{{ filteredProducts.length === 1 ? '' : 's' }}</span>
      </div>
      <section class="toolbar">
        <label class="search-box"><span>⌕</span><input name="search" [(ngModel)]="search" placeholder="Rechercher une pièce…"></label>
        <select aria-label="Filtrer par collection" name="filterType" [(ngModel)]="filterType">
          <option value="">Toutes les collections</option>
          @for (type of types; track type.id) { <option [value]="type.id">{{ type.name }}</option> }
        </select>
      </section>

      @if (cart.length) {
        <section class="cart-panel" aria-labelledby="cart-title">
          <div class="section-heading cart-heading">
            <div><span class="eyebrow">VOTRE SÉLECTION</span><h2 id="cart-title">Panier ({{ cartCount }})</h2></div>
          </div>
          <div class="cart-lines">
            @for (line of cart; track line.product.id) {
              <article class="cart-line">
                <div class="cart-product"><strong>{{ line.product.name }}</strong><small>{{ currency(line.product.price) }} · {{ line.product.quantity }} disponible(s)</small></div>
                <div class="cart-quantity" [attr.aria-label]="'Quantité pour ' + line.product.name">
                  <button type="button" [disabled]="line.quantity <= 1" (click)="quantityChange.emit({productId: line.product.id, quantity: line.quantity - 1})" [attr.aria-label]="'Retirer une unité de ' + line.product.name">−</button>
                  <input type="number" min="1" [max]="line.product.quantity" [value]="line.quantity" (change)="quantityChange.emit({productId: line.product.id, quantity: $any($event.target).valueAsNumber})" [attr.aria-label]="'Quantité dans le panier pour ' + line.product.name">
                  <button type="button" [disabled]="line.quantity >= line.product.quantity" (click)="quantityChange.emit({productId: line.product.id, quantity: line.quantity + 1})" [attr.aria-label]="'Ajouter une unité de ' + line.product.name">+</button>
                </div>
                <strong>{{ currency(line.product.price * line.quantity) }}</strong>
                <button class="text-link danger-text" type="button" (click)="removeFromCart.emit(line.product.id)">Retirer</button>
              </article>
            }
          </div>
          <div class="cart-checkout">
            <label class="cart-address">Adresse de livraison<input name="shippingAddress" [value]="shippingAddress" (input)="shippingAddressChange.emit($any($event.target).value)" maxlength="255" required></label>
            <div class="cart-total"><span>Total</span><strong>{{ currency(cartTotal) }}</strong></div>
            <button class="button button-dark" type="button" [disabled]="checkoutLoading" (click)="checkout.emit()">
              {{ checkoutLoading ? 'Validation en cours…' : 'Valider la commande' }}
            </button>
          </div>
        </section>
      }

      @if (loading) {
        <div class="empty-state"><span>✳</span><h3>Préparation de la vitrine</h3><p>Les pièces de la collection arrivent…</p></div>
      } @else {
        <section class="inventory-grid storefront-grid">
          @for (product of filteredProducts; track product.id) {
            <shop-product-card [product]="product" [userId]="userId" [canOrder]="canOrder" (order)="orderProduct.emit($event)"/>
          } @empty {
            <div class="empty-state"><span>⌕</span><h3>Aucune pièce trouvée</h3><p>Essayez un autre terme ou une autre collection.</p></div>
          }
        </section>
      }
    </section>
  `
})
export class StorefrontPageComponent {
  @Input() products: Product[] = [];
  @Input() types: CatalogItem[] = [];
  @Input() userId: number | null = null;
  @Input() loading = false;
  @Input() canOrder = true;
  @Input() cart: CartLine[] = [];
  @Input() cartCount = 0;
  @Input() cartTotal = 0;
  @Input() shippingAddress = '';
  @Input() checkoutLoading = false;
  @Output() orderProduct = new EventEmitter<CartAddRequest>();
  @Output() quantityChange = new EventEmitter<{ productId: number; quantity: number }>();
  @Output() removeFromCart = new EventEmitter<number>();
  @Output() shippingAddressChange = new EventEmitter<string>();
  @Output() checkout = new EventEmitter<void>();
  search = '';
  filterType = '';

  get filteredProducts(): Product[] {
    const query = this.search.trim().toLocaleLowerCase('fr');
    return this.products.filter(product => {
      const matchesQuery = !query || product.name.toLocaleLowerCase('fr').includes(query);
      const matchesType = !this.filterType || String(product.typeId ?? '') === this.filterType;
      return matchesQuery && matchesType;
    });
  }

  currency(value: number): string {
    return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', maximumFractionDigits: 0 }).format(value);
  }
}
