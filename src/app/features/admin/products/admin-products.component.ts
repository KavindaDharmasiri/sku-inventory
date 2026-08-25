import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { I18nService } from '../../../core/services/i18n.service';
import { ToastService } from '../../../core/services/toast.service';
import { CurrencyPipe } from '../../../shared/pipes/pipes';

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
