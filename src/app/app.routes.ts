import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent),
  },
  {
    path: 'shop',
    loadComponent: () => import('./features/shop/shop.component').then(m => m.ShopComponent),
  },
  {
    path: 'product/:id',
    loadComponent: () => import('./features/product/product-detail.component').then(m => m.ProductDetailComponent),
  },
  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart.component').then(m => m.CartComponent),
  },
  {
    path: 'checkout',
    canActivate: [authGuard],
    loadComponent: () => import('./features/checkout/checkout.component').then(m => m.CheckoutComponent),
  },

  // Auth (guest only)
  {
    path: 'auth/signin',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/signin/signin.component').then(m => m.SigninComponent),
  },
  {
    path: 'auth/signup',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent),
  },

  // Account (customer)
  {
    path: 'account',
    canActivate: [authGuard],
    loadComponent: () => import('./features/account/account.component').then(m => m.AccountLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/account/account.component').then(m => m.AccountProfileComponent) },
      { path: 'orders', loadComponent: () => import('./features/account/account.component').then(m => m.AccountOrdersComponent) },
      { path: 'wishlist', loadComponent: () => import('./features/account/account.component').then(m => m.AccountWishlistComponent) },
      { path: 'addresses', loadComponent: () => import('./features/account/account.component').then(m => m.AccountAddressesComponent) },
    ],
  },

  // Admin
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./layouts/admin/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      { path: '', loadComponent: () => import('./features/admin/dashboard/dashboard.component').then(m => m.AdminDashboardComponent) },
      { path: 'products', loadComponent: () => import('./features/admin/admin-pages.component').then(m => m.AdminProductsComponent) },
      { path: 'products/add', loadComponent: () => import('./features/admin/admin-product-form.component').then(m => m.AdminProductAddComponent) },
      { path: 'products/:id/edit', loadComponent: () => import('./features/admin/admin-product-form.component').then(m => m.AdminProductAddComponent) },
      { path: 'products/:id/specs', loadComponent: () => import('./features/admin/admin-product-specs.component').then(m => m.AdminProductSpecsComponent) },
      { path: 'products/:id/skus', loadComponent: () => import('./features/admin/admin-product-skus.component').then(m => m.AdminProductSkusComponent) },
      { path: 'orders', loadComponent: () => import('./features/admin/admin-pages.component').then(m => m.AdminOrdersComponent) },
      { path: 'orders/:id', loadComponent: () => import('./features/admin/admin-pages.component').then(m => m.AdminOrderDetailComponent) },
      { path: 'category', loadComponent: () => import('./features/admin/admin-pages.component').then(m => m.AdminCategoryComponent) },
      { path: 'subcategory', loadComponent: () => import('./features/admin/admin-pages.component').then(m => m.AdminSubcategoryComponent) },
      { path: 'transactions', loadComponent: () => import('./features/admin/admin-pages.component').then(m => m.AdminTransactionsComponent) },
      { path: 'coupons', loadComponent: () => import('./features/admin/admin-pages.component').then(m => m.AdminCouponsComponent) },
      { path: 'discounts', loadComponent: () => import('./features/admin/admin-pages.component').then(m => m.AdminDiscountsComponent) },
      { path: 'reports', loadComponent: () => import('./features/admin/admin-pages.component').then(m => m.AdminReportsComponent) },
      { path: 'users', loadComponent: () => import('./features/admin/admin-pages.component').then(m => m.AdminUsersComponent) },
      { path: 'ads', loadComponent: () => import('./features/admin/admin-pages.component').then(m => m.AdminAdsComponent) },
      { path: 'audit', loadComponent: () => import('./features/admin/admin-pages.component').then(m => m.AdminAuditComponent) },
      { path: 'settings', loadComponent: () => import('./features/admin/admin-pages.component').then(m => m.AdminSettingsComponent) },
    ],
  },

  // Catch all
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
