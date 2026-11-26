import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import {
  RecurrenceAmountType,
  RecurrenceType,
  RecurringTransaction,
  TransactionType,
} from '../../core/models/api.models';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';
import { CatalogStoreService } from '../catalog/catalog-store.service';
import { RecurrencesStoreService } from './recurrences-store.service';

@Component({
  selector: 'app-recurrences-page',
  standalone: true,
  imports: [
    FormsModule,
    ButtonModule,
    CheckboxModule,
    DialogModule,
    InputNumberModule,
    InputTextModule,
    SelectModule,
    TextareaModule,
    BrlCurrencyPipe,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold tracking-tight">Recorrências</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Configure contas fixas, variáveis estimadas, prazos definidos e parcelamentos automáticos.
          </p>
        </div>

        <p-button
          label="Nova Recorrência"
          icon="pi pi-plus"
          data-testid="new-recurrence-btn"
          (onClick)="openFormDialog()"
        />
      </div>

      <!-- Filter Bar -->
      <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <p-select
          [ngModel]="store.filters().active"
          (ngModelChange)="store.updateFilters({ active: $event })"
          [options]="activeFilterOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Situação"
          [showClear]="true"
          styleClass="w-full"
        />

        <p-select
          [ngModel]="store.filters().type"
          (ngModelChange)="store.updateFilters({ type: $event })"
          [options]="typeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Tipo"
          [showClear]="true"
          styleClass="w-full"
        />

        <p-select
          [ngModel]="store.filters().recurrenceType"
          (ngModelChange)="store.updateFilters({ recurrenceType: $event })"
          [options]="recurrenceModeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Modo de recorrência"
          [showClear]="true"
          styleClass="w-full"
        />
      </div>

      <!-- Recurrence Cards -->
      @if (store.recurrences().length === 0) {
        <div class="rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center space-y-3">
          <p class="text-sm text-slate-500 dark:text-slate-400">
            Nenhuma recorrência cadastrada ainda.
          </p>
          <p-button label="Criar primeira recorrência" icon="pi pi-plus" (onClick)="openFormDialog()" />
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          @for (rule of store.recurrences(); track rule.id) {
            <div
              [attr.data-testid]="'recurrence-card-' + rule.description"
              class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-3"
              [class.opacity-60]="!rule.active"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="space-y-1 min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="font-semibold text-base truncate">{{ rule.description }}</h2>
                    <span
                      class="px-2 py-0.5 rounded-full text-[11px] font-medium"
                      [class]="
                        rule.type === 'INCOME'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                      "
                    >
                      {{ rule.type === 'INCOME' ? 'Receita' : 'Despesa' }}
                    </span>
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
                      {{ modeLabel(rule) }}
                    </span>
                    <span
                      class="px-2 py-0.5 rounded-full text-[11px] font-medium"
                      [class]="
                        rule.amountType === 'ESTIMATED'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      "
                    >
                      {{ rule.amountType === 'ESTIMATED' ? 'Estimado' : 'Fixo' }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    Início: {{ rule.startMonth }}
                    @if (rule.dueDay) {
                      • Vencimento dia {{ rule.dueDay }}
                    }
                    @if (rule.categoryName) {
                      • {{ rule.categoryName }}
                    }
                    @if (rule.beneficiaryName) {
                      • {{ rule.beneficiaryName }}
                    }
                  </p>
                </div>

                <div class="text-right shrink-0">
                  <div class="font-bold text-lg tabular-nums">{{ rule.amount | brlCurrency }}</div>
                  <span
                    class="text-xs font-medium"
                    [class]="rule.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'"
                  >
                    {{ rule.active ? 'Ativa' : 'Inativa' }}
                  </span>
                </div>
              </div>

              <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p-button
                  label="Editar"
                  icon="pi pi-pencil"
                  size="small"
                  severity="secondary"
                  [text]="true"
                  (onClick)="openFormDialog(rule)"
                />
                @if (rule.active) {
                  <p-button
                    label="Desativar"
                    icon="pi pi-pause"
                    size="small"
                    severity="warn"
                    [text]="true"
                    (onClick)="openDeactivateDialog(rule)"
                  />
                } @else {
                  <p-button
                    label="Reativar"
                    icon="pi pi-play"
                    size="small"
                    severity="success"
                    [text]="true"
                    (onClick)="activate(rule)"
                  />
                }
                <p-button
                  label="Excluir"
                  icon="pi pi-trash"
                  size="small"
                  severity="danger"
                  [text]="true"
                  (onClick)="confirmDelete(rule)"
                />
              </div>
            </div>
          }
        </div>
      }
    </div>

    <!-- Create/Edit Recurrence Dialog -->
    <p-dialog
      [header]="editingId() ? 'Editar Recorrência' : 'Nova Recorrência'"
      [(visible)]="formDialogVisible"
      [modal]="true"
      [style]="{ width: '34rem', maxWidth: '96vw' }"
    >
      <div class="space-y-4 pt-2">
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="rec-type" class="text-sm font-medium">Tipo</label>
            <p-select
              inputId="rec-type"
              [(ngModel)]="form.type"
              (ngModelChange)="form.categoryId = null"
              [options]="typeOptions"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="rec-amount-type" class="text-sm font-medium">Valor</label>
            <p-select
              inputId="rec-amount-type"
              [(ngModel)]="form.amountType"
              [options]="amountTypeOptions"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="rec-desc" class="text-sm font-medium">Descrição</label>
          <input
            id="rec-desc"
            data-testid="rec-description-input"
            pInputText
            [(ngModel)]="form.description"
            maxlength="140"
            placeholder="Ex.: Aluguel, Água, Dentista"
            class="w-full"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="rec-amount" class="text-sm font-medium">Valor padrão (R$)</label>
            <p-inputnumber
              inputId="rec-amount"
              data-testid="rec-amount-input"
              [(ngModel)]="form.amount"
              mode="currency"
              currency="BRL"
              locale="pt-BR"
              [min]="0.01"
              styleClass="w-full"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="rec-due-day" class="text-sm font-medium">Dia de vencimento (1..31)</label>
            <p-inputnumber
              inputId="rec-due-day"
              [(ngModel)]="form.dueDay"
              [min]="1"
              [max]="31"
              [useGrouping]="false"
              placeholder="Opcional"
              styleClass="w-full"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="rec-mode" class="text-sm font-medium">Modo</label>
            <p-select
              inputId="rec-mode"
              [(ngModel)]="form.recurrenceType"
              [options]="recurrenceModeOptions"
              optionLabel="label"
              optionValue="value"
              styleClass="w-full"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="rec-start-month" class="text-sm font-medium">Mês de início</label>
            <input
              id="rec-start-month"
              type="month"
              [(ngModel)]="form.startMonth"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
        </div>

        @if (form.recurrenceType === 'FIXED_TERM') {
          <div class="flex flex-col gap-1.5">
            <label for="rec-end-month" class="text-sm font-medium">Mês de término (inclusivo)</label>
            <input
              id="rec-end-month"
              type="month"
              [(ngModel)]="form.endMonth"
              class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
        }

        @if (form.recurrenceType === 'INSTALLMENT') {
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label for="rec-total-inst" class="text-sm font-medium">Total de parcelas</label>
              <p-inputnumber
                inputId="rec-total-inst"
                [(ngModel)]="form.totalInstallments"
                [min]="2"
                [useGrouping]="false"
                styleClass="w-full"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="rec-start-inst" class="text-sm font-medium">Parcela inicial</label>
              <p-inputnumber
                inputId="rec-start-inst"
                [(ngModel)]="form.startingInstallment"
                [min]="1"
                [max]="form.totalInstallments || 999"
                [useGrouping]="false"
                styleClass="w-full"
              />
            </div>
          </div>
        }

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="rec-cat" class="text-sm font-medium">Categoria</label>
            <p-select
              inputId="rec-cat"
              [(ngModel)]="form.categoryId"
              [options]="availableCategories()"
              optionLabel="name"
              optionValue="id"
              placeholder="Selecione"
              [showClear]="true"
              styleClass="w-full"
            />
          </div>
          <div class="flex flex-col gap-1.5">
            <label for="rec-ben" class="text-sm font-medium">Beneficiário</label>
            <p-select
              inputId="rec-ben"
              [(ngModel)]="form.beneficiaryId"
              [options]="catalogStore.activeBeneficiaries()"
              optionLabel="name"
              optionValue="id"
              placeholder="Selecione"
              [showClear]="true"
              styleClass="w-full"
            />
          </div>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="rec-notes" class="text-sm font-medium">Observações</label>
          <textarea
            id="rec-notes"
            pTextarea
            [(ngModel)]="form.notes"
            rows="2"
            maxlength="500"
            class="w-full"
          ></textarea>
        </div>

        @if (editingId()) {
          <div class="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70">
            <p-checkbox
              inputId="propagate-open"
              [(ngModel)]="form.propagateToOpenTransactions"
              [binary]="true"
            />
            <label for="propagate-open" class="text-sm cursor-pointer">
              Propagar alterações para lançamentos em aberto (mês atual e futuros; nunca altera itens pagos)
            </label>
          </div>
        }
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2">
          <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="formDialogVisible = false" />
          <p-button
            label="Salvar"
            data-testid="rec-save-btn"
            [loading]="saving()"
            [disabled]="!isFormValid()"
            (onClick)="save()"
          />
        </div>
      </ng-template>
    </p-dialog>

    <!-- Deactivate Dialog -->
    <p-dialog
      header="Desativar Recorrência"
      [(visible)]="deactivateDialogVisible"
      [modal]="true"
      [style]="{ width: '28rem', maxWidth: '95vw' }"
    >
      @if (deactivatingRule(); as rule) {
        <div class="space-y-4 pt-2">
          <p class="text-sm text-slate-600 dark:text-slate-300">
            Desativar <strong>{{ rule.description }}</strong> impedirá que futuros orçamentos gerem novos lançamentos automaticamente.
          </p>
          <div class="flex items-center gap-2">
            <p-checkbox
              inputId="remove-future-open"
              [(ngModel)]="removeFutureOpenTransactions"
              [binary]="true"
            />
            <label for="remove-future-open" class="text-sm cursor-pointer">
              Remover lançamentos futuros em aberto (mês atual e futuros)
            </label>
          </div>
        </div>
      }

      <ng-template #footer>
        <div class="flex justify-end gap-2">
          <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="deactivateDialogVisible = false" />
          <p-button
            label="Desativar"
            severity="warn"
            data-testid="confirm-deactivate-btn"
            (onClick)="confirmDeactivate()"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class RecurrencesPageComponent implements OnInit {
  readonly store = inject(RecurrencesStoreService);
  readonly catalogStore = inject(CatalogStoreService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly saving = signal(false);
  readonly editingId = signal<string | null>(null);
  formDialogVisible = false;

  readonly deactivatingRule = signal<RecurringTransaction | null>(null);
  deactivateDialogVisible = false;
  removeFutureOpenTransactions = false;

  form = this.emptyForm();

  readonly activeFilterOptions = [
    { label: 'Ativas', value: true },
    { label: 'Inativas', value: false },
  ];

  readonly typeOptions = [
    { label: 'Despesa', value: 'EXPENSE' as TransactionType },
    { label: 'Receita', value: 'INCOME' as TransactionType },
  ];

  readonly amountTypeOptions = [
    { label: 'Fixo (gera Pendente)', value: 'FIXED' as RecurrenceAmountType },
    { label: 'Estimado (gera Estimado)', value: 'ESTIMATED' as RecurrenceAmountType },
  ];

  readonly recurrenceModeOptions = [
    { label: 'Indefinida', value: 'INDEFINITE' as RecurrenceType },
    { label: 'Prazo Definido', value: 'FIXED_TERM' as RecurrenceType },
    { label: 'Parcelada', value: 'INSTALLMENT' as RecurrenceType },
  ];

  readonly availableCategories = computed(() =>
    this.form.type === 'INCOME'
      ? this.catalogStore.activeIncomeCategories()
      : this.catalogStore.activeExpenseCategories()
  );

  ngOnInit(): void {
    void this.catalogStore.loadAll();
    void this.store.loadRecurrences();
  }

  modeLabel(rule: RecurringTransaction): string {
    if (rule.recurrenceType === 'INDEFINITE') return 'Indefinida';
    if (rule.recurrenceType === 'FIXED_TERM') return `Até ${rule.endMonth}`;
    return `Parcelas ${rule.startingInstallment ?? 1}/${rule.totalInstallments}`;
  }

  openFormDialog(rule?: RecurringTransaction): void {
    if (rule) {
      this.editingId.set(rule.id);
      this.form = {
        type: rule.type,
        description: rule.description,
        amount: rule.amount,
        amountType: rule.amountType,
        recurrenceType: rule.recurrenceType,
        startMonth: rule.startMonth,
        endMonth: rule.endMonth ?? '',
        totalInstallments: rule.totalInstallments ?? 2,
        startingInstallment: rule.startingInstallment ?? 1,
        dueDay: rule.dueDay,
        categoryId: rule.categoryId,
        beneficiaryId: rule.beneficiaryId,
        notes: rule.notes ?? '',
        propagateToOpenTransactions: false,
      };
    } else {
      this.editingId.set(null);
      this.form = this.emptyForm();
    }
    this.formDialogVisible = true;
  }

  isFormValid(): boolean {
    if (!this.form.description.trim() || !this.form.amount || this.form.amount <= 0) return false;
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(this.form.startMonth)) return false;
    if (this.form.recurrenceType === 'FIXED_TERM') {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(this.form.endMonth)) return false;
      if (this.form.endMonth < this.form.startMonth) return false;
    }
    if (this.form.recurrenceType === 'INSTALLMENT') {
      if (!this.form.totalInstallments || this.form.totalInstallments < 2) return false;
      const start = this.form.startingInstallment ?? 1;
      if (start < 1 || start > this.form.totalInstallments) return false;
    }
    return true;
  }

  async save(): Promise<void> {
    if (!this.isFormValid() || this.form.amount === null) return;
    this.saving.set(true);
    try {
      const payload = {
        type: this.form.type,
        description: this.form.description.trim(),
        amount: this.form.amount,
        amountType: this.form.amountType,
        recurrenceType: this.form.recurrenceType,
        startMonth: this.form.startMonth,
        endMonth: this.form.recurrenceType === 'FIXED_TERM' ? this.form.endMonth : null,
        totalInstallments:
          this.form.recurrenceType === 'INSTALLMENT' ? this.form.totalInstallments : null,
        startingInstallment:
          this.form.recurrenceType === 'INSTALLMENT' ? (this.form.startingInstallment ?? 1) : null,
        dueDay: this.form.dueDay ?? null,
        categoryId: this.form.categoryId,
        beneficiaryId: this.form.beneficiaryId,
        notes: this.form.notes.trim() || null,
        propagateToOpenTransactions: this.form.propagateToOpenTransactions,
      };

      const id = this.editingId();
      if (id) {
        const res = await this.store.update(id, payload);
        this.messageService.add({
          severity: 'success',
          summary: 'Recorrência atualizada',
          detail:
            res.propagatedCount > 0
              ? `${res.propagatedCount} lançamento(s) em aberto atualizado(s).`
              : undefined,
        });
      } else {
        const res = await this.store.create(payload);
        this.messageService.add({
          severity: 'success',
          summary: 'Recorrência criada',
          detail:
            res.materializedBudgetIds.length > 0
              ? `Materializada em ${res.materializedBudgetIds.length} orçamento(s) existente(s).`
              : undefined,
        });
      }
      this.formDialogVisible = false;
    } finally {
      this.saving.set(false);
    }
  }

  openDeactivateDialog(rule: RecurringTransaction): void {
    this.deactivatingRule.set(rule);
    this.removeFutureOpenTransactions = false;
    this.deactivateDialogVisible = true;
  }

  async confirmDeactivate(): Promise<void> {
    const rule = this.deactivatingRule();
    if (!rule) return;
    const res = await this.store.deactivate(rule.id, this.removeFutureOpenTransactions);
    this.deactivateDialogVisible = false;
    this.messageService.add({
      severity: 'info',
      summary: 'Recorrência desativada',
      detail:
        res.removedTransactionsCount > 0
          ? `${res.removedTransactionsCount} lançamento(s) futuro(s) removido(s).`
          : undefined,
    });
  }

  async activate(rule: RecurringTransaction): Promise<void> {
    await this.store.activate(rule.id);
    this.messageService.add({ severity: 'success', summary: 'Recorrência reativada' });
  }

  confirmDelete(rule: RecurringTransaction): void {
    this.confirmationService.confirm({
      header: 'Excluir Recorrência',
      message: `Deseja excluir fisicamente "${rule.description}"? (Permitido apenas se nunca gerou lançamentos.)`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        void this.store.delete(rule.id).then(() => {
          this.messageService.add({ severity: 'success', summary: 'Recorrência excluída' });
        });
      },
    });
  }

  private emptyForm() {
    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return {
      type: 'EXPENSE' as TransactionType,
      description: '',
      amount: null as number | null,
      amountType: 'FIXED' as RecurrenceAmountType,
      recurrenceType: 'INDEFINITE' as RecurrenceType,
      startMonth: ym,
      endMonth: ym,
      totalInstallments: 2 as number | null,
      startingInstallment: 1 as number | null,
      dueDay: null as number | null,
      categoryId: null as string | null,
      beneficiaryId: null as string | null,
      notes: '',
      propagateToOpenTransactions: false,
    };
  }
}
