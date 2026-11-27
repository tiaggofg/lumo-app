import { Component, computed, input, output } from '@angular/core';

export type ZButtonVariant =
  | 'default'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive'
  | 'warn'
  | 'success';

export type ZButtonSize = 'default' | 'sm' | 'lg' | 'icon';

@Component({
  selector: 'z-button',
  standalone: true,
  host: {
    class: 'inline-block',
  },
  template: `
    <button
      [type]="type()"
      [disabled]="disabled() || loading()"
      [class]="buttonClasses()"
      (click)="handleClick($event)"
    >
      @if (loading()) {
        <i class="pi pi-spin pi-spinner text-xs" aria-hidden="true"></i>
      } @else if (icon()) {
        <i [class]="icon() + ' text-xs'" aria-hidden="true"></i>
      }
      @if (label()) {
        <span>{{ label() }}</span>
      }
      <ng-content />
    </button>
  `,
})
export class ZButtonComponent {
  readonly label = input<string>('');
  readonly icon = input<string>('');
  readonly variant = input<ZButtonVariant>('default');
  readonly size = input<ZButtonSize>('default');
  readonly disabled = input<boolean>(false);
  readonly loading = input<boolean>(false);
  readonly type = input<'button' | 'submit'>('button');
  readonly styleClass = input<string>('');

  readonly buttonClick = output<MouseEvent>();

  readonly buttonClasses = computed(() => {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:opacity-50 disabled:pointer-events-none';

    const variants: Record<ZButtonVariant, string> = {
      default:
        'bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-xs',
      secondary:
        'bg-slate-100 text-slate-800 hover:bg-slate-200/80 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
      outline:
        'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800',
      ghost:
        'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80',
      destructive:
        'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-xs',
      warn:
        'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300',
      success:
        'bg-sky-600 text-white hover:bg-sky-700 active:bg-sky-800 shadow-xs',
    };

    const sizes: Record<ZButtonSize, string> = {
      default: 'px-4 py-2.5 text-[15px]',
      sm: 'px-3 py-1.5 text-xs rounded-lg',
      lg: 'px-5 py-3 text-base',
      icon: 'w-9 h-9 p-0',
    };

    return `${base} ${variants[this.variant()]} ${sizes[this.size()]} ${this.styleClass()}`.trim();
  });

  handleClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.buttonClick.emit(event);
  }
}
