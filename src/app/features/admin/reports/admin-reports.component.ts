import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { CurrencyPipe } from '../../../shared/pipes/pipes';

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
                <span class="text-neutral-500 dark:text-neutral-400 shrink-0 ml-4">{{ b.unitsSold }} sold · {{ b.revenue | currency }}</span>
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
                <span class="text-neutral-500 dark:text-neutral-400">{{ s.count }} · {{ s.total | currency }}</span>
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
                    [class]="l.stock === 0 ? 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-400' : 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'">
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
