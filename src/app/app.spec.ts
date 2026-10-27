import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject, throwError } from 'rxjs';
import { App } from './app';
import { ShopApi } from './core/shop-api.service';
import { AdminUser, AuthResponse, Product } from './core/models';

describe('App', () => {
  const product: Product = {
    id: 12,
    typeId: null,
    typeName: null,
    sizeId: null,
    sizeName: null,
    name: 'Chemise en lin',
    price: 29000,
    date: '2026-10-06T10:00:00',
    quantity: 4,
    imageUrl: null,
    userId: 5,
    username: 'amina'
  };

  const admin: AuthResponse = {
    token: 'admin-token',
    tokenType: 'Bearer',
    userId: 1,
    username: 'admin',
    email: 'admin@example.com',
    role: 'ADMIN',
    status: 'APPROVED'
  };
  const adminUsers: AdminUser[] = [{
    userId: 2,
    username: 'vendeur',
    email: 'vendeur@example.com',
    role: 'VENDOR',
    status: 'PENDING'
  }];
  const client: AuthResponse = {
    ...admin,
    userId: 5,
    username: 'amina',
    email: 'amina@example.com',
    role: 'CLIENT'
  };
  const order = {
    id: 15,
    customerId: 1,
    customerName: 'Amina',
    productId: product.id,
    productName: product.name,
    date: '2026-10-06T10:00:00',
    status: 'PENDING',
    place: 'Antananarivo',
    quantity: 2
  };

  const shopApi = {
    login: vi.fn(),
    adminUsers: vi.fn(),
    createCart: vi.fn(),
    products: vi.fn(),
    types: vi.fn(),
    sizes: vi.fn(),
    orders: vi.fn(),
    customer: vi.fn(),
    myProducts: vi.fn(),
    mediaUrl: vi.fn((url: string | null) => url),
    saveProduct: vi.fn(),
    deleteProduct: vi.fn()
  };

  beforeEach(async () => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
    localStorage.clear();
    shopApi.login.mockReturnValue(of(admin));
    shopApi.adminUsers.mockReturnValue(of(adminUsers));
    shopApi.products.mockReturnValue(of([]));
    shopApi.types.mockReturnValue(of([]));
    shopApi.sizes.mockReturnValue(of([]));
    shopApi.orders.mockReturnValue(of([]));
    shopApi.customer.mockReturnValue(of({
      id: 1,
      name: 'Amina',
      phone: null,
      userId: 5
    }));
    shopApi.myProducts.mockReturnValue(of([]));
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{
        provide: ShopApi,
        useValue: shopApi
      }]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('loads the admin user list immediately after admin login', () => {
    shopApi.login.mockReturnValueOnce(of({
      ...admin,
      role: 'admin' as AuthResponse['role']
    }));
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    app.authenticate({ username: admin.username, password: 'password', email: '' });

    expect(app.user?.role).toBe('ADMIN');
    expect(app.activePage).toBe('admin');
    expect(shopApi.adminUsers).toHaveBeenCalledTimes(1);
    expect(app.adminUsers).toEqual(adminUsers);
    expect(app.adminUsersLoading).toBe(false);
    expect(app.authLoading).toBe(false);
  });

  it('shows the admin list error and loads users after retry', () => {
    shopApi.adminUsers.mockReturnValueOnce(throwError(() => new Error('Forbidden')));
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    app.user = admin;

    app.reloadAdminUsers();

    expect(app.adminUsersLoading).toBe(false);
    expect(app.adminUsersLoadFailed).toBe(true);
    shopApi.adminUsers.mockReturnValueOnce(of(adminUsers));
    app.reloadAdminUsers();

    expect(app.adminUsersLoading).toBe(false);
    expect(app.adminUsersLoadFailed).toBe(false);
    expect(app.adminUsers).toEqual(adminUsers);
  });

  it('shows an invalid-login error immediately without requiring another input event', () => {
    shopApi.login.mockReturnValueOnce(throwError(() => new HttpErrorResponse({
      status: 401,
      error: { detail: 'Invalid username or password' }
    })));
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();

    app.authenticate({ username: 'wrong', password: 'wrong-password', email: '' });
    fixture.detectChanges();

    expect(app.error).toBe('Invalid username or password');
    expect(app.authLoading).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Invalid username or password');
  });

  it('adds products to a cart and checks out all quantities in one request', () => {
    shopApi.createCart.mockReturnValue(of([order]));
    shopApi.orders.mockReturnValue(of([order]));
    shopApi.products.mockReturnValue(of([{ ...product, quantity: 2 }]));

    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    app.user = client;
    app.customer = { id: 1, name: 'Amina', phone: null, userId: client.userId };
    app.products = [product];

    app.addToCart(product);
    app.addToCart(product);
    expect(app.cartItemCount).toBe(2);
    expect(app.cartTotal).toBe(product.price * 2);

    app.checkout();

    expect(shopApi.createCart).toHaveBeenCalledWith([{ productId: product.id, quantity: 2 }], 'Antananarivo');
    expect(app.cart).toEqual([]);
    expect(app.orders).toContainEqual(order);
  });

  it('does not report that a client has the wrong role for an unexplained 403', () => {
    shopApi.createCart.mockReturnValueOnce(throwError(() => new HttpErrorResponse({
      status: 403,
      error: { error: 'Forbidden' }
    })));
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    app.user = client;
    app.customer = { id: 1, name: 'Amina', phone: null, userId: client.userId };
    app.cart = [{ product, quantity: 1 }];

    app.checkout();

    expect(app.error).toContain('L’API a refusé la commande (403)');
    expect(app.error).toContain('backend de la boutique');
    expect(app.checkoutLoading).toBe(false);
  });

  it('adds the requested quantity from a product quantity field to the cart', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    app.addToCart(product, 3);

    expect(app.cart).toEqual([{ product, quantity: 3 }]);
    expect(app.cartTotal).toBe(product.price * 3);
  });

  it('does not allow adding more than available stock to the cart', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    app.addToCart(product);
    app.changeCartQuantity(product.id, product.quantity);
    app.addToCart(product);

    expect(app.cart.find(line => line.product.id === product.id)?.quantity).toBe(product.quantity);
    expect(app.error).toContain('Stock insuffisant');
  });

  it('should render the storefront', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Le style commence');
  });

  it('shows a newly created product immediately and refreshes both product lists', () => {
    const staleInitialLoad = new Subject<Product[]>();
    shopApi.products.mockReturnValueOnce(staleInitialLoad.asObservable()).mockReturnValue(of([product]));
    shopApi.saveProduct.mockReturnValue(of(product));
    shopApi.myProducts.mockReturnValue(of([product]));

    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    app.user = {
      token: 'test-token',
      tokenType: 'Bearer',
      userId: 5,
      username: 'amina',
      email: 'amina@example.com',
      role: 'CLIENT',
      status: 'APPROVED'
    };

    app.saveProduct({
      payload: {
        typeId: null,
        sizeId: null,
        name: product.name,
        price: product.price,
        quantity: product.quantity,
        imageUrl: null
      },
      file: null
    });

    expect(app.products).toEqual([product]);
    expect(app.inventory).toEqual([product]);
    expect(shopApi.products).toHaveBeenCalledTimes(2);
    expect(shopApi.myProducts).toHaveBeenCalledTimes(1);

    staleInitialLoad.next([]);
    expect(app.products).toEqual([product]);
  });

  it('removes a deleted product from the visible lists without a page reload', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    shopApi.deleteProduct.mockReturnValue(of(undefined));

    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    fixture.detectChanges();
    app.user = {
      token: 'test-token',
      tokenType: 'Bearer',
      userId: 5,
      username: 'amina',
      email: 'amina@example.com',
      role: 'CLIENT',
      status: 'APPROVED'
    };
    app.products = [product];
    app.inventory = [product];

    app.deleteProduct(product);

    expect(app.products).toEqual([]);
    expect(app.inventory).toEqual([]);
    expect(shopApi.deleteProduct).toHaveBeenCalledWith(product.id);
  });
});
