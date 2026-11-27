import { Component, inject } from '@angular/core';
import { ZToastItem, ZToastService } from './z-toast.service';

@Component({
  selector: 'z-toast-viewport',
  standalone: true,
  template: `
    <div
      class="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      aria-live="polite"
      data-testid="z-toast-viewport"
    >
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          [class]="cardClasses(toast)"
          class="pointer-events-auto rounded-2xl p-4 shadow-lg border flex items-start gap-3 transition-all"
          role="status"
          [attr.data-testid]="'z-toast-' + toast.severity"
        >
          <span [class]="iconWrapperClasses(toast)" class="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
            <i [class]="iconClass(toast) + ' text-sm'" aria-hidden="true"></i>
          </span>

          <div class="flex-1 min-w-0">
            <p class="text-sm font-bold text-slate-900 dark:text-slate-100">
              {{ toast.summary }}
            </p>
            @if (toast.detail) {
              <p class="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                {{ toast.detail }}
              </p>
            }
          </div>

          <button
            type="button"
            (click)="toastService.dismiss(toast.id)"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            aria-label="Fechar notificação"
          >
            <i class="pi pi-times text-xs" aria-hidden="true"></i>
          </button>
        </div>
      }
    </div>
  `,
})
export class ZToastViewportComponent {
  readonly toastService = inject(ZToastService);

  cardClasses(toast: ZToastItem): string {
    const base = 'bg-white dark:bg-slate-900';
    if (toast.severity === 'error') {
      return `${base} border-rose-300 dark:border-rose-800/80`;
    }
    if (toast.severity === 'warn') {
      return `${base} border-amber-300 dark:border-amber-800/80`;
    }
    if (toast.severity === 'success') {
      return `${base} border-sky-300 dark:border-sky-800/80`;
    }
    return `${base} border-indigo-200 dark:border-indigo-800/80`;
  }

  iconWrapperClasses(toast: ZToastItem): string {
    if (toast.severity === 'error') {
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300';
    }
    if (toast.severity === 'warn') {
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300';
    }
    if (toast.severity === 'success') {
      return 'bg-sky-100 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300';
    }
    return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300';
  }

  iconClass(toast: ZToastItem): string {
    if (toast.severity === 'error') return 'pi pi-times-circle';
    if (toast.severity === 'warn') return 'pi pi-exclamation-triangle';
    if (toast.severity === 'success') return 'pi pi-check-circle';
    return 'pi pi-info-circle';
  }
}
