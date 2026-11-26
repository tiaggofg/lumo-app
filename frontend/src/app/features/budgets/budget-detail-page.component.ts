import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
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
import { CatalogStoreService } from '../catalog/catalog-store.service';
import { BudgetChartsComponent } from './budget-charts.component';
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
    ButtonModule,
    InputTextModule,
    SelectModule,
    BrlCurrencyPipe,
    CompetenceMonthPipe,
    TransactionStatusBadgeComponent,
    BudgetChartsComponent,
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
            class="p-2 rounded-lg text-slate-500 hover:bg-slate-200/70 dark:hover:bg-slate-800 transition-colors"
            aria-label="Voltar para orçamentos"
          >
            <i class="pi pi-arrow-left"></i>
          </a>
          <div>
            <p class="text-xs text-slate-500 dark:text-slate-400">Orçamento Mensal</p>
            <h1 class="text-2xl font-bold tracking-tight" data-testid="budget-detail-title">
              @if (detail(); as d) {
                {{ d.competenceMonth | competenceMonth }}
              } @else {
                Carregando...
              }
            </h1>
          </div>
        </div>

        <p-button
          label="Novo Lançamento"
          icon="pi pi-plus"
          data-testid="new-transaction-btn"
          (onClick)="openCreateDrawer()"
        />
      </div>

      <!-- Summary Cards -->
      @if (detail(); as d) {
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4" data-testid="budget-summary-cards">
          <!-- Receitas -->
          <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-2">
            <div class="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>RECEITAS</span>
              <i class="pi pi-arrow-down-left text-emerald-500"></i>
            </div>
            <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums" data-testid="summary-planned-income">
              {{ d.summary.plannedIncome | brlCurrency }}
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400 flex justify-between">
              <span>Realizado (Recebido)</span>
              <span class="font-semibold text-slate-700 dark:text-slate-200 tabular-nums" data-testid="summary-realized-income">
                {{ d.summary.realizedIncome | brlCurrency }}
              </span>
            </div>
          </div>

          <!-- Despesas -->
          <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-2">
            <div class="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>DESPESAS</span>
              <i class="pi pi-arrow-up-right text-rose-500"></i>
            </div>
            <div class="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums" data-testid="summary-planned-expense">
              {{ d.summary.plannedExpense | brlCurrency }}
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400 flex justify-between">
              <span>Realizado (Pago)</span>
              <span class="font-semibold text-slate-700 dark:text-slate-200 tabular-nums" data-testid="summary-realized-expense">
                {{ d.summary.realizedExpense | brlCurrency }}
              </span>
            </div>
            <div class="pt-1 space-y-1">
              <div class="h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  class="h-full rounded-full bg-emerald-500 transition-all"
                  [style.width.%]="expensePaidPercent()"
                ></div>
              </div>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums text-right">
                {{ expensePaidPercent() }}% pago
              </p>
            </div>
          </div>

          <!-- Saldo -->
          <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 space-y-2">
            <div class="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>SALDO DO MÊS</span>
              <i class="pi pi-chart-line text-indigo-500"></i>
            </div>
            <div
              class="text-2xl font-bold tabular-nums"
              [class]="d.summary.plannedBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'"
              data-testid="summary-planned-balance"
            >
              {{ d.summary.plannedBalance | brlCurrency }}
            </div>
            <div class="text-xs text-slate-500 dark:text-slate-400 flex justify-between">
              <span>Saldo Realizado</span>
              <span class="font-semibold text-slate-700 dark:text-slate-200 tabular-nums" data-testid="summary-realized-balance">
                {{ d.summary.realizedBalance | brlCurrency }}
              </span>
            </div>
          </div>
        </div>
      }

      <!-- Tabs & Filters -->
      <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-4">
        <div class="flex flex-wrap items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          @for (tab of typeTabs; track tab.label) {
            <button
              type="button"
              [attr.data-testid]="'tab-type-' + (tab.value || 'ALL')"
              (click)="setTypeTab(tab.value)"
              [class]="
                store.filters().type === tab.value
                  ? 'bg-emerald-600 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              "
              class="px-3.5 py-1.5 rounded-lg text-sm transition-colors cursor-pointer"
            >
              {{ tab.label }}
            </button>
          }
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            pInputText
            data-testid="filter-search"
            [ngModel]="store.filters().search"
            (ngModelChange)="onFilterChange({ search: $event })"
            placeholder="Buscar descrição ou obs..."
            class="w-full"
          />

          <p-select
            [ngModel]="store.filters().status"
            (ngModelChange)="onFilterChange({ status: $event })"
            [options]="statusFilterOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Status"
            [showClear]="true"
            styleClass="w-full"
          />

          <p-select
            [ngModel]="store.filters().categoryId"
            (ngModelChange)="onFilterChange({ categoryId: $event })"
            [options]="catalogStore.categories()"
            optionLabel="name"
            optionValue="id"
            placeholder="Categoria"
            [showClear]="true"
            styleClass="w-full"
          />

          <p-select
            [ngModel]="store.filters().beneficiaryId"
            (ngModelChange)="onFilterChange({ beneficiaryId: $event })"
            [options]="catalogStore.beneficiaries()"
            optionLabel="name"
            optionValue="id"
            placeholder="Beneficiário"
            [showClear]="true"
            styleClass="w-full"
          />

          <p-button
            label="Limpar filtros"
            icon="pi pi-filter-slash"
            severity="secondary"
            [outlined]="true"
            styleClass="w-full"
            (onClick)="clearFilters()"
          />
        </div>
      </div>

      <!-- Transactions List -->
      @if (store.transactions().length === 0) {
        <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 text-center text-sm text-slate-500 dark:text-slate-400">
          Nenhum lançamento encontrado para os filtros selecionados.
        </div>
      } @else {
        <!-- Desktop Table (>= 1024px) -->
        <div class="hidden lg:block rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table class="w-full text-sm text-left" data-testid="transactions-table">
            <thead class="text-xs uppercase text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th class="px-4 py-3">Status (1-clique)</th>
                <th class="px-4 py-3">Descrição</th>
                <th class="px-4 py-3">Categoria / Beneficiário</th>
                <th class="px-4 py-3">Vencimento</th>
                <th class="px-4 py-3 text-right">Valor</th>
                <th class="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
              @for (txn of store.transactions(); track txn.id) {
                <tr class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors" [attr.data-testid]="'txn-row-' + txn.description">
                  <td class="px-4 py-3">
                    <button
                      type="button"
                      [attr.data-testid]="'toggle-status-' + txn.description"
                      (click)="toggleSettle(txn)"
                      class="cursor-pointer transition-transform active:scale-95"
                      [title]="txn.status === 'SETTLED' ? 'Reverter para Pendente' : 'Marcar como liquidado'"
                    >
                      <app-transaction-status-badge [status]="txn.status" [type]="txn.type" />
                    </button>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2 font-medium">
                      <span>{{ txn.description }}</span>
                      @if (txn.sourceRecurringTransactionId) {
                        <span
                          class="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-[11px]"
                          title="Originado de recorrência"
                        >
                          ↻
                        </span>
                      }
                      @if (txn.installmentCurrent && txn.installmentTotal) {
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] tabular-nums">
                          {{ txn.installmentCurrent }}/{{ txn.installmentTotal }}
                        </span>
                      }
                      @if (txn.status === 'ESTIMATED') {
                        <button
                          type="button"
                          [attr.data-testid]="'confirm-estimate-btn-' + txn.description"
                          (click)="openConfirmEstimate(txn)"
                          class="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 hover:bg-amber-500/25 text-xs font-medium cursor-pointer"
                        >
                          Confirmar valor
                        </button>
                      }
                    </div>
                    @if (txn.notes) {
                      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-md">{{ txn.notes }}</p>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex flex-wrap items-center gap-1.5 text-xs">
                      @if (txn.categoryName) {
                        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                          <span
                            class="w-2 h-2 rounded-full"
                            [style.background-color]="txn.categoryColor || '#64748B'"
                          ></span>
                          {{ txn.categoryName }}
                        </span>
                      } @else {
                        <span class="text-slate-400">Sem categoria</span>
                      }
                      @if (txn.beneficiaryName) {
                        <span class="text-slate-400">•</span>
                        <span class="text-slate-600 dark:text-slate-300">{{ txn.beneficiaryName }}</span>
                      }
                    </div>
                  </td>
                  <td class="px-4 py-3 text-slate-600 dark:text-slate-300 tabular-nums whitespace-nowrap">
                    {{ txn.dueDate ? (txn.dueDate | date: 'dd/MM/yyyy') : '—' }}
                  </td>
                  <td
                    class="px-4 py-3 text-right font-semibold tabular-nums whitespace-nowrap"
                    [class]="txn.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'"
                  >
                    {{ txn.type === 'INCOME' ? '+ ' : '' }}{{ txn.amount | brlCurrency }}
                  </td>
                  <td class="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      (click)="openEditDrawer(txn)"
                      class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      aria-label="Editar lançamento"
                    >
                      <i class="pi pi-pencil text-xs"></i>
                    </button>
                    <button
                      type="button"
                      (click)="confirmDeleteTransaction(txn)"
                      class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      aria-label="Excluir lançamento"
                    >
                      <i class="pi pi-trash text-xs"></i>
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
            <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 font-semibold text-sm">
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
                  [class]="txn.type === 'INCOME' ? 'text-emerald-600 dark:text-emerald-400' : ''"
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
                  >
                    <app-transaction-status-badge [status]="txn.status" [type]="txn.type" />
                  </button>
                  @if (txn.status === 'ESTIMATED') {
                    <button
                      type="button"
                      (click)="openConfirmEstimate(txn)"
                      class="px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs font-medium"
                    >
                      Confirmar
                    </button>
                  }
                </div>

                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    (click)="openEditDrawer(txn)"
                    class="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Editar lançamento"
                  >
                    <i class="pi pi-pencil text-xs"></i>
                  </button>
                  <button
                    type="button"
                    (click)="confirmDeleteTransaction(txn)"
                    class="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    aria-label="Excluir lançamento"
                  >
                    <i class="pi pi-trash text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Charts -->
      @if (detail(); as d) {
        <app-budget-charts
          [byCategory]="d.expensesByCategory"
          [byBeneficiary]="d.expensesByBeneficiary"
        />
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
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

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

  setTypeTab(type: TransactionType | null): void {
    void this.store.updateFilters(this.id(), { type });
  }

  onFilterChange(partial: Partial<{ status: TransactionStatus | null; categoryId: string | null; beneficiaryId: string | null; search: string }>): void {
    void this.store.updateFilters(this.id(), partial);
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
      this.messageService.add({ severity: 'success', summary: 'Lançamento atualizado' });
    } else {
      await this.store.createTransaction(this.id(), payload);
      this.messageService.add({ severity: 'success', summary: 'Lançamento criado' });
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
    this.messageService.add({ severity: 'success', summary: 'Valor confirmado' });
  }

  confirmDeleteTransaction(txn: Transaction): void {
    const extra = txn.sourceRecurringTransactionId
      ? ' Como este lançamento veio de uma recorrência, ele não será recriado automaticamente neste mês.'
      : '';
    this.confirmationService.confirm({
      header: 'Excluir Lançamento',
      message: `Deseja excluir "${txn.description}"?${extra}`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        void this.store.deleteTransaction(this.id(), txn.id).then(() => {
          this.messageService.add({ severity: 'success', summary: 'Lançamento excluído' });
        });
      },
    });
  }
}
