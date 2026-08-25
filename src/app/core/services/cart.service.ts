import { Injectable, signal } from '@angular/core';

export interface SelectedSku {
  skuId: number;
  skuCode: string;
  label: string;
  price: number;
  stock: number;
  image?: string;
}

export interface CartItem {
  key: string;
  productId: number;
  skuId?: number;
  skuCode?: string;
  skuLabel?: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  stock?: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly _items = signal<CartItem[]>([]);
  readonly items = this._items.asReadonly();

  readonly count = signal(0);
  readonly total = signal(0);

  constructor() {
    if (typeof window !== 'undefined') {
      this.load();
    }
  }

  private load(): void {
    const data = localStorage.getItem('skuvo_cart');
    if (data) {
      try {
        const items: CartItem[] = JSON.parse(data);
        // Backfill keys for carts saved before SKU support
        this._items.set(items.map((i) => ({ ...i, key: i.key || String(i.productId) })));
      } catch { /* ignore */ }
    }
    this.recalc();
  }

  private persist(): void {
    localStorage.setItem('skuvo_cart', JSON.stringify(this._items()));
    this.recalc();
  }

  private recalc(): void {
    const items = this._items();
    this.count.set(items.reduce((s, i) => s + i.quantity, 0));
    this.total.set(items.reduce((s, i) => s + i.price * i.quantity, 0));
  }

  addItem(product: any, quantity = 1, sku?: SelectedSku): void {
    const items = [...this._items()];
    const key = sku ? `${product.id}::${sku.skuCode}` : String(product.id);
    const idx = items.findIndex((i) => i.key === key);
    if (idx >= 0) {
      items[idx] = { ...items[idx], quantity: items[idx].quantity + quantity };
    } else {
      items.push({
        key,
        productId: product.id,
        skuId: sku?.skuId,
        skuCode: sku?.skuCode,
        skuLabel: sku?.label,
        name: product.prodName,
        image: sku?.image || product.prodImg,
        price: sku ? sku.price : (product.isOnSale ? (product.salePrice ?? product.prodPrice) : product.prodPrice),
        originalPrice: product.isOnSale ? product.prodPrice : undefined,
        quantity,
        stock: sku ? sku.stock : product.stock,
      });
    }
    this._items.set(items);
    this.persist();
  }

  removeItem(key: string | number): void {
    const k = String(key);
    this._items.set(this._items().filter((i) => i.key !== k));
    this.persist();
  }

  updateQuantity(key: string | number, quantity: number): void {
    if (quantity <= 0) return this.removeItem(key);
    const k = String(key);
    this._items.set(this._items().map((i) => (i.key === k ? { ...i, quantity } : i)));
    this.persist();
  }

  clear(): void {
    this._items.set([]);
    this.persist();
  }
}
