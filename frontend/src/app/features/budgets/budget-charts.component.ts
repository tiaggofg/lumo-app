import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
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
} from 'chart.js';
import { BreakdownItem } from '../../core/models/api.models';
import { ThemeService } from '../../core/services/theme.service';

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

const FALLBACK_COLORS = [
  '#4F46E5',
  '#0284C7',
  '#E11D48',
  '#D97706',
  '#7C3AED',
  '#0891B2',
  '#DB2777',
  '#EA580C',
];

@Component({
  selector: 'app-budget-charts',
  standalone: true,
  template: `
    @if (byCategory().length > 0 || byBeneficiary().length > 0) {
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="budget-charts">
        <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <h3 class="text-sm font-semibold mb-4">Despesas por Categoria</h3>
          <div class="relative h-64">
            <canvas #categoryCanvas data-testid="chart-category"></canvas>
          </div>
        </div>

        <div class="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5">
          <h3 class="text-sm font-semibold mb-4">Despesas por Beneficiário</h3>
          <div class="relative h-64">
            <canvas #beneficiaryCanvas data-testid="chart-beneficiary"></canvas>
          </div>
        </div>
      </div>
    }
  `,
})
export class BudgetChartsComponent implements AfterViewInit, OnDestroy {
  private readonly themeService = inject(ThemeService);

  readonly byCategory = input<BreakdownItem[]>([]);
  readonly byBeneficiary = input<BreakdownItem[]>([]);

  private readonly categoryCanvas = viewChild<ElementRef<HTMLCanvasElement>>('categoryCanvas');
  private readonly beneficiaryCanvas = viewChild<ElementRef<HTMLCanvasElement>>('beneficiaryCanvas');

  private categoryChart: Chart | null = null;
  private beneficiaryChart: Chart | null = null;
  private viewReady = false;

  constructor() {
    effect(() => {
      const categories = this.byCategory();
      const beneficiaries = this.byBeneficiary();
      const isDark = this.themeService.isDark();
      if (this.viewReady) {
        queueMicrotask(() => this.renderCharts(categories, beneficiaries, isDark));
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderCharts(this.byCategory(), this.byBeneficiary(), this.themeService.isDark());
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private renderCharts(
    categories: BreakdownItem[],
    beneficiaries: BreakdownItem[],
    isDark: boolean
  ): void {
    this.destroyCharts();
    const textColor = isDark ? '#CBD5E1' : '#475569';
    const gridColor = isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(148, 163, 184, 0.2)';

    const catEl = this.categoryCanvas()?.nativeElement;
    if (catEl && categories.length > 0) {
      this.categoryChart = new Chart(catEl, {
        type: 'doughnut',
        data: {
          labels: categories.map((c) => c.name),
          datasets: [
            {
              data: categories.map((c) => c.plannedAmount),
              backgroundColor: categories.map(
                (c, i) => c.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length]
              ),
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { color: textColor, boxWidth: 12, padding: 12 },
            },
          },
        },
      });
    }

    const benEl = this.beneficiaryCanvas()?.nativeElement;
    if (benEl && beneficiaries.length > 0) {
      this.beneficiaryChart = new Chart(benEl, {
        type: 'bar',
        data: {
          labels: beneficiaries.map((b) => b.name),
          datasets: [
            {
              label: 'Previsto (R$)',
              data: beneficiaries.map((b) => b.plannedAmount),
              backgroundColor: '#4F46E5',
              borderRadius: 6,
            },
            {
              label: 'Realizado (R$)',
              data: beneficiaries.map((b) => b.realizedAmount),
              backgroundColor: '#0284C7',
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: {
              labels: { color: textColor, boxWidth: 12 },
            },
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
  }

  private destroyCharts(): void {
    this.categoryChart?.destroy();
    this.categoryChart = null;
    this.beneficiaryChart?.destroy();
    this.beneficiaryChart = null;
  }
}
