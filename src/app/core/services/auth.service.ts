import { Injectable, signal, computed, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { APP_CONFIG } from '../config/app.config';
import type { User } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<User | null>(null);
  private readonly _token = signal<string | null>(null);
  private readonly _loading = signal(false);

  readonly user = this._user.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isAuthenticated = computed(() => !!this._token());
  readonly isAdmin = computed(() => this._user()?.userType?.toLowerCase() === 'admin');

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.loadFromStorage();
    }
  }

  private loadFromStorage(): void {
    const token = localStorage.getItem('skuvo_token');
    const userData = localStorage.getItem('skuvo_user');
    if (token && userData) {
      this._token.set(token);
      try {
        this._user.set(JSON.parse(userData));
      } catch {
        this.clearStorage();
      }
    }
  }

  private clearStorage(): void {
    localStorage.removeItem('skuvo_token');
    localStorage.removeItem('skuvo_user');
  }

  private persist(user: User, token: string): void {
    localStorage.setItem('skuvo_token', token);
    localStorage.setItem('skuvo_user', JSON.stringify(user));
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    this._loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<{ token: string; user: User }>(`${APP_CONFIG.apiBaseUrl}/auth/signin`, { email, password })
      );
      this._token.set(res.token);
      this._user.set(res.user);
      this.persist(res.user, res.token);
      return { success: true };
    } catch (err: any) {
      const msg = err?.error?.error || err?.error?.message || 'Sign in failed';
      return { success: false, error: msg };
    } finally {
      this._loading.set(false);
    }
  }

  async signUp(data: {
    email: string; password: string; firstName: string;
    lastName: string; phone?: string;
  }): Promise<{ success: boolean; error?: string }> {
    this._loading.set(true);
    try {
      const res = await firstValueFrom(
        this.http.post<{ token: string; user: User }>(`${APP_CONFIG.apiBaseUrl}/auth/signup`, data)
      );
      this._token.set(res.token);
      this._user.set(res.user);
      this.persist(res.user, res.token);
      return { success: true };
    } catch (err: any) {
      const msg = err?.error?.error || err?.error?.message || 'Sign up failed';
      return { success: false, error: msg };
    } finally {
      this._loading.set(false);
    }
  }

  signOut(): void {
    this._user.set(null);
    this._token.set(null);
    this.clearStorage();
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return this._token();
  }

  refreshUser(user: User): void {
    this._user.set(user);
    localStorage.setItem('skuvo_user', JSON.stringify(user));
  }
}
