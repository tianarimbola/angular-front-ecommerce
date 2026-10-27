import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AdminUser } from '../core/models';

@Component({
  selector: 'shop-admin-users-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="page-heading">
      <div><span class="eyebrow">ESPACE ADMINISTRATEUR</span><h1>Gestion des utilisateurs</h1><p>Consultez les comptes et validez les demandes des vendeurs.</p></div>
      <span class="soft-badge">{{ users.length }} compte{{ users.length === 1 ? '' : 's' }}</span>
    </section>
    <section class="table-card">
      <div class="table-head">
        <div><h2>Tous les utilisateurs</h2><p>Les nouveaux vendeurs restent en attente jusqu’à votre décision.</p></div>
        <button class="button button-quiet button-small" [disabled]="loading" (click)="retry.emit()">
          {{ loading ? 'Chargement…' : 'Actualiser' }}
        </button>
      </div>
      @if (loading) {
        <div class="empty-state compact" role="status"><span>…</span><h3>Chargement des utilisateurs</h3><p>La liste s’affichera dès que les données seront reçues.</p></div>
      } @else if (loadFailed) {
        <div class="empty-state compact" role="alert"><span>!</span><h3>Liste indisponible</h3><p>La liste des utilisateurs n’a pas pu être chargée. Vérifiez le serveur, le rôle ADMIN et le jeton de connexion.</p><button class="button button-dark button-small" (click)="retry.emit()">Réessayer</button></div>
      } @else if (users.length) {
        <div class="table-scroll"><table><thead><tr><th>UTILISATEUR</th><th>E-MAIL</th><th>RÔLE</th><th>STATUT</th><th>ACTIONS</th></tr></thead><tbody>
          @for (user of users; track user.userId) {
            <tr>
              <td><strong>{{ user.username }}</strong><small>#{{ user.userId }}</small></td>
              <td>{{ user.email }}</td>
              <td>{{ roleLabel(user.role) }}</td>
              <td><span class="user-status" [class]="statusClass(user.status)">{{ statusLabel(user.status) }}</span></td>
              <td>
                @if (user.role === 'VENDOR' && user.status !== 'APPROVED') {
                  <button class="button button-accent button-small" [disabled]="busyUserId === user.userId" (click)="approve.emit(user.userId)">Approuver</button>
                  @if (user.status === 'PENDING') {
                    <button class="button button-quiet button-small" [disabled]="busyUserId === user.userId" (click)="reject.emit(user.userId)">Refuser</button>
                  }
                } @else if (user.role === 'VENDOR') {
                  <button class="button button-quiet button-small" [disabled]="busyUserId === user.userId" (click)="reject.emit(user.userId)">Suspendre</button>
                } @else { <span class="muted-note">—</span> }
              </td>
            </tr>
          }
        </tbody></table></div>
      } @else {
        <div class="empty-state compact"><span>◎</span><h3>Aucun compte enregistré</h3><p>Les comptes clients et vendeurs apparaîtront ici.</p></div>
      }
    </section>
  `
})
export class AdminUsersPageComponent {
  @Input() users: AdminUser[] = [];
  @Input() loading = false;
  @Input() loadFailed = false;
  @Input() busyUserId: number | null = null;
  @Output() retry = new EventEmitter<void>();
  @Output() approve = new EventEmitter<number>();
  @Output() reject = new EventEmitter<number>();

  roleLabel(role: AdminUser['role']): string {
    return role === 'ADMIN' ? 'Administrateur' : role === 'VENDOR' ? 'Vendeur' : 'Client';
  }

  statusLabel(status: AdminUser['status']): string {
    return status === 'PENDING' ? 'En attente' : status === 'REJECTED' ? 'Refusé' : 'Approuvé';
  }

  statusClass(status: AdminUser['status']): string {
    return `status-${status.toLowerCase()}`;
  }
}
