import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Transaction } from '../../core/models/api.models';
import { ZConfirmService } from '../../shared/ui';
import { CatalogStoreService } from '../catalog/catalog-store.service';
import { BudgetDetailPageComponent } from './budget-detail-page.component';
import { BudgetsStoreService } from './budgets-store.service';

describe('BudgetDetailPageComponent', () => {
  let fixture: import('@angular/core/testing').ComponentFixture<BudgetDetailPageComponent>;
  let component: BudgetDetailPageComponent;
  let store: BudgetsStoreService;
  let catalogStore: CatalogStoreService;
  let confirmService: ZConfirmService;

  const sampleTxn: Transaction = {
    id: 't1',
    monthlyBudgetId: 'b1',
    type: 'EXPENSE',
    description: 'Água',
    amount: 180,
    status: 'ESTIMATED',
    dueDate: '2026-11-20',
    paymentDate: null,
    notes: 'conta mensal',
    categoryId: 'c1',
    categoryName: 'Contas Básicas',
    categoryColor: '#0EA5E9',
    beneficiaryId: 'ben1',
    beneficiaryName: 'Família',
    sourceRecurringTransactionId: 'r1',
    installmentCurrent: 4,
    installmentTotal: 6,
    createdAt: '',
    updatedAt: '',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [BudgetDetailPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    fixture = TestBed.createComponent(BudgetDetailPageComponent);
    fixture.componentRef.setInput('id', 'b1');
    component = fixture.componentInstance;
    store = TestBed.inject(BudgetsStoreService);
    catalogStore = TestBed.inject(CatalogStoreService);
    confirmService = TestBed.inject(ZConfirmService);
  });

  it('should render summary, transactions and delegate actions to store', async () => {
    vi.spyOn(catalogStore, 'loadAll').mockResolvedValue();
    vi.spyOn(store, 'loadBudgetDetail').mockResolvedValue();
    fixture.detectChanges();

    store.currentDetail.set({
      id: 'b1',
      competenceMonth: '2026-11',
      summary: {
        plannedIncome: 6362.29,
        realizedIncome: 6362.29,
        plannedExpense: 1000,
        realizedExpense: 500,
        plannedBalance: 5362.29,
        realizedBalance: 5862.29,
      },
      statusCounts: { estimated: 1, pending: 0, settled: 1 },
      expensesByCategory: [],
      expensesByBeneficiary: [],
      createdAt: '',
      updatedAt: '',
    });
    store.transactions.set([sampleTxn]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Novembro 2026');
    expect(fixture.nativeElement.textContent).toContain('Água');
    expect(component.expensePaidPercent()).toBe(50);

    const filterSpy = vi.spyOn(store, 'updateFilters').mockResolvedValue();
    const resetSpy = vi.spyOn(store, 'resetFilters').mockResolvedValue();
    component.setTypeTab('EXPENSE');
    component.onFilterChange({ search: 'água' });
    component.clearFilters();
    expect(filterSpy).toHaveBeenCalledTimes(2);
    expect(resetSpy).toHaveBeenCalledWith('b1');

    const statusSpy = vi.spyOn(store, 'changeTransactionStatus').mockResolvedValue(sampleTxn);
    await component.toggleSettle(sampleTxn);
    expect(statusSpy).toHaveBeenCalledWith('b1', 't1', 'SETTLED');

    const createSpy = vi.spyOn(store, 'createTransaction').mockResolvedValue(sampleTxn);
    component.openCreateDrawer();
    fixture.detectChanges();
    await component.onTransactionSaved({
      type: 'EXPENSE',
      description: 'Aluguel',
      amount: 800,
      status: 'PENDING',
    });
    expect(createSpy).toHaveBeenCalled();

    const updateSpy = vi.spyOn(store, 'updateTransaction').mockResolvedValue(sampleTxn);
    component.openEditDrawer(sampleTxn);
    fixture.detectChanges();
    await component.onTransactionSaved({
      type: 'EXPENSE',
      description: 'Água Edit',
      amount: 190,
      status: 'PENDING',
    });
    expect(updateSpy).toHaveBeenCalled();

    const confirmEstSpy = vi.spyOn(store, 'confirmEstimate').mockResolvedValue(sampleTxn);
    component.openConfirmEstimate(sampleTxn);
    fixture.detectChanges();
    await component.onEstimateConfirmed({ amount: 195.64, targetStatus: 'PENDING' });
    expect(confirmEstSpy).toHaveBeenCalled();

    const confirmSpy = vi.spyOn(confirmService, 'confirm');
    component.confirmDeleteTransaction(sampleTxn);
    expect(confirmSpy).toHaveBeenCalled();
  });

  it('should not render embedded charts, provide shortcut to /dashboard, and render Status header and row tooltips without emerald classes', () => {
    vi.spyOn(catalogStore, 'loadAll').mockResolvedValue();
    vi.spyOn(store, 'loadBudgetDetail').mockResolvedValue();
    fixture.detectChanges();

    store.currentDetail.set({
      id: 'b1',
      competenceMonth: '2026-11',
      summary: {
        plannedIncome: 6362.29,
        realizedIncome: 6362.29,
        plannedExpense: 1000,
        realizedExpense: 500,
        plannedBalance: 5362.29,
        realizedBalance: 5862.29,
      },
      statusCounts: { estimated: 1, pending: 0, settled: 1 },
      expensesByCategory: [
        { id: 'c1', name: 'Contas Básicas', color: '#0284C7', plannedAmount: 180, realizedAmount: 0, count: 1 },
      ],
      expensesByBeneficiary: [
        { id: 'ben1', name: 'Família', color: null, plannedAmount: 180, realizedAmount: 0, count: 1 },
      ],
      createdAt: '',
      updatedAt: '',
    });

    const settledIncomeTxn: Transaction = {
      ...sampleTxn,
      id: 't2',
      type: 'INCOME',
      description: 'Salário',
      amount: 6362.29,
      status: 'SETTLED',
    };
    const pendingIncomeTxn: Transaction = {
      ...sampleTxn,
      id: 't3',
      type: 'INCOME',
      description: 'Bônus',
      amount: 500,
      status: 'PENDING',
    };

    store.transactions.set([sampleTxn, settledIncomeTxn, pendingIncomeTxn]);
    fixture.detectChanges();

    const hostEl: HTMLElement = fixture.nativeElement;

    // 1. Embedded <app-budget-charts> must not be present
    expect(hostEl.querySelector('app-budget-charts')).toBeNull();

    // 2. Shortcut button to /dashboard must be present
    const dashboardBtn: HTMLElement | null = hostEl.querySelector('[data-testid="open-dashboard-charts-btn"]');
    expect(dashboardBtn).toBeTruthy();
    expect(dashboardBtn?.textContent).toContain('Ver Gráficos no Dashboard');

    // 3. Status column header must render "Status" with info icon and tooltip, not "Status (1-clique)"
    expect(hostEl.textContent).not.toContain('Status (1-clique)');
    const statusHeader: HTMLElement | null = hostEl.querySelector('[data-testid="status-column-header"]');
    expect(statusHeader).toBeTruthy();
    expect(statusHeader?.textContent?.trim()).toBe('Status');
    expect(statusHeader?.querySelector('.pi-info-circle')).toBeTruthy();
    expect(statusHeader?.getAttribute('data-tooltip')).toContain(
      'Clique no status de qualquer lançamento para alternar'
    );

    // 4. Contextual tooltip on each row's status toggle button
    const toggleAgua: HTMLElement | null = hostEl.querySelector('[data-testid="toggle-status-Água"]');
    const toggleSalario: HTMLElement | null = hostEl.querySelector('[data-testid="toggle-status-Salário"]');
    const toggleBonus: HTMLElement | null = hostEl.querySelector('[data-testid="toggle-status-Bônus"]');

    expect(toggleAgua?.getAttribute('data-tooltip')).toBe('Clique para marcar como Pago');
    expect(toggleSalario?.getAttribute('data-tooltip')).toBe('Clique para reverter para Pendente');
    expect(toggleBonus?.getAttribute('data-tooltip')).toBe('Clique para marcar como Recebido');

    // 5. Table header uses bg-slate-100/80 for visual depth and zero emerald-* classes
    expect(hostEl.innerHTML).toContain('bg-slate-100/80');
    expect(hostEl.innerHTML).not.toContain('emerald-');
  });

  it('should place expense paid progress above KPI footer, anchor all three KPI footers with mt-auto, and enable search on category/beneficiary filters', () => {
    vi.spyOn(catalogStore, 'loadAll').mockResolvedValue();
    vi.spyOn(store, 'loadBudgetDetail').mockResolvedValue();

    catalogStore.categories.set([
      { id: 'c1', name: 'Moradia', type: 'EXPENSE', color: '#4F46E5', icon: null, active: true, createdAt: '', updatedAt: '' },
      { id: 'c2', name: 'Alimentação', type: 'EXPENSE', color: '#0284C7', icon: null, active: true, createdAt: '', updatedAt: '' },
    ]);
    catalogStore.beneficiaries.set([
      { id: 'b1', name: 'Família', active: true, createdAt: '', updatedAt: '' },
      { id: 'b2', name: 'Cônjuge', active: true, createdAt: '', updatedAt: '' },
    ]);

    store.currentDetail.set({
      id: 'b1',
      competenceMonth: '2026-11',
      summary: {
        plannedIncome: 6000,
        realizedIncome: 6000,
        plannedExpense: 2000,
        realizedExpense: 1500,
        plannedBalance: 4000,
        realizedBalance: 4500,
      },
      statusCounts: { estimated: 0, pending: 1, settled: 2 },
      expensesByCategory: [],
      expensesByBeneficiary: [],
      createdAt: '',
      updatedAt: '',
    });
    fixture.detectChanges();

    const hostEl: HTMLElement = fixture.nativeElement;

    const incomeFooter = hostEl.querySelector('[data-testid="kpi-footer-income"]') as HTMLElement;
    const expenseFooter = hostEl.querySelector('[data-testid="kpi-footer-expense"]') as HTMLElement;
    const balanceFooter = hostEl.querySelector('[data-testid="kpi-footer-balance"]') as HTMLElement;
    const progressEl = hostEl.querySelector('[data-testid="expense-paid-progress"]') as HTMLElement;

    expect(incomeFooter).toBeTruthy();
    expect(expenseFooter).toBeTruthy();
    expect(balanceFooter).toBeTruthy();
    expect(progressEl).toBeTruthy();

    expect(incomeFooter.className).toContain('mt-auto');
    expect(expenseFooter.className).toContain('mt-auto');
    expect(balanceFooter.className).toContain('mt-auto');

    // Progress bar must precede the expense footer in DOM order and render inline with percentage
    const relPos = progressEl.compareDocumentPosition(expenseFooter);
    expect(relPos & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(progressEl.className).toContain('flex');
    expect(progressEl.className).toContain('items-center');
    expect(progressEl.textContent).toContain('75% pago');

    // Status filter has no search input
    const statusTrigger = hostEl.querySelector('#filter-status') as HTMLButtonElement;
    statusTrigger.click();
    fixture.detectChanges();
    expect(hostEl.querySelector('[data-testid="z-select-search"]')).toBeNull();
    statusTrigger.click();
    fixture.detectChanges();

    // Category filter has search input and filters without accents
    const catTrigger = hostEl.querySelector('#filter-category') as HTMLButtonElement;
    catTrigger.click();
    fixture.detectChanges();
    const catSearch = hostEl.querySelector('[data-testid="z-select-search"]') as HTMLInputElement;
    expect(catSearch).toBeTruthy();
    catSearch.value = 'alimentacao';
    catSearch.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(hostEl.querySelectorAll('[role="option"]')).toHaveLength(1);
    catTrigger.click();
    fixture.detectChanges();

    // Beneficiary filter has search input
    const benTrigger = hostEl.querySelector('#filter-beneficiary') as HTMLButtonElement;
    benTrigger.click();
    fixture.detectChanges();
    expect(hostEl.querySelector('[data-testid="z-select-search"]')).toBeTruthy();
  });
});
