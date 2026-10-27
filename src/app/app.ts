import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { TimeoutError, finalize, timeout } from 'rxjs';
import { AdminUser, AuthResponse, CartLine, CatalogItem, Customer, Product, ProductPayload, ShopOrder } from './core/models';
import { ShopApi } from './core/shop-api.service';
import { AdminUsersPageComponent } from './components/admin-users-page';
import { AuthPanelComponent } from './components/auth-panel';
import { CatalogPageComponent } from './components/catalog-page';
import { DashboardPageComponent } from './components/dashboard-page';
import { OrdersPageComponent } from './components/orders-page';
import { ProductEditorComponent, ProductSave } from './components/product-editor';
import { ProductsPageComponent } from './components/products-page';
import { ProfilePageComponent } from './components/profile-page';
import { StorefrontPageComponent } from './components/storefront-page';

type Page = 'storefront' | 'dashboard' | 'products' | 'orders' | 'catalog' | 'profile' | 'admin';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    AdminUsersPageComponent,
    AuthPanelComponent,
    CatalogPageComponent,
    DashboardPageComponent,
    OrdersPageComponent,
    ProductEditorComponent,
    ProductsPageComponent,
    ProfilePageComponent,
    StorefrontPageComponent
  ],
  templateUrl: './app.html'
})
export class App implements OnInit {
  private readonly api = inject(ShopApi);
  private readonly changeDetector = inject(ChangeDetectorRef);

  private readonly allPages: { id: Page; label: string; icon: string }[] = [
    { id: 'storefront', label: 'Accueil', icon: '⌂' },
    { id: 'dashboard', label: 'Vue d’ensemble', icon: '◫' },
    { id: 'products', label: 'Produits', icon: '◇' },
    { id: 'orders', label: 'Commandes', icon: '▤' },
    { id: 'catalog', label: 'Collections', icon: '▦' },
    { id: 'profile', label: 'Mon profil', icon: '◎' },
    { id: 'admin', label: 'Utilisateurs', icon: '♙' }
  ];

  products: Product[] = [];
  inventory: Product[] = [];
  types: CatalogItem[] = [];
  sizes: CatalogItem[] = [];
  orders: ShopOrder[] = [];
  cart: CartLine[] = [];
  adminUsers: AdminUser[] = [];
  customer: Customer | null = null;
  user: AuthResponse | null = null;
  activePage: Page = 'storefront';
  loading = true;
  savingProduct = false;
  authLoading = false;
  checkoutLoading = false;
  showAuth = false;
  busyAdminUserId: number | null = null;
  adminUsersLoading = false;
  adminUsersLoadFailed = false;
  error = '';
  notice = '';
  authMode: 'login' | 'register' = 'login';
  private requestedPageAfterAuth: Page | null = null;
  productEditorOpen = false;
  editingProduct: Product | null = null;
  customerName = '';
  customerPhone = '';
  shippingAddress = 'Antananarivo';
  private productsLoadVersion = 0;
  private inventoryLoadVersion = 0;
  private typesLoadVersion = 0;
  private sizesLoadVersion = 0;
  private ordersLoadVersion = 0;
  private customerLoadVersion = 0;
  private adminUsersLoadVersion = 0;

  private normalizeRole(value: string | null): AuthResponse['role'] {
    const role = value?.trim().toUpperCase();
    return role === 'ADMIN' || role === 'VENDOR' ? role : 'CLIENT';
  }

  private normalizeStatus(value: string | null): AuthResponse['status'] {
    const status = value?.trim().toUpperCase();
    return status === 'PENDING' || status === 'REJECTED' ? status : 'APPROVED';
  }

  get pages(): { id: Page; label: string; icon: string }[] {
    if (!this.user) return this.allPages.filter(page => page.id === 'storefront');
    if (this.user.role === 'ADMIN') {
      return this.allPages.filter(page => ['storefront', 'admin', 'profile'].includes(page.id));
    }
    if (this.user.role === 'CLIENT') {
      return this.allPages.filter(page => ['storefront', 'orders', 'profile'].includes(page.id));
    }
    if (this.user.status !== 'APPROVED') {
      return this.allPages.filter(page => ['storefront', 'profile'].includes(page.id));
    }
    return this.allPages.filter(page =>
      ['storefront', 'dashboard', 'products', 'orders', 'catalog', 'profile'].includes(page.id));
  }

  ngOnInit(): void {
    const token = localStorage.getItem('clothes_token');
    const username = localStorage.getItem('clothes_username');
    const email = localStorage.getItem('clothes_email');
    const userId = Number(localStorage.getItem('clothes_user_id'));
    const role = this.normalizeRole(localStorage.getItem('clothes_user_role'));
    const status = this.normalizeStatus(localStorage.getItem('clothes_user_status'));
    if (token && username && email && Number.isFinite(userId) && userId > 0) {
      this.user = { token, tokenType: 'Bearer', userId, username, email, role, status };
      this.activePage = role === 'ADMIN' ? 'admin'
        : role === 'VENDOR' && status === 'APPROVED' ? 'dashboard'
          : 'storefront';
    }
    this.loadCatalog();
    this.loadProducts();
    if (this.user) {
      if (this.user.role === 'ADMIN') {
        this.loadAdminUsers();
      } else {
        this.loadPrivateData();
      }
    }
  }

  get pageTitle(): string {
    return this.allPages.find(page => page.id === this.activePage)?.label ?? 'Accueil';
  }

  get revenueEstimate(): number {
    return this.orders
      .filter(order => order.status.toUpperCase() !== 'CANCELLED')
      .reduce((total, order) => {
        const product = this.products.find(item => item.id === order.productId);
        return total + (product?.price ?? 0);
      }, 0);
  }

  get lowStockCount(): number {
    return this.inventory.filter(product => product.quantity <= 5).length;
  }

  get cartTotal(): number {
    return this.cart.reduce((total, line) => total + line.product.price * line.quantity, 0);
  }

  get cartItemCount(): number {
    return this.cart.reduce((total, line) => total + line.quantity, 0);
  }

  navigate(page: Page): void {
    if (page !== 'storefront' && !this.pages.some(visiblePage => visiblePage.id === page)) {
      if (!this.user) {
        this.openAuthentication('login', page);
        this.setNotice('Connectez-vous pour accéder à votre espace.');
      } else {
        this.setNotice('Cette rubrique n’est pas disponible pour votre compte.');
      }
      return;
    }
    this.activePage = page;
    this.showAuth = false;
    this.clearMessages();
    if (page === 'orders' && this.user) this.loadOrders();
    if (page === 'profile' && this.user) this.loadCustomer();
    if (page === 'products' && this.user) this.loadInventory();
    if (page === 'admin' && this.user?.role === 'ADMIN') this.loadAdminUsers();
  }

  reloadAdminUsers(): void {
    this.loadAdminUsers();
  }

  authenticate(credentials: { username: string; email: string; password: string; role?: 'CLIENT' | 'VENDOR' }): void {
    if (this.authLoading) return;
    this.clearMessages();
    this.authLoading = true;
    const mode = this.authMode;
    const request = mode === 'register'
      ? this.api.register(credentials.username, credentials.email, credentials.password, credentials.role ?? 'CLIENT')
      : this.api.login(credentials.username, credentials.password);
    request.pipe(
      timeout({ first: 10_000 }),
      finalize(() => {
        this.authLoading = false;
        this.changeDetector.markForCheck();
      })
    ).subscribe({
      next: result => {
        const user = this.setUser(result);
        this.showAuth = false;
        if (user.role === 'VENDOR' && user.status !== 'APPROVED') {
          this.loadPrivateData();
          this.activePage = 'storefront';
          this.requestedPageAfterAuth = null;
          this.setNotice(user.status === 'REJECTED'
            ? 'Votre demande vendeur a été refusée. Contactez un administrateur pour en savoir plus.'
            : 'Votre demande vendeur est en attente de validation par un administrateur.');
          return;
        }
        this.activePage = this.requestedPageAfterAuth ?? (user.role === 'ADMIN' ? 'admin'
          : user.role === 'VENDOR' ? 'dashboard' : 'storefront');
        this.requestedPageAfterAuth = null;
        if (user.role === 'ADMIN') {
          if (this.activePage === 'admin') this.loadAdminUsers();
        } else {
          this.loadPrivateData();
        }
        this.setNotice(mode === 'register'
          ? user.role === 'VENDOR' ? 'Compte vendeur créé.' : 'Votre compte client est prêt.'
          : 'Content de vous revoir.');
      },
      error: error => {
        if (error instanceof TimeoutError) {
          this.setError(error, 'La connexion au serveur prend trop de temps. Vérifiez que le serveur Spring fonctionne, puis réessayez.');
        } else if (mode === 'register') {
          this.setError(error, 'Création du compte impossible. Vérifiez vos informations.');
        } else {
          const fallback = error instanceof HttpErrorResponse && error.status === 0
            ? 'Le serveur Spring est inaccessible. Vérifiez qu’il est démarré sur http://localhost:8080.'
            : error instanceof HttpErrorResponse && error.status === 401
              ? 'Identifiants incorrects ou compte inexistant.'
              : 'Échec de la connexion au serveur. Vérifiez le message d’erreur et réessayez.';
          this.setError(error, fallback);
        }
        this.changeDetector.markForCheck();
      }
    });
  }

  logout(): void {
    localStorage.removeItem('clothes_token');
    localStorage.removeItem('clothes_username');
    localStorage.removeItem('clothes_email');
    localStorage.removeItem('clothes_user_id');
    localStorage.removeItem('clothes_user_role');
    localStorage.removeItem('clothes_user_status');
    this.user = null;
    this.orders = [];
    this.inventory = [];
    this.customer = null;
    this.adminUsers = [];
    this.adminUsersLoadVersion++;
    this.adminUsersLoading = false;
    this.adminUsersLoadFailed = false;
    this.showAuth = false;
    this.requestedPageAfterAuth = null;
    this.inventoryLoadVersion++;
    this.ordersLoadVersion++;
    this.customerLoadVersion++;
    this.activePage = 'storefront';
    this.setNotice('Vous êtes déconnecté.');
  }

  setAuthMode(mode: 'login' | 'register'): void {
    this.authMode = mode;
    this.clearMessages();
  }

  openAuthentication(mode: 'login' | 'register' = 'login', pageAfterAuth: Page | null = null): void {
    this.authMode = mode;
    this.requestedPageAfterAuth = pageAfterAuth;
    this.showAuth = true;
    this.clearMessages();
  }

  closeAuthentication(): void {
    this.showAuth = false;
    this.requestedPageAfterAuth = null;
  }

  openNewProduct(): void {
    if (!this.requireUser()) return;
    this.editingProduct = null;
    this.productEditorOpen = true;
    this.clearMessages();
  }

  editProduct(product: Product): void {
    if (!this.requireUser()) return;
    this.editingProduct = product;
    this.productEditorOpen = true;
    this.clearMessages();
  }

  closeProductEditor(): void {
    if (this.savingProduct) return;
    this.productEditorOpen = false;
    this.editingProduct = null;
  }

  saveProduct(change: ProductSave): void {
    if (!this.requireUser() || this.savingProduct) return;
    this.savingProduct = true;
    const wasEditing = change.id !== undefined;
    this.api.saveProduct(change.payload, change.file, change.id).subscribe({
      next: saved => {
        this.savingProduct = false;
        this.productEditorOpen = false;
        this.editingProduct = null;

        // Update both visible collections from the server response before background revalidation.
        this.products = this.upsertProduct(this.products, saved);
        this.inventory = this.upsertProduct(this.inventory, saved);
        this.setNotice(wasEditing ? 'Produit mis à jour.' : 'Produit ajouté au catalogue.');
        this.refreshProductData();
      },
      error: error => {
        this.savingProduct = false;
        this.setError(error, 'Le produit n’a pas pu être enregistré.');
      }
    });
  }

  deleteProduct(product: Product): void {
    if (!this.requireUser() || !window.confirm(`Supprimer « ${product.name} » ?`)) return;
    this.api.deleteProduct(product.id).subscribe({
      next: () => {
        this.products = this.products.filter(item => item.id !== product.id);
        this.inventory = this.inventory.filter(item => item.id !== product.id);
        this.setNotice('Produit supprimé.');
        this.refreshProductData();
      },
      error: error => this.setError(error, 'Suppression impossible.')
    });
  }

  saveCatalog(kind: 'types' | 'sizes', name: string): void {
    if (!this.requireUser() || !name.trim()) return;
    const request = kind === 'types' ? this.api.saveType(name.trim()) : this.api.saveSize(name.trim());
    request.subscribe({
      next: item => {
        if (kind === 'types') this.types = this.upsertCatalog(this.types, item);
        else this.sizes = this.upsertCatalog(this.sizes, item);
        this.setNotice(kind === 'types' ? 'Collection ajoutée.' : 'Taille ajoutée.');
        this.loadCatalog();
      },
      error: error => this.setError(error, 'Impossible de modifier le catalogue.')
    });
  }

  renameCatalog(kind: 'types' | 'sizes', item: CatalogItem, name: string | undefined): void {
    if (!this.requireUser() || !name?.trim()) return;
    const request = kind === 'types'
      ? this.api.saveType(name.trim(), item.id)
      : this.api.saveSize(name.trim(), item.id);
    request.subscribe({
      next: updated => {
        if (kind === 'types') this.types = this.upsertCatalog(this.types, updated);
        else this.sizes = this.upsertCatalog(this.sizes, updated);
        this.setNotice('Catalogue mis à jour.');
        this.loadCatalog();
        this.refreshProductData();
      },
      error: error => this.setError(error, 'Modification impossible.')
    });
  }

  deleteCatalog(kind: 'types' | 'sizes', item: CatalogItem): void {
    if (!this.requireUser()) return;
    const request = kind === 'types' ? this.api.deleteType(item.id) : this.api.deleteSize(item.id);
    request.subscribe({
      next: () => {
        if (kind === 'types') this.types = this.types.filter(existing => existing.id !== item.id);
        else this.sizes = this.sizes.filter(existing => existing.id !== item.id);
        this.setNotice('Élément supprimé.');
        this.loadCatalog();
        this.refreshProductData();
      },
      error: error => this.setError(error, 'Suppression impossible. Cet élément est peut-être utilisé.')
    });
  }

  saveCustomer(details: { name: string; phone: string }): void {
    if (!this.requireUser() || !details.name.trim()) return;
    this.customerLoadVersion++;
    const request = this.customer
      ? this.api.saveCustomer(details.name.trim(), details.phone.trim())
      : this.api.createCustomer(details.name.trim(), details.phone.trim());
    request.subscribe({
      next: customer => {
        this.customer = customer;
        this.customerName = customer.name;
        this.customerPhone = customer.phone ?? '';
        this.setNotice('Votre profil client est enregistré.');
      },
      error: error => this.setError(error, 'Impossible d’enregistrer votre profil client.')
    });
  }

  deleteCustomer(): void {
    if (!this.requireUser() || !this.customer) return;
    this.customerLoadVersion++;
    this.api.deleteCustomer().subscribe({
      next: () => {
        this.customer = null;
        this.customerName = '';
        this.customerPhone = '';
        this.setNotice('Profil client supprimé.');
      },
      error: error => this.setError(error, 'Suppression impossible.')
    });
  }

  placeOrder(product: Product): void {
    this.addToCart(product);
  }

  addToCart(product: Product, quantity = 1): void {
    if (this.user && this.user.role !== 'CLIENT') {
      this.setNotice('Le panier et les commandes sont réservés aux comptes clients.');
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      this.setError(null, 'Saisissez une quantité entière supérieure à zéro.');
      return;
    }
    const existing = this.cart.find(line => line.product.id === product.id);
    const currentQuantity = existing?.quantity ?? 0;
    if (currentQuantity + quantity > product.quantity) {
      this.setError(null, `Stock insuffisant pour « ${product.name} ». Il ne reste que ${product.quantity} article(s).`);
      return;
    }
    this.cart = existing
      ? this.cart.map(line => line.product.id === product.id
        ? { ...line, product, quantity: line.quantity + quantity }
        : line)
      : [...this.cart, { product, quantity }];
    this.setNotice(`${quantity} × « ${product.name} » ajouté(s) au panier.`);
  }

  changeCartQuantity(productId: number, quantity: number): void {
    const line = this.cart.find(item => item.product.id === productId);
    if (!line) return;
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    if (quantity > line.product.quantity) {
      this.setError(null, `Stock insuffisant pour « ${line.product.name} ». Disponible : ${line.product.quantity}.`);
      return;
    }
    this.cart = this.cart.map(item => item.product.id === productId ? { ...item, quantity } : item);
    this.clearMessages();
  }

  removeFromCart(productId: number): void {
    this.cart = this.cart.filter(line => line.product.id !== productId);
    this.clearMessages();
  }

  checkout(): void {
    if (this.cart.length === 0 || this.checkoutLoading) return;
    if (!this.user) {
      this.openAuthentication('login');
      this.setNotice('Connectez-vous ou créez un compte client pour valider votre panier.');
      return;
    }
    if (this.user.role !== 'CLIENT') {
      this.setNotice('La validation du panier est réservée aux comptes clients.');
      return;
    }
    if (!this.shippingAddress.trim()) {
      this.setError(null, 'Veuillez renseigner une adresse de livraison.');
      return;
    }
    this.checkoutLoading = true;
    this.changeDetector.markForCheck();
    if (this.customer) {
      this.submitCart();
      return;
    }
    this.api.customer().pipe(timeout({ first: 10_000 })).subscribe({
      next: customer => {
        this.customer = customer;
        this.customerName = customer.name;
        this.customerPhone = customer.phone ?? '';
        this.submitCart();
        this.changeDetector.markForCheck();
      },
      error: error => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.api.createCustomer(this.user!.username, '').pipe(timeout({ first: 10_000 })).subscribe({
            next: customer => {
              this.customer = customer;
              this.customerName = customer.name;
              this.customerPhone = customer.phone ?? '';
              this.submitCart();
              this.changeDetector.markForCheck();
            },
            error: createError => {
              this.checkoutLoading = false;
              this.setError(createError, 'Impossible de préparer votre profil client. Complétez-le depuis Mon profil.');
              this.changeDetector.markForCheck();
            }
          });
          return;
        }
        this.checkoutLoading = false;
        this.setError(error, 'Impossible de vérifier votre profil client.');
        this.changeDetector.markForCheck();
      }
    });
  }

  private submitCart(): void {
    if (!this.cart.length || !this.user) {
      this.checkoutLoading = false;
      return;
    }
    const orderTotal = this.cartTotal;
    const items = this.cart.map(line => ({ productId: line.product.id, quantity: line.quantity }));
    this.checkoutLoading = true;
    this.api.createCart(items, this.shippingAddress.trim()).pipe(
      finalize(() => {
        this.checkoutLoading = false;
        this.changeDetector.markForCheck();
      })
    ).subscribe({
      next: orders => {
        this.orders = [...orders, ...this.orders.filter(old => !orders.some(created => created.id === old.id))];
        this.cart = [];
        this.refreshProductData();
        this.loadOrders();
        this.setNotice(`Commande validée : ${orders.length} ligne(s), total ${this.currency(orderTotal)}.`);
        this.changeDetector.markForCheck();
      },
      error: error => {
        const fallback = error instanceof HttpErrorResponse
          ? error.status === 0
            ? 'Le serveur ne répond pas. Vérifiez que Spring est démarré.'
            : error.status === 401
              ? 'Votre session a expiré. Déconnectez-vous puis reconnectez-vous.'
              : error.status === 403
                ? 'L’API a refusé la commande (403). Vérifiez que le rôle CLIENT est bien enregistré pour ce compte et que le backend de la boutique tourne sur le port 8080.'
                : error.status === 404
                  ? 'API panier introuvable. Redémarrez le backend recompilé avec la route POST /api/orders/cart.'
                  : error.status === 409
                    ? 'Le stock a changé depuis l’ajout au panier. Les quantités disponibles ont été actualisées ; ajustez le panier avant de réessayer.'
                    : error.status === 400
                      ? 'Les informations client, l’adresse ou les quantités du panier sont invalides. Vérifiez votre profil et le panier.'
                      : 'La commande a échoué. Vérifiez le profil client, le serveur et les détails de la réponse.'
          : 'La commande a échoué. Vérifiez le profil client et réessayez.';
        this.setError(error, fallback);
        this.loadProducts();
        this.changeDetector.markForCheck();
      }
    });
  }

  private currency(value: number): string {
    return new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA', maximumFractionDigits: 0 }).format(value);
  }

  approveVendor(userId: number): void {
    this.updateAdminUser(userId, true);
  }

  rejectVendor(userId: number): void {
    this.updateAdminUser(userId, false);
  }

  changeOrderStatus(change: { order: ShopOrder; status: string }): void {
    if (!this.requireUser()) return;
    this.ordersLoadVersion++;
    const previousStatus = change.order.status;
    this.orders = this.orders.map(order => order.id === change.order.id
      ? { ...order, status: change.status }
      : order);
    this.api.updateOrderStatus(change.order.id, change.status).subscribe({
      next: updated => {
        this.orders = this.orders.map(order => order.id === updated.id ? updated : order);
        this.setNotice('Statut de commande mis à jour.');
      },
      error: error => {
        this.orders = this.orders.map(order => order.id === change.order.id
          ? { ...order, status: previousStatus }
          : order);
        this.setError(error, 'Modification du statut impossible.')
      }
    });
  }

  cancelOrder(order: ShopOrder): void {
    if (!this.requireUser()) return;
    this.api.cancelOrder(order.id).subscribe({
      next: () => {
        this.orders = this.orders.filter(existing => existing.id !== order.id);
        this.incrementProductStock(order.productId, Number(order.quantity));
        this.setNotice('Commande annulée et stock restitué.');
        this.loadOrders();
        this.refreshProductData();
      },
      error: error => this.setError(error, 'Cette commande ne peut pas être annulée.')
    });
  }

  initials(name: string): string {
    return name.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join('');
  }

  private setUser(result: AuthResponse): AuthResponse {
    const normalized: AuthResponse = {
      ...result,
      role: this.normalizeRole(result.role),
      status: this.normalizeStatus(result.status)
    };
    this.user = normalized;
    localStorage.setItem('clothes_token', normalized.token);
    localStorage.setItem('clothes_username', normalized.username);
    localStorage.setItem('clothes_email', normalized.email);
    localStorage.setItem('clothes_user_id', String(normalized.userId));
    localStorage.setItem('clothes_user_role', normalized.role);
    localStorage.setItem('clothes_user_status', normalized.status);
    return normalized;
  }

  private loadProducts(): void {
    const version = ++this.productsLoadVersion;
    this.api.products().subscribe({
      next: products => {
        if (version !== this.productsLoadVersion) return;
        this.products = products;
        this.cart = this.cart.map(line => {
          const current = products.find(product => product.id === line.product.id);
          return current
            ? { ...line, product: current }
            : { ...line, product: { ...line.product, quantity: 0 } };
        });
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: error => {
        if (version !== this.productsLoadVersion) return;
        this.loading = false;
        this.setError(error, 'Impossible de charger les produits. Vérifiez que le serveur Spring est démarré.');
        this.changeDetector.markForCheck();
      }
    });
  }

  private loadInventory(): void {
    if (!this.user) return;
    const version = ++this.inventoryLoadVersion;
    this.api.myProducts().subscribe({
      next: products => {
        if (version === this.inventoryLoadVersion && this.user) this.inventory = products;
      },
      error: error => {
        if (version === this.inventoryLoadVersion && this.user) {
          this.setError(error, 'Impossible de charger votre inventaire.');
        }
      }
    });
  }

  private loadCatalog(): void {
    const typesVersion = ++this.typesLoadVersion;
    this.api.types().subscribe({
      next: items => {
        if (typesVersion === this.typesLoadVersion) this.types = items;
      },
      error: error => {
        if (typesVersion === this.typesLoadVersion) this.setError(error, 'Impossible de charger les collections.');
      }
    });
    const sizesVersion = ++this.sizesLoadVersion;
    this.api.sizes().subscribe({
      next: items => {
        if (sizesVersion === this.sizesLoadVersion) this.sizes = items;
      },
      error: error => {
        if (sizesVersion === this.sizesLoadVersion) this.setError(error, 'Impossible de charger les tailles.');
      }
    });
  }

  private loadOrders(): void {
    if (!this.user) return;
    const version = ++this.ordersLoadVersion;
    this.api.orders().subscribe({
      next: orders => {
        if (version === this.ordersLoadVersion && this.user) this.orders = orders;
      },
      error: error => {
        if (version === this.ordersLoadVersion && this.user) this.setError(error, 'Impossible de charger les commandes.');
      }
    });
  }

  private loadAdminUsers(): void {
    if (this.user?.role !== 'ADMIN') return;
    const version = ++this.adminUsersLoadVersion;
    this.adminUsersLoading = true;
    this.adminUsersLoadFailed = false;
    this.clearMessages();
    this.api.adminUsers().pipe(
      timeout({ first: 10_000 }),
      finalize(() => {
        if (version === this.adminUsersLoadVersion && this.user?.role === 'ADMIN') {
          this.adminUsersLoading = false;
          this.changeDetector.markForCheck();
        }
      })
    ).subscribe({
      next: users => {
        if (version !== this.adminUsersLoadVersion || this.user?.role !== 'ADMIN') return;
        this.adminUsers = users;
        this.adminUsersLoadFailed = false;
      },
      error: error => {
        if (version !== this.adminUsersLoadVersion || this.user?.role !== 'ADMIN') return;
        this.adminUsersLoadFailed = true;
        const fallback = error instanceof TimeoutError
          ? 'Le chargement des utilisateurs a pris trop de temps. Réessayez.'
          : 'Impossible de charger les utilisateurs. Vérifiez votre connexion et réessayez.';
        this.setError(error, fallback);
      }
    });
  }

  private updateAdminUser(userId: number, approve: boolean): void {
    if (this.user?.role !== 'ADMIN' || this.busyAdminUserId !== null) return;
    this.busyAdminUserId = userId;
    const request = approve ? this.api.approveVendor(userId) : this.api.rejectVendor(userId);
    request.subscribe({
      next: updated => {
        this.busyAdminUserId = null;
        this.adminUsers = this.adminUsers.map(user => user.userId === updated.userId ? updated : user);
        this.setNotice(approve ? 'Vendeur approuvé.' : 'Demande vendeur refusée.');
      },
      error: error => {
        this.busyAdminUserId = null;
        this.setError(error, 'Impossible de modifier le statut de cet utilisateur.');
      }
    });
  }

  private loadCustomer(): void {
    if (!this.user) return;
    const version = ++this.customerLoadVersion;
    this.api.customer().subscribe({
      next: customer => {
        if (version !== this.customerLoadVersion || !this.user) return;
        this.customer = customer;
        this.customerName = customer.name;
        this.customerPhone = customer.phone ?? '';
      },
      error: error => {
        if (version !== this.customerLoadVersion || !this.user) return;
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.customer = null;
          this.customerName = '';
          this.customerPhone = '';
          return;
        }
        this.setError(error, 'Impossible de charger votre profil client.');
      }
    });
  }

  private loadPrivateData(): void {
    this.loadInventory();
    this.loadOrders();
    this.loadCustomer();
  }

  private refreshProductData(): void {
    this.loadProducts();
    this.loadInventory();
  }

  private upsertProduct(current: Product[], updated: Product): Product[] {
    const exists = current.some(product => product.id === updated.id);
    return exists
      ? current.map(product => product.id === updated.id ? updated : product)
      : [updated, ...current];
  }

  private upsertCatalog(current: CatalogItem[], updated: CatalogItem): CatalogItem[] {
    const exists = current.some(item => item.id === updated.id);
    return exists
      ? current.map(item => item.id === updated.id ? updated : item)
      : [...current, updated];
  }

  private incrementProductStock(productId: number, quantity: number): void {
    const increase = (items: Product[]) => items.map(product => product.id === productId
      ? { ...product, quantity: product.quantity + quantity }
      : product);
    this.products = increase(this.products);
    this.inventory = increase(this.inventory);
  }

  private requireUser(): boolean {
    if (this.user) return true;
    this.openAuthentication('login');
    this.setNotice('Connectez-vous pour effectuer cette action.');
    return false;
  }

  private setError(error: unknown, fallback: string): void {
    if (error instanceof HttpErrorResponse) {
      const detail = typeof error.error === 'string'
        ? error.error
        : error.error?.detail ?? error.error?.message;
      const message = typeof detail === 'string' ? detail.trim() : '';
      const genericHttpMessages = ['bad request', 'forbidden', 'not found', 'conflict', 'internal server error'];
      this.error = message && !genericHttpMessages.includes(message.toLowerCase()) ? message : fallback;
    } else {
      this.error = fallback;
    }
    this.notice = '';
    this.changeDetector.markForCheck();
  }

  private setNotice(message: string): void {
    this.notice = message;
    this.error = '';
    this.changeDetector.markForCheck();
  }

  clearError(): void {
    this.error = '';
  }

  private clearMessages(): void {
    this.error = '';
    this.notice = '';
  }
}
