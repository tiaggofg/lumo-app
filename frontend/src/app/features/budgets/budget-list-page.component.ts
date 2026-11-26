import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MonthlyBudgetListItem } from '../../core/models/api.models';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';
import { CompetenceMonthPipe } from '../../shared/pipes/competence-month.pipe';
import { BudgetsStoreService } from './budgets-store.service';

@Component({
  selector: 'app-budget-list-page',
  standalone: true,
  imports: [FormsModule, ButtonModule, DialogModule, InputTextModule, BrlCurrencyPipe, CompetenceMonthPipe],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">Orçamentos Mensais</h1>
          <p class="text-[15px] text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe receitas, despesas e saldo previsto vs. realizado de cada mês.
          </p>
        </div>

        <p-button
          label="Novo Orçamento"
          icon="pi pi-plus"
          data-testid="new-budget-btn"
          (onClick)="openCreateDialog()"
        />
      </div>

      @if (store.loadingList() && store.budgets().length === 0) {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          @for (n of [1, 2, 3, 4]; track n) {
            <div class="h-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"></div>
          }
        </div>
      } @else if (store.budgets().length === 0) {
        <div
          data-testid="budgets-empty-state"
          class="rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center space-y-4"
        >
          <div class="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <i class="pi pi-calendar-plus text-2xl"></i>
          </div>
          <div class="space-y-1.5">
            <h2 class="text-xl font-bold">Nenhum orçamento mensal criado</h2>
            <p class="text-[15px] text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Crie o orçamento do mês atual para começar a controlar receitas, despesas e recorrências automaticamente.
            </p>
          </div>
          <p-button
            label="Criar primeiro orçamento"
            icon="pi pi-plus"
            data-testid="empty-create-budget-btn"
            (onClick)="openCreateDialog()"
          />
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          @for (budget of store.budgets(); track budget.id) {
            <div
              [attr.data-testid]="'budget-card-' + budget.competenceMonth"
              (click)="openBudget(budget.id)"
              class="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 p-6 shadow-xs transition-all cursor-pointer space-y-5"
            >
              <div class="flex items-start justify-between gap-2">
                <div>
                  <h2 class="text-xl font-bold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {{ budget.competenceMonth | competenceMonth }}
                  </h2>
                  <p class="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {{ budget.transactionCount }} {{ budget.transactionCount === 1 ? 'lançamento' : 'lançamentos' }}
                  </p>
                </div>

                <button
                  type="button"
                  (click)="confirmDelete($event, budget)"
                  class="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Excluir orçamento"
                  aria-label="Excluir orçamento"
                >
                  <i class="pi pi-trash text-sm"></i>
                </button>
              </div>

              <div class="space-y-2.5 text-[15px]">
                <div class="flex justify-between items-center">
                  <span class="text-slate-500 dark:text-slate-400">Receitas (Prev.)</span>
                  <span class="font-semibold text-sky-600 dark:text-sky-400 tabular-nums">
                    {{ budget.summary.plannedIncome | brlCurrency }}
                  </span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-slate-500 dark:text-slate-400">Despesas (Prev.)</span>
                  <span class="font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                    {{ budget.summary.plannedExpense | brlCurrency }}
                  </span>
                </div>
                <div class="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <span class="font-semibold">Saldo Previsto</span>
                  <span
                    class="font-bold text-lg tabular-nums"
                    [class]="budget.summary.plannedBalance >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'"
                  >
                    {{ budget.summary.plannedBalance | brlCurrency }}
                  </span>
                </div>
                <div class="flex justify-between items-center text-sm">
                  <span class="text-slate-500 dark:text-slate-400">Saldo Realizado</span>
                  <span class="font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                    {{ budget.summary.realizedBalance | brlCurrency }}
                  </span>
                </div>
              </div>

              <!-- Expense payment progress -->
              <div class="space-y-1.5">
                <div class="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span>Despesas pagas</span>
                  <span class="tabular-nums font-semibold">{{ expenseProgress(budget) }}%</span>
                </div>
                <div class="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    class="h-full rounded-full bg-sky-500 transition-all"
                    [style.width.%]="expenseProgress(budget)"
                  ></div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <p-dialog
      header="Novo Orçamento Mensal"
      [(visible)]="createDialogVisible"
      [modal]="true"
      [style]="{ width: '24rem', maxWidth: '95vw' }"
    >
      <div class="space-y-3 pt-2">
        <div class="flex flex-col gap-1.5">
          <label for="competence-month" class="text-sm font-medium">Competência (Mês/Ano)</label>
          <input
            id="competence-month"
            data-testid="competence-month-input"
            type="month"
            [(ngModel)]="newCompetenceMonth"
            class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          />
          <p class="text-xs text-slate-500 dark:text-slate-400">
            Todas as recorrências ativas elegíveis para este mês serão materializadas automaticamente.
          </p>
        </div>
      </div>

      <ng-template #footer>
        <div class="flex justify-end gap-2">
          <p-button label="Cancelar" severity="secondary" [text]="true" (onClick)="createDialogVisible = false" />
          <p-button
            label="Criar Orçamento"
            data-testid="confirm-create-budget-btn"
            [loading]="creating()"
            [disabled]="!isValidCompetenceMonth()"
            (onClick)="createBudget()"
          />
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class BudgetListPageComponent implements OnInit {
  readonly store = inject(BudgetsStoreService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly creating = signal(false);
  createDialogVisible = false;
  newCompetenceMonth = this.currentYearMonth();

  ngOnInit(): void {
    void this.store.loadBudgets();
  }

  openCreateDialog(): void {
    this.newCompetenceMonth = this.currentYearMonth();
    this.createDialogVisible = true;
  }

  isValidCompetenceMonth(): boolean {
    return /^\d{4}-(0[1-9]|1[0-2])$/.test(this.newCompetenceMonth);
  }

  async createBudget(): Promise<void> {
    if (!this.isValidCompetenceMonth()) return;
    this.creating.set(true);
    try {
      const created = await this.store.createBudget(this.newCompetenceMonth);
      this.createDialogVisible = false;
      const msg =
        created.materializedCount > 0
          ? `Orçamento criado com ${created.materializedCount} recorrência(s) materializada(s).`
          : 'Orçamento mensal criado com sucesso.';
      this.messageService.add({ severity: 'success', summary: 'Orçamento criado', detail: msg });
      await this.router.navigate(['/budgets', created.id]);
    } finally {
      this.creating.set(false);
    }
  }

  openBudget(id: string): void {
    void this.router.navigate(['/budgets', id]);
  }

  confirmDelete(event: Event, budget: MonthlyBudgetListItem): void {
    event.stopPropagation();
    this.confirmationService.confirm({
      header: 'Excluir Orçamento',
      message: `Deseja excluir o orçamento de ${budget.competenceMonth}? (Orçamentos com lançamentos não podem ser excluídos.)`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        void this.store.deleteBudget(budget.id).then(() => {
          this.messageService.add({ severity: 'success', summary: 'Orçamento excluído' });
        });
      },
    });
  }

  expenseProgress(budget: MonthlyBudgetListItem): number {
    const planned = budget.summary.plannedExpense;
    if (!planned || planned <= 0) return 0;
    return Math.min(100, Math.round((budget.summary.realizedExpense / planned) * 100));
  }

  private currentYearMonth(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  }
}
