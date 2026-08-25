import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../config/app.config';
import { AuthService } from './auth.service';
import type { ApiResponse, PaginatedResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private get headers(): HttpHeaders {
    let h = new HttpHeaders({ 'Content-Type': 'application/json' });
    const token = this.auth.getToken();
    if (token) h = h.set('Authorization', `Bearer ${token}`);
    return h;
  }

  get<T>(path: string, params?: Record<string, string>): Observable<ApiResponse<T>> {
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
    return this.http.post<ApiResponse<T>>(`${APP_CONFIG.apiBaseUrl}${path}`, body, {
      headers: this.headers,
    });
  }

  put<T>(path: string, body: unknown = {}): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${APP_CONFIG.apiBaseUrl}${path}`, body, {
      headers: this.headers,
    });
  }

  delete<T>(path: string): Observable<ApiResponse<T>> {
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
