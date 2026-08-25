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
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <h1 class="text-2xl sm:text-3xl font-display font-bold text-neutral-900 dark:text-white mb-8">
        {{ i18n.t('cart.title') }}
        @if (cart.count() > 0) {
          <span class="text-sm font-normal text-neutral-500 ml-2">
            ({{ cart.count() }} {{ cart.count() === 1 ? i18n.t('cart.item') : i18n.t('cart.items') }})
          </span>
        }
      </h1>

      @if (cart.count() === 0) {
        <div class="text-center py-20">
          <div class="w-20 h-20 mx-auto mb-6 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            <svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/>
            </svg>
          </div>
          <p class="text-neutral-500 text-lg mb-6">{{ i18n.t('cart.empty') }}</p>
          <a routerLink="/shop"
             class="inline-flex px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                    rounded-full font-medium text-sm hover:bg-neutral-800 transition-colors">
            {{ i18n.t('cart.continueShopping') }}
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Items -->
          <div class="lg:col-span-2 space-y-4">
            @for (item of cart.items(); track item.key) {
              <div class="flex gap-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100
                          dark:border-neutral-800 transition-all duration-300 hover:shadow-md">
                <a [routerLink]="['/product', item.productId]"
                   class="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0">
                  <img [src]="item.image" [alt]="item.name" class="w-full h-full object-cover">
                </a>
                <div class="flex-1 min-w-0">
                  <a [routerLink]="['/product', item.productId]"
                     class="text-sm font-medium text-neutral-900 dark:text-white truncate block hover:text-primary transition-colors">
                    {{ item.name }}
                  </a>
                  @if (item.skuLabel) {
                    <span class="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wider
                                 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                      {{ item.skuLabel }}
                    </span>
                  }
                  <div class="mt-1 flex items-center gap-2">
                    <span class="text-sm font-bold text-neutral-900 dark:text-white">{{ item.price | currency }}</span>
                    @if (item.originalPrice && item.originalPrice > item.price) {
                      <span class="text-xs text-neutral-400 line-through">{{ item.originalPrice | currency }}</span>
                    }
                  </div>
                  <div class="mt-3 flex items-center justify-between">
                    <div class="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-lg">
                      <button (click)="updateQty(item.key, item.quantity - 1)"
                              class="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900
                                     transition-colors cursor-pointer">−</button>
                      <span class="w-8 h-8 flex items-center justify-center text-sm font-medium text-neutral-900 dark:text-white">
                        {{ item.quantity }}
                      </span>
                      <button (click)="updateQty(item.key, item.quantity + 1)"
                              class="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-900
                                     transition-colors cursor-pointer">+</button>
                    </div>
                    <button (click)="remove(item.key)"
                            class="text-xs text-neutral-400 hover:text-error transition-colors cursor-pointer">
                      {{ i18n.t('cart.remove') }}
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Summary -->
          <div class="lg:col-span-1">
            <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 p-6 sticky top-24">
              <h3 class="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Order Summary</h3>
              <div class="space-y-3 text-sm">
                <div class="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>{{ i18n.t('cart.subtotal') }}</span>
                  <span class="font-medium text-neutral-900 dark:text-white">{{ cart.total() | currency }}</span>
                </div>
                <div class="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>{{ i18n.t('cart.shipping') }}</span>
                  <span class="font-medium text-success">Free</span>
                </div>
                <hr class="border-neutral-100 dark:border-neutral-800">
                <div class="flex justify-between text-base font-bold text-neutral-900 dark:text-white">
                  <span>{{ i18n.t('cart.total') }}</span>
                  <span>{{ cart.total() | currency }}</span>
                </div>
              </div>
              <a routerLink="/checkout"
                 class="mt-6 block w-full py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                    rounded-xl font-medium text-sm text-center hover:bg-neutral-800 dark:hover:bg-neutral-100
                    transition-all duration-200 active:scale-[0.98]">
                {{ i18n.t('cart.checkout') }}
              </a>
              <a routerLink="/shop"
                 class="mt-3 block text-center text-sm text-neutral-500 hover:text-primary transition-colors">
                {{ i18n.t('cart.continueShopping') }}
              </a>
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
