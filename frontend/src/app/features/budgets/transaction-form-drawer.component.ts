import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Transaction,
  TransactionPayload,
  TransactionStatus,
  TransactionType,
} from '../../core/models/api.models';
import {
  ZButtonComponent,
  ZDialogComponent,
  ZInputDirective,
  ZInputNumberComponent,
  ZSelectComponent,
  ZTextareaDirective,
} from '../../shared/ui';
import { CatalogStoreService } from '../catalog/catalog-store.service';

@Component({
  selector: 'app-transaction-form-drawer',
  standalone: true,
  imports: [
    FormsModule,
    ZButtonComponent,
    ZDialogComponent,
    ZInputNumberComponent,
    ZInputDirective,
    ZSelectComponent,
    ZTextareaDirective,
  ],
  template: `
    <z-dialog
      [header]="transaction() ? 'Editar Lançamento' : 'Novo Lançamento'"
      [visible]="visible()"
      (visibleChange)="visibleChange.emit($event)"
      widthClass="max-w-lg"
    >
      <div class="space-y-4 pt-1">
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="txn-type" class="text-sm font-medium">Tipo</label>
            <z-select
              inputId="txn-type"
              [(ngModel)]="form.type"
              (ngModelChange)="onTypeChange()"
              [options]="typeOptions"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="txn-status" class="text-sm font-medium">Status</label>
            <z-select
              inputId="txn-status"
              [(ngModel)]="form.status"
              [options]="statusOptions()"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="txn-desc" class="text-sm font-medium">Descrição</label>
          <input
            id="txn-desc"
            data-testid="txn-description-input"
            zInput
            [(ngModel)]="form.description"
            maxlength="140"
            placeholder="Ex.: Aluguel, Salário, Cartão Nubank"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="txn-amount" class="text-sm font-medium">Valor (R$)</label>
            <z-input-number
              inputId="txn-amount"
              data-testid="txn-amount-input"
              [(ngModel)]="form.amount"
              mode="currency"
              currency="BRL"
              locale="pt-BR"
              [min]="0.01"
              styleClass="w-full"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="txn-due" class="text-sm font-medium">Vencimento (opcional)</label>
            <input
              id="txn-due"
              zInput
              type="date"
              [(ngModel)]="form.dueDate"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="txn-category" class="text-sm font-medium">Categoria</label>
            <z-select
              inputId="txn-category"
              [(ngModel)]="form.categoryId"
              [options]="availableCategories()"
              optionLabel="name"
              optionValue="id"
              placeholder="Selecione"
              [showClear]="true"
              [searchable]="true"
              searchPlaceholder="Buscar categoria..."
              styleClass="w-full"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="txn-beneficiary" class="text-sm font-medium">Beneficiário</label>
            <z-select
              inputId="txn-beneficiary"
              [(ngModel)]="form.beneficiaryId"
              [options]="availableBeneficiaries()"
              optionLabel="name"
              optionValue="id"
              placeholder="Selecione"
              [showClear]="true"
              [searchable]="true"
              searchPlaceholder="Buscar beneficiário..."
              styleClass="w-full"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="txn-notes" class="text-sm font-medium">Observações</label>
          <textarea
            id="txn-notes"
            zTextarea
            [(ngModel)]="form.notes"
            rows="2"
            maxlength="500"
            placeholder="Anotações livres (ex.: detalhes da fatura)"
          ></textarea>
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2">
          <z-button label="Cancelar" variant="ghost" (buttonClick)="visibleChange.emit(false)" />
          <z-button
            label="Salvar"
            data-testid="txn-save-btn"
            [disabled]="!isValid()"
            (buttonClick)="submit()"
          />
        </div>
      </ng-template>
    </z-dialog>
  `,
})
export class TransactionFormDrawerComponent {
  private readonly catalogStore = inject(CatalogStoreService);

  readonly visible = input<boolean>(false);
  readonly transaction = input<Transaction | null>(null);

  readonly visibleChange = output<boolean>();
  readonly saved = output<TransactionPayload>();

  form: {
    type: TransactionType;
    description: string;
    amount: number | null;
    status: TransactionStatus;
    dueDate: string;
    notes: string;
    categoryId: string | null;
    beneficiaryId: string | null;
  } = this.emptyForm();

  readonly typeOptions = [
    { label: 'Despesa', value: 'EXPENSE' as TransactionType },
    { label: 'Receita', value: 'INCOME' as TransactionType },
  ];

  readonly availableCategories = computed(() => {
    const base =
      this.form.type === 'INCOME'
        ? this.catalogStore.activeIncomeCategories()
        : this.catalogStore.activeExpenseCategories();
    const editing = this.transaction();
    if (editing?.categoryId && !base.some((c) => c.id === editing.categoryId)) {
      const existing = this.catalogStore.categories().find((c) => c.id === editing.categoryId);
      if (existing && existing.type === this.form.type) {
        return [existing, ...base];
      }
    }
    return base;
  });

  readonly availableBeneficiaries = computed(() => {
    const base = this.catalogStore.activeBeneficiaries();
    const editing = this.transaction();
    if (editing?.beneficiaryId && !base.some((b) => b.id === editing.beneficiaryId)) {
      const existing = this.catalogStore
        .beneficiaries()
        .find((b) => b.id === editing.beneficiaryId);
      if (existing) {
        return [existing, ...base];
      }
    }
    return base;
  });

  readonly statusOptions = computed(() => [
    { label: 'Estimado', value: 'ESTIMATED' as TransactionStatus },
    { label: 'Pendente', value: 'PENDING' as TransactionStatus },
    {
      label: this.form.type === 'INCOME' ? 'Recebido' : 'Pago',
      value: 'SETTLED' as TransactionStatus,
    },
  ]);

  constructor() {
    effect(() => {
      if (!this.visible()) return;
      const txn = this.transaction();
      if (txn) {
        this.form = {
          type: txn.type,
          description: txn.description,
          amount: txn.amount,
          status: txn.status,
          dueDate: txn.dueDate ?? '',
          notes: txn.notes ?? '',
          categoryId: txn.categoryId,
          beneficiaryId: txn.beneficiaryId,
        };
      } else {
        this.form = this.emptyForm();
      }
    });
  }

  onTypeChange(): void {
    this.form.categoryId = null;
  }

  isValid(): boolean {
    return this.form.description.trim().length > 0 && this.form.amount !== null && this.form.amount > 0;
  }

  submit(): void {
    if (!this.isValid() || this.form.amount === null) return;
    this.saved.emit({
      type: this.form.type,
      description: this.form.description.trim(),
      amount: this.form.amount,
      status: this.form.status,
      dueDate: this.form.dueDate || null,
      notes: this.form.notes.trim() || null,
      categoryId: this.form.categoryId,
      beneficiaryId: this.form.beneficiaryId,
    });
  }

  private emptyForm() {
    return {
      type: 'EXPENSE' as TransactionType,
      description: '',
      amount: null as number | null,
      status: 'PENDING' as TransactionStatus,
      dueDate: '',
      notes: '',
      categoryId: null as string | null,
      beneficiaryId: null as string | null,
    };
  }
}
