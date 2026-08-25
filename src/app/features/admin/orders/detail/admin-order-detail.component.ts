import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CurrencyPipe } from '../../../../shared/pipes/pipes';

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

@Component({
  selector: 'skuvo-admin-order-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe, DatePipe],
  template: `
    <div class="space-y-6">
      <div class="flex items-center gap-4">
        <a routerLink="/admin/orders" class="text-sm text-neutral-500 dark:text-neutral-400 hover:text-primary transition-colors">← Orders</a>
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
              <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</span>
              <select
                [disabled]="updatingStatus()"
                class="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full border border-neutral-200 dark:border-neutral-700 bg-transparent cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                [ngModel]="o.status"
                (ngModelChange)="updateStatus(o.id, $event)"
              >
                @for (s of statusOptions; track s) {
                  <option [value]="s" [selected]="s === o.status">{{ s }}</option>
                }
              </select>
            </div>
            <div>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">Customer</p>
              <p class="text-sm font-medium text-neutral-900 dark:text-white">{{ o.customerName }}</p>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ o.email }}</p>
            </div>
            <div>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">Shipping Address</p>
              <p class="text-sm text-neutral-900 dark:text-white">{{ o.address || '—' }}</p>
            </div>
            <div class="flex gap-8">
              <div>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">Payment</p>
                <p class="text-sm capitalize text-neutral-900 dark:text-white">{{ o.paymentMethod || '—' }}</p>
              </div>
              <div>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">Placed</p>
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

        <!-- Order Items -->
        @if (o.items?.length) {
          <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6">
            <h3 class="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Order Items</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-xs text-neutral-500 uppercase tracking-wider border-b border-neutral-100 dark:border-neutral-800">
                    <th class="text-left pb-3 font-medium">Product</th>
                    <th class="text-right pb-3 font-medium">Qty</th>
                    <th class="text-right pb-3 font-medium">Price</th>
                    <th class="text-right pb-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of o.items; track item) {
                    <tr class="border-b border-neutral-50 dark:border-neutral-800/50 last:border-0">
                      <td class="py-3 text-neutral-900 dark:text-white">{{ item.productName || item.name || '—' }}</td>
                      <td class="py-3 text-right text-neutral-600 dark:text-neutral-400">{{ item.quantity }}</td>
                      <td class="py-3 text-right text-neutral-600 dark:text-neutral-400">{{ item.price | currency }}</td>
                      <td class="py-3 text-right font-medium text-neutral-900 dark:text-white">{{ (item.price * item.quantity) | currency }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
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
  private toast = inject(ToastService);

  statusOptions = STATUS_OPTIONS;

  order = signal<any>(null);
  loading = signal(true);
  updatingStatus = signal(false);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.get<any>(`/admin/orders/${id}`).subscribe({
      next: (res) => {
        this.order.set(res?.data || null);
        this.loading.set(false);
      },
      error: () => { this.toast.error('Failed to load order'); this.loading.set(false); },
    });
  }

  updateStatus(id: number, newStatus: string): void {
    this.updatingStatus.set(true);
    this.api.put<any>(`/admin/orders/${id}/status`, { status: newStatus }).subscribe({
      next: (res) => {
        if (res?.success) {
          this.order.update(o => o ? { ...o, status: newStatus } : o);
          this.toast.success('Status updated');
        }
        this.updatingStatus.set(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.error || 'Failed to update status');
        this.updatingStatus.set(false);
      },
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
      processing: 'bg-sky-50 text-sky-700 dark:bg-sky-500/15 dark:text-sky-400',
      shipped: 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
      delivered: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
      cancelled: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400',
      paid: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    };
    return map[status] || 'bg-neutral-50 text-neutral-700 dark:bg-neutral-500/15 dark:text-neutral-400';
  }
}
