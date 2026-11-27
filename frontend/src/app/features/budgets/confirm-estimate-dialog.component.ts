import { Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmEstimatePayload, Transaction } from '../../core/models/api.models';
import {
  ZButtonComponent,
  ZCheckboxComponent,
  ZDialogComponent,
  ZInputNumberComponent,
  ZSelectComponent,
} from '../../shared/ui';

@Component({
  selector: 'app-confirm-estimate-dialog',
  standalone: true,
  imports: [
    FormsModule,
    ZButtonComponent,
    ZCheckboxComponent,
    ZDialogComponent,
    ZInputNumberComponent,
    ZSelectComponent,
  ],
  template: `
    <z-dialog
      header="Confirmar Valor Real"
      [visible]="visible()"
      (visibleChange)="visibleChange.emit($event)"
      widthClass="max-w-md"
    >
      @if (transaction(); as txn) {
        <div class="space-y-4 pt-1">
          <p class="text-sm text-slate-600 dark:text-slate-300">
            Informe o valor fechado para <strong>{{ txn.description }}</strong>.
          </p>

          <div class="flex flex-col gap-1.5">
            <label for="estimate-amount" class="text-sm font-medium">Valor real (R$)</label>
            <z-input-number
              inputId="estimate-amount"
              data-testid="confirm-estimate-amount"
              [(ngModel)]="amount"
              mode="currency"
              currency="BRL"
              locale="pt-BR"
              [min]="0.01"
              styleClass="w-full"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="estimate-status" class="text-sm font-medium">Novo status</label>
            <z-select
              inputId="estimate-status"
              [(ngModel)]="targetStatus"
              [options]="statusOptions()"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full"
            />
          </div>

          @if (txn.sourceRecurringTransactionId) {
            <div class="flex items-center gap-2 pt-1">
              <z-checkbox
                inputId="update-template"
                [(ngModel)]="updateRecurringTemplate"
                [binary]="true"
              />
              <label for="update-template" class="text-sm cursor-pointer">
                Atualizar valor padrão da recorrência
              </label>
            </div>
          }
        </div>
      }

      <ng-template #footer>
        <div class="flex justify-end gap-2">
          <z-button label="Cancelar" variant="ghost" (buttonClick)="visibleChange.emit(false)" />
          <z-button
            label="Confirmar"
            data-testid="confirm-estimate-submit"
            [disabled]="!amount || amount <= 0"
            (buttonClick)="submit()"
          />
        </div>
      </ng-template>
    </z-dialog>
  `,
})
export class ConfirmEstimateDialogComponent {
  readonly visible = input<boolean>(false);
  readonly transaction = input<Transaction | null>(null);

  readonly visibleChange = output<boolean>();
  readonly confirmed = output<ConfirmEstimatePayload>();

  amount: number | null = null;
  targetStatus: 'PENDING' | 'SETTLED' = 'PENDING';
  updateRecurringTemplate = false;

  readonly statusOptions = signal<{ label: string; value: 'PENDING' | 'SETTLED' }[]>([
    { label: 'Pendente', value: 'PENDING' },
    { label: 'Pago', value: 'SETTLED' },
  ]);

  constructor() {
    effect(() => {
      const txn = this.transaction();
      if (txn) {
        this.amount = txn.amount;
        this.targetStatus = 'PENDING';
        this.updateRecurringTemplate = false;
        this.statusOptions.set([
          { label: 'Pendente', value: 'PENDING' },
          { label: txn.type === 'INCOME' ? 'Recebido' : 'Pago', value: 'SETTLED' },
        ]);
      }
    });
  }

  submit(): void {
    if (!this.amount || this.amount <= 0) return;
    this.confirmed.emit({
      amount: this.amount,
      targetStatus: this.targetStatus,
      updateRecurringTemplate: this.updateRecurringTemplate,
    });
  }
}
