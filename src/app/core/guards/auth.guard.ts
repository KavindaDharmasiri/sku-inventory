import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  router.navigate(['/auth/signin'], { queryParams: { returnUrl: state.url } });
  return false;
};

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated() && auth.isAdmin()) return true;
  router.navigate(auth.isAuthenticated() ? ['/'] : ['/auth/signin'],
    auth.isAuthenticated() ? {} : { queryParams: { returnUrl: state.url } });
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated()) return true;
  router.navigate(['/']);
  return false;
};
