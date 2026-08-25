import { Component, inject, OnInit, signal } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

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
