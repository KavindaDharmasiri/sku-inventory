import { Component, ElementRef, inject, OnInit, signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { I18nService } from '../../core/services/i18n.service';
import { ToastService } from '../../core/services/toast.service';
import { CurrencyPipe } from '../../shared/pipes/pipes';

@Component({
  selector: 'skuvo-admin-products',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">
          {{ i18n.t('admin.products') }}
        </h1>
        <a routerLink="/admin/products/add"
           class="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white
                  rounded-xl text-sm font-medium transition-colors">
          {{ i18n.t('admin.addProduct') }}
        </a>
      </div>

      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Product</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Price</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Stock</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                <th class="whitespace-nowrap px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
              @for (p of products(); track p.id) {
                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <img [src]="p.prodImg" class="w-10 h-10 rounded-lg object-cover bg-neutral-100">
                      <span class="font-medium text-neutral-900 dark:text-white truncate max-w-[200px]">
                        {{ p.prodName }}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-neutral-900 dark:text-white">{{ p.prodPrice | currency }}</td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ p.stock || 0 }}</td>
                  <td class="px-6 py-4">
                    @if (p.isOnSale) {
                      <span class="px-2 py-0.5 text-[10px] font-bold bg-primary/10 text-primary rounded-full uppercase">
                        On Sale
                      </span>
                    } @else {
                      <span class="px-2 py-0.5 text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 rounded-full uppercase">
                        Active
                      </span>
                    }
                  </td>
                  <td class="px-6 py-4 text-right whitespace-nowrap">
                    <a [routerLink]="['/product', p.id]"
                       class="text-xs text-neutral-500 hover:text-primary font-medium mr-3">View</a>
                    <a [routerLink]="['/admin/products', p.id, 'edit']"
                       class="text-xs text-primary hover:text-primary-dark font-medium mr-3">Edit</a>
                    <button (click)="deleteProduct(p)" [disabled]="deleting() === p.id"
                            class="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer disabled:opacity-50">
                      {{ deleting() === p.id ? '…' : 'Delete' }}
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center text-neutral-400">No products yet</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminProductsComponent implements OnInit {
  private api = inject(ApiService);
  private confirm = inject(ConfirmService);
  private toast = inject(ToastService);
  i18n = inject(I18nService);

  products = signal<any[]>([]);
  deleting = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.get<any[]>('/products').subscribe({
      next: (res) => { if (res?.data) this.products.set(res.data); },
      error: () => {},
    });
  }

  deleteProduct(p: any): void {
    this.confirm.confirm({
      title: 'Delete product?',
      message: `"${p.prodName}" will be removed from the store. This cannot be undone.`,
      confirmText: 'Delete',
      type: 'danger',
      onConfirm: () => {
        this.deleting.set(p.id);
        this.api.delete<any>(`/admin/products/${p.id}`).subscribe({
          next: (res) => {
            this.deleting.set(null);
            if (res?.success) {
              this.toast.success('Product deleted');
              this.load();
            } else {
              this.toast.error(res?.error || 'Failed to delete product');
            }
          },
          error: (err) => {
            this.deleting.set(null);
            this.toast.error(err?.error?.error || 'Failed to delete product');
          },
        });
      },
    });
  }
}

@Component({
  selector: 'skuvo-admin-orders',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">
        {{ i18n.t('admin.orders') }}
      </h1>
      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Order ID</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Customer</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Total</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                <th class="whitespace-nowrap px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
              @for (order of orders(); track order.id) {
                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td class="px-6 py-4 font-mono text-xs text-neutral-500">{{ order.orderNumber || order.id }}</td>
                  <td class="px-6 py-4 text-neutral-900 dark:text-white">{{ order.customerName || ('User ' + order.userId) }}</td>
                  <td class="px-6 py-4 font-medium text-neutral-900 dark:text-white">{{ order.total | currency }}</td>
                  <td class="px-6 py-4">
                    <span class="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full"
                          [class]="getStatusClass(order.status)">
                      {{ order.status }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <a [routerLink]="['/admin/orders', order.id]"
                       class="text-xs text-primary hover:text-primary-dark font-medium">View</a>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center text-neutral-400">No orders</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminOrdersComponent implements OnInit {
  private api = inject(ApiService);
  i18n = inject(I18nService);

  orders = signal<any[]>([]);

  ngOnInit(): void {
    this.api.get<any[]>('/admin/orders').subscribe({
      next: (res) => { if (res?.data) this.orders.set(res.data); },
      error: () => {},
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700', processing: 'bg-sky-50 text-sky-700',
      shipped: 'bg-blue-50 text-blue-700', delivered: 'bg-emerald-50 text-emerald-700',
      cancelled: 'bg-red-50 text-red-700',
    };
    return map[status] || 'bg-neutral-50 text-neutral-700';
  }
}

@Component({
  selector: 'skuvo-admin-order-detail',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <a routerLink="/admin/orders" class="text-sm text-neutral-500 hover:text-primary transition-colors">← Orders</a>
        <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">
          {{ order()?.orderNumber || 'Order' }}
        </h1>
      </div>

      @if (loading()) {
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6 animate-pulse space-y-3">
          <div class="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/3"></div>
          <div class="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/2"></div>
          <div class="h-4 bg-neutral-100 dark:bg-neutral-800 rounded w-1/4"></div>
        </div>
      } @else if (order(); as o) {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Summary -->
          <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6 space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</span>
              <span class="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full" [class]="getStatusClass(o.status)">
                {{ o.status }}
              </span>
            </div>
            <div>
              <p class="text-xs text-neutral-500">Customer</p>
              <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ o.customerName }}</p>
              <p class="text-xs text-neutral-500">{{ o.email }}</p>
            </div>
            <div>
              <p class="text-xs text-neutral-500">Shipping Address</p>
              <p class="text-sm text-neutral-900 dark:text-white">{{ o.address || '—' }}</p>
            </div>
            <div class="flex gap-8">
              <div>
                <p class="text-xs text-neutral-500">Payment</p>
                <p class="text-sm capitalize text-neutral-900 dark:text-white">{{ o.paymentMethod || '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-neutral-500">Placed</p>
                <p class="text-sm text-neutral-900 dark:text-white">{{ o.createdAt | date:'medium' }}</p>
              </div>
            </div>
          </div>

          <!-- Totals -->
          <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6">
            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Totals</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Subtotal</span><span>{{ o.subtotal | currency }}</span>
              </div>
              @if (o.discount > 0) {
                <div class="flex justify-between text-success">
                  <span>Discount</span><span>-{{ o.discount | currency }}</span>
                </div>
              }
              <div class="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Tax</span><span>{{ o.tax | currency }}</span>
              </div>
              <div class="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Shipping</span><span>{{ o.shippingFee > 0 ? (o.shippingFee | currency) : 'Free' }}</span>
              </div>
              <hr class="border-neutral-100 dark:border-neutral-800">
              <div class="flex justify-between text-base font-bold text-neutral-900 dark:text-white">
                <span>Total</span><span>{{ o.total | currency }}</span>
              </div>
            </div>
          </div>
        </div>
      } @else {
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-12 text-center">
          <p class="text-neutral-400">Order not found.</p>
        </div>
      }
    </div>
  `,
})
export class AdminOrderDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);

  order = signal<any>(null);
  loading = signal(true);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.get<any[]>('/admin/orders').subscribe({
      next: (res) => {
        this.order.set((res?.data || []).find((o: any) => o.id === id) || null);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700', processing: 'bg-sky-50 text-sky-700',
      shipped: 'bg-blue-50 text-blue-700', delivered: 'bg-emerald-50 text-emerald-700',
      cancelled: 'bg-red-50 text-red-700', paid: 'bg-emerald-50 text-emerald-700',
    };
    return map[status] || 'bg-neutral-50 text-neutral-700';
  }
}

@Component({
  selector: 'skuvo-admin-category',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Categories</h1>

      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6">
        <form (ngSubmit)="add()" class="flex flex-col sm:flex-row gap-3">
          <input type="text" [(ngModel)]="newName" name="newName" placeholder="New category name" required
                 class="flex-1 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
          <button type="submit" [disabled]="adding()"
                  class="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap">
            {{ adding() ? 'Adding…' : '+ Add Category' }}
          </button>
        </form>
        @if (error()) { <p class="mt-3 text-sm text-error">{{ error() }}</p> }
      </div>

      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Name</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Description</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
              </tr>
            </thead>
          <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
            @for (c of items(); track c.id) {
              <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <td class="px-6 py-4 font-medium text-neutral-900 dark:text-white">{{ c.name }}</td>
                <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ c.description || '—' }}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full"
                        [class]="c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'">
                    {{ c.isActive ? 'Active' : 'Hidden' }}
                  </span>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="3" class="px-6 py-12 text-center text-neutral-400">No categories</td></tr>
            }
          </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminCategoryComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  items = signal<any[]>([]);
  adding = signal(false);
  error = signal('');
  newName = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.api.get<any[]>('/categories').subscribe({
      next: (res) => { if (res?.data) this.items.set(res.data); },
      error: () => {},
    });
  }

  add(): void {
    const name = this.newName.trim();
    if (!name) return;
    this.adding.set(true);
    this.error.set('');
    this.api.post<any>('/admin/categories', { name }).subscribe({
      next: (res) => {
        this.adding.set(false);
        if (res?.success) {
          this.toast.success('Category added');
          this.newName = '';
          this.load();
        } else {
          this.error.set(res?.error || 'Failed to add category');
        }
      },
      error: (err) => {
        this.adding.set(false);
        this.error.set(err?.error?.error || 'Failed to add category');
      },
    });
  }
}

@Component({
  selector: 'skuvo-admin-subcategory',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Subcategories</h1>

      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6">
        <form (ngSubmit)="add()" class="flex flex-col sm:flex-row gap-3">
          <select [(ngModel)]="newCategoryId" name="newCategoryId" required
                  class="sm:w-48 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            <option [ngValue]="null" disabled>Category</option>
            @for (c of categories(); track c.id) {
              <option [ngValue]="c.id">{{ c.name }}</option>
            }
          </select>
          <input type="text" [(ngModel)]="newName" name="newName" placeholder="New subcategory name" required
                 class="flex-1 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
          <button type="submit" [disabled]="adding()"
                  class="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap">
            {{ adding() ? 'Adding…' : '+ Add Subcategory' }}
          </button>
        </form>
        @if (error()) { <p class="mt-3 text-sm text-error">{{ error() }}</p> }
      </div>

      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Name</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Category</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
              </tr>
            </thead>
          <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
            @for (s of items(); track s.id) {
              <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                <td class="px-6 py-4 font-medium text-neutral-900 dark:text-white">{{ s.name }}</td>
                <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ s.categoryName || '—' }}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full"
                        [class]="s.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'">
                    {{ s.isActive ? 'Active' : 'Hidden' }}
                  </span>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="3" class="px-6 py-12 text-center text-neutral-400">No subcategories</td></tr>
            }
          </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminSubcategoryComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  items = signal<any[]>([]);
  categories = signal<any[]>([]);
  adding = signal(false);
  error = signal('');
  newName = '';
  newCategoryId: number | null = null;

  ngOnInit(): void {
    this.load();
    this.api.get<any[]>('/categories').subscribe({
      next: (res) => { if (res?.data) this.categories.set(res.data); },
      error: () => {},
    });
  }

  load(): void {
    this.api.get<any[]>('/admin/subcategories').subscribe({
      next: (res) => { if (res?.data) this.items.set(res.data); },
      error: () => {},
    });
  }

  add(): void {
    const name = this.newName.trim();
    if (!name || !this.newCategoryId) return;
    this.adding.set(true);
    this.error.set('');
    this.api.post<any>('/admin/subcategories', { name, categoryId: this.newCategoryId }).subscribe({
      next: (res) => {
        this.adding.set(false);
        if (res?.success) {
          this.toast.success('Subcategory added');
          this.newName = '';
          this.load();
        } else {
          this.error.set(res?.error || 'Failed to add subcategory');
        }
      },
      error: (err) => {
        this.adding.set(false);
        this.error.set(err?.error?.error || 'Failed to add subcategory');
      },
    });
  }
}

@Component({
  selector: 'skuvo-admin-transactions',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Transactions</h1>
      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Order</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Customer</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Method</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                <th class="whitespace-nowrap px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
              @for (t of transactions(); track t.id) {
                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td class="px-6 py-4">
                    <a [routerLink]="['/admin/orders', t.id]" class="font-mono text-xs text-primary hover:text-primary-dark">
                      {{ t.orderNumber || t.id }}
                    </a>
                  </td>
                  <td class="px-6 py-4 text-neutral-900 dark:text-white">{{ t.customerName || ('User ' + t.userId) }}</td>
                  <td class="px-6 py-4 capitalize text-neutral-600 dark:text-neutral-400">{{ t.paymentMethod || '—' }}</td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ t.createdAt | date:'mediumDate' }}</td>
                  <td class="px-6 py-4 text-right font-medium text-neutral-900 dark:text-white">{{ t.total | currency }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="px-6 py-12 text-center text-neutral-400">No transactions</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminTransactionsComponent implements OnInit {
  private api = inject(ApiService);

  transactions = signal<any[]>([]);

  ngOnInit(): void {
    this.api.get<any[]>('/admin/orders').subscribe({
      next: (res) => {
        const orders = res?.data || [];
        this.transactions.set(orders.filter((o: any) => o.status === 'paid'));
      },
      error: () => {},
    });
  }
}

@Component({
  selector: 'skuvo-admin-coupons',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Coupons</h1>
      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Code</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Discount</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Min. Order</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Valid Until</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Usage</th>
                <th class="whitespace-nowrap px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
              @for (c of coupons(); track c.id) {
                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td class="px-6 py-4">
                    <span class="font-mono text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded-lg">{{ c.code }}</span>
                  </td>
                  <td class="px-6 py-4 text-neutral-900 dark:text-white">
                    {{ c.discountType === 'percent' ? c.discountValue + '%' : (c.discountValue | currency) }}
                  </td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                    {{ c.minSubtotal > 0 ? (c.minSubtotal | currency) : 'Any' }}
                  </td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ c.validUntil | date:'mediumDate' }}</td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                    {{ c.usedCount }}{{ c.maxUses ? ' / ' + c.maxUses : '' }}
                  </td>
                  <td class="px-6 py-4 text-right">
                    <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full"
                          [class]="c.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'">
                      {{ c.isActive ? 'Active' : 'Expired' }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="px-6 py-12 text-center text-neutral-400">No coupons</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminCouponsComponent implements OnInit {
  private api = inject(ApiService);

  coupons = signal<any[]>([]);

  ngOnInit(): void {
    this.api.get<any[]>('/admin/coupons').subscribe({
      next: (res) => { if (res?.data) this.coupons.set(res.data); },
      error: () => {},
    });
  }
}

@Component({
  selector: 'skuvo-admin-discounts',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Discounts</h1>
      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Name</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Scope</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Target</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Value</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Valid Until</th>
                <th class="whitespace-nowrap px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
              @for (d of discounts(); track d.id) {
                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td class="px-6 py-4 font-medium text-neutral-900 dark:text-white">{{ d.name || ('#' + d.id) }}</td>
                  <td class="px-6 py-4 capitalize text-neutral-600 dark:text-neutral-400">{{ d.scope }}</td>
                  <td class="px-6 py-4 text-neutral-900 dark:text-white">{{ d.targetName || '—' }}</td>
                  <td class="px-6 py-4 text-neutral-900 dark:text-white">
                    {{ d.discountType === 'percent' ? d.discountValue + '%' : (d.discountValue | currency) }}
                  </td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ d.validUntil | date:'mediumDate' }}</td>
                  <td class="px-6 py-4 text-right">
                    <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full"
                          [class]="d.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'">
                      {{ d.isActive ? 'Active' : 'Inactive' }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="6" class="px-6 py-12 text-center text-neutral-400">No discounts</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminDiscountsComponent implements OnInit {
  private api = inject(ApiService);

  discounts = signal<any[]>([]);

  ngOnInit(): void {
    this.api.get<any[]>('/admin/discounts').subscribe({
      next: (res) => { if (res?.data) this.discounts.set(res.data); },
      error: () => {},
    });
  }
}

@Component({
  selector: 'skuvo-admin-reports',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Reports</h1>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Best sellers -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h3 class="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Best Sellers</h3>
          <div class="space-y-3">
            @for (b of bestSellers(); track b.productName) {
              <div class="flex items-center justify-between text-sm">
                <span class="text-neutral-900 dark:text-white truncate max-w-[60%]">{{ b.productName }}</span>
                <span class="text-neutral-500 shrink-0 ml-4">{{ b.unitsSold }} sold · {{ b.revenue | currency }}</span>
              </div>
            } @empty {
              <p class="text-sm text-neutral-400">No sales yet.</p>
            }
          </div>
        </div>

        <!-- Orders by status -->
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6">
          <h3 class="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Orders by Status</h3>
          <div class="space-y-3">
            @for (s of byStatus(); track s.status) {
              <div class="flex items-center justify-between text-sm">
                <span class="capitalize text-neutral-900 dark:text-white">{{ s.status }}</span>
                <span class="text-neutral-500">{{ s.count }} · {{ s.total | currency }}</span>
              </div>
            } @empty {
              <p class="text-sm text-neutral-400">No orders yet.</p>
            }
          </div>
        </div>
      </div>

      <!-- Low stock -->
      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6">
        <h3 class="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Low Stock Alerts (&lt; 20 units)</h3>
        <div class="space-y-3">
          @for (l of lowStock(); track l.productId) {
            <div class="flex items-center justify-between text-sm">
              <a [routerLink]="['/product', l.productId]" class="text-neutral-900 dark:text-white hover:text-primary transition-colors">
                {{ l.prodName }}
              </a>
              <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full"
                    [class]="l.stock === 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'">
                {{ l.stock }} left
              </span>
            </div>
          } @empty {
            <p class="text-sm text-neutral-400">All products are well stocked.</p>
          }
        </div>
      </div>
    </div>
  `,
})
export class AdminReportsComponent implements OnInit {
  private api = inject(ApiService);

  bestSellers = signal<any[]>([]);
  byStatus = signal<any[]>([]);
  lowStock = signal<any[]>([]);

  ngOnInit(): void {
    this.api.get<any>('/admin/reports').subscribe({
      next: (res) => {
        if (res?.data) {
          this.bestSellers.set(res.data.bestSellers || []);
          this.byStatus.set(res.data.byStatus || []);
          this.lowStock.set(res.data.lowStock || []);
        }
      },
      error: () => {},
    });
  }
}

@Component({
  selector: 'skuvo-admin-users',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Users</h1>
      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Name</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Email</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Role</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Joined</th>
                <th class="whitespace-nowrap px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
              @for (u of users(); track u.id) {
                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td class="px-6 py-4 font-medium text-neutral-900 dark:text-white">
                    {{ fullName(u) }}
                  </td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ u.email }}</td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full"
                          [class]="u.userType === 'admin' ? 'bg-primary/10 text-primary' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600'">
                      {{ u.userType }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">{{ u.createdAt | date:'mediumDate' }}</td>
                  <td class="px-6 py-4 text-right">
                    <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full"
                          [class]="u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'">
                      {{ u.isActive ? 'Active' : 'Disabled' }}
                    </span>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="px-6 py-12 text-center text-neutral-400">No users</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminUsersComponent implements OnInit {
  private api = inject(ApiService);

  users = signal<any[]>([]);

  ngOnInit(): void {
    this.api.get<any[]>('/admin/users').subscribe({
      next: (res) => { if (res?.data) this.users.set(res.data); },
      error: () => {},
    });
  }

  fullName(u: any): string {
    const name = [u?.firstName, u?.lastName].filter((x: string) => !!x).join(' ');
    return name || '—';
  }
}

@Component({
  selector: 'skuvo-admin-ads',
  standalone: true,
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Ad Banners</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        @for (ad of ads(); track ad.id) {
          <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
            <img [src]="ad.imageUrl" [alt]="ad.title" class="w-full h-36 object-cover bg-neutral-100 dark:bg-neutral-800">
            <div class="p-4 space-y-1.5">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-semibold text-neutral-900 dark:text-white truncate">{{ ad.title || 'Untitled' }}</p>
                <span class="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full shrink-0"
                      [class]="ad.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-neutral-500'">
                  {{ ad.isActive ? 'Live' : 'Off' }}
                </span>
              </div>
              <p class="text-xs text-neutral-500">Position: <span class="capitalize">{{ ad.position || 'home' }}</span></p>
              @if (ad.link) {
                <p class="text-xs text-primary truncate">{{ ad.link }}</p>
              }
            </div>
          </div>
        } @empty {
          <div class="col-span-full bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-12 text-center">
            <p class="text-neutral-400">No banners yet.</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminAdsComponent implements OnInit {
  private api = inject(ApiService);

  ads = signal<any[]>([]);

  ngOnInit(): void {
    this.api.get<any[]>('/admin/ads').subscribe({
      next: (res) => { if (res?.data) this.ads.set(res.data); },
      error: () => {},
    });
  }
}

@Component({
  selector: 'skuvo-admin-audit',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Audit Log</h1>
      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-sm">
            <thead>
              <tr class="border-b border-neutral-100 dark:border-neutral-800">
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Action</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Entity</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">User</th>
                <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">IP</th>
                <th class="whitespace-nowrap px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">When</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-50 dark:divide-neutral-800">
              @for (a of entries(); track a.id) {
                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                  <td class="px-6 py-4">
                    <span class="font-mono text-xs px-2 py-1 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-lg">
                      {{ a.action }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-neutral-600 dark:text-neutral-400">
                    {{ a.entityType }}{{ a.entityId ? ' #' + a.entityId : '' }}
                  </td>
                  <td class="px-6 py-4 text-neutral-900 dark:text-white">{{ a.userEmail || 'system' }}</td>
                  <td class="px-6 py-4 font-mono text-xs text-neutral-500">{{ a.ipAddress || '—' }}</td>
                  <td class="px-6 py-4 text-right text-neutral-600 dark:text-neutral-400">{{ a.createdAt | date:'short' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="px-6 py-12 text-center text-neutral-400">No audit entries</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class AdminAuditComponent implements OnInit {
  private api = inject(ApiService);

  entries = signal<any[]>([]);

  ngOnInit(): void {
    this.api.get<any[]>('/admin/audit').subscribe({
      next: (res) => { if (res?.data) this.entries.set(res.data); },
      error: () => {},
    });
  }
}

@Component({
  selector: 'skuvo-admin-settings',
  standalone: true,
  template: `
    <div class="max-w-2xl space-y-6">
      <h1 class="text-2xl font-display font-bold text-neutral-900 dark:text-white">Admin Settings</h1>
      <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6 space-y-4">
        <h3 class="text-sm font-semibold text-neutral-900 dark:text-white">Store Configuration</h3>
        <div class="divide-y divide-neutral-50 dark:divide-neutral-800">
          @for (row of settings; track row.label) {
            <div class="flex items-center justify-between py-3 text-sm">
              <span class="text-neutral-500">{{ row.label }}</span>
              <span class="font-medium text-neutral-900 dark:text-white">{{ row.value }}</span>
            </div>
          }
        </div>
        <p class="text-xs text-neutral-400 pt-2">
          Store-wide settings are managed via the database and environment configuration.
        </p>
      </div>
    </div>
  `,
})
export class AdminSettingsComponent {
  settings = [
    { label: 'Currency', value: 'LKR (Rs.)' },
    { label: 'Tax rate', value: '8%' },
    { label: 'Shipping', value: 'Free' },
    { label: 'Payment methods', value: 'Cash on Delivery' },
    { label: 'Languages', value: 'English, සිංහල, தமிழ்' },
    { label: 'Default theme', value: 'System' },
  ];
}
