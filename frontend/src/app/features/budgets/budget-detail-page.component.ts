import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  ConfirmEstimatePayload,
  Transaction,
  TransactionPayload,
  TransactionStatus,
  TransactionType,
} from '../../core/models/api.models';
import { TransactionStatusBadgeComponent } from '../../shared/components/transaction-status-badge.component';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';
import { CompetenceMonthPipe } from '../../shared/pipes/competence-month.pipe';
import {
  ZButtonComponent,
  ZConfirmService,
  ZInputDirective,
  ZSelectComponent,
  ZToastService,
  ZTooltipDirective,
} from '../../shared/ui';
import { CatalogStoreService } from '../catalog/catalog-store.service';
import { BudgetsStoreService } from './budgets-store.service';
import { ConfirmEstimateDialogComponent } from './confirm-estimate-dialog.component';
import { TransactionFormDrawerComponent } from './transaction-form-drawer.component';

@Component({
  selector: 'app-budget-detail-page',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ZButtonComponent,
    ZInputDirective,
    ZSelectComponent,
    ZTooltipDirective,
    BrlCurrencyPipe,
    CompetenceMonthPipe,
    TransactionStatusBadgeComponent,
    ConfirmEstimateDialogComponent,
    TransactionFormDrawerComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Top bar -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div class="flex items-center gap-3">
          <a
            routerLink="/budgets"
            class="p-2.5 rounded-xl text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            aria-label="Voltar para orçamentos"
          >
            <i class="pi pi-arrow-left text-base" aria-hidden="true"></i>
          </a>
          <div>
            <p class="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Orçamento Mensal
            </p>
            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight" data-testid="budget-detail-title">
              @if (detail(); as d) {
                {{ d.competenceMonth | competenceMonth }}
              } @else {
                Carregando...
              }
            </h1>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          @if (detail(); as d) {
            <a
              [routerLink]="['/dashboard']"
              [queryParams]="{ budgetId: d.id }"
              data-testid="open-dashboard-charts-btn"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800/70 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[15px] font-semibold transition-colors"
            >
              <i class="pi pi-chart-pie text-sm" aria-hidden="true"></i>
              <span>Ver Gráficos no Dashboard</span>
            </a>
          }
          <z-button
            label="Novo Lançamento"
            icon="pi pi-plus"
            data-testid="new-transaction-btn"
            (buttonClick)="openCreateDrawer()"
          />
        </div>
      </div>

      <!-- Summary Cards -->
      @if (detail(); as d) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch" data-testid="budget-summary-cards">
          <!-- Receitas -->
          <div class="h-full flex flex-col gap-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm">
            <div class="space-y-2.5">
              <div class="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span>RECEITAS</span>
                <span class="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 inline-flex items-center justify-center">
                  <i class="pi pi-arrow-down-left text-sm" aria-hidden="true"></i>
                </span>
              </div>
              <div class="text-3xl font-extrabold text-sky-600 dark:text-sky-400 tabular-nums" data-testid="summary-planned-income">
                {{ d.summary.plannedIncome | brlCurrency }}
              </div>
            </div>
            <div
              class="mt-auto text-sm text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80"
              data-testid="kpi-footer-income"
            >
              <span>Realizado (Recebido)</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200 tabular-nums" data-testid="summary-realized-income">
                {{ d.summary.realizedIncome | brlCurrency }}
              </span>
            </div>
          </div>

          <!-- Despesas -->
          <div class="h-full flex flex-col gap-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm">
            <div class="space-y-2.5">
              <div class="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span>DESPESAS</span>
                <span class="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 inline-flex items-center justify-center">
                  <i class="pi pi-arrow-up-right text-sm" aria-hidden="true"></i>
                </span>
              </div>
              <div class="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums" data-testid="summary-planned-expense">
                {{ d.summary.plannedExpense | brlCurrency }}
              </div>
              <div class="pt-1 flex items-center gap-2.5" data-testid="expense-paid-progress">
                <div class="h-2 flex-1 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    class="h-full rounded-full bg-sky-500 transition-all"
                    [style.width.%]="expensePaidPercent()"
                  ></div>
                </div>
                <span class="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums shrink-0 whitespace-nowrap">
                  {{ expensePaidPercent() }}% pago
                </span>
              </div>
            </div>
            <div
              class="mt-auto text-sm text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80"
              data-testid="kpi-footer-expense"
            >
              <span>Realizado (Pago)</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200 tabular-nums" data-testid="summary-realized-expense">
                {{ d.summary.realizedExpense | brlCurrency }}
              </span>
            </div>
          </div>

          <!-- Saldo -->
          <div class="h-full flex flex-col gap-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 shadow-sm">
            <div class="space-y-2.5">
              <div class="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <span>SALDO DO MÊS</span>
                <span class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 inline-flex items-center justify-center">
                  <i class="pi pi-chart-line text-sm" aria-hidden="true"></i>
                </span>
              </div>
              <div
                class="text-3xl font-extrabold tabular-nums"
                [class]="d.summary.plannedBalance >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'"
                data-testid="summary-planned-balance"
              >
                {{ d.summary.plannedBalance | brlCurrency }}
              </div>
            </div>
            <div
              class="mt-auto text-sm text-slate-500 dark:text-slate-400 flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80"
              data-testid="kpi-footer-balance"
            >
              <span>Saldo Realizado</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200 tabular-nums" data-testid="summary-realized-balance">
                {{ d.summary.realizedBalance | brlCurrency }}
              </span>
            </div>
          </div>
        </div>
      }

      <!-- Tabs & Filters -->
      <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-5 space-y-4 shadow-sm">
        <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3.5">
          @for (tab of typeTabs; track tab.label) {
            <button
              type="button"
              [attr.data-testid]="'tab-type-' + (tab.value || 'ALL')"
              (click)="setTypeTab(tab.value)"
              [class]="
                store.filters().type === tab.value
                  ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
              "
              class="px-4 py-2 rounded-xl text-[15px] transition-colors cursor-pointer"
            >
              {{ tab.label }}
            </button>
          }
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            zInput
            data-testid="filter-search"
            [ngModel]="store.filters().search"
            (ngModelChange)="onFilterChange({ search: $event })"
            placeholder="Buscar descrição ou obs..."
          />

          <z-select
            inputId="filter-status"
            [ngModel]="store.filters().status"
            (ngModelChange)="onFilterChange({ status: $event })"
            [options]="statusFilterOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Status"
            [showClear]="true"
            styleClass="w-full"
          />

          <z-select
            inputId="filter-category"
            [ngModel]="store.filters().categoryId"
            (ngModelChange)="onFilterChange({ categoryId: $event })"
            [options]="catalogStore.categories()"
            optionLabel="name"
            optionValue="id"
            placeholder="Categoria"
            [showClear]="true"
            [searchable]="true"
            searchPlaceholder="Buscar categoria..."
            styleClass="w-full"
          />

          <z-select
            inputId="filter-beneficiary"
            [ngModel]="store.filters().beneficiaryId"
            (ngModelChange)="onFilterChange({ beneficiaryId: $event })"
            [options]="catalogStore.beneficiaries()"
            optionLabel="name"
            optionValue="id"
            placeholder="Beneficiário"
            [showClear]="true"
            [searchable]="true"
            searchPlaceholder="Buscar beneficiário..."
            styleClass="w-full"
          />

          <z-button
            label="Limpar filtros"
            icon="pi pi-filter-slash"
            variant="outline"
            styleClass="w-full"
            (buttonClick)="clearFilters()"
          />
        </div>
      </div>

      <!-- Transactions List -->
      @if (store.transactions().length === 0) {
        <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-12 text-center text-base text-slate-500 dark:text-slate-400 shadow-sm">
          Nenhum lançamento encontrado para os filtros selecionados.
        </div>
      } @else {
        <!-- Desktop Table (>= 1024px) -->
        <div class="hidden lg:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 overflow-x-auto shadow-sm">
          <table class="w-full text-[15px] text-left" data-testid="transactions-table">
            <thead class="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-5 py-4">
                  <span
                    class="inline-flex items-center gap-1.5 cursor-help"
                    zTooltip="Clique no status de qualquer lançamento para alternar entre Pendente e Pago/Recebido"
                    tooltipPosition="top"
                    data-testid="status-column-header"
                  >
                    <span>Status</span>
                    <i class="pi pi-info-circle text-indigo-500 text-xs" aria-hidden="true"></i>
                  </span>
                </th>
                <th class="px-5 py-4">Descrição</th>
                <th class="px-5 py-4">Categoria / Beneficiário</th>
                <th class="px-5 py-4">Vencimento</th>
                <th class="px-5 py-4 text-right">Valor</th>
                <th class="px-5 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              @for (txn of store.transactions(); track txn.id) {
                <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors" [attr.data-testid]="'txn-row-' + txn.description">
                  <td class="px-5 py-4">
                    <button
                      type="button"
                      [attr.data-testid]="'toggle-status-' + txn.description"
                      (click)="toggleSettle(txn)"
                      class="cursor-pointer transition-transform active:scale-95"
                      [zTooltip]="statusTooltip(txn)"
                      tooltipPosition="top"
                      [title]="statusTooltip(txn)"
                    >
                      <app-transaction-status-badge [status]="txn.status" [type]="txn.type" />
                    </button>
                  </td>
                  <td class="px-5 py-4">
                    <div class="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                      <span>{{ txn.description }}</span>
                      @if (txn.sourceRecurringTransactionId) {
                        <span
                          class="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-xs font-semibold"
                          title="Originado de recorrência"
                        >
                          ↻
                        </span>
                      }
                      @if (txn.installmentCurrent && txn.installmentTotal) {
                        <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium tabular-nums">
                          {{ txn.installmentCurrent }}/{{ txn.installmentTotal }}
                        </span>
                      }
                      @if (txn.status === 'ESTIMATED') {
                        <button
                          type="button"
                          [attr.data-testid]="'confirm-estimate-btn-' + txn.description"
                          (click)="openConfirmEstimate(txn)"
                          class="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 text-xs font-semibold cursor-pointer"
                        >
                          Confirmar valor
                        </button>
                      }
                    </div>
                    @if (txn.notes) {
                      <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate max-w-md">{{ txn.notes }}</p>
                    }
                  </td>
                  <td class="px-5 py-4">
                    <div class="flex flex-wrap items-center gap-2 text-sm">
                      @if (txn.categoryName) {
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium">
                          <span
                            class="w-2.5 h-2.5 rounded-full"
                            [style.background-color]="txn.categoryColor || '#4F46E5'"
                          ></span>
                          {{ txn.categoryName }}
                        </span>
                      } @else {
                        <span class="text-slate-400">Sem categoria</span>
                      }
                      @if (txn.beneficiaryName) {
                        <span class="text-slate-400">•</span>
                        <span class="text-slate-600 dark:text-slate-300 font-medium">{{ txn.beneficiaryName }}</span>
                      }
                    </div>
                  </td>
                  <td class="px-5 py-4 text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap">
                    {{ txn.dueDate ? (txn.dueDate | date: 'dd/MM/yyyy') : '—' }}
                  </td>
                  <td
                    class="px-5 py-4 text-right font-bold tabular-nums whitespace-nowrap text-base"
                    [class]="txn.type === 'INCOME' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-900 dark:text-slate-100'"
                  >
                    {{ txn.type === 'INCOME' ? '+ ' : '' }}{{ txn.amount | brlCurrency }}
                  </td>
                  <td class="px-5 py-4 text-right whitespace-nowrap">
                    <button
                      type="button"
                      (click)="openEditDrawer(txn)"
                      class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      aria-label="Editar lançamento"
                    >
                      <i class="pi pi-pencil text-sm" aria-hidden="true"></i>
                    </button>
                    <button
                      type="button"
                      (click)="confirmDeleteTransaction(txn)"
                      class="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      aria-label="Excluir lançamento"
                    >
                      <i class="pi pi-trash text-sm" aria-hidden="true"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Mobile Stacked Cards (< 1024px) -->
        <div class="lg:hidden space-y-3" data-testid="transactions-mobile-cards">
          @for (txn of store.transactions(); track txn.id) {
            <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-4 space-y-3 shadow-sm">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 font-semibold text-[15px]">
                    <span class="truncate">{{ txn.description }}</span>
                    @if (txn.sourceRecurringTransactionId) {
                      <span class="text-indigo-500 text-xs">↻</span>
                    }
                    @if (txn.installmentCurrent && txn.installmentTotal) {
                      <span class="text-xs text-slate-500 tabular-nums">
                        ({{ txn.installmentCurrent }}/{{ txn.installmentTotal }})
                      </span>
                    }
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {{ txn.categoryName || 'Sem categoria' }}
                    @if (txn.beneficiaryName) {
                      • {{ txn.beneficiaryName }}
                    }
                  </p>
                </div>

                <div
                  class="font-bold text-base tabular-nums shrink-0"
                  [class]="txn.type === 'INCOME' ? 'text-sky-600 dark:text-sky-400' : ''"
                >
                  {{ txn.amount | brlCurrency }}
                </div>
              </div>

              <div class="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="toggleSettle(txn)"
                    class="cursor-pointer"
                    [zTooltip]="statusTooltip(txn)"
                    tooltipPosition="top"
                  >
                    <app-transaction-status-badge [status]="txn.status" [type]="txn.type" />
                  </button>
                  @if (txn.status === 'ESTIMATED') {
                    <button
                      type="button"
                      (click)="openConfirmEstimate(txn)"
                      class="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-semibold"
                    >
                      Confirmar
                    </button>
                  }
                </div>

                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    (click)="openEditDrawer(txn)"
                    class="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Editar lançamento"
                  >
                    <i class="pi pi-pencil text-sm" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    (click)="confirmDeleteTransaction(txn)"
                    class="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    aria-label="Excluir lançamento"
                  >
                    <i class="pi pi-trash text-sm" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <app-transaction-form-drawer
      [visible]="drawerVisible()"
      (visibleChange)="drawerVisible.set($event)"
      [transaction]="editingTransaction()"
      (saved)="onTransactionSaved($event)"
    />

    <app-confirm-estimate-dialog
      [visible]="confirmEstimateVisible()"
      (visibleChange)="confirmEstimateVisible.set($event)"
      [transaction]="estimatingTransaction()"
      (confirmed)="onEstimateConfirmed($event)"
    />
  `,
})
export class BudgetDetailPageComponent implements OnInit {
  readonly id = input.required<string>();
  readonly store = inject(BudgetsStoreService);
  readonly catalogStore = inject(CatalogStoreService);
  private readonly confirmService = inject(ZConfirmService);
  private readonly toastService = inject(ZToastService);

  readonly detail = this.store.currentDetail;
  readonly drawerVisible = signal(false);
  readonly editingTransaction = signal<Transaction | null>(null);
  readonly confirmEstimateVisible = signal(false);
  readonly estimatingTransaction = signal<Transaction | null>(null);

  readonly typeTabs: { label: string; value: TransactionType | null }[] = [
    { label: 'Todas', value: null },
    { label: 'Despesas', value: 'EXPENSE' },
    { label: 'Receitas', value: 'INCOME' },
  ];

  readonly statusFilterOptions: { label: string; value: TransactionStatus }[] = [
    { label: 'Estimado', value: 'ESTIMATED' },
    { label: 'Pendente', value: 'PENDING' },
    { label: 'Pago / Recebido', value: 'SETTLED' },
  ];

  readonly expensePaidPercent = computed(() => {
    const d = this.detail();
    if (!d || d.summary.plannedExpense <= 0) return 0;
    return Math.min(100, Math.round((d.summary.realizedExpense / d.summary.plannedExpense) * 100));
  });

  ngOnInit(): void {
    void this.catalogStore.loadAll();
    void this.store.loadBudgetDetail(this.id());
  }

  statusTooltip(txn: Transaction): string {
    if (txn.status === 'SETTLED') {
      return 'Clique para reverter para Pendente';
    }
    return txn.type === 'INCOME'
      ? 'Clique para marcar como Recebido'
      : 'Clique para marcar como Pago';
  }

  setTypeTab(type: TransactionType | null): void {
    void this.store.updateFilters(this.id(), { type });
  }

  onFilterChange(partial: Partial<{ status: unknown; categoryId: unknown; beneficiaryId: unknown; search: string }>): void {
    void this.store.updateFilters(this.id(), partial as Partial<{ status: TransactionStatus | null; categoryId: string | null; beneficiaryId: string | null; search: string }>);
  }

  clearFilters(): void {
    void this.store.resetFilters(this.id());
  }

  openCreateDrawer(): void {
    this.editingTransaction.set(null);
    this.drawerVisible.set(true);
  }

  openEditDrawer(txn: Transaction): void {
    this.editingTransaction.set(txn);
    this.drawerVisible.set(true);
  }

  async onTransactionSaved(payload: TransactionPayload): Promise<void> {
    const editing = this.editingTransaction();
    if (editing) {
      await this.store.updateTransaction(this.id(), editing.id, payload);
      this.toastService.add({ severity: 'success', summary: 'Lançamento atualizado' });
    } else {
      await this.store.createTransaction(this.id(), payload);
      this.toastService.add({ severity: 'success', summary: 'Lançamento criado' });
    }
    this.drawerVisible.set(false);
  }

  async toggleSettle(txn: Transaction): Promise<void> {
    const nextStatus: TransactionStatus = txn.status === 'SETTLED' ? 'PENDING' : 'SETTLED';
    await this.store.changeTransactionStatus(this.id(), txn.id, nextStatus);
  }

  openConfirmEstimate(txn: Transaction): void {
    this.estimatingTransaction.set(txn);
    this.confirmEstimateVisible.set(true);
  }

  async onEstimateConfirmed(payload: ConfirmEstimatePayload): Promise<void> {
    const txn = this.estimatingTransaction();
    if (!txn) return;
    await this.store.confirmEstimate(this.id(), txn.id, payload);
    this.confirmEstimateVisible.set(false);
    this.toastService.add({ severity: 'success', summary: 'Valor confirmado' });
  }

  confirmDeleteTransaction(txn: Transaction): void {
    const extra = txn.sourceRecurringTransactionId
      ? ' Como este lançamento veio de uma recorrência, ele não será recriado automaticamente neste mês.'
      : '';
    this.confirmService.confirm({
      header: 'Excluir Lançamento',
      message: `Deseja excluir "${txn.description}"?${extra}`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      variant: 'destructive',
      accept: () => {
        void this.store.deleteTransaction(this.id(), txn.id).then(() => {
          this.toastService.add({ severity: 'success', summary: 'Lançamento excluído' });
        });
      },
    });
  }
}
