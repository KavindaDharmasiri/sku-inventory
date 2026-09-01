import { Injectable, inject, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { APP_CONFIG } from '../config/app.config';
import { AuthService } from './auth.service';
import type { ApiResponse, PaginatedResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  private get headers(): HttpHeaders {
    let h = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = this.auth.getToken();
    if (token) h = h.set('Authorization', `Bearer ${token}`);
    return h;
  }

  // During server-side rendering there is no browser localStorage, so the auth
  // token is unavailable. Admin requests must not be fired from the SSR render
  // (they would 401); the client re-runs the component lifecycle after hydration
  // where the token exists. Emit an empty response so nothing hangs or errors.
  private skipForSsr(path: string): boolean {
    return !isPlatformBrowser(this.platformId) && path.startsWith('/admin');
  }

  private empty<T>(): ApiResponse<T> {
    return { success: false, error: 'Not available during server render' } as ApiResponse<T>;
  }

  get<T>(path: string, params?: Record<string, string>): Observable<ApiResponse<T>> {
    if (this.skipForSsr(path)) return of(this.empty<T>());
    let httpParams = new HttpParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) httpParams = httpParams.set(k, v);
      });
    }
    return this.http.get<ApiResponse<T>>(`${APP_CONFIG.apiBaseUrl}${path}`, {
      headers: this.headers, params: httpParams,
    });
  }

  post<T>(path: string, body: unknown = {}): Observable<ApiResponse<T>> {
    if (this.skipForSsr(path)) return of(this.empty<T>());
    return this.http.post<ApiResponse<T>>(`${APP_CONFIG.apiBaseUrl}${path}`, body, {
      headers: this.headers,
    });
  }

  put<T>(path: string, body: unknown = {}): Observable<ApiResponse<T>> {
    if (this.skipForSsr(path)) return of(this.empty<T>());
    return this.http.put<ApiResponse<T>>(`${APP_CONFIG.apiBaseUrl}${path}`, body, {
      headers: this.headers,
    });
  }

  delete<T>(path: string): Observable<ApiResponse<T>> {
    if (this.skipForSsr(path)) return of(this.empty<T>());
    return this.http.delete<ApiResponse<T>>(`${APP_CONFIG.apiBaseUrl}${path}`, {
      headers: this.headers,
    });
  }

  getPaged<T>(path: string, page = 1, pageSize = 20, params: Record<string, string> = {}): Observable<ApiResponse<PaginatedResponse<T>>> {
    return this.get<PaginatedResponse<T>>(path, {
      ...params, page: String(page), pageSize: String(pageSize),
    });
  }
}
