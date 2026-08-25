import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../core/services/i18n.service';

@Component({
  selector: 'skuvo-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[70vh] flex items-center justify-center px-4">
      <div class="text-center animate-[fadeUp_0.6s_ease-out]">
        <p class="text-8xl font-display font-bold text-primary/20">404</p>
        <h1 class="mt-4 text-2xl font-display font-bold text-neutral-900 dark:text-white">
          {{ i18n.t('notFound.title') }}
        </h1>
        <p class="mt-2 text-neutral-500">{{ i18n.t('notFound.message') }}</p>
        <a routerLink="/"
           class="mt-8 inline-flex px-6 py-3 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900
                  rounded-full font-medium text-sm hover:bg-neutral-800 transition-colors">
          {{ i18n.t('notFound.backHome') }}
        </a>
      </div>
    </div>
  `,
})
export class NotFoundComponent {
  i18n = inject(I18nService);
}
