import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  HostListener,
  TemplateRef,
  contentChild,
  input,
  model,
} from '@angular/core';

@Component({
  selector: 'z-dialog',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    @if (visible()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="header()"
        data-testid="z-dialog-overlay"
      >
        <div
          class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          (click)="close()"
          aria-hidden="true"
          data-testid="z-dialog-backdrop"
        ></div>

        <div
          class="relative z-10 w-full rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]"
          [class]="widthClass()"
        >
          <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
            <h2 class="text-lg font-bold text-slate-900 dark:text-slate-100">
              {{ header() }}
            </h2>
            <button
              type="button"
              (click)="close()"
              class="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Fechar modal"
              data-testid="z-dialog-close"
            >
              <i class="pi pi-times text-sm" aria-hidden="true"></i>
            </button>
          </div>

          <div class="px-6 py-4 overflow-y-auto flex-1">
            <ng-content />
          </div>

          <div class="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
            @if (footerTemplate(); as tpl) {
              <ng-container *ngTemplateOutlet="tpl" />
            } @else {
              <ng-content select="[zDialogFooter]" />
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class ZDialogComponent {
  readonly header = input<string>('');
  readonly visible = model<boolean>(false);
  readonly widthClass = input<string>('max-w-lg');
  readonly footerTemplate = contentChild<TemplateRef<unknown>>('footer');

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.visible()) {
      this.close();
    }
  }

  close(): void {
    this.visible.set(false);
  }
}
