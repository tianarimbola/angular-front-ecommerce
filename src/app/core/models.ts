export interface AuthResponse {
  token: string;
  tokenType: string;
  userId: number;
  username: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface AdminUser {
  userId: number;
  username: string;
  email: string;
  role: 'CLIENT' | 'VENDOR' | 'ADMIN';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Product {
  id: number;
  typeId: number | null;
  typeName: string | null;
  sizeId: number | null;
  sizeName: string | null;
  name: string;
  price: number;
  date: string;
  quantity: number;
  imageUrl: string | null;
  userId: number | null;
  username: string | null;
}

export interface CartLine {
  product: Product;
  quantity: number;
}

export interface CartAddRequest {
  product: Product;
  quantity: number;
}

export interface CatalogItem {
  id: number;
  name: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string | null;
  userId: number;
}

export interface ShopOrder {
  id: number;
  customerId: number;
  customerName: string;
  productId: number;
  productName: string;
  date: string;
  status: string;
  place: string;
  quantity: number;
}

export interface ProductPayload {
  typeId: number | null;
  sizeId: number | null;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string | null;
}
