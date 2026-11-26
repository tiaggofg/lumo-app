import { Component, computed, input } from '@angular/core';
import { TransactionStatus, TransactionType } from '../../core/models/api.models';

@Component({
  selector: 'app-transaction-status-badge',
  standalone: true,
  template: `
    <span
      [class]="badgeClasses()"
      [attr.aria-label]="'Status: ' + label()"
      class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold whitespace-nowrap"
    >
      <i [class]="iconClass() + ' text-xs'"></i>
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
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/45 dark:text-amber-300';
    }
    if (s === 'PENDING') {
      return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300';
    }
    return 'bg-sky-100 text-sky-800 dark:bg-sky-900/45 dark:text-sky-300';
  });
}
