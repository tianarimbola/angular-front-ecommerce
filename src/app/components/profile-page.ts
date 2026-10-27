import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Customer } from '../core/models';

@Component({
  selector: 'shop-profile-page',
  standalone: true,
  template: `
    <section class="page-heading"><div><span class="eyebrow">VOTRE COMPTE</span><h1>Profil client</h1><p>Ces informations sont utilisées pour préparer vos commandes.</p></div></section>
    <section class="profile-layout">
      <article class="profile-card">
        <div class="profile-avatar">{{ initials(username) }}</div><span class="eyebrow">COMPTE BOUTIQUE</span><h2>{{ username }}</h2><p>{{ email }}</p><div class="profile-divider"></div>
        <form class="profile-form" (submit)="$event.preventDefault(); save.emit({name, phone})">
          <label>Nom complet<input name="customerName" [value]="name" (input)="nameChange.emit($any($event.target).value)" required maxlength="255" placeholder="Votre nom"></label>
          <label>Téléphone<input name="customerPhone" [value]="phone" (input)="phoneChange.emit($any($event.target).value)" maxlength="255" placeholder="+261 34 00 000 00"></label>
          <button class="button button-dark" type="submit">{{ customer ? 'Mettre à jour mon profil' : 'Créer mon profil client' }}</button>
          @if (customer) { <button class="text-link danger-text" type="button" (click)="delete.emit()">Supprimer le profil client</button> }
        </form>
      </article>
      <aside class="profile-tip"><span>✳</span><h3>Un achat en toute simplicité</h3><p>Enregistrez votre profil client une seule fois, puis commandez vos pièces favorites directement depuis la vitrine.</p><button class="text-link" (click)="viewProducts.emit()">Parcourir la collection →</button></aside>
    </section>
  `
})
export class ProfilePageComponent {
  @Input() username = '';
  @Input() email = '';
  @Input() customer: Customer | null = null;
  @Input() name = '';
  @Input() phone = '';
  @Output() nameChange = new EventEmitter<string>();
  @Output() phoneChange = new EventEmitter<string>();
  @Output() save = new EventEmitter<{ name: string; phone: string }>();
  @Output() delete = new EventEmitter<void>();
  @Output() viewProducts = new EventEmitter<void>();

  initials(value: string): string {
    return value.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('');
  }
}
