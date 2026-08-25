import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { CurrencyPipe } from '../../../../shared/pipes/pipes';

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
