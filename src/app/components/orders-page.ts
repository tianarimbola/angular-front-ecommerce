import { CommonModule, DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ShopOrder } from '../core/models';

@Component({
  selector: 'shop-orders-page',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <section class="page-heading"><div><span class="eyebrow">SUIVI DES VENTES</span><h1>Commandes</h1><p>Un aperçu clair des achats et de leur statut.</p></div><span class="soft-badge">{{ orders.length }} commande{{ orders.length > 1 ? 's' : '' }}</span></section>
    <section class="table-card"><div class="table-head"><div><h2>Activité récente</h2><p>Les commandes de votre compte boutique</p></div><span class="live-indicator"><i></i> À jour</span></div>
      @if (orders.length) {
        <div class="table-scroll"><table><thead><tr><th>RÉFÉRENCE</th><th>PRODUIT</th><th>DATE</th><th>LIVRAISON</th><th>STATUT</th><th></th></tr></thead><tbody>
          @for (order of orders; track order.id) {
            <tr>
              <td class="order-reference">#{{ order.id.toString().padStart(5, '0') }}</td>
              <td><strong>{{ order.productName }}</strong><small>Client · {{ order.customerName }}</small></td>
              <td>{{ order.date | date:'d MMM y' }}</td><td>{{ order.place }}</td>
              <td><select class="status-select" [value]="order.status" (change)="statusChange.emit({order, status: $any($event.target).value})"><option value="PENDING">En attente</option><option value="CONFIRMED">Confirmée</option><option value="PROCESSING">En préparation</option><option value="SHIPPED">Expédiée</option><option value="DELIVERED">Livrée</option></select></td>
              <td><button class="text-link danger-text" [disabled]="order.status !== 'PENDING'" (click)="cancel.emit(order)">Annuler</button></td>
            </tr>
          }
        </tbody></table></div>
      } @else {
        <div class="empty-state compact"><span>▤</span><h3>Vos commandes apparaîtront ici</h3><p>Les ventes et le suivi seront centralisés dans cet espace.</p><button class="button button-soft" (click)="viewProducts.emit()">Voir les produits</button></div>
      }
    </section>
  `
})
export class OrdersPageComponent {
  @Input() orders: ShopOrder[] = [];
  @Output() statusChange = new EventEmitter<{ order: ShopOrder; status: string }>();
  @Output() cancel = new EventEmitter<ShopOrder>();
  @Output() viewProducts = new EventEmitter<void>();
}
