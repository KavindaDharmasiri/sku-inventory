import { Pipe, PipeTransform } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';
import { inject } from '@angular/core';

@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(key: string, params?: Record<string, string | number>): string {
    return this.i18n.t(key, params);
  }
}

@Pipe({ name: 'currency', standalone: true })
export class CurrencyPipe implements PipeTransform {
  transform(value: number | string | null | undefined, currency = 'LKR', locale = 'en'): string {
    const n = Number(value);
    if (value == null || value === '' || Number.isNaN(n)) return '';
    try {
      return new Intl.NumberFormat(locale === 'si' ? 'si-LK' : locale === 'ta' ? 'ta-LK' : 'en-LK', {
        style: 'currency', currency, minimumFractionDigits: 2,
      }).format(n);
    } catch {
      return `${currency} ${n.toFixed(2)}`;
    }
  }
}

@Pipe({ name: 'relativeTime', standalone: true })
export class RelativeTimePipe implements PipeTransform {
  transform(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 30) return d.toLocaleDateString();
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }
}
