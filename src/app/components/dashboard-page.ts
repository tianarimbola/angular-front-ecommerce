import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AuthResponse, CartAddRequest, Product, ShopOrder } from '../core/models';
import { ProductCardComponent } from './product-card';

@Component({
  selector: 'shop-dashboard-page',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  template: `
    <section class="welcome-row">
      <div><span class="eyebrow">{{ todayLabel }} · ESPACE BOUTIQUE</span><h1>Bonjour{{ user ? ', ' + user.username : '' }} <span class="wave">✳</span></h1><p>Voici ce qui se passe dans votre boutique aujourd’hui.</p></div>
      <button class="button button-accent" (click)="addProduct.emit()"><span class="plus">＋</span> Ajouter un produit</button>
    </section>
    <section class="hero-panel">
      <div class="hero-text"><span class="hero-kicker">LA NOUVELLE SAISON COMMENCE</span><h2>Une collection<br>qui vous ressemble.</h2><p>Présentez chaque pièce sous son meilleur jour, en image ou en vidéo.</p><button class="button button-light" (click)="viewProducts.emit()">Explorer les produits <span>↗</span></button></div>
      <div class="hero-art" aria-hidden="true"><div class="art-circle"></div><div class="art-figure"><span class="figure-head"></span><span class="figure-body"></span></div><span class="art-label">ÉDITION<br>2026</span><span class="art-caption">LE STYLE<br>EN MOUVEMENT</span></div>
      <div class="hero-number">01 <span>/ 04</span></div>
    </section>
    <section class="stat-grid">
      <article class="stat-card"><div class="stat-top"><span>Produits publiés</span><span class="stat-icon violet">◇</span></div><strong>{{ products.length }}</strong><small>Dans votre vitrine</small></article>
      <article class="stat-card"><div class="stat-top"><span>Commandes</span><span class="stat-icon gold">▤</span></div><strong>{{ orders.length }}</strong><small>Commandes reçues</small></article>
      <article class="stat-card"><div class="stat-top"><span>Valeur estimée</span><span class="stat-icon green">↗</span></div><strong class="stat-currency">{{ currency(revenue) }}</strong><small>Sur les commandes actives</small></article>
      <article class="stat-card"><div class="stat-top"><span>Stock à surveiller</span><span class="stat-icon rose">!</span></div><strong>{{ lowStockCount }}</strong><small>5 pièces ou moins</small></article>
    </section>
    <section class="section-heading"><div><span class="eyebrow">SÉLECTION DU MOMENT</span><h2>Vos derniers produits</h2></div><button class="text-link" (click)="viewProducts.emit()">Voir tout <span>→</span></button></section>
    <section class="product-grid">
      @for (product of products.slice(0, 4); track product.id) {
        <shop-product-card [product]="product" [userId]="user?.userId ?? null" [editable]="product.userId === user?.userId" [canOrder]="user?.role === 'CLIENT'" (order)="orderProduct.emit($event)" (edit)="editProduct.emit($event)" (remove)="deleteProduct.emit($event)"/>
      } @empty {
        <div class="empty-state"><span>◇</span><h3>La vitrine attend ses premières pièces</h3><p>Ajoutez un produit et donnez vie à votre collection.</p><button class="button button-accent" (click)="addProduct.emit()">Ajouter un produit</button></div>
      }
    </section>
  `
})
export class DashboardPageComponent {
  @Input() products: Product[] = [];
  @Input() orders: ShopOrder[] = [];
  @Input() user: AuthResponse | null = null;
  @Input() revenue = 0;
  @Input() lowStockCount = 0;
  @Output() addProduct = new EventEmitter<void>();
  @Output() viewProducts = new EventEmitter<void>();
  @Output() orderProduct = new EventEmitter<CartAddRequest>();
  @Output() editProduct = new EventEmitter<Product>();
  @Output() deleteProduct = new EventEmitter<Product>();

  get todayLabel(): string {
    return new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(new Date()).toLocaleUpperCase('fr-FR');
  }

  currency(value: number): string {
    return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', maximumFractionDigits: 0 }).format(value);
  }
}
