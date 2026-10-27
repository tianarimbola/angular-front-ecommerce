import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  AuthResponse,
  AdminUser,
  CatalogItem,
  Customer,
  Product,
  ProductPayload,
  ShopOrder
} from './models';

@Injectable({ providedIn: 'root' })
export class ShopApi {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api`;

  register(username: string, email: string, password: string, role: 'CLIENT' | 'VENDOR' = 'CLIENT'): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/register`, { username, email, password, role });
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/login`, { username, password });
  }

  adminUsers(): Observable<AdminUser[]> {
    return this.http.get<AdminUser[]>(`${this.api}/admin/users`);
  }

  approveVendor(userId: number): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.api}/admin/users/${userId}/approve`, {});
  }

  rejectVendor(userId: number): Observable<AdminUser> {
    return this.http.post<AdminUser>(`${this.api}/admin/users/${userId}/reject`, {});
  }

  products(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.api}/products`);
  }

  myProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.api}/products/mine`);
  }

  saveProduct(payload: ProductPayload, file: File | null, id?: number): Observable<Product> {
    const url = id ? `${this.api}/products/${id}` : `${this.api}/products`;
    if (!file) {
      return id
        ? this.http.put<Product>(url, payload)
        : this.http.post<Product>(url, payload);
    }
    const body = new FormData();
    body.append('product', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    body.append('file', file);
    return id
      ? this.http.put<Product>(url, body)
      : this.http.post<Product>(url, body);
  }

  deleteProduct(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/products/${id}`);
  }

  types(): Observable<CatalogItem[]> {
    return this.http.get<CatalogItem[]>(`${this.api}/types`);
  }

  sizes(): Observable<CatalogItem[]> {
    return this.http.get<CatalogItem[]>(`${this.api}/sizes`);
  }

  saveType(name: string, id?: number): Observable<CatalogItem> {
    const url = `${this.api}/types${id ? `/${id}` : ''}`;
    return id
      ? this.http.put<CatalogItem>(url, { name })
      : this.http.post<CatalogItem>(url, { name });
  }

  saveSize(name: string, id?: number): Observable<CatalogItem> {
    const url = `${this.api}/sizes${id ? `/${id}` : ''}`;
    return id
      ? this.http.put<CatalogItem>(url, { name })
      : this.http.post<CatalogItem>(url, { name });
  }

  deleteType(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/types/${id}`);
  }

  deleteSize(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/sizes/${id}`);
  }

  customer(): Observable<Customer> {
    return this.http.get<Customer>(`${this.api}/customers/me`);
  }

  saveCustomer(name: string, phone: string): Observable<Customer> {
    return this.http.put<Customer>(`${this.api}/customers/me`, { name, phone });
  }

  createCustomer(name: string, phone: string): Observable<Customer> {
    return this.http.post<Customer>(`${this.api}/customers/me`, { name, phone });
  }

  deleteCustomer(): Observable<void> {
    return this.http.delete<void>(`${this.api}/customers/me`);
  }

  orders(): Observable<ShopOrder[]> {
    return this.http.get<ShopOrder[]>(`${this.api}/orders`);
  }

  createCart(items: { productId: number; quantity: number }[], place: string): Observable<ShopOrder[]> {
    return this.http.post<ShopOrder[]>(`${this.api}/orders/cart`, { items, place });
  }

  createOrder(productId: number, place: string, quantity = 1): Observable<ShopOrder> {
    return this.http.post<ShopOrder>(`${this.api}/orders`, { productId, place, quantity });
  }

  updateOrderStatus(id: number, status: string): Observable<ShopOrder> {
    return this.http.patch<ShopOrder>(`${this.api}/orders/${id}/status`, { status });
  }

  cancelOrder(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/orders/${id}`);
  }

  mediaUrl(url: string | null): string | null {
    if (!url) return null;
    return url.startsWith('/api/')
      ? `${environment.apiUrl}${url}`
      : url;
  }
}
