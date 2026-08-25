import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { CartService } from '../../core/services/cart.service';
import { ToastService } from '../../core/services/toast.service';
import { I18nService } from '../../core/services/i18n.service';
import { CurrencyPipe } from '../../shared/pipes/pipes';

@Component({
  selector: 'skuvo-checkout',
  standalone: true,
  imports: [RouterLink, FormsModule, CurrencyPipe],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
      <!-- Progress Steps -->
      @if (cart.items().length > 0) {
        <div class="flex items-center justify-center gap-0 mb-10 max-w-md mx-auto">
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                        flex items-center justify-center text-xs font-bold">1</span>
            <span class="text-xs font-semibold text-neutral-900 dark:text-white hidden sm:inline">Shipping</span>
          </div>
          <div class="w-12 h-px bg-neutral-200 dark:bg-neutral-700 mx-3"></div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600
                        flex items-center justify-center text-xs font-bold">2</span>
            <span class="text-xs font-medium text-neutral-400 dark:text-neutral-600 hidden sm:inline">Payment</span>
          </div>
          <div class="w-12 h-px bg-neutral-200 dark:bg-neutral-700 mx-3"></div>
          <div class="flex items-center gap-2">
            <span class="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600
                        flex items-center justify-center text-xs font-bold">3</span>
            <span class="text-xs font-medium text-neutral-400 dark:text-neutral-600 hidden sm:inline">Review</span>
          </div>
        </div>
      }

      @if (cart.items().length === 0) {
        <div class="text-center py-28">
          <div class="w-28 h-28 mx-auto mb-8 rounded-full bg-gradient-to-br from-neutral-100 to-neutral-50
                      dark:from-neutral-800 dark:to-neutral-800/50 flex items-center justify-center">
            <svg class="w-12 h-12 text-neutral-300 dark:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"/>
            </svg>
          </div>
          <h2 class="text-xl font-display font-semibold text-neutral-900 dark:text-white mb-2">Your bag is empty</h2>
          <p class="text-neutral-400 dark:text-neutral-500 text-sm mb-8 max-w-xs mx-auto">
            Add some items to your bag before checking out.
          </p>
          <a routerLink="/shop"
             class="inline-flex items-center gap-2 px-8 py-3.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                    rounded-full font-medium text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100
                    transition-all duration-300 hover:shadow-lg active:scale-[0.98]">
            Continue Shopping
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
            </svg>
          </a>
        </div>
      } @else {
        <form (ngSubmit)="placeOrder()" class="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
          <!-- Left: Forms -->
          <div class="lg:col-span-3 space-y-6">
            <!-- Shipping -->
            <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/60 p-6 sm:p-8">
              <div class="flex items-center gap-3 mb-6">
                <span class="w-7 h-7 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                            flex items-center justify-center text-[11px] font-bold shrink-0">1</span>
                <h2 class="text-sm font-bold uppercase tracking-[0.1em] text-neutral-900 dark:text-white">
                  Shipping Details
                </h2>
              </div>
              @if (error()) {
                <div class="mb-5 px-4 py-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40
                            rounded-xl text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                  <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                  </svg>
                  {{ error() }}
                </div>
              }
              @if (addresses().length > 0) {
                <div class="mb-6">
                  <p class="text-[11px] font-bold uppercase tracking-[0.1em] text-neutral-400 dark:text-neutral-500 mb-3">
                    Saved Addresses
                  </p>
                  <div class="space-y-2.5">
                    @for (addr of addresses(); track addr.id) {
                      <label class="flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all duration-200"
                             [class]="selectedAddressId() === addr.id
                               ? 'border-neutral-900 dark:border-white bg-neutral-900/[0.02] dark:bg-white/[0.03] shadow-sm'
                               : 'border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600'">
                        <input type="radio" name="savedAddress" [value]="addr.id"
                               [checked]="selectedAddressId() === addr.id"
                               (change)="selectAddress(addr)"
                               class="mt-0.5 accent-primary">
                        <div class="text-sm min-w-0">
                          <span class="font-semibold text-neutral-900 dark:text-white">
                            {{ addr.firstName }} {{ addr.lastName }}
                          </span>
                          <p class="text-neutral-400 dark:text-neutral-500 text-xs mt-1 leading-relaxed">
                            {{ addr.address }}{{ addr.apartment ? ', ' + addr.apartment : '' }},
                            {{ addr.city }}, {{ addr.state }} {{ addr.zipCode }}
                          </p>
                        </div>
                      </label>
                    }
                    <label class="flex items-center gap-3.5 p-4 rounded-xl border cursor-pointer transition-all duration-200"
                           [class]="selectedAddressId() === null
                             ? 'border-neutral-900 dark:border-white bg-neutral-900/[0.02] dark:bg-white/[0.03] shadow-sm'
                             : 'border-neutral-100 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600'">
                      <input type="radio" name="savedAddress" value=""
                             [checked]="selectedAddressId() === null"
                             (change)="clearAddress()"
                             class="mt-0.5 accent-primary">
                      <span class="text-sm font-semibold text-neutral-900 dark:text-white">Use a different address</span>
                    </label>
                  </div>
                </div>
              }
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-2">
                    First Name
                  </label>
                  <input type="text" [(ngModel)]="form.firstName" name="firstName" required class="field">
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-2">
                    Last Name
                  </label>
                  <input type="text" [(ngModel)]="form.lastName" name="lastName" required class="field">
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-2">
                    Email
                  </label>
                  <input type="email" [(ngModel)]="form.email" name="email" required class="field">
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-2">
                    Phone
                  </label>
                  <input type="tel" [(ngModel)]="form.phone" name="phone" required class="field">
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-2">
                    Address
                  </label>
                  <input type="text" [(ngModel)]="form.address" name="address" required class="field"
                         placeholder="Street address">
                </div>
                <div class="sm:col-span-2">
                  <input type="text" [(ngModel)]="form.apartment" name="apartment" class="field"
                         placeholder="Apartment, suite, etc. (optional)">
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-2">
                    City
                  </label>
                  <input type="text" [(ngModel)]="form.city" name="city" required class="field">
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-2">
                    State / Province
                  </label>
                  <input type="text" [(ngModel)]="form.state" name="state" required class="field">
                </div>
                <div>
                  <label class="block text-[11px] font-bold uppercase tracking-[0.08em] text-neutral-400 dark:text-neutral-500 mb-2">
                    ZIP / Postal Code
                  </label>
                  <input type="text" [(ngModel)]="form.zipCode" name="zipCode" required class="field">
                </div>
              </div>
            </div>

            <!-- Payment Method -->
            <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/60 p-6 sm:p-8">
              <div class="flex items-center gap-3 mb-6">
                <span class="w-7 h-7 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                            flex items-center justify-center text-[11px] font-bold shrink-0">2</span>
                <h2 class="text-sm font-bold uppercase tracking-[0.1em] text-neutral-900 dark:text-white">
                  Payment Method
                </h2>
              </div>
              <div class="space-y-3">
                <label class="flex items-center gap-4 p-4 rounded-xl border border-neutral-900 dark:border-white
                             bg-neutral-900/[0.02] dark:bg-white/[0.03] shadow-sm cursor-pointer">
                  <input type="radio" name="paymentMethod" value="cash"
                         [(ngModel)]="form.paymentMethod"
                         class="accent-primary">
                  <div class="flex items-center gap-3 flex-1">
                    <svg class="w-5 h-5 text-neutral-600 dark:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round"
                            d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    <div>
                      <span class="text-sm font-semibold text-neutral-900 dark:text-white">Cash on Delivery</span>
                      <p class="text-[11px] text-neutral-400 dark:text-neutral-500 mt-0.5">Pay when your order arrives</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Right: Summary -->
          <div class="lg:col-span-2">
            <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800/60
                        p-6 sticky top-28 shadow-sm">
              <h3 class="text-xs font-bold uppercase tracking-[0.12em] text-neutral-400 dark:text-neutral-500 mb-6">
                Order Summary
              </h3>
              <div class="space-y-3 max-h-52 overflow-y-auto pr-1 mb-4">
                @for (item of cart.items(); track item.key) {
                  <div class="flex items-center gap-3.5">
                    <div class="w-11 h-11 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0
                                ring-1 ring-black/[0.04] dark:ring-white/[0.06]">
                      <img [src]="item.image" [alt]="item.name" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-medium text-neutral-900 dark:text-white truncate leading-tight">{{ item.name }}</p>
                      <p class="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                        @if (item.skuLabel) {<span>{{ item.skuLabel }} · </span>}×{{ item.quantity }}
                      </p>
                    </div>
                    <span class="text-xs font-bold text-neutral-900 dark:text-white shrink-0 tabular-nums">
                      {{ item.price * item.quantity | currency }}
                    </span>
                  </div>
                }
              </div>
              <hr class="border-neutral-100 dark:border-neutral-800 mb-4">

              <!-- Coupon -->
              <div class="flex gap-2 mb-5">
                <input type="text" placeholder="Coupon code" [value]="couponCode()"
                       (input)="couponCode.set($any($event.target).value)"
                       class="flex-1 px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200
                              dark:border-neutral-700 rounded-xl text-sm text-neutral-900 dark:text-white
                              placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary/20
                              focus:border-primary transition-all">
                <button type="button" (click)="applyCoupon()"
                        class="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold text-neutral-600
                               dark:text-neutral-300 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700
                               transition-colors cursor-pointer">
                  Apply
                </button>
              </div>

              <div class="space-y-3 text-sm">
                <div class="flex justify-between">
                  <span class="text-neutral-500 dark:text-neutral-400">Subtotal</span>
                  <span class="font-medium text-neutral-900 dark:text-white tabular-nums">{{ cart.total() | currency }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-500 dark:text-neutral-400">Tax (8%)</span>
                  <span class="font-medium text-neutral-900 dark:text-white tabular-nums">{{ tax() | currency }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-500 dark:text-neutral-400">Shipping</span>
                  <span class="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Free</span>
                </div>
                <hr class="border-neutral-100 dark:border-neutral-800">
                <div class="flex justify-between items-baseline pt-1">
                  <span class="text-sm font-semibold text-neutral-900 dark:text-white">Total</span>
                  <span class="text-lg font-bold text-neutral-900 dark:text-white tabular-nums">{{ grandTotal() | currency }}</span>
                </div>
              </div>

              <button type="submit" [disabled]="placing()"
                      class="mt-6 w-full py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                             rounded-xl font-semibold text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100
                             transition-all duration-300 active:scale-[0.98] disabled:opacity-50
                             disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-neutral-900/10
                             dark:shadow-white/10 flex items-center justify-center gap-2">
                @if (placing()) {
                  <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Placing order…
                } @else {
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"/>
                  </svg>
                  Place Order
                }
              </button>

              <div class="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5">
                <div class="flex items-center gap-2.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                  <svg class="w-4 h-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/>
                  </svg>
                  Secure & encrypted checkout
                </div>
                <div class="flex items-center gap-2.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                  <svg class="w-4 h-4 shrink-0 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round"
                          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  Prices verified at checkout
                </div>
              </div>
            </div>
          </div>
        </form>
      }
    </div>
  `,
  styles: [`
    @reference '../../../tailwind.css';
    .field {
      @apply w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80
             rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400
             focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10
             focus:border-neutral-900 dark:focus:border-white transition-all duration-200;
    }
  `],
})
export class CheckoutComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);
  cart = inject(CartService);
  i18n = inject(I18nService);

  placing = signal(false);
  error = signal('');
  addresses = signal<any[]>([]);
  selectedAddressId = signal<number | null>(null);
  couponCode = signal('');
  couponApplied = signal(false);

  form = {
    firstName: '', lastName: '',
    email: this.auth.user()?.email || '',
    phone: '',
    address: '', apartment: '',
    city: '', state: '', zipCode: '',
    paymentMethod: 'cash',
  };

  tax(): number {
    return Math.round(this.cart.total() * 0.08 * 100) / 100;
  }

  grandTotal(): number {
    return Math.round((this.cart.total() + this.tax()) * 100) / 100;
  }

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.api.get<any[]>('/addresses').subscribe({
        next: (res) => {
          if (res?.success && res.data) {
            this.addresses.set(res.data);
          }
        },
      });
    }
  }

  selectAddress(addr: any): void {
    this.selectedAddressId.set(addr.id);
    this.form.firstName = addr.firstName || '';
    this.form.lastName = addr.lastName || '';
    this.form.address = addr.address || '';
    this.form.apartment = addr.apartment || '';
    this.form.city = addr.city || '';
    this.form.state = addr.state || '';
    this.form.zipCode = addr.zipCode || '';
    this.form.phone = addr.phone || '';
  }

  clearAddress(): void {
    this.selectedAddressId.set(null);
    this.form.firstName = '';
    this.form.lastName = '';
    this.form.address = '';
    this.form.apartment = '';
    this.form.city = '';
    this.form.state = '';
    this.form.zipCode = '';
    this.form.phone = '';
  }

  applyCoupon(): void {
    // TODO: Implement real coupon validation via POST /api/cart/validate-coupon
    this.toast.info('Coupon validation coming soon');
  }

  placeOrder(): void {
    const f = this.form;
    for (const key of ['firstName', 'lastName', 'email', 'phone', 'address', 'city', 'state', 'zipCode'] as const) {
      if (!f[key] || !String(f[key]).trim()) {
        this.error.set('Please fill in all required shipping fields.');
        return;
      }
    }
    this.placing.set(true);
    this.error.set('');

    const payload = {
      ...f,
      items: this.cart.items().map(i => ({
        productId: i.productId,
        skuId: i.skuId,
        quantity: i.quantity,
      })),
    };

    this.api.post<{ orderId: number; orderNumber: string }>('/orders', payload).subscribe({
      next: (res) => {
        if (res?.success && res.data) {
          this.cart.clear();
          this.toast.success(`Order ${res.data.orderNumber} placed!`);
          this.router.navigate(['/account/orders']);
        } else {
          this.placing.set(false);
          this.error.set(res?.error || 'Failed to place order');
        }
      },
      error: (err) => {
        this.placing.set(false);
        this.error.set(err?.error?.error || 'Failed to place order. Please try again.');
      },
    });
  }
}
