export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface EncryptedResponse {
  data: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  userType: 'customer' | 'admin';
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface SubCategory {
  id: number;
  name: string;
  categoryId: number;
  isActive: boolean;
}

export interface ProductSku {
  id: number;
  skuCode: string;
  price: number;
  stock: number;
  variantKeys?: string | null;
  variantDetails?: string | null;
  images?: string[];
  description?: string | null;
}

export interface SpecAttr {
  name: string;
  value: string;
  type?: string;
}

export interface ProductSpec {
  id: number;
  name: string;
  description?: string;
  order_no?: number;
  attributes?: SpecAttr[];
}

export interface Product {
  id: number;
  prodName: string;
  prodImg: string;
  prodPrice: number;
  description?: string;
  categoryId: number;
  isOnSale: boolean;
  salePrice?: number;
  originalPrice?: number;
  discountPercent?: number;
  stock?: number;
  sku?: string;
  skus?: ProductSku[];
  specs?: ProductSpec[];
  images?: string[];
  reviews?: Review[];
  createdAt?: string;
}

export interface Review {
  id: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productId: number;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  stock?: number;
  specs?: Record<string, string>;
  isOnSale?: boolean;
}

export interface Order {
  id: number;
  userId: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  items: OrderItem[];
  shippingAddress?: Address;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

export interface Address {
  id?: number;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state?: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface UserSettings {
  id?: number;
  userId: number;
  language: string;
  theme: string;
  currency: string;
  notifications?: boolean;
}

export interface AdBanner {
  id: number;
  title: string;
  imageUrl: string;
  position: string;
  link?: string;
  isActive: boolean;
}

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  recentOrders: Order[];
  topProducts: Product[];
}
