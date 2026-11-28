import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  ArcElement,
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  DoughnutController,
  Legend,
  LinearScale,
  Tooltip,
  TooltipItem,
} from 'chart.js';
import { BreakdownItem, MonthlyBudgetDetail, MonthlyBudgetListItem } from '../../core/models/api.models';
import { ThemeService } from '../../core/services/theme.service';
import { BrlCurrencyPipe } from '../../shared/pipes/brl-currency.pipe';
import { CompetenceMonthPipe } from '../../shared/pipes/competence-month.pipe';
import {
  ZChartContainerComponent,
  ZChartLegendItem,
  ZSelectComponent,
} from '../../shared/ui';
import { LUMO_CHART_PALETTE, resolveChartColors } from '../../shared/utils/chart-palette';
import { BudgetsStoreService } from '../budgets/budgets-store.service';

Chart.register(
  DoughnutController,
  BarController,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export interface DashboardBreakdownEntry extends BreakdownItem {
  resolvedColor: string;
  sharePercent: number;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    ZSelectComponent,
    ZChartContainerComponent,
    BrlCurrencyPipe,
    CompetenceMonthPipe,
  ],
  template: `
    <div class="space-y-8" data-testid="dashboard-page">
      <!-- Page Header & Competence Controls -->
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            Visão Analítica &amp; Performance Financeira
          </p>
          <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5" data-testid="dashboard-title">
            @if (detail(); as d) {
              Dashboard — {{ d.competenceMonth | competenceMonth }}
            } @else {
              Dashboard Financeiro
            }
          </h1>
        </div>

        @if (store.budgets().length > 0) {
          <div class="flex flex-wrap items-center gap-3">
            <div class="min-w-52" data-testid="dashboard-month-selector">
              <z-select
                [ngModel]="selectedBudgetId()"
                (ngModelChange)="onBudgetChange($event)"
                [options]="budgetOptions()"
                optionLabel="label"
                optionValue="id"
                placeholder="Selecionar mês"
                [searchable]="true"
                searchPlaceholder="Buscar mês..."
                styleClass="w-full"
              />
            </div>

            @if (detail(); as d) {
              <a
                [routerLink]="['/budgets', d.id]"
                data-testid="dashboard-open-budget-btn"
                class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[15px] shadow-xs transition-colors"
              >
                <i class="pi pi-list text-sm" aria-hidden="true"></i>
                <span>Ver lançamentos do mês</span>
              </a>
            }

            <a
              routerLink="/budgets"
              data-testid="dashboard-manage-budgets-link"
              class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-[15px] shadow-2xs transition-colors"
            >
              <i class="pi pi-wallet text-sm" aria-hidden="true"></i>
              <span>Gerenciar Orçamentos</span>
            </a>
          </div>
        }
      </div>

      <!-- Empty State -->
      @if (!store.loadingList() && store.budgets().length === 0) {
        <div
          data-testid="dashboard-empty-state"
          class="rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center space-y-5 shadow-sm"
        >
          <div class="w-16 h-16 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <i class="pi pi-chart-pie text-3xl" aria-hidden="true"></i>
          </div>
          <div class="space-y-1.5">
            <h2 class="text-xl font-bold">Nenhum Orçamento Mensal cadastrado</h2>
            <p class="text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              Crie seu primeiro orçamento mensal para visualizar indicadores executivos, distribuição de despesas por categoria e evolução mensal.
            </p>
          </div>
          <div>
            <a
              routerLink="/budgets"
              data-testid="dashboard-empty-create-btn"
              class="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base shadow-xs transition-colors"
            >
              <i class="pi pi-plus" aria-hidden="true"></i>
              <span>Criar Primeiro Orçamento</span>
            </a>
          </div>
        </div>
      } @else if (detail(); as d) {
        <!-- Executive KPI Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch" data-testid="dashboard-kpi-cards">
          <!-- Receitas -->
          <div class="h-full flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 space-y-3 shadow-sm">
            <div class="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>Receitas do Mês</span>
              <span class="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <i class="pi pi-arrow-down-left text-sm" aria-hidden="true"></i>
              </span>
            </div>
            <div class="text-3xl font-extrabold text-sky-600 dark:text-sky-400 tabular-nums" data-testid="kpi-planned-income">
              {{ d.summary.plannedIncome | brlCurrency }}
            </div>
            <div class="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Realizado (Recebido)</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200 tabular-nums" data-testid="kpi-realized-income">
                {{ d.summary.realizedIncome | brlCurrency }}
              </span>
            </div>
          </div>

          <!-- Despesas -->
          <div class="h-full flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 space-y-3 shadow-sm">
            <div class="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>Despesas do Mês</span>
              <span class="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <i class="pi pi-arrow-up-right text-sm" aria-hidden="true"></i>
              </span>
            </div>
            <div class="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tabular-nums" data-testid="kpi-planned-expense">
              {{ d.summary.plannedExpense | brlCurrency }}
            </div>
            <div class="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Realizado (Pago)</span>
              <span class="font-semibold text-slate-800 dark:text-slate-200 tabular-nums" data-testid="kpi-realized-expense">
                {{ d.summary.realizedExpense | brlCurrency }}
              </span>
            </div>
          </div>

          <!-- Saldo do Mês -->
          <div class="h-full flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 space-y-3 shadow-sm">
            <div class="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>Saldo Previsto</span>
              <span class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <i class="pi pi-chart-line text-sm" aria-hidden="true"></i>
              </span>
            </div>
            <div
              class="text-3xl font-extrabold tabular-nums"
              [class]="d.summary.plannedBalance >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'"
              data-testid="kpi-planned-balance"
            >
              {{ d.summary.plannedBalance | brlCurrency }}
            </div>
            <div class="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <span>Saldo Realizado</span>
              <span
                class="font-semibold tabular-nums"
                [class]="d.summary.realizedBalance >= 0 ? 'text-sky-600 dark:text-sky-400' : 'text-rose-600 dark:text-rose-400'"
                data-testid="kpi-realized-balance"
              >
                {{ d.summary.realizedBalance | brlCurrency }}
              </span>
            </div>
          </div>

          <!-- Progresso de Quitação -->
          <div class="h-full flex flex-col justify-between rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 space-y-3 shadow-sm">
            <div class="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <span>Progresso de Quitação</span>
              <span class="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                <i class="pi pi-check-circle text-sm" aria-hidden="true"></i>
              </span>
            </div>
            <div class="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums" data-testid="kpi-settlement-percent">
              {{ expensePaidPercent() }}%
            </div>
            <div class="space-y-1.5 pt-1">
              <div class="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  class="h-full rounded-full bg-sky-500 transition-all"
                  [style.width.%]="expensePaidPercent()"
                ></div>
              </div>
              <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                <span>{{ d.statusCounts.settled }} liquidado(s)</span>
                <span>{{ d.statusCounts.pending + d.statusCounts.estimated }} em aberto</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4 Multi-Color ZardUI / shadcn Chart Panels -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch" data-testid="dashboard-charts-grid">
          <!-- Panel 1: Despesas por Categoria -->
          <z-chart-container
            title="Despesas por Categoria"
            description="Distribuição prevista e participação percentual no mês"
            [badgeText]="categoryBreakdown().length + ' categoria(s)'"
            badgeVariant="default"
            [legendItems]="categoryLegendItems()"
            (legendToggle)="toggleCategorySlice($event)"
          >
            @if (categoryBreakdown().length === 0) {
              <div
                data-testid="empty-chart-category"
                class="h-64 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-sm p-6 text-center"
              >
                <i class="pi pi-chart-pie text-2xl mb-2 text-indigo-500" aria-hidden="true"></i>
                <span>Nenhuma despesa registrada neste mês para exibir por categoria.</span>
              </div>
            } @else {
              <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div class="md:col-span-6 relative h-64 flex items-center justify-center">
                  <canvas #categoryCanvas data-testid="chart-category"></canvas>
                  <div
                    class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6"
                    data-testid="chart-category-center"
                  >
                    <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Total Previsto
                    </span>
                    <span class="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums mt-0.5">
                      {{ d.summary.plannedExpense | brlCurrency }}
                    </span>
                  </div>
                </div>
                <div class="md:col-span-6 space-y-2.5 max-h-64 overflow-y-auto pr-1" data-testid="category-breakdown-list">
                  @for (cat of categoryBreakdown(); track cat.name) {
                    <div
                      (click)="toggleCategorySlice(cat.name)"
                      [class.opacity-45]="hiddenCategories().has(cat.name)"
                      class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm cursor-pointer transition-all"
                    >
                      <div class="flex items-center gap-2.5 min-w-0">
                        <span
                          class="w-3.5 h-3.5 rounded-full shrink-0"
                          [style.background-color]="cat.resolvedColor"
                        ></span>
                        <span class="font-semibold truncate">{{ cat.name }}</span>
                      </div>
                      <div class="flex items-center gap-2.5 shrink-0 tabular-nums">
                        <span class="font-bold text-slate-800 dark:text-slate-100">
                          {{ cat.plannedAmount | brlCurrency }}
                        </span>
                        <span class="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                          {{ cat.sharePercent }}%
                        </span>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </z-chart-container>

          <!-- Panel 2: Despesas por Beneficiário -->
          <z-chart-container
            title="Despesas por Beneficiário"
            description="Comparativo multicolorido por centro de custo / beneficiário"
            [badgeText]="beneficiaryBreakdown().length + ' beneficiário(s)'"
            badgeVariant="sky"
            [legendItems]="beneficiaryLegendItems()"
            (legendToggle)="toggleBeneficiarySeries($event)"
          >
            @if (beneficiaryBreakdown().length === 0) {
              <div
                data-testid="empty-chart-beneficiary"
                class="h-64 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 text-sm p-6 text-center"
              >
                <i class="pi pi-users text-2xl mb-2 text-sky-500" aria-hidden="true"></i>
                <span>Nenhuma despesa registrada neste mês para exibir por beneficiário.</span>
              </div>
            } @else {
              <div class="space-y-4">
                <div class="relative h-56">
                  <canvas #beneficiaryCanvas data-testid="chart-beneficiary"></canvas>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5" data-testid="beneficiary-breakdown-list">
                  @for (ben of beneficiaryBreakdown(); track ben.name) {
                    <div class="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/50 text-sm">
                      <div class="flex items-center gap-2 min-w-0">
                        <span
                          class="w-3 h-3 rounded-sm shrink-0"
                          [style.background-color]="ben.resolvedColor"
                        ></span>
                        <span class="font-semibold truncate">{{ ben.name }}</span>
                      </div>
                      <div class="text-right tabular-nums shrink-0">
                        <div class="font-bold text-slate-800 dark:text-slate-100">
                          {{ ben.plannedAmount | brlCurrency }}
                        </div>
                        <div class="text-xs text-slate-500 dark:text-slate-400">
                          Pago: {{ ben.realizedAmount | brlCurrency }} ({{ ben.sharePercent }}%)
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </z-chart-container>

          <!-- Panel 3: Status de Liquidação -->
          <z-chart-container
            title="Status de Liquidação"
            description="Composição dos lançamentos entre Liquidado, Pendente e Estimado"
            [badgeText]="totalStatusCount() + ' lançamento(s)'"
            badgeVariant="slate"
            [legendItems]="statusLegendItems()"
            (legendToggle)="toggleStatusSlice($event)"
          >
            <div class="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div class="md:col-span-6 relative h-56 flex items-center justify-center">
                <canvas #statusCanvas data-testid="chart-status"></canvas>
                <div
                  class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-6"
                  data-testid="chart-status-center"
                >
                  <span class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Quitação
                  </span>
                  <span class="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 tabular-nums mt-0.5">
                    {{ expensePaidPercent() }}%
                  </span>
                </div>
              </div>
              <div class="md:col-span-6 space-y-3" data-testid="status-breakdown-list">
                <div class="flex items-center justify-between p-3 rounded-xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/60 dark:border-sky-900/50">
                  <div class="flex items-center gap-2.5">
                    <span class="w-3.5 h-3.5 rounded-full bg-sky-600"></span>
                    <div>
                      <p class="text-sm font-bold text-sky-900 dark:text-sky-200">Liquidado (Pago/Recebido)</p>
                      <p class="text-xs text-sky-700 dark:text-sky-400 tabular-nums">
                        Despesas pagas: {{ d.summary.realizedExpense | brlCurrency }}
                      </p>
                    </div>
                  </div>
                  <span class="text-lg font-extrabold text-sky-700 dark:text-sky-300 tabular-nums">
                    {{ d.statusCounts.settled }}
                  </span>
                </div>

                <div class="flex items-center justify-between p-3 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/50">
                  <div class="flex items-center gap-2.5">
                    <span class="w-3.5 h-3.5 rounded-full bg-indigo-600"></span>
                    <div>
                      <p class="text-sm font-bold text-indigo-900 dark:text-indigo-200">Pendente</p>
                      <p class="text-xs text-indigo-700 dark:text-indigo-400 tabular-nums">
                        Em aberto: {{ openExpenseAmount() | brlCurrency }}
                      </p>
                    </div>
                  </div>
                  <span class="text-lg font-extrabold text-indigo-700 dark:text-indigo-300 tabular-nums">
                    {{ d.statusCounts.pending }}
                  </span>
                </div>

                <div class="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50">
                  <div class="flex items-center gap-2.5">
                    <span class="w-3.5 h-3.5 rounded-full bg-amber-600"></span>
                    <div>
                      <p class="text-sm font-bold text-amber-900 dark:text-amber-200">Estimado</p>
                      <p class="text-xs text-amber-700 dark:text-amber-400">
                        Aguardando confirmação de valor
                      </p>
                    </div>
                  </div>
                  <span class="text-lg font-extrabold text-amber-700 dark:text-amber-300 tabular-nums">
                    {{ d.statusCounts.estimated }}
                  </span>
                </div>
              </div>
            </div>
          </z-chart-container>

          <!-- Panel 4: Evolução Mensal -->
          <z-chart-container
            title="Evolução Mensal"
            description="Comparativo cronológico de Receitas, Despesas e Saldo entre competências"
            [badgeText]="evolutionBudgets().length + ' mês(es)'"
            badgeVariant="default"
            [legendItems]="evolutionLegendItems()"
            (legendToggle)="toggleEvolutionSeries($event)"
          >
            <div class="relative h-64">
              <canvas #evolutionCanvas data-testid="chart-evolution"></canvas>
            </div>
          </z-chart-container>
        </div>
      }
    </div>
  `,
})
export class DashboardPageComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly store = inject(BudgetsStoreService);
  private readonly themeService = inject(ThemeService);
  private readonly route = inject(ActivatedRoute);
  private readonly competenceMonthPipe = new CompetenceMonthPipe();
  private readonly brlCurrencyPipe = new BrlCurrencyPipe();

  readonly selectedBudgetId = signal<string | null>(null);
  readonly detail = this.store.currentDetail;

  readonly hiddenCategories = signal<Set<string>>(new Set());
  readonly hiddenBeneficiarySeries = signal<Set<string>>(new Set());
  readonly hiddenStatusSlices = signal<Set<string>>(new Set());
  readonly hiddenEvolutionSeries = signal<Set<string>>(new Set());

  private readonly categoryCanvas = viewChild<ElementRef<HTMLCanvasElement>>('categoryCanvas');
  private readonly beneficiaryCanvas = viewChild<ElementRef<HTMLCanvasElement>>('beneficiaryCanvas');
  private readonly statusCanvas = viewChild<ElementRef<HTMLCanvasElement>>('statusCanvas');
  private readonly evolutionCanvas = viewChild<ElementRef<HTMLCanvasElement>>('evolutionCanvas');

  private categoryChart: Chart | null = null;
  private beneficiaryChart: Chart | null = null;
  private statusChart: Chart | null = null;
  private evolutionChart: Chart | null = null;
  private viewReady = false;

  readonly budgetOptions = computed(() =>
    this.store.budgets().map((b) => ({
      id: b.id,
      competenceMonth: b.competenceMonth,
      label: this.competenceMonthPipe.transform(b.competenceMonth),
    }))
  );

  readonly evolutionBudgets = computed<MonthlyBudgetListItem[]>(() =>
    [...this.store.budgets()]
      .sort((a, b) => a.competenceMonth.localeCompare(b.competenceMonth))
      .slice(-12)
  );

  readonly expensePaidPercent = computed(() => {
    const d = this.detail();
    if (!d || d.summary.plannedExpense <= 0) return 0;
    return Math.min(100, Math.round((d.summary.realizedExpense / d.summary.plannedExpense) * 100));
  });

  readonly openExpenseAmount = computed(() => {
    const d = this.detail();
    if (!d) return 0;
    return Math.max(0, d.summary.plannedExpense - d.summary.realizedExpense);
  });

  readonly totalStatusCount = computed(() => {
    const d = this.detail();
    if (!d) return 0;
    return d.statusCounts.settled + d.statusCounts.pending + d.statusCounts.estimated;
  });

  readonly categoryBreakdown = computed<DashboardBreakdownEntry[]>(() => {
    const d = this.detail();
    if (!d || d.expensesByCategory.length === 0) return [];
    const items = [...d.expensesByCategory].sort((a, b) => b.plannedAmount - a.plannedAmount);
    const total = items.reduce((acc, item) => acc + item.plannedAmount, 0);
    const resolvedColors = resolveChartColors(items.map((item) => item.color));
    return items.map((item, idx) => ({
      ...item,
      resolvedColor: resolvedColors[idx],
      sharePercent: total > 0 ? Math.round((item.plannedAmount / total) * 100) : 0,
    }));
  });

  readonly beneficiaryBreakdown = computed<DashboardBreakdownEntry[]>(() => {
    const d = this.detail();
    if (!d || d.expensesByBeneficiary.length === 0) return [];
    const items = [...d.expensesByBeneficiary].sort((a, b) => b.plannedAmount - a.plannedAmount);
    const total = items.reduce((acc, item) => acc + item.plannedAmount, 0);
    const resolvedColors = resolveChartColors(
      items.map((item, idx) => item.color ?? LUMO_CHART_PALETTE[idx % LUMO_CHART_PALETTE.length])
    );
    return items.map((item, idx) => ({
      ...item,
      resolvedColor: resolvedColors[idx],
      sharePercent: total > 0 ? Math.round((item.plannedAmount / total) * 100) : 0,
    }));
  });

  readonly categoryLegendItems = computed<ZChartLegendItem[]>(() => {
    const hidden = this.hiddenCategories();
    return this.categoryBreakdown().map((cat) => ({
      key: cat.name,
      label: cat.name,
      color: cat.resolvedColor,
      valueText: `${cat.sharePercent}%`,
      active: !hidden.has(cat.name),
    }));
  });

  readonly beneficiaryLegendItems = computed<ZChartLegendItem[]>(() => {
    const hidden = this.hiddenBeneficiarySeries();
    return [
      {
        key: 'planned',
        label: 'Previsto (R$)',
        color: '#4F46E5',
        active: !hidden.has('planned'),
      },
      {
        key: 'realized',
        label: 'Realizado / Pago (R$)',
        color: '#0284C7',
        active: !hidden.has('realized'),
      },
    ];
  });

  readonly statusLegendItems = computed<ZChartLegendItem[]>(() => {
    const hidden = this.hiddenStatusSlices();
    const d = this.detail();
    return [
      {
        key: 'settled',
        label: 'Liquidado',
        color: '#0284C7',
        valueText: String(d?.statusCounts.settled ?? 0),
        active: !hidden.has('settled'),
      },
      {
        key: 'pending',
        label: 'Pendente',
        color: '#4F46E5',
        valueText: String(d?.statusCounts.pending ?? 0),
        active: !hidden.has('pending'),
      },
      {
        key: 'estimated',
        label: 'Estimado',
        color: '#D97706',
        valueText: String(d?.statusCounts.estimated ?? 0),
        active: !hidden.has('estimated'),
      },
    ];
  });

  readonly evolutionLegendItems = computed<ZChartLegendItem[]>(() => {
    const hidden = this.hiddenEvolutionSeries();
    return [
      {
        key: 'income',
        label: 'Receitas Previstas',
        color: '#0284C7',
        active: !hidden.has('income'),
      },
      {
        key: 'expense',
        label: 'Despesas Previstas',
        color: '#E11D48',
        active: !hidden.has('expense'),
      },
      {
        key: 'balance',
        label: 'Saldo Previsto',
        color: '#4F46E5',
        active: !hidden.has('balance'),
      },
    ];
  });

  constructor() {
    effect(() => {
      const detail = this.detail();
      const categories = this.categoryBreakdown();
      const beneficiaries = this.beneficiaryBreakdown();
      const evolution = this.evolutionBudgets();
      const isDark = this.themeService.isDark();
      this.hiddenCategories();
      this.hiddenBeneficiarySeries();
      this.hiddenStatusSlices();
      this.hiddenEvolutionSeries();

      if (this.viewReady && detail) {
        queueMicrotask(() =>
          this.renderCharts(detail, categories, beneficiaries, evolution, isDark)
        );
      }
    });
  }

  ngOnInit(): void {
    void this.initializeDashboard();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    const d = this.detail();
    if (d) {
      this.renderCharts(
        d,
        this.categoryBreakdown(),
        this.beneficiaryBreakdown(),
        this.evolutionBudgets(),
        this.themeService.isDark()
      );
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  async onBudgetChange(budgetId: unknown): Promise<void> {
    if (typeof budgetId !== 'string' || !budgetId) return;
    this.selectedBudgetId.set(budgetId);
    await this.store.loadBudgetDetail(budgetId);
  }

  toggleCategorySlice(name: string): void {
    this.hiddenCategories.update((set) => {
      const next = new Set(set);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  }

  toggleBeneficiarySeries(key: string): void {
    this.hiddenBeneficiarySeries.update((set) => {
      const next = new Set(set);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  toggleStatusSlice(key: string): void {
    this.hiddenStatusSlices.update((set) => {
      const next = new Set(set);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  toggleEvolutionSeries(key: string): void {
    this.hiddenEvolutionSeries.update((set) => {
      const next = new Set(set);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }

  private async initializeDashboard(): Promise<void> {
    await this.store.loadBudgets();
    const budgets = this.store.budgets();
    if (budgets.length === 0) {
      this.selectedBudgetId.set(null);
      return;
    }

    const queryBudgetId = this.route.snapshot?.queryParamMap?.get('budgetId');
    const queryMonth = this.route.snapshot?.queryParamMap?.get('month');

    const matched =
      (queryBudgetId ? budgets.find((b) => b.id === queryBudgetId) : undefined) ??
      (queryMonth ? budgets.find((b) => b.competenceMonth === queryMonth) : undefined) ??
      budgets[0];

    this.selectedBudgetId.set(matched.id);
    await this.store.loadBudgetDetail(matched.id);
  }

  private buildShadcnTooltip(isDark: boolean, isCurrency = true) {
    return {
      backgroundColor: isDark ? '#020617' : '#0F172A',
      titleColor: '#F8FAFC',
      bodyColor: '#E2E8F0',
      borderColor: '#334155',
      borderWidth: 1,
      cornerRadius: 10,
      padding: 12,
      boxPadding: 6,
      usePointStyle: true,
      callbacks: {
        label: (ctx: TooltipItem<'doughnut' | 'bar'>) => {
          const rawVal = Number(ctx.raw ?? 0);
          const formatted = isCurrency
            ? this.brlCurrencyPipe.transform(rawVal)
            : `${rawVal} lançamento(s)`;
          return ` ${ctx.label || ctx.dataset.label}: ${formatted}`;
        },
      },
    };
  }

  private renderCharts(
    detail: MonthlyBudgetDetail,
    categories: DashboardBreakdownEntry[],
    beneficiaries: DashboardBreakdownEntry[],
    evolution: MonthlyBudgetListItem[],
    isDark: boolean
  ): void {
    this.destroyCharts();
    const textColor = isDark ? '#CBD5E1' : '#334155';
    const gridColor = isDark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.22)';

    try {
      const catEl = this.categoryCanvas()?.nativeElement;
      if (catEl && categories.length > 0) {
        const hiddenCats = this.hiddenCategories();
        const visibleCats = categories.filter((c) => !hiddenCats.has(c.name));
        const activeCats = visibleCats.length > 0 ? visibleCats : categories;

        this.categoryChart = new Chart(catEl, {
          type: 'doughnut',
          data: {
            labels: activeCats.map((c) => c.name),
            datasets: [
              {
                label: 'Previsto (R$)',
                data: activeCats.map((c) => c.plannedAmount),
                backgroundColor: activeCats.map((c) => c.resolvedColor),
                borderWidth: 2,
                borderRadius: 6,
                spacing: 2,
                borderColor: isDark ? '#0F172A' : '#FFFFFF',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
              legend: { display: false },
              tooltip: this.buildShadcnTooltip(isDark, true),
            },
          },
        });
      }

      const benEl = this.beneficiaryCanvas()?.nativeElement;
      if (benEl && beneficiaries.length > 0) {
        const hiddenBen = this.hiddenBeneficiarySeries();
        this.beneficiaryChart = new Chart(benEl, {
          type: 'bar',
          data: {
            labels: beneficiaries.map((b) => b.name),
            datasets: [
              {
                label: 'Previsto (R$)',
                data: beneficiaries.map((b) => b.plannedAmount),
                backgroundColor: beneficiaries.map((b) => b.resolvedColor),
                borderRadius: 6,
                hidden: hiddenBen.has('planned'),
              },
              {
                label: 'Realizado / Pago (R$)',
                data: beneficiaries.map((b) => b.realizedAmount),
                backgroundColor: '#0284C7',
                borderRadius: 6,
                hidden: hiddenBen.has('realized'),
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
              legend: { display: false },
              tooltip: this.buildShadcnTooltip(isDark, true),
            },
            scales: {
              x: {
                ticks: { color: textColor },
                grid: { color: gridColor },
              },
              y: {
                ticks: { color: textColor },
                grid: { display: false },
              },
            },
          },
        });
      }

      const statusEl = this.statusCanvas()?.nativeElement;
      if (statusEl) {
        const counts = detail.statusCounts;
        const hiddenStatus = this.hiddenStatusSlices();
        const rawSlices = [
          { key: 'settled', label: 'Liquidado (Pago/Recebido)', count: counts.settled, color: '#0284C7' },
          { key: 'pending', label: 'Pendente', count: counts.pending, color: '#4F46E5' },
          { key: 'estimated', label: 'Estimado', count: counts.estimated, color: '#D97706' },
        ];
        const visibleSlices = rawSlices.filter((s) => !hiddenStatus.has(s.key));
        const activeSlices = visibleSlices.length > 0 ? visibleSlices : rawSlices;
        const total = activeSlices.reduce((acc, s) => acc + s.count, 0);

        this.statusChart = new Chart(statusEl, {
          type: 'doughnut',
          data: {
            labels: activeSlices.map((s) => s.label),
            datasets: [
              {
                data: total > 0 ? activeSlices.map((s) => s.count) : [1, 0, 0],
                backgroundColor: activeSlices.map((s) => s.color),
                borderWidth: 2,
                borderRadius: 6,
                spacing: 2,
                borderColor: isDark ? '#0F172A' : '#FFFFFF',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
              legend: { display: false },
              tooltip: this.buildShadcnTooltip(isDark, false),
            },
          },
        });
      }

      const evoEl = this.evolutionCanvas()?.nativeElement;
      if (evoEl && evolution.length > 0) {
        const hiddenEvo = this.hiddenEvolutionSeries();
        this.evolutionChart = new Chart(evoEl, {
          type: 'bar',
          data: {
            labels: evolution.map((b) => this.competenceMonthPipe.transform(b.competenceMonth)),
            datasets: [
              {
                label: 'Receitas Previstas (R$)',
                data: evolution.map((b) => b.summary.plannedIncome),
                backgroundColor: '#0284C7',
                borderRadius: 6,
                hidden: hiddenEvo.has('income'),
              },
              {
                label: 'Despesas Previstas (R$)',
                data: evolution.map((b) => b.summary.plannedExpense),
                backgroundColor: '#E11D48',
                borderRadius: 6,
                hidden: hiddenEvo.has('expense'),
              },
              {
                label: 'Saldo Previsto (R$)',
                data: evolution.map((b) => b.summary.plannedBalance),
                backgroundColor: '#4F46E5',
                borderRadius: 6,
                hidden: hiddenEvo.has('balance'),
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: this.buildShadcnTooltip(isDark, true),
            },
            scales: {
              x: {
                ticks: { color: textColor },
                grid: { display: false },
              },
              y: {
                ticks: { color: textColor },
                grid: { color: gridColor },
              },
            },
          },
        });
      }
    } catch {
      // Canvas rendering fallback in headless unit test environments
    }
  }

  private destroyCharts(): void {
    this.categoryChart?.destroy();
    this.categoryChart = null;
    this.beneficiaryChart?.destroy();
    this.beneficiaryChart = null;
    this.statusChart?.destroy();
    this.statusChart = null;
    this.evolutionChart?.destroy();
    this.evolutionChart = null;
  }
}
