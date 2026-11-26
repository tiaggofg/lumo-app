import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MonthlyBudgetDetail, MonthlyBudgetListItem } from '../../core/models/api.models';
import { BudgetsStoreService } from '../budgets/budgets-store.service';
import { DashboardPageComponent } from './dashboard-page.component';

describe('DashboardPageComponent', () => {
  let fixture: import('@angular/core/testing').ComponentFixture<DashboardPageComponent>;
  let component: DashboardPageComponent;
  let store: BudgetsStoreService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      save: vi.fn(),
      restore: vi.fn(),
      scale: vi.fn(),
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      measureText: vi.fn(() => ({ width: 20 })),
      fillText: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      setTransform: vi.fn(),
      resetTransform: vi.fn(),
      rect: vi.fn(),
      clip: vi.fn(),
      quadraticCurveTo: vi.fn(),
      createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    } as unknown as CanvasRenderingContext2D);

    TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });

    fixture = TestBed.createComponent(DashboardPageComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(BudgetsStoreService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should render guided empty state when no monthly budget exists', async () => {
    vi.spyOn(store, 'loadBudgets').mockImplementation(async () => {
      store.budgets.set([]);
    });

    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    const emptyEl: HTMLElement | null = fixture.nativeElement.querySelector(
      '[data-testid="dashboard-empty-state"]'
    );
    expect(emptyEl).toBeTruthy();
    expect(emptyEl?.textContent).toContain('Orçamento');
  });

  it('should select latest budget, render executive KPIs, category % share, and sort evolution chronologically', async () => {
    const budgetsList: MonthlyBudgetListItem[] = [
      {
        id: 'b-dec',
        competenceMonth: '2026-12',
        transactionCount: 4,
        summary: {
          plannedIncome: 10000,
          realizedIncome: 8000,
          plannedExpense: 6000,
          realizedExpense: 3000,
          plannedBalance: 4000,
          realizedBalance: 5000,
        },
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'b-oct',
        competenceMonth: '2026-10',
        transactionCount: 2,
        summary: {
          plannedIncome: 8000,
          realizedIncome: 8000,
          plannedExpense: 5000,
          realizedExpense: 5000,
          plannedBalance: 3000,
          realizedBalance: 3000,
        },
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 'b-nov',
        competenceMonth: '2026-11',
        transactionCount: 3,
        summary: {
          plannedIncome: 9000,
          realizedIncome: 9000,
          plannedExpense: 5500,
          realizedExpense: 4000,
          plannedBalance: 3500,
          realizedBalance: 5000,
        },
        createdAt: '',
        updatedAt: '',
      },
    ];

    const decDetail: MonthlyBudgetDetail = {
      id: 'b-dec',
      competenceMonth: '2026-12',
      summary: budgetsList[0].summary,
      statusCounts: {
        settled: 2,
        pending: 1,
        estimated: 1,
      },
      expensesByCategory: [
        {
          id: 'cat-1',
          name: 'Moradia',
          color: '#10B981', // legacy green should be replaced by non-green palette
          plannedAmount: 4500,
          realizedAmount: 3000,
          count: 2,
        },
        {
          id: 'cat-2',
          name: 'Alimentação',
          color: '#10B981',
          plannedAmount: 1500,
          realizedAmount: 0,
          count: 1,
        },
      ],
      expensesByBeneficiary: [
        {
          id: 'ben-1',
          name: 'Família',
          color: null,
          plannedAmount: 4500,
          realizedAmount: 3000,
          count: 2,
        },
        {
          id: 'ben-2',
          name: 'Pessoal',
          color: null,
          plannedAmount: 1500,
          realizedAmount: 0,
          count: 1,
        },
      ],
      createdAt: '',
      updatedAt: '',
    };

    vi.spyOn(store, 'loadBudgets').mockImplementation(async () => {
      store.budgets.set(budgetsList);
    });
    const loadDetailSpy = vi.spyOn(store, 'loadBudgetDetail').mockImplementation(async () => {
      store.currentDetail.set(decDetail);
    });

    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    expect(component.selectedBudgetId()).toBe('b-dec');
    expect(loadDetailSpy).toHaveBeenCalledWith('b-dec');

    // Chronological evolution sorting (competenceMonth ASC)
    const evolutionMonths = component.evolutionBudgets().map((b) => b.competenceMonth);
    expect(evolutionMonths).toEqual(['2026-10', '2026-11', '2026-12']);

    // Category breakdown with non-green colors and percentage share
    const catBreakdown = component.categoryBreakdown();
    expect(catBreakdown).toHaveLength(2);
    expect(catBreakdown[0].name).toBe('Moradia');
    expect(catBreakdown[0].sharePercent).toBe(75);
    expect(catBreakdown[1].name).toBe('Alimentação');
    expect(catBreakdown[1].sharePercent).toBe(25);
    expect(catBreakdown[0].resolvedColor).not.toBe('#10B981');
    expect(catBreakdown[0].resolvedColor).not.toBe(catBreakdown[1].resolvedColor);

    // Beneficiary breakdown has distinct palette colors
    const benBreakdown = component.beneficiaryBreakdown();
    expect(benBreakdown).toHaveLength(2);
    expect(benBreakdown[0].resolvedColor).not.toBe(benBreakdown[1].resolvedColor);

    // KPIs & chart canvases rendered
    expect(fixture.nativeElement.querySelector('[data-testid="dashboard-open-budget-btn"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="chart-category"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="chart-beneficiary"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="chart-status"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('[data-testid="chart-evolution"]')).toBeTruthy();
    expect(fixture.nativeElement.innerHTML).not.toContain('emerald-');

    // Switch competence month
    await component.onBudgetChange('b-nov');
    expect(component.selectedBudgetId()).toBe('b-nov');
    expect(loadDetailSpy).toHaveBeenCalledWith('b-nov');
  });
});
