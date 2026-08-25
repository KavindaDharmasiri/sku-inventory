import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import { CurrencyPipe } from '../../shared/pipes/pipes';

@Component({
  selector: 'skuvo-cart',
  standalone: true,
  imports: [RouterLink, CurrencyPipe],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <h1 class="text-3xl sm:text-4xl font-display font-bold text-neutral-900 dark:text-white mb-10 tracking-tight">
        {{ i18n.t('cart.title') }}
        @if (cart.count() > 0) {
          <span class="text-base font-normal text-neutral-400 dark:text-neutral-500 ml-3">
            ({{ cart.count() }} {{ cart.count() === 1 ? i18n.t('cart.item') : i18n.t('cart.items') }})
          </span>
        }
      </h1>

      @if (cart.count() === 0) {
        <div class="text-center py-28">
          <div class="w-28 h-28 mx-auto mb-8 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-50
                      dark:from-neutral-800 dark:to-neutral-800/50 flex items-center justify-center">
            <svg class="w-12 h-12 text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/>
            </svg>
          </div>
          <h2 class="text-xl font-display font-semibold text-neutral-900 dark:text-white mb-2">
            {{ i18n.t('cart.empty') }}
          </h2>
          <p class="text-neutral-400 dark:text-neutral-500 text-sm mb-8 max-w-xs mx-auto">
            Looks like you haven't added anything yet. Explore our latest collection to find something you'll love.
          </p>
          <a routerLink="/shop"
             class="inline-flex items-center gap-2 px-8 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                    rounded-full font-medium text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100
                    transition-all duration-300 hover:shadow-lg hover:shadow-neutral-900/10 dark:hover:shadow-white/10 active:scale-[0.98]">
            {{ i18n.t('cart.continueShopping') }}
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
            </svg>
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
          <!-- Items -->
          <div class="lg:col-span-3 space-y-3">
            @for (item of cart.items(); track item.key) {
              <div class="flex gap-5 p-5 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100
                          dark:border-neutral-800/60 transition-all duration-300 hover:shadow-lg hover:shadow-neutral-900/[0.04]
                          dark:hover:shadow-black/20 hover:border-neutral-200 dark:hover:border-neutral-700">
                <a [routerLink]="['/product', item.productId]"
                   class="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0
                          ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                  <img [src]="item.image" [alt]="item.name" class="w-full h-full object-cover">
                </a>
                <div class="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                  <div>
                    <a [routerLink]="['/product', item.productId]"
                       class="text-[13px] font-semibold text-neutral-900 dark:text-white truncate block hover:text-primary
                              dark:hover:text-amber-400 transition-colors leading-tight">
                      {{ item.name }}
                    </a>
                    @if (item.skuLabel) {
                      <span class="mt-1.5 inline-block text-[10px] font-semibold uppercase tracking-[0.08em]
                                   px-2.5 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500
                                   dark:text-neutral-400">
                        {{ item.skuLabel }}
                      </span>
                    }
                  </div>
                  <div class="flex items-end justify-between mt-2">
                    <div class="flex items-baseline gap-2">
                      <span class="text-sm font-bold text-neutral-900 dark:text-white">{{ item.price | currency }}</span>
                      @if (item.originalPrice && item.originalPrice > item.price) {
                        <span class="text-[11px] text-neutral-400 line-through">{{ item.originalPrice | currency }}</span>
                      }
                      <span class="text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
                        × {{ item.quantity }}
                      </span>
                      <span class="text-[11px] font-semibold text-neutral-500 dark:text-neutral-300 hidden sm:inline">
                        = {{ (item.price * item.quantity) | currency }}
                      </span>
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="flex items-center rounded-full border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                        <button (click)="updateQty(item.key, item.quantity - 1)"
                                class="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-900
                                       dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800
                                       transition-all duration-150 cursor-pointer">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                            <path stroke-linecap="round" d="M5 12h14"/>
                          </svg>
                        </button>
                        <span class="w-8 h-8 flex items-center justify-center text-xs font-bold text-neutral-900 dark:text-white
                                     tabular-nums border-x border-neutral-200 dark:border-neutral-700">
                          {{ item.quantity }}
                        </span>
                        <button (click)="updateQty(item.key, item.quantity + 1)"
                                class="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-900
                                       dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800
                                       transition-all duration-150 cursor-pointer">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
                            <path stroke-linecap="round" d="M12 5v14M5 12h14"/>
                          </svg>
                        </button>
                      </div>
                      <button (click)="remove(item.key)"
                              class="w-8 h-8 flex items-center justify-center rounded-full text-neutral-300 hover:text-red-500
                                     hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 cursor-pointer"
                              title="{{ i18n.t('cart.remove') }}">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Summary -->
          <div class="lg:col-span-2">
            <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/60
                        p-6 sticky top-28 shadow-sm">
              <h3 class="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500 mb-6">
                {{ i18n.t('cart.total') }}
              </h3>
              <div class="space-y-3.5 text-sm">
                <div class="flex justify-between">
                  <span class="text-neutral-500 dark:text-neutral-400">{{ i18n.t('cart.subtotal') }}</span>
                  <span class="font-medium text-neutral-900 dark:text-white tabular-nums">{{ cart.total() | currency }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-500 dark:text-neutral-400">{{ i18n.t('cart.shipping') }}</span>
                  <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Free</span>
                </div>
                <hr class="border-neutral-100 dark:border-neutral-800">
                <div class="flex justify-between items-baseline pt-1">
                  <span class="text-sm font-semibold text-neutral-900 dark:text-white">Total</span>
                  <span class="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">{{ cart.total() | currency }}</span>
                </div>
              </div>

              <!-- Promo Code -->
              <div class="mt-6 flex gap-2">
                <input type="text" placeholder="Promo code"
                       class="flex-1 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200
                              dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white
                              placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20
                              focus:border-primary transition-all">
                <button type="button"
                        class="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-600
                               dark:text-neutral-300 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700
                               transition-colors cursor-pointer">
                  Apply
                </button>
              </div>

              <a routerLink="/checkout"
                 class="mt-5 block w-full py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                    rounded-xl font-semibold text-sm text-center hover:bg-neutral-800 dark:hover:bg-neutral-100
                    transition-all duration-300 active:scale-[0.98] shadow-lg shadow-neutral-900/10 dark:shadow-white/10">
                {{ i18n.t('cart.checkout') }}
              </a>
              <a routerLink="/shop"
                 class="mt-3 block text-center text-xs text-neutral-400 hover:text-primary dark:hover:text-amber-400
                        transition-colors font-medium">
                {{ i18n.t('cart.continueShopping') }}
              </a>

              <!-- Trust Badges -->
              <div class="mt-6 pt-5 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
                <div class="flex items-center gap-2.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                  <svg class="w-4 h-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                  </svg>
                  Secure checkout
                </div>
                <div class="flex items-center gap-2.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                  <svg class="w-4 h-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"/>
                  </svg>
                  Free returns within 30 days
                </div>
                <div class="flex items-center gap-2.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                  <svg class="w-4 h-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"/>
                  </svg>
                  Free shipping on all orders
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class CartComponent {
  cart = inject(CartService);
  private toast = inject(ToastService);
  i18n = inject(I18nService);

  updateQty(key: string | number, qty: number): void {
    this.cart.updateQuantity(key, qty);
  }

  remove(key: string | number): void {
    this.cart.removeItem(key);
    this.toast.info('Item removed from bag');
  }
}
