import { Component, computed, input } from '@angular/core';
import { TransactionStatus, TransactionType } from '../../core/models/api.models';

@Component({
  selector: 'app-transaction-status-badge',
  standalone: true,
  template: `
    <span
      [class]="badgeClasses()"
      [attr.aria-label]="'Status: ' + label()"
      class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
    >
      <i [class]="iconClass() + ' text-[11px]'"></i>
      <span>{{ label() }}</span>
    </span>
  `,
})
export class TransactionStatusBadgeComponent {
  readonly status = input.required<TransactionStatus>();
  readonly type = input.required<TransactionType>();

  readonly label = computed(() => {
    const s = this.status();
    if (s === 'ESTIMATED') return 'Estimado';
    if (s === 'PENDING') return 'Pendente';
    return this.type() === 'INCOME' ? 'Recebido' : 'Pago';
  });

  readonly iconClass = computed(() => {
    const s = this.status();
    if (s === 'ESTIMATED') return 'pi pi-wave-pulse';
    if (s === 'PENDING') return 'pi pi-clock';
    return 'pi pi-check-circle';
  });

  readonly badgeClasses = computed(() => {
    const s = this.status();
    if (s === 'ESTIMATED') {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';
    }
    if (s === 'PENDING') {
      return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    }
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300';
  });
}
