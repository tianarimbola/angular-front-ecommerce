import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CartAddRequest, CatalogItem, Product } from '../core/models';
import { ProductCardComponent } from './product-card';

@Component({
  selector: 'shop-products-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ProductCardComponent],
  template: `
    <section class="page-heading"><div><span class="eyebrow">INVENTAIRE</span><h1>Vos produits</h1><p>Gérez les fiches, les médias et les niveaux de stock.</p></div><button class="button button-accent" (click)="addProduct.emit()">＋ Nouveau produit</button></section>
    <section class="toolbar"><label class="search-box"><span>⌕</span><input name="search" [(ngModel)]="search" placeholder="Rechercher un produit…"></label><select aria-label="Filtrer par collection" name="filterType" [(ngModel)]="filterType"><option value="">Toutes les collections</option>@for (type of types; track type.id) {<option [value]="type.id">{{ type.name }}</option>}</select><span class="result-count">{{ filteredProducts.length }} articles</span></section>
    <section class="inventory-grid">
      @for (product of filteredProducts; track product.id) {
        <shop-product-card [product]="product" [userId]="userId" [inventory]="true" [editable]="product.userId === userId" [canOrder]="false" (order)="orderProduct.emit($event)" (edit)="editProduct.emit($event)" (remove)="deleteProduct.emit($event)"/>
      } @empty { <div class="empty-state"><span>⌕</span><h3>Aucun produit trouvé</h3><p>Essayez un autre terme ou ajoutez votre premier produit.</p></div> }
    </section>
  `
})
export class ProductsPageComponent {
  @Input() products: Product[] = [];
  @Input() types: CatalogItem[] = [];
  @Input() userId: number | null = null;
  @Output() addProduct = new EventEmitter<void>();
  @Output() orderProduct = new EventEmitter<CartAddRequest>();
  @Output() editProduct = new EventEmitter<Product>();
  @Output() deleteProduct = new EventEmitter<Product>();
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
}
