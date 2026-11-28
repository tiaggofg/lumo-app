import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  RecurrenceAmountType,
  RecurrenceType,
  RecurringTransaction,
  TransactionType,
} from '../../core/models/api.models';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';
import { CompetenceMonthPipe } from '../../shared/pipes/competence-month.pipe';
import {
  ZButtonComponent,
  ZCheckboxComponent,
  ZConfirmService,
  ZDialogComponent,
  ZInputDirective,
  ZInputNumberComponent,
  ZSelectComponent,
  ZTextareaDirective,
  ZToastService,
  ZTooltipDirective,
} from '../../shared/ui';
import { CatalogStoreService } from '../catalog/catalog-store.service';
import { RecurrencesStoreService } from './recurrences-store.service';

@Component({
  selector: 'app-recurrences-page',
  standalone: true,
  imports: [
    FormsModule,
    ZButtonComponent,
    ZCheckboxComponent,
    ZDialogComponent,
    ZInputNumberComponent,
    ZInputDirective,
    ZSelectComponent,
    ZTextareaDirective,
    ZTooltipDirective,
    BrlCurrencyPipe,
    CompetenceMonthPipe,
  ],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Recorrências</h1>
          <p class="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
            Configure contas fixas, variáveis estimadas, prazos definidos e parcelamentos automáticos.
          </p>
        </div>

        <z-button
          label="Nova Recorrência"
          icon="pi pi-plus"
          data-testid="new-recurrence-btn"
          (buttonClick)="openFormDialog()"
        />
      </div>

      <!-- Filter Bar -->
      <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-sm">
        <z-select
          [ngModel]="store.filters().active"
          (ngModelChange)="store.updateFilters({ active: $event })"
          [options]="activeFilterOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Situação"
          [showClear]="true"
          styleClass="w-full"
        />

        <z-select
          [ngModel]="store.filters().type"
          (ngModelChange)="store.updateFilters({ type: $event })"
          [options]="typeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Tipo"
          [showClear]="true"
          styleClass="w-full"
        />

        <z-select
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
        <div class="rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center space-y-3 shadow-sm">
          <p class="text-base text-slate-500 dark:text-slate-400">
            Nenhuma recorrência cadastrada ainda.
          </p>
          <z-button label="Criar primeira recorrência" icon="pi pi-plus" (buttonClick)="openFormDialog()" />
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-5 items-stretch" data-testid="recurrences-grid">
          @for (rule of store.recurrences(); track rule.id) {
            <article
              [attr.data-testid]="'recurrence-card-' + rule.description"
              [attr.data-active]="rule.active"
              class="h-full flex flex-col gap-4 rounded-2xl border p-5 shadow-sm transition-colors"
              [class]="
                rule.active
                  ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
                  : 'bg-slate-50/90 dark:bg-slate-900/60 border-dashed border-slate-300 dark:border-slate-700'
              "
            >
              <!-- Zone 1: Header (Title + Active Status | Amount + Amount Type) -->
              <div class="flex items-start justify-between gap-4" data-testid="recurrence-card-header">
                <div class="min-w-0 space-y-1">
                  <h2
                    class="font-bold text-[17px] leading-snug truncate"
                    [class]="
                      rule.active
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-slate-600 dark:text-slate-300'
                    "
                    [title]="rule.description"
                  >
                    {{ rule.description }}
                  </h2>
                  <div
                    class="inline-flex items-center gap-1.5 text-xs font-semibold"
                    [class]="
                      rule.active
                        ? 'text-sky-600 dark:text-sky-400'
                        : 'text-slate-500 dark:text-slate-400'
                    "
                    data-testid="recurrence-card-status"
                  >
                    <span
                      class="w-1.5 h-1.5 rounded-full shrink-0"
                      [class]="rule.active ? 'bg-sky-500' : 'bg-slate-400 dark:bg-slate-500'"
                    ></span>
                    <span>{{ rule.active ? 'Ativa' : 'Inativa' }}</span>
                  </div>
                </div>

                <div class="text-right shrink-0">
                  <div
                    class="font-extrabold text-xl leading-snug tabular-nums"
                    [class]="
                      !rule.active
                        ? 'text-slate-600 dark:text-slate-300'
                        : rule.type === 'INCOME'
                          ? 'text-sky-600 dark:text-sky-400'
                          : 'text-slate-900 dark:text-slate-100'
                    "
                  >
                    {{ rule.type === 'INCOME' ? '+ ' : '' }}{{ rule.amount | brlCurrency }}
                  </div>
                  <span
                    class="inline-block text-xs font-semibold mt-0.5"
                    [class]="
                      rule.amountType === 'ESTIMATED'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-500 dark:text-slate-400'
                    "
                    data-testid="recurrence-card-amount-type"
                  >
                    {{ rule.amountType === 'ESTIMATED' ? 'Estimado' : 'Fixo' }}
                  </span>
                </div>
              </div>

              <!-- Zone 2: Body (Structured Metadata & Optional Notes) -->
              <div class="space-y-2.5 text-xs" data-testid="recurrence-card-body">
                <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span
                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold"
                    data-testid="recurrence-card-mode"
                  >
                    <i class="pi pi-sync text-[11px]" aria-hidden="true"></i>
                    <span>{{ modeLabel(rule) }}</span>
                  </span>

                  <span
                    class="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium"
                    data-testid="recurrence-card-start"
                  >
                    <i class="pi pi-calendar text-[11px] text-slate-400" aria-hidden="true"></i>
                    <span>Início {{ rule.startMonth | competenceMonth }}</span>
                  </span>

                  @if (rule.dueDay) {
                    <span
                      class="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium tabular-nums"
                      data-testid="recurrence-card-due-day"
                    >
                      <i class="pi pi-clock text-[11px] text-slate-400" aria-hidden="true"></i>
                      <span>Dia {{ rule.dueDay }}</span>
                    </span>
                  }
                </div>

                @if (rule.categoryName || rule.beneficiaryName) {
                  <div class="flex flex-wrap items-center gap-2">
                    @if (rule.categoryName) {
                      <span
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 font-medium max-w-full"
                        data-testid="recurrence-card-category"
                      >
                        <span
                          class="w-2.5 h-2.5 rounded-full shrink-0"
                          [style.background-color]="rule.categoryColor || '#4F46E5'"
                          data-testid="recurrence-card-category-dot"
                        ></span>
                        <span class="truncate">{{ rule.categoryName }}</span>
                      </span>
                    }

                    @if (rule.beneficiaryName) {
                      <span
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-medium max-w-full"
                        data-testid="recurrence-card-beneficiary"
                      >
                        <i class="pi pi-user text-[11px] text-slate-400 shrink-0" aria-hidden="true"></i>
                        <span class="truncate">{{ rule.beneficiaryName }}</span>
                      </span>
                    }
                  </div>
                }

                @if (rule.notes) {
                  <p
                    class="text-xs text-slate-500 dark:text-slate-400 truncate"
                    [title]="rule.notes"
                    data-testid="recurrence-card-notes"
                  >
                    {{ rule.notes }}
                  </p>
                }
              </div>

              <!-- Zone 3: Footer (Type Badge | Compact Maintenance Actions) -->
              <div
                class="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2"
                data-testid="recurrence-card-footer"
              >
                <span
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                  [class]="
                    rule.type === 'INCOME'
                      ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                      : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  "
                  data-testid="recurrence-card-type"
                >
                  <i
                    [class]="
                      rule.type === 'INCOME'
                        ? 'pi pi-arrow-down-left text-[10px]'
                        : 'pi pi-arrow-up-right text-[10px]'
                    "
                    aria-hidden="true"
                  ></i>
                  <span>{{ rule.type === 'INCOME' ? 'Receita' : 'Despesa' }}</span>
                </span>

                <div class="flex items-center gap-1.5">
                  <z-button
                    label="Editar"
                    icon="pi pi-pencil"
                    size="sm"
                    variant="outline"
                    data-testid="recurrence-edit-btn"
                    (buttonClick)="openFormDialog(rule)"
                  />
                  @if (rule.active) {
                    <button
                      type="button"
                      (click)="openDeactivateDialog(rule)"
                      zTooltip="Desativar"
                      tooltipPosition="top"
                      aria-label="Desativar recorrência"
                      data-testid="recurrence-deactivate-btn"
                      class="w-8 h-8 rounded-lg inline-flex items-center justify-center text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                    >
                      <i class="pi pi-pause text-xs" aria-hidden="true"></i>
                    </button>
                  } @else {
                    <button
                      type="button"
                      (click)="activate(rule)"
                      zTooltip="Reativar"
                      tooltipPosition="top"
                      aria-label="Reativar recorrência"
                      data-testid="recurrence-activate-btn"
                      class="w-8 h-8 rounded-lg inline-flex items-center justify-center text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/50 transition-colors cursor-pointer"
                    >
                      <i class="pi pi-play text-xs" aria-hidden="true"></i>
                    </button>
                  }
                  <button
                    type="button"
                    (click)="confirmDelete(rule)"
                    zTooltip="Excluir"
                    tooltipPosition="top"
                    aria-label="Excluir recorrência"
                    data-testid="recurrence-delete-btn"
                    class="w-8 h-8 rounded-lg inline-flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <i class="pi pi-trash text-xs" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            </article>
          }
        </div>
      }
    </div>

    <!-- Create/Edit Recurrence Dialog -->
    <z-dialog
      [header]="editingId() ? 'Editar Recorrência' : 'Nova Recorrência'"
      [(visible)]="formDialogVisible"
      widthClass="max-w-xl"
    >
      <div class="space-y-4 pt-1">
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="rec-type" class="text-sm font-medium">Tipo</label>
            <z-select
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
            <z-select
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
            zInput
            [(ngModel)]="form.description"
            maxlength="140"
            placeholder="Ex.: Aluguel, Água, Dentista"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="rec-amount" class="text-sm font-medium">Valor padrão (R$)</label>
            <z-input-number
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
            <z-input-number
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
            <z-select
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
              zInput
              type="month"
              [(ngModel)]="form.startMonth"
            />
          </div>
        </div>

        @if (form.recurrenceType === 'FIXED_TERM') {
          <div class="flex flex-col gap-1.5">
            <label for="rec-end-month" class="text-sm font-medium">Mês de término (inclusivo)</label>
            <input
              id="rec-end-month"
              zInput
              type="month"
              [(ngModel)]="form.endMonth"
            />
          </div>
        }

        @if (form.recurrenceType === 'INSTALLMENT') {
          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label for="rec-total-inst" class="text-sm font-medium">Total de parcelas</label>
              <z-input-number
                inputId="rec-total-inst"
                [(ngModel)]="form.totalInstallments"
                [min]="2"
                [useGrouping]="false"
                styleClass="w-full"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label for="rec-start-inst" class="text-sm font-medium">Parcela inicial</label>
              <z-input-number
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
            <z-select
              inputId="rec-cat"
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
            <label for="rec-ben" class="text-sm font-medium">Beneficiário</label>
            <z-select
              inputId="rec-ben"
              [(ngModel)]="form.beneficiaryId"
              [options]="catalogStore.activeBeneficiaries()"
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
          <label for="rec-notes" class="text-sm font-medium">Observações</label>
          <textarea
            id="rec-notes"
            zTextarea
            [(ngModel)]="form.notes"
            rows="2"
            maxlength="500"
          ></textarea>
        </div>

        @if (editingId()) {
          <div class="flex items-center gap-2 p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/70">
            <z-checkbox
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
          <z-button label="Cancelar" variant="ghost" (buttonClick)="formDialogVisible = false" />
          <z-button
            label="Salvar"
            data-testid="rec-save-btn"
            [loading]="saving()"
            [disabled]="!isFormValid()"
            (buttonClick)="save()"
          />
        </div>
      </ng-template>
    </z-dialog>

    <!-- Deactivate Dialog -->
    <z-dialog
      header="Desativar Recorrência"
      [(visible)]="deactivateDialogVisible"
      widthClass="max-w-md"
    >
      @if (deactivatingRule(); as rule) {
        <div class="space-y-4 pt-1">
          <p class="text-sm text-slate-600 dark:text-slate-300">
            Desativar <strong>{{ rule.description }}</strong> impedirá que futuros orçamentos gerem novos lançamentos automaticamente.
          </p>
          <div class="flex items-center gap-2">
            <z-checkbox
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
          <z-button label="Cancelar" variant="ghost" (buttonClick)="deactivateDialogVisible = false" />
          <z-button
            label="Desativar"
            variant="warn"
            data-testid="confirm-deactivate-btn"
            (buttonClick)="confirmDeactivate()"
          />
        </div>
      </ng-template>
    </z-dialog>
  `,
})
export class RecurrencesPageComponent implements OnInit {
  readonly store = inject(RecurrencesStoreService);
  readonly catalogStore = inject(CatalogStoreService);
  private readonly confirmService = inject(ZConfirmService);
  private readonly toastService = inject(ZToastService);

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
        this.toastService.add({
          severity: 'success',
          summary: 'Recorrência atualizada',
          detail:
            res.propagatedCount > 0
              ? `${res.propagatedCount} lançamento(s) em aberto atualizado(s).`
              : undefined,
        });
      } else {
        const res = await this.store.create(payload);
        this.toastService.add({
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
    this.toastService.add({
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
    this.toastService.add({ severity: 'success', summary: 'Recorrência reativada' });
  }

  confirmDelete(rule: RecurringTransaction): void {
    this.confirmService.confirm({
      header: 'Excluir Recorrência',
      message: `Deseja excluir fisicamente "${rule.description}"? (Permitido apenas se nunca gerou lançamentos.)`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      variant: 'destructive',
      accept: () => {
        void this.store.delete(rule.id).then(() => {
          this.toastService.add({ severity: 'success', summary: 'Recorrência excluída' });
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
