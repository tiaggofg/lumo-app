import { Component, computed, input } from '@angular/core';

export type ZBadgeVariant = 'default' | 'sky' | 'rose' | 'amber' | 'slate';

@Component({
  selector: 'z-badge',
  standalone: true,
  template: `
    <span [class]="badgeClasses()">
      @if (icon()) {
        <i [class]="icon() + ' text-xs'" aria-hidden="true"></i>
      }
      @if (label()) {
        <span>{{ label() }}</span>
      }
      <ng-content />
    </span>
  `,
})
export class ZBadgeComponent {
  readonly variant = input<ZBadgeVariant>('default');
  readonly icon = input<string>('');
  readonly label = input<string>('');
  readonly styleClass = input<string>('');

  readonly badgeClasses = computed(() => {
    const base =
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap tabular-nums';

    const variants: Record<ZBadgeVariant, string> = {
      default:
        'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50',
      sky:
        'bg-sky-100 text-sky-800 dark:bg-sky-900/45 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50',
      rose:
        'bg-rose-100 text-rose-800 dark:bg-rose-900/45 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/50',
      amber:
        'bg-amber-100 text-amber-800 dark:bg-amber-900/45 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/50',
      slate:
        'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700',
    };

    return `${base} ${variants[this.variant()]} ${this.styleClass()}`.trim();
  });
}
