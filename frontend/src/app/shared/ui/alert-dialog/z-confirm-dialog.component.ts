import { Component, HostListener, inject } from '@angular/core';
import { ZButtonComponent } from '../button/z-button.component';
import { ZConfirmService } from './z-confirm.service';

@Component({
  selector: 'z-confirm-dialog',
  standalone: true,
  imports: [ZButtonComponent],
  template: `
    @if (confirmService.activeConfirmation(); as conf) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="alertdialog"
        aria-modal="true"
        [attr.aria-label]="conf.header"
        data-testid="z-confirm-dialog"
      >
        <div
          class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
          (click)="confirmService.reject()"
          aria-hidden="true"
        ></div>

        <div class="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 space-y-4">
          <div class="flex items-start gap-3.5">
            <span
              class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              [class]="
                conf.variant === 'default'
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
              "
            >
              <i [class]="(conf.icon || 'pi pi-exclamation-triangle') + ' text-base'" aria-hidden="true"></i>
            </span>
            <div class="space-y-1.5 min-w-0">
              <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100">
                {{ conf.header }}
              </h2>
              <p class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {{ conf.message }}
              </p>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <z-button
              [label]="conf.rejectLabel || 'Cancelar'"
              variant="ghost"
              data-testid="z-confirm-reject"
              (buttonClick)="confirmService.reject()"
            />
            <z-button
              [label]="conf.acceptLabel || 'Confirmar'"
              [variant]="conf.variant === 'default' ? 'default' : 'destructive'"
              data-testid="z-confirm-accept"
              (buttonClick)="confirmService.accept()"
            />
          </div>
        </div>
      </div>
    }
  `,
})
export class ZConfirmDialogComponent {
  readonly confirmService = inject(ZConfirmService);

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.confirmService.activeConfirmation()) {
      this.confirmService.reject();
    }
  }
}
