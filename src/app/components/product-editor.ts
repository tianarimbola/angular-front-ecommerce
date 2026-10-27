import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CatalogItem, Product, ProductPayload } from '../core/models';
import { ShopApi } from '../core/shop-api.service';

export interface ProductSave {
  payload: ProductPayload;
  file: File | null;
  id?: number;
}

@Component({
  selector: 'shop-product-editor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="close.emit()">
      <section class="product-modal" role="dialog" aria-modal="true" aria-labelledby="product-modal-title" (click)="$event.stopPropagation()">
        <div class="modal-heading"><div><span class="eyebrow">{{ product ? 'METTRE À JOUR' : 'NOUVELLE PIÈCE' }}</span><h2 id="product-modal-title">{{ product ? 'Modifier le produit' : 'Ajouter à la collection' }}</h2><p>Complétez les détails et choisissez son média.</p></div><button class="modal-close" type="button" aria-label="Fermer" (click)="close.emit()">×</button></div>
        <form class="product-form" (ngSubmit)="save()">
          <div class="form-grid">
            <label class="wide-field">Nom du produit<input name="productName" [(ngModel)]="name" required maxlength="255" placeholder="ex. Veste en lin"></label>
            <label>Prix (MGA)<input name="productPrice" type="number" [(ngModel)]="price" required min="0" step="1" placeholder="29000"></label>
            <label>Quantité en stock<input name="productQuantity" type="number" [(ngModel)]="quantity" required min="0" step="1" placeholder="12"></label>
            <label>Collection<select name="productTypeId" [(ngModel)]="typeId"><option [ngValue]="null">Sans collection</option>@for (type of types; track type.id) {<option [ngValue]="type.id">{{ type.name }}</option>}</select></label>
            <label>Taille<select name="productSizeId" [(ngModel)]="sizeId"><option [ngValue]="null">Taille unique</option>@for (size of sizes; track size.id) {<option [ngValue]="size.id">{{ size.name }}</option>}</select></label>
          </div>
          <label class="upload-area" for="product-media">
            @if (preview && previewIsVideo) { <video [src]="preview" muted playsinline controls></video> }
            @else if (preview) { <img [src]="preview" alt="Aperçu du média produit"> }
            @else { <span class="upload-icon">↥</span><strong>Déposez votre média ici</strong><small>ou cliquez pour parcourir · image ou vidéo jusqu’à 100 Mo</small> }
            <input id="product-media" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" (change)="selectFile($event)">
            @if (preview) { <span class="replace-file">Choisir un autre média</span> }
          </label>
          <div class="modal-actions"><button class="button button-quiet" type="button" (click)="close.emit()">Annuler</button><button class="button button-accent" type="submit" [disabled]="!name.trim() || price === null || quantity === null || saving">{{ saving ? 'Enregistrement…' : product ? 'Enregistrer les modifications' : 'Publier le produit' }} <span>→</span></button></div>
        </form>
      </section>
    </div>
  `
})
export class ProductEditorComponent implements OnChanges, OnDestroy {
  private readonly api = inject(ShopApi);

  @Input() product: Product | null = null;
  @Input() types: CatalogItem[] = [];
  @Input() sizes: CatalogItem[] = [];
  @Input() saving = false;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<ProductSave>();

  name = '';
  price: number | null = null;
  quantity: number | null = 1;
  typeId: number | null = null;
  sizeId: number | null = null;
  file: File | null = null;
  preview: string | null = null;
  externalImageUrl: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['product']) return;
    this.revokePreview();
    this.file = null;
    this.name = this.product?.name ?? '';
    this.price = this.product?.price ?? null;
    this.quantity = this.product?.quantity ?? 1;
    this.typeId = this.product?.typeId ?? null;
    this.sizeId = this.product?.sizeId ?? null;
    this.externalImageUrl = this.product?.imageUrl ?? null;
    this.preview = this.api.mediaUrl(this.product?.imageUrl ?? null);
  }

  get previewIsVideo(): boolean {
    return !!this.preview && /\.(mp4|webm|mov)(\?.*)?$/i.test(this.preview);
  }

  selectFile(event: Event): void {
    this.revokePreview();
    this.file = (event.target as HTMLInputElement).files?.[0] ?? null;
    if (this.file) this.preview = URL.createObjectURL(this.file);
  }

  save(): void {
    if (!this.name.trim() || this.price === null || this.quantity === null || this.saving) return;
    this.saved.emit({
      payload: {
        typeId: this.typeId,
        sizeId: this.sizeId,
        name: this.name.trim(),
        price: Number(this.price),
        quantity: Number(this.quantity),
        imageUrl: this.file ? null : this.externalImageUrl
      },
      file: this.file,
      id: this.product?.id
    });
  }

  ngOnDestroy(): void {
    this.revokePreview();
  }

  private revokePreview(): void {
    if (this.preview?.startsWith('blob:')) URL.revokeObjectURL(this.preview);
    this.preview = null;
  }
}
