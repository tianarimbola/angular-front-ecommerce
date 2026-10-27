import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogItem } from '../core/models';

@Component({
  selector: 'shop-catalog-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page-heading"><div><span class="eyebrow">ORGANISATION</span><h1>Collections & tailles</h1><p>Construisez un catalogue simple à parcourir.</p></div></section>
    <section class="catalog-columns">
      <article class="catalog-panel">
        <div class="catalog-title"><div><span class="stat-icon violet">◇</span><h2>Collections</h2></div><span>{{ types.length }} catégories</span></div>
        <form class="catalog-add" (ngSubmit)="addType.emit(typeName); typeName = ''"><input name="typeName" [(ngModel)]="typeName" required placeholder="Nom de la collection"><button class="button button-dark button-small" type="submit">Ajouter</button></form>
        @for (type of types; track type.id) {
          <div class="catalog-row"><span class="catalog-dot"></span><span class="catalog-row-name">{{ type.name }}</span><input class="rename-input" [(ngModel)]="newTypeNames[type.id]" [name]="'type-' + type.id" placeholder="Renommer"><button class="icon-button" title="Enregistrer" (click)="renameType.emit({item: type, name: newTypeNames[type.id]})">✓</button><button class="icon-button danger-icon" title="Supprimer" (click)="deleteType.emit(type)">⌫</button></div>
        } @empty { <p class="muted-note">Aucune collection pour le moment.</p> }
      </article>
      <article class="catalog-panel">
        <div class="catalog-title"><div><span class="stat-icon gold">▦</span><h2>Tailles</h2></div><span>{{ sizes.length }} références</span></div>
        <form class="catalog-add" (ngSubmit)="addSize.emit(sizeName); sizeName = ''"><input name="sizeName" [(ngModel)]="sizeName" required placeholder="ex. S, M, 38"><button class="button button-dark button-small" type="submit">Ajouter</button></form>
        @for (size of sizes; track size.id) {
          <div class="catalog-row"><span class="catalog-dot size-dot"></span><span class="catalog-row-name">{{ size.name }}</span><input class="rename-input" [(ngModel)]="newSizeNames[size.id]" [name]="'size-' + size.id" placeholder="Renommer"><button class="icon-button" title="Enregistrer" (click)="renameSize.emit({item: size, name: newSizeNames[size.id]})">✓</button><button class="icon-button danger-icon" title="Supprimer" (click)="deleteSize.emit(size)">⌫</button></div>
        } @empty { <p class="muted-note">Aucune taille pour le moment.</p> }
      </article>
    </section>
  `
})
export class CatalogPageComponent {
  @Input() types: CatalogItem[] = [];
  @Input() sizes: CatalogItem[] = [];
  @Output() addType = new EventEmitter<string>();
  @Output() addSize = new EventEmitter<string>();
  @Output() renameType = new EventEmitter<{ item: CatalogItem; name: string | undefined }>();
  @Output() renameSize = new EventEmitter<{ item: CatalogItem; name: string | undefined }>();
  @Output() deleteType = new EventEmitter<CatalogItem>();
  @Output() deleteSize = new EventEmitter<CatalogItem>();
  typeName = '';
  sizeName = '';
  newTypeNames: Record<number, string> = {};
  newSizeNames: Record<number, string> = {};
}
