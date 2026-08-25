import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { ToastService } from '../../../core/services/toast.service';

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

      @if (loading()) {
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden p-6">
          <div class="space-y-3 animate-pulse">
            @for (i of [1,2,3]; track i) {
              <div class="h-12 bg-neutral-100 dark:bg-neutral-800 rounded-lg"></div>
            }
          </div>
        </div>
      } @else {
        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[640px] text-sm">
              <thead>
                <tr class="border-b border-neutral-100 dark:border-neutral-800">
                  <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Name</th>
                  <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Description</th>
                  <th class="whitespace-nowrap px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                  <th class="whitespace-nowrap px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Actions</th>
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
                <td class="px-6 py-4 text-right">
                  <button (click)="deleteItem(c.id)" title="Delete category" [disabled]="deletingId() === c.id"
                          class="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer disabled:opacity-50">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  </button>
                </td>
              </tr>
              } @empty {
                <tr><td colspan="4" class="px-6 py-12 text-center text-neutral-400">No categories</td></tr>
              }
            </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
})
export class AdminCategoryComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  items = signal<any[]>([]);
  adding = signal(false);
  error = signal('');
  loading = signal(true);
  deletingId = signal<number | null>(null);
  newName = '';

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.get<any[]>('/categories').subscribe({
      next: (res) => { if (res?.data) this.items.set(res.data); this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Failed to load categories'); },
    });
  }

  deleteItem(id: number): void {
    if (!confirm('Are you sure you want to delete this category?')) return;
    this.deletingId.set(id);
    this.api.delete<any>(`/admin/categories/${id}`).subscribe({
      next: (res) => {
        if (res?.success) {
          this.toast.success('Category deleted');
          this.items.update(items => items.filter(i => i.id !== id));
        }
      },
      error: (err) => { this.toast.error(err?.error?.error || 'Failed to delete category'); },
      complete: () => { this.deletingId.set(null); },
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
