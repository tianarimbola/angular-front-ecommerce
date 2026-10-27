import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'shop-auth-panel',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="auth-banner">
      <div class="auth-copy"><span class="eyebrow">VOTRE ESPACE CLOTHES</span><h2>{{ mode === 'login' ? 'Ravi de vous revoir.' : 'Créez votre compte.' }}</h2><p>Connectez-vous pour finaliser votre commande, ou inscrivez-vous comme client ou vendeur.</p></div>
      <form class="auth-form" (ngSubmit)="submit.emit({ username, email, password, role })">
        <div class="auth-tabs">
          <button type="button" [class.selected]="mode === 'login'" (click)="modeChange.emit('login')">Connexion</button>
          <button type="button" [class.selected]="mode === 'register'" (click)="modeChange.emit('register')">Créer un compte</button>
        </div>
        @if (mode === 'register') {
          <label>Nom d'utilisateur<input name="username" [(ngModel)]="username" required maxlength="255" placeholder="ex. amina"></label>
          <label>Adresse e-mail<input name="email" type="email" [(ngModel)]="email" required maxlength="255" placeholder="vous@boutique.com"></label>
          <label>Type de compte
            <select name="role" [(ngModel)]="role">
              <option value="CLIENT">Client</option>
              <option value="VENDOR">Vendeur</option>
            </select>
          </label>
        } @else {
          <label>Nom d'utilisateur<input name="username" [(ngModel)]="username" required placeholder="Votre nom d'utilisateur"></label>
        }
        <label>Mot de passe<input name="password" type="password" [(ngModel)]="password" required [attr.minlength]="mode === 'register' ? 8 : null" [placeholder]="mode === 'register' ? '8 caractères minimum' : 'Votre mot de passe'"></label>
        <button class="button button-dark auth-submit" type="submit">{{ mode === 'login' ? 'Entrer dans ma boutique' : 'Créer mon compte' }} <span>→</span></button>
      </form>
    </section>
  `
})
export class AuthPanelComponent {
  @Input() mode: 'login' | 'register' = 'login';
  @Output() modeChange = new EventEmitter<'login' | 'register'>();
  @Output() submit = new EventEmitter<{ username: string; email: string; password: string; role?: 'CLIENT' | 'VENDOR' }>();
  username = '';
  email = '';
  password = '';
  role: 'CLIENT' | 'VENDOR' = 'CLIENT';
}
