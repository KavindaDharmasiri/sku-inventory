import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { CustomerHeaderComponent } from './layouts/customer/customer-header.component';
import { CustomerFooterComponent } from './layouts/customer/customer-footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { FloatingSettingsComponent } from './shared/components/floating-settings/floating-settings.component';
import { AuthService } from './core/services/auth.service';
import { ConfigService } from './core/services/config.service';
import { UserSettingsService } from './core/services/user-settings.service';

@Component({
  selector: 'skuvo-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CustomerHeaderComponent, CustomerFooterComponent,
    ToastComponent, ConfirmDialogComponent, FloatingSettingsComponent,
  ],
  template: `
    @if (!isAdminRoute()) {
      <skuvo-customer-header />
    }
    <main [class]="isAdminRoute() ? '' : 'pt-16 lg:pt-20'">
      <router-outlet />
    </main>
    @if (!isAdminRoute()) {
      <skuvo-customer-footer />
    }
    <skuvo-floating-settings />
    <skuvo-toast />
    <skuvo-confirm-dialog />
  `,
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private auth = inject(AuthService);
  private config = inject(ConfigService);
  private userSettings = inject(UserSettingsService);

  // Initialize from the current URL so a hard refresh on /admin/* renders
  // admin chrome immediately (SSR + hydration) instead of customer chrome.
  isAdminRoute = signal(this.router.url.startsWith('/admin'));

  constructor() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.isAdminRoute.set(event.urlAfterRedirects.startsWith('/admin'));
    });
  }

  ngOnInit(): void {
    // Apply theme on load
    this.config.setTheme(this.config.theme());

    // Load user settings if logged in
    if (this.auth.isAuthenticated()) {
      this.userSettings.loadSettings();
    }

    // Cover cases where the constructor ran before the initial navigation
    this.isAdminRoute.set(this.router.url.startsWith('/admin'));
  }
}

export { AppComponent as App };
