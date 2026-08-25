import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  private counter = 0;

  readonly toasts = this._toasts.asReadonly();

  show(message: string, type: Toast['type'] = 'info', duration = 3500): void {
    const id = ++this.counter;
    const toast: Toast = { id, message, type, duration };
    this._toasts.update((t) => [...t, toast]);
    setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string): void { this.show(message, 'success'); }
  error(message: string): void { this.show(message, 'error', 5000); }
  info(message: string): void { this.show(message, 'info'); }
  warning(message: string): void { this.show(message, 'warning', 4000); }

  dismiss(id: number): void {
    this._toasts.update((t) => t.filter((x) => x.id !== id));
  }
}
