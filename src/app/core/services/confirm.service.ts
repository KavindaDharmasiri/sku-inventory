import { Injectable, signal } from '@angular/core';

export interface ConfirmDialog {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel?: () => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private _dialog = signal<ConfirmDialog | null>(null);
  readonly dialog = this._dialog.asReadonly();

  confirm(opts: Omit<ConfirmDialog, 'onConfirm'> & { onConfirm: () => void }): void {
    this._dialog.set(opts);
  }

  handleConfirm(): void {
    const d = this._dialog();
    if (d) {
      d.onConfirm();
      this._dialog.set(null);
    }
  }

  handleCancel(): void {
    const d = this._dialog();
    if (d?.onCancel) d.onCancel();
    this._dialog.set(null);
  }

  close(): void {
    this._dialog.set(null);
  }
}
